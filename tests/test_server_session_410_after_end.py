"""Sprint 216 — /turn returns 410 for a session that was live and is now gone.

Three code paths converge on 410 with
    {"ok": False, "status": "ended", "error": SESSION_ENDED_MID_DELEGATE}:

  1. Pre-lock manifest missing but record dir on disk (DELETEd session).
  2. Pre-lock manifest present with status=="ended" (POST /end already ran).
  3. Under-lock re-check finds the session ended mid-flight (existing
     SessionEndedMidTurn catch — a delete or end fires between the caller's
     pre-lock get() and the turn_sync entry).

A never-existed session still returns 404 with "unknown session_id".

Run:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_session_410_after_end.py -q
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_errors import SESSION_ENDED_MID_DELEGATE  # noqa: E402
from substrate.session_registry import SessionRegistry  # noqa: E402
from _serving import call, call_raw, serving  # noqa: E402


@pytest.fixture
def base(tmp_path: Path) -> str:
    server._SESSION_REGISTRY = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    with serving() as base:
        yield base


def _post_json(url: str, body: dict | None) -> tuple[int, dict]:
    status, payload = call("POST", url, body, timeout=30)
    return status, payload


def _delete(url: str) -> int:
    status, payload = call_raw("DELETE", url, timeout=15)
    return status


def _create(base: str, workspace: Path, name: str) -> str:
    _s, body = _post_json(
        base + "/api/session",
        {"driver": "deterministic", "name": name, "workspace": str(workspace)},
    )
    return body["session_id"]


def test_turn_after_delete_returns_410_not_404(base: str, tmp_path: Path) -> None:
    """DELETE preserves the record dir (SDD rule 12) but pops the manifest.
    A caller that resolved the session name before the DELETE and hits
    /turn after gets 410, not 404 — the session existed once.
    """
    sid = _create(base, tmp_path / "wsp", "gone")
    _post_json(base + f"/api/session/{sid}/turn", {"text": "priming"})
    assert _delete(base + f"/api/session/{sid}") == 204
    status, body = _post_json(base + f"/api/session/{sid}/turn", {"text": "too late"})
    assert status == 410
    assert body == {
        "ok": False,
        "status": "ended",
        "error": SESSION_ENDED_MID_DELEGATE,
    }


def test_turn_after_end_resumes_the_session(base: str, tmp_path: Path) -> None:
    """Architect ruling 2026-09-25: POST /end leaves the session resumable; the next /turn
    returns 200 on the SAME session and parks again. (Asserted 410 until Sprint 097; the
    ruling and Sprint 089's resume fix changed the contract.)"""
    sid = _create(base, tmp_path / "wsp", "ended")
    _post_json(base + f"/api/session/{sid}/turn", {"text": "priming"})
    _post_json(base + f"/api/session/{sid}/end", None)
    status, body = _post_json(base + f"/api/session/{sid}/turn", {"text": "again"})
    assert status == 200, body
    assert body.get("status") == "parked", body
    assert server._SESSION_REGISTRY.get(sid).status == "parked"


def test_turn_on_never_existed_session_still_returns_404(base: str) -> None:
    """A session id that has neither a manifest nor a record dir is a real
    404, not a 410.
    """
    status, body = _post_json(base + "/api/session/s_never_born/turn", {"text": "hi"})
    assert status == 404
    assert "unknown session_id" in body["error"]
