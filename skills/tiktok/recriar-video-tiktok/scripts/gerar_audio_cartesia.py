"""Narração com a Cartesia (Sonic): a voz padrão do canal é a Luana. Gera os mesmos arquivos que o
gerar_audio.py (edge-tts, que fica de reserva): build/audio/*.wav, build/narracao.wav, timeline.js e legendas.srt.

Rode dentro da pasta do projeto:
    python gerar_audio_cartesia.py --listar                 # vozes femininas pt-BR disponíveis
    python gerar_audio_cartesia.py --amostra ID_DA_VOZ      # build/amostras/<id>.wav
    python gerar_audio_cartesia.py [--force]                # narração completa

A chave vem da variável de ambiente CARTESIA_API_KEY (ou de um arquivo .env nesta pasta).
Campos lidos do roteiro.json:
    "cartesia": {"voz": "<id>", "modelo": "sonic-3.6", "velocidade": 1.0, "idioma": "pt", "emocao": null}
    cada cena pode ter "emocao" própria (ex.: "determined"); sem ela, o modelo infere pelo texto.
"""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://api.cartesia.ai"
VERSAO = "2026-08-14"
INTRO, GAP, OUTRO = 0.35, 0.45, 3.4
LUANA = "700d1ee3-a641-4018-ba6e-899dcadc9e2b"   # iguais aos do gerar_audio.py da skill


def chave_api(raiz: Path) -> str:
    k = os.environ.get("CARTESIA_API_KEY", "")
    env = raiz / ".env"
    if not k and env.exists():
        for linha in env.read_text(encoding="utf-8").splitlines():
            if linha.strip().startswith("CARTESIA_API_KEY="):
                k = linha.split("=", 1)[1].strip().strip('"').strip("'")
    if not k and sys.platform == "win32":   # variável criada com setx depois que este terminal abriu
        import winreg
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as h:
                k = winreg.QueryValueEx(h, "CARTESIA_API_KEY")[0]
        except OSError:
            pass
    if not k.strip():
        sys.exit("CARTESIA_API_KEY não encontrada (variável de ambiente ou arquivo .env nesta pasta).")
    return k.strip()


def chamar(metodo: str, caminho: str, chave: str, corpo=None, params=None) -> bytes:
    url = API + caminho + ("?" + urllib.parse.urlencode(params, doseq=True) if params else "")
    req = urllib.request.Request(url, method=metodo, data=json.dumps(corpo).encode() if corpo else None)
    req.add_header("Authorization", f"Bearer {chave}")
    req.add_header("Cartesia-Version", VERSAO)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"Cartesia respondeu {e.code} em {caminho}: {e.read().decode(errors='replace')[:600]}")


def listar(chave: str, idioma: str, genero: str) -> None:
    cursor, total = None, 0
    while True:
        params = {"language": idioma, "gender": genero, "limit": 100}
        if cursor:
            params["starting_after"] = cursor
        r = json.loads(chamar("GET", "/voices", chave, params=params))
        for v in r["data"]:
            total += 1
            acentos = ",".join(a.get("locale", "") + ("*" if a.get("is_native") else "") for a in v.get("accents") or [])
            print(f"{v['id']} | {v['name']} | {v.get('tagline', '')} | {acentos} | {v.get('description', '')[:260]}")
        if not r.get("has_more"):
            break
        cursor = r.get("next_page")
    print(f"{total} vozes")


def falar(chave: str, cfg: dict, texto: str, emocao, destino: Path) -> None:
    gen = {"speed": cfg.get("velocidade", 1.0)}
    if emocao:
        gen["emotion"] = emocao
    corpo = {
        "model_id": cfg.get("modelo", "sonic-3.6"),
        "transcript": texto,
        "voice": {"id": cfg["voz"]},
        "language": cfg.get("idioma", "pt"),
        "output_format": {"container": "wav", "encoding": "pcm_s16le", "sample_rate": 48000},
        "generation_config": gen,
    }
    destino.write_bytes(chamar("POST", "/tts/bytes", chave, corpo=corpo))


def duracao(arquivo: Path) -> float:
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                   "-of", "default=nw=1:nk=1", str(arquivo)])
    return float(out.strip())


def ts(x: float) -> str:
    ms = int(round(x * 1000))
    h, ms = divmod(ms, 3_600_000); m, ms = divmod(ms, 60_000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--projeto", default=".")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--listar", action="store_true")
    ap.add_argument("--idioma", default="pt-BR")
    ap.add_argument("--genero", default="feminine")
    ap.add_argument("--amostra", metavar="ID_DA_VOZ")
    ap.add_argument("--emocao", help="só para --amostra: força uma emoção (ex.: determined)")
    ap.add_argument("--texto", default="Quem mais quebra a cara hoje é quem tem mais chance de dar certo amanhã. "
                                       "O erro só vira prejuízo no dia em que você desiste.")
    a = ap.parse_args()
    raiz = Path(a.projeto).resolve()
    chave = chave_api(raiz)

    if a.listar:
        return listar(chave, a.idioma, a.genero)

    roteiro = json.loads((raiz / "roteiro.json").read_text(encoding="utf-8"))
    cfg = dict(roteiro.get("cartesia") or {})

    if a.amostra:
        pasta = raiz / "build" / "amostras"
        pasta.mkdir(parents=True, exist_ok=True)
        cfg["voz"] = a.amostra
        nome = a.amostra + (f"_{a.emocao}" if a.emocao else "") + ".wav"
        falar(chave, cfg, a.texto, a.emocao or cfg.get("emocao"), pasta / nome)
        return print(f"amostra: {pasta / nome}")

    if not cfg.get("voz"):  # padrão do canal: Luana (pt-BR), a voz escolhida pelo usuário
        cfg = {"voz": LUANA, "modelo": "sonic-3.6", "velocidade": 1.1, "idioma": "pt", **cfg}
    audio = raiz / "build" / "audio"
    audio.mkdir(parents=True, exist_ok=True)
    cenas = roteiro["cenas"]

    t, timeline = INTRO, []
    for i, cena in enumerate(cenas):
        emocao = cena.get("emocao", cfg.get("emocao"))
        assinatura = f"cartesia|{cfg['voz']}|{cfg.get('modelo')}|{cfg.get('velocidade')}|{cfg.get('idioma')}|{emocao}|{cena['texto']}"
        bruto = audio / f"{i:02d}_{cena['id']}_{hashlib.sha1(assinatura.encode()).hexdigest()[:10]}.cartesia.wav"
        wav = audio / f"{i:02d}_{cena['id']}.wav"
        if a.force or not bruto.exists() or bruto.stat().st_size == 0:
            falar(chave, cfg, cena["texto"], emocao, bruto)
            print(f"  voz: {cena['id']}")
        subprocess.check_call([
            "ffmpeg", "-y", "-v", "error", "-i", str(bruto),
            "-af", "silenceremove=start_periods=1:start_threshold=-50dB,"
                   "areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse",
            "-ar", "48000", "-ac", "1", str(wav)])
        d = duracao(wav)
        item = dict(cena)
        item.update({"inicio": round(t, 3), "fala": round(d, 3)})
        timeline.append(item)
        t += d + GAP
    total = t - GAP + OUTRO
    for i, c in enumerate(timeline):
        c["fim"] = round(timeline[i + 1]["inicio"] if i + 1 < len(timeline) else total, 3)

    entradas, filtros = [], []
    for i, c in enumerate(timeline):
        entradas += ["-i", str(audio / f"{i:02d}_{c['id']}.wav")]
        ms = int(c["inicio"] * 1000)
        filtros.append(f"[{i}]adelay={ms}|{ms}[a{i}]")
    mix = "".join(f"[a{i}]" for i in range(len(timeline)))
    filtros.append(f"{mix}amix=inputs={len(timeline)}:normalize=0,apad=whole_dur={total}[out]")
    subprocess.check_call([
        "ffmpeg", "-y", "-v", "error", *entradas, "-filter_complex", ";".join(filtros),
        "-map", "[out]", "-ar", "48000", "-ac", "1", str(raiz / "build" / "narracao.wav")])

    dados = {"total": round(total, 3), "formato": roteiro.get("formato", "horizontal"), "cenas": timeline}
    (raiz / "timeline.js").write_text(
        "// gerado por gerar_audio_cartesia.py — não edite à mão\nwindow.TIMELINE = "
        + json.dumps(dados, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    srt = [f"{i}\n{ts(c['inicio'])} --> {ts(c['inicio'] + c['fala'])}\n{c['texto']}\n"
           for i, c in enumerate(timeline, 1)]
    (raiz / "legendas.srt").write_text("\n".join(srt), encoding="utf-8")

    print(f"total: {total:.2f}s - {len(timeline)} cenas")
    for c in timeline:
        print(f"  {c['id']:<16} {c['inicio']:6.2f}s  fala {c['fala']:5.2f}s  cena {c['fim'] - c['inicio']:5.2f}s")


if __name__ == "__main__":
    main()
