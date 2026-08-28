"""Sprint 217a invariant — the first turn on an empty record uses `Runtime.run`,
not `Runtime.resume`.

The dispatch shape sprint 217a introduced:

  - empty record (no directory OR directory with zero envelopes)
    → `turn_sync` composes the topology with `first_turn_user_message` and
      calls `Runtime.run(topology)`. The record opens at
      `substrate.RunStarted@seq=0`; the `session_open` producer emits the
      first `UserMessage@seq=1` (or the next seq the kernel assigns for the
      first non-substrate envelope).
  - populated record → `Runtime.resume`.
  - torn record (read raises) → `TornRecordOnResume`; the daemon refuses
    both primitives; manifest transitions to `"interrupted"`.

Before 217a, `Runtime.resume` fired on both the empty and the populated
case. On an empty root, `_resume_bootstrap` saw `max_seq == -1`, injected
the resume event as the first envelope, and the record opened at seq 0
with `UserMessage` — no `substrate.RunStarted` at all. Finding 16 in the
piece-B review named this.

The compose is verified end-to-end elsewhere; this file locks the
invariant so a regression that flips `_record_state` or reverts the
branch fails a named test rather than a downstream one.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_registry import (  # noqa: E402
    FreshSessionRequiresUserMessage,
    SessionRegistry,
    TornRecordOnResume,
    _record_state,
)

from substrate import api  # noqa: E402
from substrate.topologies.session import SessionEndRequested, UserMessage  # noqa: E402


@pytest.fixture
def registry(tmp_path: Path) -> SessionRegistry:
    return SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )


_COUNTER = 0


def _create_deterministic(registry: SessionRegistry, tmp_path: Path) -> str:
    global _COUNTER
    _COUNTER += 1
    sid = f"s_test_{_COUNTER:03d}"
    m = registry.create(
        session_id=sid,
        name=None,
        driver="deterministic",
        workspace=str(tmp_path / "wsp"),
        workspace_shape="flat",
        bundle=None,
        seed="",
    )
    return m.session_id


def test_empty_record_first_turn_opens_with_runstarted_at_seq_0(
    registry: SessionRegistry, tmp_path: Path
) -> None:
    """A fresh session (no record on disk) receives a UserMessage; the
    record opens at `substrate.RunStarted@seq=0` and the UserMessage lands
    at the next seq. The negative shape — record opens at UserMessage@0
    with no RunStarted — is the pre-217a regression this test locks against.
    """
    sid = _create_deterministic(registry, tmp_path)
    manifest = registry.get(sid)
    assert manifest is not None
    record_root = Path(manifest.record_root)
    assert not record_root.exists(), "fresh session must not have a record dir yet"

    registry.turn_sync(
        sid,
        resume_event=UserMessage(text="hello", turn_index=0, assembled_prompt="hello", slash_source="user"),
        timeout_seconds=30.0,
    )

    envs = list(api.read_record(record_root))
    assert envs, "record must have envelopes after the first turn"
    first = envs[0]
    assert first["seq"] == 0, f"first envelope must be seq=0, got {first['seq']}"
    assert first["kind"] == api.RUN_STARTED, (
        f"first envelope must be substrate.RunStarted, got {first['kind']!r}. "
        f"pre-217a regression: Runtime.resume on empty record wrote UserMessage@0."
    )
    # UserMessage lands next (seq=1 or 2 depending on substrate.* header envelopes;
    # what matters is: it is NOT the seq-0 envelope).
    um_seqs = [int(e["seq"]) for e in envs if "UserMessage" in str(e.get("kind", ""))]
    assert um_seqs, "first-turn UserMessage did not land on the record"
    assert min(um_seqs) > 0, "UserMessage must not be the seq-0 envelope"


def test_fresh_session_rejects_non_user_message(
    registry: SessionRegistry, tmp_path: Path
) -> None:
    """A `SessionEndRequested` on an empty record raises
    `FreshSessionRequiresUserMessage` — the only kind the `session_open`
    producer can emit first is a `UserMessage`. `_shutdown_all_sessions`
    catches this and buckets under `skipped_fresh`."""
    sid = _create_deterministic(registry, tmp_path)
    with pytest.raises(FreshSessionRequiresUserMessage):
        registry.turn_sync(
            sid,
            resume_event=SessionEndRequested(session_id=sid, source="daemon_shutdown"),
            timeout_seconds=10.0,
        )


def test_torn_record_raises_typed_and_flips_status_to_interrupted(
    registry: SessionRegistry, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A record whose read raises must NOT dispatch either primitive:
    `Runtime.run` would double-head the sealed segment with a fresh
    `RunStarted@0`; `Runtime.resume` would inherit the torn tail. The
    daemon halts in place: `TornRecordOnResume` raises, manifest flips
    to `"interrupted"`. This is the fix for finding 1 in the piece-D
    fold review.

    `_record_state` classifies via `api.read_record`, which raises on
    sealed-segment gaps and CRC mismatches but silently recovers a torn
    HOT tail (that is the whole point of `framing.recover` on the hot
    segment). Rolling a sealed segment mid-test would take megabytes of
    written frames, so this test patches `api.read_record` from the
    session_registry module namespace to raise `RecordGapError` — the
    exact class the record module raises on a torn sealed tail. The
    signal being tested is the branch, not the corruption mode.
    """
    from substrate.errors import RecordGapError
    import session_registry as sreg

    sid = _create_deterministic(registry, tmp_path)
    # First turn — record now populated. Not patched yet.
    registry.turn_sync(
        sid,
        resume_event=UserMessage(
            text="hello", turn_index=0, assembled_prompt="hello", slash_source="user"
        ),
        timeout_seconds=30.0,
    )
    record_root = Path(registry.get(sid).record_root)
    assert _record_state(record_root)[0] == "has_envelopes"

    def _raise_read(*_a, **_kw):
        raise RecordGapError("simulated torn sealed segment (test)")

    monkeypatch.setattr(sreg.api, "read_record", _raise_read)

    state, cause = _record_state(record_root)
    assert state == "torn", f"expected torn, got {state} (cause={cause!r})"
    assert isinstance(cause, RecordGapError)

    with pytest.raises(TornRecordOnResume):
        registry.turn_sync(
            sid,
            resume_event=UserMessage(
                text="second", turn_index=1, assembled_prompt="second", slash_source="user"
            ),
            timeout_seconds=10.0,
        )
    assert registry.get(sid).status == "interrupted"


def test_populated_record_uses_resume_not_run(
    registry: SessionRegistry, tmp_path: Path
) -> None:
    """The second turn on a session must go through `Runtime.resume`, not
    `Runtime.run`. Observable signal: exactly one `substrate.RunStarted`
    on the record after two turns. Two would mean `.run` fired a second
    time (the pre-217a shape's inverse regression)."""
    sid = _create_deterministic(registry, tmp_path)
    for i, text in enumerate(("hello", "again")):
        registry.turn_sync(
            sid,
            resume_event=UserMessage(
                text=text, turn_index=i, assembled_prompt=text, slash_source="user"
            ),
            timeout_seconds=30.0,
        )
    envs = list(api.read_record(Path(registry.get(sid).record_root)))
    starts = [e for e in envs if e["kind"] == api.RUN_STARTED]
    assert len(starts) == 1, (
        f"expected exactly one RunStarted after two turns; got {len(starts)}. "
        f"Two would mean turn 2 dispatched Runtime.run instead of Runtime.resume."
    )
