"""Alinha o roteiro com a narração gravada e escreve um rascunho de montagem.

Uso (na pasta do vídeo):
    python <skill>/scripts/alinhar.py roteiro.md audio/narracao.wav [--modelo small] [--refazer-montagem]

Gera:
    build/transcricao.json   palavras da narração com tempos (faster-whisper, CPU; fica em cache)
    build/blocos.json        cada bloco do roteiro (marcações + fala) com início e fim na narração
    montagem.json            rascunho da linha do tempo (só se ainda não existir, ou com --refazer-montagem)

O rascunho divide o tempo de cada bloco entre as marcações dele:
    [IMG pasta-N]  -> imagens/<pasta>/<pasta-N>.jpg|png
    [CENA nn]      -> o trailer em cenas/ que começa com nn; a entrada é escolhida nos cortes do trailer
    [IMG: texto] ou [CENA: texto] (descrição, material ainda não baixado) -> plano "pendente"
"""
import argparse
import difflib
import json
import math
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

CORTE_MIN = 1.2  # plano mínimo do trailer usado como entrada (s)


def norm(p):
    p = unicodedata.normalize("NFD", p.lower())
    p = "".join(c for c in p if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", p)


def tokens(texto):
    return [t for t in (norm(w) for w in texto.split()) if t]


MARCA = re.compile(r"\[(IMG|CENA)(?::\s*|\s+)([^\]]+)\]")


def ler_roteiro(caminho):
    """Lista de blocos {capitulo, marcas: [(tipo, valor)], nota, texto}."""
    blocos, cap, atual = [], None, None
    for linha in Path(caminho).read_text(encoding="utf-8").splitlines():
        s = linha.strip()
        m = re.match(r"^##\s+(?:\d+:\d+\s*·\s*)?(.+)$", s)
        if m:
            cap, atual = m.group(1).strip(), None
            continue
        if cap is None or not s or s == "---" or s.startswith("#") or s.startswith("```") or s.startswith("*("):
            continue
        marcas = MARCA.findall(s)
        if marcas:
            nota = MARCA.sub("", s).replace("`", "").replace("→", " ").strip(" /")
            atual = {"capitulo": cap, "marcas": [(t, v.strip()) for t, v in marcas], "nota": nota, "texto": ""}
            blocos.append(atual)
            continue
        if atual is None or atual["capitulo"] != cap:
            atual = {"capitulo": cap, "marcas": [], "nota": "", "texto": ""}
            blocos.append(atual)
        atual["texto"] = (atual["texto"] + " " + s).strip()
    return [b for b in blocos if b["texto"] or b["marcas"]]


def transcrever(audio, modelo, cache):
    if cache.exists() and json.loads(cache.read_text(encoding="utf-8")).get("audio") == str(audio):
        return json.loads(cache.read_text(encoding="utf-8"))
    from faster_whisper import WhisperModel
    print(f"transcrevendo {audio} (modelo {modelo}, CPU)...", flush=True)
    wm = WhisperModel(modelo, device="cpu", compute_type="int8")  # a GPU daqui não tem o cuBLAS; CPU é seguro
    import numpy as np  # decodifica com ffmpeg: o av que vem com o faster-whisper às vezes não abre o arquivo
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(audio), "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    amostras = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
    segs, info = wm.transcribe(amostras, language="pt", word_timestamps=True, vad_filter=True)
    palavras = [{"p": w.word.strip(), "a": round(w.start, 3), "b": round(w.end, 3)} for s in segs for w in s.words]
    dados = {"audio": str(audio), "duracao": round(info.duration, 3), "palavras": palavras}
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(dados, ensure_ascii=False), encoding="utf-8")
    return dados


def alinhar(blocos, trans):
    """Dá a cada bloco o instante em que sua fala começa na narração (None se não foi lido)."""
    tr = [(norm(w["p"]), w["a"], w["b"]) for w in trans["palavras"]]
    tr = [x for x in tr if x[0]]
    rot, dono = [], []
    for i, b in enumerate(blocos):
        for t in tokens(b["texto"]):
            rot.append(t); dono.append(i)
    sm = difflib.SequenceMatcher(None, rot, [x[0] for x in tr], autojunk=False)
    tempo = {}
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            tempo[a + k] = (tr[b + k][1], tr[b + k][2])
    for i, bl in enumerate(blocos):
        idx = [k for k, d in enumerate(dono) if d == i]
        casados = [k for k in idx if k in tempo]
        bl["casadas"] = f"{len(casados)}/{len(idx)}"
        if not idx or len(casados) < max(2, 0.3 * len(idx)):
            bl["inicio"] = bl["fim_fala"] = None
            continue
        k0 = casados[0]
        # palavras do começo que não casaram: recua ~0,35 s por palavra
        bl["inicio"] = round(max(0.0, tempo[k0][0] - 0.35 * (k0 - idx[0])), 2)
        bl["fim_fala"] = tempo[casados[-1]][1]
    return blocos


def cortes_do_trailer(arq, cache_dir):
    c = cache_dir / (Path(arq).stem + ".json")
    if c.exists():
        return json.loads(c.read_text(encoding="utf-8"))
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arq],
                               capture_output=True, text=True).stdout.strip() or 0)
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", arq, "-vf", "select='gt(scene,0.3)',showinfo", "-an", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    ts = [0.0] + [float(x) for x in re.findall(r"pts_time:([\d.]+)", r.stderr)] + [dur]
    dados = {"duracao": dur, "cortes": ts}
    c.parent.mkdir(parents=True, exist_ok=True)
    c.write_text(json.dumps(dados), encoding="utf-8")
    return dados


def achar_img(valor):
    pasta = re.sub(r"-\d+$", "", valor)
    for ext in (".jpg", ".png", ".jpeg", ".webp"):
        for p in (Path("imagens") / pasta / (valor + ext), Path("imagens") / (valor + ext)):
            if p.exists():
                return p.as_posix()
    achados = list(Path("imagens").rglob(valor + ".*"))
    return achados[0].as_posix() if achados else None


def achar_cena(valor):
    if not re.fullmatch(r"[\w]{1,4}", valor):
        return None
    for p in sorted(Path("cenas").glob("*")):
        if p.suffix.lower() in (".mp4", ".mkv", ".webm") and re.match(rf"^{re.escape(valor)}(\b|[ _-])", p.name, re.I):
            return p.as_posix()
    return None


MAX_PLANO = 5.0  # plano mais longo que isso é dividido (outra imagem da pasta ou o próximo corte do trailer)


def imagens_irmas(arq):
    pasta = Path(arq).parent
    outras = sorted(p.as_posix() for p in pasta.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp") and p.as_posix() != arq)
    return [arq] + outras


def entrada_trailer(arq, dur_plano, cursor):
    info = cortes_do_trailer(arq, Path("build/cortes"))
    d, cs = info["duracao"], info["cortes"]
    lo = max(cursor.get(arq, 0.0), d * 0.08)  # pula logos do começo
    if lo + dur_plano > d * 0.9:  # o trailer acabou: recomeça
        lo = d * 0.08
    cand = [c for j, c in enumerate(cs[:-1]) if c >= lo and c + dur_plano <= d * 0.9 and cs[j + 1] - c >= CORTE_MIN]
    ent = cand[0] if cand else lo
    ent = round(min(ent + 0.05, max(0.0, d - dur_plano)), 2)
    cursor[arq] = ent + dur_plano
    return ent


def rascunho(blocos, duracao):
    """Linha do tempo inicial a partir dos blocos com "inicio" (segundos na narração)."""
    planos, cursor, caps_vistos, uso_img = [], {}, set(), {}
    vivos = [b for b in blocos if b.get("inicio") is not None]
    for i, b in enumerate(vivos):
        ini = 0.0 if i == 0 else b["inicio"]
        fim = vivos[i + 1]["inicio"] if i + 1 < len(vivos) else duracao
        if fim - ini < 0.3:
            continue
        cap = b["capitulo"].upper()
        if cap not in caps_vistos:  # cada capítulo abre num cartão branco com uma imagem e o título
            caps_vistos.add(cap)
            img0 = next((achar_img(v) for bb in vivos if bb["capitulo"].upper() == cap for t, v in bb["marcas"] if t == "IMG" and achar_img(v)), None)
            dc = min(2.2, (fim - ini) * 0.5)
            planos.append({"inicio": round(ini, 2), "fim": round(ini + dc, 2), "capitulo": cap, "cartao": img0})
            ini += dc
        marcas = b["marcas"]
        if not marcas:  # fala sem marcação: repete a última marcação do capítulo
            ant = next((bb["marcas"] for bb in reversed(vivos[:i]) if bb["capitulo"] == b["capitulo"] and bb["marcas"]), None)
            if not ant:
                if planos:
                    planos[-1]["fim"] = round(fim, 2)
                continue
            marcas = ant[-1:]
        rot = re.findall(r"\*\*(.+?)\*\*", b["texto"])
        passo = (fim - ini) / len(marcas)
        for k, (tipo, valor) in enumerate(marcas):
            a, z = ini + k * passo, ini + (k + 1) * passo
            arq = achar_img(valor) if tipo == "IMG" else achar_cena(valor)
            n = 1 if not arq else max(1, math.ceil((z - a) / MAX_PLANO - 1e-9))
            for j in range(n):
                a2, z2 = a + (z - a) * j / n, a + (z - a) * (j + 1) / n
                p = {"inicio": round(a2, 2), "fim": round(z2, 2), "capitulo": cap}
                if not arq:
                    p["pendente"] = f"{tipo}: {valor}"
                elif tipo == "IMG":
                    lista = imagens_irmas(arq)
                    p["img"] = lista[0] if j == 0 else lista[(uso_img.get(arq, 0) + j) % len(lista)]
                else:
                    p["cena"], p["entrada"] = arq, entrada_trailer(arq, z2 - a2, cursor)
                if k == 0 and j == 0 and rot:
                    p["rotulo"] = rot[0].upper()
                if b["nota"] and j == 0:
                    p["nota"] = b["nota"]
                planos.append(p)
            if tipo == "IMG" and arq:
                uso_img[arq] = uso_img.get(arq, 0) + n
    return planos


def escrever_montagem(planos, audio, refazer=False):
    m = Path("montagem.json")
    if m.exists() and not refazer:
        print("montagem.json já existe; não mexi (use --refazer-montagem para recriar o rascunho).")
        return
    pend = sum(1 for p in planos if "pendente" in p)
    m.write_text(json.dumps({"audio": Path(audio).as_posix(), "saida": f"saida/{Path.cwd().name}.mp4", "musica": None,
                             "volume_musica": 0.08, "planos": planos}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"montagem.json: {len(planos)} planos, {pend} pendentes (material ainda não baixado).")


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    ap = argparse.ArgumentParser()
    ap.add_argument("roteiro"); ap.add_argument("audio")
    ap.add_argument("--modelo", default="small")
    ap.add_argument("--refazer-montagem", action="store_true")
    a = ap.parse_args()
    blocos = ler_roteiro(a.roteiro)
    trans = transcrever(a.audio, a.modelo, Path("build/transcricao.json"))
    alinhar(blocos, trans)
    Path("build").mkdir(exist_ok=True)
    Path("build/blocos.json").write_text(json.dumps(blocos, ensure_ascii=False, indent=1), encoding="utf-8")
    lidos = [b for b in blocos if b["inicio"] is not None]
    print(f"narração: {trans['duracao']:.1f} s; blocos do roteiro: {len(blocos)}, encontrados na fala: {len(lidos)}")
    for b in blocos:
        t = "  --  " if b["inicio"] is None else f"{b['inicio']:6.1f}"
        print(f"  {t}  {b['casadas']:>7}  {b['capitulo'][:22]:22}  {' '.join(v for _, v in b['marcas'])[:50]}")
    escrever_montagem(rascunho(blocos, trans["duracao"]), a.audio, a.refazer_montagem)

if __name__ == "__main__":
    sys.exit(main())
