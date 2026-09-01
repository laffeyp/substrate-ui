# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
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
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_errors import SESSION_ENDED_MID_DELEGATE  # noqa: E402
from session_registry import SessionRegistry  # noqa: E402


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


def _delete(url: str) -> tuple[int, bytes]:
    try:
        with urlopen(Request(url, method="DELETE"), timeout=15) as r:
            return r.status, r.read()
    except HTTPError as exc:
        return exc.code, exc.read()


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
    try:
        urlopen(base + f"/api/session/{sid}/events?since_seq=abc", timeout=5)
        raise AssertionError("expected 400")
    except HTTPError as exc:
        assert exc.code == 400
        body = json.loads(exc.read())
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


# ── Finding 2 — SSE past a finalised record does not hang ────────────

def test_sse_reconnect_past_runfinalised_returns_cleanly(
    base: str, tmp_path: Path
) -> None:
    """A client reconnecting with `since_seq >= runfinalised_seq` used to
    hit the seq filter on every envelope, `finalised` stayed False, and
    the poll loop spun forever until an external timeout. The finalisation
    kind check now runs before the seq filter.

    Ollama is not required here — a synthetic RunFinalised envelope is
    hand-appended to the record so the assertion pins the SSE ordering
    invariant without depending on driver availability. The session
    topology's own end-on-exit path is exercised by the SSE tests in
    `test_server_session_sse.py`; this test isolates the ordering bug.
    """
    from substrate import api as substrate_api

    created = _create(base, tmp_path / "wsp", name="past-final")
    sid = created["session_id"]
    # Fire one turn so the record has real envelopes.
    _post_json(base + f"/api/session/{sid}/turn", {"text": "priming"})
    record_root = Path(server._SESSION_REGISTRY.get(sid).record_root)
    envs = list(substrate_api.read_record(record_root))
    assert envs, "expected the priming turn to have written envelopes"
    tail_seq = max(int(e["seq"]) for e in envs)
    # Append a synthetic RunFinalised envelope directly to the open segment.
    # (The daemon does not finalise a session record on POST /turn; this test
    # only cares about the SSE reader's ordering behavior past a RunFinalised
    # seq, so a hand-appended envelope is the cheapest fixture.)
    segments = sorted(record_root.glob("events-*.jsonl"))
    if not segments:
        pytest.skip("no open segment on record; segment naming has drifted")
    finalised_seq = tail_seq + 1
    # Frame the envelope through the real framer so `framing.recover` accepts
    # it. A hand-written `json.dumps(env) + "\n"` has no CRC — recover treats
    # it as the torn cut point, discards the line, and the SSE reader never
    # sees the RunFinalised. That was the pre-fix flake: the test timeout
    # (5s) was racing against the reader's poll interval, masking a bad
    # fixture. `framing.frame` gives every downstream reader the same bytes
    # a real writer would.
    from substrate.record import framing

    frame_bytes = framing.frame(
        {
            "seq": finalised_seq,
            "kind": "substrate.RunFinalised",
            "payload": {"reason": "test-injected"},
        }
    )
    with segments[-1].open("ab") as fp:
        fp.write(frame_bytes)

    # Reader opens with since_seq at or past the finalised seq. The old shape
    # spun forever; the fold breaks out cleanly and returns whatever it read.
    deadline = time.time() + 5.0
    result: dict = {}

    def _reader() -> None:
        try:
            with urlopen(
                base + f"/api/session/{sid}/events?since_seq={finalised_seq}",
                timeout=5,
            ) as resp:
                result["chunk"] = resp.read1(65536)
        except Exception as exc:  # noqa: BLE001 — timeout/close is the failure mode
            result["error"] = repr(exc)

    reader_thread = threading.Thread(target=_reader, daemon=True)
    reader_thread.start()
    reader_thread.join(timeout=deadline - time.time())
    # The reader thread must have exited (i.e. the server didn't spin
    # forever on the finalised record). Content of `chunk` is not asserted
    # — the ordering invariant is what this test locks.
    assert not reader_thread.is_alive(), (
        "SSE reader did not exit — finalisation-past-since_seq hang regressed"
    )
