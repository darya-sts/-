"""HTTP health-check for Timeweb Apps / Docker Compose."""

from __future__ import annotations

import logging
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

logger = logging.getLogger(__name__)


def health_port() -> int:
    return int(os.environ.get("PORT", "8080"))


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, format: str, *args) -> None:
        return


def start_health_server(port: int | None = None) -> HTTPServer:
    listen_port = health_port() if port is None else port
    server = HTTPServer(("0.0.0.0", listen_port), HealthHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    logger.info("Health-check server listening on %s", listen_port)
    return server
