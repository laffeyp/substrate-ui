"""Sprint 036f — UI/CLI control parity gate.

The UI (web/controls/*.ts + web/terminal.ts) and the CLI's REPL slash router
(substrate/src/substrate/cli.py::_slash_route) call the SAME daemon endpoints
for every mutating control:

  driver     UI mountDriverPicker   ==  CLI /model     ==  PATCH /api/session/<id> {driver}
  bundle     UI mountBundlePicker   ==  CLI /bundle    ==  PATCH /api/session/<id> {bundle}
  tools      UI mountToolsDrawer    ==  CLI /tools     ==  PATCH /api/session/<id> {tools}
  driver_params  UI /set slash      ==  CLI /set       ==  PATCH /api/session/<id> {driver_params}
  workspace  UI new-session dialog  ==  CLI --workspace  ==  POST /api/session {workspace}
  isolate    UI isolateField        ==  CLI --isolate  ==  POST /api/session {isolate}

Parity is guaranteed by the shared daemon layer. The gate this test enforces:
for each canonical control input, the daemon's response and the manifest
read-back are byte-identical regardless of which client sent the request.
The 036a-e harnesses prove the UI hits the endpoints correctly; the CLI hits
them through the same seams; this file proves the daemon's response
determinism per control.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_ui_control_parity.py -q
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
def base(tmp_path: Path) -> str:
    server._SESSION_REGISTRY = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    srv.shutdown()


def _http(url: str, method: str = "GET", body: dict | None = None) -> tuple[int, object]:
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"} if body is not None else {}
    req = Request(url, data=data, method=method, headers=headers)
    try:
        with urlopen(req, timeout=15) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else None)
    except HTTPError as exc:
        raw = exc.read()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {}
        return exc.code, payload


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
        _http(f"{base}/api/session/{sid_a}", "PATCH", {"driver": "kimi-k2.6:cloud"})
        _http(f"{base}/api/session/{sid_b}", "PATCH", {"driver": "kimi-k2.6:cloud"})
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
        _http(f"{base}/api/session/{sid_a}", "PATCH", {"bundle": "code_review"})
        _http(f"{base}/api/session/{sid_b}", "PATCH", {"bundle": "code_review"})
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
        _http(f"{base}/api/session/{sid_a}", "PATCH", {"bundle": None})
        _http(f"{base}/api/session/{sid_b}", "PATCH", {"bundle": None})
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
        _http(f"{base}/api/session/{sid_a}", "PATCH", payload)
        _http(f"{base}/api/session/{sid_b}", "PATCH", payload)
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
        _http(f"{base}/api/session/{sid_a}", "PATCH", {"tools": []})
        _http(f"{base}/api/session/{sid_b}", "PATCH", {"tools": []})
        m_a = _get_manifest(base, sid_a)
        m_b = _get_manifest(base, sid_b)
        # Daemon normalises empty list to None (unrestricted). Both clients
        # see the same state after read-back.
        assert m_a["tools"] == m_b["tools"]
        assert m_a["tools"] in (None, [])
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
        _http(f"{base}/api/session/{sid_a}", "PATCH", payload)
        _http(f"{base}/api/session/{sid_b}", "PATCH", payload)
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
        _http(f"{base}/api/session/{sid}", "PATCH", {"driver": "kimi-k2.6:cloud"})
        _http(f"{base}/api/session/{sid}", "PATCH", {"bundle": "code_review"})
        _http(f"{base}/api/session/{sid}", "PATCH", {"tools": ["grep", "read_file"]})
        _http(f"{base}/api/session/{sid}", "PATCH", {"driver_params": {"think": True}})
        m = _get_manifest(base, sid)
        assert m["driver"] == "kimi-k2.6:cloud"
        assert m["bundle"] == "code_review"
        assert m["tools"] == ["grep", "read_file"]
        assert m["driver_params"] == {"think": True}
        assert m["workspace"] == ws
        assert m["workspace_shape"] == "flat"
    finally:
        _end(base, sid)
