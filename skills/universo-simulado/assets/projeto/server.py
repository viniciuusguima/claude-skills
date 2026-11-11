"""Servidor local: serve a pagina do video e recebe o MP4 exportado (POST /save?name=...)."""
import http.server
import os
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
ALLOWED = (".mp4", ".png", ".wav")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
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

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
