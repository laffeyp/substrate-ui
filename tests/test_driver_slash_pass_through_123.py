# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""UI sprint 123: `//<command>` passes `/<command>` to a driver that takes slash commands, as written,
with no prompt around it; the model's history leaves the turn out (session vocabulary § P.11)."""

from __future__ import annotations

from pathlib import Path

import pytest
from _serving import call, serving
from substrate import api

import server


class _Echo:
    """Stands in for a CLI with slash commands: replies with what it received."""

    name = "echo"

    def __init__(self) -> None:
        self.prompts: list[str] = []

    def respond(self, prompt: str) -> str:
        self.prompts.append(prompt)
        return f"ran {prompt}"


@pytest.fixture
def base(app: server.App, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> str:
    app.install_registry(base=tmp_path)
    with serving(app) as url:
        yield url


def test_a_driver_without_slash_commands_refuses(base: str) -> None:
    _s, body = call("POST", base + "/api/session", {"driver": "deterministic"})
    status, body = call(
        "POST",
        base + f"/api/session/{body['session_id']}/turn",
        {"text": "/context", "driver_command": True},
    )
    assert status == 400 and "has no slash commands" in str(body), body


def test_the_command_goes_out_as_written_and_stays_out_of_history(
    app: server.App, base: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    echo = _Echo()
    monkeypatch.setitem(server.KNOWN_CLI_ADAPTERS["claude"], "slash_commands", True)
    monkeypatch.setattr(server, "_daemon_driver_resolver", lambda *a, **k: echo)
    _s, body = call("POST", base + "/api/session", {"driver": "claude", "bundle": "harness"})
    sid = body["session_id"]
    status, body = call(
        "POST", base + f"/api/session/{sid}/turn", {"text": "/context", "driver_command": True}, timeout=60
    )
    assert status == 200, body
    call("POST", base + f"/api/session/{sid}/turn", {"text": "hello"}, timeout=60)
    assert echo.prompts[0] == "/context"
    assert "/context" not in echo.prompts[1] and "ran /context" not in echo.prompts[1]
    events = list(api.read_record(Path(app.registry.get(sid).record_root), resolve_blobs=True))
    first = next(e["payload"] for e in events if e["kind"] == "PromptComposed")
    assert first["text"] == "/context" and first["system"] == ""
    replies = [e["payload"]["text"] for e in events if e["kind"] == "ModelReply"]
    assert replies[0] == "ran /context"
