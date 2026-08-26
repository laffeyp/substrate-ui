"""Sprint 214a — POST /api/session creates a session via SessionRegistry.

Two behaviors under test:
  1. A fresh POST /api/session with a body {"driver": "deterministic",
     "name": "reviewer"} returns 200 with `session_id`, `name`, `record`,
     `workspace_shape`, and lands a manifest at
     `~/.substrate/sessions/<session_id>/manifest.json` (redirected to the
     test's tmp base via env / patch).
  2. A second POST /api/session with the same `name` and a different
     session_id returns 409 with `{"error": "name already taken",
     "existing_session_id": "..."}`.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_session_create.py -q
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
    # Point the module-scope SessionRegistry at a tmp base so the test does not
    # collide with any real ~/.substrate/sessions/ on the box.
    server._SESSION_REGISTRY = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    srv.shutdown()


def _post_json(url: str, body: dict) -> tuple[int, dict]:
    req = Request(
        url,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read())
    except HTTPError as exc:
        body_bytes = exc.read()
        try:
            payload = json.loads(body_bytes) if body_bytes else {}
        except json.JSONDecodeError:
            payload = {}
        return exc.code, payload


def test_post_session_creates_a_manifest(base: str, tmp_path: Path) -> None:
    status, body = _post_json(
        base + "/api/session",
        {"driver": "deterministic", "name": "reviewer", "workspace": str(tmp_path)},
    )
    assert status == 200
    assert body["session_id"].startswith("s_")
    assert body["name"] == "reviewer"
    assert body["workspace_shape"] == "flat"
    assert body["record"].endswith("/record")
    manifest_path = tmp_path / body["session_id"] / "manifest.json"
    assert manifest_path.exists()
    raw = json.loads(manifest_path.read_text())
    assert raw["name"] == "reviewer"
    assert raw["driver"] == "deterministic"


def test_post_session_second_name_collision_returns_409(base: str, tmp_path: Path) -> None:
    _post_json(base + "/api/session", {"driver": "deterministic", "name": "planner"})
    status, body = _post_json(
        base + "/api/session", {"driver": "deterministic", "name": "planner"}
    )
    assert status == 409
    assert body["error"] == "name already taken"
    assert body["existing_session_id"].startswith("s_")


def test_post_session_anonymous_creates_without_name(base: str) -> None:
    status, body = _post_json(base + "/api/session", {"driver": "deterministic"})
    assert status == 200
    assert body["name"] is None


def test_post_session_defaults_driver_to_deterministic(base: str) -> None:
    status, body = _post_json(base + "/api/session", {})
    assert status == 200
    # The manifest reflects the default.
    manifest = server._SESSION_REGISTRY.get(body["session_id"])
    assert manifest is not None
    assert manifest.driver == "deterministic"
