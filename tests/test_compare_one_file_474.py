# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""A file's comparison reads that file, not the whole workspace (UI sprint 474; BLACKBOARD 2026-11-11, the editor
broken in use and the missed hunk). One file is compared with `git diff <base> -- <path>` against the workspace's own
index, read-only, with no scratch index; a new file reads as all added and an ignored one has none. A file rewritten in
the second it was committed, at the same size, shows its change: in the one file's hunks and in the tree's list, whose
scratch index keeps the index's modification time. Real git repositories, written here by hand."""

from __future__ import annotations

import subprocess
import time
from pathlib import Path
from typing import Any

import pytest

import server


def git(root: Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-C", str(root), *args], capture_output=True, text=True, check=True
    ).stdout


def repo(root: Path) -> Path:
    root.mkdir()
    git(root, "init", "-q", "-b", "main")
    git(root, "config", "user.email", "t@example.invalid")
    git(root, "config", "user.name", "t")
    (root / "a.ts").write_text("export const a = 1;\n")
    (root / ".gitignore").write_text("skip.txt\n")
    git(root, "add", "-A")
    git(root, "commit", "-q", "-m", "base")
    return root


def test_a_same_second_same_size_edit_is_always_seen(tmp_path: Path) -> None:
    # The edit lands in the second the index was written, at the same size; the comparison runs a second later, as
    # an editor's does. Measured 2026-11-11: the index copied with a new time missed the change 8 times in 8, in the
    # one file's diff and in the tree's list; the index's own time kept, and the own index read, 0 in 8. The pause is
    # the precondition (the clock must pass a second), not a wait on the app.
    roots = []
    for k in range(3):
        root = repo(tmp_path / f"ws{k}")
        (root / "a.ts").write_text("export const a = 2;\n")
        roots.append(root)
    time.sleep(1.1)
    for k, root in enumerate(roots):
        hunks = server._workspace_hunks(root, "a.ts")["hunks"]
        assert [h["lines"] for h in hunks] == [["-export const a = 1;", "+export const a = 2;"]], k  # type: ignore[union-attr, index]
        files = server._workspace_diff(root)["files"]
        assert {"path": "a.ts", "status": "M"} in files, k  # type: ignore[operator]


def test_one_file_uses_no_scratch_index(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    root = repo(tmp_path / "ws")
    (root / "a.ts").write_text("export const a = 22;\n")
    (root / "new.ts").write_text("x\ny\n")
    (root / "skip.txt").write_text("ignored\n")

    def no_scratch(*a: Any, **k: Any) -> None:
        raise AssertionError("a scratch index was built for one file")

    monkeypatch.setattr(server, "_scratch_index", no_scratch)
    index = (root / ".git" / "index").read_bytes()
    got = {
        name: [
            (h["old_start"], h["old_count"], h["new_start"], h["new_count"], h["lines"])
            for h in server._workspace_hunks(root, name)["hunks"]
        ]  # type: ignore[union-attr, index]
        for name in ("a.ts", "new.ts", "skip.txt")
    }
    assert got == {
        "a.ts": [(1, 1, 1, 1, ["-export const a = 1;", "+export const a = 22;"])],
        "new.ts": [(0, 0, 1, 2, ["+x", "+y"])],
        "skip.txt": [],
    }
    # The workspace's own index is read, never written.
    assert (root / ".git" / "index").read_bytes() == index
