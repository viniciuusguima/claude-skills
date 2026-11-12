"""Monta o vídeo a partir de montagem.json (rode na pasta do vídeo).

    python <skill>/scripts/montar.py                    -> MP4 final em "saida" do montagem.json
    python <skill>/scripts/montar.py --folha            -> só as folhas build/folha-NN.png (um quadro do meio de cada plano)
    python <skill>/scripts/montar.py --de 60 --ate 120  -> só esse trecho, em build/trecho.mp4

Estilo (o mesmo dos vídeos aprovados): 1920x1080, 30 fps. Faixa branca no alto com o nome do capítulo em
Comic Sans Bold e um traço preto embaixo; imagens com zoom lento (Ken Burns) e trechos de trailer ocupam o
resto da tela; rótulo opcional (ex.: "MARK 1") num quadro branco embaixo à esquerda; cada capítulo pode abrir
num cartão branco com uma imagem emoldurada e o título. O som dos trailers nunca entra: só a narração
(e uma trilha livre opcional em "musica").

Cada plano vira um pedaço em build/planos/ e só é refeito quando muda, então ajustar um plano é rápido.
"""
import argparse
import hashlib
import json
import math
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

W, H, FPS, FAIXA = 1920, 1080, 30, 155
AREA = (W, H - FAIXA)
VERSAO = "3"  # mude quando o estilo mudar, para refazer todos os pedaços
FONTES = ["C:/Windows/Fonts/comicbd.ttf", "/Library/Fonts/Comic Sans MS Bold.ttf", "/usr/share/fonts/truetype/msttcorefonts/comicbd.ttf",
          "C:/Windows/Fonts/arialbd.ttf"]
FONTE = next((f for f in FONTES if Path(f).exists()), None)
B = Path("build")


def fonte(tam):
    return ImageFont.truetype(FONTE, tam) if FONTE else ImageFont.load_default()


def texto_cabe(draw, txt, tam, larg):
    while tam > 20:
        f = fonte(tam)
        if draw.textlength(txt, font=f) <= larg:
            return f
        tam -= 4
    return fonte(tam)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode:
        raise RuntimeError("falhou: " + " ".join(map(str, cmd))[:400] + "\n" + r.stderr[-1500:])
    return r


def duracao(arq):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(arq)]).stdout.strip())


def png_faixa(cap):
    p = B / "texto" / f"faixa-{hashlib.md5(cap.encode()).hexdigest()[:10]}.png"
    if not p.exists():
        p.parent.mkdir(parents=True, exist_ok=True)
        im = Image.new("RGBA", (W, FAIXA), "white"); d = ImageDraw.Draw(im)
        d.rectangle([0, FAIXA - 7, W, FAIXA], fill="black")
        f = texto_cabe(d, cap, 104, W - 160)
        d.text((W / 2, (FAIXA - 7) / 2 + 2), cap, font=f, fill="black", anchor="mm")
        im.save(p)
    return p


def png_rotulo(txt):
    p = B / "texto" / f"rotulo-{hashlib.md5(txt.encode()).hexdigest()[:10]}.png"
    if not p.exists():
        p.parent.mkdir(parents=True, exist_ok=True)
        f = fonte(46); tmp = ImageDraw.Draw(Image.new("RGB", (1, 1)))
        tw = int(tmp.textlength(txt, font=f))
        im = Image.new("RGBA", (tw + 48, 76), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        d.rounded_rectangle([0, 0, tw + 47, 75], radius=8, fill="white", outline="black", width=4)
        d.text(((tw + 48) / 2, 39), txt, font=f, fill="black", anchor="mm")
        im.save(p)
    return p


def png_cartao(img, cap):
    p = B / "texto" / f"cartao-{hashlib.md5((str(img) + cap).encode()).hexdigest()[:10]}.png"
    if not p.exists():
        p.parent.mkdir(parents=True, exist_ok=True)
        im = Image.new("RGB", (W, H), "white"); d = ImageDraw.Draw(im)
        if img and Path(img).exists():
            foto = ImageOps.fit(Image.open(img).convert("RGB"), (1180, 664))
            x0, y0 = (W - 1180) // 2, 90
            d.rectangle([x0 - 14, y0 - 14, x0 + 1180 + 13, y0 + 664 + 13], fill="black")
            im.paste(foto, (x0, y0)); yt = y0 + 664 + 140
        else:
            yt = H // 2
        f = texto_cabe(d, cap, 120, W - 200)
        d.text((W / 2, yt), cap, font=f, fill="black", anchor="mm")
        im.save(p)
    return p


def png_pendente(desc, cap):
    p = B / "texto" / f"pendente-{hashlib.md5((desc + cap).encode()).hexdigest()[:10]}.png"
    if not p.exists():
        p.parent.mkdir(parents=True, exist_ok=True)
        im = Image.new("RGB", AREA, (48, 48, 52)); d = ImageDraw.Draw(im)
        d.text((AREA[0] / 2, AREA[1] / 2 - 50), "PENDENTE", font=fonte(80), fill=(255, 200, 0), anchor="mm")
        d.text((AREA[0] / 2, AREA[1] / 2 + 60), desc[:90], font=texto_cabe(d, desc[:90], 54, AREA[0] - 120), fill="white", anchor="mm")
        im.save(p)
    return p


def quadros(p):
    return round(p["fim"] * FPS) - round(p["inicio"] * FPS)


def render_plano(i, p):
    n = quadros(p)
    if n <= 0:
        return None
    chave = hashlib.md5((VERSAO + json.dumps(p, sort_keys=True, ensure_ascii=False) + str(n)).encode()).hexdigest()[:12]
    out = B / "planos" / f"{i:04d}-{chave}.mp4"
    if out.exists():
        return out
    out.parent.mkdir(parents=True, exist_ok=True)
    for velho in out.parent.glob(f"{i:04d}-*.mp4"):
        velho.unlink()
    cap = p.get("capitulo", "")
    zoom_in = i % 2 == 0
    z = f"1+0.07*on/{n}" if zoom_in else f"1.07-0.07*on/{n}"
    kb = f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={{w}}x{{h}}:fps={FPS}"
    entradas, filtro = [], ""
    if "cartao" in p:
        entradas = ["-i", png_cartao(p["cartao"], cap)]
        filtro = f"[0]scale=3840:2160,{kb.format(w=W, h=H)},setsar=1[v]"
    else:
        if "img" in p and Path(p["img"]).exists():
            entradas = ["-i", p["img"]]
            base = f"[0]scale={AREA[0]*2}:{AREA[1]*2}:force_original_aspect_ratio=increase,crop={AREA[0]*2}:{AREA[1]*2},{kb.format(w=AREA[0], h=AREA[1])}"
        elif "cena" in p and Path(p["cena"]).exists():
            d = duracao(p["cena"]); dur = n / FPS
            ent = max(0.0, min(float(p.get("entrada", 0)), d - dur - 0.05))
            entradas = ["-ss", f"{ent:.3f}", "-i", p["cena"]]
            base = f"[0]fps={FPS},scale={AREA[0]}:{AREA[1]}:force_original_aspect_ratio=increase,crop={AREA[0]}:{AREA[1]},tpad=stop_mode=clone:stop_duration=5"
        else:
            desc = p.get("pendente") or f"arquivo não encontrado: {p.get('img') or p.get('cena')}"
            entradas = ["-i", png_pendente(desc, cap)]
            base = f"[0]{kb.format(w=AREA[0], h=AREA[1])}"
        entradas += ["-i", png_faixa(cap)]
        filtro = f"{base},setsar=1,pad={W}:{H}:0:{FAIXA}:white[b];[b][1]overlay=0:0[f]"
        if p.get("rotulo"):
            entradas += ["-i", png_rotulo(p["rotulo"])]
            filtro += f";[f][2]overlay=40:H-h-40[v]"
        else:
            filtro += ";[f]null[v]"
    cmd = ["ffmpeg", "-v", "error", "-y", *map(str, entradas), "-filter_complex", filtro, "-map", "[v]", "-frames:v", str(n),
           "-r", str(FPS), "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", str(out)]
    run(cmd)
    return out


def folhas(pedacos, planos):
    (B / "folhas").mkdir(parents=True, exist_ok=True)
    for f in (B / "folhas").glob("*.png"):
        f.unlink()
    cel, por = (384, 216), 24
    itens = [(p, pl) for p, pl in zip(pedacos, planos) if p]
    saidas = []
    for k in range(0, len(itens), por):
        grupo = itens[k:k + por]
        cols = 4; rows = math.ceil(len(grupo) / cols)
        folha = Image.new("RGB", (cols * cel[0], rows * (cel[1] + 30)), "black"); d = ImageDraw.Draw(folha)
        for j, (arq, pl) in enumerate(grupo):
            tmp = B / "folhas" / "q.png"
            meio = (pl["fim"] - pl["inicio"]) / 2
            run(["ffmpeg", "-v", "error", "-y", "-ss", f"{meio:.2f}", "-i", str(arq), "-frames:v", "1", "-vf", f"scale={cel[0]}:{cel[1]}", str(tmp)])
            x, y = (j % cols) * cel[0], (j // cols) * (cel[1] + 30)
            folha.paste(Image.open(tmp), (x, y + 30))
            idx = planos.index(pl)
            d.text((x + 6, y + 6), f"#{idx} {pl['inicio']:.1f}-{pl['fim']:.1f}s", fill=(255, 230, 0), font=fonte(18))
        tmp.unlink(missing_ok=True)
        s = B / "folhas" / f"folha-{k // por + 1:02d}.png"
        folha.save(s); saidas.append(s)
    return saidas


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--montagem", default="montagem.json")
    ap.add_argument("--folha", action="store_true")
    ap.add_argument("--de", type=float); ap.add_argument("--ate", type=float)
    a = ap.parse_args()
    M = json.loads(Path(a.montagem).read_text(encoding="utf-8"))
    planos = sorted(M["planos"], key=lambda p: p["inicio"])
    total = duracao(M["audio"])
    # costura: cada plano vai até o início do próximo; o primeiro começa em 0 e o último vai até o fim da narração
    planos[0]["inicio"] = 0.0
    for p, q in zip(planos, planos[1:]):
        p["fim"] = q["inicio"]
    planos[-1]["fim"] = max(planos[-1]["fim"], total)
    if a.de is not None or a.ate is not None:
        de, ate = a.de or 0.0, a.ate or total
        escolhidos = [p for p in planos if p["fim"] > de and p["inicio"] < ate]
    else:
        de, ate, escolhidos = 0.0, total, planos
    pend = [p for p in escolhidos if "pendente" in p]
    print(f"{len(escolhidos)} planos ({de:.0f}-{ate:.0f} s), {len(pend)} pendentes", flush=True)
    pedacos = []
    for k, p in enumerate(escolhidos):
        pedacos.append(render_plano(planos.index(p), p))
        if k % 10 == 9:
            print(f"  {k + 1}/{len(escolhidos)} planos", flush=True)
    if a.folha:
        for s in folhas(pedacos, escolhidos):
            print("folha:", s.resolve())
        return
    lista = B / "lista.txt"
    lista.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in pedacos if p), encoding="utf-8")
    video = B / "video-mudo.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lista), "-c", "copy", str(video)])
    trecho = a.de is not None or a.ate is not None
    t0 = escolhidos[0]["inicio"]; t1 = escolhidos[-1]["fim"]
    saida = B / "trecho.mp4" if trecho else Path(M["saida"])
    saida.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(video), "-ss", f"{t0:.3f}", "-to", f"{t1:.3f}", "-i", M["audio"]]
    voz = "[1]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[voz]"
    if M.get("musica"):
        cmd += ["-stream_loop", "-1", "-i", M["musica"]]
        fil = f"{voz};[2]volume={M.get('volume_musica', 0.08)},aresample=48000[m];[voz][m]amix=inputs=2:duration=first:normalize=0[a]"
    else:
        fil = voz.replace("[voz]", "[a]")
    cmd += ["-filter_complex", fil, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
            "-movflags", "+faststart", str(saida)]
    run(cmd)
    print(f"pronto: {saida.resolve()} ({saida.stat().st_size / 1048576:.1f} MB, {duracao(saida):.1f} s)")
    if pend and not trecho:
        print(f"atenção: {len(pend)} planos ainda estão como PENDENTE (tela cinza).")


if __name__ == "__main__":
    sys.exit(main())
