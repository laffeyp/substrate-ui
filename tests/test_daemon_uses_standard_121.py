"""UI sprint 121: new sessions open on `standard`; `/model` mid-session reaches the model as an
environment update; `driver_params.cache_layout` is an opt-in only a system-channel driver takes."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from _serving import call, serving
from substrate import api
from substrate.adapters import DeterministicResponder

import server


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> str:
    app.install_registry(base=tmp_path)
    with serving(app) as url:
        yield url


def _events(app: server.App, sid: str) -> list[dict[str, Any]]:
    return list(api.read_record(Path(app.registry.get(sid).record_root), resolve_blobs=True))


def test_a_new_session_opens_on_standard(app: server.App, base: str) -> None:
    status, body = call("POST", base + "/api/session", {"driver": "deterministic"})
    assert status == 200, body
    sid = body["session_id"]
    assert app.registry.get(sid).bundle == "standard"
    call("POST", base + f"/api/session/{sid}/turn", {"text": "hello"}, timeout=60)
    composed = next(e["payload"] for e in _events(app, sid) if e["kind"] == "PromptComposed")
    assert composed["system"].startswith("# Every output is writing")
    assert "OVERRIDE any default behavior" in composed["text"]
    assert composed["text"].index("USER: hello") < composed["text"].index("STYLE: Write like")


def test_a_model_change_mid_session_is_told(
    app: server.App, base: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    """`/model` is a PATCH of the driver. The next turn's first step records SessionChanged and
    puts the update line after the message (kernel K274)."""
    real = server._daemon_driver_resolver
    monkeypatch.setattr(
        server,
        "_daemon_driver_resolver",
        lambda app, name, params=None, workspace=None: DeterministicResponder(seed=0)
        if name == "stand-in"
        else real(app, name, params, workspace=workspace),
    )
    _s, body = call("POST", base + "/api/session", {"driver": "deterministic", "bundle": "harness"})
    sid = body["session_id"]
    call("POST", base + f"/api/session/{sid}/turn", {"text": "one"}, timeout=60)
    status, body = call("PATCH", base + f"/api/session/{sid}", {"driver": "stand-in"})
    assert status == 200, body
    call("POST", base + f"/api/session/{sid}/turn", {"text": "two"}, timeout=60)
    events = _events(app, sid)
    changes = [e["payload"] for e in events if e["kind"] == "SessionChanged"]
    assert changes == [{"field": "driver", "old": "deterministic", "new": "stand-in"}]
    last = [e["payload"]["text"] for e in events if e["kind"] == "PromptComposed"][-1]
    line = "Environment update: driver changed from deterministic to stand-in."
    assert last.index("USER: two") < last.index(line)


def test_cache_layout_is_refused_without_a_system_channel(base: str) -> None:
    status, body = call(
        "POST",
        base + "/api/session",
        {"driver": "deterministic", "driver_params": {"cache_layout": True}},
    )
    assert status == 400 and "system channel" in str(body), body
    _s, body = call("POST", base + "/api/session", {"driver": "deterministic"})
    status, body = call(
        "PATCH", base + f"/api/session/{body['session_id']}", {"driver_params": {"cache_layout": True}}
    )
    assert status == 400, body


def test_cache_layout_is_accepted_for_claude(app: server.App, base: str) -> None:
    status, body = call(
        "POST",
        base + "/api/session",
        {"driver": "claude", "driver_params": {"cache_layout": True}},
    )
    assert status == 200, body
    assert app.registry.get(body["session_id"]).driver_params == {"cache_layout": True}
