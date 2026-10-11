"""UI sprint 129: harness drivers stream their tool calls and take Substrate's tools over MCP.

Each harness profile names its stream format and flags (kernel K283) and how its CLI takes an MCP
server (kernel K284). The daemon's `POST /api/session/<id>/mcp` hands JSON-RPC to the kernel.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from _serving import call, serving
from substrate.adapters import CliResponder

import server


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> str:
    app.install_registry(base=tmp_path)
    with serving(app) as url:
        yield url


def test_each_harness_profile_streams() -> None:
    expected = {
        "claude": ("claude-stream-json", ["--output-format", "stream-json", "--verbose"]),
        "codex": ("codex-json", ["--json"]),
        "cursor-agent": ("cursor-stream-json", ["--output-format", "stream-json"]),
    }
    for name, (fmt, flags) in expected.items():
        profile = server.KNOWN_CLI_ADAPTERS[name]
        assert (profile["stream_format"], profile["stream_flags"]) == (fmt, flags)


def test_the_resolver_builds_a_streaming_responder(app: server.App) -> None:
    responder = server._daemon_driver_resolver(app, "codex", workspace="/tmp")
    assert isinstance(responder, CliResponder) and responder.stream_format == "codex-json"
    assert responder._argv("P", "")[-2:] == ["--json", "P"]


def test_mcp_flags_per_driver(
    app: server.App, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    app.mcp_base = "http://127.0.0.1:9999"
    url = "http://127.0.0.1:9999/api/session/s_1/mcp"
    flags = server._mcp_flags(app, "claude", "s_1")
    assert flags[0] == "--mcp-config"
    assert json.loads(flags[1]) == {"mcpServers": {"substrate": {"type": "http", "url": url}}}
    assert server._mcp_flags(app, "codex", "s_1") == ["-c", f'mcp_servers.substrate.url="{url}"']
    # No session, no TCP address, or an Ollama model: no MCP.
    assert server._mcp_flags(app, "claude", None) == []
    assert server._mcp_flags(app, "kimi-k2.7-code:cloud", "s_1") == []
    app.mcp_base = None
    assert server._mcp_flags(app, "claude", "s_1") == []


def test_cursor_gets_mcp_only_in_a_per_session_sandbox(
    app: server.App, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """cursor-agent reads MCP servers only from `.cursor/mcp.json` in its workspace (a parent
    folder's was not read, tested 2026-10-10). Substrate writes that file only where Substrate
    alone works: a per-session sandbox. A folder the operator picked gets the stream only."""
    app.mcp_base = "http://127.0.0.1:9999"
    sessions = tmp_path / "sessions"
    monkeypatch.setattr(server, "_sessions_base", lambda: sessions)
    sandbox = sessions / "s_1" / "workspace"
    sandbox.mkdir(parents=True)
    picked = tmp_path / "my-repo"
    picked.mkdir()
    assert server._mcp_flags(app, "cursor-agent", "s_1", str(sandbox)) == ["--approve-mcps"]
    assert server._mcp_flags(app, "cursor-agent", "s_1", str(picked)) == []
    server._write_mcp_config(app, "cursor-agent", "s_1", str(sandbox))
    server._write_mcp_config(app, "cursor-agent", "s_1", str(picked))
    config = json.loads((sandbox / ".cursor" / "mcp.json").read_text())
    assert config == {
        "mcpServers": {"substrate": {"url": "http://127.0.0.1:9999/api/session/s_1/mcp"}}
    }
    assert not (picked / ".cursor").exists()


def test_the_mcp_endpoint(app: server.App, base: str) -> None:
    status, body = call(
        "POST",
        base + "/api/session/s_nope/mcp",
        {"jsonrpc": "2.0", "id": 1, "method": "initialize"},
    )
    assert status == 404, body
    _s, created = call("POST", base + "/api/session", {"driver": "deterministic"})
    sid = created["session_id"]
    status, body = call(
        "POST",
        base + f"/api/session/{sid}/mcp",
        {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
    )
    assert status == 200 and body["result"]["serverInfo"]["name"] == "substrate"
    status, _body = call(
        "POST",
        base + f"/api/session/{sid}/mcp",
        {"jsonrpc": "2.0", "method": "notifications/initialized"},
    )
    assert status == 202
    # No harness step is running, so a call is refused, not left waiting.
    status, body = call(
        "POST",
        base + f"/api/session/{sid}/mcp",
        {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {"name": "write_file", "arguments": {}},
        },
    )
    assert status == 200 and body["error"]["code"] == -32000


def test_the_daemon_knows_its_address(app: server.App, base: str) -> None:
    assert app.mcp_base == base.rstrip("/")
