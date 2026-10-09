"""Sprint 216 — /turn returns 410 for a session that was live and is now gone.

A DELETEd session (manifest gone, record dir kept) answers /turn with 410
    {"ok": False, "status": "ended", "error": SESSION_DELETED}.
An ENDED session resumes instead (Architect ruling 2026-09-25; it answered 410 before).

A never-existed session still returns 404 with "unknown session_id".

"""

from __future__ import annotations

from pathlib import Path

import pytest
from _serving import call, call_raw, serving  # noqa: E402

import server  # noqa: E402
from session_errors import SESSION_DELETED  # noqa: E402


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> str:
    app.install_registry(base=tmp_path)
    with serving(app) as base:
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
        "error": SESSION_DELETED,
    }


def test_turn_after_end_resumes_the_session(app: server.App, base: str, tmp_path: Path) -> None:
    """Architect ruling 2026-09-25: POST /end leaves the session resumable; the next /turn
    returns 200 on the SAME session and parks again. (Asserted 410 until Sprint 097; the
    ruling and Sprint 089's resume fix changed the contract.)"""
    sid = _create(base, tmp_path / "wsp", "ended")
    _post_json(base + f"/api/session/{sid}/turn", {"text": "priming"})
    _post_json(base + f"/api/session/{sid}/end", None)
    status, body = _post_json(base + f"/api/session/{sid}/turn", {"text": "again"})
    assert status == 200, body
    assert body.get("status") == "parked", body
    assert app.registry.get(sid).status == "parked"


def test_turn_on_never_existed_session_still_returns_404(base: str) -> None:
    """A session id that has neither a manifest nor a record dir is a real
    404, not a 410.
    """
    status, body = _post_json(base + "/api/session/s_never_born/turn", {"text": "hi"})
    assert status == 404
    assert "unknown session_id" in body["error"]
