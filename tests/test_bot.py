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


def test_file_allowlist_accepts_numeric_id_only(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    allowlist = _load_allowlist()
    (tmp_path / "allowed_users.txt").write_text(
        "123456789\n@My_User\nnot-an-id\n", encoding="utf-8"
    )
    monkeypatch.setenv("CONFIG_DIR", str(tmp_path))
    monkeypatch.delenv("ALLOWED_USERS", raising=False)
    assert allowlist.is_user_allowed(123456789) is True
    assert allowlist.is_user_allowed(999) is False
    assert allowlist.normalize_entry("@My_User") == ""
    assert allowlist.normalize_entry("not-an-id") == ""


def test_allowed_users_env_extends_file(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    allowlist = _load_allowlist()
    (tmp_path / "allowed_users.txt").write_text("111\n", encoding="utf-8")
    monkeypatch.setenv("CONFIG_DIR", str(tmp_path))
    monkeypatch.setenv("ALLOWED_USERS", "222,@extra")
    assert allowlist.is_user_allowed(111) is True
    assert allowlist.is_user_allowed(222) is True
    assert allowlist.is_user_allowed(333) is False


def _load_start_menu():
    spec = importlib.util.spec_from_file_location(
        "start_menu", ROOT / "telegram_agent" / "src" / "bot" / "start_menu.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_allowed_users_contains_numeric_id() -> None:
    text = (ROOT / "config" / "allowed_users.txt").read_text(encoding="utf-8")
    ids = [
        line.strip()
        for line in text.splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]
    assert ids == ["744808663", "5215421409", "263935642"]


def test_start_command_matches_bot_suffix() -> None:
    menu = _load_start_menu()
    assert menu.is_start_command("/start") is True
    assert menu.is_start_command("/start@suyuyu_bot") is True
    assert menu.is_start_command("/help") is True
    assert menu.is_start_command("hello") is False


def test_start_menu_has_action_buttons() -> None:
    menu = _load_start_menu()
    titles = [title for title, _ in menu.START_BUTTONS]
    assert titles == ["Обратиться к агенту"]
    assert "/writer_agent" in menu.action_reply("start:agent")
    assert menu.action_reply("unknown") is None
    assert "Timeweb Cloud: задайте TIMEWEB_TOKEN" not in menu.COMMANDS_HELP


def _load_mcp_routing():
    spec = importlib.util.spec_from_file_location(
        "mcp_routing", ROOT / "telegram_agent" / "src" / "core" / "mcp_routing.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_regular_message_is_not_mcp() -> None:
    routing = _load_mcp_routing()
    assert routing.parse_mcp_message("привет, как дела?") is None
    assert routing.parse_mcp_message("/start") is None


def test_parse_mcp_commands() -> None:
    routing = _load_mcp_routing()
    help_req = routing.parse_mcp_message("/mcp")
    assert help_req is not None and help_req.kind == "help"
    query = routing.parse_mcp_message("/mcp найди заголовок")
    assert query is not None and query.kind == "query" and query.query == "найди заголовок"
    alias = routing.parse_mcp_message("/agent@suyuyu_bot тест")
    assert alias is not None and alias.kind == "query" and alias.query == "тест"
    prefix = routing.parse_mcp_message("mcp: открой url")
    assert prefix is not None and prefix.kind == "query" and prefix.query == "открой url"
    tools = routing.parse_mcp_message("/mcp-tools")
    assert tools is not None and tools.kind == "tools"
    tools_alias = routing.parse_mcp_message("/mcptools@suyuyu_bot")
    assert tools_alias is not None and tools_alias.kind == "tools"
    empty_prefix = routing.parse_mcp_message("mcp:")
    assert empty_prefix is not None and empty_prefix.kind == "help"


def test_servers_from_env_url_and_command() -> None:
    routing = _load_mcp_routing()
    assert routing.servers_from_env({}) == {}
    http = routing.servers_from_env(
        {
            "MCP_SERVER_URL": "https://mcp.example/sse",
            "MCP_API_KEY": "secret",
            "MCP_SERVER_NAME": "remote",
        }
    )
    assert http["remote"]["transport"] == "sse"
    assert http["remote"]["headers"]["Authorization"] == "Bearer secret"
    stream = routing.servers_from_env(
        {"MCP_SERVER_URL": "https://mcp.example/mcp"}
    )
    assert stream["env-mcp"]["transport"] == "streamable_http"
    stdio = routing.servers_from_env(
        {"MCP_SERVER_COMMAND": 'npx -y "demo mcp"'}
    )
    assert stdio["env-mcp"]["transport"] == "stdio"
    assert stdio["env-mcp"]["command"] == "npx"
    assert stdio["env-mcp"]["args"] == ["-y", "demo mcp"]
    # URL wins over command so a remote server does not also spawn stdio.
    both = routing.servers_from_env(
        {
            "MCP_SERVER_URL": "https://mcp.example/mcp",
            "MCP_SERVER_COMMAND": "npx -y demo-mcp",
        }
    )
    assert "url" in both["env-mcp"]
    assert "command" not in both["env-mcp"]


def test_mcp_stub_tool_list_and_deepseek_passthrough() -> None:
    """Stub MCP flow: listing tools without a live server; chat stays DeepSeek."""
    routing = _load_mcp_routing()
    assert routing.parse_mcp_message("сколько будет 2+2?") is None
    assert routing.format_tools_status([]) == routing.MCP_NO_TOOLS
    listed = routing.format_tools_status(["search", "fetch"])
    assert "search" in listed and "fetch" in listed
    assert "2" in listed


def test_friendly_agent_has_no_mcp_tools() -> None:
    config = json.loads((ROOT / "config" / "agent_config.json").read_text(encoding="utf-8"))
    assert config["agents"]["Friendly Agent"]["tools"] == []
    assert config["common"]["tools"] == []


def test_env_example_documents_mcp() -> None:
    example = (ROOT / ".env.example").read_text(encoding="utf-8")
    assert "MCP_SERVER_URL=" in example
    assert "MCP_API_KEY=" in example
    assert "TIMEWEB_TOKEN=" in example


def test_timeweb_mcp_is_installed() -> None:
    routing = _load_mcp_routing()
    path = ROOT / "config" / "tools" / "mcp" / "timeweb.json"
    config = json.loads(path.read_text(encoding="utf-8"))
    assert config["url"] == routing.TIMEWEB_MCP_URL
    assert config["headers"]["Authorization"] == "Bearer {ENV:TIMEWEB_TOKEN}"
    compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    assert "TIMEWEB_TOKEN: ${TIMEWEB_TOKEN:-}" in compose
    assert "Timeweb Cloud: задайте TIMEWEB_TOKEN" not in routing.MCP_HELP
    assert "MCP_SERVER_URL / MCP_SERVER_COMMAND / MCP_API_KEY" not in routing.MCP_HELP
    raw = path.read_text(encoding="utf-8")
    assert "{ENV:TIMEWEB_TOKEN}" in raw
    stdio_example = ROOT / "config" / "tools" / "mcp" / "_timeweb_stdio.example.json"
    assert stdio_example.is_file()
    assert stdio_example.name.startswith("_")


def _load_deepseek_article():
    spec = importlib.util.spec_from_file_location(
        "deepseek_article", ROOT / "mcp_servers" / "deepseek_article.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_deepseek_mcp_server_is_wired() -> None:
    config = json.loads(
        (ROOT / "config" / "tools" / "mcp" / "deepseek.json").read_text(encoding="utf-8")
    )
    assert config["command"] == "python"
    assert config["args"] == ["mcp_servers/deepseek_server.py"]
    assert "{ENV:DEEPSEEK_API_KEY}" in config["env"]["DEEPSEEK_API_KEY"]
    dockerfile = (ROOT / "Dockerfile").read_text(encoding="utf-8")
    assert "COPY mcp_servers /app/mcp_servers" in dockerfile
    assert (ROOT / "mcp_servers" / "deepseek_server.py").is_file()


def test_article_message_routes_to_mcp() -> None:
    routing = _load_mcp_routing()
    sample = "обработай статью https://example.com/some-article и напиши пост"
    assert routing.parse_mcp_message(sample) is None


def _load_writer_agent():
    spec = importlib.util.spec_from_file_location(
        "writer_agent", ROOT / "telegram_agent" / "src" / "core" / "writer_agent.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_writer_agent_parses_multiple_urls() -> None:
    writer = _load_writer_agent()
    help_req = writer.parse_writer_message("/writer_agent")
    assert help_req is not None and help_req.kind == "await"
    run = writer.parse_writer_message(
        "/writer_agent@suyuyu_bot https://a.example/x https://b.example/y"
    )
    assert run is not None and run.kind == "run"
    assert run.urls == ["https://a.example/x", "https://b.example/y"]
    assert writer.parse_writer_message("просто текст") is None
    urls = writer.extract_urls(
        "смотри https://one.test/a, и ещё https://two.test/b."
    )
    assert urls == ["https://one.test/a", "https://two.test/b"]


def test_writer_draft_approval_cycle() -> None:
    writer = _load_writer_agent()
    draft_id = writer.save_draft(user_id=744808663, text="Пост", urls=["https://a.test"])
    assert writer.parse_writer_callback(f"writer:ok:{draft_id}") == ("ok", draft_id)
    assert writer.parse_writer_callback(f"writer:no:{draft_id}") == ("no", draft_id)
    assert writer.get_draft(draft_id)["text"] == "Пост"
    assert writer.pop_draft(draft_id)["user_id"] == 744808663
    assert writer.get_draft(draft_id) is None


def test_channel_id_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    writer = _load_writer_agent()
    monkeypatch.delenv("TELEGRAM_CHANNEL_ID", raising=False)
    monkeypatch.delenv("TELEGRAM_CHANNEL", raising=False)
    assert writer.channel_chat_id() is None
    monkeypatch.setenv("TELEGRAM_CHANNEL_ID", "@my_channel")
    assert writer.channel_chat_id() == "@my_channel"
    monkeypatch.setenv("TELEGRAM_CHANNEL_ID", "-100123")
    assert writer.channel_chat_id() == -100123


def test_compose_passes_channel_id() -> None:
    compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    assert "TELEGRAM_CHANNEL_ID: ${TELEGRAM_CHANNEL_ID:-}" in compose
    example = (ROOT / ".env.example").read_text(encoding="utf-8")
    assert "TELEGRAM_CHANNEL_ID=" in example


def test_extract_article_and_process_without_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    article = _load_deepseek_article()
    html = (
        b"<html><head><script>secret()</script><title>Hi</title></head>"
        b"<body><p>Hello world</p></body></html>"
    )

    class _Headers:
        def get_content_charset(self) -> str:
            return "utf-8"

    class _Resp:
        headers = _Headers()

        def read(self, _n: int = -1) -> bytes:
            return html

        def __enter__(self):
            return self

        def __exit__(self, *_args: object) -> None:
            return None

    monkeypatch.setattr(article, "_trafilatura_extract", lambda _url: None)
    monkeypatch.setattr(article, "urlopen", lambda *a, **k: _Resp())
    text = article.extract_article_text("https://example.com/post")
    assert "Hello world" in text
    assert "secret" not in text
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)
    assert article.generate_post("text") == "DEEPSEEK_API_KEY не задан."
    assert article.process_article("not-a-url").startswith("Нужен ")
    post, errors = article.process_articles([])
    assert post == ""
    assert errors


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
