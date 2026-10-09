"""Sprint 214b — GET /api/session buckets manifests by status.

Response shape: `{"live": [...], "parked": [...], "ended": [...], "interrupted": [...]}`.
Every entry carries `session_id`, `name`, `driver`, `workspace`, `workspace_shape`,
`record`, `created_at`, `bundle`. Status classification comes from the manifest's
own `status` field, which the boot scan (sprint 211) reconciles against the
record's tail.

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


def _get(url: str) -> dict:
    status, payload = call("GET", url, timeout=15)
    assert status < 400, (status, payload)  # this helper used to raise on an error status
    return payload


def test_empty_registry_returns_empty_buckets(base: str) -> None:
    body = _get(base + "/api/session")
    assert body == {"live": [], "parked": [], "ended": [], "interrupted": []}


def test_running_session_lands_in_live_bucket(app: server.App, base: str) -> None:
    _SR = app.registry
    _SR.create(
        session_id="s_A",
        name="a",
        driver="deterministic",
        workspace=scratch_ws("w"),
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


def test_manifests_bucket_by_status(app: server.App, base: str) -> None:
    _SR = app.registry
    for sid, name, status in [
        ("s_P", "parked-one", "parked"),
        ("s_E", "ended-one", "ended"),
        ("s_I", "torn-one", "interrupted"),
    ]:
        _SR.create(
            session_id=sid,
            name=name,
            driver="deterministic",
            workspace=scratch_ws("w"),
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


def test_response_carries_created_at_timestamp(app: server.App, base: str) -> None:
    _SR = app.registry
    _SR.create(
        session_id="s_T",
        name="timed",
        driver="deterministic",
        workspace=scratch_ws("w"),
        workspace_shape="flat",
        bundle=None,
        seed="x",
    )
    body = _get(base + "/api/session")
    assert isinstance(body["live"][0]["created_at"], (int, float))
    assert body["live"][0]["created_at"] > 0
