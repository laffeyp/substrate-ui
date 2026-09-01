# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 223d — `per_turn` on PATCH /api/session/<id> + manifest round-trip."""

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
    req = Request(url, data=json.dumps(body).encode(), method="POST",
                  headers={"Content-Type": "application/json"})
    with urlopen(req, timeout=10) as r:
        return r.status, json.loads(r.read())


def _patch(url: str, body: dict) -> tuple[int, dict]:
    req = Request(url, data=json.dumps(body).encode(), method="PATCH",
                  headers={"Content-Type": "application/json"})
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


def _create(url: str) -> str:
    _s, body = _post(url + "/api/session", {"driver": "deterministic"})
    return body["session_id"]


def test_per_turn_set_lands_on_manifest(base: tuple[str, Path]) -> None:
    url, _ = base
    sid = _create(url)
    status, body = _patch(url + f"/api/session/{sid}", {"per_turn": "Think step by step."})
    assert status == 200, body
    assert server._SESSION_REGISTRY.get(sid).per_turn == "Think step by step."


def test_per_turn_null_clears_the_prefix(base: tuple[str, Path]) -> None:
    url, _ = base
    sid = _create(url)
    _patch(url + f"/api/session/{sid}", {"per_turn": "before"})
    status, body = _patch(url + f"/api/session/{sid}", {"per_turn": None})
    assert status == 200, body
    assert server._SESSION_REGISTRY.get(sid).per_turn == ""


def test_per_turn_invalid_type_returns_400(base: tuple[str, Path]) -> None:
    url, _ = base
    sid = _create(url)
    status, body = _patch(url + f"/api/session/{sid}", {"per_turn": 42})
    assert status == 400, body
    assert "per_turn" in json.dumps(body)


def test_per_turn_survives_boot_scan(base: tuple[str, Path], tmp_path: Path) -> None:
    url, base_path = base
    sid = _create(url)
    _patch(url + f"/api/session/{sid}", {"per_turn": "carry-me"})

    fresh = SessionRegistry(
        base=base_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    fresh.boot_scan()
    reloaded = fresh.get(sid)
    assert reloaded is not None
    assert reloaded.per_turn == "carry-me"


def test_per_turn_prefixes_assembled_prompt_on_next_turn(base: tuple[str, Path]) -> None:
    """The next turn's UserMessage assembled_prompt starts with the per_turn."""
    url, _ = base
    sid = _create(url)
    _patch(url + f"/api/session/{sid}", {"per_turn": "PREFIX::"})
    _post(url + f"/api/session/{sid}/turn", {"text": "hello"})

    from substrate import api

    record_root = Path(server._SESSION_REGISTRY.get(sid).record_root)
    ums = [
        e for e in api.read_record(record_root)
        if "UserMessage" in str(e.get("kind", ""))
    ]
    assert ums, "no UserMessage on the record after /turn"
    payload = ums[0].get("payload", {})
    assembled = payload.get("assembled_prompt", "")
    assert assembled.startswith("PREFIX::"), (
        f"per_turn prefix missing from assembled_prompt: {assembled!r}"
    )
