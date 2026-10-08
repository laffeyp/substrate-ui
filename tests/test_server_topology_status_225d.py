"""Sprint 225d — GET /api/topology/<name>/status?run_id=<id>.

Closes the async loop 225a's await_completion=false opens.
"""

from __future__ import annotations

import json
import sys
import threading
import time
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from substrate.session_registry import SessionRegistry  # noqa: E402

from substrate.topologies.applications.registry import load_manifests  # noqa: E402
from _serving import call, serving  # noqa: E402


@pytest.fixture
def base(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> str:
    _sb = tmp_path / "sessions"
    monkeypatch.setattr(server, "_sessions_base", lambda: _sb)
    server._sessions_base().mkdir(parents=True)
    server._SESSION_REGISTRY = SessionRegistry(
        base=server._sessions_base(),
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    server._APPLICATIONS = load_manifests()
    server._TOPOLOGY_RUNS = {}
    with serving() as base:
        yield base


def _post(url: str, body: dict) -> tuple[int, dict]:
    status, payload = call("POST", url, body, timeout=30)
    assert status < 400, (status, payload)  # this helper used to raise on an error status
    return status, payload


def _get(url: str) -> tuple[int, dict]:
    status, payload = call("GET", url, timeout=15)
    return status, payload


def test_async_run_transitions_running_then_finalised(base: str) -> None:
    """Fire best_of_n_verified with await_completion=false; poll the
    status endpoint; assert transition to finalised within the timeout."""
    status, body = _post(
        base + "/api/topology/best_of_n_verified/run",
        {
            "inputs": {
                "task": "double 3",
                "drafter_model": "deterministic",
                "verify_model": "deterministic",
                "n": 2,
                "max_rounds": 1,
            },
            "await_completion": False,
        },
    )
    assert status == 200, body
    assert body["status"] == "running"
    run_id = body["run_id"]

    # Poll until finalised or timeout.
    deadline = time.time() + 30.0
    final_body: dict = {}
    while time.time() < deadline:
        status_code, poll_body = _get(
            base + f"/api/topology/best_of_n_verified/status?run_id={run_id}"
        )
        assert status_code == 200, poll_body
        assert poll_body["run_id"] == run_id
        assert "elapsed_seconds" in poll_body
        assert poll_body["elapsed_seconds"] >= 0
        if poll_body["status"] == "finalised":
            final_body = poll_body
            break
        time.sleep(0.2)
    assert final_body, "run never transitioned to finalised within 30s"
    assert final_body["status"] == "finalised"
    assert final_body.get("output") is not None, (
        "terminal envelope payload missing from finalised status response"
    )


def test_unknown_run_id_returns_404(base: str) -> None:
    status, body = _get(base + "/api/topology/best_of_n_verified/status?run_id=s_topo_nosuch")
    assert status == 404
    assert "s_topo_nosuch" in json.dumps(body)


def test_missing_run_id_returns_400(base: str) -> None:
    status, body = _get(base + "/api/topology/best_of_n_verified/status")
    assert status == 400
    assert "run_id" in json.dumps(body)


def test_a_run_whose_worker_died_reports_failed_not_running(base: str, tmp_path: Path) -> None:
    # UI sprint 102: a background run that raised left no RunFinalised, and status read
    # "running" forever. A dead worker with no finalised record is a failed run.
    dead = threading.Thread(target=lambda: None)
    dead.start()
    dead.join()
    server._TOPOLOGY_RUNS["r_dead"] = {
        "record_root": tmp_path / "never-written",
        "thread": dead,
        "started_at": time.time(),
        "application": "research_sweep",
        "error": "RuntimeError: boom",
    }
    status, body = _get(f"{base}/api/topology/research_sweep/status?run_id=r_dead")
    assert status == 200
    assert body["status"] == "failed"
    assert body["output"] == {"error": "RuntimeError: boom"}

    paused = threading.Thread(target=lambda: None)
    paused.start()
    paused.join()
    server._TOPOLOGY_RUNS["r_paused"] = {
        "record_root": tmp_path / "never-written",
        "thread": paused,
        "started_at": time.time(),
        "application": "research_sweep",
        "result_status": "paused",
    }
    _, body = _get(f"{base}/api/topology/research_sweep/status?run_id=r_paused")
    assert body["status"] == "paused", "a run that returned reports its own status"
