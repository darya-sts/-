# @suyuyu_bot — агент постов в канал

Telegram-бот [@suyuyu_bot](https://t.me/suyuyu_bot) на базе [telegram-agent-mcp-client](https://github.com/philogicae/telegram-agent-mcp-client).

`/start` показывает кнопку **Обратиться к агенту**. По нажатию бот присылает список команд. Основной агент:

```
/writer_agent https://example.com/a https://example.com/b
```

Агент читает статьи, пишет один пост через DeepSeek и отправляет его **вам на согласование**. «Опубликовать» — в канал, «Отклонить» — нет.

Обычного чата с DeepSeek нет.

Исходный клиент — лицензия MIT (`LICENSE.telegram-agent-mcp-client`).

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

| Переменная | Назначение |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Токен `@suyuyu_bot` от [@BotFather](https://t.me/BotFather) |
| `DEEPSEEK_API_KEY` | API-ключ DeepSeek для генерации поста |
| `DEEPSEEK_API_MODEL` | Модель, по умолчанию `deepseek-chat\|text+structured` |
| `DEEPSEEK_API_BASE` | `https://api.deepseek.com` |
| `TELEGRAM_CHANNEL_ID` | Канал для публикации: `@name` или `-100…`. Бот должен быть администратором |
| `TIMEWEB_TOKEN` | Необязательно, официальный MCP Timeweb |
| `ALLOWED_USERS` | Дополнительный список числовых Telegram ID |

Файл `.env` в git не попадает.

## Кто может писать боту

Список: `config/allowed_users.txt`. Одна строка — один числовой Telegram ID. Пустой список — бот никому не отвечает.

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
4. Health-check слушает `8080`.

## Тесты

```bash
python3 -m pip install pytest
pytest
```

## Cursor Telegram Bot (Hormold)

Отдельный Node.js-бот [Hormold/cursor-telegram-bot](https://github.com/Hormold/cursor-telegram-bot) лежит в `cursor-telegram-bot/`. Это **другой** бот (Grammy): управление Cursor Background Agents, не замена `@suyuyu_bot`.

Нужны переменные: `BOT_TOKEN`, `CURSOR_API_KEY`, `OPENROUTER_API_KEY`.

```bash
cd cursor-telegram-bot
pnpm install
pnpm test
pnpm run build
pnpm start
```

`pnpm` 10 не собирает native-модули сам: для SQLite нужен `better-sqlite3` (`npm run build-release` в его каталоге). Без реального `BOT_TOKEN` Telegram отвечает `401 Unauthorized` на `getMe`.
