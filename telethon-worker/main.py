from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
import os

app = FastAPI(title="MarvinBot Telethon Worker")


class ScrapeRequest(BaseModel):
    username: str
    since: str


@app.get("/health")
def health():
    return {"status": "ok", "telethon_configured": bool(os.getenv("TELEGRAM_API_ID"))}


@app.post("/scrape")
async def scrape(req: ScrapeRequest):
    """Парсинг через Telethon, если заданы API_ID/HASH/PHONE. Иначе 503."""
    api_id = os.getenv("TELEGRAM_API_ID")
    api_hash = os.getenv("TELEGRAM_API_HASH")
    if not api_id or not api_hash:
        return {"posts": [], "error": "Telethon credentials not configured"}

    try:
        from telethon import TelegramClient
        from telethon.sessions import StringSession
    except ImportError:
        return {"posts": [], "error": "telethon not installed"}

    since = datetime.fromisoformat(req.since.replace("Z", "+00:00"))
    session = os.getenv("TELEGRAM_SESSION") or StringSession()
    client = TelegramClient(session, int(api_id), api_hash)
    posts = []
    async with client:
        if not await client.is_user_authorized():
            return {"posts": [], "error": "Telethon session not authorized"}
        entity = await client.get_entity(req.username.replace("@", ""))
        async for message in client.iter_messages(entity, limit=50):
            if not message.message:
                continue
            if message.date.replace(tzinfo=since.tzinfo) < since:
                break
            posts.append(
                {
                    "text": message.message,
                    "author": req.username,
                    "publishedAt": message.date.isoformat(),
                    "views": getattr(message, "views", None),
                    "forwards": getattr(message, "forwards", None),
                }
            )
    return {"posts": posts}