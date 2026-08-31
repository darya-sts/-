"""Routing helpers for the optional MCP mode. No heavy MCP/LLM imports."""

from __future__ import annotations

import os
import re
import shlex
from typing import Any

KIND_QUERY = "query"
KIND_HELP = "help"
KIND_TOOLS = "tools"

MCP_HELP = (
    "Режим MCP (агенты и внешние инструменты).\n\n"
    "Обычные сообщения по-прежнему отвечает DeepSeek.\n"
    "Чтобы вызвать MCP-агента:\n"
    "• /mcp ваш запрос\n"
    "• /agent ваш запрос\n"
    "• mcp: ваш запрос\n\n"
    "Список инструментов: /mcp-tools или /mcptools\n\n"
    "Статья → пост: обработай статью https://example.com и напиши пост\n"
    "или /mcp process_article с URL.\n\n"
    "Timeweb Cloud: задайте TIMEWEB_TOKEN "
    "(панель → API и Terraform). "
    "Дополнительно: MCP_SERVER_URL / MCP_SERVER_COMMAND / MCP_API_KEY."
)

MCP_NO_TOOLS = (
    "MCP-серверы не подключены: инструменты не найдены.\n"
    "Для Timeweb Cloud задайте TIMEWEB_TOKEN "
    "(https://timeweb.cloud/my/api-keys).\n"
    "Либо MCP_SERVER_URL / MCP_SERVER_COMMAND и при необходимости MCP_API_KEY."
)

TIMEWEB_MCP_URL = "https://api.timeweb.cloud/api/v1/mcp/search"
_URL_RE = re.compile(r"https?://", re.I)
_ARTICLE_HINTS = (
    "обработ",
    "напиши пост",
    "сгенерируй пост",
    "process_article",
    "process article",
)


def is_article_mcp_request(text: str) -> bool:
    """True for 'process this article URL into a post' messages."""
    if not _URL_RE.search(text):
        return False
    lowered = text.lower()
    return any(hint in lowered for hint in _ARTICLE_HINTS)


class McpRequest:
    def __init__(self, kind: str, query: str = "") -> None:
        self.kind = kind
        self.query = query


def parse_mcp_message(text: str | None) -> McpRequest | None:
    """Detect an explicit MCP invocation. None means regular DeepSeek chat."""
    if not text:
        return None
    raw = text.strip()
    if raw.lower().startswith("mcp:"):
        query = raw[4:].strip()
        return McpRequest(KIND_QUERY, query) if query else McpRequest(KIND_HELP)

    first, _, rest = raw.partition(" ")
    cmd = first.partition("@")[0].lower()
    if cmd in {"/mcp-tools", "/mcptools"}:
        return McpRequest(KIND_TOOLS)
    if cmd in {"/mcp", "/agent"}:
        query = rest.strip()
        return McpRequest(KIND_QUERY, query) if query else McpRequest(KIND_HELP)
    if is_article_mcp_request(raw):
        return McpRequest(KIND_QUERY, raw)
    return None


def format_tools_status(tool_names: list[str]) -> str:
    """Human-readable tool list for /mcp-tools."""
    if not tool_names:
        return MCP_NO_TOOLS
    names = "\n".join(f"• {name}" for name in tool_names)
    return f"Доступные MCP-инструменты ({len(tool_names)}):\n{names}"


def servers_from_env(
    environ: dict[str, str] | None = None,
) -> dict[str, dict[str, Any]]:
    """Build one MCP server config from environment variables."""
    env = environ if environ is not None else os.environ
    name = (env.get("MCP_SERVER_NAME") or "env-mcp").strip() or "env-mcp"
    url = (env.get("MCP_SERVER_URL") or "").strip()
    command = (env.get("MCP_SERVER_COMMAND") or "").strip()
    api_key = (env.get("MCP_API_KEY") or "").strip()
    if url:
        settings: dict[str, Any] = {
            "url": url.rstrip("/"),
            "transport": "sse" if "/sse" in url else "streamable_http",
        }
        if api_key:
            settings["headers"] = {"Authorization": f"Bearer {api_key}"}
        return {name: settings}
    if command:
        parts = shlex.split(command)
        if not parts:
            return {}
        return {
            name: {
                "transport": "stdio",
                "command": parts[0],
                "args": parts[1:],
            }
        }
    return {}
