"""On-demand MCP tool loading and one-shot agent runs (DeepSeek stays default)."""

from __future__ import annotations

import logging
from typing import Any

from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient

from ..utils import extract_response
from .llm import LLM
from .mcp_routing import format_tools_status, servers_from_env
from .tools import get_tools

log = logging.getLogger(__name__)

_MCP_SYSTEM = (
    "You are an MCP tool agent for Telegram bot @suyuyu_bot. "
    "Use the available tools when they help answer the request. "
    "Reply in the user's language. If a tool fails, explain the error briefly."
)

_tools_cache: list[BaseTool] | None = None


async def collect_mcp_tools(*, refresh: bool = False) -> list[BaseTool]:
    """Load JSON tools from config/tools plus an optional env-configured server."""
    global _tools_cache
    if _tools_cache is not None and not refresh:
        return _tools_cache

    tools: list[BaseTool] = list(await get_tools(display=False))
    env_servers = servers_from_env()
    if env_servers:
        client = MultiServerMCPClient(env_servers)
        for server_name in env_servers:
            try:
                extra = await client.get_tools(server_name=server_name)
                tools.extend(extra)
            except Exception:
                log.warning("Failed to load MCP server %s", server_name, exc_info=True)

    seen: set[str] = set()
    unique: list[BaseTool] = []
    for tool in tools:
        if tool.name in seen:
            continue
        seen.add(tool.name)
        unique.append(tool)
    _tools_cache = unique
    return unique


async def format_mcp_status() -> str:
    tools = await collect_mcp_tools(refresh=True)
    return format_tools_status([tool.name for tool in tools])


async def run_mcp_query(query: str) -> str:
    """Run one MCP-enabled request with the same DeepSeek model as normal chat."""
    tools = await collect_mcp_tools()
    if not tools:
        tools = await collect_mcp_tools(refresh=True)
    if not tools:
        return format_tools_status([])
    model = LLM.get()
    agent = create_agent(model=model, tools=tools, system_prompt=_MCP_SYSTEM)
    try:
        result: dict[str, Any] = await agent.ainvoke(
            {"messages": [HumanMessage(content=query)]}
        )
    except Exception:
        log.exception("MCP agent run failed")
        return "Не удалось выполнить MCP-запрос. Проверьте сервер и ключи, затем повторите."
    messages = result.get("messages") or []
    last = messages[-1] if messages else None
    if last is None:
        return "MCP-агент не вернул ответ."
    text, _reasoning = extract_response(last)
    return text.strip() or "MCP-агент не вернул текст."
