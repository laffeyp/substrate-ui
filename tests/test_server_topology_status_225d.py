"""Sprint 225d — GET /api/topology/<name>/status?run_id=<id>.

Closes the async loop 225a's await_completion=false opens.
"""

from __future__ import annotations

import json
import sys
import threading
import time
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_registry import SessionRegistry  # noqa: E402

from substrate.topologies.applications.registry import load_manifests  # noqa: E402


@pytest.fixture
def base(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> str:
    monkeypatch.setattr(server, "_SESSIONS_BASE", tmp_path / "sessions")
    server._SESSIONS_BASE.mkdir(parents=True)
    server._SESSION_REGISTRY = SessionRegistry(
        base=server._SESSIONS_BASE,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    server._APPLICATIONS = load_manifests()
    server._TOPOLOGY_RUNS = {}
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    srv.shutdown()


def _post(url: str, body: dict) -> tuple[int, dict]:
    req = Request(
        url,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urlopen(req, timeout=30) as response:
        return response.status, json.loads(response.read())


def _get(url: str) -> tuple[int, dict]:
    try:
        with urlopen(url, timeout=15) as response:
            return response.status, json.loads(response.read())
    except Exception as exc:
        code = getattr(exc, "code", 0)
        raw = getattr(exc, "read", lambda: b"{}")()
        try:
            return code, json.loads(raw)
        except Exception:
            return code, {"raw": raw.decode(errors="replace")}


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
    status, body = _get(
        base + "/api/topology/best_of_n_verified/status?run_id=s_topo_nosuch"
    )
    assert status == 404
    assert "s_topo_nosuch" in json.dumps(body)


def test_missing_run_id_returns_400(base: str) -> None:
    status, body = _get(base + "/api/topology/best_of_n_verified/status")
    assert status == 400
    assert "run_id" in json.dumps(body)
