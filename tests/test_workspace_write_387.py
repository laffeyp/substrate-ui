# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""The workspace file API's write and its tags (UI sprint 387; editor plan round 2, item 0(c)).

PUT /api/session/<id>/file?path=<rel> puts the edit on the session's record as FileWritten
(kernel K340), then changes the file; a record that refuses the edit leaves the file as it was.
A write to a file changed since it was read (base_sha256) is refused. The list, read, write and
watch calls write FILES_LISTED, FILE_READ, FILE_WRITTEN, FILES_WATCH_OPENED and FILES_WATCH_CLOSED
to the server's trace (vocabulary v0.26), with no path or text in them (E1)."""

from __future__ import annotations

import json
import os
import socket
import time
from pathlib import Path
from typing import Any

import pytest

import server
from _serving import call, serving
from substrate.api import read_record

TRACE = Path(os.environ["SUBSTRATE_TRACE_DIR"]) / "server.jsonl"


def _mark() -> int:
    return len(TRACE.read_text().splitlines()) if TRACE.exists() else 0


def _since(mark: int) -> list[dict[str, Any]]:
    return [json.loads(x) for x in TRACE.read_text().splitlines()[mark:]]


@pytest.fixture
def ws(tmp_path: Path) -> Path:
    root = tmp_path / "ws"
    (root / "src").mkdir(parents=True)
    (root / "src" / "a.py").write_text("x = 1\n")
    (tmp_path / "secret.txt").write_text("no")
    return root


def _session(base: str, ws: Path, turn: bool = True) -> str:
    status, body = call(
        "POST", base + "/api/session", {"driver": "deterministic", "workspace": str(ws)}
    )
    assert status == 200, body
    sid = body["session_id"]
    if turn:
        status, body = call("POST", base + f"/api/session/{sid}/turn", {"text": "hello"})
        assert status == 200, body
    return str(sid)


def _file_entries(app: server.App, sid: str) -> list[dict[str, Any]]:
    root = app.registry.get(sid).record_root  # type: ignore[union-attr]
    return [e for e in read_record(root) if e["kind"] == "FileWritten"]


def test_a_write_goes_on_the_record_and_then_changes_the_file(
    app: server.App, tmp_path: Path, ws: Path
) -> None:
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        sid = _session(base, ws)
        mark = _mark()
        status, listing = call("GET", base + f"/api/session/{sid}/files?dir=src")
        assert status == 200, listing
        status, facts = call("GET", base + f"/api/session/{sid}/file?path=src/a.py")
        assert status == 200 and facts["sha256"], facts
        status, out = call(
            "PUT",
            base + f"/api/session/{sid}/file?path=src/a.py",
            {"text": "x = 2\n", "base_sha256": facts["sha256"]},
        )
        assert status == 200, out
        assert (ws / "src" / "a.py").read_text() == "x = 2\n"
        status, made = call("PUT", base + f"/api/session/{sid}/file?path=new.txt", {"text": "hi"})
        assert status == 200, made
        assert (ws / "new.txt").read_text() == "hi"
        recs = _since(mark)
    entries = _file_entries(app, sid)
    assert [
        (
            e["payload"]["path"],
            e["payload"]["old_text"],
            e["payload"]["new_text"],
            e["payload"]["view"],
        )
        for e in entries
    ] == [
        ("src/a.py", "x = 1\n", "x = 2\n", "editor"),
        ("new.txt", None, "hi", "editor"),
    ]
    assert [e["seq"] for e in entries] == [out["seq"], made["seq"]]
    tags = [(r["name"], r["payload"]) for r in recs if r["name"].startswith(("FILE", "FILES"))]
    assert tags == [
        ("FILES_LISTED", {"session_id": sid, "entries": 1}),
        ("FILE_READ", {"session_id": sid, "bytes": 6, "encoding": "utf8"}),
        (
            "FILE_WRITTEN",
            {
                "session_id": sid,
                "bytes": 6,
                "created": False,
                "written": "at_rest",
                "seq": out["seq"],
                "encoding": "utf8",
            },
        ),
        (
            "FILE_WRITTEN",
            {
                "session_id": sid,
                "bytes": 2,
                "created": True,
                "written": "at_rest",
                "seq": made["seq"],
                "encoding": "utf8",
            },
        ),
    ]
    assert "x = 2" not in json.dumps(recs) and "a.py" not in json.dumps(recs)  # E1


def test_writes_the_workspace_refuses_leave_the_file_as_it_was(
    app: server.App, tmp_path: Path, ws: Path
) -> None:
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        sid = _session(base, ws)
        status, body = call(
            "PUT",
            base + f"/api/session/{sid}/file?path=src/a.py",
            {"text": "z", "base_sha256": "0" * 64},
        )
        assert status == 409, body  # changed since read
        status, body = call(
            "PUT", base + f"/api/session/{sid}/file?path=../secret.txt", {"text": "z"}
        )
        assert status == 400, body
        status, body = call(
            "PUT", base + f"/api/session/{sid}/file?path=no/such/x.txt", {"text": "z"}
        )
        assert status == 404, body
    assert (ws / "src" / "a.py").read_text() == "x = 1\n"
    assert (tmp_path / "secret.txt").read_text() == "no"
    assert not [p for p in (ws / "src").iterdir() if p.name.startswith(".substrate-write-")]


def test_the_watch_writes_its_open_and_its_close(app: server.App, tmp_path: Path, ws: Path) -> None:
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        sid = _session(base, ws, turn=False)
        mark = _mark()
        host, port = base.split("//")[1].split(":")
        conn = socket.create_connection((host, int(port)))
        conn.sendall(
            f"GET /api/session/{sid}/files/watch HTTP/1.1\r\nHost: {host}:{port}\r\n\r\n".encode()
        )
        got = b""
        conn.settimeout(10)
        while b"event: ready" not in got:
            chunk = conn.recv(4096)
            assert chunk, got
            got += chunk
        conn.close()
        (ws / "later.txt").write_text("x")  # the next poll writes a change to the closed stream
        deadline = time.time() + 10
        while time.time() < deadline and not any(
            r["name"] == "FILES_WATCH_CLOSED" for r in _since(mark)
        ):
            time.sleep(0.1)
        tags = [
            (r["name"], r["payload"]) for r in _since(mark) if r["name"].startswith("FILES_WATCH")
        ]
    assert tags[0] == ("FILES_WATCH_OPENED", {"session_id": sid, "files": 1, "truncated": False})
    assert tags[1][0] == "FILES_WATCH_CLOSED" and tags[1][1]["session_id"] == sid


def test_a_session_that_is_off_still_has_its_file_written_off_the_record(
    app: server.App, tmp_path: Path, ws: Path
) -> None:
    """UI sprint 427 (the Architect, 2026-11-09: the editor is an editor whether the session is on
    or off): a session with no record yet, and an ended one, have the file written; the record
    takes nothing, and FILE_WRITTEN says `off_record` with no seq."""
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        fresh = _session(base, ws, turn=False)
        mark = _mark()
        status, out = call(
            "PUT", base + f"/api/session/{fresh}/file?path=src/a.py", {"text": "y = 1\n"}
        )
        assert status == 200 and out["written"] == "off_record" and out["seq"] is None, out
        assert (ws / "src" / "a.py").read_text() == "y = 1\n"
        sid = _session(base, ws)
        status, body = call("POST", base + f"/api/session/{sid}/end", {})
        assert status == 200, body
        before = len(_file_entries(app, sid))
        status, out = call(
            "PUT", base + f"/api/session/{sid}/file?path=src/a.py", {"text": "y = 2\n"}
        )
        assert status == 200 and out["written"] == "off_record", out
        assert (ws / "src" / "a.py").read_text() == "y = 2\n"
        assert len(_file_entries(app, sid)) == before, "the ended record takes nothing"
        recs = [r for r in _since(mark) if r["name"] == "FILE_WRITTEN"]
    assert [(r["payload"]["written"], r["payload"]["seq"]) for r in recs] == [
        ("off_record", None),
        ("off_record", None),
    ]
    assert not [p for p in (ws / "src").iterdir() if p.name.startswith(".substrate-write-")]
