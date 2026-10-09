"""UI sprint 111: server configuration has one source, and what a session is created with reaches it.

Each test is one lens-audit finding:
- F316 / N004: a session's role prompt reaches its record, resolved against its own workspace;
- F305: a failed Ollama capability probe is not cached for the life of the process;
- F063: the server's default address is the one the CLI's TCP fallback dials;
- F307: the curated Claude catalog defaults to the current Claude 5 models;
- F341: the demo-record generator has no default output directory.
"""

from __future__ import annotations

import asyncio
import subprocess
import sys
from pathlib import Path

import pytest
from _serving import call, serving  # noqa: E402
from substrate import api
from substrate.app import daemon_client

import server  # noqa: E402

REPO = Path(__file__).resolve().parent.parent


@pytest.fixture
def base(app: server.App, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> str:
    app.install_registry(tmp_path / "sessions")
    monkeypatch.setattr(server, "_sessions_base", lambda: tmp_path / "sessions")
    with serving(app) as url:
        yield url


def test_a_workspace_role_prompt_rides_the_record(
    app: server.App, base: str, tmp_path: Path
) -> None:
    ws = tmp_path / "ws"
    (ws / ".substrate" / "prompts").mkdir(parents=True)
    prompt = ws / ".substrate" / "prompts" / "auditor.md"
    prompt.write_text("You audit ledgers.\n")
    status, created = call(
        "POST",
        base + "/api/session",
        {"driver": "deterministic", "workspace": str(ws), "role": "auditor"},
    )
    assert status == 200, created
    sid = created["session_id"]
    status, turn = call("POST", base + f"/api/session/{sid}/turn", {"text": "hello"})
    assert status == 200, turn
    manifest = app.registry.get(sid)
    fragments = [
        e["payload"]
        for e in api.read_record(Path(manifest.record_root))
        if e["kind"] == "PromptFragment" and e["payload"]["source"] == "role"
    ]
    assert len(fragments) == 1, "the role producer never ran"
    assert fragments[0]["text"] == "You audit ledgers.\n"
    assert fragments[0]["provenance"]["resolved_from"] == str(prompt)


def test_a_role_only_in_the_server_cwd_is_refused(
    base: str, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    cwd = tmp_path / "server-cwd"
    (cwd / ".substrate" / "prompts").mkdir(parents=True)
    (cwd / ".substrate" / "prompts" / "cwd-only.md").write_text("from the server cwd\n")
    monkeypatch.chdir(cwd)
    ws = tmp_path / "ws"
    ws.mkdir()
    status, body = call(
        "POST",
        base + "/api/session",
        {"driver": "deterministic", "workspace": str(ws), "role": "cwd-only"},
    )
    assert status == 400, body


def test_a_failed_thinking_probe_is_not_cached(
    app: server.App, monkeypatch: pytest.MonkeyPatch
) -> None:
    import urllib.request

    def unreachable(*_a: object, **_k: object) -> object:
        raise OSError("connection refused")

    monkeypatch.setattr(urllib.request, "urlopen", unreachable)
    app.model_thinking_cache.pop("probe-test:1b", None)
    assert server._model_supports_thinking(app, "probe-test:1b") is True
    assert "probe-test:1b" not in app.model_thinking_cache


def test_the_default_address_is_the_cli_fallback(monkeypatch: pytest.MonkeyPatch) -> None:
    assert (server.HOST, server.PORT) == daemon_client.tcp_host_port()
    env = {"SUBSTRATE_DAEMON_HOST": "127.0.0.1", "SUBSTRATE_DAEMON_PORT": "9123"}
    out = subprocess.run(
        [sys.executable, "-c", "import server; print(server.HOST, server.PORT)"],
        cwd=REPO,
        env={**__import__("os").environ, **env},
        capture_output=True,
        text=True,
        check=True,
    ).stdout.split()
    assert out == ["127.0.0.1", "9123"]


def test_the_claude_catalog_defaults_to_the_current_models() -> None:
    families = {f["id"]: f for f in server.KNOWN_CLI_ADAPTERS["claude"]["versions"]}
    for family, model in (("opus", "claude-opus-5-5"), ("sonnet", "claude-sonnet-5-5")):
        pin = families[family]["default_pin"]
        flags = {p["id"]: p["flag"] for p in families[family]["pins"]}
        assert flags[pin] == ["--model", model]


def test_demo_records_need_an_explicit_directory() -> None:
    proc = subprocess.run(
        [sys.executable, str(REPO / "gen_demo_records.py")],
        cwd=REPO,
        capture_output=True,
        text=True,
    )
    assert proc.returncode != 0
    assert "usage: gen_demo_records.py <runs-dir>" in proc.stderr


def test_the_records_index_rereads_only_a_changed_record(
    app: server.App, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from msgspec import Struct

    class Tick(Struct, frozen=True):
        n: int

    async def _tick(_inp: object):  # type: ignore[no-untyped-def]
        yield Tick(n=1)

    def topo(b: api.TopologyBuilder) -> None:
        b.producer_kind(
            "t", schemas=[Tick], schema_version=1, factory=lambda: _tick, deterministic=True
        )
        b.initial("t", input={})
        b.termination(api.threshold_count("Tick", 1))

    runs = tmp_path / "runs"
    for name in ("one", "two"):
        asyncio.run(api.Runtime(runs / f"{name}.record").run(topo))
    monkeypatch.setattr(server, "_runs_dir", lambda: runs)
    monkeypatch.setattr(server.bundled, "names", lambda: [])
    setattr(app, "record_summary_cache", {})

    reads: list[str] = []
    real_read = api.read_record

    def counting(path, *a, **k):  # type: ignore[no-untyped-def]
        reads.append(Path(path).stem)
        return real_read(path, *a, **k)

    monkeypatch.setattr(server.api, "read_record", counting)
    first = server._records_index(app)
    assert sorted(reads) == ["one", "two"]
    reads.clear()
    assert server._records_index(app) == first
    assert reads == [], "an unchanged record was re-read"

    seg = sorted((runs / "two.record").glob("events-*.jsonl"))[-1]
    with seg.open("ab") as f:
        f.write(b"")  # same bytes; bump only the mtime
    import os

    st = seg.stat()
    os.utime(seg, ns=(st.st_atime_ns, st.st_mtime_ns + 1_000_000))
    server._records_index(app)
    assert reads == ["two"]


def test_the_agent_bridge_refuses_an_unknown_model(app: server.App, base: str) -> None:
    """F298: an unknown model ran the deterministic stub without a word."""
    status, body = call("POST", base + "/api/agent?model=codex-typo&task=hi")
    assert status == 400, body
    assert "unknown model 'codex-typo'" in body["error"]
    assert app.registry.list_all() == []
    status, body = call("POST", base + "/api/agent?model=deterministic&task=hi")
    assert status == 200, body


def test_two_apps_share_no_state(tmp_path: Path) -> None:
    """F318/F412: each server answers from the App it was built with; nothing is module-wide."""
    one, two = server.App(), server.App()
    one.install_registry(tmp_path / "one")
    two.install_registry(tmp_path / "two")
    with serving(one) as url_one, serving(two) as url_two:
        status, created = call("POST", url_one + "/api/session", {"driver": "deterministic"})
        assert status == 200, created
        assert [m.session_id for m in one.registry.list_all()] == [created["session_id"]]
        assert two.registry.list_all() == []
        status, listed = call("GET", url_two + "/api/session")
        assert status == 200 and created["session_id"] not in str(listed)
