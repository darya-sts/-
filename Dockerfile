FROM ghcr.io/astral-sh/uv:python3.14-trixie-slim

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=0 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH" \
    CONFIG=/app/config \
    CONFIG_DIR=/app/config \
    DATA_DIR=/app/data \
    SKIP_PLAYWRIGHT=1 \
    PORT=8080 \
    LLM_ORDER=deepseek \
    LLM_ORDER_FAST=deepseek \
    DEEPSEEK_API_BASE=https://api.deepseek.com \
    DEEPSEEK_API_MODEL=deepseek-chat|text+structured \
    LANGSMITH_TRACING=false

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock README.md LICENSE.telegram-agent-mcp-client /app/
COPY telegram_agent /app/telegram_agent
COPY config /app/config

RUN uv sync --locked --no-dev \
    && mkdir -p /app/data \
    && useradd --create-home --uid 1000 bot \
    && chown -R bot:bot /app

EXPOSE 8080
USER bot

CMD ["telegram-agent-mcp-client", "--telegram"]
