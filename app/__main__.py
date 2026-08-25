import os
import signal
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer

from app.handler import handle_request

_METHODS = ("GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE")


def parse_bind() -> tuple[str, int]:
    host = os.environ.get("HOST", "127.0.0.1")
    raw_port = os.environ.get("PORT", "8000")
    try:
        port = int(raw_port)
    except ValueError:
        print(f"Invalid PORT: {raw_port}", file=sys.stderr)
        sys.exit(1)
    if not (1 <= port <= 65535):
        print(f"Invalid PORT: {raw_port}", file=sys.stderr)
        sys.exit(1)
    return host, port


class AppHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _dispatch(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        resp = handle_request(self.command, parsed.path, parsed.query)
        self.send_response(resp.status)
        for name, value in resp.headers.items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(resp.body)

    def log_request(self, code="-", size="-"):
        parsed = urllib.parse.urlparse(self.path)
        sys.stderr.write(f"{self.command} {parsed.path} {code}\n")


for _method in _METHODS:
    setattr(AppHandler, f"do_{_method}", AppHandler._dispatch)


def main() -> None:
    host, port = parse_bind()
    server = HTTPServer((host, port), AppHandler)

    def _on_sigterm(_signum, _frame):
        raise SystemExit(0)

    signal.signal(signal.SIGTERM, _on_sigterm)
    print(f"Serving on http://{host}:{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
