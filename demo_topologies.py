"""Demo topologies shared by gen_demo_records.py (to CREATE the records) and server.py (to
RESUME them). The resumable topology mirrors the runtime's own pause/resume reference: stage1
runs, the run PAUSES awaiting an external ApprovalGranted, and a resume Trigger fires the
continuation (stage2) to a terminal — the same record, the same dense seq sequence."""

from __future__ import annotations

from typing import Any

from msgspec import Struct
from substrate.api import PerEvent, Subscription, any_of, pause_await_input, quiescence_with_watchdog


class Stage1Done(Struct, frozen=True):
    value: int


class Stage2Done(Struct, frozen=True):
    value: int


class ApprovalGranted(Struct, frozen=True):
    """The external resume event a resume Trigger subscribes to (externally supplied, producer=null)."""

    approved: bool


async def _stage1(_inp: Any) -> Any:
    yield Stage1Done(value=1)


async def _stage2(inp: Any) -> Any:
    yield Stage2Done(value=inp["value"] + 1)


def _paused_when(ctx: Any) -> bool:
    # pause once stage1 is done AND no approval has arrived yet; after the resume event is on the
    # log this is False, so the continuation runs to quiescence instead of re-pausing.
    return ctx.counts("Stage1Done") >= 1 and ctx.counts("ApprovalGranted") == 0


def resumable_topology(b: Any) -> None:
    b.producer_kind("stage1", schemas=[Stage1Done], schema_version=1, start=_stage1)
    b.producer_kind("stage2", schemas=[Stage2Done], schema_version=1, start=_stage2)
    b.initial("stage1")
    b.trigger(
        "on-approval",
        subscription=Subscription(kinds=frozenset({"ApprovalGranted"})),
        predicate=lambda ctx: bool(ctx.event.payload.get("approved")),
        starts="stage2",
        input_builder=lambda ctx: {"value": 1},
        policy=PerEvent(),
    )
    b.termination(
        any_of(
            pause_await_input(_paused_when, resume_condition="ApprovalGranted"),
            quiescence_with_watchdog(seconds=1),
        )
    )


def approval_event() -> ApprovalGranted:
    """The external event that resumes a paused resumable_topology run."""
    return ApprovalGranted(approved=True)
