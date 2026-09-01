"""Fetch a web article and ask DeepSeek to write a Telegram post.

This module has no MCP imports so tests can load it on Python 3.12.
"""

from __future__ import annotations

import json
import os
import re
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

MAX_ARTICLE_CHARS = 5000
MAX_COMBINED_CHARS = 12000
MAX_URLS = 8
USER_AGENT = "suyuyu-bot/1.0 (+https://t.me/suyuyu_bot)"


class _VisibleText(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._skip = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "noscript", "svg"}:
            self._skip += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript", "svg"} and self._skip:
            self._skip -= 1

    def handle_data(self, data: str) -> None:
        if self._skip:
            return
        text = " ".join(data.split())
        if text:
            self.parts.append(text)


def _html_to_text(html: str) -> str:
    parser = _VisibleText()
    parser.feed(html)
    return "\n".join(parser.parts)


def _trafilatura_extract(url: str) -> str | None:
    try:
        import trafilatura

        downloaded = trafilatura.fetch_url(url)
        if downloaded:
            text = trafilatura.extract(downloaded)
            if text:
                return text[:MAX_ARTICLE_CHARS]
    except Exception:
        return None
    return None


def extract_article_text(url: str) -> str:
    """Download a page and return the main visible text (up to MAX_ARTICLE_CHARS)."""
    url = (url or "").strip()
    if not re.match(r"^https?://", url, re.I):
        return "Нужен http(s) URL статьи."
    extracted = _trafilatura_extract(url)
    if extracted:
        return extracted

    req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    try:
        with urlopen(req, timeout=20) as resp:
            raw = resp.read(2_000_000)
            charset = resp.headers.get_content_charset() or "utf-8"
    except (HTTPError, URLError, TimeoutError, ValueError) as exc:
        return f"Ошибка загрузки страницы: {exc}"
    html = raw.decode(charset, errors="replace")
    text = _html_to_text(html).strip()
    if not text:
        return "Не удалось извлечь текст."
    return text[:MAX_ARTICLE_CHARS]


def _model_name() -> str:
    raw = os.getenv("DEEPSEEK_API_MODEL", "deepseek-chat")
    return raw.split("|", 1)[0].strip() or "deepseek-chat"


def _completions_url() -> str:
    base = (os.getenv("DEEPSEEK_API_BASE") or "https://api.deepseek.com").rstrip("/")
    if base.endswith("/v1"):
        return f"{base}/chat/completions"
    return f"{base}/chat/completions"


def generate_post(text: str, style: str = "telegram") -> str:
    """Ask DeepSeek to write a channel post from article text."""
    api_key = (os.getenv("DEEPSEEK_API_KEY") or "").strip()
    if not api_key:
        return "DEEPSEEK_API_KEY не задан."
    prompt = (
        f"Напиши один готовый пост для Telegram-канала в стиле {style}. "
        "Если источников несколько, объедини главное в один текст. "
        "Без заголовка «Пост», без преамбулы, без хештегов-воды. "
        "Только текст, который можно сразу опубликовать.\n\n"
        f"{text}"
    )
    payload = {
        "model": _model_name(),
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 1500,
    }
    body = json.dumps(payload).encode("utf-8")
    req = Request(
        _completions_url(),
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(req, timeout=60) as resp:
            raw = resp.read()
    except (HTTPError, URLError, TimeoutError) as exc:
        detail = ""
        if isinstance(exc, HTTPError):
            detail = exc.read().decode("utf-8", errors="replace")[:300]
        return f"Ошибка DeepSeek API: {exc} {detail}".strip()
    data = json.loads(raw.decode("utf-8"))
    choices = data.get("choices") or []
    if not choices:
        return "DeepSeek не вернул текст поста."
    content = (choices[0].get("message") or {}).get("content") or ""
    return str(content).strip() or "DeepSeek не вернул текст поста."


def process_article(url: str, style: str = "telegram") -> str:
    """Fetch an article URL and generate a Telegram post with DeepSeek."""
    article_text = extract_article_text(url)
    if article_text.startswith(("Нужен ", "Ошибка ", "Не удалось ")):
        return article_text
    return generate_post(article_text, style)


def process_articles(
    urls: list[str], style: str = "telegram"
) -> tuple[str, list[str]]:
    """Fetch several articles and write one combined Telegram post."""
    unique: list[str] = []
    seen: set[str] = set()
    for url in urls:
        item = (url or "").strip()
        if not item or item in seen:
            continue
        seen.add(item)
        unique.append(item)
        if len(unique) >= MAX_URLS:
            break
    if not unique:
        return "", ["Пришлите хотя бы одну ссылку на статью."]

    chunks: list[str] = []
    errors: list[str] = []
    for url in unique:
        article_text = extract_article_text(url)
        if article_text.startswith(("Нужен ", "Ошибка ", "Не удалось ")):
            errors.append(f"{url}: {article_text}")
            continue
        chunks.append(f"Источник: {url}\n{article_text}")
    if not chunks:
        return "", errors
    combined = "\n\n---\n\n".join(chunks)[:MAX_COMBINED_CHARS]
    post = generate_post(combined, style)
    return post, errors
