# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 214b — GET /api/session buckets manifests by status.

Response shape: `{"live": [...], "parked": [...], "ended": [...], "interrupted": [...]}`.
Every entry carries `session_id`, `name`, `driver`, `workspace`, `workspace_shape`,
`record`, `created_at`, `bundle`. Status classification comes from the manifest's
own `status` field, which the boot scan (sprint 211) reconciles against the
record's tail.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_session_list.py -q
"""

from __future__ import annotations

import json
import sys
import threading
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen

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


def _get(url: str) -> dict:
    with urlopen(url, timeout=15) as r:
        return json.loads(r.read())


def test_empty_registry_returns_empty_buckets(base: str) -> None:
    body = _get(base + "/api/session")
    assert body == {"live": [], "parked": [], "ended": [], "interrupted": []}


def test_running_session_lands_in_live_bucket(base: str) -> None:
    _SR = server._SESSION_REGISTRY
    _SR.create(
        session_id="s_A",
        name="a",
        driver="deterministic",
        workspace="/tmp/w",
        workspace_shape="flat",
        bundle=None,
        seed="x",
    )
    # Fresh sessions are "running" per create.
    body = _get(base + "/api/session")
    assert len(body["live"]) == 1
    entry = body["live"][0]
    assert entry["session_id"] == "s_A"
    assert entry["name"] == "a"
    assert entry["driver"] == "deterministic"
    assert entry["workspace_shape"] == "flat"
    assert entry["record"].endswith("/record")
    assert body["parked"] == []
    assert body["ended"] == []


def test_manifests_bucket_by_status(base: str) -> None:
    _SR = server._SESSION_REGISTRY
    for sid, name, status in [
        ("s_P", "parked-one", "parked"),
        ("s_E", "ended-one", "ended"),
        ("s_I", "torn-one", "interrupted"),
    ]:
        _SR.create(
            session_id=sid,
            name=name,
            driver="deterministic",
            workspace="/tmp/w",
            workspace_shape="flat",
            bundle=None,
            seed="x",
        )
        _SR.update_status(sid, status)
    body = _get(base + "/api/session")
    assert [e["session_id"] for e in body["parked"]] == ["s_P"]
    assert [e["session_id"] for e in body["ended"]] == ["s_E"]
    assert [e["session_id"] for e in body["interrupted"]] == ["s_I"]
    assert body["live"] == []


def test_response_carries_created_at_timestamp(base: str) -> None:
    _SR = server._SESSION_REGISTRY
    _SR.create(
        session_id="s_T",
        name="timed",
        driver="deterministic",
        workspace="/tmp/w",
        workspace_shape="flat",
        bundle=None,
        seed="x",
    )
    body = _get(base + "/api/session")
    assert isinstance(body["live"][0]["created_at"], (int, float))
    assert body["live"][0]["created_at"] > 0
