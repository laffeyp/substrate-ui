# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""UI sprint 161 (vocabulary § U): PATCH /api/session/<id> takes `guidance`, a level set as its
bundle; `auto` is the model's default level, resolved as at open; an unknown level is refused with
the levels named.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from _serving import call, serving  # noqa: E402
from substrate.topologies.session.model_class import guidance_bundle, guidance_level

import server  # noqa: E402


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> str:
    app.install_registry(base=tmp_path)
    with serving(app) as base:
        yield base


def _create(base: str, workspace: Path) -> str:
    _s, resp = call(
        "POST",
        base + "/api/session",
        {"driver": "deterministic", "workspace": str(workspace)},
        timeout=15,
    )
    return resp["session_id"]


def test_a_level_sets_its_bundle(app: server.App, base: str, tmp_path: Path) -> None:
    sid = _create(base, tmp_path / "wsp")
    status, body = call("PATCH", base + f"/api/session/{sid}", {"guidance": "low"}, timeout=15)
    assert status == 200, body
    assert body["bundle"] == "standard-low" == app.registry.get(sid).bundle


def test_auto_is_the_models_default(app: server.App, base: str, tmp_path: Path) -> None:
    sid = _create(base, tmp_path / "wsp")
    call("PATCH", base + f"/api/session/{sid}", {"guidance": "low"}, timeout=15)
    status, body = call("PATCH", base + f"/api/session/{sid}", {"guidance": "auto"}, timeout=15)
    assert status == 200, body
    assert body["bundle"] == guidance_bundle(guidance_level(server._model_class("deterministic")))


def test_an_unknown_level_is_refused(app: server.App, base: str, tmp_path: Path) -> None:
    sid = _create(base, tmp_path / "wsp")
    before = app.registry.get(sid).bundle
    status, body = call("PATCH", base + f"/api/session/{sid}", {"guidance": "loud"}, timeout=15)
    assert status == 400
    assert "loud" in body["error"] and "auto, harness, low, medium, high" in body["error"]
    assert app.registry.get(sid).bundle == before
