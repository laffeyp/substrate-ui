"""Write two finished sessions into $SUBSTRATE_HOME for the both_session_shapes gate (U119).

`old` holds what a session wrote before vocabulary v0.3 (ModelReply, FinalAnswer, Park); `new`
holds the v0.3 shape (a tool-only ModelReply, ModelReply per call with stop_reason and usage,
Returned), opened by the SessionWarning a failed prompt source writes since kernel K263. Both carry the same two turns. Each record is written by the kernel itself: a one-producer
topology yields the events, so the record is valid and attachable. Prints the two session ids as
JSON on stdout.
"""

from __future__ import annotations

import asyncio
import json
import os
import uuid
from collections.abc import AsyncIterator, Callable
from pathlib import Path
from typing import Any

from msgspec import Struct

from substrate import api
from substrate.topologies.session import (
    FinalAnswer, ModelReply, Park, Returned, SessionWarning, ToolCall, ToolResult, UserMessage,
)
from substrate.topologies.session_registry import SessionRegistry


class _V2:
    """The ModelReply sessions wrote before v0.3 (one per answer, no stop_reason); the session's
    own ModelReply has the v0.3 fields since sprint K262."""

    class ModelReply(Struct, frozen=True):
        text: str
        model_usage: dict[str, Any]
        turn_index: int


_USAGE = {"model": "fixture", "prompt_tokens": 9, "completion_tokens": 3, "wall_ms": 40, "estimated": False}


def _old() -> list[Any]:
    return [
        UserMessage(text="add 2 and 3", turn_index=0, assembled_prompt="add 2 and 3", slash_source="chat"),
        ToolCall(call_id="c0", tool="add", args=[2, 3], step=0),
        ToolResult(call_id="c0", tool="add", output=5, step=0),
        _V2.ModelReply(text="It is 5.", model_usage={}, turn_index=0),
        FinalAnswer(text="It is 5.", steps=1),
        Park(awaiting="UserMessage", turn_index=0, reason="final_answer"),
        UserMessage(text="thanks", turn_index=1, assembled_prompt="thanks", slash_source="chat"),
        _V2.ModelReply(text="Any time.", model_usage={}, turn_index=1),
        FinalAnswer(text="Any time.", steps=0),
        Park(awaiting="UserMessage", turn_index=1, reason="final_answer"),
    ]


def _new() -> list[Any]:
    return [
        SessionWarning(
            session_id="fixture", kind="fragment_source_failed", seed_tokens=0, driver_context_tokens=0,
            source_name="role", detail="FileNotFoundError('reviewer.md')",
        ),
        UserMessage(text="add 2 and 3", turn_index=0, assembled_prompt="add 2 and 3", slash_source="chat"),
        ModelReply(text="", stop_reason="tool_use", usage=_USAGE, turn_index=0, step=0),
        ToolCall(call_id="c0", tool="add", args=[2, 3], step=0),
        ToolResult(call_id="c0", tool="add", output=5, step=0),
        ModelReply(text="It is 5.", stop_reason="end_turn", usage=_USAGE, turn_index=0, step=1),
        Returned(turn_index=0, reason="replied"),
        UserMessage(text="thanks", turn_index=1, assembled_prompt="thanks", slash_source="chat"),
        ModelReply(text="Any time.", stop_reason="end_turn", usage=_USAGE, turn_index=1, step=0),
        Returned(turn_index=1, reason="replied"),
    ]


def _topology(events: list[Any]) -> Callable[[api.TopologyBuilder], None]:
    schemas = list({type(e).__name__: type(e) for e in events}.values())

    def factory() -> Callable[[Any], AsyncIterator[Any]]:
        async def body(_inp: Any) -> AsyncIterator[Any]:
            for e in events:
                yield e

        return body

    def topo(b: api.TopologyBuilder) -> None:
        b.producer_kind("fixture", schemas=schemas, schema_version=1, factory=factory, deterministic=True)
        b.initial("fixture", input={})
        b.termination(api.all_completed())

    return topo


def main() -> None:
    home = Path(os.environ["SUBSTRATE_HOME"])
    registry = SessionRegistry(base=home / "sessions")
    ids: dict[str, str] = {}
    for label, events in (("old", _old()), ("new", _new())):
        sid = f"s_{uuid.uuid4().hex[:24]}"
        workspace = home / "sessions" / sid / "workspace"
        workspace.mkdir(parents=True, exist_ok=True)
        manifest = registry.create(
            session_id=sid, name=f"shape-{label}", driver="deterministic", workspace=str(workspace),
            workspace_shape="flat", bundle=None, seed="",
        )
        asyncio.run(api.Runtime(Path(manifest.record_root), persistent=True).run(_topology(events), name="session"))
        ids[label] = sid
    print(json.dumps(ids))


if __name__ == "__main__":
    main()
