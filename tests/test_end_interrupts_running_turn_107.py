"""UI sprint 107: ending a session while its turn runs.

Sprint 101 made quit interrupt a running turn before ending its session, because turns have no
time limit and the end turn waits for the session's lock. `POST /api/session/<id>/end` kept the
old order: it queued its end turn behind the running one, so the request returned only when the
model finished, however long that took. It now interrupts first, as quit and ctrl+c do.
"""

from __future__ import annotations

import asyncio
import json
import sys
import threading
import time
from http.server import ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402

from substrate import api  # noqa: E402
from substrate.adapters import DeterministicResponder  # noqa: E402
from substrate.session_registry import SessionManifest, SessionRegistry, SessionStatus  # noqa: E402
from substrate.topologies.session import UserMessage, session_topology  # noqa: E402


class _Thinks(DeterministicResponder):
    """The second model call thinks for 60 s (the first turn parks normally)."""

    calls = 0

    async def arespond(self, prompt: str) -> str:
        type(self).calls += 1
        if type(self).calls == 2:
            await asyncio.sleep(60)
        return self.respond(prompt)


def test_end_interrupts_a_running_turn(tmp_path: Path) -> None:
    _Thinks.calls = 0
    responder = _Thinks(seed=0)

    def factory(m: SessionManifest, first: Any = None) -> Any:
        return session_topology(
            driver=responder, driver_name="deterministic", driver_context_tokens=4096,
            seed="", tools={}, per_turn="", max_turns=200, turn_max_steps=4,
            session_id=m.session_id, workspace_path=m.workspace,
            record_root=Path(m.record_root), script=None, first_turn_user_message=first,
        )

    reg = SessionRegistry(base=tmp_path, session_topology_factory=factory)
    server._SESSION_REGISTRY = reg
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        sid = reg.create(
            session_id="s_0123456789abcde7", name=None, driver="deterministic",
            workspace=str(tmp_path / "ws"), workspace_shape="flat", bundle=None, seed="",
        ).session_id

        def turn(text: str, i: int) -> None:
            reg.turn_sync(sid, UserMessage(text=text, turn_index=i, assembled_prompt=text, slash_source="user"))

        turn("first", 0)
        worker = threading.Thread(target=lambda: turn("second", 1), daemon=True)
        worker.start()
        t0 = time.monotonic()
        while reg.get(sid).status != SessionStatus.RUNNING and time.monotonic() - t0 < 10:
            time.sleep(0.05)
        time.sleep(0.5)  # the model call is in flight
        assert reg.get(sid).status == SessionStatus.RUNNING

        req = Request(
            f"http://127.0.0.1:{srv.server_address[1]}/api/session/{sid}/end",
            data=json.dumps({"source": "user_end"}).encode(), method="POST",
            headers={"Content-Type": "application/json"},
        )
        t1 = time.monotonic()
        with urlopen(req, timeout=45) as r:  # 45 s < the 60 s think: a wait would time out here
            body = json.loads(r.read())
        elapsed = time.monotonic() - t1

        assert elapsed < 10, f"/end waited {elapsed:.1f} s behind a running turn"
        assert body["status"] == SessionStatus.ENDED, body
        worker.join(5)
        kinds = [e["kind"] for e in api.read_record(Path(reg.get(sid).record_root))]
        assert api.PRODUCER_CANCELLED in kinds, "the running turn was interrupted, on the record"
        assert "SessionEnded" in kinds
    finally:
        srv.shutdown()
        srv.server_close()


def test_delete_interrupts_a_running_turn(tmp_path: Path) -> None:
    """`SessionRegistry.delete` waited up to 30 s for the turn's lock, then raised; with no time
    limit on turns, a delete mid-turn always failed. It interrupts first, like `/end`."""
    _Thinks.calls = 0
    responder = _Thinks(seed=0)

    def factory(m: SessionManifest, first: Any = None) -> Any:
        return session_topology(
            driver=responder, driver_name="deterministic", driver_context_tokens=4096,
            seed="", tools={}, per_turn="", max_turns=200, turn_max_steps=4,
            session_id=m.session_id, workspace_path=m.workspace,
            record_root=Path(m.record_root), script=None, first_turn_user_message=first,
        )

    reg = SessionRegistry(base=tmp_path, session_topology_factory=factory)
    sid = reg.create(
        session_id="s_0123456789abcde8", name=None, driver="deterministic",
        workspace=str(tmp_path / "ws"), workspace_shape="flat", bundle=None, seed="",
    ).session_id

    def turn(text: str, i: int) -> None:
        reg.turn_sync(sid, UserMessage(text=text, turn_index=i, assembled_prompt=text, slash_source="user"))

    turn("first", 0)
    worker = threading.Thread(target=lambda: turn("second", 1), daemon=True)
    worker.start()
    t0 = time.monotonic()
    while reg.get(sid).status != SessionStatus.RUNNING and time.monotonic() - t0 < 10:
        time.sleep(0.05)
    time.sleep(0.5)
    assert reg.get(sid).status == SessionStatus.RUNNING
    record_root = Path(reg.get(sid).record_root)

    t1 = time.monotonic()
    reg.delete(sid)
    assert time.monotonic() - t1 < 10
    assert reg.get(sid) is None
    worker.join(5)
    assert api.PRODUCER_CANCELLED in [e["kind"] for e in api.read_record(record_root)]


def test_settings_change_mid_turn_without_waiting(tmp_path: Path) -> None:
    """The setters took the turn lock, which a turn holds for its whole run, so a rename or a
    driver change mid-turn waited for the model. They now take a short manifest-write lock; the
    running turn keeps its driver and is not interrupted."""
    _Thinks.calls = 0
    responder = _Thinks(seed=0)

    def factory(m: SessionManifest, first: Any = None) -> Any:
        return session_topology(
            driver=responder, driver_name="deterministic", driver_context_tokens=4096,
            seed="", tools={}, per_turn="", max_turns=200, turn_max_steps=4,
            session_id=m.session_id, workspace_path=m.workspace,
            record_root=Path(m.record_root), script=None, first_turn_user_message=first,
        )

    reg = SessionRegistry(base=tmp_path, session_topology_factory=factory)
    sid = reg.create(
        session_id="s_0123456789abcde9", name=None, driver="deterministic",
        workspace=str(tmp_path / "ws"), workspace_shape="flat", bundle=None, seed="",
    ).session_id

    def turn(text: str, i: int) -> None:
        reg.turn_sync(sid, UserMessage(text=text, turn_index=i, assembled_prompt=text, slash_source="user"))

    turn("first", 0)
    worker = threading.Thread(target=lambda: turn("second", 1), daemon=True)
    worker.start()
    t0 = time.monotonic()
    while reg.get(sid).status != SessionStatus.RUNNING and time.monotonic() - t0 < 10:
        time.sleep(0.05)
    time.sleep(0.5)

    t1 = time.monotonic()
    reg.set_name(sid, "renamed-mid-turn")
    reg.set_driver(sid, "some-other-driver")
    reg.set_per_turn(sid, "prefix")
    assert time.monotonic() - t1 < 2
    after = reg.get(sid)
    assert (after.name, after.driver, after.per_turn) == ("renamed-mid-turn", "some-other-driver", "prefix")
    assert after.status == SessionStatus.RUNNING, "the change did not stop the turn"
    assert reg.by_name("renamed-mid-turn") == sid
    reg.interrupt(sid, tier="hard")
    worker.join(10)
    assert not worker.is_alive()
    on_disk = json.loads((tmp_path / sid / "manifest.json").read_text())
    assert on_disk["name"] == "renamed-mid-turn" and on_disk["status"] != SessionStatus.RUNNING
