# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""UI sprint 122: `/dellm <text>` posts the turn with {"skill": "dellm"}; the daemon records it as
slash_source "skill:dellm", and the session loads the skill before the model starts (kernel K277)."""

from __future__ import annotations

from pathlib import Path

import pytest
from _serving import call, serving
from substrate import api

import server


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> str:
    app.install_registry(base=tmp_path)
    with serving(app) as url:
        yield url


def test_a_dellm_turn_loads_the_skill_first(app: server.App, base: str) -> None:
    _s, body = call("POST", base + "/api/session", {"driver": "deterministic", "bundle": "harness"})
    sid = body["session_id"]
    status, body = call(
        "POST", base + f"/api/session/{sid}/turn", {"text": "fix this", "skill": "dellm"}, timeout=60
    )
    assert status == 200, body
    events = list(api.read_record(Path(app.registry.get(sid).record_root), resolve_blobs=True))
    um = next(e["payload"] for e in events if e["kind"] == "UserMessage")
    assert um["slash_source"] == "skill:dellm" and um["text"] == "fix this"
    skill = next(
        e for e in events if e["kind"] == "PromptFragment" and e["payload"]["source"] == "skill"
    )
    composed = next(e for e in events if e["kind"] == "PromptComposed")
    assert skill["seq"] < composed["seq"]
    assert "# De-LLM-ize" in composed["payload"]["text"]


def test_a_bad_skill_name_is_refused(base: str) -> None:
    _s, body = call("POST", base + "/api/session", {"driver": "deterministic"})
    sid = body["session_id"]
    status, body = call("POST", base + f"/api/session/{sid}/turn", {"text": "x", "skill": "../etc"})
    assert status == 400, body
