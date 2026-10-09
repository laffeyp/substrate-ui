"""Sprint 223e — `/api/agent` compat bridge routes through /api/session.

Named at TECH-SPEC line 700 (`test_server_agent_compat.py`); the invariant
at line 690 is "creates a session on first request and routes subsequent
requests to /api/session/<id>/turn."
"""

from __future__ import annotations

import threading
from pathlib import Path

import pytest
from _serving import call, serving  # noqa: E402
from substrate import api  # noqa: E402

import server  # noqa: E402


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> tuple[str, Path]:
    app.install_registry(base=tmp_path)
    with serving(app) as base:
        yield base, tmp_path


def _post(url: str) -> tuple[int, dict]:
    status, payload = call("POST", url, timeout=60)
    assert status < 400, (status, payload)  # this helper used to raise on an error status
    return status, payload


def test_first_call_creates_session_and_returns_record(
    app: server.App, base: tuple[str, Path]
) -> None:
    url, _ = base
    status, body = _post(url + "/api/agent?session=demo&task=hello")
    assert status == 200, body
    assert body["ok"] is True
    assert body["session_id"].startswith("s_")
    assert body["record"], "record path missing"
    # Registry now holds this session.
    m = app.registry.get(body["session_id"])
    assert m is not None
    assert m.name == "demo"


def test_second_call_same_session_reuses_it(app: server.App, base: tuple[str, Path]) -> None:
    url, _ = base
    _, first = _post(url + "/api/agent?session=demo&task=hello")
    _, second = _post(url + "/api/agent?session=demo&task=again")
    assert first["session_id"] == second["session_id"]
    # Two UserMessages on the one record.
    record_root = Path(app.registry.get(first["session_id"]).record_root)
    ums = [e for e in api.read_record(record_root) if "UserMessage" in str(e.get("kind", ""))]
    assert len(ums) == 2, f"expected two UserMessages, got {len(ums)}"


def test_model_param_maps_to_driver(app: server.App, base: tuple[str, Path]) -> None:
    url, _ = base
    _, body = _post(url + "/api/agent?session=det&task=hi&model=deterministic")
    m = app.registry.get(body["session_id"])
    assert m.driver == "deterministic"


def test_legacy_true_gets_the_bridge(base: tuple[str, Path]) -> None:
    """The `legacy=true` launch shape was deleted on 2026-10-08 (roadmap: Studio and legacy
    endpoints); the flag is ignored and the request is an ordinary bridged session turn."""
    url, _ = base
    status, body = _post(url + "/api/agent?legacy=true&model=deterministic")
    assert status == 200, body
    assert "deprecated" not in body and "name" not in body
    assert body["session_id"].startswith("s_") and body["status"] == "parked"


def test_concurrent_same_session_serializes(app: server.App, base: tuple[str, Path]) -> None:
    """Two threads hit /api/agent for the same session name. Both must land;
    the record must have two UserMessages, not one dropped and not a race
    that creates two sessions.
    """
    url, _ = base
    results: list[dict] = []

    def _hit(text: str) -> None:
        _s, body = _post(url + f"/api/agent?session=serialised&task={text}")
        results.append(body)

    t1 = threading.Thread(target=_hit, args=("first",))
    t2 = threading.Thread(target=_hit, args=("second",))
    t1.start()
    t2.start()
    t1.join(timeout=60)
    t2.join(timeout=60)
    assert len(results) == 2
    assert results[0]["session_id"] == results[1]["session_id"]
    record_root = Path(app.registry.get(results[0]["session_id"]).record_root)
    ums = [e for e in api.read_record(record_root) if "UserMessage" in str(e.get("kind", ""))]
    assert len(ums) == 2
