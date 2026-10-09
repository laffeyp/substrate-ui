"""Sprint 214b — GET /api/session/by-name/<name> resolves a name to a session_id.

Response: `{"session_id": "s_...", "name": "reviewer"}` on hit; 404 with
`{"error": "unknown session name: 'reviewer'"}` on miss. Names are case-sensitive
(SessionRegistry's `by_name` uses a dict lookup, no normalization).

"""

from __future__ import annotations

from pathlib import Path

import pytest
from _serving import call, serving, scratch_ws  # noqa: E402

import server  # noqa: E402


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> str:
    app.install_registry(base=tmp_path)
    with serving(app) as base:
        yield base


def _get(url: str) -> tuple[int, dict]:
    status, payload = call("GET", url, timeout=15)
    return status, payload


def _create(app: server.App, sid: str, name: str) -> None:
    app.registry.create(
        session_id=sid,
        name=name,
        driver="deterministic",
        workspace=scratch_ws("w"),
        workspace_shape="flat",
        bundle=None,
        seed="x",
    )


def test_by_name_returns_session_id(app: server.App, base: str) -> None:
    _create(app, "s_alpha", "reviewer")
    status, body = _get(base + "/api/session/by-name/reviewer")
    assert status == 200
    assert body == {"session_id": "s_alpha", "name": "reviewer"}


def test_by_name_unknown_returns_404(base: str) -> None:
    status, body = _get(base + "/api/session/by-name/nonexistent")
    assert status == 404
    assert "unknown session name" in body["error"]


def test_by_name_is_case_sensitive(app: server.App, base: str) -> None:
    _create(app, "s_beta", "Reviewer")
    hit_status, hit_body = _get(base + "/api/session/by-name/Reviewer")
    miss_status, miss_body = _get(base + "/api/session/by-name/reviewer")
    assert hit_status == 200 and hit_body["session_id"] == "s_beta"
    assert miss_status == 404


def test_by_name_survives_url_encoding(app: server.App, base: str) -> None:
    _create(app, "s_gamma", "team review")  # space in name
    status, body = _get(base + "/api/session/by-name/team%20review")
    assert status == 200
    assert body["session_id"] == "s_gamma"
