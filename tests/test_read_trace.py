# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""scripts/read_trace.py (plan 2026-11-05-sdd-signals item 6, sprint 378): the merge across a
launch's files and the join to a session's kernel record, on fixture files. The window's wall times
are set before the server's, so a merge by wall time alone would put the window's acks first."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

SPEC = importlib.util.spec_from_file_location(
    "read_trace", Path(__file__).resolve().parent.parent / "scripts" / "read_trace.py"
)
assert SPEC and SPEC.loader
read_trace = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(read_trace)


def _rec(
    process: str,
    seq: int,
    name: str,
    wall: str,
    payload: dict,
    window_id: int | None = None,
    pane_id: int | None = None,
) -> dict:
    return {
        "boot_id": "b1",
        "process": process,
        "proc_seq": seq,
        "wall": wall,
        "window_id": window_id,
        "pane_id": pane_id,
        "name": name,
        "payload": payload,
    }


def _write(folder: Path, name: str, recs: list[dict]) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    (folder / name).write_text("".join(json.dumps(r) + "\n" for r in recs), encoding="utf-8")


@pytest.fixture
def home(tmp_path: Path) -> Path:
    boot = tmp_path / "electron" / "logs" / "traces" / "b1"
    _write(
        boot,
        "main.jsonl",
        [
            _rec(
                "main",
                0,
                "APP_BOOTED",
                "2026-11-08T10:00:00.000Z",
                {"app_commit": "a", "kernel_commit": "k", "vocab_version": "0.23"},
            ),
            _rec(
                "main",
                1,
                "SERVER_SPAWNED",
                "2026-11-08T10:00:00.100Z",
                {"pid": 1, "packaged": False},
            ),
            _rec(
                "main",
                2,
                "WINDOW_OPENED",
                "2026-11-08T10:00:00.300Z",
                {"cause": "boot"},
                window_id=1,
            ),
        ],
    )
    _write(
        boot,
        "server.jsonl",
        [
            _rec("server", 0, "SERVER_STARTED", "2026-11-08T10:00:00.050Z", {"port": 9}),
            _rec(
                "server",
                1,
                "SESSION_CREATED",
                "2026-11-08T10:00:02.000Z",
                {"session_id": "s1", "driver": "d", "workspace_shape": "sandbox"},
            ),
            _rec(
                "server",
                2,
                "TURN_ACCEPTED",
                "2026-11-08T10:00:04.000Z",
                {"session_id": "s1", "turn_index": 0},
            ),
        ],
    )
    _write(
        boot,
        "window-1.jsonl",
        [
            _rec(
                "window",
                0,
                "WINDOW_BOOTED",
                "2026-11-08T10:00:00.200Z",
                {"vocab_version": "0.23"},
                window_id=1,
            ),
            _rec(
                "window",
                1,
                "SESSION_OPEN_ACKED",
                "2026-11-08T10:00:01.000Z",
                {"session_id": "s1", "name": None, "driver": "d"},
                window_id=1,
                pane_id=1,
            ),
            _rec(
                "window",
                2,
                "TURN_ACK",
                "2026-11-08T10:00:03.000Z",
                {"session_id": "s1"},
                window_id=1,
                pane_id=1,
            ),
            _rec(
                "window",
                3,
                "STREAM_ENVELOPE_APPENDED",
                "2026-11-08T10:00:03.100Z",
                {"seq": 1, "kind": "ModelReply"},
                window_id=1,
                pane_id=1,
            ),
            _rec(
                "window",
                4,
                "STREAM_ENVELOPE_APPENDED",
                "2026-11-08T10:00:03.200Z",
                {"seq": 7, "kind": "ModelReply"},
                window_id=1,
                pane_id=1,
            ),
        ],
    )
    record = tmp_path / "sessions" / "s1" / "record"
    (tmp_path / "sessions" / "s1").mkdir(parents=True)
    (tmp_path / "sessions" / "s1" / "manifest.json").write_text(
        json.dumps({"session_id": "s1", "record_root": str(record)}), encoding="utf-8"
    )
    return tmp_path


def test_merge_keeps_each_file_in_order_and_the_server_before_the_window(home: Path) -> None:
    recs = read_trace.merge(read_trace.load_boot(home / "electron" / "logs" / "traces" / "b1"))
    names = [r["name"] for r in recs]
    assert names.index("SERVER_SPAWNED") < names.index("SERVER_STARTED")
    assert names.index("WINDOW_OPENED") < names.index("WINDOW_BOOTED")
    assert names.index("SESSION_CREATED") < names.index("SESSION_OPEN_ACKED")
    assert names.index("TURN_ACCEPTED") < names.index("TURN_ACK")
    for proc in ("main", "server", "window"):
        seqs = [r["proc_seq"] for r in recs if r["process"] == proc]
        assert seqs == sorted(seqs)


def test_the_listing_joins_a_seq_to_the_kernel_record(
    home: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setattr(
        read_trace,
        "read_record",
        lambda root, resolve_blobs=False: iter(
            [
                {"seq": 0, "kind": "UserMessage", "producer": None, "payload": {}},
                {"seq": 1, "kind": "ModelReply", "producer": "model", "payload": {"n": 1}},
            ]
        ),
    )
    assert read_trace.main(["--home", str(home), "--pane", "1"]) == 0
    out = capsys.readouterr().out
    assert out.startswith("## Signal Capture")
    assert "↳ kernel seq=1 ModelReply producer=model" in out
    assert "↳ kernel seq=7 not in the record of s1" in out
    assert "SERVER_STARTED" not in out  # --pane 1 keeps pane 1's records only


def _records_of(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        read_trace,
        "read_record",
        lambda root, resolve_blobs=False: iter(
            [{"seq": 1, "kind": "ModelReply", "producer": "model", "payload": {}}]
        ),
    )


def test_a_line_cut_short_is_skipped_and_counted(
    home: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    """A launch killed mid-write leaves its last line cut short; the reader reads the rest."""
    _records_of(monkeypatch)
    main = home / "electron" / "logs" / "traces" / "b1" / "main.jsonl"
    with main.open("a", encoding="utf-8") as f:
        f.write('{"boot_id":"b1","process":"main","proc_seq":3,"na')
    assert read_trace.main(["--home", str(home)]) == 0
    out = capsys.readouterr().out
    assert "Unreadable lines (skipped): main.jsonl line 4" in out
    assert "WINDOW_OPENED" in out


def test_each_join_failure_says_which(
    home: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    _records_of(monkeypatch)
    assert read_trace.main(["--home", str(home), "--pane", "1"]) == 0
    out = capsys.readouterr().out
    assert "↳ kernel seq=7 not in the record of s1 (the record at " in out
    assert "ends at seq 1)" in out
    (home / "sessions" / "s1" / "manifest.json").unlink()
    assert read_trace.main(["--home", str(home), "--pane", "1"]) == 0
    out = capsys.readouterr().out
    assert "↳ kernel seq=1 no manifest for session s1 at " in out

    def unreadable(root: str, resolve_blobs: bool = False) -> None:
        raise PermissionError(root)

    (home / "sessions" / "s1" / "manifest.json").write_text(
        json.dumps({"session_id": "s1", "record_root": "/r"}), encoding="utf-8"
    )
    monkeypatch.setattr(read_trace, "read_record", unreadable)
    assert read_trace.main(["--home", str(home), "--pane", "1"]) == 0
    out = capsys.readouterr().out
    assert "↳ kernel seq=1 the record of s1 at /r could not be read (PermissionError)" in out


def test_the_header_says_whether_the_launch_closed(
    home: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    """S2: APP_QUIT_COMPLETED is main's last record; a later launch means an open one has ended."""
    _records_of(monkeypatch)
    assert read_trace.main(["--home", str(home)]) == 0
    out = capsys.readouterr().out
    assert "Closed: no; main's last record is WINDOW_OPENED; no later launch" in out
    assert "Rule breaks: none" in out
    _write(
        home / "electron" / "logs" / "traces" / "b2",
        "main.jsonl",
        [
            _rec("main", 0, "APP_BOOTED", "2026-11-08T11:00:00.000Z", {}),
            _rec(
                "main",
                1,
                "INVARIANT_BROKEN",
                "2026-11-08T11:00:00.001Z",
                {"rule": "S2", "context": {}},
            ),
            _rec("main", 2, "APP_QUIT_COMPLETED", "2026-11-08T11:00:01.000Z", {}),
        ],
    )
    assert read_trace.main(["--home", str(home), "--boot", "b1"]) == 0
    assert (
        "a later launch (b2) is in the folder, so this one ended without closing (S2 broken)"
        in capsys.readouterr().out
    )
    assert read_trace.main(["--home", str(home)]) == 0
    out = capsys.readouterr().out
    assert "Closed: yes" in out and "Rule breaks: S2 1" in out
