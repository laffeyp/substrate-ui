# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Kernels K278, K288 and UI sprint 132 in the daemon: a session named no bundle gets its model's
default guidance level, resolved once at creation and kept on the manifest; a bundle the caller
names is kept as given; a small model also reads `default-small`; SessionStarted records the
class."""

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


def _started(app: server.App, sid: str) -> tuple[dict, list[dict]]:
    events = list(api.read_record(Path(app.registry.get(sid).record_root), resolve_blobs=True))
    return next(e["payload"] for e in events if e["kind"] == "SessionStarted"), events


@pytest.mark.parametrize(
    ("model_class", "bundle"),
    [("small", "standard-low"), ("medium", "standard-medium"), ("large", "standard")],
)
def test_no_bundle_named_gets_the_models_level(
    app: server.App, base: str, monkeypatch: pytest.MonkeyPatch, model_class: str, bundle: str
) -> None:
    monkeypatch.setattr(server, "_model_class", lambda name: model_class)
    _s, body = call("POST", base + "/api/session", {"driver": "deterministic"})
    sid = body["session_id"]
    assert app.registry.get(sid).bundle == bundle  # resolved once, on the manifest
    call("POST", base + f"/api/session/{sid}/turn", {"text": "hi"}, timeout=60)
    started, events = _started(app, sid)
    assert started["bundle"] == bundle and started["model_class"] == model_class
    role = next(
        e["payload"]
        for e in events
        if e["kind"] == "PromptFragment" and e["payload"]["source"] == "role"
    )
    assert role["provenance"]["role_name"] == (
        "default-small" if model_class == "small" else "default"
    )


def test_a_named_level_wins_over_the_model(
    app: server.App, base: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The operator chose high for a small model: no remap by class, at creation or on a turn."""
    monkeypatch.setattr(server, "_model_class", lambda name: "small")
    _s, body = call(
        "POST", base + "/api/session", {"driver": "deterministic", "bundle": "standard"}
    )
    sid = body["session_id"]
    call("POST", base + f"/api/session/{sid}/turn", {"text": "hi"}, timeout=60)
    started, _events = _started(app, sid)
    assert app.registry.get(sid).bundle == "standard" and started["bundle"] == "standard"


def test_the_old_low_name_still_opens(app: server.App, base: str) -> None:
    status, body = call(
        "POST", base + "/api/session", {"driver": "deterministic", "bundle": "standard-small"}
    )
    assert status == 200, body
