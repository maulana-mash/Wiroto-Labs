import http.server
import socketserver
import os
import sys

PORT = int(os.environ.get("PORT", 8085))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
            print(f"Automotive Bench 3D Server aktif di http://127.0.0.1:{PORT}/index.html")
            httpd.serve_forever()
    except OSError as e:
        print(f"Port {PORT} sudah digunakan atau server sudah berjalan: {e}")
        sys.exit(0)
