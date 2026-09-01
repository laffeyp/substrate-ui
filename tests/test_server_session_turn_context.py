# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 217e — POST /api/session/<id>/turn body accepts `context`.

Shape: `{"text": "...", "context": {"parent_seq_range": [lo, hi], "kinds": [str, ...]}?}`
Malformed context returns 400. Well-formed context prefixes a slice of this
session's own record to `UserMessage.assembled_prompt`; `UserMessage.text`
stays raw. Missing context works unchanged (backwards-compat).

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_session_turn_context.py -q
"""

from __future__ import annotations

import json
import sys
import threading
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_registry import SessionRegistry  # noqa: E402

from substrate import api  # noqa: E402


@pytest.fixture
def base(tmp_path: Path) -> str:
    server._SESSION_REGISTRY = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    srv.shutdown()


def _post_json(url: str, body: dict, timeout: float = 30) -> tuple[int, dict]:
    req = Request(
        url,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read())
    except HTTPError as exc:
        raw = exc.read()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {}
        return exc.code, payload


def _create(base: str, workspace: Path) -> str:
    _s, body = _post_json(
        base + "/api/session",
        {"driver": "deterministic", "workspace": str(workspace)},
    )
    return body["session_id"]


def test_turn_without_context_unchanged(base: str, tmp_path: Path) -> None:
    """Backwards compat: a turn body with no `context` field works exactly as before."""
    sid = _create(base, tmp_path / "wsp")
    status, body = _post_json(base + f"/api/session/{sid}/turn", {"text": "hello"})
    assert status == 200
    assert body["status"] == "parked"


def test_turn_with_context_prefixes_assembled_prompt(base: str, tmp_path: Path) -> None:
    """First turn builds record history. Second turn with `context` reads a
    slice of THIS session's record and prefixes it to `assembled_prompt`.
    The record's second UserMessage envelope carries the prefixed text.
    """
    sid = _create(base, tmp_path / "wsp")
    # Turn 1: populate the record with envelopes to slice from.
    _post_json(base + f"/api/session/{sid}/turn", {"text": "compute (2+3)*4"})
    manifest = server._SESSION_REGISTRY.get(sid)
    record_root = Path(manifest.record_root)
    # Turn 2: pass context selecting the FinalAnswer from turn 1.
    envs = list(api.read_record(record_root))
    max_seq = max(int(e["seq"]) for e in envs)
    status, _body = _post_json(
        base + f"/api/session/{sid}/turn",
        {
            "text": "continue that thought",
            "context": {"parent_seq_range": [0, max_seq], "kinds": ["FinalAnswer"]},
        },
    )
    assert status == 200
    # The second UserMessage on the record carries a prefixed assembled_prompt;
    # `text` stays as the raw user text.
    envs = list(api.read_record(record_root))
    user_msgs = [e for e in envs if e["kind"] == "UserMessage"]
    assert len(user_msgs) == 2
    turn_2 = user_msgs[1]["payload"]
    assert turn_2["text"] == "continue that thought"
    assert "context from parent record" in turn_2["assembled_prompt"]
    assert "continue that thought" in turn_2["assembled_prompt"]


def test_turn_malformed_context_returns_400(base: str, tmp_path: Path) -> None:
    sid = _create(base, tmp_path / "wsp")
    status, body = _post_json(
        base + f"/api/session/{sid}/turn",
        {"text": "hi", "context": "not-an-object"},
    )
    assert status == 400
    assert "context" in body["error"]


def test_turn_context_missing_seq_range_returns_400(base: str, tmp_path: Path) -> None:
    sid = _create(base, tmp_path / "wsp")
    status, body = _post_json(
        base + f"/api/session/{sid}/turn",
        {"text": "hi", "context": {"kinds": ["UserMessage"]}},  # no seq_range
    )
    assert status == 400
    assert "parent_seq_range" in body["error"]
