"""Telegram chat bot backed by DeepSeek with persistent Memory MCP."""

from __future__ import annotations

import json
import logging
import os
import re
from collections import defaultdict, deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from typing import Any

import httpx
from telegram import Update
from telegram.constants import ChatAction, ParseMode
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    level=logging.INFO,
)
log = logging.getLogger("marvindeepseek")
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("telegram.ext.ExtBot").setLevel(logging.WARNING)

TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"].strip()
DEEPSEEK_API_KEY = os.environ["DEEPSEEK_API_KEY"].strip()
DEEPSEEK_API_BASE = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com").rstrip("/")
DEEPSEEK_API_MODEL = os.getenv("DEEPSEEK_API_MODEL", "deepseek-chat").strip()
PORT = int(os.getenv("PORT", "8082"))
MAX_HISTORY = int(os.getenv("MAX_HISTORY", "12"))
TELEGRAM_CHUNK_LIMIT = int(os.getenv("TELEGRAM_CHUNK_LIMIT", "3500"))

MEMORY_MCP_ENABLED = os.getenv("MEMORY_MCP_ENABLED", "1").strip() not in {"0", "false", "False", ""}
MEMORY_MCP_URL = os.getenv("MEMORY_MCP_URL", "http://memory-mcp:3000/mcp").strip()
MCP_AUTH_TOKEN = os.getenv("MCP_AUTH_TOKEN", "").strip()

DEFAULT_SYSTEM_PROMPT = """Ты — MarvinDeepSeekBot: универсальный помощник по ИИ-агентам, ИИ-сервисам и контент-фабрикам.
Правила:
1. Всегда отвечай ПОЛНЫМ текстом. Запрещено обрывать ответ на «Часть 1 из N», «продолжение следует» или «…».
2. Не имитируй разбиение сообщений Telegram — транспорт сам отправит несколько сообщений.
3. Сначала предпочитай open-source/бесплатные решения.
4. Отвечай на языке пользователя.
5. Для сложных тем используй заголовки, списки/таблицы и блоки кода.
6. Будь практичным и честным; не предлагай пиратство, взлом API или обход лицензий.
7. Если дан блок «Память», используй эти факты. Не выдумывай память, которой нет.
"""
SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT", DEFAULT_SYSTEM_PROMPT).strip() or DEFAULT_SYSTEM_PROMPT

_raw_users = os.getenv("ALLOWED_USERS", "").strip()
ALLOWED_USERS = {int(x) for x in _raw_users.replace(";", ",").split(",") if x.strip().isdigit()}

_history: dict[int, deque] = defaultdict(lambda: deque(maxlen=MAX_HISTORY))


def _allowed(user_id: int | None) -> bool:
    if not ALLOWED_USERS:
        return True
    return user_id is not None and user_id in ALLOWED_USERS


def _hard_split(text: str, max_len: int) -> list[str]:
    return [text[i : i + max_len] for i in range(0, len(text), max_len)] or [""]


def _split_block(block: str, max_len: int) -> list[str]:
    if len(block) <= max_len:
        return [block]

    paragraphs = re.split(r"\n\n+", block)
    if len(paragraphs) > 1:
        out: list[str] = []
        current = ""
        for para in paragraphs:
            candidate = para if current == "" else f"{current}\n\n{para}"
            if len(candidate) <= max_len:
                current = candidate
            else:
                if current:
                    out.extend(_split_block(current, max_len))
                current = para
        if current:
            out.extend(_split_block(current, max_len))
        return out

    lines = block.split("\n")
    if len(lines) > 1:
        out: list[str] = []
        current = ""
        for line in lines:
            candidate = line if current == "" else f"{current}\n{line}"
            if len(candidate) <= max_len:
                current = candidate
            else:
                if current:
                    out.extend(_split_block(current, max_len))
                current = line
        if current:
            out.extend(_split_block(current, max_len))
        return out

    return _hard_split(block, max_len)


def split_telegram_message(text: str, max_len: int = TELEGRAM_CHUNK_LIMIT) -> list[str]:
    if len(text) <= max_len:
        return [text]
    return _split_block(text, max_len)


def format_telegram_parts(chunks: list[str]) -> list[str]:
    n = len(chunks)
    if n <= 1:
        return list(chunks)
    out: list[str] = []
    for i, chunk in enumerate(chunks, start=1):
        body = chunk
        if i == n:
            body = f"{chunk.rstrip()}\n\n✅ Конец ответа"
        header = f"📌 Часть {i} из {n}\n"
        out.append(f"{header}{body}")
    return out


class MemoryMCPClient:
    """Minimal Streamable-HTTP client for @modelcontextprotocol/server-memory."""

    def __init__(self, url: str, token: str) -> None:
        self.url = url.rstrip("/")
        self.token = token
        self.session_id: str | None = None
        self._req_id = 0

    def _next_id(self) -> int:
        self._req_id += 1
        return self._req_id

    def _headers(self) -> dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
            headers["x-api-key"] = self.token
        if self.session_id:
            headers["Mcp-Session-Id"] = self.session_id
        return headers

    @staticmethod
    def _parse_sse_or_json(raw: str) -> dict[str, Any]:
        raw = raw.strip()
        if not raw:
            return {}
        if raw.startswith("{") or raw.startswith("["):
            data = json.loads(raw)
            return data if isinstance(data, dict) else {"result": data}
        # SSE: take last data: line
        payload = None
        for line in raw.splitlines():
            if line.startswith("data:"):
                payload = line[5:].strip()
        if not payload:
            raise RuntimeError(f"empty SSE payload: {raw[:200]}")
        data = json.loads(payload)
        return data if isinstance(data, dict) else {"result": data}

    async def _post(self, body: dict[str, Any], *, expect_json: bool = True) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(self.url, headers=self._headers(), json=body)
            sid = resp.headers.get("mcp-session-id") or resp.headers.get("Mcp-Session-Id")
            if sid:
                self.session_id = sid
            if resp.status_code >= 400:
                raise RuntimeError(f"MCP HTTP {resp.status_code}: {resp.text[:300]}")
            if not expect_json or not resp.content:
                return {}
            return self._parse_sse_or_json(resp.text)

    async def ensure_session(self) -> None:
        if self.session_id:
            return
        await self._post(
            {
                "jsonrpc": "2.0",
                "id": self._next_id(),
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {},
                    "clientInfo": {"name": "marvindeepseek-bot", "version": "1.1.0"},
                },
            }
        )
        await self._post({"jsonrpc": "2.0", "method": "notifications/initialized"}, expect_json=False)

    async def call_tool(self, name: str, arguments: dict[str, Any]) -> Any:
        await self.ensure_session()
        data = await self._post(
            {
                "jsonrpc": "2.0",
                "id": self._next_id(),
                "method": "tools/call",
                "params": {"name": name, "arguments": arguments},
            }
        )
        if "error" in data:
            raise RuntimeError(str(data["error"]))
        result = data.get("result", data)
        # server-memory often returns content[0].text JSON
        if isinstance(result, dict) and "content" in result:
            texts = []
            for item in result.get("content") or []:
                if isinstance(item, dict) and item.get("type") == "text":
                    texts.append(item.get("text") or "")
            joined = "\n".join(texts).strip()
            if not joined:
                return result
            try:
                return json.loads(joined)
            except json.JSONDecodeError:
                return joined
        return result

    async def search(self, query: str) -> Any:
        return await self.call_tool("search_nodes", {"query": query})

    async def open_nodes(self, names: list[str]) -> Any:
        return await self.call_tool("open_nodes", {"names": names})

    async def create_entities(self, entities: list[dict[str, Any]]) -> Any:
        return await self.call_tool("create_entities", {"entities": entities})

    async def add_observations(self, observations: list[dict[str, Any]]) -> Any:
        return await self.call_tool("add_observations", {"observations": observations})

    async def health(self) -> bool:
        health_url = self.url.rsplit("/mcp", 1)[0] + "/health"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                headers = {}
                if self.token:
                    headers["Authorization"] = f"Bearer {self.token}"
                resp = await client.get(health_url)  # health is public
                return resp.status_code == 200
        except Exception:
            return False


_memory: MemoryMCPClient | None = None
if MEMORY_MCP_ENABLED:
    _memory = MemoryMCPClient(MEMORY_MCP_URL, MCP_AUTH_TOKEN)


def _user_entity(user_id: int) -> str:
    return f"telegram-user:{user_id}"


def _format_memory_block(data: Any) -> str:
    if data is None:
        return ""
    if isinstance(data, str):
        return data.strip()
    try:
        text = json.dumps(data, ensure_ascii=False, indent=2)
    except TypeError:
        text = str(data)
    text = text.strip()
    if not text or text in {"[]", "{}", "null"}:
        return ""
    # Keep prompt bounded
    if len(text) > 2500:
        text = text[:2500] + "\n…"
    return text


async def load_memory_context(user_id: int, query: str) -> str:
    if not _memory:
        return ""
    try:
        parts: list[str] = []
        profile = await _memory.open_nodes([_user_entity(user_id)])
        block = _format_memory_block(profile)
        if block:
            parts.append(f"Профиль пользователя:\n{block}")
        searched = await _memory.search(query[:200] if query else f"user {user_id}")
        sblock = _format_memory_block(searched)
        if sblock and sblock != block:
            parts.append(f"Релевантная память:\n{sblock}")
        return "\n\n".join(parts)
    except Exception:
        log.exception("memory load failed")
        return ""


async def ensure_user_entity(user_id: int, display_name: str | None = None) -> None:
    if not _memory:
        return
    name = _user_entity(user_id)
    observations = [f"telegram_id:{user_id}"]
    if display_name:
        observations.append(f"name:{display_name}")
    try:
        existing = await _memory.open_nodes([name])
        # If empty / missing, create
        empty = (
            existing in (None, [], {}, "")
            or (isinstance(existing, dict) and not existing.get("entities"))
            or (isinstance(existing, list) and len(existing) == 0)
        )
        if empty:
            await _memory.create_entities(
                [{"name": name, "entityType": "Person", "observations": observations}]
            )
        elif display_name:
            await _memory.add_observations(
                [{"entityName": name, "contents": [f"name:{display_name}"]}]
            )
    except Exception:
        log.exception("ensure_user_entity failed")


async def remember_fact(user_id: int, fact: str) -> str:
    if not _memory:
        return "Память отключена."
    fact = fact.strip()
    if not fact:
        return "Пустой факт — ничего не сохранил."
    await ensure_user_entity(user_id)
    await _memory.add_observations(
        [{"entityName": _user_entity(user_id), "contents": [f"fact:{fact}"]}]
    )
    return f"Запомнил: {fact}"


async def remember_turn(user_id: int, user_text: str, answer: str) -> None:
    """Persist a compact note about the turn for future recall."""
    if not _memory:
        return
    try:
        await ensure_user_entity(user_id)
        note = f"Q: {user_text[:240]} | A: {answer[:240]}".replace("\n", " ")
        await _memory.add_observations(
            [{"entityName": _user_entity(user_id), "contents": [f"dialog:{note}"]}]
        )
    except Exception:
        log.exception("remember_turn failed")


async def ask_deepseek(messages: list[dict[str, str]], memory_block: str = "") -> str:
    system = SYSTEM_PROMPT
    if memory_block:
        system = f"{SYSTEM_PROMPT}\n\n# Память\n{memory_block}"
    payload = {
        "model": DEEPSEEK_API_MODEL,
        "messages": [{"role": "system", "content": system}, *messages],
        "temperature": 0.7,
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{DEEPSEEK_API_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


async def reply_long(update: Update, text: str) -> None:
    header_budget = 40
    chunk_limit = max(512, min(TELEGRAM_CHUNK_LIMIT, 4096 - header_budget))
    parts = format_telegram_parts(split_telegram_message(text, chunk_limit))
    for i, part in enumerate(parts):
        if len(part) > 4096:
            for sub in _hard_split(part, 4096):
                try:
                    await update.message.reply_text(sub, parse_mode=ParseMode.MARKDOWN)
                except Exception:
                    await update.message.reply_text(sub)
            continue
        try:
            await update.message.reply_text(part, parse_mode=ParseMode.MARKDOWN)
        except Exception:
            await update.message.reply_text(part)
        log.info("Sent Telegram part %s/%s (%s chars)", i + 1, len(parts), len(part))


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not _allowed(user.id if user else None):
        await update.message.reply_text("Доступ ограничен.")
        return
    chat_id = update.effective_chat.id
    _history[chat_id].clear()
    mem = "включена" if _memory else "выключена"
    if user:
        await ensure_user_entity(user.id, user.full_name)
    await update.message.reply_text(
        "Привет! Я MarvinDeepSeekBot.\n"
        "Пишите вопросы в этот чат — отвечу через DeepSeek.\n"
        f"Память: {mem}.\n"
        "Команды: /clear, /memory, /remember <факт>"
    )


async def cmd_clear(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not _allowed(user.id if user else None):
        return
    _history[update.effective_chat.id].clear()
    await update.message.reply_text("История диалога очищена (долговременная память сохранена).")


async def cmd_memory(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not _allowed(user.id if user else None):
        return
    if not _memory:
        await update.message.reply_text("Память отключена.")
        return
    try:
        ok = await _memory.health()
        data = await _memory.open_nodes([_user_entity(user.id)])
        block = _format_memory_block(data) or "(пока пусто)"
        await reply_long(
            update,
            f"Статус memory-mcp: {'ok' if ok else 'down'}\n\nВаша память:\n{block}",
        )
    except Exception as exc:
        log.exception("cmd_memory failed")
        await update.message.reply_text(f"Не удалось прочитать память: {exc}")


async def cmd_remember(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not _allowed(user.id if user else None):
        return
    fact = " ".join(context.args).strip() if context.args else ""
    if not fact and update.message and update.message.text:
        # /remember fact...
        parts = update.message.text.split(maxsplit=1)
        fact = parts[1].strip() if len(parts) > 1 else ""
    try:
        msg = await remember_fact(user.id, fact)
        await update.message.reply_text(msg)
    except Exception as exc:
        log.exception("cmd_remember failed")
        await update.message.reply_text(f"Не удалось сохранить: {exc}")


async def on_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.message.text:
        return
    user = update.effective_user
    if not _allowed(user.id if user else None):
        await update.message.reply_text("Доступ ограничен.")
        return

    chat_id = update.effective_chat.id
    text = update.message.text.strip()
    if not text:
        return

    await context.bot.send_chat_action(chat_id=chat_id, action=ChatAction.TYPING)
    hist = _history[chat_id]
    hist.append({"role": "user", "content": text})

    memory_block = ""
    if _memory and user:
        await ensure_user_entity(user.id, user.full_name)
        memory_block = await load_memory_context(user.id, text)

    try:
        answer = await ask_deepseek(list(hist), memory_block=memory_block)
    except Exception:
        log.exception("DeepSeek request failed")
        hist.pop()
        await update.message.reply_text(
            "Не удалось получить ответ от DeepSeek. Попробуйте ещё раз."
        )
        return

    hist.append({"role": "assistant", "content": answer})
    await reply_long(update, answer)
    if _memory and user:
        await remember_turn(user.id, text, answer)


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        if self.path.rstrip("/") in ("", "/health"):
            body = (
                b'{"status":"ok","service":"marvindeepseek-bot",'
                + (b'"memory":true}' if _memory else b'"memory":false}')
            )
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        log.debug("health: " + fmt, *args)


def start_health_server() -> None:
    server = ThreadingHTTPServer(("0.0.0.0", PORT), HealthHandler)
    Thread(target=server.serve_forever, daemon=True).start()
    log.info("Health server on :%s", PORT)


def main() -> None:
    if not TELEGRAM_BOT_TOKEN or not DEEPSEEK_API_KEY:
        raise SystemExit("TELEGRAM_BOT_TOKEN and DEEPSEEK_API_KEY are required")
    start_health_server()
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("clear", cmd_clear))
    app.add_handler(CommandHandler("memory", cmd_memory))
    app.add_handler(CommandHandler("remember", cmd_remember))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_text))
    log.info(
        "Starting MarvinDeepSeekBot model=%s memory=%s url=%s chunk_limit=%s",
        DEEPSEEK_API_MODEL,
        "on" if _memory else "off",
        MEMORY_MCP_URL if _memory else "-",
        TELEGRAM_CHUNK_LIMIT,
    )
    app.run_polling(allowed_updates=Update.ALL_TYPES, drop_pending_updates=True)


if __name__ == "__main__":
    main()
