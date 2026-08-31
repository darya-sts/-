import importlib.util
import json
import socket
import urllib.request
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


def _load_health():
    spec = importlib.util.spec_from_file_location(
        "health", ROOT / "telegram_agent" / "src" / "core" / "health.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_yes_no_handler_removed() -> None:
    assert not (ROOT / "bot.py").exists()
    agent_config = (ROOT / "config" / "agent_config.json").read_text(encoding="utf-8")
    assert "InlineKeyboard" not in agent_config
    assert '"да"' not in agent_config
    assert '"нет"' not in agent_config


def test_agent_config_is_suyuyu_deepseek_chat() -> None:
    config = json.loads((ROOT / "config" / "agent_config.json").read_text(encoding="utf-8"))
    prompt = config["agents"]["Friendly Agent"]["prompt"]
    assert "@suyuyu_bot" in prompt
    assert "DeepSeek" in prompt


def test_env_example_has_deepseek_and_telegram() -> None:
    example = (ROOT / ".env.example").read_text(encoding="utf-8")
    assert "DEEPSEEK_API_KEY=" in example
    assert "DEEPSEEK_API_BASE=https://api.deepseek.com" in example
    assert "TELEGRAM_BOT_TOKEN=" in example
    assert "LLM_ORDER=deepseek" in example


def test_compose_passes_deepseek_key() -> None:
    compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    assert "DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}" in compose
    assert "TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}" in compose
    assert "8080:8080" in compose
    assert "image:" not in compose
    assert "network_mode" not in compose
    assert "volumes:" not in compose


def test_llm_registers_deepseek_provider() -> None:
    llm = (ROOT / "telegram_agent" / "src" / "core" / "llm.py").read_text(encoding="utf-8")
    assert '"DEEPSEEK_API_MODEL": "deepseek"' in llm
    assert "DEEPSEEK_API_KEY" in llm
    assert "ChatDeepSeek" in llm


def _load_allowlist():
    spec = importlib.util.spec_from_file_location(
        "allowlist", ROOT / "telegram_agent" / "src" / "core" / "allowlist.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_allowed_users_file_exists() -> None:
    path = ROOT / "config" / "allowed_users.txt"
    assert path.is_file()
    text = path.read_text(encoding="utf-8")
    assert "Telegram ID" in text or "telegram" in text.lower()


def test_empty_allowlist_denies_everyone(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    allowlist = _load_allowlist()
    empty = tmp_path / "allowed_users.txt"
    empty.write_text("# nobody\n", encoding="utf-8")
    monkeypatch.setenv("CONFIG_DIR", str(tmp_path))
    monkeypatch.delenv("ALLOWED_USERS", raising=False)
    assert allowlist.is_user_allowed(123456789) is False
    assert allowlist.is_user_allowed(123456789, "anyone") is False


def test_file_allowlist_accepts_id_and_username(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    allowlist = _load_allowlist()
    (tmp_path / "allowed_users.txt").write_text(
        "123456789\n@My_User\n", encoding="utf-8"
    )
    monkeypatch.setenv("CONFIG_DIR", str(tmp_path))
    monkeypatch.delenv("ALLOWED_USERS", raising=False)
    assert allowlist.is_user_allowed(123456789) is True
    assert allowlist.is_user_allowed(999, "my_user") is True
    assert allowlist.is_user_allowed(111, "other") is False


def test_allowed_users_env_extends_file(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    allowlist = _load_allowlist()
    (tmp_path / "allowed_users.txt").write_text("111\n", encoding="utf-8")
    monkeypatch.setenv("CONFIG_DIR", str(tmp_path))
    monkeypatch.setenv("ALLOWED_USERS", "222,@extra")
    assert allowlist.is_user_allowed(111) is True
    assert allowlist.is_user_allowed(222) is True
    assert allowlist.is_user_allowed(333, "extra") is True
    assert allowlist.is_user_allowed(333, "nope") is False


def test_health_port_defaults_to_8080(monkeypatch: pytest.MonkeyPatch) -> None:
    health = _load_health()
    monkeypatch.delenv("PORT", raising=False)
    assert health.health_port() == 8080


def test_health_server_returns_ok() -> None:
    health = _load_health()
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    server = health.start_health_server(port)
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=2) as response:
            assert response.status == 200
            assert response.read() == b"ok"
    finally:
        server.shutdown()
        server.server_close()
