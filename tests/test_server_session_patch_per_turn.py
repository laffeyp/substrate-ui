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


def test_per_turn_reaches_the_next_turns_prompt_once(
    app: server.App, base: tuple[str, Path]
) -> None:
    """A per_turn set by PATCH reaches the model on the next turn, once (K261). It used to be
    prefixed into UserMessage.assembled_prompt and added again by its fragment, so the model read
    it twice; the model step now puts it in the prompt it records as PromptComposed."""
    url, _ = base
    sid = _create(url)
    _patch(url + f"/api/session/{sid}", {"per_turn": "PREFIX::"})
    _post(url + f"/api/session/{sid}/turn", {"text": "hello"})

    from substrate import api

    record_root = Path(app.registry.get(sid).record_root)
    prompts = [
        e["payload"]["text"] for e in api.read_record(record_root) if e["kind"] == "PromptComposed"
    ]
    assert prompts, "no PromptComposed on the record after /turn"
    assert prompts[-1].count("PREFIX::") == 1, prompts[-1]
    assert prompts[-1].index("PREFIX::") < prompts[-1].index("hello"), prompts[-1]
