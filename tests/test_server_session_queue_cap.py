"""Sprint 216 — per-session /turn queue cap.

The registry's `try_enqueue_turn` increments a per-session queued-turn
counter under a fast lock. The handler admits at most `turn_queue_cap`
callers; the (cap+1)th receives HTTP 429 immediately with the body shape
per TECH-SPEC §4:

    {"ok": false, "error": "session queue full",
     "queue_position": cap, "queue_cap": cap}

The refusal does NOT block on the per-session turn lock.

"""

from __future__ import annotations

import threading
import time
from pathlib import Path

import pytest
from _serving import call, serving  # noqa: E402

import server  # noqa: E402


@pytest.fixture
def base_cap3(app: server.App, tmp_path: Path) -> str:
    # cap=3 keeps the test fast: 3 admitted + 1 refused = 4 concurrent
    # POSTs, and the admitted ones all sleep on the same lock.
    app.install_registry(base=tmp_path, turn_queue_cap=3)
    with serving(app) as base:
        yield base


def _post_json(url: str, body: dict, timeout: float = 60) -> tuple[int, dict]:
    status, payload = call("POST", url, body, timeout=timeout)
    return status, payload


def _create(base: str, workspace: Path, name: str) -> str:
    _s, body = _post_json(
        base + "/api/session",
        {"driver": "deterministic", "name": name, "workspace": str(workspace)},
    )
    return body["session_id"]


def test_over_cap_call_returns_429_without_blocking(
    app: server.App, base_cap3: str, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    sid = _create(base_cap3, tmp_path / "wsp", "capped")
    # Every admitted turn holds its slot for 1 s, so all four requests meet a full queue whatever
    # the machine's speed (lens audit F445: deterministic turns could finish before the fourth
    # request arrived, and then all four were admitted).
    real_turn_sync = app.registry.turn_sync

    def _slow_turn_sync(session_id: str, *args, **kwargs):
        time.sleep(1.0)
        return real_turn_sync(session_id, *args, **kwargs)

    monkeypatch.setattr(app.registry, "turn_sync", _slow_turn_sync)
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
    app: server.App, base_cap3: str, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The refusal path must not block on the per-session lock. Slow every
    admitted turn to 1 s via a monkey-patched turn_sync so the 3 admitted
    callers are still in-flight when the 4th arrives; the 4th must return
    429 in well under 1 s.
    """
    sid = _create(base_cap3, tmp_path / "wsp", "immediate")

    real_turn_sync = app.registry.turn_sync

    def _slow_turn_sync(session_id: str, *args, **kwargs):
        time.sleep(1.0)
        return real_turn_sync(session_id, *args, **kwargs)

    monkeypatch.setattr(app.registry, "turn_sync", _slow_turn_sync)

    def _call(text: str) -> None:
        _post_json(base_cap3 + f"/api/session/{sid}/turn", {"text": text}, timeout=30)

    # Fire 3 admitted; they all block for ~1 s inside the patched turn_sync.
    admitted = [threading.Thread(target=_call, args=(f"a-{i}",)) for i in range(3)]
    for t in admitted:
        t.start()
    # Wait until all three hold a queue slot (the registry's counter), not a fixed 0.2 s.
    deadline = time.monotonic() + 5
    while app.registry._queue_depths.get(sid, 0) < 3 and time.monotonic() < deadline:
        time.sleep(0.01)
    assert app.registry._queue_depths.get(sid, 0) == 3

    # The refusal must return well under the 1 s sleep the admitted turns
    # are inside. If the cap check took the turn lock, this would block.
    start = time.monotonic()
    status, body = _post_json(base_cap3 + f"/api/session/{sid}/turn", {"text": "no"}, timeout=5)
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
