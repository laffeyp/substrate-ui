# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 216 — per-session /turn queue cap.

The registry's `try_enqueue_turn` increments a per-session queued-turn
counter under a fast lock. The handler admits at most `turn_queue_cap`
callers; the (cap+1)th receives HTTP 429 immediately with the body shape
per TECH-SPEC §4:

    {"ok": false, "error": "session queue full",
     "queue_position": cap, "queue_cap": cap}

The refusal does NOT block on the per-session turn lock.

Run:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_session_queue_cap.py -q
"""

from __future__ import annotations

import json
import sys
import threading
import time
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_registry import SessionRegistry  # noqa: E402


@pytest.fixture
def base_cap3(tmp_path: Path) -> str:
    # cap=3 keeps the test fast: 3 admitted + 1 refused = 4 concurrent
    # POSTs, and the admitted ones all sleep on the same lock.
    server._SESSION_REGISTRY = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
        turn_queue_cap=3,
    )
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    srv.shutdown()


def _post_json(url: str, body: dict, timeout: float = 60) -> tuple[int, dict]:
    req = Request(
        url,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read())
    except HTTPError as exc:
        raw = exc.read()
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {}
        return exc.code, payload


def _create(base: str, workspace: Path, name: str) -> str:
    _s, body = _post_json(
        base + "/api/session",
        {"driver": "deterministic", "name": name, "workspace": str(workspace)},
    )
    return body["session_id"]


def test_over_cap_call_returns_429_without_blocking(base_cap3: str, tmp_path: Path) -> None:
    sid = _create(base_cap3, tmp_path / "wsp", "capped")
    outcomes: list[tuple[int, dict]] = []
    outcomes_lock = threading.Lock()

    def _call(text: str) -> None:
        result = _post_json(base_cap3 + f"/api/session/{sid}/turn", {"text": text})
        with outcomes_lock:
            outcomes.append(result)

    # Fire cap+1 = 4 concurrent POSTs. Three admitted, one refused.
    threads = [threading.Thread(target=_call, args=(f"turn-{i}",)) for i in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=30)

    statuses = sorted(s for s, _ in outcomes)
    assert statuses.count(200) == 3
    assert statuses.count(429) == 1
    # The 429 carries the spec body shape.
    refused = next(body for status, body in outcomes if status == 429)
    assert refused == {
        "ok": False,
        "error": "session queue full",
        "queue_position": 3,
        "queue_cap": 3,
    }


def test_429_returns_immediately_not_after_lock_wait(
    base_cap3: str, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The refusal path must not block on the per-session lock. Slow every
    admitted turn to 1 s via a monkey-patched turn_sync so the 3 admitted
    callers are still in-flight when the 4th arrives; the 4th must return
    429 in well under 1 s.
    """
    sid = _create(base_cap3, tmp_path / "wsp", "immediate")

    real_turn_sync = server._SESSION_REGISTRY.turn_sync

    def _slow_turn_sync(session_id: str, *args, **kwargs):
        time.sleep(1.0)
        return real_turn_sync(session_id, *args, **kwargs)

    monkeypatch.setattr(server._SESSION_REGISTRY, "turn_sync", _slow_turn_sync)

    def _call(text: str) -> None:
        _post_json(base_cap3 + f"/api/session/{sid}/turn", {"text": text}, timeout=30)

    # Fire 3 admitted; they all block for ~1 s inside the patched turn_sync.
    admitted = [threading.Thread(target=_call, args=(f"a-{i}",)) for i in range(3)]
    for t in admitted:
        t.start()
    time.sleep(0.2)

    # The refusal must return well under the 1 s sleep the admitted turns
    # are inside. If the cap check took the turn lock, this would block.
    start = time.monotonic()
    status, body = _post_json(
        base_cap3 + f"/api/session/{sid}/turn", {"text": "no"}, timeout=5
    )
    elapsed = time.monotonic() - start
    assert status == 429
    assert body["error"] == "session queue full"
    assert elapsed < 0.3, f"refusal took {elapsed:.3f}s — cap check blocked on the turn lock"

    for t in admitted:
        t.join(timeout=10)


def test_dequeue_frees_a_slot_for_the_next_caller(base_cap3: str, tmp_path: Path) -> None:
    """After a turn completes, `dequeue_turn` decrements the counter and
    the next caller is admitted.
    """
    sid = _create(base_cap3, tmp_path / "wsp", "freeing")
    # Fire 3 sequential turns; each must succeed. If dequeue did not fire
    # on the 3rd call, the 4th would 429 even though the queue is empty.
    for i in range(4):
        status, body = _post_json(base_cap3 + f"/api/session/{sid}/turn", {"text": f"t{i}"})
        assert status == 200, (status, body)


def test_config_override_reads_turn_queue_cap_from_toml(tmp_path: Path) -> None:
    cfg = tmp_path / "config.toml"
    cfg.write_text("[session]\nturn_queue_cap = 7\n")
    loaded = server._load_daemon_config(cfg)
    assert loaded["turn_queue_cap"] == 7


def test_config_missing_file_uses_defaults(tmp_path: Path) -> None:
    loaded = server._load_daemon_config(tmp_path / "does-not-exist.toml")
    assert loaded["turn_queue_cap"] == 4


def test_config_malformed_toml_falls_back_to_defaults(tmp_path: Path) -> None:
    cfg = tmp_path / "config.toml"
    cfg.write_text("[session\nturn_queue_cap = oops\n")  # syntactically broken
    loaded = server._load_daemon_config(cfg)
    assert loaded["turn_queue_cap"] == 4
