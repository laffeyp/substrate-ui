# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 217d — POST /api/session/<id>/interrupt over the v0.3 cancel primitive.

The endpoint dispatches `Runtime.cancel_producer(instance, cause="external",
caller="daemon:interrupt")` synchronously (up to a 1-second wait for the
loop-side closure) and polls the record for the resulting `ProducerCancelled`
envelope. Response body distinguishes dispatch from landing:

  {"interrupted": true, "landed": true,  "producer": ref, "session_id": ...}
  {"interrupted": true, "landed": false, "producer": ref, "session_id": ...}
  {"interrupted": false, "landed": false, "session_id": ...}

Tests poll the record for the model producer's start envelope before firing the
interrupt — no wall-clock `time.sleep` to smooth a race.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_session_interrupt.py -q
"""

from __future__ import annotations

import asyncio
import json
import sys
import threading
import time
from collections.abc import AsyncIterator
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import pytest
from msgspec import Struct

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_registry import SessionRegistry  # noqa: E402

from substrate import api  # noqa: E402
from substrate.constants import PRODUCER_CANCELLED, PRODUCER_STARTED  # noqa: E402


class SlowReply(Struct, frozen=True):
    text: str


def _interruptible_topology() -> object:
    """A minimal session-like topology whose model producer awaits (yielding to
    the event loop) so cancel_producer can land mid-turn. park-on-interrupt
    subscribes to ProducerCancelled and yields Park.
    """
    from substrate.topologies.session import Park  # noqa: E402

    async def _slow_model(_inp: object) -> AsyncIterator[SlowReply]:
        await asyncio.sleep(5.0)
        yield SlowReply(text="should-not-reach")

    async def _park(inp: object) -> AsyncIterator[Park]:
        reason = inp.get("reason", "unknown") if hasattr(inp, "get") else "unknown"
        yield Park(awaiting="UserMessage", turn_index=0, reason=reason)

    def topo(b: api.TopologyBuilder) -> None:
        b.producer_kind(
            "model",
            schemas=[SlowReply],
            schema_version=1,
            factory=lambda: _slow_model,
            deterministic=True,
        )
        b.producer_kind(
            "park",
            schemas=[Park],
            schema_version=1,
            factory=lambda: _park,
            deterministic=True,
        )
        b.trigger(
            "park-on-interrupt",
            subscription=api.Subscription(kinds=frozenset({PRODUCER_CANCELLED})),
            predicate=lambda ctx: True,
            starts="park",
            input_builder=lambda ctx: {"reason": "interrupt"},
            policy=api.PerEvent(),
        )
        b.trigger(
            "resume-on-user",
            subscription=api.Subscription(kinds=frozenset({"UserMessage"})),
            predicate=lambda ctx: True,
            starts="model",
            input_builder=lambda ctx: {},
            policy=api.PerEvent(),
        )
        b.initial("model", input={})
        b.termination(
            api.any_of(
                api.pause_await_input(
                    when=lambda tctx: tctx.event is not None and tctx.event.kind == "Park",
                    resume_condition="UserMessage",
                ),
                api.quiescence_with_watchdog(seconds=10),
            )
        )

    return topo


def _test_factory(manifest: object, first_turn_user_message: object = None) -> object:
    # This is a raw test topology; its `session_open`/`resume-on-user`/`park-on-interrupt`
    # producers are enough to exercise the interrupt seam. First-turn UserMessage is
    # unused because `_interruptible_topology` already declares `b.initial("model")` —
    # the model producer opens directly and awaits inside `_slow_model`. Fine for the
    # interrupt-endpoint test; the daemon path (session_topology proper) uses the arg.
    del first_turn_user_message
    return _interruptible_topology()


@pytest.fixture
def base(tmp_path: Path) -> str:
    server._SESSION_REGISTRY = SessionRegistry(
        base=tmp_path,
        session_topology_factory=_test_factory,
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


def _create(base: str, workspace: Path) -> str:
    _s, body = _post_json(
        base + "/api/session",
        {"driver": "deterministic", "workspace": str(workspace)},
    )
    return body["session_id"]


def _wait_for_model_started(record_root: Path, timeout: float = 5.0) -> None:
    """Poll the record for the first `substrate.ProducerStarted` naming kind=model.
    The interrupt endpoint can only cancel a running producer; firing before
    the producer starts races.
    """
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            for env in api.read_record(record_root):
                if env.get("kind") != PRODUCER_STARTED:
                    continue
                producer = (env.get("payload") or {}).get("producer") or {}
                if isinstance(producer, dict) and producer.get("kind") == "model":
                    return
        except Exception:  # noqa: BLE001 — mid-write; poll again
            pass
        time.sleep(0.05)
    raise AssertionError("model producer never started within timeout")


# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.timeout(20)
def test_interrupt_parks_the_session_with_producer_cancelled_and_provenance(
    base: str, tmp_path: Path
) -> None:
    """Fire a turn, poll for the model producer to start, then interrupt.
    Verify ProducerCancelled lands with `cause="external"` and
    `caller="daemon:interrupt"` (the v0.3 provenance annotation) and the turn
    returns with status="parked".
    """
    sid = _create(base, tmp_path / "wsp")

    turn_result: dict[str, object] = {}

    def fire_turn() -> None:
        status, body = _post_json(
            base + f"/api/session/{sid}/turn", {"text": "hello"}, timeout=15
        )
        turn_result["status"] = status
        turn_result["body"] = body

    t = threading.Thread(target=fire_turn)
    t.start()

    # Poll the record for the model producer's start rather than sleeping.
    record_root = tmp_path / sid / "record"
    _wait_for_model_started(record_root, timeout=5.0)

    int_status, int_body = _post_json(base + f"/api/session/{sid}/interrupt", None)
    assert int_status == 200
    assert int_body["interrupted"] is True
    assert int_body["landed"] is True  # endpoint polled and observed
    assert int_body["producer"]["kind"] == "model"
    assert int_body["producer"]["instance"]

    t.join(timeout=15)
    assert not t.is_alive(), "turn thread did not finish"

    body = turn_result["body"]
    assert body["status"] == "parked"

    envs = list(api.read_record(record_root))

    cancelled = [e for e in envs if e["kind"] == PRODUCER_CANCELLED]
    assert len(cancelled) == 1
    payload = cancelled[0]["payload"]
    assert payload["producer"]["kind"] == "model"
    # v0.3 provenance annotation:
    assert payload["cause"] == "external"
    assert payload["caller"] == "daemon:interrupt"

    park_events = [e for e in envs if e["kind"] == "Park"]
    assert len(park_events) >= 1
    assert park_events[0]["payload"]["reason"] == "interrupt"


@pytest.mark.timeout(10)
def test_interrupt_on_idle_session_returns_false(base: str, tmp_path: Path) -> None:
    """Interrupting a session with no live producer returns
    `{"interrupted": false, "landed": false}` — not an error.
    """
    sid = _create(base, tmp_path / "wsp")
    status, body = _post_json(base + f"/api/session/{sid}/interrupt", None)
    assert status == 200
    assert body["interrupted"] is False
    assert body["landed"] is False


@pytest.mark.timeout(10)
def test_interrupt_on_unknown_session_returns_404(base: str) -> None:
    status, body = _post_json(base + "/api/session/s_nonexistent/interrupt", None)
    assert status == 404


@pytest.mark.timeout(20)
def test_interrupt_with_max_wait_ms_zero_returns_landed_false(
    base: str, tmp_path: Path
) -> None:
    """`?max_wait_ms=0` skips the poll; the endpoint returns immediately after
    dispatch. `landed=false` truthfully reports the envelope has not been
    observed yet — the caller watches `/events` for the landing.
    """
    sid = _create(base, tmp_path / "wsp")

    def fire_turn() -> None:
        _post_json(base + f"/api/session/{sid}/turn", {"text": "hello"}, timeout=15)

    t = threading.Thread(target=fire_turn)
    t.start()

    record_root = tmp_path / sid / "record"
    _wait_for_model_started(record_root, timeout=5.0)

    int_status, int_body = _post_json(
        base + f"/api/session/{sid}/interrupt?max_wait_ms=0", None
    )
    assert int_status == 200
    assert int_body["interrupted"] is True
    assert int_body["landed"] is False  # skipped the poll, envelope not yet observed
    assert int_body["producer"]["kind"] == "model"

    t.join(timeout=15)


@pytest.mark.timeout(10)
def test_interrupt_malformed_max_wait_ms_returns_400(base: str, tmp_path: Path) -> None:
    sid = _create(base, tmp_path / "wsp")
    status, body = _post_json(
        base + f"/api/session/{sid}/interrupt?max_wait_ms=abc", None
    )
    assert status == 400
    assert "max_wait_ms" in body["error"]
