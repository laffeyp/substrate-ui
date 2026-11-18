# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 519: the quit cannot wedge.

The review of 2026-11-18 (§ 3) found two faults. Electron killed the backend at 45 s while the
server's own hard deadline was 60 s, so under Electron that deadline never fired; and the sweep
waited for a session's lock with no limit, so one stuck turn held the whole quit. The clocks now
run in order — sweep deadline, then the server's hard exit, then Electron's kill — and the sweep
waits for each lock a bounded time (kernel K356).
"""

from __future__ import annotations

import re
import threading
import time
from pathlib import Path
from typing import Any

import pytest
import server
from substrate.adapters import DeterministicResponder
from substrate.topologies.session import UserMessage, session_topology
from substrate.topologies.session_registry import SessionManifest, SessionRegistry, SessionStatus

MAIN_TS = Path(__file__).resolve().parent.parent / "electron" / "main.ts"


def test_the_server_ends_itself_before_electron_kills_it() -> None:
    match = re.search(r"const KILL_GRACE_MS = ([\d_]+);", MAIN_TS.read_text(encoding="utf-8"))
    assert match is not None
    kill_grace_s = int(match.group(1).replace("_", "")) / 1000
    assert server.SHUTDOWN_SWEEP_DEADLINE_S < server.SHUTDOWN_HARD_DEADLINE_S < kill_grace_s


def _session(reg: SessionRegistry, sid: str, tmp_path: Path) -> None:
    reg.create(
        session_id=sid,
        name=None,
        driver="deterministic",
        workspace=str(tmp_path / f"ws_{sid}"),
        workspace_shape="flat",
        bundle=None,
        seed="",
        make_repository=False,
    )
    reg.turn_sync(
        sid,
        UserMessage(text="hello", turn_index=0, assembled_prompt="hello", slash_source="user"),
    )


@pytest.mark.timeout(20)
def test_a_session_whose_lock_is_held_does_not_hold_the_sweep(
    app: server.App, tmp_path: Path
) -> None:
    def factory(m: SessionManifest, first: Any = None) -> Any:
        return session_topology(
            driver=DeterministicResponder(seed=0),
            driver_name="deterministic",
            driver_context_tokens=4096,
            seed="",
            tools={},
            per_turn="",
            max_turns=200,
            turn_max_steps=4,
            session_id=m.session_id,
            workspace_path=m.workspace,
            script=None,
            first_turn_user_message=first,
        )

    reg = SessionRegistry(base=tmp_path / "sessions", session_topology_factory=factory)
    app.registry = reg
    stuck, free = "s_00000000000000a5", "s_00000000000000a6"
    _session(reg, stuck, tmp_path)
    _session(reg, free, tmp_path)
    lock = reg._turn_threading_locks.setdefault(stuck, threading.Lock())
    lock.acquire()  # a turn that never returns holds it
    try:
        t0 = time.monotonic()
        outcome = server._shutdown_all_sessions(app, per_session_timeout=1.0, deadline_s=10.0)
        elapsed = time.monotonic() - t0
    finally:
        lock.release()
    assert outcome["busy"] == 1 and outcome["ended"] == 1
    assert elapsed < 8.0
    manifest = reg.get(free)
    assert manifest is not None and manifest.status == SessionStatus.ENDED


def test_the_sweep_defers_what_it_cannot_reach_by_its_deadline(
    app: server.App, tmp_path: Path
) -> None:
    reg = SessionRegistry(base=tmp_path / "sessions", session_topology_factory=lambda *_a: None)
    app.registry = reg
    for sid in ("s_00000000000000b5", "s_00000000000000b6"):
        reg.create(
            session_id=sid,
            name=None,
            driver="deterministic",
            workspace=str(tmp_path / f"ws_{sid}"),
            workspace_shape="flat",
            bundle=None,
            seed="",
            make_repository=False,
        )
    outcome = server._shutdown_all_sessions(app, per_session_timeout=1.0, deadline_s=0.0)
    assert outcome["deferred"] == 2 and outcome["ended"] == 0
