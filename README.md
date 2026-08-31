# Telegram-бот: да / нет

Минимальный бот: команда `/start` показывает две кнопки — **да** и **нет**.

- **да** → бот отвечает `привет`
- **нет** → бот отвечает `пока`

## Запуск

1. Создайте бота в Telegram через [@BotFather](https://t.me/BotFather) и скопируйте токен.
2. Установите зависимости:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
```

3. Задайте токен и запустите бота:

```bash
export TELEGRAM_BOT_TOKEN="ваш_токен"
python bot.py
```

Токен не храните в репозитории. Можно скопировать `.env.example` в `.env` и подставить значение локально.

## Docker

Скопируйте `.env.example` в `.env` и подставьте токен:

```bash
cp .env.example .env
```

Запуск через Docker Compose:

```bash
docker compose up -d --build
```

Логи и остановка:

```bash
docker compose logs -f bot
docker compose down
```

Сборка и запуск без Compose:

```bash
docker build -t tg-bot .
docker run --rm -e TELEGRAM_BOT_TOKEN="ваш_токен" -p 8080:8080 tg-bot
```

### Timeweb Cloud Apps

`Dockerfile` и `docker-compose.yml` лежат в корне репозитория. В панели Apps:

1. Тип деплоя — Docker Compose, ветка с этим манифестом.
2. В переменных приложения задайте `TELEGRAM_BOT_TOKEN` (файл `.env` в git не попадает).
3. Не указывайте хост-порты `80` и `443` — платформа их резервирует. У сервиса открыт `8080` для health-check.

## Тесты

```bash
pytest
```
