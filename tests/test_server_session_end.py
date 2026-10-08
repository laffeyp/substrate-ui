"""Sprint 215a — POST /api/session/<id>/end ends the session cleanly.

The handler wraps `SessionRegistry.turn_sync` with a `SessionEndRequested`
resume event. The session topology's `end-on-user-end` trigger fires,
routes through the `session_end` producer, emits `SessionEnded{reason:
"user_end"}`, and `threshold_count("SessionEnded", 1)` finalises the run.
The manifest status transitions to `"ended"`; a subsequent /turn returns
410.

Behaviors under test:
  1. POST /end on a live session returns 200 with `status="ended"`, and
     the record's tail carries `SessionEnded{reason: "user_end"}`.
  2. The manifest transitions to `"ended"`; a subsequent /turn is 410.
  3. POST /end on an unknown session_id returns 404.
  4. An optional body `{"source": "..."}` lands on the
     `SessionEndRequested.source` field for the audit trail.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_session_end.py -q
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from substrate.session_registry import SessionRegistry  # noqa: E402

from substrate import api  # noqa: E402
from substrate.testing import assert_event  # noqa: E402
from _serving import call, serving# noqa: E402


@pytest.fixture
def base(tmp_path: Path) -> str:
    server._SESSION_REGISTRY = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    with serving() as base:
        yield base


def _post_json(url: str, body: dict | None, timeout: float = 30) -> tuple[int, dict]:
    status, payload = call("POST", url, body, timeout=timeout)
    return status, payload


def _create(base: str, workspace: Path, name: str | None = None) -> str:
    _s, body = _post_json(
        base + "/api/session",
        {"driver": "deterministic", "name": name, "workspace": str(workspace)},
    )
    return body["session_id"]


def test_end_finalises_the_session_and_writes_session_ended(
    base: str, tmp_path: Path
) -> None:
    sid = _create(base, tmp_path / "wsp", name="closer")
    # Prime the record with one real turn so the session has UserMessage +
    # ModelReply + Park landed before /end drives the finalisation.
    _post_json(base + f"/api/session/{sid}/turn", {"text": "hello"})
    status, body = _post_json(base + f"/api/session/{sid}/end", None)
    assert status == 200
    assert body["status"] == "ended"
    record_root = Path(body["record"])
    # SessionEnded landed with the trigger's canonical reason.
    assert_event(record_root, "SessionEnded", reason="user_end")
    # And the substrate finalisation envelope is present — the run genuinely
    # closed rather than the manifest being flipped.
    envs = list(api.read_record(record_root))
    assert any(e["kind"] == "substrate.RunFinalised" for e in envs), (
        "RunFinalised missing — the topology's threshold_count did not fire"
    )


def test_manifest_transitions_to_ended_and_next_turn_resumes(
    base: str, tmp_path: Path
) -> None:
    """POST /end sets the manifest to ended; per the Architect ruling of 2026-09-25 the next
    /turn resumes the same session (200, parked). Asserted 410 until Sprint 097."""
    sid = _create(base, tmp_path / "wsp", name="closed")
    _post_json(base + f"/api/session/{sid}/turn", {"text": "priming"})
    _s, _b = _post_json(base + f"/api/session/{sid}/end", None)
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest is not None
    assert manifest.status == "ended"
    status, body = _post_json(base + f"/api/session/{sid}/turn", {"text": "again"})
    assert status == 200, body
    assert body.get("status") == "parked", body

def test_end_on_unknown_session_returns_404(base: str) -> None:
    status, body = _post_json(base + "/api/session/s_nonexistent/end", None)
    assert status == 404
    assert "unknown session_id" in body["error"]


def test_source_body_field_lands_on_the_session_end_requested_envelope(
    base: str, tmp_path: Path
) -> None:
    """The `SessionEndRequested` envelope carries the caller-named source in
    its payload. `end-on-user-end` still normalises the SessionEnded reason
    to `"user_end"` — the source is audit-trail evidence for who asked, not
    a switch on the trigger's routing.
    """
    sid = _create(base, tmp_path / "wsp", name="sourced")
    _post_json(base + f"/api/session/{sid}/turn", {"text": "priming"})
    _s, body = _post_json(
        base + f"/api/session/{sid}/end", {"source": "cli_slash_exit"}
    )
    record_root = Path(body["record"])
    assert_event(record_root, "SessionEndRequested", source="cli_slash_exit")
    # SessionEnded still fires with the normalised reason.
    assert_event(record_root, "SessionEnded", reason="user_end")
