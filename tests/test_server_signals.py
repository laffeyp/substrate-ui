# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""The server's domain signals (vocabulary v0.11; plan 2026-11-05-sdd-signals item 4, sprint 357),
read from the trace the test session keeps on (tests/conftest.py): SESSION_CREATED with the
kernel's shape, TURN_ACCEPTED with the turn index, API_REFUSED with its area and the refusing
line, unrouted for a path no route serves, and SERVER_FAULTED for an exception at a handler's
boundary (a planted RuntimeError in the registry's turn)."""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

import pytest
from _serving import call, serving

import server

TRACE = Path(os.environ["SUBSTRATE_TRACE_DIR"]) / "server.jsonl"


def _mark() -> int:
    return len(TRACE.read_text().splitlines()) if TRACE.exists() else 0


def _since(mark: int) -> list[dict[str, Any]]:
    return [json.loads(x) for x in TRACE.read_text().splitlines()[mark:]]


@pytest.mark.parametrize(
    ("path", "area"),
    [
        ("/api/session", "session"),
        ("/api/session/s_1/turn", "turn"),
        ("/api/session/s_1/interrupt", "turn"),
        ("/api/session/s_1/end", "session"),
        ("/api/session/s_1/files", "files"),
        ("/api/session/s_1/file", "files"),
        ("/api/session/s_1/search", "files"),
        ("/api/session/s_1/files/find", "files"),
        ("/api/session/s_1/children", "children"),
        ("/api/session/s_1/language", "language"),
        ("/api/session/s_1/mcp", "mcp"),
        ("/api/session/s_1/runs/r_1/stop", "runs"),
        ("/api/session/s_1/tasks/t_1/stop", "tasks"),
        ("/api/sessions/by-workspace", "session"),
        ("/api/session/by-name/x", "session"),
        ("/api/workspaces", "workspace"),
        ("/api/cli/codex/pty/start", "cli"),
        ("/api/records/by-path/events", "records"),
        ("/api/runs/clear", "runs"),
        ("/api/assays", "assays"),
        ("/api/assay/x", "assays"),
        ("/api/topology/best_of_n/run", "topology"),
        ("/api/applications", "topology"),
        ("/api/models", "models"),
        ("/api/bundles", "bundles"),
        ("/api/agent", "agent"),
        ("/api/diff", "diff"),
        ("/api/worktree_diff", "diff"),
        ("/api/resolve_child", "children"),
        ("/api/validate", "unrouted"),
        ("/api/build", "unrouted"),
    ],
)
def test_area_of_every_route(path: str, area: str) -> None:
    assert server._api_area(path) == area


def test_create_turn_refusal_and_fault(
    app: server.App, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    app.install_registry(base=tmp_path / "sessions")
    with serving(app) as base:
        mark = _mark()
        status, body = call(
            "POST", f"{base}/api/session", {"driver": "deterministic", "isolate": True}
        )
        assert status == 200, body
        sid = body["session_id"]
        status, _ = call("POST", f"{base}/api/session/{sid}/turn", {"text": "hello"})
        assert status == 200
        status, _ = call("POST", f"{base}/api/validate", {})
        assert status == 404
        status, _ = call("POST", f"{base}/api/session/s_nope/turn", {"text": "hello"})
        assert status == 404

        def planted(*_a: Any, **_k: Any) -> Any:
            raise RuntimeError("planted by test_server_signals")

        monkeypatch.setattr(app.registry, "turn_sync", planted)
        status, _ = call("POST", f"{base}/api/session/{sid}/turn", {"text": "again"})
        assert status == 500
        recs = [(r["name"], r["payload"]) for r in _since(mark)]

    created = [p for n, p in recs if n == "SESSION_CREATED"]
    assert created == [{"session_id": sid, "driver": "deterministic", "workspace_shape": "isolate"}]
    assert [p for n, p in recs if n == "TURN_ACCEPTED"] == [
        {"session_id": sid, "turn_index": 0, "attachments": 0, "by_reference": 0}
    ]
    refused = [p for n, p in recs if n == "API_REFUSED"]
    assert [(p["area"], p["status"]) for p in refused] == [
        ("unrouted", 404),
        ("turn", 404),
        ("turn", 500),
    ]
    assert re.fullmatch(r"do_POST:\d+", refused[0]["cause"])
    assert re.fullmatch(r"_session_turn:\d+", refused[1]["cause"])
    assert re.fullmatch(r"_session_turn:\d+", refused[2]["cause"])
    faulted = [p for n, p in recs if n == "SERVER_FAULTED"]
    assert faulted == [{"area": "turn", "error_type": "RuntimeError", "where": "_session_turn"}]
    # The fault precedes its 500's refusal; nothing the client sent reaches the trace (E1).
    names = [n for n, _ in recs]
    assert names.index("SERVER_FAULTED") < len(names) - 1 and names[-1] == "API_REFUSED"
    assert "hello" not in json.dumps(recs) and "again" not in json.dumps(recs)
