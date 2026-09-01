# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 032b — PATCH /api/session/<id> accepts `bundle` mid-session.

The daemon promotes `bundle` from `_NOT_YET` to `_PATCHABLE`. A patched
bundle lands on the manifest and reaches the next `Runtime.resume` via
`_build_session_topology_from_manifest`. Unknown bundle → 400 (validated
by `SessionRegistry.set_bundle` via `substrate.bundles.load_bundle`).
Null clears any attached bundle.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_session_patch_bundle.py -q
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


def _create(base: str, workspace: Path, bundle: str | None = None) -> str:
    body: dict = {"driver": "deterministic", "workspace": str(workspace)}
    if bundle is not None:
        body["bundle"] = bundle
    _s, resp = _request(base + "/api/session", "POST", body)
    return resp["session_id"]


def test_patch_bundle_lands_on_manifest(base: str, tmp_path: Path) -> None:
    """PATCH bundle: happy path. The manifest reflects the new bundle name
    immediately; the daemon's response body carries the same value.
    """
    sid = _create(base, tmp_path / "wsp")
    status, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"bundle": "pair_coding"},
    )
    assert status == 200, body
    assert body["bundle"] == "pair_coding"
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest.bundle == "pair_coding"


def test_patch_bundle_null_clears_attached_bundle(base: str, tmp_path: Path) -> None:
    """A session created with a bundle can drop it mid-flight by sending null."""
    sid = _create(base, tmp_path / "wsp", bundle="pair_coding")
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest.bundle == "pair_coding"
    status, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"bundle": None},
    )
    assert status == 200, body
    assert body["bundle"] is None
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest.bundle is None


def test_patch_bundle_unknown_name_returns_400(base: str, tmp_path: Path) -> None:
    """An unknown bundle name is validated at PATCH time via load_bundle —
    the failure is a 400, not a silent land followed by a next-turn crash.
    """
    sid = _create(base, tmp_path / "wsp")
    status, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"bundle": "does-not-exist"},
    )
    assert status == 400, body
    assert "does-not-exist" in body["error"] or "bundle" in body["error"]
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest.bundle is None


def test_patch_bundle_non_string_non_null_returns_400(base: str, tmp_path: Path) -> None:
    """Bundle must be a string or null. A number/list/object is a 400."""
    sid = _create(base, tmp_path / "wsp")
    status, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"bundle": 42},
    )
    assert status == 400, body
    assert "bundle" in body["error"]


def test_patch_bundle_response_carries_bundle_field(base: str, tmp_path: Path) -> None:
    """PATCH response body includes the `bundle` field so the UI can read
    back the post-state without a follow-up GET.
    """
    sid = _create(base, tmp_path / "wsp")
    _st, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"bundle": "code_review"},
    )
    assert "bundle" in body, f"PATCH response missing bundle field: {body}"
    assert body["bundle"] == "code_review"


def test_workspace_still_deferred(base: str, tmp_path: Path) -> None:
    """The other three _NOT_YET fields must still 400 — 032b only lifted bundle."""
    sid = _create(base, tmp_path / "wsp")
    status, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"workspace": "/tmp/other"},
    )
    assert status == 400, body
    assert "workspace" in body["error"]
