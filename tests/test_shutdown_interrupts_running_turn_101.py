"""UI sprint 101: quitting while a turn runs.

Turns no longer have a time limit, so a running turn can hold its session's lock indefinitely.
The shutdown sweep ended each session with a turn that first waits for that lock, so a quit
mid-turn waited until Electron's 45 s SIGKILL and left the record cut off. The sweep now
interrupts a running turn first (as ctrl+c does), then ends the session.
"""

from __future__ import annotations

from _serving import record_tail_seq, wait_model_started

import asyncio
import threading
import time
from pathlib import Path
from typing import Any

from substrate import api  # noqa: E402
from substrate.adapters import DeterministicResponder  # noqa: E402
from substrate.topologies.session_registry import SessionManifest, SessionRegistry, SessionStatus  # noqa: E402
from substrate.topologies.session import UserMessage, session_topology  # noqa: E402

import server  # noqa: E402


class _Thinks(DeterministicResponder):
    """The second model call thinks for 30 s (the first turn parks normally)."""

    calls = 0

    async def arespond(self, prompt: str) -> str:
        type(self).calls += 1
        if type(self).calls == 2:
            await asyncio.sleep(30)
        return self.respond(prompt)


def test_shutdown_interrupts_a_running_turn_then_ends_the_session(
    app: server.App, tmp_path: Path
) -> None:
    responder = _Thinks(seed=0)

    def factory(m: SessionManifest, first: Any = None) -> Any:
        return session_topology(
            driver=responder,
            driver_name="deterministic",
            driver_context_tokens=4096,
            seed="",
            tools={},
            per_turn="",
            max_turns=200,
            turn_max_steps=4,
            session_id=m.session_id,
            workspace_path=m.workspace,
            record_root=Path(m.record_root),
            script=None,
            first_turn_user_message=first,
        )

    reg = SessionRegistry(base=tmp_path, session_topology_factory=factory)
    app.registry = reg
    sid = reg.create(
        session_id="s_0123456789abcdef",
        name=None,
        driver="deterministic",
        workspace=str(tmp_path / "ws"),
        workspace_shape="flat",
        bundle=None,
        seed="",
    ).session_id

    def turn(text: str, i: int) -> None:
        reg.turn_sync(
            sid, UserMessage(text=text, turn_index=i, assembled_prompt=text, slash_source="user")
        )

    turn("first", 0)

    tail = record_tail_seq(Path(reg.get(sid).record_root))
    worker = threading.Thread(target=lambda: turn("second", 1), daemon=True)
    worker.start()
    wait_model_started(
        Path(reg.get(sid).record_root), after_seq=tail
    )  # the second turn's model call is in flight
    assert reg.get(sid).status == SessionStatus.RUNNING

    t1 = time.monotonic()
    outcome = server._shutdown_all_sessions(app, per_session_timeout=10.0)
    elapsed = time.monotonic() - t1

    assert elapsed < 10, f"shutdown waited {elapsed:.1f} s behind a running turn"
    assert outcome["ended"] == 1, outcome
    worker.join(5)
    kinds = [e["kind"] for e in api.read_record(Path(reg.get(sid).record_root))]
    assert api.PRODUCER_CANCELLED in kinds, "the running turn was interrupted, on the record"
    assert "SessionEnded" in kinds
    assert reg.get(sid).status == SessionStatus.ENDED
