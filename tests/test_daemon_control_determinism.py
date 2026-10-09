"""Daemon control determinism (named "UI/CLI control parity" from sprint 036f to 2026-10-08).

The UI and the CLI change a session through the same daemon endpoints (PATCH /api/session/<id>
for driver, bundle, tools, driver_params; POST /api/session for workspace and isolate). This file
checks the daemon's half of that contract: the same control input, sent for two sessions, gets a
200 and lands the same manifest slice on both. It does not observe what the UI or the CLI send;
their slash routers are checked by the shakeout's slash_router flow and the CLI's own tests (lens
audit F423/F424: the old docstring claimed parity it could not see, and every PATCH response was
discarded).
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


def _http(url: str, method: str = "GET", body: dict | None = None) -> tuple[int, object]:
    return call(method, url, body, timeout=15)


def _create_session(base: str, workspace: str | None = None, **extras) -> str:
    body = {"driver": "deterministic"}
    if workspace is not None:
        body["workspace"] = workspace
    body.update(extras)
    status, payload = _http(f"{base}/api/session", "POST", body)
    assert status == 200, f"create failed: {status} {payload}"
    return payload["session_id"]


def _get_manifest(base: str, sid: str) -> dict:
    status, payload = _http(f"{base}/api/session/{sid}")
    assert status == 200, f"manifest fetch failed: {status} {payload}"
    return payload  # type: ignore[return-value]


def _end(base: str, sid: str) -> None:
    _http(f"{base}/api/session/{sid}/end", "POST", {"source": "test-cleanup"})


def _patch(base: str, sid: str, body: dict) -> None:
    status, payload = _http(f"{base}/api/session/{sid}", "PATCH", body)
    assert status == 200, f"PATCH {body} -> {status} {payload}"


def _manifest_slice(m: dict, keys: list[str]) -> dict:
    return {k: m.get(k) for k in keys}


def test_driver_patch_parity(base: str, tmp_path: Path) -> None:
    """Two sessions, same PATCH {driver: "kimi-k2.6:cloud"}, identical driver
    slice on read-back."""
    ws_a = str(tmp_path / "a")
    ws_b = str(tmp_path / "b")
    sid_a = _create_session(base, workspace=ws_a)
    sid_b = _create_session(base, workspace=ws_b)
    try:
        _patch(base, sid_a, {"driver": "kimi-k2.6:cloud"})
        _patch(base, sid_b, {"driver": "kimi-k2.6:cloud"})
        slice_a = _manifest_slice(_get_manifest(base, sid_a), ["driver"])
        slice_b = _manifest_slice(_get_manifest(base, sid_b), ["driver"])
        assert slice_a == slice_b == {"driver": "kimi-k2.6:cloud"}
    finally:
        _end(base, sid_a)
        _end(base, sid_b)


def test_bundle_patch_parity(base: str, tmp_path: Path) -> None:
    """Same PATCH {bundle: "code_review"} yields identical bundle slice."""
    ws_a = str(tmp_path / "a")
    ws_b = str(tmp_path / "b")
    sid_a = _create_session(base, workspace=ws_a)
    sid_b = _create_session(base, workspace=ws_b)
    try:
        _patch(base, sid_a, {"bundle": "code_review"})
        _patch(base, sid_b, {"bundle": "code_review"})
        slice_a = _manifest_slice(_get_manifest(base, sid_a), ["bundle"])
        slice_b = _manifest_slice(_get_manifest(base, sid_b), ["bundle"])
        assert slice_a == slice_b == {"bundle": "code_review"}
    finally:
        _end(base, sid_a)
        _end(base, sid_b)


def test_bundle_patch_null_parity(base: str, tmp_path: Path) -> None:
    """Clear-to-none: PATCH {bundle: null} lands identically on both."""
    ws_a = str(tmp_path / "a")
    ws_b = str(tmp_path / "b")
    sid_a = _create_session(base, workspace=ws_a, bundle="code_review")
    sid_b = _create_session(base, workspace=ws_b, bundle="code_review")
    try:
        _patch(base, sid_a, {"bundle": None})
        _patch(base, sid_b, {"bundle": None})
        m_a = _get_manifest(base, sid_a)
        m_b = _get_manifest(base, sid_b)
        assert m_a["bundle"] is None and m_b["bundle"] is None
    finally:
        _end(base, sid_a)
        _end(base, sid_b)


def test_tools_patch_sort_parity(base: str, tmp_path: Path) -> None:
    """Two clients send the SAME sorted list (matching UI 036d's sort
    invariant + CLI /tools sorting). Manifest slices identical.

    The UI sorts client-side; the CLI /tools slash sorts inside cli.py's
    handler. The daemon does not re-sort — parity is a client-side
    discipline enforced by both. This test asserts the DAEMON preserves
    what it receives, so both clients' sorted payloads land identically.
    """
    ws_a = str(tmp_path / "a")
    ws_b = str(tmp_path / "b")
    sid_a = _create_session(base, workspace=ws_a)
    sid_b = _create_session(base, workspace=ws_b)
    try:
        payload = {"tools": ["bash", "grep", "read_file"]}  # already sorted
        _patch(base, sid_a, payload)
        _patch(base, sid_b, payload)
        m_a = _get_manifest(base, sid_a)
        m_b = _get_manifest(base, sid_b)
        assert m_a["tools"] == m_b["tools"] == ["bash", "grep", "read_file"]
    finally:
        _end(base, sid_a)
        _end(base, sid_b)


def test_tools_empty_clears_parity(base: str, tmp_path: Path) -> None:
    """PATCH {tools: []} clears to unrestricted (manifest tools == None on both)."""
    ws_a = str(tmp_path / "a")
    ws_b = str(tmp_path / "b")
    sid_a = _create_session(base, workspace=ws_a, tools=["grep"])
    sid_b = _create_session(base, workspace=ws_b, tools=["grep"])
    try:
        _patch(base, sid_a, {"tools": []})
        _patch(base, sid_b, {"tools": []})
        m_a = _get_manifest(base, sid_a)
        m_b = _get_manifest(base, sid_b)
        # The daemon normalises an empty list to None (unrestricted).
        assert m_a["tools"] is None and m_b["tools"] is None
    finally:
        _end(base, sid_a)
        _end(base, sid_b)


def test_driver_params_patch_parity(base: str, tmp_path: Path) -> None:
    """PATCH {driver_params: {think: true, max_tokens: 4096}} — UI /set and
    CLI /set both PATCH the same body. Manifest slice identical."""
    ws_a = str(tmp_path / "a")
    ws_b = str(tmp_path / "b")
    sid_a = _create_session(base, workspace=ws_a)
    sid_b = _create_session(base, workspace=ws_b)
    try:
        payload = {"driver_params": {"think": True, "max_tokens": 4096}}
        _patch(base, sid_a, payload)
        _patch(base, sid_b, payload)
        m_a = _get_manifest(base, sid_a)
        m_b = _get_manifest(base, sid_b)
        assert m_a["driver_params"] == m_b["driver_params"]
        assert m_a["driver_params"] == {"think": True, "max_tokens": 4096}
    finally:
        _end(base, sid_a)
        _end(base, sid_b)


def test_workspace_create_parity(base: str, tmp_path: Path) -> None:
    """POST /api/session {workspace: "/path"} — UI dialog and CLI
    `substrate chat --workspace /path` both hit this same endpoint with the
    same body. Manifest workspace + workspace_shape slices identical."""
    ws = str(tmp_path / "shared-ws")
    sid_a = _create_session(base, workspace=ws)
    sid_b = _create_session(base, workspace=ws)
    try:
        slice_a = _manifest_slice(_get_manifest(base, sid_a), ["workspace", "workspace_shape"])
        slice_b = _manifest_slice(_get_manifest(base, sid_b), ["workspace", "workspace_shape"])
        assert slice_a == slice_b
        assert slice_a["workspace"] == ws
        assert slice_a["workspace_shape"] == "flat"
    finally:
        _end(base, sid_a)
        _end(base, sid_b)


def test_isolate_create_parity(base: str, tmp_path: Path) -> None:
    """POST /api/session {isolate: true} — UI isolateField and CLI's future
    --isolate flag both trigger the same daemon-side workspace_shape switch
    to "isolate" (per sprint 035w). Two isolate creates land with
    workspace_shape="isolate" on both sessions; the daemon forces distinct
    per-session workspace paths (part of the isolate contract) so those
    paths differ by session_id.
    """
    sid_a = _create_session(base, isolate=True)
    sid_b = _create_session(base, isolate=True)
    try:
        m_a = _get_manifest(base, sid_a)
        m_b = _get_manifest(base, sid_b)
        assert m_a["workspace_shape"] == "isolate"
        assert m_b["workspace_shape"] == "isolate"
        # Isolate paths are per-session; each carries the session_id.
        assert sid_a in m_a["workspace"]
        assert sid_b in m_b["workspace"]
    finally:
        _end(base, sid_a)
        _end(base, sid_b)


def test_isolate_worktree_mutex_parity(base: str, tmp_path: Path) -> None:
    """POST {isolate: true, workspace_shape: "worktree"} is a client error;
    the daemon rejects with 400. The UI enforces this at the field level
    (isolateField disables when shape=worktree); the CLI enforces at the
    argument parser (or would). Parity: both clients get the SAME 400
    from the daemon if they bypass their own guard.
    """
    body = {"driver": "deterministic", "isolate": True, "workspace_shape": "worktree"}
    status, payload = _http(f"{base}/api/session", "POST", body)
    assert status == 400
    assert "mutually exclusive" in payload.get("error", ""), payload


def test_slash_router_wire_convergence(base: str, tmp_path: Path) -> None:
    """Meta-parity: chain a single session through every mutating slash
    contract (driver → bundle → tools → driver_params). Each PATCH lands.
    Reads carry the expected shape. Any deviation would mean the daemon's
    manifest write path drifted from what BOTH the UI slash router
    (terminal.ts::_slashRoute) and the CLI slash router
    (cli.py::_slash_route) rely on.
    """
    ws = str(tmp_path / "chain")
    sid = _create_session(base, workspace=ws)
    try:
        _patch(base, sid, {"driver": "kimi-k2.6:cloud"})
        _patch(base, sid, {"bundle": "code_review"})
        _patch(base, sid, {"tools": ["grep", "read_file"]})
        _patch(base, sid, {"driver_params": {"think": True}})
        m = _get_manifest(base, sid)
        assert m["driver"] == "kimi-k2.6:cloud"
        assert m["bundle"] == "code_review"
        assert m["tools"] == ["grep", "read_file"]
        assert m["driver_params"] == {"think": True}
        assert m["workspace"] == ws
        assert m["workspace_shape"] == "flat"
    finally:
        _end(base, sid)
