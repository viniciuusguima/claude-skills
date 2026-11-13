"""Junta os blocos de cenas (cenas/*.js) em cenas.js, o arquivo que o motor carrega.

    python <skill>/scripts/juntar_cenas.py --esqueleto   # cria cenas/<bloco>.js para cada bloco do roteiro
    python <skill>/scripts/juntar_cenas.py               # cenas/*.js -> cenas.js e lista as cenas que faltam
    python <skill>/scripts/juntar_cenas.py --estrito     # idem, e sai com erro se faltar alguma
    python <skill>/scripts/juntar_cenas.py --capitulos   # só imprime os capítulos do YouTube (tempo + título)

Cada cena do roteiro.json tem um campo "bloco" (ex.: "01_gancho"). Um bloco = um arquivo = uma etapa de animação,
então cada bloco pode ser escrito e conferido sem pisar nos outros. O arquivo de um bloco é:

    BLOCO((M) => {
      const { W, H, seg, text, ... } = M;
      let ctx; M.onCtx(c => (ctx = c));
      return { idDaCena(lt, d, k) { ... }, outraCena(lt, d, k) { ... } };
    });

Formas usadas por mais de um bloco ficam em cenas/00_comum.js, que roda primeiro e guarda as funções
em COMUM (ex.: COMUM.avion = (x, y, s, a) => {...}); os outros blocos chamam COMUM.avion(...) dentro das cenas.
"""
import argparse
import json
import re
import sys
from pathlib import Path

CABECALHO = """// cenas/{bloco}.js — bloco "{bloco}" do roteiro. Uma função por cena; a chave é o "id".
// (lt, d, k): lt = tempo local em segundos, d = duração visual da cena, k = momento em que a fala acaba.
// API do motor e regras de estilo: <motor>/references/motor.md · exemplo completo: <motor>/template/cenas_exemplo.js
BLOCO((M) => {{
  const {{ W, H, CX, CY, FLOOR, FONT, MONO, clamp, lerp, seg, eOut, eIn, eInOut, eBack, pop, rng, wa,
    glow, noGlow, text, label, rrect, panel, pill, spotlight, pawn, xMark, check, icon, gear, digit, number2, chao }} = M;
  let ctx; M.onCtx(c => (ctx = c));

  return {{
{cenas}
  }};
}});
"""

JUNTADO = """// gerado por juntar_cenas.py — não edite aqui; edite cenas/<bloco>.js e rode o script de novo
(() => {{
  const BLOCOS = [], COMUM = {{}};
  const BLOCO = f => BLOCOS.push(f);

{blocos}
  Motor.cenas(M => Object.assign({{}}, ...BLOCOS.map(f => f(M))));
}})();
"""

NOME_OK = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
BLOCO_OK = re.compile(r"^[A-Za-z0-9_-]+$")


def carregar_timeline(raiz: Path) -> dict:
    arq = raiz / "timeline.js"
    if not arq.exists():
        return {}
    txt = arq.read_text(encoding="utf-8")
    dados = json.loads(txt[txt.index("{"):txt.rindex("}") + 1])
    return {c["id"]: c for c in dados["cenas"]}


def capitulos(roteiro: dict, blocos: dict, tl: dict) -> None:
    """Lista de capítulos para a descrição: o tempo em que cada bloco começa + o título em roteiro["capitulos"]."""
    if not tl:
        sys.exit("timeline.js não encontrado. Rode gerar_audio.py antes.")
    titulos = roteiro.get("capitulos") or {}
    inicios = [(tl[cenas[0]["id"]]["inicio"], b) for b, cenas in blocos.items()]
    inicios[0] = (0.0, inicios[0][1])   # o YouTube exige o primeiro capítulo em 0:00
    for i, (t, b) in enumerate(inicios):
        s = int(t)
        print(f"{s // 60}:{s % 60:02d} {titulos.get(b) or re.sub(r'^[0-9]+[_-]', '', b).replace('_', ' ').capitalize()}")
        if i + 1 < len(inicios) and inicios[i + 1][0] - t < 10:
            print(f"  AVISO: capítulo com menos de 10 s (o YouTube ignora a lista inteira); junte \"{b}\" ao vizinho", file=sys.stderr)
    if len(inicios) < 3:
        print("  AVISO: o YouTube só mostra capítulos a partir de 3", file=sys.stderr)
    sem = [b for b in blocos if b not in titulos]
    if sem:
        print(f"  AVISO: sem título em roteiro[\"capitulos\"]: {', '.join(sem)}", file=sys.stderr)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--projeto", default=".")
    ap.add_argument("--esqueleto", action="store_true")
    ap.add_argument("--estrito", action="store_true")
    ap.add_argument("--capitulos", action="store_true")
    a = ap.parse_args()
    raiz = Path(a.projeto).resolve()
    pasta = raiz / "cenas"
    pasta.mkdir(exist_ok=True)

    roteiro = json.loads((raiz / "roteiro.json").read_text(encoding="utf-8-sig"))
    blocos: dict[str, list[dict]] = {}
    for c in roteiro["cenas"]:
        if not NOME_OK.match(c["id"]):
            sys.exit(f'id inválido no roteiro: "{c["id"]}" (use só letras sem acento, números e _)')
        b = c.get("bloco") or "01_video"
        if not BLOCO_OK.match(b):
            sys.exit(f'bloco inválido no roteiro: "{b}" (use só letras sem acento, números, _ e -)')
        blocos.setdefault(b, []).append(c)

    if a.capitulos:
        capitulos(roteiro, blocos, carregar_timeline(raiz))
        return

    if a.esqueleto:
        tl = carregar_timeline(raiz)
        for b, cenas in blocos.items():
            arq = pasta / f"{b}.js"
            if arq.exists():
                print(f"  já existe: cenas/{b}.js")
                continue
            linhas = []
            for c in cenas:
                t = tl.get(c["id"])
                tempo = f"{t['fim'] - t['inicio']:.1f} s (fala {t['fala']:.1f} s)" if t else "rode gerar_audio.py para ver a duração"
                linhas.append(f"    // {c['id']} — {tempo}: \"{c['texto']}\"\n    // {c['id']}(lt, d, k) {{ }},\n")
            arq.write_text(CABECALHO.format(bloco=b, cenas="\n".join(linhas).rstrip()), encoding="utf-8")
            print(f"  criado: cenas/{b}.js ({len(cenas)} cenas)")

    arquivos = sorted(pasta.glob("*.js"))
    if not arquivos:
        sys.exit("nenhum arquivo em cenas/. Rode com --esqueleto depois de escrever o roteiro.")
    partes, fontes = [], {}
    for arq in arquivos:
        src = arq.read_text(encoding="utf-8")
        if "BLOCO(" not in src:
            sys.exit(f"cenas/{arq.name} não chama BLOCO(...). Veja o formato no topo de juntar_cenas.py.")
        fontes[arq.stem] = src
        partes.append(f"// ===== cenas/{arq.name} =====\n{src.rstrip()}\n")
    (raiz / "cenas.js").write_text(JUNTADO.format(blocos="\n".join(partes)), encoding="utf-8")

    # uma cena conta como escrita quando há "id(" ou "id:" no começo de uma linha que não é comentário
    tudo = "\n".join(fontes.values())
    faltam = 0
    for b, cenas in blocos.items():
        falta = [c["id"] for c in cenas
                 if not re.search(rf"(?m)^[ \t]*(?:async[ \t]+)?{re.escape(c['id'])}[ \t]*[(:]", tudo)]
        faltam += len(falta)
        estado = "ok" if not falta else "FALTAM: " + ", ".join(falta)
        print(f"  {b:<22} {len(cenas) - len(falta):>3}/{len(cenas):<3} {estado}")
    print(f"cenas.js: {len(arquivos)} blocos, {len(roteiro['cenas']) - faltam}/{len(roteiro['cenas'])} cenas escritas")
    if faltam and a.estrito:
        sys.exit(1)


if __name__ == "__main__":
    main()
