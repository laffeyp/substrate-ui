"""Sprint 215c — PATCH /api/session/<id> mutates driver + name.

Body: {"driver"?: str, "name"?: str}. Every absent key leaves that
field alone. `tools`, `per_turn`, `workspace`, `workspace_shape`,
`bundle`, and `seed` are not PATCH-able yet (SessionManifest schema
growth is a piece-B follow-up); a body carrying them returns 400
naming the deferred fields.

Behaviors under test:
  1. PATCH driver updates the in-memory catalog AND the on-disk
     manifest.json; boot_scan from a fresh SessionRegistry pointing at
     the same base dir sees the new value.
  2. PATCH name updates by-name index; old name resolves to None; new
     name resolves to session_id.
  3. PATCH with a colliding name returns 409 with existing_session_id.
  4. PATCH on unknown session_id returns 404.
  5. Empty body returns 400 (no mutable fields).
  6. Body with `per_turn` (or any of the piece-H fields) returns 400 naming
     that as deferred. `tools` moved from `_NOT_YET` to `_PATCHABLE` in sprint
     217e; the deferred set is now {per_turn, workspace, workspace_shape,
     bundle, seed}.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_session_patch.py -q
"""

from __future__ import annotations

import json
import sys
import threading
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_registry import SessionRegistry  # noqa: E402


@pytest.fixture
def base(tmp_path: Path) -> tuple[str, Path]:
    server._SESSION_REGISTRY = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}", tmp_path
    srv.shutdown()


def _post_json(url: str, body: dict) -> tuple[int, dict]:
    req = Request(
        url,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read())
    except HTTPError as exc:
        raw = exc.read()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {}
        return exc.code, payload


def _patch_json(url: str, body: dict) -> tuple[int, dict]:
    req = Request(
        url,
        data=json.dumps(body).encode(),
        method="PATCH",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read())
    except HTTPError as exc:
        raw = exc.read()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {}
        return exc.code, payload


def _create(base: str, workspace: Path, name: str | None = None, driver: str = "deterministic") -> str:
    _s, body = _post_json(
        base + "/api/session",
        {"driver": driver, "name": name, "workspace": str(workspace)},
    )
    return body["session_id"]


def test_patch_driver_updates_catalog_and_manifest_json(base: tuple[str, Path]) -> None:
    url, tmp_path = base
    sid = _create(url, tmp_path / "wsp", name="switcher", driver="deterministic")
    status, body = _patch_json(url + f"/api/session/{sid}", {"driver": "claude"})
    assert status == 200
    assert body["driver"] == "claude"
    # In-memory catalog updated.
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest is not None
    assert manifest.driver == "claude"
    # On-disk manifest.json updated too.
    on_disk = json.loads((tmp_path / sid / "manifest.json").read_text())
    assert on_disk["driver"] == "claude"


def test_patch_driver_survives_registry_reboot(base: tuple[str, Path]) -> None:
    """boot_scan reads manifest.json on daemon restart. A PATCHed driver
    must land in the new in-memory catalog.
    """
    url, tmp_path = base
    sid = _create(url, tmp_path / "wsp", name="rebooter", driver="deterministic")
    _s, _b = _patch_json(url + f"/api/session/{sid}", {"driver": "kimi-k2.6:cloud"})
    # Fresh registry pointing at the same base dir.
    fresh = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    fresh.boot_scan()
    reloaded = fresh.get(sid)
    assert reloaded is not None
    assert reloaded.driver == "kimi-k2.6:cloud"


def test_patch_name_updates_by_name_index(base: tuple[str, Path]) -> None:
    url, tmp_path = base
    sid = _create(url, tmp_path / "wsp", name="original")
    status, body = _patch_json(url + f"/api/session/{sid}", {"name": "renamed"})
    assert status == 200
    assert body["name"] == "renamed"
    assert server._SESSION_REGISTRY.by_name("renamed") == sid
    assert server._SESSION_REGISTRY.by_name("original") is None


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
    # Sprint 223d: `per_turn` moved from _NOT_YET to _PATCHABLE. Use `bundle`,
    # still in _NOT_YET (belongs to piece H).
    status, body = _patch_json(url + f"/api/session/{sid}", {"bundle": "some-bundle"})
    assert status == 400
    assert "bundle" in body["error"]
    assert "not PATCH-able yet" in body["error"]


def test_patch_driver_composes_with_next_turn_topology_build(base: tuple[str, Path]) -> None:
    """PATCH driver → next turn's session_topology carries the new driver.
    The factory reads `manifest.driver` at build time, so a PATCHed value
    lands in the NEXT call, not the current in-flight one.
    """
    url, tmp_path = base
    sid = _create(url, tmp_path / "wsp", name="composer", driver="deterministic")
    _patch_json(url + f"/api/session/{sid}", {"driver": "deterministic"})
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest is not None
    topo = server._build_session_topology_from_manifest(manifest)
    # The factory returns a callable; the point is it did not raise on the
    # PATCHed driver value (a real end-to-end turn would exercise the
    # Responder, but the topology-build seam is what PATCH must not break).
    assert callable(topo)
