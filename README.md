# @suyuyu_bot — Telegram-агент DeepSeek

Telegram-бот [@suyuyu_bot](https://t.me/suyuyu_bot) на базе [telegram-agent-mcp-client](https://github.com/philogicae/telegram-agent-mcp-client).

`/start` показывает кнопки:

- **Задать вопрос** — обычный чат через DeepSeek
- **Обратиться к агенту** — `/writer_agent` пишет пост в канал по ссылкам
- **MCP-агент** — внешние инструменты (`/mcp`, Timeweb, `process_article`)

Обычные сообщения идут в чат DeepSeek (Friendly Agent). Команды `/mcp`, `/agent` и префикс `mcp:` включают MCP.

Writer:

```
/writer_agent https://example.com/a https://example.com/b
```

Агент читает статьи, пишет один пост через DeepSeek и отправляет его **вам на согласование**. «Опубликовать» — в канал, «Отклонить» — нет.

Исходный клиент — лицензия MIT (`LICENSE.telegram-agent-mcp-client`).

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

| Переменная | Назначение |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Токен `@suyuyu_bot` от [@BotFather](https://t.me/BotFather) |
| `DEEPSEEK_API_KEY` | API-ключ DeepSeek для чата и генерации поста |
| `DEEPSEEK_API_MODEL` | Модель, по умолчанию `deepseek-chat\|text+structured` |
| `DEEPSEEK_API_BASE` | `https://api.deepseek.com` |
| `TELEGRAM_CHANNEL_ID` | Канал для публикации: `@name` или `-100…`. Бот должен быть администратором |
| `TIMEWEB_TOKEN` | Необязательно, официальный MCP Timeweb |
| `ALLOWED_USERS` | Дополнительный список числовых Telegram ID |

Файл `.env` в git не попадает.

## Кто может писать боту

Список: `config/allowed_users.txt`. Одна строка — один числовой Telegram ID. Пустой список — бот никому не отвечает.

Текущие ID: `744808663`, `5215421409`, `263935642`.

## /writer_agent

1. `/writer_agent` без ссылок — бот ждёт ссылки следующим сообщением.
2. Несколько URL в одном сообщении (до 8).
3. Черновик приходит в личку с кнопками **Опубликовать** / **Отклонить**.

## Docker Compose

```bash
cp .env.example .env
docker compose up -d --build
```

### Timeweb Cloud Apps

1. Деплой из Docker Compose.
2. Задайте `TELEGRAM_BOT_TOKEN`, `DEEPSEEK_API_KEY`, `TELEGRAM_CHANNEL_ID`.
3. ID пользователей — в `config/allowed_users.txt` или `ALLOWED_USERS`.
4. После смены кода или allowlist нужен **rebuild** образа (настройки запекаются в image).
5. Health-check слушает `8080`.

## Тесты

```bash
python3 -m pip install pytest
pytest
```
