# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 494: the server continues a Claude Code session (kernel session vocabulary § AD).

`POST /api/session` with `continue_from: {"tool": "claude_code", "path": <a session file>}`
reads the file from its last compaction: that compaction's summary, then every message after it,
as the kinds Substrate's history renders. Thinking, attachments and side chains stay out. The
fixture is hand-written in Claude Code's JSONL form (research r2), two compactions deep.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import pytest

import server
from _serving import call, serving
from substrate.api import read_record

TRACE = Path(os.environ["SUBSTRATE_TRACE_DIR"]) / "server.jsonl"
FIXTURE = Path(__file__).parent / "fixtures" / "claude_code_session_494.jsonl"


def _mark() -> int:
    return len(TRACE.read_text().splitlines()) if TRACE.exists() else 0


def _since(mark: int) -> list[dict[str, Any]]:
    return [json.loads(x) for x in TRACE.read_text().splitlines()[mark:]]


def _create(base: str, ws: Path, continue_from: Any = None) -> tuple[int, dict[str, Any]]:
    body: dict[str, Any] = {"driver": "deterministic", "workspace": str(ws)}
    if continue_from is not None:
        body["continue_from"] = continue_from
    return call("POST", base + "/api/session", body)


def test_the_reader_takes_the_last_summary_and_what_follows() -> None:
    got = server._claude_code_continuation(FIXTURE)
    kinds = [
        (
            e["kind"],
            e["payload"].get("text") or e["payload"].get("tool") or e["payload"].get("output"),
        )
        for e in got["turns"]
    ]
    assert kinds == [
        ("UserMessage", "SECOND SUMMARY: the editor roadmap closed; the second build is next."),
        ("UserMessage", "List the folder."),
        ("ModelReply", "Listing it."),
        ("HarnessToolCall", "Bash"),
        ("HarnessToolResult", "a.txt\nb.txt"),
        ("HarnessToolCall", "Read"),
        ("HarnessToolResult", "File does not exist."),
        ("ModelReply", "Two files: a.txt and b.txt."),
        ("UserMessage", "Now continue in Substrate."),
    ]
    failed = [
        e for e in got["turns"] if e["kind"] == "HarnessToolResult" and not e["payload"]["ok"]
    ]
    assert len(failed) == 1
    assert got["provenance"] == {
        "tool": "claude_code",
        "path": str(FIXTURE),
        "summary_line": 7,
        "messages": 8,
    }
    text = json.dumps(got)
    for absent in (
        "FIRST SUMMARY",
        "between the compactions",
        "PRIVATE THINKING",
        "ATTACHED CLAUDE.md",
        "SIDECHAIN",
    ):
        assert absent not in text


def test_a_session_created_to_continue_opens_with_it(app: server.App, tmp_path: Path) -> None:
    app.install_registry(tmp_path / "sessions")
    ws = tmp_path / "ws"
    ws.mkdir()
    with serving(app) as base:
        mark = _mark()
        status, body = _create(base, ws, {"tool": "claude_code", "path": str(FIXTURE)})
        assert status == 200, body
        sid = str(body["session_id"])
        created = [r["payload"] for r in _since(mark) if r["name"] == "SESSION_CREATED"]
        status, body = call("POST", base + f"/api/session/{sid}/turn", {"text": "What is next?"})
        assert status == 200, body
    assert created == [
        {
            "session_id": sid,
            "driver": "deterministic",
            "workspace_shape": created[0]["workspace_shape"],
            "continued_from": "claude_code",
        }
    ]
    events = list(read_record(app.registry.get(sid).record_root, resolve_blobs=True))  # type: ignore[union-attr]
    frags = [
        e["payload"]
        for e in events
        if e["kind"] == "PromptFragment" and e["payload"]["source"] == "continued_session"
    ]
    assert len(frags) == 1
    assert (
        frags[0]["provenance"]["tool"] == "claude_code"
        and frags[0]["provenance"]["summary_line"] == 7
    )
    prompt = next(e["payload"]["text"] for e in events if e["kind"] == "PromptComposed")
    assert "This session continues a conversation held in claude_code." in prompt
    assert "USER: SECOND SUMMARY: the editor roadmap closed; the second build is next." in prompt
    assert "HARNESS TOOL Bash: args={'command': 'ls'}" in prompt
    assert "HARNESS RESULT(fail): File does not exist." in prompt
    assert "PRIVATE THINKING" not in prompt and "FIRST SUMMARY" not in prompt


def test_a_session_created_without_it_is_as_before(app: server.App, tmp_path: Path) -> None:
    app.install_registry(tmp_path / "sessions")
    ws = tmp_path / "ws"
    ws.mkdir()
    with serving(app) as base:
        mark = _mark()
        status, body = _create(base, ws)
        assert status == 200, body
        created = [r["payload"] for r in _since(mark) if r["name"] == "SESSION_CREATED"]
    assert created[0]["continued_from"] == "none"
    assert app.registry.get(str(body["session_id"])).continued_session is None  # type: ignore[union-attr]


@pytest.mark.parametrize(
    ("continue_from", "says"),
    [
        ({"tool": "codex", "path": str(FIXTURE)}, "continue_from must be"),
        ({"tool": "claude_code"}, "continue_from must be"),
        ("claude_code", "continue_from must be"),
        ({"tool": "claude_code", "path": "/no/such/session.jsonl"}, "No such file"),
    ],
)
def test_a_bad_continue_from_is_refused(
    app: server.App, tmp_path: Path, continue_from: Any, says: str
) -> None:
    app.install_registry(tmp_path / "sessions")
    ws = tmp_path / "ws"
    ws.mkdir()
    with serving(app) as base:
        before = len(app.registry.list_all())  # type: ignore[union-attr]
        mark = _mark()
        status, body = _create(base, ws, continue_from)
        refused = [r["payload"] for r in _since(mark) if r["name"] == "API_REFUSED"]
    assert status == 400 and says in str(body)
    assert len(app.registry.list_all()) == before  # type: ignore[union-attr]
    assert refused and refused[0]["status"] == 400


def test_a_file_with_no_message_is_refused(app: server.App, tmp_path: Path) -> None:
    empty = tmp_path / "empty.jsonl"
    empty.write_text(json.dumps({"type": "system", "subtype": "compact_boundary"}) + "\n")
    app.install_registry(tmp_path / "sessions")
    ws = tmp_path / "ws"
    ws.mkdir()
    with serving(app) as base:
        status, body = _create(base, ws, {"tool": "claude_code", "path": str(empty)})
    assert status == 400 and "holds no message" in str(body)
