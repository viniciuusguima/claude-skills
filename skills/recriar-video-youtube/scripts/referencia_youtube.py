"""Baixa os metadados e a thumbnail de um vídeo do YouTube para a pasta referencia/ do projeto.

    python <skill>/scripts/referencia_youtube.py "<url>" [--projeto .] [--canal 12]
    python <skill>/scripts/referencia_youtube.py --onde-watch

Não baixa o vídeo (quem assiste é a skill watch). Escreve:
  referencia/meta.json              título, canal, duração, views, descrição, tags, capítulos
  referencia/thumb_original.jpg     a thumbnail na maior resolução disponível
  referencia/thumb_original_320.jpg a mesma em 320x180, o tamanho em que ela aparece no feed
Com --canal N, também as thumbs dos N vídeos mais vistos entre os 30 últimos do mesmo canal:
  referencia/thumbs_canal.png (grade) e referencia/thumbs_canal.md (posição, views, título)

--onde-watch só imprime o caminho do watch.py da skill watch (plugin claude-video), ou avisa que falta instalar.
"""
import argparse
import json
import math
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

CAMPOS = ("id", "title", "channel", "channel_url", "uploader", "uploader_url", "duration", "duration_string",
          "upload_date", "view_count", "like_count", "comment_count", "language", "categories", "tags",
          "chapters", "description", "thumbnail", "webpage_url")

INSTALAR_WATCH = ("skill watch não encontrada. Instale o plugin e abra uma sessão nova:\n"
                  "  claude plugin marketplace add bradautomates/claude-video\n"
                  "  claude plugin install watch@claude-video")


def achar_watch() -> Path | None:
    """Caminho do watch.py da skill watch, onde quer que o plugin tenha sido instalado."""
    candidatos = []
    if os.environ.get("WATCH_SKILL_DIR"):
        candidatos.append(Path(os.environ["WATCH_SKILL_DIR"]) / "scripts" / "watch.py")
    claude = Path.home() / ".claude"
    candidatos.append(claude / "skills" / "watch" / "scripts" / "watch.py")
    plugins = claude / "plugins"
    if plugins.exists():
        # a versão mais recente do cache vem antes do clone do marketplace
        candidatos += sorted(plugins.glob("cache/**/skills/watch/scripts/watch.py"),
                             key=lambda p: p.stat().st_mtime, reverse=True)
        candidatos += list(plugins.glob("marketplaces/*/skills/watch/scripts/watch.py"))
    return next((c for c in candidatos if c.exists()), None)


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
    if len(dados) < 1500:   # imagem cinza de "sem thumbnail"
        return False
    destino.write_bytes(dados)
    return True


def ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-y", "-v", "error", *args], check=True)


def views(n) -> str:
    if not n:
        return "?"
    for limite, sufixo in ((1e9, " B"), (1e6, " M"), (1e3, " mil")):
        if n >= limite:
            return f"{n / limite:.1f}".rstrip("0").rstrip(".") + sufixo
    return str(n)


def thumbs_do_canal(meta: dict, ref: Path, n: int) -> None:
    canal = meta.get("channel_url") or meta.get("uploader_url")
    if not canal:
        print("canal: o yt-dlp não informou o endereço do canal; pulei --canal")
        return
    lista = ytdlp("--flat-playlist", "--playlist-end", "30", canal.rstrip("/") + "/videos")
    videos = [e for e in lista.get("entries") or [] if e and e.get("id")]
    videos.sort(key=lambda e: e.get("view_count") or 0, reverse=True)
    pasta = ref / "thumbs_canal"
    shutil.rmtree(pasta, ignore_errors=True)
    pasta.mkdir(parents=True)
    linhas, k = [], 0
    for e in videos:
        if k >= n:
            break
        if not baixar(f"https://i.ytimg.com/vi/{e['id']}/mqdefault.jpg", pasta / f"{k + 1:02d}.jpg"):
            continue
        k += 1
        marca = "  ← o vídeo de referência" if e["id"] == meta.get("id") else ""
        linhas.append(f"| {k} | {views(e.get('view_count'))} | {e.get('title', '')} | https://youtu.be/{e['id']}{marca} |")
    if not k:
        print("canal: não consegui baixar nenhuma thumb do canal")
        return
    ffmpeg("-start_number", "1", "-i", str(pasta / "%02d.jpg"),
           "-vf", f"scale=320:180,tile=4x{math.ceil(k / 4)}:padding=8:color=0x303030",
           "-frames:v", "1", str(ref / "thumbs_canal.png"))
    (ref / "thumbs_canal.md").write_text(
        f"# Thumbs mais vistas de {meta.get('channel', 'canal')} (entre os 30 vídeos mais recentes)\n\n"
        "A posição segue a grade `thumbs_canal.png`: da esquerda para a direita, de cima para baixo.\n\n"
        "| # | views | título | link |\n|---|---|---|---|\n" + "\n".join(linhas) + "\n", encoding="utf-8")
    print(f"canal: {k} thumbs -> {ref / 'thumbs_canal.png'} (+ thumbs_canal.md)")


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("url", nargs="?")
    ap.add_argument("--projeto", default=".")
    ap.add_argument("--canal", type=int, default=0, metavar="N", help="também as N thumbs mais vistas do canal")
    ap.add_argument("--onde-watch", action="store_true")
    a = ap.parse_args()

    if a.onde_watch:
        w = achar_watch()
        print(w if w else INSTALAR_WATCH)
        sys.exit(0 if w else 3)
    if not a.url:
        ap.error("informe a url do vídeo")

    ref = Path(a.projeto).resolve() / "referencia"
    ref.mkdir(parents=True, exist_ok=True)

    bruto = ytdlp("--skip-download", "--no-playlist", a.url)
    meta = {c: bruto.get(c) for c in CAMPOS if bruto.get(c) not in (None, "", [])}
    (ref / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    thumb = ref / "thumb_original.jpg"
    ok = any(baixar(f"https://i.ytimg.com/vi/{meta['id']}/{nome}.jpg", thumb)
             for nome in ("maxresdefault", "sddefault", "hqdefault"))
    if ok:
        ffmpeg("-i", str(thumb), "-vf", "scale=320:180", str(ref / "thumb_original_320.jpg"))

    dur = meta.get("duration") or 0
    print(f"título:   {meta.get('title')}")
    print(f"canal:    {meta.get('channel')}  ·  {views(meta.get('view_count'))} views  ·  {meta.get('upload_date', '?')}")
    print(f"duração:  {int(dur // 60)}:{int(dur % 60):02d}  ·  idioma: {meta.get('language', '?')}"
          f"  ·  capítulos: {len(meta.get('chapters') or [])}")
    print(f"meta:     {ref / 'meta.json'}")
    print(f"thumb:    {thumb if ok else 'NÃO BAIXOU (peça um print ao usuário)'}")
    if a.canal:
        thumbs_do_canal(meta, ref, a.canal)


if __name__ == "__main__":
    main()
