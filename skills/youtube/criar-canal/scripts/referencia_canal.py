"""Baixa a "home" de um canal do YouTube para servir de referência a um canal novo.

    python <skill>/scripts/referencia_canal.py "<canal>" --saida E:/Projetos/<slug>/identidade/referencia [--n 12]

<canal> pode ser o link do canal (youtube.com/@handle, youtube.com/channel/UC...), só o @handle ou o link
de um vídeo dele. Não baixa vídeo nenhum. Escreve em --saida:
  canal.json    nome, @handle, inscritos, descrição, tags e link
  avatar.jpg    a foto de perfil, no maior tamanho disponível
  banner.jpg    o banner inteiro como o dono subiu (normalmente 2560x1440), sem o recorte da página
  thumbs.png    grade com as thumbs dos N vídeos mais vistos entre os 30 mais recentes
  videos.md     os 30 vídeos mais recentes: views, duração e título, e a posição na grade
"""
import argparse
import json
import math
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ABAS = re.compile(r"/(videos|featured|shorts|streams|playlists|community|about|posts|podcasts)/?$")


def ytdlp(*args: str) -> dict:
    if not shutil.which("yt-dlp"):
        sys.exit("yt-dlp não está no PATH: winget install --id yt-dlp.yt-dlp --exact")
    r = subprocess.run(["yt-dlp", "-J", "--no-warnings", *args], capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        sys.exit("yt-dlp falhou:\n" + r.stderr.strip()[-800:]
                 + "\nSe for erro 403 ou de assinatura, atualize: winget upgrade --id yt-dlp.yt-dlp")
    return json.loads(r.stdout)


def baixar(url: str, destino: Path) -> bool:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        dados = urllib.request.urlopen(req, timeout=30).read()
    except (urllib.error.URLError, TimeoutError):
        return False
    if len(dados) < 1500:   # imagem cinza de "sem imagem"
        return False
    destino.write_bytes(dados)
    return True


def views(n) -> str:
    if not n:
        return "?"
    for limite, sufixo in ((1e9, " B"), (1e6, " M"), (1e3, " mil")):
        if n >= limite:
            return f"{n / limite:.1f}".rstrip("0").rstrip(".") + sufixo
    return str(n)


def duracao(s) -> str:
    return f"{int(s // 60)}:{int(s % 60):02d}" if s else "?"


def endereco_do_canal(entrada: str) -> str:
    entrada = entrada.strip()
    if entrada.startswith("@"):
        return f"https://www.youtube.com/{entrada}"
    if re.search(r"(watch\?v=|youtu\.be/|/shorts/[\w-]{6,})", entrada):
        video = ytdlp("--skip-download", "--no-playlist", entrada)
        canal = video.get("channel_url") or video.get("uploader_url")
        if not canal:
            sys.exit("o yt-dlp não informou o canal desse vídeo; passe o link do canal")
        return canal
    if not entrada.startswith("http"):
        entrada = "https://" + entrada
    return ABAS.sub("", entrada.rstrip("/"))


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("canal")
    ap.add_argument("--saida", required=True)
    ap.add_argument("--n", type=int, default=12, help="quantas thumbs na grade (padrão 12)")
    a = ap.parse_args()

    saida = Path(a.saida).resolve()
    saida.mkdir(parents=True, exist_ok=True)
    canal = endereco_do_canal(a.canal)
    dados = ytdlp("--flat-playlist", "--playlist-end", "30", canal + "/videos")

    imagens = {t.get("id"): t.get("url") for t in dados.get("thumbnails") or []}
    info = {
        "nome": dados.get("channel") or dados.get("uploader"),
        "handle": dados.get("uploader_id"),
        "link": dados.get("uploader_url") or dados.get("channel_url") or canal,
        "inscritos": dados.get("channel_follower_count"),
        "descricao": dados.get("description"),
        "tags": dados.get("tags") or [],
    }
    (saida / "canal.json").write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8")

    achou = {}
    for nome, chave in (("avatar", "avatar_uncropped"), ("banner", "banner_uncropped")):
        url = imagens.get(chave)
        achou[nome] = bool(url) and baixar(url, saida / f"{nome}.jpg")

    videos = [e for e in dados.get("entries") or [] if e and e.get("id")]
    por_views = sorted(videos, key=lambda e: e.get("view_count") or 0, reverse=True)
    pasta = saida / "thumbs"
    shutil.rmtree(pasta, ignore_errors=True)
    pasta.mkdir()
    na_grade = {}
    for e in por_views:
        if len(na_grade) >= a.n:
            break
        if baixar(f"https://i.ytimg.com/vi/{e['id']}/mqdefault.jpg", pasta / f"{len(na_grade) + 1:02d}.jpg"):
            na_grade[e["id"]] = len(na_grade) + 1
    if na_grade:
        k = len(na_grade)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-start_number", "1", "-i", str(pasta / "%02d.jpg"),
                        "-vf", f"scale=320:180,tile=4x{math.ceil(k / 4)}:padding=8:color=0x303030",
                        "-frames:v", "1", str(saida / "thumbs.png")], check=True)

    linhas = [f"| {i} | {na_grade.get(e['id'], '')} | {views(e.get('view_count'))} | {duracao(e.get('duration'))} "
              f"| {e.get('title', '')} | https://youtu.be/{e['id']} |" for i, e in enumerate(videos, 1)]
    (saida / "videos.md").write_text(
        f"# Vídeos mais recentes de {info['nome']}\n\n"
        "Do mais novo para o mais antigo. \"grade\" é a posição em `thumbs.png` (os mais vistos), da esquerda para a "
        "direita, de cima para baixo.\n\n"
        "| # | grade | views | duração | título | link |\n|---|---|---|---|---|---|\n" + "\n".join(linhas) + "\n",
        encoding="utf-8")

    print(f"canal:    {info['nome']}  ·  {info['handle'] or '?'}  ·  {views(info['inscritos'])} inscritos")
    print(f"link:     {info['link']}")
    print(f"avatar:   {saida / 'avatar.jpg' if achou['avatar'] else 'NÃO BAIXOU (peça um print ao usuário)'}")
    print(f"banner:   {saida / 'banner.jpg' if achou['banner'] else 'NÃO BAIXOU (o canal pode não ter banner)'}")
    print(f"vídeos:   {len(videos)} recentes -> {saida / 'videos.md'}"
          + (f"; {len(na_grade)} thumbs -> {saida / 'thumbs.png'}" if na_grade else "; nenhuma thumb baixou"))


if __name__ == "__main__":
    main()
