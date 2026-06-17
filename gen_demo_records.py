#!/usr/bin/env python3
"""Generate REAL non-clean run records for the UI's §7.2 surfaces (review #32 finding 2).

The 9 bundled records are all clean/finalised, so the console's red-FAILED / cyan-PAUSED /
NOT-CLEAN branches never fire against real data. This produces three REAL records — by actually
running topologies, not hand-authoring — so §7.2 is demonstrable end-to-end and the failure-status
serialization is exercised over the wire:

  demo_failed   — a View raises -> run-level FAILED (reason=view_failure), status="failed"
  demo_paused   — pause_await_input fires -> status="paused", awaiting an external input
  demo_broken   — a Producer fails INSIDE a clean finalise -> status="finalised", producers_failed>0
                  (the finished-!=-worked case: the verdict must read NOT CLEAN)

Written to substrate-ui/runs/, where the server serves them alongside the bundled records.
Run: cd substrate && uv run python ../substrate-ui/gen_demo_records.py
"""

from __future__ import annotations

import asyncio
import shutil
from pathlib import Path
from typing import Any

from msgspec import Struct
from substrate.api import (
    Runtime,
    Subscription,
    pause_await_input,
    quiescence_with_watchdog,
    threshold_count,
)

from demo_topologies import resumable_topology

RUNS = Path(__file__).resolve().parent / "runs"


class Ping(Struct, frozen=True):
    n: int


class Num(Struct, frozen=True):
    n: int


class Message(Struct, frozen=True):
    text: str


async def assistant(inp: Any) -> Any:
    prompt = (inp or {}).get("prompt", "")
    yield Message(text=f"Three bullets on: {prompt[:40]} — (1) cause (2) impact (3) fix.")


def topo_solo(b: Any) -> None:
    """The base case: one Producer, a real INPUT seed in -> one Message out. Gives the I/O surface
    a record with a non-empty resolved_input to render as the input document."""
    b.producer_kind("assistant", schemas=[Message], schema_version=1, start=assistant)
    b.initial("assistant", input={"prompt": "Summarize the Q3 incident report"})
    b.baseline(dataset="q3_incidents", seed=42)  # the known-baseline channel (fixtures/seeds)
    b.termination(threshold_count("Message", 1))


def topo_seq(values: list[int]) -> object:
    """A tiny deterministic topology emitting a fixed sequence — two runs with different sequences
    diverge at the first differing event (a real mid-run D-8 divergence for the diff surface)."""

    async def emitter(_inp: Any) -> Any:
        for v in values:
            yield Num(n=v)

    def topo(b: Any) -> None:
        b.producer_kind("emitter", schemas=[Num], schema_version=1, start=emitter)
        b.initial("emitter")
        b.termination(threshold_count("Num", len(values)))

    return topo


async def pinger(_inp: Any) -> Any:
    yield Ping(n=1)


async def boomer(_inp: Any) -> Any:
    raise RuntimeError("ResponderUnavailable: connection refused")
    yield Ping(n=1)  # unreachable; makes this an async generator


class BoomView:
    """A View whose update() raises — the run dies with reason=view_failure (a run-level failure)."""

    subscription = Subscription(kinds=frozenset({"Ping"}))
    deterministic = False

    def update(self, event: Any) -> None:
        raise RuntimeError("view aggregation failed")

    def value(self) -> Any:
        return None


def topo_failed(b: Any) -> None:
    b.producer_kind("pinger", schemas=[Ping], schema_version=1, start=pinger)
    b.initial("pinger")
    b.view("boom", BoomView())
    b.termination(quiescence_with_watchdog(seconds=1))


def topo_paused(b: Any) -> None:
    b.producer_kind("pinger", schemas=[Ping], schema_version=1, start=pinger)
    b.initial("pinger")
    b.termination(pause_await_input(when=lambda ctx: True, resume_condition="HumanApproval"))


def topo_broken(b: Any) -> None:
    b.producer_kind("boomer", schemas=[Ping], schema_version=1, start=boomer)
    b.initial("boomer")
    b.termination(quiescence_with_watchdog(seconds=1))


async def main() -> None:
    specs = [
        ("demo_failed", topo_failed, False),
        ("demo_paused", topo_paused, True),  # pause is a persistent-bus operation
        ("demo_broken", topo_broken, False),
        # a diverging pair for the diff surface: same topology, sequences differ at the 3rd event.
        ("demo_diff_a", topo_seq([1, 2, 3]), False),
        ("demo_diff_b", topo_seq([1, 2, 9]), False),
        ("demo_solo_chat", topo_solo, False),  # a real input seed -> one Message out (for the I/O surface)
        ("demo_resumable", resumable_topology, True),  # pauses awaiting approval -> resumable (control)
    ]
    for name, topo, persistent in specs:
        root = RUNS / f"{name}.record"
        if root.exists():
            shutil.rmtree(root)
        root.parent.mkdir(parents=True, exist_ok=True)
        result = await Runtime(root, persistent=persistent).run(topo)
        for lock in root.rglob(".lock"):
            lock.unlink()
        print(f"  {name:14} -> status={result.status}")

    # a deliberately TORN record (no terminal RunFinalised) — so the static-incomplete / torn
    # rendering is testable (amber "INCOMPLETE", never "LIVE" since it isn't being written). Built
    # by running a clean topology, then dropping its terminal frame (review #36).
    src, torn = RUNS / "demo_solo_chat.record", RUNS / "demo_torn.record"
    if torn.exists():
        shutil.rmtree(torn)
    shutil.copytree(src, torn)
    seg = next(torn.glob("events-*.jsonl"))
    lines = [ln for ln in seg.read_text().splitlines() if ln.strip()]
    while lines and "RunFinalised" in lines[-1]:
        lines.pop()  # drop the terminal -> a record with no RunFinalised = torn/incomplete
    seg.write_text("\n".join(lines) + "\n")
    print(f"  demo_torn      -> truncated to {len(lines)} frames (no terminal)")


if __name__ == "__main__":
    asyncio.run(main())
