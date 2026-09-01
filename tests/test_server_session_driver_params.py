"""Sprint 032c — SessionManifest.driver_params + PATCH surface + resolver.

Closes the one substrate-side gap piece-G's mechanical translation
review named: `OllamaResponder` accepts `think` / `max_tokens` /
`timeout` / `num_ctx` at construction, but the daemon's
`_daemon_driver_resolver(name)` baked fixed defaults and the
SessionManifest had no field to carry them. This test suite verifies
the fix: PATCH lands on the manifest; response body carries the field;
unknown keys 400; wrong types 400; the resolver rebuilds the Responder
with the new params on next-turn build.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_session_driver_params.py -q
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
    server._SESSION_REGISTRY = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    srv.shutdown()


def _request(url: str, method: str, body: dict | None = None) -> tuple[int, dict]:
    data = json.dumps(body).encode() if body is not None else b""
    req = Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"} if body is not None else {},
    )
    try:
        with urlopen(req, timeout=15) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else {})
    except HTTPError as exc:
        raw = exc.read()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {}
        return exc.code, payload


def _create(base: str, workspace: Path, driver_params: dict | None = None) -> str:
    body: dict = {"driver": "kimi-k2.6:cloud", "workspace": str(workspace)}
    if driver_params is not None:
        body["driver_params"] = driver_params
    _s, resp = _request(base + "/api/session", "POST", body)
    return resp["session_id"]


def test_patch_driver_params_lands_on_manifest(base: str, tmp_path: Path) -> None:
    """PATCH driver_params: happy path. Manifest reflects the new dict; response
    body carries it for UI read-back."""
    sid = _create(base, tmp_path / "wsp")
    status, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"driver_params": {"think": True, "max_tokens": 4096, "timeout": 600.0}},
    )
    assert status == 200, body
    assert body["driver_params"] == {"think": True, "max_tokens": 4096, "timeout": 600.0}
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest.driver_params == {"think": True, "max_tokens": 4096, "timeout": 600.0}


def test_patch_driver_params_null_clears(base: str, tmp_path: Path) -> None:
    """A session created with params can drop them with null."""
    sid = _create(base, tmp_path / "wsp", driver_params={"think": True})
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest.driver_params == {"think": True}
    status, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"driver_params": None},
    )
    assert status == 200, body
    assert body["driver_params"] is None
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest.driver_params is None


def test_patch_driver_params_unknown_key_returns_400(base: str, tmp_path: Path) -> None:
    """Unknown keys 400 with the offending key named."""
    sid = _create(base, tmp_path / "wsp")
    status, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"driver_params": {"invalid_knob": 42}},
    )
    assert status == 400, body
    assert "invalid_knob" in body["error"]


def test_patch_driver_params_wrong_type_returns_400(base: str, tmp_path: Path) -> None:
    """Type errors 400 per key."""
    sid = _create(base, tmp_path / "wsp")
    # think: bool required
    st, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"driver_params": {"think": "yes"}},
    )
    assert st == 400
    assert "think" in body["error"]
    # max_tokens: negative rejected
    st, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"driver_params": {"max_tokens": -1}},
    )
    assert st == 400
    assert "max_tokens" in body["error"]
    # timeout: zero rejected
    st, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"driver_params": {"timeout": 0}},
    )
    assert st == 400
    assert "timeout" in body["error"]
    # num_ctx: zero rejected
    st, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"driver_params": {"num_ctx": 0}},
    )
    assert st == 400
    assert "num_ctx" in body["error"]


def test_patch_driver_params_non_dict_returns_400(base: str, tmp_path: Path) -> None:
    """Body value must be a dict or null."""
    sid = _create(base, tmp_path / "wsp")
    status, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"driver_params": ["think", True]},
    )
    assert status == 400
    assert "driver_params" in body["error"]


def test_create_accepts_driver_params(base: str, tmp_path: Path) -> None:
    """POST /api/session carries driver_params through to the manifest."""
    sid = _create(base, tmp_path / "wsp", driver_params={"think": True, "num_ctx": 8192})
    manifest = server._SESSION_REGISTRY.get(sid)
    assert manifest.driver_params == {"think": True, "num_ctx": 8192}


def test_create_rejects_bad_driver_params(base: str, tmp_path: Path) -> None:
    """A bad driver_params at create time returns 400 and leaves no session."""
    status, body = _request(
        base + "/api/session",
        "POST",
        {"driver": "kimi-k2.6:cloud", "workspace": str(tmp_path / "wsp"), "driver_params": {"bogus": 1}},
    )
    assert status == 400
    assert "driver_params" in body["error"]


def test_resolver_returns_distinct_responders_per_params(base: str, tmp_path: Path) -> None:
    """The cache key includes params — think=False yields a different
    Responder instance than the default. Sprint 045 flipped the daily-
    driver default to think=True (kimi, glm, nemotron all improve
    measurably with thinking on), so this test asserts against that
    default and probes the OTHER direction: explicit think=False must
    produce a distinct cached Responder that carries think=False on
    the OllamaResponder itself."""
    responder_default = server._daemon_driver_resolver("kimi-k2.6:cloud")
    responder_off = server._daemon_driver_resolver("kimi-k2.6:cloud", {"think": False})
    responder_off_again = server._daemon_driver_resolver("kimi-k2.6:cloud", {"think": False})
    assert responder_default is not responder_off, (
        "different params must yield different Responder"
    )
    assert responder_off is responder_off_again, "same params must hit the cache"
    # The default Responder carries think=True (sprint 045 daily-driver default).
    assert getattr(responder_default, "_think", False) is True
    # The explicit think=False Responder carries think=False.
    assert getattr(responder_off, "_think", True) is False


def test_workspace_and_seed_still_deferred(base: str, tmp_path: Path) -> None:
    """The other deferred fields must still 400 — 032c only lifted driver_params."""
    sid = _create(base, tmp_path / "wsp")
    st, body = _request(base + f"/api/session/{sid}", "PATCH", {"workspace": "/tmp/other"})
    assert st == 400
    assert "workspace" in body["error"]
