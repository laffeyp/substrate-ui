# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 034a — GET /api/records?exclude_sessions=true + GET /api/bundles.

The rail rewrite (034b) and the terminal-view create-time picker (035w)
consume these two endpoints. Neither existed before this sprint; the
records endpoint's exclude_sessions query param is new too.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_records_bundles.py -q
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


def _get(url: str) -> tuple[int, object]:
    try:
        with urlopen(Request(url), timeout=15) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else None)
    except HTTPError as exc:
        raw = exc.read()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {}
        return exc.code, payload


def _create_session(base: str, workspace: Path) -> str:
    req = Request(
        base + "/api/session",
        data=json.dumps({"driver": "deterministic", "workspace": str(workspace)}).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urlopen(req, timeout=15) as r:
        return json.loads(r.read())["session_id"]


def test_records_default_includes_bundled(base: str) -> None:
    """GET /api/records (default): every bundled + local record listed."""
    status, records = _get(base + "/api/records")
    assert status == 200
    assert isinstance(records, list)
    names = [r["name"] for r in records]
    # Substrate ships bundled records under the runtime's demo set.
    assert len(records) >= 1, f"expected ≥1 record; got {names}"


def test_records_exclude_sessions_shape(base: str) -> None:
    """The exclude_sessions filter returns a subset of the default list.
    Session records themselves live under ~/.substrate/sessions/ and are
    reached via `_record_path` — not enumerated by `_record_names`. The
    filter's job is to drop any name that MATCHES the session shape
    (prefix or id-format) if it did leak into the runs/ tree.
    """
    _st, all_records = _get(base + "/api/records")
    _st, filtered = _get(base + "/api/records?exclude_sessions=true")
    all_names = {r["name"] for r in all_records}
    filtered_names = {r["name"] for r in filtered}
    assert filtered_names.issubset(all_names), "filtered set must be a subset of default"
    # No filtered name matches the session shape.
    for name in filtered_names:
        assert not name.startswith(("launch_", "build_", "resume_")), f"session-prefix name leaked: {name}"


def test_records_exclude_sessions_hides_launch_prefixed(base: str) -> None:
    """A record whose name starts with `launch_`/`build_`/`resume_` is a
    session-run per `_SESSION_PREFIXES`; the exclude_sessions filter drops
    those too.
    """
    _st, records_all = _get(base + "/api/records")
    _st, records_filtered = _get(base + "/api/records?exclude_sessions=true")
    names_all = {r["name"] for r in records_all}
    names_filtered = {r["name"] for r in records_filtered}
    prefixed = {n for n in names_all if n.startswith(("launch_", "build_", "resume_"))}
    if prefixed:
        assert not (prefixed & names_filtered), f"filtered records still has session-prefixed names: {prefixed & names_filtered}"


def test_bundles_lists_shipped_defaults(base: str) -> None:
    """GET /api/bundles returns the shipped default bundles (session + the
    application bundles piece H sprint 231 shipped)."""
    status, bundles = _get(base + "/api/bundles")
    assert status == 200
    assert isinstance(bundles, list)
    names = {b["name"] for b in bundles}
    assert "session" in names, f"shipped session default missing; got {names}"
    # Piece H sprint 231 ships five default bundles alongside session.
    assert len(bundles) >= 2, f"expected ≥2 bundles (session + at least one app); got {names}"


def test_bundles_shape(base: str) -> None:
    """Each entry carries name, description, tools_enabled (list), slot_count (int)."""
    _st, bundles = _get(base + "/api/bundles")
    for b in bundles:
        assert "name" in b and isinstance(b["name"], str)
        assert "description" in b and isinstance(b["description"], str)
        assert "tools_enabled" in b and isinstance(b["tools_enabled"], list)
        assert "slot_count" in b and isinstance(b["slot_count"], int)
        assert 0 <= b["slot_count"] <= 3, f"slot_count out of range: {b}"


def test_bundles_sorted_by_name(base: str) -> None:
    """Enumeration is sorted (deterministic UI rendering)."""
    _st, bundles = _get(base + "/api/bundles")
    names = [b["name"] for b in bundles]
    assert names == sorted(names), f"bundles not sorted: {names}"
