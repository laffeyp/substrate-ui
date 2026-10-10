"""Piece-B closure review (2026-08-26) — regression pins for the folded findings.

One test per real behavioral fold in `REVIEW-2026-08-26-piece-b-closure.md`.
A regression on any single fold fails at its dedicated assertion, not on a
downstream lookalike. Findings not landed here (5, 11, 12, 13, 14) are card-
level deferrals into sprint 216 — a code test would not cover them yet.
"""

from __future__ import annotations

import json
import threading
import time
from pathlib import Path
from urllib.request import urlopen

import pytest
from _serving import call, call_raw, serving, wait_model_started  # noqa: E402

import server  # noqa: E402
from session_errors import SESSION_DELETED  # noqa: E402


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> str:
    app.install_registry(base=tmp_path)
    with serving(app) as base:
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
    turn_status, turn_body = _post_json(base + f"/api/session/{sid}/turn", {"text": "hi"})
    assert turn_status == 200
    assert turn_body["status"] in ("parked", "ended")


# ── Finding 6 — `seed_text` (TECH-SPEC §4 name) is accepted ─────────────


def test_seed_text_alias_is_persisted_on_the_manifest(
    app: server.App, base: str, tmp_path: Path
) -> None:
    """The TECH-SPEC §4 body carries `seed_text`; the earlier handler read
    `seed` only and a spec-following client silently sent nothing. Both
    field names now land on `SessionManifest.seed`.
    """
    created = _create(base, tmp_path / "wsp", name="seeded", seed_text="hello world")
    manifest = app.registry.get(created["session_id"])
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


class _SlowResponder:
    """A deterministic responder whose model call takes `delay` seconds, so a turn is still
    running when the test acts on it."""

    def __init__(self, delay: float) -> None:
        from substrate.adapters import DeterministicResponder

        self._inner = DeterministicResponder(seed=0)
        self._delay = delay

    def respond(self, prompt: str) -> str:
        return self._inner.respond(prompt)

    async def arespond(self, prompt: str) -> str:
        import asyncio

        await asyncio.sleep(self._delay)
        return self._inner.respond(prompt)


def test_delete_during_in_flight_turn_interrupts_it_and_the_turn_parks(
    app: server.App, base: str, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The earlier `delete` popped the manifest under a running `turn_sync`; the turn's tail
    `update_status` then raised KeyError inside the running turn (a 500). Since UI sprint 107 a
    delete interrupts the turn first; the turn parks and answers 200. The model call here takes 5 s, and the test checks the
    model call has started before the DELETE (lens audit F432: a 0.15 s sleep let a fast turn
    finish first, so the race the test names never happened)."""
    monkeypatch.setattr(
        server,
        "_daemon_driver_resolver",
        lambda app, name, params=None, workspace=None: _SlowResponder(5.0),
    )
    created = _create(base, tmp_path / "wsp", name="delete-race")
    sid = created["session_id"]
    turn_result: dict = {}

    def _turn() -> None:
        turn_result["status"], turn_result["body"] = _post_json(
            base + f"/api/session/{sid}/turn", {"text": "stay green"}, timeout=60
        )

    turn_thread = threading.Thread(target=_turn, daemon=True)
    turn_thread.start()
    wait_model_started(Path(app.registry.get(sid).record_root))
    delete_status, _ = _delete(base + f"/api/session/{sid}")
    turn_thread.join(timeout=30)
    assert not turn_thread.is_alive()
    # The DELETE interrupted the model call: the turn parked and answered 200 (never a 500), and
    # the record carries the cancellation (the 5 s model call did not run to completion).
    assert turn_result.get("status") == 200, turn_result
    assert turn_result["body"]["status"] == "parked"
    from substrate import api as substrate_api

    kinds = [e["kind"] for e in substrate_api.read_record(Path(turn_result["body"]["record"]))]
    assert substrate_api.PRODUCER_CANCELLED in kinds
    assert delete_status == 204
    # The session is gone; DELETE keeps the record dir (SDD rule 12), so a later turn is 410.
    after_status, after_body = _post_json(base + f"/api/session/{sid}/turn", {"text": "should 410"})
    assert after_status == 410
    assert after_body["error"] == SESSION_DELETED


# ── Finding 2, revised 2026-09-29 — SSE past a RunFinalised follows a resume ──


def test_sse_reconnect_past_runfinalised_follows_resumed_growth(
    app: server.App, base: str, tmp_path: Path
) -> None:
    """Ended sessions are resumable: turn_sync flips ended -> parked and the run continues on the
    same record. A client that reattaches with `since_seq` at the RunFinalised must stay open and
    receive the resumed turn's envelopes. The record is written by the server itself: a real
    `/end` writes the RunFinalised and a real `/turn` resumes (lens audit F434: the test used to
    append hand-framed envelopes to a live record behind the writer's back)."""
    from substrate import api as substrate_api

    created = _create(base, tmp_path / "wsp", name="past-final")
    sid = created["session_id"]
    assert _post_json(base + f"/api/session/{sid}/turn", {"text": "priming"})[0] == 200
    assert _post_json(base + f"/api/session/{sid}/end", {"source": "user_end"})[0] == 200
    record_root = Path(app.registry.get(sid).record_root)
    finals = [
        e
        for e in substrate_api.read_record(record_root)
        if e["kind"] == substrate_api.RUN_FINALISED
    ]
    assert finals, "the /end wrote no RunFinalised"
    finalised_seq = int(finals[-1]["seq"])

    chunks: list[bytes] = []
    opened = threading.Event()

    def _reader() -> None:
        try:
            with urlopen(
                base + f"/api/session/{sid}/events?since_seq={finalised_seq}", timeout=15
            ) as resp:
                opened.set()
                deadline = time.monotonic() + 15
                while time.monotonic() < deadline:
                    chunk = resp.read1(65536)
                    if not chunk:
                        return
                    chunks.append(chunk)
                    if b"resumed past the end" in b"".join(chunks):
                        return
        except Exception:  # noqa: BLE001 — a closed or timed-out stream is the failure under test
            opened.set()

    reader_thread = threading.Thread(target=_reader, daemon=True)
    reader_thread.start()
    assert opened.wait(5), "SSE reader never connected"
    assert reader_thread.is_alive(), "the stream closed on a RunFinalised at since_seq"
    status, _ = _post_json(base + f"/api/session/{sid}/turn", {"text": "resumed past the end"})
    assert status == 200
    reader_thread.join(timeout=15)
    assert b"resumed past the end" in b"".join(chunks), b"".join(chunks)[:400]
