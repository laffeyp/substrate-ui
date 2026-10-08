"""Sprint 214b — GET /api/session/by-name/<name> resolves a name to a session_id.

Response: `{"session_id": "s_...", "name": "reviewer"}` on hit; 404 with
`{"error": "unknown session name: 'reviewer'"}` on miss. Names are case-sensitive
(SessionRegistry's `by_name` uses a dict lookup, no normalization).

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_session_by_name.py -q
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from substrate.session_registry import SessionRegistry  # noqa: E402
from _serving import call, serving  # noqa: E402


@pytest.fixture
def base(tmp_path: Path) -> str:
    server._SESSION_REGISTRY = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    with serving() as base:
        yield base


def _get(url: str) -> tuple[int, dict]:
    status, payload = call("GET", url, timeout=15)
    return status, payload


def _create(sid: str, name: str) -> None:
    server._SESSION_REGISTRY.create(
        session_id=sid,
        name=name,
        driver="deterministic",
        workspace="/tmp/w",
        workspace_shape="flat",
        bundle=None,
        seed="x",
    )


def test_by_name_returns_session_id(base: str) -> None:
    _create("s_alpha", "reviewer")
    status, body = _get(base + "/api/session/by-name/reviewer")
    assert status == 200
    assert body == {"session_id": "s_alpha", "name": "reviewer"}


def test_by_name_unknown_returns_404(base: str) -> None:
    status, body = _get(base + "/api/session/by-name/nonexistent")
    assert status == 404
    assert "unknown session name" in body["error"]


def test_by_name_is_case_sensitive(base: str) -> None:
    _create("s_beta", "Reviewer")
    hit_status, hit_body = _get(base + "/api/session/by-name/Reviewer")
    miss_status, miss_body = _get(base + "/api/session/by-name/reviewer")
    assert hit_status == 200 and hit_body["session_id"] == "s_beta"
    assert miss_status == 404


def test_by_name_survives_url_encoding(base: str) -> None:
    _create("s_gamma", "team review")  # space in name
    status, body = _get(base + "/api/session/by-name/team%20review")
    assert status == 200
    assert body["session_id"] == "s_gamma"
