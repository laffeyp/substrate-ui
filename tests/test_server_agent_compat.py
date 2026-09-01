# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 223e — `/api/agent` compat bridge routes through /api/session.

Named at TECH-SPEC line 700 (`test_server_agent_compat.py`); the invariant
at line 690 is "creates a session on first request and routes subsequent
requests to /api/session/<id>/turn."
"""

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

from substrate import api  # noqa: E402


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


def _get(url: str) -> tuple[int, dict]:
    # /api/agent is on POST (query string body — legacy shape); the bridge
    # keeps the method so existing callers do not have to change verbs.
    req = Request(url, data=b"", method="POST")
    with urlopen(req, timeout=60) as r:
        return r.status, json.loads(r.read())


def test_first_call_creates_session_and_returns_record(base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _get(url + "/api/agent?session=demo&task=hello")
    assert status == 200, body
    assert body["ok"] is True
    assert body["session_id"].startswith("s_")
    assert body["record"], "record path missing"
    # Registry now holds this session.
    m = server._SESSION_REGISTRY.get(body["session_id"])
    assert m is not None
    assert m.name == "demo"


def test_second_call_same_session_reuses_it(base: tuple[str, Path]) -> None:
    url, _ = base
    _, first = _get(url + "/api/agent?session=demo&task=hello")
    _, second = _get(url + "/api/agent?session=demo&task=again")
    assert first["session_id"] == second["session_id"]
    # Two UserMessages on the one record.
    record_root = Path(server._SESSION_REGISTRY.get(first["session_id"]).record_root)
    ums = [
        e for e in api.read_record(record_root)
        if "UserMessage" in str(e.get("kind", ""))
    ]
    assert len(ums) == 2, f"expected two UserMessages, got {len(ums)}"


def test_model_param_maps_to_driver(base: tuple[str, Path]) -> None:
    url, _ = base
    _, body = _get(url + "/api/agent?session=det&task=hi&model=deterministic")
    m = server._SESSION_REGISTRY.get(body["session_id"])
    assert m.driver == "deterministic"


def test_legacy_true_still_works_and_marks_deprecated(base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _get(url + "/api/agent?legacy=true&model=deterministic")
    assert status == 200, body
    assert body.get("deprecated") is True
    assert body["name"].startswith("launch_agent_")


def test_concurrent_same_session_serializes(base: tuple[str, Path]) -> None:
    """Two threads hit /api/agent for the same session name. Both must land;
    the record must have two UserMessages, not one dropped and not a race
    that creates two sessions.
    """
    url, _ = base
    results: list[dict] = []

    def _hit(text: str) -> None:
        _s, body = _get(url + f"/api/agent?session=serialised&task={text}")
        results.append(body)

    t1 = threading.Thread(target=_hit, args=("first",))
    t2 = threading.Thread(target=_hit, args=("second",))
    t1.start()
    t2.start()
    t1.join(timeout=60)
    t2.join(timeout=60)
    assert len(results) == 2
    assert results[0]["session_id"] == results[1]["session_id"]
    record_root = Path(server._SESSION_REGISTRY.get(results[0]["session_id"]).record_root)
    ums = [
        e for e in api.read_record(record_root)
        if "UserMessage" in str(e.get("kind", ""))
    ]
    assert len(ums) == 2
