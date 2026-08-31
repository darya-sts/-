# @suyuyu_bot — Telegram Agent + DeepSeek

Чат-бот [@suyuyu_bot](https://t.me/suyuyu_bot) на базе [telegram-agent-mcp-client](https://github.com/philogicae/telegram-agent-mcp-client). Сообщения обрабатывает агент LangGraph Swarm, ответы даёт модель **DeepSeek**.

`/start` и `/help` показывают кнопки **Задать вопрос**, **Что ты умеешь?** и **MCP-агент**.

Обычные сообщения отвечает **DeepSeek**. Внешние MCP-агенты вызываются явно и не подменяют этот чат.

Исходный агент распространяется по лицензии MIT (см. `LICENSE.telegram-agent-mcp-client`).

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

| Переменная | Назначение |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Токен `@suyuyu_bot` от [@BotFather](https://t.me/BotFather) |
| `DEEPSEEK_API_KEY` | API-ключ DeepSeek для чата |
| `DEEPSEEK_API_MODEL` | Модель, по умолчанию `deepseek-chat\|text+structured` |
| `DEEPSEEK_API_BASE` | `https://api.deepseek.com` |
| `LLM_ORDER` / `LLM_ORDER_FAST` | Порядок провайдеров, по умолчанию `deepseek` |
| `MCP_SERVER_URL` | HTTP/SSE URL внешнего MCP-сервера |
| `MCP_SERVER_COMMAND` | Команда stdio MCP-сервера (если нет URL) |
| `MCP_API_KEY` | Необязательный Bearer-ключ для MCP HTTP |
| `MCP_SERVER_NAME` | Имя сервера из env, по умолчанию `env-mcp` |

Файл `.env` в git не попадает.

## Кто может писать боту

Список разрешённых пользователей: `config/allowed_users.txt`.

Одна строка — один числовой Telegram ID. `@username` не принимается. Пустые строки и комментарии с `#` игнорируются. Если список пуст, бот никому не отвечает.

```
123456789
987654321
```

Свой ID можно узнать у [@userinfobot](https://t.me/userinfobot). После правок файла пересоберите контейнер или перезапустите бота.

Дополнительно можно задать `ALLOWED_USERS` в `.env` или в панели Timeweb, через запятую: `123456789,987654321`.

## MCP-агенты

Обычный диалог не меняется. MCP включается только так:

```
/mcp найди заголовок страницы https://example.com
/agent что умеют твои инструменты?
mcp: краткий отчёт по последним новостям
/mcp-tools
```

Сервер задаётся переменными `MCP_SERVER_URL` или `MCP_SERVER_COMMAND`. Дополнительно можно положить JSON в `config/tools/` (см. `config/tools/README.md` и пример `config/tools/mcp/_remote.example.json`). Если сервер не задан, `/mcp` сообщит об этом, а DeepSeek-чат продолжит работать.

## Docker Compose

```bash
cp .env.example .env
docker compose up -d --build
```

### Timeweb Cloud Apps

1. Деплой из Docker Compose, ветка с этим манифестом.
2. В переменных приложения задайте `TELEGRAM_BOT_TOKEN`, `DEEPSEEK_API_KEY` и при необходимости `MCP_SERVER_URL` / `MCP_API_KEY`.
3. Разрешённые пользователи: пропишите ID в `config/allowed_users.txt` (файл попадает в образ при сборке) или в переменную `ALLOWED_USERS`.
4. Хост-порты `80` и `443` не используйте. Health-check слушает `8080`.

## Локальный запуск (Python 3.14 + uv)

```bash
cp .env.example .env
uv sync
uv run telegram-agent-mcp-client --telegram
```

## Тесты

```bash
python3 -m pip install pytest
pytest
```
