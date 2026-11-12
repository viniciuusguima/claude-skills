"""Cria a pasta de um vídeo novo de um canal (horizontal, na língua do projeto) e confere as dependências.

    python <skill>/scripts/novo_projeto.py E:/Projetos/<canal>/<slug> --canal <canal> --idioma es --voz es-MX-JorgeNeural

--canal, --idioma e --voz são obrigatórios: não há canal nem língua padrão. --canal é o slug do perfil em
criar-canal/canais/<canal>.md; a língua e a voz saem de references/linguas.md (ou da exceção do perfil).

Usa o motor da skill recriar-video-tiktok: é ela que traz motor.js, index.html,
a voz, a trilha e o render. Aqui entram só o que é do YouTube: cenas por bloco e o modelo de thumbnail.
Não sobrescreve roteiro.json, cenas/ nem thumb_*.html que já existam.
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from referencia_youtube import INSTALAR_WATCH, achar_motor, achar_watch

SKILL = Path(__file__).resolve().parent.parent


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("pasta")
    ap.add_argument("--canal", required=True, help="slug do perfil do canal (criar-canal/canais/<slug>.md)")
    ap.add_argument("--idioma", required=True, help="código da língua do projeto (es, pt, en...), de references/linguas.md")
    ap.add_argument("--voz", required=True, help="voz do edge-tts da mesma linha de linguas.md (ex.: es-MX-JorgeNeural)")
    a = ap.parse_args()

    idioma = a.idioma.strip().lower()
    if not a.voz.lower().startswith(idioma + "-"):
        sys.exit(f"a voz {a.voz} não é da língua '{idioma}'. Use a voz da linha dessa língua em references/linguas.md.")

    MOTOR = achar_motor()
    if not MOTOR:
        sys.exit("motor não encontrado: esta skill precisa da recriar-video-tiktok instalada (veja o README do repositório).")

    perfil = SKILL.parent / "criar-canal" / "canais" / f"{a.canal}.md"
    if not perfil.exists():
        print(f"AVISO: perfil do canal não encontrado em {perfil}. Crie com /criar-canal antes de seguir.")

    destino = Path(a.pasta).resolve()
    (destino / "cenas").mkdir(parents=True, exist_ok=True)

    # o roteiro entra antes do motor, que só cria o dele quando não existe nenhum
    arq_roteiro = destino / "roteiro.json"
    if not arq_roteiro.exists():
        roteiro = {"canal": a.canal, "voz": a.voz, "velocidade": "+4%", "formato": "horizontal", "idioma": idioma,
                   "referencia": "", "cenas": [{"id": "apertura", "bloco": "01_gancho", "texto": ""}]}
        arq_roteiro.write_text(json.dumps(roteiro, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        atual = json.loads(arq_roteiro.read_text(encoding="utf-8-sig")).get("idioma")
        if atual != idioma:
            print(f"AVISO: roteiro.json já existe com idioma '{atual}', não '{idioma}'. Não foi alterado; "
                  "para trocar a língua, mude idioma e voz nele à mão.")

    r = subprocess.run([sys.executable, str(MOTOR / "scripts" / "novo_projeto.py"), str(destino),
                        "--formato", "horizontal", "--voz", a.voz])

    for variante in ("a", "b"):
        thumb = destino / f"thumb_{variante}.html"
        if not thumb.exists():
            modelo = (SKILL / "template" / "thumb.html").read_text(encoding="utf-8")
            thumb.write_text(modelo.replace('<html lang="es">', f'<html lang="{idioma}">', 1), encoding="utf-8")

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
