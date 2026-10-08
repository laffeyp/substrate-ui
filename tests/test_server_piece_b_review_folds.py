"""Piece-B closure review (2026-08-26) — regression pins for the folded findings.

One test per real behavioral fold in `REVIEW-2026-08-26-piece-b-closure.md`.
A regression on any single fold fails at its dedicated assertion, not on a
downstream lookalike. Findings not landed here (5, 11, 12, 13, 14) are card-
level deferrals into sprint 216 — a code test would not cover them yet.

Run from the substrate venv:
    cd substrate && uv run python -m pytest \\
        ../substrate-ui/tests/test_server_piece_b_review_folds.py -q
"""

from __future__ import annotations

import json
import sys
import threading
import time
from pathlib import Path
from urllib.request import urlopen

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_errors import SESSION_ENDED_MID_DELEGATE  # noqa: E402
from substrate.session_registry import SessionRegistry  # noqa: E402
from _serving import call, call_raw, serving# noqa: E402


@pytest.fixture
def base(tmp_path: Path) -> str:
    server._SESSION_REGISTRY = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    with serving() as base:
        yield base


def _post_json(url: str, body: dict, timeout: float = 30) -> tuple[int, dict]:
    status, payload = call("POST", url, body, timeout=timeout)
    return status, payload


def _delete(url: str) -> tuple[int, bytes]:
    status, payload = call_raw("DELETE", url, timeout=15)
    return status, payload


def _create(base: str, workspace: Path, name: str | None = None, **extra: object) -> dict:
    body: dict = {"driver": "deterministic", "name": name, "workspace": str(workspace)}
    body.update(extra)
    _s, out = _post_json(base + "/api/session", body)
    return out


# ── Finding 3 — do_DELETE must reject sub-resource paths ─────────────────

def test_delete_on_a_sub_resource_returns_404_and_leaves_session_alive(
    base: str, tmp_path: Path
) -> None:
    """`DELETE /api/session/<id>/turn` used to reach
    `SessionRegistry.delete("<id>/turn")` and return 404 pretending the
    mangled id was a session name. The real session was never targeted, but
    the shape hid the parsing bug.
    """
    created = _create(base, tmp_path / "wsp", name="alive")
    sid = created["session_id"]
    status, body = _delete(base + f"/api/session/{sid}/turn")
    assert status == 404
    payload = json.loads(body) if body else {}
    assert "no delete endpoint" in payload.get("error", "")
    # The real session is untouched — a subsequent turn still runs.
    turn_status, turn_body = _post_json(
        base + f"/api/session/{sid}/turn", {"text": "hi"}
    )
    assert turn_status == 200
    assert turn_body["status"] in ("parked", "ended")


# ── Finding 6 — `seed_text` (TECH-SPEC §4 name) is accepted ─────────────

def test_seed_text_alias_is_persisted_on_the_manifest(base: str, tmp_path: Path) -> None:
    """The TECH-SPEC §4 body carries `seed_text`; the earlier handler read
    `seed` only and a spec-following client silently sent nothing. Both
    field names now land on `SessionManifest.seed`.
    """
    created = _create(base, tmp_path / "wsp", name="seeded", seed_text="hello world")
    manifest = server._SESSION_REGISTRY.get(created["session_id"])
    assert manifest is not None
    assert manifest.seed == "hello world"


# ── Finding 7 — POST /turn response carries `seq` ───────────────────────

def test_turn_response_carries_pre_turn_seq(base: str, tmp_path: Path) -> None:
    """TECH-SPEC §4 names `seq` (the record's tail cursor at turn start) in
    the response body. A client that lost the previous response resumes
    from that cursor.
    """
    created = _create(base, tmp_path / "wsp", name="paged")
    sid = created["session_id"]
    _first_status, first = _post_json(base + f"/api/session/{sid}/turn", {"text": "one"})
    _second_status, second = _post_json(base + f"/api/session/{sid}/turn", {"text": "two"})
    # Both responses carry `seq` (a cursor, may be -1 pre-first-write).
    assert "seq" in first
    assert "seq" in second
    # The second turn's `seq` starts at the first turn's `final_seq` or later.
    assert isinstance(second["seq"], int)
    assert isinstance(first["final_seq"], int)
    assert second["seq"] >= first["final_seq"]


# ── Finding 17 — malformed since_seq returns 400 ────────────────────────

def test_sse_since_seq_non_integer_returns_400(base: str, tmp_path: Path) -> None:
    """`?since_seq=abc` used to raise ValueError inside do_GET and get
    caught by the generic 500 branch. A malformed query parameter is a
    400, not a 500.
    """
    created = _create(base, tmp_path / "wsp", name="bad-cursor")
    sid = created["session_id"]
    status, body = call("GET", base + f"/api/session/{sid}/events?since_seq=abc", timeout=5)
    assert status == 400
    assert "since_seq" in body["error"]
    assert "integer" in body["error"]


# ── Finding 4 — delete during in-flight turn does not crash the turn ─

def test_delete_during_in_flight_turn_waits_for_the_turn_to_finish(
    base: str, tmp_path: Path
) -> None:
    """The earlier `delete` popped the manifest without regard to any
    in-flight `turn_sync`; the turn's tail `update_status` then found the
    manifest gone and raised KeyError from inside the running turn,
    surfacing to the caller as a 500. The fold acquires the per-session
    threading.Lock for the delete, so the in-flight turn completes cleanly.
    """
    created = _create(base, tmp_path / "wsp", name="delete-race")
    sid = created["session_id"]
    turn_result: dict = {}

    def _turn() -> None:
        turn_result["status"], turn_result["body"] = _post_json(
            base + f"/api/session/{sid}/turn", {"text": "stay green"}, timeout=60
        )

    turn_thread = threading.Thread(target=_turn, daemon=True)
    turn_thread.start()
    # Give the turn a moment to enter turn_sync and take the lock.
    time.sleep(0.15)
    delete_status, _ = _delete(base + f"/api/session/{sid}")
    turn_thread.join(timeout=30)
    # The in-flight turn survived the delete cleanly (200, not 500).
    assert turn_result.get("status") == 200
    assert turn_result["body"]["status"] in ("parked", "ended")
    # The delete returned 204 once the lock was free.
    assert delete_status == 204
    # And the session is genuinely gone — a subsequent turn returns 410
    # (sprint 216 tightened this from 404 to 410: DELETE preserves the
    # record dir per SDD rule 12, so the was-live-and-is-now-gone shape
    # is 410 Gone, not 404 Not Found).
    after_status, after_body = _post_json(
        base + f"/api/session/{sid}/turn", {"text": "should 410"}
    )
    assert after_status == 410
    assert after_body["error"] == SESSION_ENDED_MID_DELEGATE


# ── Finding 2, revised 2026-09-29 — SSE past a RunFinalised follows a resume ──

def test_sse_reconnect_past_runfinalised_follows_resumed_growth(
    base: str, tmp_path: Path
) -> None:
    """Ended sessions are resumable: turn_sync flips ended -> parked and the
    run continues on the same record. A client that reattaches with
    `since_seq` at or past the old RunFinalised must therefore stay open and
    receive the resumed turn's envelopes. The original finding-2 fold closed
    the stream on any RunFinalised, which cut a resumed turn off before its
    first envelope (the "picking up an ended session starts a new one" bug,
    2026-09-29). Only a RunFinalised past the cursor ends the stream now.

    Ollama is not required: a synthetic RunFinalised, then a synthetic
    envelope after it, are framed onto the record by hand.
    """
    from substrate import api as substrate_api
    from substrate.record import framing

    created = _create(base, tmp_path / "wsp", name="past-final")
    sid = created["session_id"]
    _post_json(base + f"/api/session/{sid}/turn", {"text": "priming"})
    record_root = Path(server._SESSION_REGISTRY.get(sid).record_root)
    envs = list(substrate_api.read_record(record_root))
    assert envs, "expected the priming turn to have written envelopes"
    segments = sorted(record_root.glob("events-*.jsonl"))
    if not segments:
        pytest.skip("no open segment on record; segment naming has drifted")
    finalised_seq = max(int(e["seq"]) for e in envs) + 1
    with segments[-1].open("ab") as fp:
        fp.write(framing.frame({"seq": finalised_seq, "kind": "substrate.RunFinalised", "payload": {"reason": "test-injected"}}))

    result: dict = {}
    opened = threading.Event()

    def _reader() -> None:
        try:
            with urlopen(base + f"/api/session/{sid}/events?since_seq={finalised_seq}", timeout=10) as resp:
                opened.set()
                result["chunk"] = resp.read1(65536)
        except Exception as exc:  # noqa: BLE001 — timeout/close is the failure mode
            result["error"] = repr(exc)
            opened.set()

    reader_thread = threading.Thread(target=_reader, daemon=True)
    reader_thread.start()
    assert opened.wait(5), "SSE reader never connected"
    time.sleep(0.5)
    assert reader_thread.is_alive(), (
        "stream closed on a RunFinalised at/before since_seq: " + repr(result)
    )
    # The resumed turn's first envelope, after the old RunFinalised.
    with segments[-1].open("ab") as fp:
        fp.write(framing.frame({"seq": finalised_seq + 1, "kind": "UserMessage", "payload": {"text": "resumed"}}))
    reader_thread.join(timeout=5)
    assert "chunk" in result, "reader got no data after the resume: " + repr(result)
    assert b'"resumed"' in result["chunk"], result["chunk"][:400]
