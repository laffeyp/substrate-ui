"""Kernel K278 in the daemon: a small model's session opens on standard-small and default-small,
and SessionStarted records its class."""

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


def test_a_small_model_opens_on_the_small_texts(
    app: server.App, base: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(server, "_model_class", lambda name: "small")
    _s, body = call("POST", base + "/api/session", {"driver": "deterministic"})
    sid = body["session_id"]
    call("POST", base + f"/api/session/{sid}/turn", {"text": "hi"}, timeout=60)
    events = list(api.read_record(Path(app.registry.get(sid).record_root), resolve_blobs=True))
    started = next(e["payload"] for e in events if e["kind"] == "SessionStarted")
    assert started["bundle"] == "standard-small" and started["model_class"] == "small"
    role = next(
        e["payload"] for e in events if e["kind"] == "PromptFragment" and e["payload"]["source"] == "role"
    )
    assert role["provenance"]["role_name"] == "default-small"
    assert app.registry.get(sid).bundle == "standard"  # the manifest keeps what was asked
