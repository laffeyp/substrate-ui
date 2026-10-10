"""Sprint 114: a session on a CLI driver runs the CLI in that session's workspace.

The CLI is a stand-in that prints its working directory, so each turn's ModelReply is the directory
the server started it in. Two sessions on the same driver (the server caches CLI responders) must
answer with their own workspaces. Before the sprint both answered with the server's directory.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
from _serving import call, serving  # noqa: E402
from substrate import api

import server  # noqa: E402

_PWD = [sys.executable, "-c", "import os; print(os.getcwd())"]


@pytest.fixture
def base(app: server.App, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> str:
    monkeypatch.setattr(server, "_cli_command", lambda app, name, version=None: list(_PWD))
    app.install_registry(tmp_path / "sessions")
    with serving(app) as url:
        yield url


def _reply(app: server.App, sid: str) -> str:
    replies = [
        e["payload"]["text"]
        for e in api.read_record(Path(app.registry.get(sid).record_root))
        if e["kind"] == "ModelReply"
    ]
    assert replies, "no ModelReply on the record"
    return replies[-1].strip()


def test_two_sessions_on_one_cli_driver_run_in_their_own_workspaces(
    app: server.App, base: str, tmp_path: Path
) -> None:
    spaces = [tmp_path / "ws-a", tmp_path / "ws-b"]
    for ws in spaces:
        ws.mkdir()
    sids = []
    for ws in spaces:
        status, body = call(
            "POST", base + "/api/session", {"driver": "claude", "workspace": str(ws)}
        )
        assert status == 200, body
        sids.append(body["session_id"])
    for sid in sids:
        status, body = call("POST", base + f"/api/session/{sid}/turn", {"text": "pwd"}, timeout=60)
        assert status == 200, body
    assert [Path(_reply(app, sid)) for sid in sids] == [ws.resolve() for ws in spaces]
