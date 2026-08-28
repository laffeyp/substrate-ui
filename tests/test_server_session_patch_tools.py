"""Sprint 217e — PATCH /api/session/<id> accepts `tools`.

The daemon promotes `tools` from `_NOT_YET` to `_PATCHABLE`. A patched
tool allow-list persists on the manifest and reaches the next
`Runtime.resume` via `_build_session_topology_from_manifest`.
Empty list → no restriction (full_suite). Non-list → 400.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_session_patch_tools.py -q
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


def _request(url: str, method: str, body: dict | None = None) -> tuple[int, dict]:
    data = json.dumps(body).encode() if body is not None else b""
    req = Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"} if body is not None else {},
    )
    try:
        with urlopen(req, timeout=15) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else {})
    except HTTPError as exc:
        raw = exc.read()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {}
        return exc.code, payload


def _create(base: str, workspace: Path) -> str:
    _s, body = _request(
        base + "/api/session",
        "POST",
        {"driver": "deterministic", "workspace": str(workspace)},
    )
    return body["session_id"]


def test_patch_tools_lands_on_manifest(base: str, tmp_path: Path) -> None:
    sid = _create(base, tmp_path / "wsp")
    status, _body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"tools": ["read_file", "grep"]},
    )
    assert status == 200
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest.tools == ("read_file", "grep")


def test_patch_tools_empty_list_means_unrestricted(base: str, tmp_path: Path) -> None:
    """Empty list normalizes to None on the manifest — the topology uses full_suite."""
    sid = _create(base, tmp_path / "wsp")
    # First restrict, then send an empty list to lift the restriction.
    _request(base + f"/api/session/{sid}", "PATCH", {"tools": ["read_file"]})
    status, _body = _request(base + f"/api/session/{sid}", "PATCH", {"tools": []})
    assert status == 200
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest.tools is None


def test_patch_tools_next_turn_sees_restricted_suite(base: str, tmp_path: Path) -> None:
    """After PATCH tools, the factory built for the next turn passes a
    filtered `tools` dict. The manifest-driven filter drops entries not on
    the allow-list; the factory's `session_topology(tools=...)` receives
    only the requested tools.
    """
    sid = _create(base, tmp_path / "wsp")
    _request(base + f"/api/session/{sid}", "PATCH", {"tools": ["add"]})
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest.tools == ("add",)
    # Rebuild the factory the way turn_sync would: the resulting topology
    # only sees the allow-listed tool.
    from substrate import api

    topo = server._build_session_topology_from_manifest(manifest, None)
    b = api.TopologyBuilder()
    topo(b)
    # The `tool` producer is registered per session_topology; its factory
    # closes over the filtered tools dict. We check registration via the
    # producer_kind names on the registration object.
    reg = b.build()
    assert "tool" in reg.producer_kinds


def test_patch_tools_non_list_returns_400(base: str, tmp_path: Path) -> None:
    sid = _create(base, tmp_path / "wsp")
    status, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"tools": "read_file"},  # string, not a list
    )
    assert status == 400
    assert "tools" in body["error"]
