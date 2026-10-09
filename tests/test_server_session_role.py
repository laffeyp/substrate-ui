"""Sprint 223a — `role` field on POST /api/session + manifest round-trip."""

from __future__ import annotations

import functools

import json
from pathlib import Path

import pytest
from _serving import call, serving  # noqa: E402
from substrate.topologies.session_registry import SessionRegistry  # noqa: E402

import server  # noqa: E402


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> tuple[str, Path]:
    app.install_registry(base=tmp_path)
    with serving(app) as base:
        yield base, tmp_path


def _post(url: str, body: dict) -> tuple[int, dict]:
    status, payload = call("POST", url, body, timeout=10)
    return status, payload


def test_default_role_when_absent(app: server.App, base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _post(url + "/api/session", {"driver": "deterministic"})
    assert status == 200, body
    assert body["role"] == "default"
    sid = body["session_id"]
    manifest = app.registry.get(sid)
    assert manifest.role == "default"


def test_custom_role_that_resolves(base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _post(
        url + "/api/session",
        {"driver": "deterministic", "role": "default"},
    )
    assert status == 200, body
    assert body["role"] == "default"


def test_unknown_role_returns_400(base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _post(
        url + "/api/session",
        {"driver": "deterministic", "role": "does-not-exist-xyz"},
    )
    assert status == 400, body
    combined = json.dumps(body)
    assert "does-not-exist-xyz" in combined


def test_role_survives_boot_scan(app: server.App, base: tuple[str, Path], tmp_path: Path) -> None:
    url, base_path = base
    status, body = _post(url + "/api/session", {"driver": "deterministic", "role": "default"})
    assert status == 200
    sid = body["session_id"]

    fresh = SessionRegistry(
        base=base_path,
        session_topology_factory=functools.partial(
            server._build_session_topology_from_manifest, app
        ),
    )
    fresh.boot_scan()
    reloaded = fresh.get(sid)
    assert reloaded is not None
    assert reloaded.role == "default"
