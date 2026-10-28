# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""UI sprint 172: a reply-side shift reaches the language route the bar line reads.

The deterministic driver's replies never vary, so the detector never warms up on them; a scripted
driver (swapped in through `_daemon_driver_resolver`, as test 121 does) answers short replies of
varying length for 22 turns, then long ones."""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest

import server
from _serving import call, serving

SHORT = ["One two three four five.", "One two three four five six.", "One two three four."]
LONG = " ".join(["This reply is much longer than every reply before it."] * 6)


class Scripted:
    name = "scripted"

    def __init__(self) -> None:
        self.n = 0

    def respond(self, prompt: str) -> str:
        text = SHORT[self.n % 3] if self.n < 22 else LONG
        self.n += 1
        return text


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> Iterator[str]:
    app.install_registry(base=tmp_path)
    with serving(app) as url:
        yield url


def test_a_reply_shift_reaches_the_route(app: server.App, base: str, monkeypatch: pytest.MonkeyPatch) -> None:
    scripted = Scripted()
    real = server._daemon_driver_resolver
    monkeypatch.setattr(
        server,
        "_daemon_driver_resolver",
        lambda app, name, params=None, workspace=None, session_id=None: scripted
        if name == "scripted"
        else real(app, name, params, workspace=workspace),
    )
    _s, body = call("POST", base + "/api/session", {"driver": "scripted"})
    sid = body["session_id"]
    for i in range(24):
        call("POST", base + f"/api/session/{sid}/turn", {"text": f"Question {i}?"}, timeout=60)
    _s, view = call("GET", base + f"/api/session/{sid}/language")
    model = [s for s in view["shifts"] if s["stream"] == "model"]
    assert any(s["measure"] == "words" and s["direction"] == "up" and s["turn"] == 22 for s in model), model
