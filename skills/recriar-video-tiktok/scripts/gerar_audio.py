"""Gera a narração cena a cena (edge-tts) e escreve timeline.js, build/narracao.wav e legendas.srt.

Rode dentro da pasta do projeto (ou passe --projeto CAMINHO):
    python <skill>/scripts/gerar_audio.py [--force]

Lê roteiro.json:
{
  "voz": "pt-BR-AntonioNeural", "velocidade": "+6%", "formato": "horizontal" | "vertical",
  "cenas": [ {"id": "abertura", "texto": "..."}, {"id": "final", "texto": "...", "continua": true} ]
}
Campos extras de cada cena (ex.: "continua") são repassados para a timeline.
Só regenera o mp3 de uma cena quando o texto, a voz ou a velocidade mudam (cache por hash).
"""
import argparse
import asyncio
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import edge_tts

INTRO = 0.35   # silêncio antes da primeira fala
GAP = 0.45     # respiro entre cenas
OUTRO = 3.4    # tempo final depois da última fala (cartão de fechamento)


def duracao(arquivo: Path) -> float:
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
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
    a = ap.parse_args()
    raiz = Path(a.projeto).resolve()
    audio = raiz / "build" / "audio"
    audio.mkdir(parents=True, exist_ok=True)

    roteiro = json.loads((raiz / "roteiro.json").read_text(encoding="utf-8"))
    voz, vel = roteiro.get("voz", "pt-BR-AntonioNeural"), roteiro.get("velocidade", "+6%")
    cenas = roteiro["cenas"]
    ids = [c["id"] for c in cenas]
    if len(set(ids)) != len(ids):
        sys.exit(f"ids repetidos no roteiro: {ids}")

    t = INTRO
    timeline = []
    for i, cena in enumerate(cenas):
        chave = hashlib.sha1(f"{voz}|{vel}|{cena['texto']}".encode()).hexdigest()[:10]
        mp3 = audio / f"{i:02d}_{cena['id']}_{chave}.mp3"
        wav = audio / f"{i:02d}_{cena['id']}.wav"
        if a.force or not mp3.exists() or mp3.stat().st_size == 0:
            asyncio.run(edge_tts.Communicate(cena["texto"], voz, rate=vel).save(str(mp3)))
            print(f"  voz: {cena['id']}")
        # wav 48k mono sem silêncio nas pontas
        subprocess.check_call([
            "ffmpeg", "-y", "-v", "error", "-i", str(mp3),
            "-af", "silenceremove=start_periods=1:start_threshold=-50dB,"
                   "areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse",
            "-ar", "48000", "-ac", "1", str(wav)])
        d = duracao(wav)
        item = {k: v for k, v in cena.items()}
        item.update({"inicio": round(t, 3), "fala": round(d, 3)})
        timeline.append(item)
        t = t + d + GAP
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
        "// gerado por gerar_audio.py — não edite à mão\nwindow.TIMELINE = "
        + json.dumps(dados, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")

    srt = [f"{i}\n{ts(c['inicio'])} --> {ts(c['inicio'] + c['fala'])}\n{c['texto']}\n"
           for i, c in enumerate(timeline, 1)]
    (raiz / "legendas.srt").write_text("\n".join(srt), encoding="utf-8")

    print(f"total: {total:.2f}s - {len(timeline)} cenas")
    for c in timeline:
        print(f"  {c['id']:<16} {c['inicio']:6.2f}s  fala {c['fala']:5.2f}s  cena {c['fim'] - c['inicio']:5.2f}s")


if __name__ == "__main__":
    main()
