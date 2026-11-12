"""Servidor local: serve a pagina do video e recebe o MP4 exportado (POST /save?name=...).

Quando o navegador nao codifica AAC (Chrome no Linux), a pagina salva o video sem audio e um WAV,
e POST /mux?video=...&audio=...&name=... junta os dois em AAC com o ffmpeg.
"""
import http.server
import os
import shutil
import subprocess
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
ALLOWED = (".mp4", ".png", ".wav")


def resolve(name):
    """Caminho dentro de ROOT (no maximo uma subpasta) com extensao permitida, ou None."""
    parts = [p for p in name.replace("\\", "/").split("/") if p not in ("", ".", "..")]
    if not parts or len(parts) > 2 or not parts[-1].lower().endswith(ALLOWED):
        return None
    return os.path.join(ROOT, *parts)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        if url.path == "/mux":
            self.mux(urllib.parse.parse_qs(url.query))
            return
        if url.path != "/save":
            self.send_error(404)
            return
        name = urllib.parse.parse_qs(url.query).get("name", ["saida.mp4"])[0]
        parts = [p for p in name.replace("\\", "/").split("/") if p not in ("", ".", "..")]
        if not parts or len(parts) > 2 or not parts[-1].lower().endswith(ALLOWED):
            self.send_error(400)
            return
        target = os.path.join(ROOT, *parts)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        remaining = int(self.headers.get("Content-Length", "0"))
        with open(target, "wb") as out:
            while remaining > 0:
                chunk = self.rfile.read(min(remaining, 1 << 20))
                if not chunk:
                    break
                out.write(chunk)
                remaining -= len(chunk)
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"ok")

    def mux(self, query):
        video, audio, out = (resolve(query.get(k, [""])[0]) for k in ("video", "audio", "name"))
        if None in (video, audio, out) or not out.lower().endswith(".mp4") or out in (video, audio):
            self.reply(400, "parametros invalidos")
            return
        if not (os.path.isfile(video) and os.path.isfile(audio)):
            self.reply(400, "video ou audio nao encontrado")
            return
        ffmpeg = shutil.which("ffmpeg")
        if not ffmpeg:
            self.reply(500, "ffmpeg nao encontrado: instale o ffmpeg para exportar com audio neste navegador")
            return
        cmd = [ffmpeg, "-y", "-v", "error", "-i", video, "-i", audio, "-map", "0:v:0", "-map", "1:a:0",
               "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            self.reply(500, (r.stderr or "o ffmpeg falhou").strip()[-2000:])
            return
        os.remove(video)
        os.remove(audio)
        self.reply(200, str(os.path.getsize(out)))

    def reply(self, code, text):
        body = text.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
