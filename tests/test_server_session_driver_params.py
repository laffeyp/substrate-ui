"""Sprint 032c — SessionManifest.driver_params + PATCH surface + resolver.

Closes the one substrate-side gap piece-G's mechanical translation
review named: `OllamaResponder` accepts `think` / `max_tokens` /
`timeout` / `num_ctx` at construction, but the daemon's
`_daemon_driver_resolver(name)` baked fixed defaults and the
SessionManifest had no field to carry them. This test suite verifies
the fix: PATCH lands on the manifest; response body carries the field;
unknown keys 400; wrong types 400; the resolver rebuilds the Responder
with the new params on next-turn build.

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


def _request(url: str, method: str, body: dict | None = None) -> tuple[int, dict]:
    return call(method, url, body, timeout=15)


def _create(base: str, workspace: Path, driver_params: dict | None = None) -> str:
    body: dict = {"driver": "kimi-k2.6:cloud", "workspace": str(workspace)}
    if driver_params is not None:
        body["driver_params"] = driver_params
    _s, resp = _request(base + "/api/session", "POST", body)
    return resp["session_id"]


def test_patch_driver_params_lands_on_manifest(app: server.App, base: str, tmp_path: Path) -> None:
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
    manifest = app.registry.get(sid)
    assert manifest.driver_params == {"think": True, "max_tokens": 4096, "timeout": 600.0}


def test_patch_driver_params_null_clears(app: server.App, base: str, tmp_path: Path) -> None:
    """A session created with params can drop them with null."""
    sid = _create(base, tmp_path / "wsp", driver_params={"think": True})
    manifest = app.registry.get(sid)
    assert manifest.driver_params == {"think": True}
    status, body = _request(
        base + f"/api/session/{sid}",
        "PATCH",
        {"driver_params": None},
    )
    assert status == 200, body
    assert body["driver_params"] is None
    manifest = app.registry.get(sid)
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


def test_create_accepts_driver_params(app: server.App, base: str, tmp_path: Path) -> None:
    """POST /api/session carries driver_params through to the manifest."""
    sid = _create(base, tmp_path / "wsp", driver_params={"think": True, "num_ctx": 8192})
    manifest = app.registry.get(sid)
    assert manifest.driver_params == {"think": True, "num_ctx": 8192}


def test_create_rejects_bad_driver_params(base: str, tmp_path: Path) -> None:
    """A bad driver_params at create time returns 400 and leaves no session."""
    status, body = _request(
        base + "/api/session",
        "POST",
        {
            "driver": "kimi-k2.6:cloud",
            "workspace": str(tmp_path / "wsp"),
            "driver_params": {"bogus": 1},
        },
    )
    assert status == 400
    assert "driver_params" in body["error"]


def test_resolver_returns_distinct_responders_per_params(
    app: server.App, base: str, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The cache key includes params — think=True yields a different Responder
    instance than think=False (or the default). The model's thinking support is fixed here:
    the real probe asks the developer's Ollama (lens audit F442)."""
    monkeypatch.setattr(server, "_model_supports_thinking", lambda app, model: False)
    responder_default = server._daemon_driver_resolver(app, "kimi-k2.6:cloud")
    responder_thinking = server._daemon_driver_resolver(app, "kimi-k2.6:cloud", {"think": True})
    responder_thinking_again = server._daemon_driver_resolver(
        app, "kimi-k2.6:cloud", {"think": True}
    )
    assert responder_default is not responder_thinking, (
        "different params must yield different Responder"
    )
    assert responder_thinking is responder_thinking_again, "same params must hit the cache"
    # The thinking Responder actually carries think=True on the OllamaResponder.
    assert getattr(responder_thinking, "_think", False) is True
    # Sprint 045: the default follows the model's thinking support (False here), not a fixed value.
    assert getattr(responder_default, "_think", None) is False


def test_workspace_and_seed_still_deferred(base: str, tmp_path: Path) -> None:
    """The other deferred fields must still 400 — 032c only lifted driver_params."""
    sid = _create(base, tmp_path / "wsp")
    st, body = _request(base + f"/api/session/{sid}", "PATCH", {"workspace": scratch_ws("other")})
    assert st == 400
    assert "workspace" in body["error"]
