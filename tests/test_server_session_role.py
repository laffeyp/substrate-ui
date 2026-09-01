# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 223a — `role` field on POST /api/session + manifest round-trip."""

from __future__ import annotations

import json
import sys
import threading
from http.server import ThreadingHTTPServer
from pathlib import Path
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


def _post(url: str, body: dict) -> tuple[int, dict]:
    req = Request(
        url,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except Exception as exc:
        code = getattr(exc, "code", 0)
        body_raw = getattr(exc, "read", lambda: b"{}")()
        try:
            return code, json.loads(body_raw)
        except Exception:
            return code, {"raw": body_raw.decode(errors="replace")}


def test_default_role_when_absent(base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _post(url + "/api/session", {"driver": "deterministic"})
    assert status == 200, body
    assert body["role"] == "default"
    sid = body["session_id"]
    manifest = server._SESSION_REGISTRY.get(sid)
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


def test_role_survives_boot_scan(base: tuple[str, Path], tmp_path: Path) -> None:
    url, base_path = base
    status, body = _post(url + "/api/session", {"driver": "deterministic", "role": "default"})
    assert status == 200
    sid = body["session_id"]

    fresh = SessionRegistry(
        base=base_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    fresh.boot_scan()
    reloaded = fresh.get(sid)
    assert reloaded is not None
    assert reloaded.role == "default"
