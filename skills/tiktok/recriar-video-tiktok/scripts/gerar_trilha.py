"""Sintetiza uma trilha ambiente (pad + pulso suave + blips nas viradas de cena)
e mixa com a narração em build/trilha_final.wav.

Rode dentro da pasta do projeto, depois de gerar_audio.py:
    python <skill>/scripts/gerar_trilha.py [--projeto CAMINHO] [--sem-blips] [--musica 0.16]
"""
import argparse
import json
import re
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 48000
_ap = argparse.ArgumentParser()
_ap.add_argument("--projeto", default=".")
_ap.add_argument("--sem-blips", action="store_true")
_ap.add_argument("--musica", type=float, default=0.16, help="volume do pad (0.16 padrao)")
ARGS = _ap.parse_args()
RAIZ = Path(ARGS.projeto).resolve()


def carregar_timeline() -> dict:
    txt = (RAIZ / "timeline.js").read_text(encoding="utf-8")
    return json.loads(re.search(r"=\s*(\{.*\});", txt, re.S).group(1))


def nota(f: float, t: np.ndarray) -> np.ndarray:
    # leve desafinação entre duas senoides dá um pad mais "vivo"
    return np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.003 * t + 1.3)


def main() -> None:
    tl = carregar_timeline()
    total = tl["total"]
    n = int(total * SR)
    t = np.arange(n) / SR

    # progressão Am - F - C - G, 4s por acorde, com crossfade
    acordes = [
        [110.00, 164.81, 220.00, 261.63, 329.63],
        [87.31, 130.81, 174.61, 220.00, 261.63],
        [65.41, 130.81, 196.00, 261.63, 329.63],
        [98.00, 146.83, 196.00, 246.94, 293.66],
    ]
    dur = 4.0
    pad = np.zeros(n)
    for k in range(int(total / dur) + 2):
        ac = acordes[k % 4]
        ini = k * dur
        env = np.clip(1 - np.abs((t - ini - dur / 2) / (dur * 0.75)), 0, 1) ** 1.5
        mask = env > 0
        if not mask.any():
            continue
        s = sum(nota(f, t[mask]) * (0.9 ** j) for j, f in enumerate(ac))
        pad[mask] += s * env[mask]
    pad /= np.max(np.abs(pad)) + 1e-9
    pad *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.11 * t)  # respiração lenta

    # filtro passa-baixa simples (média móvel exponencial)
    k = np.exp(-np.arange(256) * 0.0619) * 0.06  # resposta ao impulso do passa-baixa
    filt = np.convolve(pad, k)[:n]
    pad = filt / (np.max(np.abs(filt)) + 1e-9)

    # pulso grave a cada batida (~ 75 bpm)
    bpm = 75
    beat = 60 / bpm
    fase = (t % beat)
    kick = np.sin(2 * np.pi * (55 * fase + 40 * (1 - np.exp(-fase * 30)) / 30)) * np.exp(-fase * 9)

    # blips nas viradas de cena
    blips = np.zeros(n)
    for c in tl["cenas"][1:]:
        i0 = int(c["inicio"] * SR) - int(0.08 * SR)
        m = int(0.35 * SR)
        if i0 < 0 or i0 + m > n:
            continue
        tt = np.arange(m) / SR
        blips[i0:i0 + m] += (np.sin(2 * np.pi * 1320 * tt) * 0.5 + np.sin(2 * np.pi * 880 * tt)) * np.exp(-tt * 18)

    musica = ARGS.musica * pad + 0.07 * kick + (0 if ARGS.sem_blips else 0.05) * blips
    # fade in / out
    fi, fo = int(1.0 * SR), int(2.5 * SR)
    musica[:fi] *= np.linspace(0, 1, fi)
    musica[-fo:] *= np.linspace(1, 0, fo)

    with wave.open(str(RAIZ / "build" / "musica.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(musica, -1, 1) * 32767).astype(np.int16).tobytes())

    # mix: narração com leve compressão + música com ducking
    subprocess.check_call([
        "ffmpeg", "-y", "-v", "error",
        "-i", str(RAIZ / "build" / "narracao.wav"),
        "-i", str(RAIZ / "build" / "musica.wav"),
        "-filter_complex",
        "[0]acompressor=threshold=-20dB:ratio=3:attack=5:release=120,volume=1.6,asplit=2[voz][sc];"
        "[1][sc]sidechaincompress=threshold=0.03:ratio=4:attack=20:release=400[mus];"
        "[voz][mus]amix=inputs=2:normalize=0,alimiter=limit=0.95,loudnorm=I=-15:TP=-1.5:LRA=9[out]",
        "-map", "[out]", "-ar", "48000", "-ac", "2", str(RAIZ / "build" / "trilha_final.wav"),
    ])
    print("ok: build/trilha_final.wav")


if __name__ == "__main__":
    main()
