# @suyuyu_bot — Telegram Agent + DeepSeek

Чат-бот [@suyuyu_bot](https://t.me/suyuyu_bot) на базе [telegram-agent-mcp-client](https://github.com/philogicae/telegram-agent-mcp-client). Сообщения обрабатывает агент LangGraph Swarm, ответы даёт модель **DeepSeek**.

`/start` и `/help` показывают кнопки **Задать вопрос** и **Что ты умеешь?**. Дальше бот ведёт обычный диалог.

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

## Docker Compose

```bash
cp .env.example .env
docker compose up -d --build
```

### Timeweb Cloud Apps

1. Деплой из Docker Compose, ветка с этим манифестом.
2. В переменных приложения задайте `TELEGRAM_BOT_TOKEN` и `DEEPSEEK_API_KEY`.
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
