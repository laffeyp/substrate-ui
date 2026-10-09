"""Sprint 215c — PATCH /api/session/<id> mutates driver and name (this file); tools,
per_turn, bundle and driver_params are PATCH-able too and are tested in
test_server_session_patch_{tools,per_turn,bundle}.py and
test_server_session_driver_params.py.

Every absent key leaves that field alone. `workspace`, `workspace_shape` and `seed` are
not PATCH-able; a body carrying them returns 400 naming the field.

Behaviors under test:
  1. PATCH driver updates the in-memory catalog AND the on-disk
     manifest.json; boot_scan from a fresh SessionRegistry pointing at
     the same base dir sees the new value.
  2. PATCH name updates by-name index; old name resolves to None; new
     name resolves to session_id.
  3. PATCH with a colliding name returns 409 with existing_session_id.
  4. PATCH on unknown session_id returns 404.
  5. Empty body returns 400 (no mutable fields).
  6. A body with `seed` returns 400 naming it as not PATCH-able.

"""

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


def _post_json(url: str, body: dict) -> tuple[int, dict]:
    status, payload = call("POST", url, body, timeout=30)
    return status, payload


def _patch_json(url: str, body: dict) -> tuple[int, dict]:
    status, payload = call("PATCH", url, body, timeout=15)
    return status, payload


def _create(
    base: str, workspace: Path, name: str | None = None, driver: str = "deterministic"
) -> str:
    _s, body = _post_json(
        base + "/api/session",
        {"driver": driver, "name": name, "workspace": str(workspace)},
    )
    return body["session_id"]


def test_patch_driver_updates_catalog_and_manifest_json(
    app: server.App, base: tuple[str, Path]
) -> None:
    url, tmp_path = base
    sid = _create(url, tmp_path / "wsp", name="switcher", driver="deterministic")
    status, body = _patch_json(url + f"/api/session/{sid}", {"driver": "claude"})
    assert status == 200
    assert body["driver"] == "claude"
    # In-memory catalog updated.
    manifest = app.registry.get(sid)
    assert manifest is not None
    assert manifest.driver == "claude"
    # On-disk manifest.json updated too.
    on_disk = json.loads((tmp_path / sid / "manifest.json").read_text())
    assert on_disk["driver"] == "claude"


def test_patch_driver_survives_registry_reboot(app: server.App, base: tuple[str, Path]) -> None:
    """boot_scan reads manifest.json on daemon restart. A PATCHed driver
    must land in the new in-memory catalog.
    """
    url, tmp_path = base
    sid = _create(url, tmp_path / "wsp", name="rebooter", driver="deterministic")
    _s, _b = _patch_json(url + f"/api/session/{sid}", {"driver": "kimi-k2.6:cloud"})
    # Fresh registry pointing at the same base dir.
    fresh = SessionRegistry(
        base=tmp_path,
        session_topology_factory=functools.partial(
            server._build_session_topology_from_manifest, app
        ),
    )
    fresh.boot_scan()
    reloaded = fresh.get(sid)
    assert reloaded is not None
    assert reloaded.driver == "kimi-k2.6:cloud"


def test_patch_name_updates_by_name_index(app: server.App, base: tuple[str, Path]) -> None:
    url, tmp_path = base
    sid = _create(url, tmp_path / "wsp", name="original")
    status, body = _patch_json(url + f"/api/session/{sid}", {"name": "renamed"})
    assert status == 200
    assert body["name"] == "renamed"
    assert app.registry.by_name("renamed") == sid
    assert app.registry.by_name("original") is None


def test_patch_name_collision_returns_409(base: tuple[str, Path]) -> None:
    url, tmp_path = base
    sid_a = _create(url, tmp_path / "a", name="alpha")
    _create(url, tmp_path / "b", name="beta")
    status, body = _patch_json(url + f"/api/session/{sid_a}", {"name": "beta"})
    assert status == 409
    assert "already taken" in body["error"]
    assert body["existing_session_id"] is not None


def test_patch_on_unknown_session_returns_404(base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _patch_json(url + "/api/session/s_nonexistent", {"driver": "claude"})
    assert status == 404
    assert "unknown session_id" in body["error"]


def test_patch_empty_body_returns_400(base: tuple[str, Path]) -> None:
    url, tmp_path = base
    sid = _create(url, tmp_path / "wsp", name="quiet")
    status, body = _patch_json(url + f"/api/session/{sid}", {})
    assert status == 400
    assert "no mutable fields" in body["error"]


def test_patch_deferred_field_returns_400_naming_the_field(base: tuple[str, Path]) -> None:
    url, tmp_path = base
    sid = _create(url, tmp_path / "wsp", name="wanting-tools")
    # Sprint 223d moved `per_turn`, and a later sprint `bundle`, to _PATCHABLE. `seed`
    # is still in _NOT_YET (Sprint 097 update).
    status, body = _patch_json(url + f"/api/session/{sid}", {"seed": "other"})
    assert status == 400
    assert "seed" in body["error"]
    assert "not PATCH-able yet" in body["error"]


def test_patch_driver_composes_with_next_turn_topology_build(
    app: server.App, base: tuple[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """PATCH driver → the next turn's topology is built on the new driver. The factory resolves
    `manifest.driver` at build time, so a PATCHed value lands in the NEXT build. Lens audit F443:
    the old test patched deterministic to deterministic and asserted only `callable(topo)`."""
    from substrate.adapters import DeterministicResponder

    url, tmp_path = base
    sid = _create(url, tmp_path / "wsp", name="composer", driver="deterministic")
    status, _ = _patch_json(url + f"/api/session/{sid}", {"driver": "kimi-k2.6:cloud"})
    assert status == 200
    resolved: list[str] = []

    def resolver(app: server.App, name: str, params: object = None) -> DeterministicResponder:
        resolved.append(name)
        return DeterministicResponder(seed=0)

    monkeypatch.setattr(server, "_daemon_driver_resolver", resolver)
    server._build_session_topology_from_manifest(app, app.registry.get(sid))
    assert resolved[0] == "kimi-k2.6:cloud", resolved
