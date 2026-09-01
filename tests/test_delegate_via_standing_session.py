# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 213b — delegate path 1 routes into a standing session via SessionRegistry.turn_sync.

Sprint 054 phase D — post the SessionRegistry move into substrate, this
file's boundary reads clearly: this is the DAEMON-flow test. It exercises
the per-session threading.Lock's cross-parent FIFO invariant (behaviour 2)
plus the fresh-open-via-.run() shape (behaviour 1) — both concerns of how
the DAEMON drives the registry across concurrent parent handlers.

The library-side unit test for delegate path 1 lives at
`substrate/tests/test_delegate_per_call_child_session_name.py`. The
library-side live test lives at
`substrate/tests/test_realmodel_delegate_standing.py`. Both were split
out of this file when the registry moved.

Reviewer session is a real `session_topology` running under
`Runtime.resume`; the delegate's parent thread calls
`session_registry.turn_sync(session_id, UserMessage(...))`, which
serializes on the per-session `threading.Lock`, drives the resume in a
fresh worker event loop, and returns the reviewer's manifest +
record_root. The parent reads the tail `FinalAnswer` off that record and
folds the answer back.

Two behaviors under test:
  1. A first turn opens the reviewer via `.run()` (writes RunStarted), pauses on
     Park. A delegate call with `child_session_name="reviewer"` runs a second
     turn on the same record; the reviewer's record grows with the delegated
     UserMessage + reply.
  2. Two concurrent parents both delegating to the reviewer FIFO-queue on the
     per-session threading lock — both complete, no interleaved writes on the
     reviewer's record.
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


def _reviewer_factory(
    manifest: object, first_turn_user_message: object = None
) -> Callable[[api.TopologyBuilder], None]:
    del first_turn_user_message  # delegate path never opens a fresh record via .run()
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
async def test_delegated_turn_index_comes_from_reviewer_not_parent(tmp_path: Path) -> None:
    """Post-review 2026-08-26 finding 1 fix. `UserMessage.turn_index` on the
    reviewer's record must count from the reviewer's OWN state, not the
    parent's record seq. Before: a delegate injected `turn_index=parent_seq`
    which could jump from 0 to 46 in one step. After: the delegate reads the
    reviewer's tail UserMessage turn_index and passes `tail + 1`.
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
        seed="x",
    )
    reviewer_record = base / "s_reviewer" / "record"
    await _open_reviewer(reviewer_record)  # reviewer sees turn_index=0

    # The delegate parent has a rich record (many envelopes on its OWN root),
    # simulating parent_seq_at_call = 46. Sprint 213a's constructor kwarg accepts
    # a parent_record_root but the reviewer's turn_index must NOT copy from that.
    parent_record = tmp_path / "parent-record"

    from collections.abc import AsyncIterator
    from msgspec import Struct

    class Tick(Struct, frozen=True):
        n: int

    async def _emit(inp: object) -> AsyncIterator[Tick]:
        del inp
        for i in range(46):
            yield Tick(n=i)

    def parent_topology(b: api.TopologyBuilder) -> None:
        b.producer_kind(
            "emitter",
            schemas=[Tick],
            schema_version=1,
            factory=lambda: _emit,
            deterministic=True,
        )
        b.initial("emitter", input={})
        b.termination(api.threshold_count("Tick", 46))

    await api.Runtime(parent_record).run(parent_topology)

    d = make_delegate(
        responder=DeterministicResponder(seed=0),
        root=tmp_path / "parent",
        session_registry=registry,
        parent_session_id="s_parent",
        parent_record_root=parent_record,
    )
    import asyncio

    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None,
        lambda: d.run([{"task": "hi via delegate", "child_session_name": "reviewer"}]),
    )
    assert result["via"] == "standing_session:reviewer"
    user_msgs = [e for e in api.read_record(reviewer_record) if e["kind"] == "UserMessage"]
    # The reviewer saw one UserMessage at open (turn_index=0), then the delegate's.
    # The delegated turn_index must be 1 — reviewer's tail turn_index (0) + 1 —
    # NOT 45 (the parent record's tail seq).
    assert user_msgs[-1]["payload"]["text"] == "hi via delegate"
    assert user_msgs[-1]["payload"]["turn_index"] == 1


@pytest.mark.asyncio
async def test_delegate_reads_only_this_turns_final_answer(tmp_path: Path) -> None:
    """Post-review 2026-08-26 finding 2 fix. The reviewer's record accumulates
    a FinalAnswer per turn. The delegate must return the ONE this turn produced,
    not `finals[-1]` scoped across the whole record. This test primes the
    reviewer with two prior turns (each answering something distinct), then
    fires a delegated turn — the delegate's answer text must come from the
    delegated turn's FinalAnswer, at a seq strictly greater than the seq the
    reviewer's record held before turn_sync ran.
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
        seed="x",
    )
    reviewer_record = base / "s_reviewer" / "record"
    # Two priming turns so the reviewer's record carries prior FinalAnswers.
    await _open_reviewer(reviewer_record)
    from substrate.topologies.session import UserMessage as SessionUserMessage

    await api.Runtime(reviewer_record, persistent=True).resume(
        _reviewer_factory(None),
        resume_event=SessionUserMessage(
            text="prior turn one",
            turn_index=1,
            assembled_prompt="prior turn one",
            slash_source="chat",
        ),
    )
    prior_finals = [
        e for e in api.read_record(reviewer_record) if e["kind"] == "FinalAnswer"
    ]
    prior_last_final_seq = prior_finals[-1]["seq"]
    prior_last_final_text = prior_finals[-1]["payload"]["text"]

    d = make_delegate(
        responder=DeterministicResponder(seed=0),
        root=tmp_path / "parent",
        session_registry=registry,
    )
    import asyncio

    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None,
        lambda: d.run(
            [{"task": "the delegated question", "child_session_name": "reviewer"}]
        ),
    )
    # The delegated turn's FinalAnswer sits at a seq > prior_last_final_seq.
    all_finals = [
        e for e in api.read_record(reviewer_record) if e["kind"] == "FinalAnswer"
    ]
    delegated_finals = [
        e for e in all_finals if int(e["seq"]) > int(prior_last_final_seq)
    ]
    assert len(delegated_finals) == 1
    # The parent's ToolResult reads exactly that seq's answer, not the earlier one.
    assert result["answer"] == delegated_finals[-1]["payload"]["text"]
    # And crucially, the answer is NOT a prior turn's text.
    assert result["answer"] != prior_last_final_text


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
