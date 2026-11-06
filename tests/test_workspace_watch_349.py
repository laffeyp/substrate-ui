# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Watching a session's workspace (UI sprint 349; editor shared work 0(c)).

A snapshot maps each file to its modified time and size, links not followed, cut at a cap it reports;
`.git` folders are left out; two snapshots give the files created, modified and deleted. The watch route streams a `ready` event,
then one event per poll that found changes.
"""

from __future__ import annotations

import http.client
import json
import os
from pathlib import Path
from urllib.parse import urlparse

import server
from _serving import call, serving


def test_snapshots_give_created_modified_and_deleted(tmp_path: Path) -> None:
    root = tmp_path / "ws"
    (root / "src").mkdir(parents=True)
    (root / "src" / "a.py").write_text("x")
    (root / "b.txt").write_text("b")
    os.symlink(tmp_path, root / "loop")  # a link to a folder above: a file here, not followed
    (root / ".git" / "objects").mkdir(parents=True)
    (root / ".git" / "objects" / "ab").write_text("git's own")
    before, cut = server._workspace_snapshot(root)
    assert (sorted(before), cut) == (["b.txt", "loop", "src/a.py"], False)
    (root / "src" / "a.py").write_text("x = 2")
    (root / "b.txt").unlink()
    (root / "src" / "c.py").write_text("c")
    after, _ = server._workspace_snapshot(root)
    assert server._workspace_changes(before, after) == [
        {"path": "b.txt", "change": "deleted"},
        {"path": "src/a.py", "change": "modified"},
        {"path": "src/c.py", "change": "created"},
    ]
    assert server._workspace_changes(after, after) == []
    cut_files, cut = server._workspace_snapshot(root, max_files=1)
    assert (len(cut_files), cut) == (1, True)


def test_the_watch_route_streams_ready_then_changes(app: server.App, tmp_path: Path) -> None:
    ws = tmp_path / "ws"
    ws.mkdir()
    (ws / "a.txt").write_text("a")
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        status, body = call(
            "POST", base + "/api/session", {"driver": "deterministic", "workspace": str(ws)}
        )
        assert status == 200, body
        sid = body["session_id"]
        url = urlparse(base)
        conn = http.client.HTTPConnection(url.hostname, url.port, timeout=10)
        try:
            conn.request("GET", f"/api/session/{sid}/files/watch")
            resp = conn.getresponse()
            assert resp.status == 200
            assert resp.readline() == b"event: ready\n"
            ready = json.loads(resp.readline()[len(b"data: ") :])
            assert ready == {"files": 1, "truncated": False}
            assert resp.readline() == b"\n"
            (ws / "new.md").write_text("n")
            line = resp.readline()
            while line.startswith(b":") or line == b"\n":
                line = resp.readline()
            assert json.loads(line[len(b"data: ") :]) == {
                "changes": [{"path": "new.md", "change": "created"}]
            }
        finally:
            conn.close()
        status, missing = call("GET", base + "/api/session/s_nope/files/watch")
        assert status == 404, missing
