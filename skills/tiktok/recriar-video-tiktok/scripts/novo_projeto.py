"""Cria a pasta de um vídeo novo a partir do template da skill e confere as dependências.

    python <skill>/scripts/novo_projeto.py E:/Projetos/nome-do-video [--formato vertical] [--voz pt-BR-FranciscaNeural]

Não sobrescreve nada: se a pasta já tiver roteiro.json ou cenas.js, eles ficam como estão
(motor.js e index.html são sempre atualizados para a versão da skill).
"""
import argparse
import importlib.util
import json
import shutil
import subprocess
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
TEMPLATE = SKILL / "template"

CENAS_INICIAL = """// cenas.js — uma função por cena do roteiro.json (a chave é o "id").
// (lt, d, k): lt = tempo local em segundos, d = duração visual da cena, k = momento em que a fala acaba.
// Referência completa de estilo: <skill>/template/cenas_exemplo.js · API do motor: <skill>/references/motor.md
Motor.cenas((M) => {
  const { W, H, CX, CY, FLOOR, FONT, MONO, clamp, lerp, seg, eOut, eIn, eInOut, eBack, pop, rng, brl, wa,
    glow, noGlow, text, label, rrect, panel, pill, spotlight, pawn, xMark, check, icon, gear, digit, number2, chao } = M;
  let ctx; M.onCtx(c => (ctx = c));

  const CENAS = {
    // abertura(lt, d, k) { ... },
  };

  return CENAS;
});
"""


def checar_dependencias() -> list[str]:
    faltando = []
    for exe in ("ffmpeg", "ffprobe", "node"):
        if not shutil.which(exe):
            faltando.append(f"{exe} (não está no PATH)")
    for mod, pip in (("edge_tts", "edge-tts"), ("numpy", "numpy")):
        if importlib.util.find_spec(mod) is None:
            faltando.append(f"python: pip install {pip}")
    if not (SKILL / "node_modules" / "puppeteer-core").exists() and shutil.which("npm"):
        print("instalando puppeteer-core na pasta da skill...")
        subprocess.run("npm i --no-audit --no-fund", cwd=SKILL, shell=True, check=False)
    if not (SKILL / "node_modules" / "puppeteer-core").exists():
        faltando.append(f"puppeteer-core: rode `npm i` em {SKILL}")
    return faltando


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("pasta")
    ap.add_argument("--formato", choices=["horizontal", "vertical"], default="horizontal")
    ap.add_argument("--voz", default="pt-BR-AntonioNeural")
    a = ap.parse_args()

    destino = Path(a.pasta).resolve()
    for sub in ("build", "saida", "referencia", ".claude"):
        (destino / sub).mkdir(parents=True, exist_ok=True)

    for nome in ("index.html", "motor.js"):
        shutil.copy2(TEMPLATE / nome, destino / nome)
    if not (destino / "cenas.js").exists():
        (destino / "cenas.js").write_text(CENAS_INICIAL, encoding="utf-8")
    if not (destino / "roteiro.json").exists():
        roteiro = {"voz": a.voz, "velocidade": "+6%", "formato": a.formato,
                   "referencia": "", "cenas": [{"id": "abertura", "texto": ""}]}
        (destino / "roteiro.json").write_text(json.dumps(roteiro, ensure_ascii=False, indent=2), encoding="utf-8")
    launch = destino / ".claude" / "launch.json"
    if not launch.exists():
        launch.write_text(json.dumps({"version": "0.0.1", "configurations": [{
            "name": "preview", "runtimeExecutable": "python",
            "runtimeArgs": ["-m", "http.server", "8765", "--bind", "127.0.0.1"], "port": 8765}]}, indent=2),
            encoding="utf-8")

    faltando = checar_dependencias()
    print(f"projeto pronto em {destino}")
    if faltando:
        print("FALTANDO:\n  " + "\n  ".join(faltando))
        sys.exit(2)


if __name__ == "__main__":
    main()
