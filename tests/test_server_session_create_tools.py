"""Sprint 223b — `tools` on POST /api/session (create-time tool allow-list)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from _serving import call, serving  # noqa: E402

import server  # noqa: E402


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> tuple[str, Path]:
    app.install_registry(base=tmp_path)
    with serving(app) as base:
        yield base, tmp_path


def _post(url: str, body: dict) -> tuple[int, dict]:
    status, payload = call("POST", url, body, timeout=10)
    return status, payload


def test_tools_named_list_lands_on_manifest(app: server.App, base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _post(
        url + "/api/session",
        {"driver": "deterministic", "tools": ["read_file", "grep"]},
    )
    assert status == 200, body
    sid = body["session_id"]
    manifest = app.registry.get(sid)
    assert manifest.tools == ("read_file", "grep")


def test_tools_empty_list_stores_none(app: server.App, base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _post(url + "/api/session", {"driver": "deterministic", "tools": []})
    assert status == 200, body
    manifest = app.registry.get(body["session_id"])
    assert manifest.tools is None


def test_tools_absent_stores_none(app: server.App, base: tuple[str, Path]) -> None:
    url, _ = base
    status, body = _post(url + "/api/session", {"driver": "deterministic"})
    assert status == 200, body
    manifest = app.registry.get(body["session_id"])
    assert manifest.tools is None


def test_tool_filter_binds_only_the_named_tools(app: server.App, base: tuple[str, Path]) -> None:
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
    manifest = app.registry.get(body["session_id"])
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
