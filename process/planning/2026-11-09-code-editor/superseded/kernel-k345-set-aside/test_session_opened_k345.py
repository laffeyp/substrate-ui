# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""K345 (session vocabulary § AD): an ended session opened again without a message.

The app ends every session when it quits (`SessionEndRequested`, source `daemon_shutdown`), and a
pane that reattaches finds it ended. `SessionRegistry.open_session` resumes the record on
`SessionOpened`, which the session topology pauses on as it pauses on Returned: the session is
parked again, takes a view's edits at rest and its next turn, and its turn index does not move.
"""

from __future__ import annotations

import json
from pathlib import Path

from substrate import api
from substrate.adapters import DeterministicResponder
from substrate.topologies.session import SessionEndRequested
from substrate.topologies.session_registry import (
    SessionRegistry,
    SessionStatus,
    _scan_record_status,
)
from tests.test_append_at_rest_k340 import _EDIT, _create, _registry, _turn


def _ended(tmp_path: Path) -> tuple[SessionRegistry, str, Path]:
    reg = _registry(tmp_path, DeterministicResponder(seed=0))
    sid = _create(reg, tmp_path)
    _, root = _turn(reg, sid, "the first message")
    m, _ = reg.turn_sync(
        sid, resume_event=SessionEndRequested(session_id=sid, source="daemon_shutdown")
    )
    assert m.status == SessionStatus.ENDED
    assert list(api.read_record(root))[-1]["kind"] == api.RUN_FINALISED
    return reg, sid, root


def test_an_ended_session_opens_again_and_pauses(tmp_path: Path) -> None:
    reg, sid, root = _ended(tmp_path)
    before = list(api.read_record(root))
    turn_before = reg.next_turn_index(sid)

    m = reg.open_session(sid, "reattach")

    assert m.status == SessionStatus.PARKED
    after = list(api.read_record(root))
    assert after[: len(before)] == before, "nothing already on the record moves"
    assert [e["seq"] for e in after] == list(range(len(after))), "one dense sequence"
    opened = [e for e in after[len(before) :] if e["kind"] == "SessionOpened"]
    assert len(opened) == 1 and opened[0]["payload"] == {"session_id": sid, "source": "reattach"}
    tail = after[-1]
    assert tail["kind"] == api.TERMINATION_MATCHED
    assert tail["payload"]["decision"] == "pause-await-input"
    assert tail["seq"] > opened[0]["seq"]
    assert not any(e["kind"] in ("UserMessage", "ModelReply") for e in after[len(before) :]), (
        "no turn ran"
    )
    assert _scan_record_status(root) == SessionStatus.PARKED
    assert reg.next_turn_index(sid) == turn_before, "an open is not a turn"


def test_after_the_open_an_edit_appends_at_rest(tmp_path: Path) -> None:
    reg, sid, root = _ended(tmp_path)
    reg.open_session(sid, "edit")
    out = reg.append_event(sid, _EDIT)
    assert out["written"] == "at_rest"
    assert list(api.read_record(root))[out["seq"]]["kind"] == "FileWritten"
    assert _scan_record_status(root) == SessionStatus.PARKED


def test_after_the_open_a_turn_runs_with_the_next_index_and_the_earlier_turn(
    tmp_path: Path,
) -> None:
    reg, sid, root = _ended(tmp_path)
    # Ending the session went through turn_sync, which advanced the index; the open does not.
    expected = reg.next_turn_index(sid)
    reg.open_session(sid, "reattach")
    m, _ = _turn(reg, sid, "the second message")
    assert m.status == SessionStatus.PARKED
    envs = list(api.read_record(root))
    indexes = [e["payload"]["turn_index"] for e in envs if e["kind"] == "UserMessage"]
    assert indexes == [0, expected]
    second = max(i for i, e in enumerate(envs) if e["kind"] == "UserMessage")
    prompts = [json.dumps(e["payload"]) for e in envs[second:] if e["kind"] == "PromptComposed"]
    assert any("the first message" in p for p in prompts), "the model reads the earlier turn"


def test_a_session_that_is_not_ended_is_returned_unchanged(tmp_path: Path) -> None:
    reg = _registry(tmp_path, DeterministicResponder(seed=0))
    sid = _create(reg, tmp_path)
    fresh = reg.open_session(sid, "edit")
    assert fresh.status != SessionStatus.ENDED
    _, root = _turn(reg, sid, "the first message")
    before = list(api.read_record(root))
    m = reg.open_session(sid, "reattach")
    assert m.status == SessionStatus.PARKED
    assert list(api.read_record(root)) == before, "a parked session's record is not written"
