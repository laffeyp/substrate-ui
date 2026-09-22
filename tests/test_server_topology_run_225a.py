"""Sprint 225a — POST /api/topology/<name>/run one-shot dispatch tests.

Four cases per the card's assertions block:
  1. Deterministic best_of_n_verified round-trip: 200 + terminal envelope.
  2. Unknown application name → 404.
  3. Session-shape manifest (daily) → 400 pointing at POST /api/session.
  4. Missing required input → 400 naming the field.
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
from substrate.topologies.applications.registry import load_manifests  # noqa: E402


@pytest.fixture
def base(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> str:
    monkeypatch.setattr(server, "_SESSIONS_BASE", tmp_path / "sessions")
    server._SESSIONS_BASE.mkdir(parents=True)
    server._SESSION_REGISTRY = SessionRegistry(
        base=server._SESSIONS_BASE,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    # Load the four shipped manifests from the installed package.
    server._APPLICATIONS = load_manifests()
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
    try:
        with urlopen(req, timeout=60) as response:
            return response.status, json.loads(response.read())
    except Exception as exc:
        code = getattr(exc, "code", 0)
        raw = getattr(exc, "read", lambda: b"{}")()
        try:
            return code, json.loads(raw)
        except Exception:
            return code, {"raw": raw.decode(errors="replace")}


def test_best_of_n_verified_dispatch_writes_a_finalised_record(base: str) -> None:
    status, body = _post(
        base + "/api/topology/best_of_n_verified/run",
        {
            "inputs": {
                "task": "double 3",
                "drafter_model": "deterministic",
                "verify_model": "deterministic",
                "n": 2,
                "max_rounds": 1,
            }
        },
    )
    assert status == 200, body
    assert body["status"] == "finalised"
    assert body["application"] == "best_of_n_verified"
    record_root = Path(body["record_root"])
    envelopes = list(api.read_record(record_root))
    assert envelopes, "record has no envelopes after finalise"
    assert envelopes[0]["kind"] == api.RUN_STARTED
    assert any(env["kind"] == api.RUN_FINALISED for env in envelopes)


def test_unknown_application_returns_404(base: str) -> None:
    status, body = _post(base + "/api/topology/no-such-app/run", {"inputs": {}})
    assert status == 404
    assert "no-such-app" in json.dumps(body)


def test_session_shape_manifest_returns_400_pointing_at_post_session(base: str) -> None:
    status, body = _post(base + "/api/topology/daily/run", {"inputs": {}})
    assert status == 400
    assert "session" in json.dumps(body).lower()
    assert "POST /api/session" in json.dumps(body)


def test_missing_required_input_returns_400_naming_the_field(base: str) -> None:
    status, body = _post(
        base + "/api/topology/best_of_n_verified/run",
        {
            "inputs": {
                # missing 'task' (required)
                "drafter_model": "deterministic",
                "verify_model": "deterministic",
            }
        },
    )
    assert status == 400
    assert "task" in json.dumps(body)
