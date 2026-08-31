"""Stdio MCP server: process_article (URL → Telegram post via DeepSeek)."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from mcp.server.fastmcp import FastMCP

from deepseek_article import process_article as write_post_from_url

app = FastMCP("deepseek-agent")


@app.tool()
def process_article(url: str, style: str = "telegram") -> str:
    """Fetch an article by URL, then write a Telegram post with DeepSeek."""
    return write_post_from_url(url, style)


if __name__ == "__main__":
    app.run(transport="stdio")
