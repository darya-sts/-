# Hello HTTP Service

Minimal local HTTP/1.1 service that answers `GET /health` and `GET /hello`. Built with Python’s standard library only.

## Requirements

- Python 3.11 or newer (CPython)
- Standard library only — no `pip install`, virtualenv, or third-party packages

## Run the server

From the repository root:

```bash
python -m app
```

By default the process listens on `127.0.0.1:8000` and prints:

```text
Serving on http://127.0.0.1:8000
```

Override bind address and port with environment variables:

```bash
HOST=127.0.0.1 PORT=9000 python -m app
```

`PORT` must be an integer in the range 1–65535. An invalid value prints an error to stderr and exits with a non-zero status.

Stop the server with Ctrl+C (SIGINT) or SIGTERM.

## Check with curl

Liveness:

```bash
curl -s http://127.0.0.1:8000/health
```

Expected: `{"status":"ok"}`

Greeting without a name (defaults to World):

```bash
curl -s http://127.0.0.1:8000/hello
```

Expected: `{"message":"Hello, World!"}`

Greeting with a name:

```bash
curl -s "http://127.0.0.1:8000/hello?name=Ada"
```

Expected: `{"message":"Hello, Ada!"}`

## Tests

From the repository root, with no extra packages:

```bash
python -m unittest discover -s tests -v
```
