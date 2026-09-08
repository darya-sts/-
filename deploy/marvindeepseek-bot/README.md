# MarvinDeepSeekBot

Отдельный Telegram-бот для переписки через DeepSeek.

- Бот: [@MarvinDeepSeek_Bot](https://t.me/MarvinDeepSeek_Bot)
- Режим: вопрос в чат → ответ в том же чате
- Модель по умолчанию: `deepseek-chat`

## Переменные окружения

Скопируйте `.env.example` → `.env`:

| Переменная | Назначение |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | токен BotFather |
| `DEEPSEEK_API_KEY` | ключ DeepSeek API |
| `DEEPSEEK_API_MODEL` | `deepseek-chat` (по умолчанию) |
| `ALLOWED_USERS` | Telegram user ID через запятую; пусто = без ограничений |
| `PORT` | health-check порт, по умолчанию `8082` |

## Запуск на VPS

```bash
cd /opt/my_services/marvindeepseek-bot
cp .env.example .env   # заполнить секреты
docker compose up -d --build
curl -s http://127.0.0.1:8082/health
```

Команды в Telegram: `/start`, `/clear`.

## Memory MCP

Бот подключается к `memory-mcp` по Docker-сети `agent-shared`.

Env:
- `MEMORY_MCP_ENABLED=1`
- `MEMORY_MCP_URL=http://memory-mcp:3000/mcp`
- `MCP_AUTH_TOKEN=<token from memory-mcp .env>`

Команды Telegram: `/memory`, `/remember <факт>`.
