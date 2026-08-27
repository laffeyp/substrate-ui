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
from substrate.testing import assert_event  # noqa: E402


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


def _post_json(url: str, body: dict | None, timeout: float = 30) -> tuple[int, dict]:
    data = json.dumps(body).encode() if body is not None else b""
    req = Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json"} if body is not None else {},
    )
    try:
        with urlopen(req, timeout=timeout) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else {})
    except HTTPError as exc:
        raw = exc.read()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {}
        return exc.code, payload


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


def test_manifest_transitions_to_ended_and_next_turn_returns_410(
    base: str, tmp_path: Path
) -> None:
    sid = _create(base, tmp_path / "wsp", name="closed")
    _post_json(base + f"/api/session/{sid}/turn", {"text": "priming"})
    _s, _b = _post_json(base + f"/api/session/{sid}/end", None)
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest is not None
    assert manifest.status == "ended"
    # A follow-up /turn now hits the SessionEndedMidTurn guard.
    status, body = _post_json(base + f"/api/session/{sid}/turn", {"text": "too late"})
    assert status == 410
    assert body["status"] == "ended"
    assert body["error"] == "session_ended_mid_delegate"


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
