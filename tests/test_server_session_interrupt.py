"""Sprint 215b — POST /api/session/<id>/interrupt parks the session.

The handler calls `SessionRegistry.interrupt(session_id)` which reaches the
running turn's event loop via `call_soon_threadsafe` and invokes
`runtime.cancel_producers("model")`. The model producer's CancelledError
handler enqueues ProducerCancelled; the park-on-interrupt trigger fires;
Park(reason="interrupt") lands on the record; pause_await_input pauses the run.

The main test uses a custom topology with an async-sleeping model producer
(the real model producer calls `respond()` synchronously, blocking the loop;
`cancel_producers` fires between event-loop ticks, so the producer must yield
control via `await` for the cancel to land mid-turn).

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
from substrate.constants import PRODUCER_CANCELLED  # noqa: E402
from substrate.testing import assert_event  # noqa: E402


class SlowReply(Struct, frozen=True):
    text: str


def _interruptible_topology() -> object:
    """A minimal session-like topology with a model producer that sleeps via
    asyncio.sleep (yielding control to the event loop so cancel_producers can
    fire). park-on-interrupt subscribes to ProducerCancelled; Park pauses."""

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
            subscription=api.Subscription(kinds=frozenset({api.PRODUCER_CANCELLED})),
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


def _test_factory(manifest: object) -> object:
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


@pytest.mark.timeout(20)
def test_interrupt_parks_the_session_with_producer_cancelled(
    base: str, tmp_path: Path
) -> None:
    """Fire a turn, interrupt mid-model, verify ProducerCancelled + Park(interrupt)."""
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

    # The model producer sleeps 5s via asyncio.sleep, yielding control.
    # Wait for the turn to start and the model to be running. The chain is:
    # HTTP dispatch → turn_sync (lock + TurnHandle) → worker thread (event
    # loop + Runtime + task + ready.set). 2s is enough for the full chain.
    time.sleep(2.0)
    int_status, int_body = _post_json(base + f"/api/session/{sid}/interrupt", None)
    assert int_status == 200
    assert int_body["interrupted"] is True

    t.join(timeout=15)
    assert not t.is_alive(), "turn thread did not finish"

    body = turn_result["body"]
    assert body["status"] == "parked"

    record_root = Path(body["record"])
    envs = list(api.read_record(record_root))

    cancelled = [e for e in envs if e["kind"] == PRODUCER_CANCELLED]
    assert len(cancelled) >= 1, f"ProducerCancelled missing; kinds: {[e['kind'] for e in envs]}"
    assert cancelled[0]["payload"]["producer"]["kind"] == "model"

    park_events = [e for e in envs if e["kind"] == "Park"]
    assert len(park_events) >= 1, f"Park missing; kinds: {[e['kind'] for e in envs]}"
    assert park_events[0]["payload"]["reason"] == "interrupt"


@pytest.mark.timeout(10)
def test_interrupt_on_idle_session_returns_false(
    base: str, tmp_path: Path
) -> None:
    sid = _create(base, tmp_path / "wsp")
    status, body = _post_json(base + f"/api/session/{sid}/interrupt", None)
    assert status == 200
    assert body["interrupted"] is False


@pytest.mark.timeout(10)
def test_interrupt_on_unknown_session_returns_404(base: str) -> None:
    status, body = _post_json(base + "/api/session/s_nonexistent/interrupt", None)
    assert status == 404
