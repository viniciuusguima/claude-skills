"""Capa no estilo aprovado: grade 3x2 de imagens oficiais num cartão branco arredondado sobre fundo preto,
cada imagem com moldura preta grossa e uma legenda curta em Comic Sans Bold embaixo; em alguns painéis,
um círculo ou uma seta vermelha apontando o detalhe.

    python <skill>/scripts/capa.py capa.json [saida.jpg]

capa.json:
    {"paineis": [
        {"img": "imagens/01-mark-1/01-mark-1-2.jpg", "legenda": "A SUCATA"},
        {"img": "...", "legenda": "A MALETA", "seta": [0.35, 0.75]},       # ponta da seta (fração da imagem)
        {"img": "...", "legenda": "NANOTECH", "circulo": [0.3, 0.5, 0.22]}, # centro x, y e raio (fração da largura)
        ... 6 painéis ...]}
Opcional por painel: "foco": [x, y] (0..1) para escolher o ponto que fica no centro do recorte.
"""
import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

W, H = 1280, 720
FONTE = next((f for f in ["C:/Windows/Fonts/comicbd.ttf", "C:/Windows/Fonts/arialbd.ttf"] if Path(f).exists()), None)
VERMELHO = (220, 30, 30)


def fonte(t):
    return ImageFont.truetype(FONTE, t) if FONTE else ImageFont.load_default()


def main():
    cfg = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    saida = Path(sys.argv[2] if len(sys.argv) > 2 else "capa.jpg")
    pain = cfg["paineis"][:6]
    capa = Image.new("RGB", (W, H), "black")
    d = ImageDraw.Draw(capa)
    m = 8
    d.rounded_rectangle([m, m, W - m, H - m], radius=22, fill="white")
    cols, rows, gx, gy0, leg = 3, 2, 22, 22, 62
    cw = (W - 2 * m - gx * (cols + 1)) // cols
    ch = (H - 2 * m - gy0 * (rows + 1) - leg * rows) // rows
    borda = 5
    for i, p in enumerate(pain):
        cx, cy = i % cols, i // cols
        x = m + gx + cx * (cw + gx)
        y = m + gy0 + cy * (ch + leg + gy0)
        foto = ImageOps.fit(Image.open(p["img"]).convert("RGB"), (cw - 2 * borda, ch - 2 * borda), centering=tuple(p.get("foco", (0.5, 0.5))))
        d.rectangle([x, y, x + cw - 1, y + ch - 1], fill="black")
        capa.paste(foto, (x + borda, y + borda))
        fw, fh = foto.size
        if "circulo" in p:
            ox, oy, r = p["circulo"]; r *= fw
            px, py = x + borda + ox * fw, y + borda + oy * fh
            for k in range(6):
                d.ellipse([px - r - k, py - r - k, px + r + k, py + r + k], outline=VERMELHO)
        if "seta" in p:
            tx, ty = x + borda + p["seta"][0] * fw, y + borda + p["seta"][1] * fh
            ang = math.radians(p.get("angulo", 35))  # a seta vem de baixo-direita por padrão
            L = fw * 0.28
            sx, sy = tx + L * math.cos(ang), ty + L * math.sin(ang)
            d.line([sx, sy, tx, ty], fill=VERMELHO, width=12)
            for s in (-1, 1):
                a2 = ang + s * 0.5
                d.line([tx, ty, tx + 40 * math.cos(a2), ty + 40 * math.sin(a2)], fill=VERMELHO, width=12)
        f = fonte(40)
        while d.textlength(p["legenda"], font=f) > cw and f.size > 20:
            f = fonte(f.size - 2)
        d.text((x + cw / 2, y + ch + leg / 2 + 2), p["legenda"], font=f, fill="black", anchor="mm")
    capa.save(saida, quality=92)
    print("capa:", saida.resolve())


if __name__ == "__main__":
    main()
