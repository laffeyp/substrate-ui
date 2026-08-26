"""Sprint 213b — delegate path 1 routes into a standing session via SessionRegistry.turn_sync.

The reviewer session is a real `session_topology` running under `Runtime.resume`;
the delegate's parent thread calls `session_registry.turn_sync(session_id, UserMessage(...))`,
which serializes on the per-session `threading.Lock`, drives the resume in a
fresh worker event loop, and returns the reviewer's manifest + record_root. The
parent reads the tail `FinalAnswer` off that record and folds the answer back.

Two behaviors under test:
  1. A first turn opens the reviewer via `.run()` (writes RunStarted), pauses on
     Park. A delegate call with `child_session_name="reviewer"` runs a second
     turn on the same record; the reviewer's record grows with the delegated
     UserMessage + reply.
  2. Two concurrent parents both delegating to the reviewer FIFO-queue on the
     per-session threading lock — both complete, no interleaved writes on the
     reviewer's record.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_delegate_via_standing_session.py -q
"""

from __future__ import annotations

import asyncio
import sys
import threading
from collections.abc import Callable
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from session_registry import SessionRegistry  # noqa: E402

from substrate import api  # noqa: E402
from substrate.adapters import DeterministicResponder  # noqa: E402
from substrate.topologies.session import (  # noqa: E402
    UserMessage,
    session_topology,
)
from substrate.topologies.tool_loop.delegate import make_delegate  # noqa: E402


def _reviewer_factory(manifest: object) -> Callable[[api.TopologyBuilder], None]:
    """Rebuild the reviewer's session_topology from its manifest. The daemon
    (substrate-ui/server.py, sprint 214) will do this with the driver registry
    + role prompts; here we use DeterministicResponder + no tools so the CI
    stays offline.
    """
    del manifest
    return session_topology(
        driver=DeterministicResponder(seed=7),
        driver_name="deterministic",
        driver_context_tokens=4096,
        seed="you are the reviewer",
        tools={},
        per_turn="",
        max_turns=200,
        turn_max_steps=4,
        session_id="s_reviewer",
        workspace_path="/tmp/reviewer",
        script=None,
    )


async def _open_reviewer(record_root: Path) -> None:
    """First turn: opens the record via .run() so substrate.RunStarted lands
    at seq 0, then pauses on Park after the DeterministicResponder answers.
    """
    await api.Runtime(record_root, persistent=True).resume(
        _reviewer_factory(None),
        resume_event=UserMessage(
            text="hello",
            turn_index=0,
            assembled_prompt="hello",
            slash_source="chat",
        ),
    )


@pytest.mark.asyncio
async def test_delegate_routes_into_standing_session(tmp_path: Path) -> None:
    base = tmp_path / "sessions"
    base.mkdir()
    registry = SessionRegistry(base=base, session_topology_factory=_reviewer_factory)
    registry.create(
        session_id="s_reviewer",
        name="reviewer",
        driver="deterministic",
        workspace="/tmp/reviewer",
        workspace_shape="flat",
        bundle=None,
        seed="you are the reviewer",
    )
    reviewer_record = base / "s_reviewer" / "record"
    await _open_reviewer(reviewer_record)

    # Parent delegate call — synchronous seam under a fresh event loop.
    d = make_delegate(
        responder=DeterministicResponder(seed=0),
        root=tmp_path / "parent",
        session_registry=registry,
        parent_session_id="s_parent",
    )
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None,
        lambda: d.run([{"task": "please review this diff", "child_session_name": "reviewer"}]),
    )
    assert result["via"] == "standing_session:reviewer"
    assert result["steps"] == -1
    assert Path(result["child_root"]) == reviewer_record
    # Reviewer's record grew: a second UserMessage lands + a second ModelReply.
    user_msgs = [e for e in api.read_record(reviewer_record) if e["kind"] == "UserMessage"]
    assert len(user_msgs) == 2
    assert user_msgs[1]["payload"]["text"] == "please review this diff"
    assert user_msgs[1]["payload"]["slash_source"] == "delegate"
    # The parent reads the reviewer's tail FinalAnswer.
    finals = [e for e in api.read_record(reviewer_record) if e["kind"] == "FinalAnswer"]
    assert result["answer"] == finals[-1]["payload"]["text"]


@pytest.mark.asyncio
async def test_two_parents_delegating_to_same_reviewer_serialize(tmp_path: Path) -> None:
    """Two parent threads fire delegate calls into `reviewer` at the same time.
    SessionRegistry's per-session `threading.Lock` in turn_sync serializes them:
    both complete, no exception, and the reviewer's record shows both turns'
    UserMessages in order (turn_index monotonic).
    """
    base = tmp_path / "sessions"
    base.mkdir()
    registry = SessionRegistry(base=base, session_topology_factory=_reviewer_factory)
    registry.create(
        session_id="s_reviewer",
        name="reviewer",
        driver="deterministic",
        workspace="/tmp/reviewer",
        workspace_shape="flat",
        bundle=None,
        seed="you are the reviewer",
    )
    reviewer_record = base / "s_reviewer" / "record"
    await _open_reviewer(reviewer_record)

    d1 = make_delegate(
        responder=DeterministicResponder(seed=0),
        root=tmp_path / "parent1",
        session_registry=registry,
    )
    d2 = make_delegate(
        responder=DeterministicResponder(seed=0),
        root=tmp_path / "parent2",
        session_registry=registry,
    )
    results: list[object] = [None, None]  # type: ignore[list-item]
    errors: list[BaseException] = []

    def _call(idx: int, tool: object, text: str) -> None:
        try:
            results[idx] = tool.run(  # type: ignore[attr-defined]
                [{"task": text, "child_session_name": "reviewer"}]
            )
        except BaseException as exc:  # noqa: BLE001
            errors.append(exc)

    t1 = threading.Thread(target=_call, args=(0, d1, "review diff A"))
    t2 = threading.Thread(target=_call, args=(1, d2, "review diff B"))
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, lambda: (t1.start(), t2.start(), t1.join(), t2.join()))
    assert errors == [], f"unexpected errors under concurrent delegate: {errors[:2]}"
    assert all(r is not None for r in results)
    # Reviewer's record now carries three UserMessages: the opener + both parents' turns.
    user_msgs = [e for e in api.read_record(reviewer_record) if e["kind"] == "UserMessage"]
    assert len(user_msgs) == 3
    texts = {u["payload"]["text"] for u in user_msgs[1:]}
    assert texts == {"review diff A", "review diff B"}
