# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 223c — `isolate` on POST /api/session (§9c Mode 3)."""

from __future__ import annotations

import json
import sys
import threading
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_registry import SessionRegistry  # noqa: E402


@pytest.fixture
def base(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> tuple[str, Path]:
    monkeypatch.setattr(server, "_SESSIONS_BASE", tmp_path)
    server._SESSION_REGISTRY = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}", tmp_path
    srv.shutdown()


def _post(url: str, body: dict) -> tuple[int, dict]:
    req = Request(
        url,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except Exception as exc:
        code = getattr(exc, "code", 0)
        body_raw = getattr(exc, "read", lambda: b"{}")()
        try:
            return code, json.loads(body_raw)
        except Exception:
            return code, {"raw": body_raw.decode(errors="replace")}


def test_isolate_true_creates_isolated_workspace_dir(base: tuple[str, Path]) -> None:
    url, base_path = base
    status, body = _post(
        url + "/api/session",
        {"driver": "deterministic", "isolate": True, "workspace": "/tmp/anywhere-else"},
    )
    assert status == 200, body
    assert body["workspace_shape"] == "isolate"
    sid = body["session_id"]
    manifest = server._SESSION_REGISTRY.get(sid)
    expected = base_path / sid / "workspace"
    assert Path(manifest.workspace) == expected
    assert expected.is_dir()


def test_isolate_false_preserves_caller_workspace(base: tuple[str, Path], tmp_path: Path) -> None:
    url, _ = base
    caller_ws = tmp_path / "caller"
    caller_ws.mkdir()
    status, body = _post(
        url + "/api/session",
        {"driver": "deterministic", "isolate": False, "workspace": str(caller_ws)},
    )
    assert status == 200, body
    assert body["workspace_shape"] == "flat"
    manifest = server._SESSION_REGISTRY.get(body["session_id"])
    assert Path(manifest.workspace) == caller_ws


def test_isolate_missing_defaults_to_false(base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _post(url + "/api/session", {"driver": "deterministic"})
    assert status == 200, body
    assert body["workspace_shape"] == "flat"


def test_isolate_write_lands_in_isolated_dir_not_caller_path(
    base: tuple[str, Path], tmp_path: Path
) -> None:
    """Observation half of the dual contract for §9c Mode 3: fire a real
    write_file tool call on the built session tool suite and verify the
    file lands under the isolated workspace, not the caller-supplied
    workspace. The 223c cards asserted only workspace_shape='isolate' —
    a manifest-level claim. This test proves the runtime honors it.

    Sprint 224c: adds the observation the 223c card was missing.
    """
    url, base_path = base
    caller_ws = tmp_path / "caller"
    caller_ws.mkdir()
    status, body = _post(
        url + "/api/session",
        {"driver": "deterministic", "isolate": True, "workspace": str(caller_ws)},
    )
    assert status == 200, body
    sid = body["session_id"]
    manifest = server._SESSION_REGISTRY.get(sid)
    isolated_ws = Path(manifest.workspace)
    assert isolated_ws != caller_ws
    # The tool suite the session would bind — same shape the session
    # topology builds. write_file's `run` takes positional args
    # `[path, text]` and returns a status string on success; a failure
    # raises. See Tool.run signature at
    # substrate/src/substrate/topologies/tool_loop/tools.py:58.
    session_tools = server._tools_for_manifest(manifest)
    session_tools["write_file"].run(["foo.txt", "hi"])
    # The file is under the isolated workspace, NOT the caller's.
    assert (isolated_ws / "foo.txt").is_file()
    assert (isolated_ws / "foo.txt").read_text() == "hi"
    assert not (caller_ws / "foo.txt").exists(), (
        f"isolation breach: file leaked to caller workspace {caller_ws}"
    )


def test_isolate_plus_worktree_returns_400(base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _post(
        url + "/api/session",
        {"driver": "deterministic", "isolate": True, "workspace_shape": "worktree"},
    )
    assert status == 400, body
    assert "mutually exclusive" in json.dumps(body)
