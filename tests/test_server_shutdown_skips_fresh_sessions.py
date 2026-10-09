"""Sprint 217a invariant — `_shutdown_all_sessions` buckets fresh sessions
under `skipped_fresh` and transitions their manifest to `"ended"` without
opening the record.

A fresh session (a manifest with no record dir on disk) cannot receive a
`SessionEndRequested` — `turn_sync` raises `FreshSessionRequiresUserMessage`
because the `session_open` producer can only open a run from a `UserMessage`.
The SIGTERM sweep catches that error, flips the manifest to `"ended"` at the
daemon layer (rule 12: no record to preserve — nothing existed), and buckets
the outcome under `skipped_fresh`.

This test locks the two behaviors that piece-B commit 391c680 relied on but
never covered:
  1. A fresh session under shutdown buckets as `skipped_fresh` (not `failed`).
  2. The manifest transitions to `"ended"` and survives a boot_scan.

Regressions this catches:
  - `FreshSessionRequiresUserMessage` renamed → bucket flips to `failed`
    (server.py's isinstance check in `_shutdown_all_sessions` would still work, but the sweep test
    now names the outcome explicitly).
  - The catch branch drops the `update_status(..., "ended")` call →
    a fresh session survives shutdown as `"provisioned"` and re-enters
    the sweep on next boot.
"""

from __future__ import annotations

import functools

from _serving import serving

from pathlib import Path

import pytest
from substrate.topologies.session_registry import SessionRegistry  # noqa: E402

import server  # noqa: E402


@pytest.fixture
def registry(app: server.App, tmp_path: Path) -> SessionRegistry:
    reg = SessionRegistry(
        base=tmp_path,
        session_topology_factory=functools.partial(
            server._build_session_topology_from_manifest, app
        ),
    )
    app.registry = reg
    return reg


_COUNTER = 0


def _create_fresh(registry: SessionRegistry, tmp_path: Path, name: str) -> str:
    global _COUNTER
    _COUNTER += 1
    sid = f"s_shut_{_COUNTER:03d}"
    m = registry.create(
        session_id=sid,
        name=name,
        driver="deterministic",
        workspace=str(tmp_path / name),
        workspace_shape="flat",
        bundle=None,
        seed="",
    )
    return m.session_id


def test_shutdown_buckets_fresh_session_as_skipped_fresh(
    app: server.App, registry: SessionRegistry, tmp_path: Path
) -> None:
    """A session that never received a turn — no record dir on disk —
    lands in the `skipped_fresh` bucket, not `failed`."""
    sid = _create_fresh(registry, tmp_path, "never-opened")
    manifest = registry.get(sid)
    assert manifest is not None
    assert not Path(manifest.record_root).exists(), (
        "fresh session must have no record dir before the sweep"
    )

    outcome = server._shutdown_all_sessions(app, per_session_timeout=10.0)
    assert outcome == {
        "ended": 0,
        "skipped_fresh": 1,
        "skipped_ended": 0,
        "failed": 0,
        "background_stopped": 0,
    }


def test_fresh_session_transitions_to_ended_and_survives_reboot(
    app: server.App, registry: SessionRegistry, tmp_path: Path
) -> None:
    """The daemon flips the manifest to `"ended"` at the daemon layer;
    a fresh registry over the same base dir sees `"ended"` after boot_scan."""
    sid = _create_fresh(registry, tmp_path, "fresh-then-ended")
    server._shutdown_all_sessions(app, per_session_timeout=10.0)
    assert registry.get(sid).status == "ended"

    fresh = SessionRegistry(
        base=tmp_path,
        session_topology_factory=functools.partial(
            server._build_session_topology_from_manifest, app
        ),
    )
    fresh.boot_scan()
    reloaded = fresh.get(sid)
    assert reloaded is not None
    assert reloaded.status == "ended", (
        f"boot_scan lost the ended-status transition; got {reloaded.status!r}"
    )


def test_shutdown_mixes_fresh_parked_and_ended_buckets(
    app: server.App, registry: SessionRegistry, tmp_path: Path
) -> None:
    """Three sessions in three states — fresh, parked, already-ended —
    each land in the right bucket in a single sweep. Regression against
    the bucket accounting drifting after the piece-B commit's rename."""
    import json as _json
    from urllib.request import Request, urlopen

    with serving(app) as base:
        # fresh — created but no turn
        _create_fresh(registry, tmp_path, "fresh")

        # parked — one turn fired
        parked = _create_fresh(registry, tmp_path, "parked")
        req = Request(
            base + f"/api/session/{parked}/turn",
            data=_json.dumps({"text": "priming"}).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(req, timeout=30):
            pass

        # already-ended — flipped in-place
        ended = _create_fresh(registry, tmp_path, "ended")
        registry.update_status(ended, "ended")

        outcome = server._shutdown_all_sessions(app, per_session_timeout=15.0)
    assert outcome == {
        "ended": 1,
        "skipped_fresh": 1,
        "skipped_ended": 1,
        "failed": 0,
        "background_stopped": 0,
    }
