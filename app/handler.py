import json
from dataclasses import dataclass
from urllib.parse import parse_qs

JSON_CONTENT_TYPE = "application/json; charset=utf-8"
_KNOWN_PATHS = ("/health", "/hello")
_MAX_NAME_LEN = 256


@dataclass(frozen=True)
class Response:
    status: int
    headers: dict[str, str]
    body: bytes


def _json_response(
    status: int,
    payload: dict,
    extra_headers: dict | None = None,
) -> Response:
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    headers = {
        "Content-Type": JSON_CONTENT_TYPE,
        "Content-Length": str(len(body)),
        "Connection": "close",
    }
    if extra_headers:
        headers.update(extra_headers)
    return Response(status=status, headers=headers, body=body)


def _hello_name(query: str) -> str | Response:
    params = parse_qs(query, keep_blank_values=True)
    values = params.get("name")
    if not values:
        return "World"
    name = values[0].strip()
    if not name:
        return "World"
    if len(name) > _MAX_NAME_LEN:
        return _json_response(400, {"error": "name too long"})
    return name


def handle_request(method: str, path: str, query: str) -> Response:
    method = method.upper()
    if path not in _KNOWN_PATHS:
        return _json_response(404, {"error": "not found"})
    if method != "GET":
        return _json_response(
            405,
            {"error": "method not allowed"},
            extra_headers={"Allow": "GET"},
        )
    if path == "/health":
        return _json_response(200, {"status": "ok"})
    name_or_err = _hello_name(query)
    if isinstance(name_or_err, Response):
        return name_or_err
    return _json_response(200, {"message": f"Hello, {name_or_err}!"})
