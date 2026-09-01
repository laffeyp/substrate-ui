# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 215d — SIGTERM graceful shutdown ends every session cleanly.

`_shutdown_all_sessions()` walks the registered sessions and injects
`SessionEndRequested(session_id, source="daemon_shutdown")` per session
via `SessionRegistry.turn_sync`. The session topology's `end-on-user-end`
trigger reads the source and yields `SessionEnded{reason: "daemon_shutdown"}`;
`RunFinalised` follows; the manifest transitions to `"ended"`. The SIGTERM
handler in `main()` calls this function then `srv.shutdown()` then
`sys.exit(0)`; this test exercises the shutdown function directly (a
subprocess SIGTERM test belongs in the piece-B integration sprint).

Behaviors under test:
  1. Two parked sessions both end with reason=daemon_shutdown and
     RunFinalised on their records.
  2. Both manifests transition to "ended"; a fresh SessionRegistry
     boot_scan against the same base dir sees status="ended".
  3. An already-ended session is skipped (no second turn fired).
  4. A session whose turn_sync fails does not stop the loop; the other
     session still ends.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_daemon_shutdown.py -q
"""

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

from substrate import api  # noqa: E402
from substrate.testing import assert_event  # noqa: E402


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


def _post_json(url: str, body: dict) -> tuple[int, dict]:
    req = Request(
        url,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urlopen(req, timeout=30) as r:
        return r.status, json.loads(r.read())


def _create(base: str, workspace: Path, name: str) -> str:
    _s, body = _post_json(
        base + "/api/session",
        {"driver": "deterministic", "name": name, "workspace": str(workspace)},
    )
    return body["session_id"]


def _park(base: str, sid: str) -> None:
    """Fire one turn so the session's record has UserMessage +
    ModelReply + Park (rather than being brand-new-empty)."""
    _post_json(base + f"/api/session/{sid}/turn", {"text": "priming"})


def test_shutdown_ends_every_parked_session_with_reason_daemon_shutdown(
    base: tuple[str, Path],
) -> None:
    url, tmp_path = base
    sid_a = _create(url, tmp_path / "a", "alpha")
    sid_b = _create(url, tmp_path / "b", "beta")
    _park(url, sid_a)
    _park(url, sid_b)

    outcome = server._shutdown_all_sessions(per_session_timeout=10.0)
    # Sprint 217a: bucket set split from `skipped` into `skipped_fresh` and
    # `skipped_ended` so an operator reading the SIGTERM exit log can tell
    # a fresh session (no record on disk) from one that ended before the sweep.
    assert outcome == {"ended": 2, "skipped_fresh": 0, "skipped_ended": 0, "failed": 0}

    for sid in (sid_a, sid_b):
        record_root = Path(server._SESSION_REGISTRY.get(sid).record_root)
        # The topology closed cleanly with the daemon-shutdown reason and
        # a real RunFinalised envelope — not a manifest flip.
        assert_event(record_root, "SessionEnded", reason="daemon_shutdown")
        envs = list(api.read_record(record_root))
        assert any(e["kind"] == "substrate.RunFinalised" for e in envs), (
            f"RunFinalised missing on {sid}"
        )


def test_shutdown_manifests_transition_to_ended_and_survive_reboot(
    base: tuple[str, Path],
) -> None:
    url, tmp_path = base
    sid = _create(url, tmp_path / "wsp", "reboot-me")
    _park(url, sid)

    server._shutdown_all_sessions(per_session_timeout=10.0)
    assert server._SESSION_REGISTRY.get(sid).status == "ended"

    # A fresh registry against the same base dir reads the ended status
    # from the on-disk manifest via boot_scan.
    fresh = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    fresh.boot_scan()
    reloaded = fresh.get(sid)
    assert reloaded is not None
    assert reloaded.status == "ended"


def test_shutdown_skips_already_ended_sessions(base: tuple[str, Path]) -> None:
    url, tmp_path = base
    sid_live = _create(url, tmp_path / "live", "live")
    sid_done = _create(url, tmp_path / "done", "done")
    _park(url, sid_live)
    _park(url, sid_done)
    # End `done` via POST /end before shutdown fires.
    _post_json(url + f"/api/session/{sid_done}/end", {})
    assert server._SESSION_REGISTRY.get(sid_done).status == "ended"

    outcome = server._shutdown_all_sessions(per_session_timeout=10.0)
    # `done` was skipped (already ended); `live` was ended.
    # Sprint 217a: the pre-ended session buckets under `skipped_ended`.
    assert outcome == {"ended": 1, "skipped_fresh": 0, "skipped_ended": 1, "failed": 0}
    # The already-ended session's record still shows the earlier reason,
    # not the shutdown one.
    done_root = Path(server._SESSION_REGISTRY.get(sid_done).record_root)
    envs = list(api.read_record(done_root))
    reasons = [
        e["payload"]["reason"] for e in envs if e["kind"] == "SessionEnded"
    ]
    assert reasons == ["user_end"], reasons


def test_shutdown_continues_when_one_session_fails(
    base: tuple[str, Path], monkeypatch: pytest.MonkeyPatch
) -> None:
    """A turn_sync raise on one session must not stop the loop; the
    other session still ends cleanly.
    """
    url, tmp_path = base
    sid_good = _create(url, tmp_path / "good", "good")
    sid_bad = _create(url, tmp_path / "bad", "bad")
    _park(url, sid_good)
    _park(url, sid_bad)

    real_turn_sync = server._SESSION_REGISTRY.turn_sync

    def _flaky_turn_sync(session_id: str, *args, **kwargs):
        if session_id == sid_bad:
            raise RuntimeError("simulated per-session failure")
        return real_turn_sync(session_id, *args, **kwargs)

    monkeypatch.setattr(server._SESSION_REGISTRY, "turn_sync", _flaky_turn_sync)

    outcome = server._shutdown_all_sessions(per_session_timeout=10.0)
    assert outcome == {"ended": 1, "skipped_fresh": 0, "skipped_ended": 0, "failed": 1}
    # The good session ended cleanly.
    good_root = Path(server._SESSION_REGISTRY.get(sid_good).record_root)
    assert_event(good_root, "SessionEnded", reason="daemon_shutdown")
