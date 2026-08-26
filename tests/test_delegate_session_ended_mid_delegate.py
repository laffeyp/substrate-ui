"""Sprint 213b — delegate returns a typed failure when the reviewer session has ended.

`SessionRegistry.turn_sync` raises `SessionEndedMidTurn` if the session's status
is `ended` at call time (or transitions to ended between the caller's resolve
and the `.resume()` call under the per-session lock). Delegate wraps the raise
in a ValueError containing "session_ended_mid_delegate" so tool_loop surfaces
`ToolResult(ok=False, error=...)` to the model.

Two shapes:
  1. Session status already `ended` at call time — turn_sync raises before
     starting Runtime; delegate raises the typed failure.
  2. Delegate call fires against a session that never opened (no manifest
     yet) — surfaces as `KeyError` on turn_sync, which delegate re-raises.
"""

from __future__ import annotations

import sys
from collections.abc import Callable
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from session_registry import SessionEndedMidTurn, SessionRegistry  # noqa: E402

from substrate import api  # noqa: E402
from substrate.adapters import DeterministicResponder  # noqa: E402
from substrate.topologies.session import session_topology  # noqa: E402
from substrate.topologies.tool_loop.delegate import make_delegate  # noqa: E402


def _factory(manifest: object) -> Callable[[api.TopologyBuilder], None]:
    del manifest
    return session_topology(
        driver=DeterministicResponder(seed=7),
        driver_name="deterministic",
        driver_context_tokens=4096,
        seed="x",
        tools={},
        session_id="s_x",
        workspace_path="/tmp/x",
        script=None,
    )


def test_ended_session_raises_typed_failure(tmp_path: Path) -> None:
    base = tmp_path / "sessions"
    base.mkdir()
    registry = SessionRegistry(base=base, session_topology_factory=_factory)
    registry.create(
        session_id="s_dead",
        name="dead-reviewer",
        driver="deterministic",
        workspace="/tmp/x",
        workspace_shape="flat",
        bundle=None,
        seed="x",
    )
    # Mark the session ended before the delegate fires.
    registry.update_status("s_dead", "ended")

    d = make_delegate(
        responder=DeterministicResponder(seed=0),
        root=tmp_path / "parent",
        session_registry=registry,
    )
    with pytest.raises(ValueError, match="session_ended_mid_delegate"):
        d.run([{"task": "hi", "child_session_name": "dead-reviewer"}])


def test_registry_turn_sync_raises_session_ended_mid_turn_directly(tmp_path: Path) -> None:
    """SessionRegistry.turn_sync surfaces the typed error the delegate then wraps."""
    base = tmp_path / "sessions"
    base.mkdir()
    registry = SessionRegistry(base=base, session_topology_factory=_factory)
    registry.create(
        session_id="s_dead2",
        name=None,
        driver="deterministic",
        workspace="/tmp/x",
        workspace_shape="flat",
        bundle=None,
        seed="x",
    )
    registry.update_status("s_dead2", "ended")

    from substrate.topologies.session import UserMessage as SessionUserMessage

    with pytest.raises(SessionEndedMidTurn):
        registry.turn_sync(
            "s_dead2",
            SessionUserMessage(
                text="hi",
                turn_index=0,
                assembled_prompt="hi",
                slash_source="test",
            ),
        )


def test_unknown_session_name_raises_typed_failure(tmp_path: Path) -> None:
    """A delegate call naming a session that never was registered raises
    ValueError with `unknown session name`, not a KeyError."""
    base = tmp_path / "sessions"
    base.mkdir()
    registry = SessionRegistry(base=base, session_topology_factory=_factory)

    d = make_delegate(
        responder=DeterministicResponder(seed=0),
        root=tmp_path / "parent",
        session_registry=registry,
    )
    with pytest.raises(ValueError, match="unknown session name"):
        d.run([{"task": "hi", "child_session_name": "no-such-name"}])


def test_registry_without_factory_raises_runtime_error(tmp_path: Path) -> None:
    """A registry constructed without a `session_topology_factory` cannot fire
    turn_sync — raises RuntimeError naming the omitted seam.
    """
    base = tmp_path / "sessions"
    base.mkdir()
    registry = SessionRegistry(base=base)  # no factory
    registry.create(
        session_id="s_orphan",
        name="orphan",
        driver="deterministic",
        workspace="/tmp/x",
        workspace_shape="flat",
        bundle=None,
        seed="x",
    )
    from substrate.topologies.session import UserMessage as SessionUserMessage

    with pytest.raises(RuntimeError, match="session_topology_factory"):
        registry.turn_sync(
            "s_orphan",
            SessionUserMessage(
                text="hi",
                turn_index=0,
                assembled_prompt="hi",
                slash_source="test",
            ),
        )
