"""Gera a narração do roteiro com a Cartesia, bloco a bloco, e já escreve o rascunho da montagem.

Uso (na pasta do vídeo):
    python <skill>/scripts/narrar.py roteiro.md                       # narração inteira -> audio/narracao.wav
    python <skill>/scripts/narrar.py roteiro.md --capitulos 1         # só o primeiro capítulo (teste barato)
    python <skill>/scripts/narrar.py roteiro.md --amostra             # uma frase em build/amostra.wav, para ouvir a voz
    python <skill>/scripts/narrar.py --listar [--genero masculine]    # vozes pt-BR

Como a fala é gerada a partir do texto, o início de cada bloco é exato: não precisa transcrever.
Cada bloco fica em cache (build/voz/<hash>.wav); mudar uma frase refaz só aquele bloco.

Configuração opcional em narracao.json, na pasta do vídeo:
    {"voz": "<id>", "modelo": "sonic-3.6", "velocidade": 1.0, "pausa_bloco": 0.35, "pausa_capitulo": 0.9}
A chave vem de CARTESIA_API_KEY (variável de ambiente do usuário ou .env na pasta). Nunca imprima a chave.
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
import wave
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from alinhar import escrever_montagem, ler_roteiro, rascunho  # noqa: E402

API, VERSAO = "https://api.cartesia.ai", "2026-08-14"
PADRAO = {"voz": "b0f46533-d4bb-493f-a26f-a99e1f2e86e3",  # Heitor (pt-BR): a voz do canal Marvel (a Luana é a do Mentalidade)
          "modelo": "sonic-3.6", "velocidade": 1.0, "pausa_bloco": 0.35, "pausa_capitulo": 0.9}
SR = 48000


def chave_api():
    k = os.environ.get("CARTESIA_API_KEY", "")
    if not k and Path(".env").exists():
        for linha in Path(".env").read_text(encoding="utf-8").splitlines():
            if linha.strip().startswith("CARTESIA_API_KEY="):
                k = linha.split("=", 1)[1].strip().strip("\"'")
    if not k and sys.platform == "win32":  # criada com setx depois que este terminal abriu
        import winreg
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as h:
                k = winreg.QueryValueEx(h, "CARTESIA_API_KEY")[0]
        except OSError:
            pass
    if not k.strip():
        sys.exit("CARTESIA_API_KEY não encontrada (variável de ambiente ou .env na pasta).")
    return k.strip()


def chamar(metodo, caminho, chave, corpo=None, params=None):
    url = API + caminho + ("?" + urllib.parse.urlencode(params) if params else "")
    req = urllib.request.Request(url, method=metodo, data=json.dumps(corpo).encode() if corpo else None)
    req.add_header("Authorization", f"Bearer {chave}")
    req.add_header("Cartesia-Version", VERSAO)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"Cartesia respondeu {e.code} em {caminho}: {e.read().decode(errors='replace')[:500]}")


def falar(chave, cfg, texto, destino):
    corpo = {"model_id": cfg["modelo"], "transcript": texto, "voice": {"id": cfg["voz"]}, "language": "pt",
             "output_format": {"container": "wav", "encoding": "pcm_s16le", "sample_rate": SR},
             "generation_config": {"speed": cfg["velocidade"]}}
    destino.parent.mkdir(parents=True, exist_ok=True)
    tmp = destino.with_suffix(".tmp.wav")
    tmp.write_bytes(chamar("POST", "/tts/bytes", chave, corpo=corpo))
    # normaliza para mono 48 kHz s16 (o wav da API pode vir com cabeçalho de tamanho aberto)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", str(destino)], check=True)
    tmp.unlink()


def limpar(texto):
    return re.sub(r"\*\*(.+?)\*\*", r"\1", texto).replace("*", "").strip()


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    ap = argparse.ArgumentParser()
    ap.add_argument("roteiro", nargs="?")
    ap.add_argument("--capitulos", type=int, help="só os N primeiros capítulos")
    ap.add_argument("--amostra", action="store_true")
    ap.add_argument("--listar", action="store_true")
    ap.add_argument("--genero", default="masculine")
    ap.add_argument("--saida", default="audio/narracao.wav")
    ap.add_argument("--refazer-montagem", action="store_true")
    a = ap.parse_args()
    cfg = dict(PADRAO)
    if Path("narracao.json").exists():
        cfg.update(json.loads(Path("narracao.json").read_text(encoding="utf-8")))
    chave = chave_api()
    if a.listar:
        r = json.loads(chamar("GET", "/voices", chave, params={"language": "pt", "gender": a.genero, "limit": 100}))
        for v in r["data"]:
            print(f"{v['id']} | {v['name']} | {v.get('description', '')[:150]}")
        return
    if not a.roteiro:
        ap.error("informe o roteiro.md")
    blocos = ler_roteiro(a.roteiro)
    if a.capitulos:
        caps = list(dict.fromkeys(b["capitulo"] for b in blocos))[:a.capitulos]
        blocos = [b for b in blocos if b["capitulo"] in caps]
    if a.amostra:
        frase = re.split(r"(?<=[.!?])\s", limpar(next(b["texto"] for b in blocos if b["texto"])))[0]
        falar(chave, cfg, frase, Path("build/amostra.wav"))
        print("amostra:", Path("build/amostra.wav").resolve())
        return
    pedacos, t, cap_ant = [], 0.0, None
    for i, b in enumerate(blocos):
        if not b["texto"]:
            b["inicio"] = round(t, 3)  # marcação sem fala: entra junto com o próximo bloco
            continue
        txt = limpar(b["texto"])
        h = hashlib.md5(json.dumps([txt, cfg["voz"], cfg["modelo"], cfg["velocidade"]]).encode()).hexdigest()[:14]
        arq = Path("build/voz") / f"{h}.wav"
        if not arq.exists():
            print(f"  gerando bloco {i + 1}/{len(blocos)} ({len(txt)} caracteres)", flush=True)
            falar(chave, cfg, txt, arq)
        if cap_ant is not None:
            t += cfg["pausa_capitulo"] if b["capitulo"] != cap_ant else cfg["pausa_bloco"]
        with wave.open(str(arq)) as w:
            dur = w.getnframes() / w.getframerate()
        b["inicio"] = round(t, 3)
        pedacos.append((t, arq))
        t += dur
        cap_ant = b["capitulo"]
    # junta tudo em um wav só, com as pausas
    total = int((t + 0.5) * SR)
    buf = bytearray(total * 2)
    for ini, arq in pedacos:
        with wave.open(str(arq)) as w:
            dados = w.readframes(w.getnframes())
        o = int(ini * SR) * 2
        buf[o:o + len(dados)] = dados[:len(buf) - o]
    saida = Path(a.saida); saida.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(saida), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(bytes(buf))
    Path("build/blocos.json").write_text(json.dumps(blocos, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"narração: {saida.resolve()} ({t / 60:.1f} min, {len(pedacos)} blocos)")
    escrever_montagem(rascunho(blocos, t + 0.5), saida, a.refazer_montagem)


if __name__ == "__main__":
    sys.exit(main())
