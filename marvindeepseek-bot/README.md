# MarvinDeepSeekBot

Telegram-бот на DeepSeek API с памятью (Memory MCP), приёмом файлов, OCR, голосовыми сообщениями, генерацией PDF/Word/Excel и **чтением проектов** рабочей среды Cursor (`project_reader`).

## Возможности

- Текст ↔ DeepSeek + история диалога
- Долговременная память через `memory-mcp`
- Файлы: PDF, Word, Excel/CSV, изображения (OCR), TXT/MD, ZIP
- Голосовые сообщения (ffmpeg + SpeechRecognition)
- Генерация ответов в PDF / DOCX / XLSX
- Уточнение формата для промтов (inline-кнопки Текст/PDF)
- Сплит длинных ответов под лимит Telegram
- Allowlist пользователей, дневной лимит файлов, базовая проверка magic bytes
- **Чтение проектов**: `/projects` `/tree` `/cat` `/grep` `/stats`

## Структура

```text
marvindeepseek-bot/
  bot.py
  config.py
  handlers/
  services/
  project_reader/
    models.py
    scanner.py
    indexer.py
    reader.py
    service.py
  tests/
  fonts/
  downloads/
  logs/
  data/
  Dockerfile
  docker-compose.yml
  requirements.txt
```

## Установка (локально)

```bash
cd marvindeepseek-bot
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # заполнить токены и ALLOWED_USERS
python bot.py
```

Тесты:

```bash
cd marvindeepseek-bot
pytest -q
```

## Docker

```bash
cd marvindeepseek-bot
cp .env.example .env
docker network create agent-shared || true
docker compose up -d --build
curl http://127.0.0.1:8082/health
```

В compose по умолчанию монтируются `/workspace` и `/opt/my_services` (ro) и задаётся `ALLOWED_ROOTS`.

## Переменные окружения

| Переменная | Описание |
|---|---|
| `TELEGRAM_BOT_TOKEN` | токен BotFather |
| `DEEPSEEK_API_KEY` | ключ DeepSeek |
| `ALLOWED_USERS` | CSV Telegram user id (обязательно для прод) |
| `ADMIN_CHAT_IDS` | critical errors |
| `ALLOWED_ROOTS` | CSV абсолютных корней для чтения проектов |
| `PROJECT_INDEX_DB` | путь к SQLite-индексу (по умолчанию `./data/index.db`) |
| `PROJECT_READER_MAX_FILE_BYTES` | лимит файла (1 МБ) |
| `PROJECT_READER_MAX_CHARS` | обрезка `/cat` (4000) |
| `PROJECT_READER_GREP_LIMIT` | лимит совпадений grep |
| `MEMORY_MCP_*` / `MCP_AUTH_TOKEN` | память |

Если `ALLOWED_ROOTS` пуст, по умолчанию: родитель каталога бота + сам каталог бота.

## Команды

- `/start` `/help` `/file`
- `/clear` — очистить историю чата
- `/memory` `/remember <факт>`
- `/projects` — список проектов под `ALLOWED_ROOTS`
- `/tree <project> [глубина]` — дерево файлов
- `/cat <project> <path>` — содержимое файла (до 4000 символов, частями)
- `/grep <project> <pattern>` — regex-поиск по текстовым файлам
- `/stats <project>` — число файлов, размер, топ-10

Секреты (`.env`, `*.pem`, `*.key`, `id_rsa*`, `credentials*`) не читаются. Аудит: `logs/reader.log`.

## Примеры

```text
/projects
/tree forge-mill-src 3
/cat forge-mill-src README.md
/grep forge-mill-src ALLOWED_USERS
/stats forge-mill-src
```

## Логи

- `logs/bot.log` — общий лог
- `logs/reader.log` — аудит чтения файлов
