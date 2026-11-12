"""Cria a pasta de um vídeo novo do canal (horizontal, voz em espanhol) e confere as dependências.

    python <skill>/scripts/novo_projeto.py E:/Projetos/bitacora-de-vuelo/<slug> [--voz es-MX-JorgeNeural]

Usa o motor da skill recriar-video-tiktok (pasta irmã desta): é ela que traz motor.js, index.html,
a voz, a trilha e o render. Aqui entram só o que é do YouTube: cenas por bloco e o modelo de thumbnail.
Não sobrescreve roteiro.json, cenas/ nem thumb_*.html que já existam.
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from referencia_youtube import INSTALAR_WATCH, achar_watch

SKILL = Path(__file__).resolve().parent.parent
MOTOR = SKILL.parent / "recriar-video-tiktok"


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("pasta")
    ap.add_argument("--voz", default="es-MX-JorgeNeural")
    a = ap.parse_args()

    if not (MOTOR / "scripts" / "novo_projeto.py").exists():
        sys.exit(f"motor não encontrado em {MOTOR}. Esta skill precisa da recriar-video-tiktok na pasta ao lado.")

    destino = Path(a.pasta).resolve()
    (destino / "cenas").mkdir(parents=True, exist_ok=True)

    # o roteiro entra antes do motor, que só cria o dele quando não existe nenhum
    if not (destino / "roteiro.json").exists():
        roteiro = {"voz": a.voz, "velocidade": "+4%", "formato": "horizontal", "idioma": "es",
                   "referencia": "", "cenas": [{"id": "apertura", "bloco": "01_gancho", "texto": ""}]}
        (destino / "roteiro.json").write_text(json.dumps(roteiro, ensure_ascii=False, indent=2), encoding="utf-8")

    r = subprocess.run([sys.executable, str(MOTOR / "scripts" / "novo_projeto.py"), str(destino),
                        "--formato", "horizontal", "--voz", a.voz])

    for variante in ("a", "b"):
        thumb = destino / f"thumb_{variante}.html"
        if not thumb.exists():
            shutil.copy2(SKILL / "template" / "thumb.html", thumb)

    faltando = []
    if not shutil.which("yt-dlp"):
        faltando.append("yt-dlp: winget install --id yt-dlp.yt-dlp --exact")
    watch = achar_watch()
    print(f"watch: {watch}" if watch else INSTALAR_WATCH)
    if faltando:
        print("FALTANDO:\n  " + "\n  ".join(faltando))
    sys.exit(2 if (r.returncode or faltando or not watch) else 0)


if __name__ == "__main__":
    main()
