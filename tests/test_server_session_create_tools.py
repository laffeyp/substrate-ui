"""Sprint 223b — `tools` on POST /api/session (create-time tool allow-list)."""

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


def _post(url: str, body: dict) -> tuple[int, dict]:
    req = Request(
        url,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except Exception as exc:
        code = getattr(exc, "code", 0)
        body_raw = getattr(exc, "read", lambda: b"{}")()
        try:
            return code, json.loads(body_raw)
        except Exception:
            return code, {"raw": body_raw.decode(errors="replace")}


def test_tools_named_list_lands_on_manifest(base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _post(
        url + "/api/session",
        {"driver": "deterministic", "tools": ["read_file", "grep"]},
    )
    assert status == 200, body
    sid = body["session_id"]
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest.tools == ("read_file", "grep")


def test_tools_empty_list_stores_none(base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _post(url + "/api/session", {"driver": "deterministic", "tools": []})
    assert status == 200, body
    manifest = server._SESSION_REGISTRY.get(body["session_id"])
    assert manifest.tools is None


def test_tools_absent_stores_none(base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _post(url + "/api/session", {"driver": "deterministic"})
    assert status == 200, body
    manifest = server._SESSION_REGISTRY.get(body["session_id"])
    assert manifest.tools is None


def test_tool_filter_binds_only_the_named_tools(base: tuple[str, Path]) -> None:
    """Observation half of the dual contract: a session whose manifest.tools
    names two tools binds ONLY those two tools on the built topology. A
    third tool that is NOT in the allow-list has nothing to bind to and
    is absent from the session's tool dict.

    Sprint 224c: adds the observation the 223b card was missing. The
    manifest-side assertion (223b's first test) proves the wire accepted
    the field; this test proves the topology honors it.
    """
    url, _ = base
    status, body = _post(
        url + "/api/session",
        {"driver": "deterministic", "tools": ["read_file", "grep"]},
    )
    assert status == 200, body
    manifest = server._SESSION_REGISTRY.get(body["session_id"])
    session_tools = server._tools_for_manifest(manifest)
    assert set(session_tools) == {"read_file", "grep"}
    # A tool that was NOT in the allow-list is absent — the model has
    # nothing to call and tool_loop's `parse_tool_call` returns unknown.
    assert "write_file" not in session_tools
    assert "bash" not in session_tools


def test_tools_invalid_element_returns_400(base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _post(
        url + "/api/session",
        {"driver": "deterministic", "tools": ["read_file", 123]},
    )
    assert status == 400, body
    assert "123" in json.dumps(body)
