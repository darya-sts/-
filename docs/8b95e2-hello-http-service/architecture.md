# Архитектура: 8b95e2-hello-http-service

## Обзор

Минимальный HTTP/1.1 сервис на CPython 3.11+ только со стандартной библиотекой. Вся бизнес-логика сосредоточена в чистой функции `handle_request(method, path, query) -> Response` без сокетов и без глобального состояния. `http.server.HTTPServer` и `BaseHTTPRequestHandler` — тонкая оболочка: разбор строки запроса, вызов handler, запись статуса, заголовков и тела.

Сервис запускается командой `python -m app`, по умолчанию слушает `127.0.0.1:8000` и отвечает JSON на `GET /health` (живость) и `GET /hello` (приветствие). Юнит-тесты вызывают только `handle_request` и не поднимают сервер.

## Компоненты

1. **`app.handler`** — маршрутизация и формирование ответов. Единственное место с правилами FR-2…FR-4 и лимитом длины имени (NFR-3). Не импортирует `http.server`.
2. **`app.__main__`** — чтение `HOST`/`PORT`, создание `HTTPServer`, логирование, обработка SIGINT/SIGTERM, строка `Serving on …`. Класс `AppHandler` делегирует в `handle_request`.
3. **`tests/test_handler.py`** — `unittest.TestCase` против `handle_request` (без `HTTPServer` и без порта 8000).
4. **`README.md`** — описание продукта, требования, запуск, примеры curl, команда тестов.

Зависимости: `__main__` → `handler`; `tests` → `handler`. Циклических зависимостей нет. По отчёту разработчика (execution 3) отклонений от этого плана нет.

## Структура файлов

Финальное дерево реализации (по execution 3 и содержимому репозитория):

```
README.md                 # документ продукта (заменил заглушку)
app/
  __init__.py             # реэкспорт: handle_request, Response
  handler.py              # Response, _json_response, _hello_name, handle_request
  __main__.py             # parse_bind, AppHandler, main(), HOST/PORT, сигналы
tests/
  __init__.py             # пустой пакет
  test_handler.py         # unittest против handle_request
```

Сторонние пакеты, `requirements.txt`, `src/`, `Makefile`, `pyproject.toml` не добавлялись.

## Модели данных

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Response:
    status: int
    headers: dict[str, str]   # имя заголовка -> значение
    body: bytes               # UTF-8 JSON, без завершающего \n
```

JSON-тела (только эти ключи):

- успех `/health`: `{"status":"ok"}`
- успех `/hello`: `{"message":"Hello, <name>!"}`
- ошибки: `{"error":"<code>"}`, где `<code>` — `not found` | `method not allowed` | `name too long`

Сериализация: `json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")`.

Конфиг процесса (локальные переменные в `main` / `parse_bind`):

- `host: str` — `os.environ.get("HOST", "127.0.0.1")`
- `port: int` — `os.environ.get("PORT", "8000")` через `int(...)`; допустимый диапазон 1…65535. Иначе stderr (`Invalid PORT: ...`) и `sys.exit(1)`.

Query `name`: после `urllib.parse.parse_qs(query, keep_blank_values=True)` берётся первое значение списка `name` (уже URL-decoded, UTF-8), затем `str.strip()`. Пустое / только пробелы / ключ отсутствует → `"World"`. Если `len(name) > 256` → HTTP 400.

## API / Интерфейсы

### Чистая функция (контракт для тестов и сервера)

```python
def handle_request(method: str, path: str, query: str) -> Response:
    """
    method: HTTP-метод как в запросе, сравнение без учёта регистра (нормализовать .upper()).
    path: путь без query, как urlparse(...).path (например "/hello").
    query: raw query string без ведущего "?", может быть "".
    """
```

Маршруты (путь сравнивается точно, без нормализации слэшей):

| Условие | status | заголовки | тело |
| --- | --- | --- | --- |
| path `/health`, method GET | 200 | Content-Type, Content-Length, Connection | `{"status":"ok"}` |
| path `/hello`, method GET, name ок | 200 | Content-Type, Content-Length, Connection | `{"message":"Hello, <name>!"}` |
| path `/hello`, method GET, name > 256 символов | 400 | Content-Type, Content-Length, Connection | `{"error":"name too long"}` |
| path `/health` или `/hello`, method не GET | 405 | Content-Type, Content-Length, Connection, Allow: GET | `{"error":"method not allowed"}` |
| любой другой path (включая `/`, `/health/`, `/hello/`) | 404 | Content-Type, Content-Length, Connection | `{"error":"not found"}` |

Обязательные заголовки каждого ответа:

- `Content-Type: application/json; charset=utf-8`
- `Content-Length: <len(body)>` (байты)
- `Connection: close`
- при 405 дополнительно `Allow: GET`

Query на `/health` игнорируется. На `/hello` учитывается только первый `name`.

Примеры:

- GET `/hello` query `` → `{"message":"Hello, World!"}`
- GET `/hello` query `name=` → World
- GET `/hello` query `name=Alice` → `{"message":"Hello, Alice!"}`
- GET `/hello` query `name=%D0%9C%D0%B8%D1%80` → `{"message":"Hello, Мир!"}`
- GET `/hello` query `name=%20` → World
- GET `/hello` query `name=Alice&name=Bob` → Alice

### HTTP-сервер

Класс `AppHandler(BaseHTTPRequestHandler)`:

- `protocol_version = "HTTP/1.1"`
- Методы GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS/TRACE назначаются на `_dispatch` через `setattr` (чтобы не оставлять дефолтный 501).
- В `_dispatch`: `urlparse(self.path)` → `handle_request(self.command, parsed.path, parsed.query)` → запись status/headers/body.
- Лог в stderr: `METHOD PATH STATUS` (path без query).
- Однопоточный `HTTPServer`, не `ThreadingHTTPServer`.

Точка входа `python -m app`:

1. Прочитать HOST/PORT; при невалидном PORT — сообщение в stderr и ненулевой код.
2. `HTTPServer((host, port), AppHandler)`.
3. Одна строка в stdout: `Serving on http://{host}:{port}` (flush).
4. `serve_forever()` до SIGINT/SIGTERM; затем `server_close()`.

## Стек технологий

- Python 3.11+ (CPython). В среде разработки зафиксирован интерпретатор `python3` 3.12.3; команда `python` в PATH этой VM отсутствует.
- Только stdlib: `http.server`, `urllib.parse`, `json`, `os`, `sys`, `signal`, `dataclasses`, `unittest`.
- Запрещено (и не использовано): pip, requirements.txt, venv как шаг, Flask/FastAPI/httpx, Docker, CI, линтеры как обязательная часть.

Выбор `http.server` вместо `wsgiref`: прямой HTTP-адаптер, меньше слоёв; тесты всё равно не ходят в WSGI/сокет.

## Решения и обоснования

- **Чистый handler отдельно от сокета** — unittest вызывает `(method, path, query)` без занятого порта 8000 и без ручного запуска сервера.
- **Пакет `app/` в корне, запуск `python -m app`** — одна очевидная точка входа без Makefile/poetry.
- **Компактный JSON** (`separators=(",", ":")`, `ensure_ascii=False`) — стабильный машинно-проверяемый контракт без лишних полей.
- **Однопоточный `HTTPServer` и `Connection: close`** — не требуется keep-alive и высокая нагрузка (NFR-2).
- **Trailing slash = 404** — однозначный контракт путей (`/health/` и `/hello/` неизвестны).
- **Лимит имени 256 символов** — NFR-3; имя из query не исполняется как код, подставляется в JSON с экранированием.
- **HEAD не поддерживается отдельно (405)** — упрощение минимального сервиса (принятое аналитиком по умолчанию).
- **Не трогать** `.cursor/`, `memory/`, `orchestrator-protocol.md` как часть продукта.
