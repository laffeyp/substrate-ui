"""Sprint 224f — direct test that `boot_scan` preserves `"ended"` as terminal.

The 217a shutdown path flips a fresh session's manifest to `"ended"` at
the daemon layer without opening a record. `scan_record_status` returns
`"parked"` for a missing record dir and `"interrupted"` for a torn one —
both would overwrite the terminal `"ended"` state if boot_scan
re-derived unconditionally. session_registry.py:290-295 short-circuits
`"ended"` before re-derive.

Only `test_fresh_session_transitions_to_ended_and_survives_reboot`
exercises the branch end-to-end. This file isolates it: two direct tests
that write an on-disk manifest with `status="ended"` and assert the
reloaded value stays `"ended"` regardless of what the record dir looks
like. A future change that added a new clause overriding `"ended"` would
fail these before a downstream test caught the drift.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_registry import SessionRegistry  # noqa: E402


def _write_ended_manifest(session_dir: Path) -> None:
    session_dir.mkdir(parents=True)
    manifest = {
        "session_id": session_dir.name,
        "name": "flipped-to-ended",
        "created_at": time.time(),
        "driver": "deterministic",
        "workspace": str(session_dir / "workspace"),
        "workspace_shape": "flat",
        "record_root": str(session_dir / "record"),
        "status": "ended",
        "bundle": None,
        "seed": "",
        "tools": None,
        "role": "default",
        "per_turn": "",
    }
    (session_dir / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")


def test_boot_scan_preserves_ended_when_no_record_dir_exists(tmp_path: Path) -> None:
    """A fresh session flipped to `"ended"` at shutdown never wrote a
    record dir. `scan_record_status` returns `"parked"` for a missing
    record; boot_scan MUST NOT overwrite `"ended"` with that."""
    sid = "s_test_abc"
    _write_ended_manifest(tmp_path / sid)

    reg = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    reg.boot_scan()
    manifest = reg.get(sid)
    assert manifest is not None
    assert manifest.status == "ended", (
        f"boot_scan re-derived a terminal status; got {manifest.status!r}. "
        "The `"
        f"if manifest.status == 'ended': true_status = 'ended'"
        "` guard in session_registry.py has drifted."
    )


def test_boot_scan_preserves_ended_when_record_dir_is_torn(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A session that had a record and ended, then the record went torn
    (bit rot, partial write). `scan_record_status` returns `"interrupted"`
    on a raise; boot_scan MUST NOT overwrite `"ended"`. Terminal states
    are the operator's decision, not the record's."""
    from substrate.errors import RecordGapError

    sid = "s_test_torn"
    _write_ended_manifest(tmp_path / sid)
    (tmp_path / sid / "record").mkdir()

    import session_registry as sreg

    def _raise_read(*_a, **_kw):
        raise RecordGapError("simulated torn tail (test)")

    monkeypatch.setattr(sreg.api, "read_record", _raise_read)

    reg = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    reg.boot_scan()
    manifest = reg.get(sid)
    assert manifest is not None
    assert manifest.status == "ended"
