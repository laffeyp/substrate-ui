"""Sprint 217e — PATCH /api/session/<id> accepts `tools`.

The daemon promotes `tools` from `_NOT_YET` to `_PATCHABLE`. A patched
tool allow-list persists on the manifest and reaches the next
`Runtime.resume` via `_build_session_topology_from_manifest`.
Empty list → no restriction (full_suite). Non-list → 400.

"""

from __future__ import annotations

from pathlib import Path

import pytest
from _serving import call, serving  # noqa: E402

import server  # noqa: E402


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> str:
    app.install_registry(base=tmp_path)
    with serving(app) as base:
        yield base


def _request(url: str, method: str, body: dict | None = None) -> tuple[int, dict]:
    return call(method, url, body, timeout=15)


def _create(base: str, workspace: Path) -> str:
    _s, body = _request(
        base + "/api/session",
        "POST",
        {"driver": "deterministic", "workspace": str(workspace)},
    )
    return body["session_id"]


def test_patch_tools_lands_on_manifest(app: server.App, base: str, tmp_path: Path) -> None:
    sid = _create(base, tmp_path / "wsp")
    status, _body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"tools": ["read_file", "grep"]},
    )
    assert status == 200
    manifest = app.registry.get(sid)
    assert manifest.tools == ("read_file", "grep")


def test_patch_tools_empty_list_means_unrestricted(
    app: server.App, base: str, tmp_path: Path
) -> None:
    """Empty list normalizes to None on the manifest — the topology uses full_suite."""
    sid = _create(base, tmp_path / "wsp")
    # First restrict, then send an empty list to lift the restriction.
    _request(base + f"/api/session/{sid}", "PATCH", {"tools": ["read_file"]})
    status, _body = _request(base + f"/api/session/{sid}", "PATCH", {"tools": []})
    assert status == 200
    manifest = app.registry.get(sid)
    assert manifest.tools is None


def test_patch_tools_next_turn_sees_restricted_suite(
    app: server.App, base: str, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """After PATCH tools, the factory built for the next turn hands `session_topology` only the
    allow-listed tools: full_suite entries and the substrate toolkit (delegate, run_topology, …)
    alike. Lens audit F456: the old test checked only that a producer kind named "tool"
    existed. Writing this test found N001: the toolkit bypassed the allow-list."""
    import substrate.topologies.session as session_pkg

    sid = _create(base, tmp_path / "wsp")
    _request(base + f"/api/session/{sid}", "PATCH", {"tools": ["add", "read_file"]})
    manifest = app.registry.get(sid)
    assert manifest.tools == ("add", "read_file")
    captured: dict = {}
    monkeypatch.setattr(
        session_pkg, "session_topology", lambda **kw: captured.update(kw) or (lambda b: None)
    )
    server._build_session_topology_from_manifest(app, manifest, None)
    assert set(captured["tools"]) == {"add", "read_file"}


def test_patch_tools_non_list_returns_400(base: str, tmp_path: Path) -> None:
    sid = _create(base, tmp_path / "wsp")
    status, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"tools": "read_file"},  # string, not a list
    )
    assert status == 400
    assert "tools" in body["error"]
