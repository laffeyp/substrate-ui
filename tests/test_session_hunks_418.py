# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""One file's hunks against the workspace's base (UI sprint 418; roadmap 2026-11-09-code-editor r8, E2;
design spec r6 §5 "each hunk vs main"). Real git repositories: an edited file's hunks name git's own
ranges and lines; a new file reads as all added; a removal has a new count of 0; outside git there is
no base and no hunk; a path outside the workspace is refused; the workspace's index is not written.
"""

from __future__ import annotations

import subprocess
from pathlib import Path

import pytest

import server


def git(root: Path, *args: str) -> str:
    return subprocess.run(["git", "-C", str(root), *args], capture_output=True, text=True, check=True).stdout


@pytest.fixture
def ws(tmp_path: Path) -> Path:
    root = tmp_path / "ws"
    root.mkdir()
    git(root, "init", "-q", "-b", "main")
    git(root, "config", "user.email", "t@example.invalid")
    git(root, "config", "user.name", "t")
    (root / "cart.ts").write_text("".join(f"line {i}\n" for i in range(1, 11)))
    (root / "gone.ts").write_text("a\nb\nc\n")
    git(root, "add", "-A")
    git(root, "commit", "-q", "-m", "base")
    git(root, "checkout", "-q", "-b", "fix")
    lines = [f"line {i}\n" for i in range(1, 11)]
    lines[2] = "line 3 changed\n"  # one line replaced
    lines[6:7] = ["line 7\n", "added a\n", "added b\n"]  # two lines inserted after line 7
    lines.remove("line 10\n")  # line 10 removed (by value: the insertion shifted the indexes)
    (root / "cart.ts").write_text("".join(lines))
    (root / "gone.ts").write_text("a\nc\n")
    (root / "new.ts").write_text("x\ny\n")
    return root


def test_an_edited_file_has_gits_own_hunks(ws: Path) -> None:
    out = server._workspace_hunks(ws, "cart.ts")
    assert out["base"] == "main"
    got = [(h["old_start"], h["old_count"], h["new_start"], h["new_count"], h["lines"]) for h in out["hunks"]]
    assert got == [
        (3, 1, 3, 1, ["-line 3", "+line 3 changed"]),
        (7, 0, 8, 2, ["+added a", "+added b"]),
        (10, 1, 11, 0, ["-line 10"]),
    ]
    # The same ranges git prints itself.
    headers = [ln for ln in git(ws, "diff", "-U0", "main", "--", "cart.ts").splitlines() if ln.startswith("@@")]
    assert len(headers) == len(out["hunks"])


def test_a_new_file_is_all_added_and_the_index_is_untouched(ws: Path) -> None:
    before = (ws / ".git" / "index").read_bytes()
    out = server._workspace_hunks(ws, "new.ts")
    assert [(h["old_count"], h["new_start"], h["new_count"], h["lines"]) for h in out["hunks"]] == [(0, 1, 2, ["+x", "+y"])]
    assert (ws / ".git" / "index").read_bytes() == before


def test_an_unchanged_file_has_no_hunk(ws: Path) -> None:
    git(ws, "add", "-A")
    git(ws, "commit", "-q", "-m", "all")
    git(ws, "checkout", "-q", "main")
    assert server._workspace_hunks(ws, "cart.ts")["hunks"] == []


def test_outside_git_there_is_no_base_and_no_hunk(tmp_path: Path) -> None:
    (tmp_path / "plain").mkdir()
    (tmp_path / "plain" / "a.txt").write_text("a\n")
    assert server._workspace_hunks(tmp_path / "plain", "a.txt") == {"base": "none", "path": "a.txt", "hunks": []}


def test_a_path_outside_the_workspace_is_refused(ws: Path) -> None:
    with pytest.raises(server.WorkspaceEscapeError):
        server._workspace_hunks(ws, "../outside.txt")


def test_the_whole_workspace_read_is_unchanged(ws: Path) -> None:
    out = server._workspace_diff(ws)
    assert sorted((f["path"], f["status"]) for f in out["files"]) == [("cart.ts", "M"), ("gone.ts", "M"), ("new.ts", "A")]
