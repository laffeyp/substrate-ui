"""Sprint 214b — DELETE /api/session/<id> removes the manifest + by-name entry.

The record directory STAYS. SDD hard rule 12 says the audit trail is the work,
and the record is the durable evidence of what the session did. A user who
wants the record dir gone deletes it by hand under
`~/.substrate/sessions/<session_id>/record/`.

Behaviors under test:
  1. DELETE returns 204; manifest file is gone; by-name entry is gone; a
     subsequent POST /turn returns 404.
  2. DELETE on an unknown session_id returns 404 with a typed error.
  3. The record directory survives the delete (audit trail).
  4. A deleted session's name can be reused for a NEW session.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_session_delete.py -q
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
from session_errors import SESSION_ENDED_MID_DELEGATE  # noqa: E402
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


def _delete(url: str) -> tuple[int, bytes]:
    try:
        with urlopen(Request(url, method="DELETE"), timeout=15) as r:
            return r.status, r.read()
    except HTTPError as exc:
        return exc.code, exc.read()


def _post_json(url: str, body: dict) -> tuple[int, dict]:
    req = Request(
        url,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read())
    except HTTPError as exc:
        body_bytes = exc.read()
        try:
            payload = json.loads(body_bytes) if body_bytes else {}
        except json.JSONDecodeError:
            payload = {}
        return exc.code, payload


def _create(base: str, workspace: Path, name: str | None = None) -> str:
    _s, body = _post_json(
        base + "/api/session",
        {"driver": "deterministic", "name": name, "workspace": str(workspace)},
    )
    return body["session_id"]


def test_delete_returns_204_and_removes_manifest(base: str, tmp_path: Path) -> None:
    sid = _create(base, tmp_path / "wsp", name="deletable")
    manifest_path = tmp_path / sid / "manifest.json"
    assert manifest_path.exists()
    status, _body = _delete(base + f"/api/session/{sid}")
    assert status == 204
    assert not manifest_path.exists()
    assert server._SESSION_REGISTRY.get(sid) is None
    assert server._SESSION_REGISTRY.by_name("deletable") is None


def test_delete_leaves_the_record_directory_intact(base: str, tmp_path: Path) -> None:
    """SDD hard rule 12: the audit trail is the work. A deleted session removes
    the manifest hint but keeps the record — every envelope the session wrote
    stays on disk for later inspection.

    Piece-B review finding 8: the earlier shape guarded on `events-000001.jsonl`
    which never exists on a real record (segments are named `events-NNNNNN.open`
    while hot, `.sealed` after seal); the guard was silently false and the
    content-preservation check never ran. `api.read_record` is the canonical
    reader shape and matches whatever segments the record carries.
    """
    sid = _create(base, tmp_path / "wsp", name="audited")
    # Fire one turn so the record has real envelopes.
    _post_json(base + f"/api/session/{sid}/turn", {"text": "hi"})
    record_root = tmp_path / sid / "record"
    assert record_root.exists()
    envs_before = list(api.read_record(record_root))
    assert envs_before, "expected the turn to have written at least one envelope"

    _status, _ = _delete(base + f"/api/session/{sid}")

    # Manifest gone; record dir untouched; every envelope still readable and
    # byte-identical to the pre-delete read (seq + kind + payload preserved).
    assert not (tmp_path / sid / "manifest.json").exists()
    assert record_root.exists()
    envs_after = list(api.read_record(record_root))
    assert envs_after == envs_before


def test_delete_on_unknown_session_returns_404(base: str) -> None:
    status, body = _delete(base + "/api/session/s_nonexistent")
    assert status == 404
    payload = json.loads(body)
    assert "unknown session_id" in payload["error"]


def test_post_turn_on_deleted_session_returns_410(base: str, tmp_path: Path) -> None:
    """Sprint 216 tightened this from 404 to 410: DELETE preserves the
    record dir per SDD rule 12, so the was-live-and-is-now-gone shape
    is 410 Gone, not 404 Not Found. A never-existed session id (no
    record dir) still returns 404.
    """
    sid = _create(base, tmp_path / "wsp")
    _delete(base + f"/api/session/{sid}")
    status, body = _post_json(base + f"/api/session/{sid}/turn", {"text": "hi"})
    assert status == 410
    assert body["error"] == SESSION_ENDED_MID_DELEGATE


def test_deleted_name_can_be_reused_by_a_new_session(base: str, tmp_path: Path) -> None:
    sid1 = _create(base, tmp_path / "wsp1", name="recycled")
    _delete(base + f"/api/session/{sid1}")
    # A brand-new session claims the same name without collision.
    sid2 = _create(base, tmp_path / "wsp2", name="recycled")
    assert sid2 != sid1
    assert server._SESSION_REGISTRY.by_name("recycled") == sid2
