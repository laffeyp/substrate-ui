"""Sprint 214a — POST /api/session/<id>/turn runs one turn via turn_sync.

The handler wraps SessionRegistry.turn_sync — the same seam the delegate wire
uses. Per-session threading.Lock serializes concurrent callers (finding 3 fix
from the piece-C review). Body: {"text": "..."}; response: {"status",
"final_seq", "record"}.

Three behaviors under test:
  1. A first POST /turn runs one turn against the reviewer — record grows with
     a UserMessage carrying slash_source="daemon", plus a ModelReply and a
     FinalAnswer. Response status is "parked" (session_topology pauses on Park).
  2. Two concurrent POST /turn calls on the same session BOTH complete under
     the per-session threading.Lock; reviewer's record ends with two
     UserMessages in seq order; no race, no interleaving.
  3. POST /turn to an unknown session_id returns 404. A body missing "text"
     returns 400.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_session_turn.py -q
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
# TECHNIQUE #38 — F-API-4 test primitives operate on the record path directly.
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
        body_bytes = exc.read()
        try:
            payload = json.loads(body_bytes) if body_bytes else {}
        except json.JSONDecodeError:
            payload = {}
        return exc.code, payload


def _create_session(base: str, workspace: Path, name: str | None = None) -> str:
    _status, body = _post_json(
        base + "/api/session",
        {"driver": "deterministic", "name": name, "workspace": str(workspace)},
    )
    return body["session_id"]


def test_first_turn_lands_a_user_message_with_slash_source_daemon(
    base: str, tmp_path: Path
) -> None:
    sid = _create_session(base, tmp_path / "wsp")
    status, body = _post_json(
        base + f"/api/session/{sid}/turn", {"text": "compute (2+3)*4"}
    )
    assert status == 200
    assert body["status"] == "parked"
    record_root = Path(body["record"])
    # F-API-4 primitive per TECHNIQUE #38: `assert_event` reads the record path
    # directly and matches on partial payload. A regression that changed the
    # slash_source or turn_index fails at the specific assertion, not on a
    # count of matching rows.
    assert_event(
        record_root,
        "UserMessage",
        text="compute (2+3)*4",
        slash_source="daemon",
        turn_index=0,
    )
    assert_event(record_root, "FinalAnswer")


def test_second_turn_appends_with_incremented_turn_index(
    base: str, tmp_path: Path
) -> None:
    sid = _create_session(base, tmp_path / "wsp")
    _post_json(base + f"/api/session/{sid}/turn", {"text": "first"})
    status, body = _post_json(base + f"/api/session/{sid}/turn", {"text": "second"})
    assert status == 200
    record_root = Path(body["record"])
    # Per-turn assertions via F-API-4 primitive: each expected pairing pins on
    # its specific text + turn_index, so a regression that swapped ordering or
    # mis-incremented turn_index fails at the exact violated pairing.
    assert_event(record_root, "UserMessage", text="first", turn_index=0)
    assert_event(record_root, "UserMessage", text="second", turn_index=1)


def test_two_concurrent_turns_on_same_session_serialize(base: str, tmp_path: Path) -> None:
    sid = _create_session(base, tmp_path / "wsp")
    outcomes: list[tuple[int, dict]] = []
    outcomes_lock = threading.Lock()

    def _call(text: str) -> None:
        result = _post_json(base + f"/api/session/{sid}/turn", {"text": text}, timeout=60)
        with outcomes_lock:
            outcomes.append(result)

    t1 = threading.Thread(target=_call, args=("turn A",))
    t2 = threading.Thread(target=_call, args=("turn B",))
    t1.start()
    t2.start()
    t1.join()
    t2.join()
    assert len(outcomes) == 2
    for status, _body in outcomes:
        assert status == 200
    # Reviewer's record: two UserMessages, in some order but each with a distinct
    # turn_index — the per-session threading.Lock made them FIFO on the writer.
    # F-API-4 primitive pins one specific (text, turn_index) pairing per turn.
    # Either arrival order is legitimate; we look up each concurrent text under
    # the turn_index it actually landed at and confirm it exists.
    record_root = Path(server._SESSION_REGISTRY.get(sid).record_root)
    user_msgs = [e for e in api.read_record(record_root) if e["kind"] == "UserMessage"]
    turn_by_text = {u["payload"]["text"]: u["payload"]["turn_index"] for u in user_msgs}
    assert set(turn_by_text) == {"turn A", "turn B"}
    assert set(turn_by_text.values()) == {0, 1}
    # Each concrete pairing exists at the seq lookup.
    for text, ti in turn_by_text.items():
        assert_event(record_root, "UserMessage", text=text, turn_index=ti)


def test_unknown_session_id_returns_404(base: str) -> None:
    status, body = _post_json(
        base + "/api/session/s_nonexistent/turn", {"text": "hi"}
    )
    assert status == 404
    assert "unknown session_id" in body["error"]


def test_missing_text_returns_400(base: str, tmp_path: Path) -> None:
    sid = _create_session(base, tmp_path / "wsp")
    status, body = _post_json(base + f"/api/session/{sid}/turn", {})
    assert status == 400
    assert "requires body" in body["error"]
