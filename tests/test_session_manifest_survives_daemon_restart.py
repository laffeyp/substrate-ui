"""Sprint 211 — boot scan restores manifests and rewrites stale status fields.

Simulates a daemon restart by constructing a second `SessionRegistry` against
the same base directory. The first registry created several sessions; the
second reads by-name.json + every manifest.json off disk and rewrites the
`status` field of any manifest whose stored status disagrees with the record's
true state per `_scan_record_status`:

  - hot segment torn (daemon died mid-turn) → `interrupted`
  - `substrate.RunFinalised` present → `ended`
  - otherwise (record quiescent, awaiting resume) → `parked`

The three fixtures below build the three record shapes directly on disk —
one via `ci_session_topology` for a real finalised run, one via a synthetic
manifest for a parked session with no record yet, one via a synthetic
manifest paired with a hand-written broken hot segment for interrupted.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_session_manifest_survives_daemon_restart.py -q
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import msgspec
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from session_registry import (  # noqa: E402
    SessionManifest,
    SessionRegistry,
    scan_record_status,
)

from substrate import api  # noqa: E402
from substrate.topologies.session.ci import ci_session_topology  # noqa: E402


def _write_manifest(base: Path, m: SessionManifest) -> None:
    # Sprint 057: the registry's private `_manifest_to_dict` is no longer
    # imported here. `msgspec.to_builtins` on the same `SessionManifest`
    # Struct yields the identical dict shape (verified: same keys, same
    # values, JSON round-trippable through the registry's loader).
    session_dir = base / m.session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    (session_dir / "manifest.json").write_text(
        json.dumps(msgspec.to_builtins(m), indent=2, sort_keys=True), encoding="utf-8"
    )


def _mk_manifest(
    session_id: str, name: str | None, status: str, record_root: str
) -> SessionManifest:
    return SessionManifest(
        session_id=session_id,
        name=name,
        created_at=0.0,
        driver="deterministic",
        workspace="/tmp/w",
        workspace_shape="flat",
        record_root=record_root,
        status=status,  # type: ignore[arg-type]
        bundle=None,
        seed="hi",
    )


@pytest.mark.asyncio
async def test_boot_scan_marks_ended_from_finalised_record(tmp_path: Path) -> None:
    """A session whose record has `substrate.RunFinalised` reads as `ended` on
    the boot scan, even if the on-disk manifest says `running` (stale — the
    daemon died between the finalisation and the manifest rewrite).
    """
    session_id = "s_ended"
    session_dir = tmp_path / session_id
    session_dir.mkdir()
    record_root = session_dir / "record"
    await api.Runtime(record_root).run(
        ci_session_topology(turns=("hi", "/exit"), session_id="s_ended_run")
    )
    # Manifest lies about the status — the boot scan corrects it.
    stale = _mk_manifest(session_id, "ended-fixture", "running", str(record_root))
    _write_manifest(tmp_path, stale)

    fresh = SessionRegistry(base=tmp_path)
    fresh.boot_scan()
    got = fresh.get(session_id)
    assert got is not None
    assert got.status == "ended"
    # Rewrite is on disk.
    on_disk = json.loads((tmp_path / session_id / "manifest.json").read_text(encoding="utf-8"))
    assert on_disk["status"] == "ended"


def test_boot_scan_marks_parked_when_record_root_is_absent(tmp_path: Path) -> None:
    """A manifest whose `record_root` does not exist is treated as `parked` (a
    fresh session that has not written anything yet). No crash on missing dir.
    """
    session_id = "s_parked"
    stale = _mk_manifest(session_id, "parked-fixture", "running", str(tmp_path / "nonexistent"))
    _write_manifest(tmp_path, stale)

    fresh = SessionRegistry(base=tmp_path)
    fresh.boot_scan()
    got = fresh.get(session_id)
    assert got is not None
    assert got.status == "parked"


def test_boot_scan_marks_interrupted_from_torn_hot_segment(tmp_path: Path) -> None:
    """A hot segment with a truncated last frame is what a daemon killed
    mid-flush leaves. `api.recover_open_segment` returns the recovered length
    (non-None) and the boot scan writes `interrupted`.
    """
    session_id = "s_interrupted"
    record_root = tmp_path / session_id / "record"
    record_root.mkdir(parents=True)
    # Hand-craft a torn hot segment: one complete envelope frame followed by a
    # truncated line. `api.recover_open_segment` returns the byte length of the
    # good prefix, which is non-None when a torn tail exists.
    complete = (
        b'{"crc":"00000000","kind":"substrate.RunStarted","payload":{},'
        b'"producer":null,"schema":"substrate.RunStarted@1","seq":0,"t":0.0}\n'
    )
    torn = b'{"crc":"11111111","kind":"UserMessage","payl'  # no newline, no closing brace
    (record_root / "events-000001.open.jsonl").write_bytes(complete + torn)

    stale = _mk_manifest(session_id, "interrupted-fixture", "running", str(record_root))
    _write_manifest(tmp_path, stale)

    # Confirm the helper on its own recognizes torn.
    assert scan_record_status(record_root) == "interrupted"

    fresh = SessionRegistry(base=tmp_path)
    fresh.boot_scan()
    got = fresh.get(session_id)
    assert got is not None
    assert got.status == "interrupted"


@pytest.mark.asyncio
async def test_boot_scan_restores_multiple_sessions_across_restart(tmp_path: Path) -> None:
    """One `SessionRegistry` creates three sessions and finalises one; a second
    `SessionRegistry` on the same base reads them all back and returns the right
    status per session. This is the piece-C recovery promise end-to-end.
    """
    first = SessionRegistry(base=tmp_path)
    first.create(
        session_id="s_alive",
        name="alive",
        driver="deterministic",
        workspace="/tmp/w",
        workspace_shape="flat",
        bundle=None,
        seed="hi",
    )
    first.create(
        session_id="s_ended_alt",
        name="ended-alt",
        driver="deterministic",
        workspace="/tmp/w",
        workspace_shape="flat",
        bundle=None,
        seed="hi",
    )
    # Give s_ended_alt a real finalised record so the boot scan reclassifies it.
    ended_record = tmp_path / "s_ended_alt" / "record"
    await api.Runtime(ended_record).run(
        ci_session_topology(turns=("hi", "/exit"), session_id="s_ended_alt_run")
    )

    fresh = SessionRegistry(base=tmp_path)
    fresh.boot_scan()
    ids = {m.session_id: m.status for m in fresh.list_all()}
    assert ids["s_alive"] == "parked"
    assert ids["s_ended_alt"] == "ended"
    # by-name index survived.
    assert fresh.by_name("alive") == "s_alive"
    assert fresh.by_name("ended-alt") == "s_ended_alt"


def test_boot_scan_skips_the_wt_worktree_subdir(tmp_path: Path) -> None:
    """The daemon's git-worktree pattern parks per-session worktrees under
    `~/.substrate/sessions/wt/`. Those are not sessions; the boot scan must
    not treat the wt/ subtree as one. A crash there would prevent daemon
    boot even when the actual session directories are all fine.
    """
    (tmp_path / "wt").mkdir()
    (tmp_path / "wt" / "some-repo-s_xyz").mkdir()  # a worktree
    m = _mk_manifest("s_real", "real-fixture", "running", str(tmp_path / "s_real" / "record"))
    _write_manifest(tmp_path, m)

    fresh = SessionRegistry(base=tmp_path)
    fresh.boot_scan()  # must not raise
    assert {m.session_id for m in fresh.list_all()} == {"s_real"}
