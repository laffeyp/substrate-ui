"""UI sprint 168: GET /api/session/<id>/language returns the kernel's language view, cached until
the record grows."""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest

import server
from _serving import call, serving


@pytest.fixture
def base(app: server.App, tmp_path: Path) -> Iterator[str]:
    app.install_registry(base=tmp_path)
    with serving(app) as url:
        yield url


def test_a_session_with_turns_answers_its_language(app: server.App, base: str) -> None:
    _s, body = call("POST", base + "/api/session", {"driver": "deterministic"})
    sid = body["session_id"]
    for text in ("one", "two"):
        call("POST", base + f"/api/session/{sid}/turn", {"text": text}, timeout=60)
    status, body = call("GET", base + f"/api/session/{sid}/language")
    view = body
    assert status == 200
    assert [x["stream"] for x in view["lines"] if x["stream"] in ("user", "model")] == [
        "user",
        "model",
    ] * 2
    assert (
        set(view["lanes"]) == {"user", "model"}
        and len(view["lanes"]["model"]["words"]["points"]) == 2
    )
    # The live session records its own measurements (vocabulary v0.11 § W).
    assert view["last_seq"] > 0


def test_the_view_is_cached_until_the_record_grows(
    app: server.App, base: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    _s, body = call("POST", base + "/api/session", {"driver": "deterministic"})
    sid = body["session_id"]
    call("POST", base + f"/api/session/{sid}/turn", {"text": "one"}, timeout=60)
    calls: list[Path] = []
    real = server.language_view

    def counted(root: Path) -> dict[str, object]:
        calls.append(root)
        return real(root)

    monkeypatch.setattr(server, "language_view", counted)
    call("GET", base + f"/api/session/{sid}/language")
    call("GET", base + f"/api/session/{sid}/language")
    assert len(calls) == 1
    call("POST", base + f"/api/session/{sid}/turn", {"text": "two"}, timeout=60)
    call("GET", base + f"/api/session/{sid}/language")
    assert len(calls) == 2


def test_a_session_before_its_first_turn_and_an_unknown_one(app: server.App, base: str) -> None:
    _s, body = call("POST", base + "/api/session", {"driver": "deterministic"})
    sid = body["session_id"]
    status, body = call("GET", base + f"/api/session/{sid}/language")
    assert status == 200 and body["lines"] == []
    status, _ = call("GET", base + "/api/session/s_nope/language")
    assert status == 404
