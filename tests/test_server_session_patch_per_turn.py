"""Sprint 223d — `per_turn` on PATCH /api/session/<id> + manifest round-trip."""

from __future__ import annotations

import functools

import json
from pathlib import Path

import pytest
from _serving import call, serving  # noqa: E402
from substrate.topologies.session_registry import SessionRegistry  # noqa: E402

import server  # noqa: E402


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> tuple[str, Path]:
    app.install_registry(base=tmp_path)
    with serving(app) as base:
        yield base, tmp_path


def _post(url: str, body: dict) -> tuple[int, dict]:
    status, payload = call("POST", url, body, timeout=10)
    assert status < 400, (status, payload)  # this helper used to raise on an error status
    return status, payload


def _patch(url: str, body: dict) -> tuple[int, dict]:
    status, payload = call("PATCH", url, body, timeout=10)
    return status, payload


def _create(url: str) -> str:
    _s, body = _post(url + "/api/session", {"driver": "deterministic"})
    return body["session_id"]


def test_per_turn_set_lands_on_manifest(app: server.App, base: tuple[str, Path]) -> None:
    url, _ = base
    sid = _create(url)
    status, body = _patch(url + f"/api/session/{sid}", {"per_turn": "Think step by step."})
    assert status == 200, body
    assert app.registry.get(sid).per_turn == "Think step by step."


def test_per_turn_null_clears_the_prefix(app: server.App, base: tuple[str, Path]) -> None:
    url, _ = base
    sid = _create(url)
    _patch(url + f"/api/session/{sid}", {"per_turn": "before"})
    status, body = _patch(url + f"/api/session/{sid}", {"per_turn": None})
    assert status == 200, body
    assert app.registry.get(sid).per_turn == ""


def test_per_turn_invalid_type_returns_400(base: tuple[str, Path]) -> None:
    url, _ = base
    sid = _create(url)
    status, body = _patch(url + f"/api/session/{sid}", {"per_turn": 42})
    assert status == 400, body
    assert "per_turn" in json.dumps(body)


def test_per_turn_survives_boot_scan(
    app: server.App, base: tuple[str, Path], tmp_path: Path
) -> None:
    url, base_path = base
    sid = _create(url)
    _patch(url + f"/api/session/{sid}", {"per_turn": "carry-me"})

    fresh = SessionRegistry(
        base=base_path,
        session_topology_factory=functools.partial(
            server._build_session_topology_from_manifest, app
        ),
    )
    fresh.boot_scan()
    reloaded = fresh.get(sid)
    assert reloaded is not None
    assert reloaded.per_turn == "carry-me"


def test_per_turn_prefixes_assembled_prompt_on_next_turn(
    app: server.App, base: tuple[str, Path]
) -> None:
    """The next turn's UserMessage assembled_prompt starts with the per_turn."""
    url, _ = base
    sid = _create(url)
    _patch(url + f"/api/session/{sid}", {"per_turn": "PREFIX::"})
    _post(url + f"/api/session/{sid}/turn", {"text": "hello"})

    from substrate import api

    record_root = Path(app.registry.get(sid).record_root)
    ums = [e for e in api.read_record(record_root) if "UserMessage" in str(e.get("kind", ""))]
    assert ums, "no UserMessage on the record after /turn"
    payload = ums[0].get("payload", {})
    assembled = payload.get("assembled_prompt", "")
    assert assembled.startswith("PREFIX::"), (
        f"per_turn prefix missing from assembled_prompt: {assembled!r}"
    )
