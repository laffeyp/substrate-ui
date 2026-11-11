# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""The workspace's changes against main (UI sprint 412; design spec r6 §5 "each hunk vs main", D48).

Real git repositories in a temporary folder: a branch ahead of main with a committed change, a
working-tree edit, a new file, a deleted file and an ignored file; a repository with no main; one
with no commit; a plain folder. The server's read must name the base it used and exactly the files
`git` itself reports, never touching the workspace's own index.
"""

from __future__ import annotations

import subprocess
from pathlib import Path

import pytest

import server


def git(root: Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-C", str(root), *args], capture_output=True, text=True, check=True
    ).stdout


def repo(root: Path, branch: str = "main") -> Path:
    root.mkdir(parents=True)
    git(root, "init", "-q", "-b", branch)
    git(root, "config", "user.email", "t@example.invalid")
    git(root, "config", "user.name", "t")
    return root


def commit_all(root: Path, msg: str) -> None:
    git(root, "add", "-A")
    git(root, "commit", "-q", "-m", msg)


@pytest.fixture
def feature(tmp_path: Path) -> Path:
    root = repo(tmp_path / "feature")
    (root / "src").mkdir()
    (root / "src" / "cart.ts").write_text("a\n")
    (root / "src" / "menu.ts").write_text("m\n")
    (root / "gone.txt").write_text("g\n")
    (root / ".gitignore").write_text("*.log\n")
    commit_all(root, "base")
    git(root, "checkout", "-q", "-b", "fix")
    (root / "src" / "menu.ts").write_text("m2\n")
    commit_all(root, "on the branch")
    (root / "src" / "cart.ts").write_text("a2\n")  # working-tree edit
    (root / "src" / "new.ts").write_text("n\n")  # untracked
    (root / "gone.txt").unlink()  # deleted
    (root / "debug.log").write_text("ignored\n")
    return root


def test_a_branch_ahead_of_main_lists_committed_edited_new_and_deleted_files(feature: Path) -> None:
    index_before = (feature / ".git" / "index").read_bytes()
    out = server._workspace_diff(feature)
    assert out["base"] == "main"
    assert sorted((f["path"], f["status"]) for f in out["files"]) == [
        ("gone.txt", "D"),
        ("src/cart.ts", "M"),
        ("src/menu.ts", "M"),
        ("src/new.ts", "A"),
    ]
    # Read-only: the workspace's own index is unchanged and new.ts is still untracked.
    assert (feature / ".git" / "index").read_bytes() == index_before
    assert "?? src/new.ts" in git(feature, "status", "--porcelain")


def test_the_read_agrees_with_git_itself(feature: Path) -> None:
    base = git(feature, "merge-base", "main", "HEAD").strip()
    want = set(git(feature, "diff", "--name-only", base).split())
    want |= set(git(feature, "ls-files", "--others", "--exclude-standard").split())
    assert {f["path"] for f in server._workspace_diff(feature)["files"]} == want


def test_a_subfolder_workspace_lists_its_own_paths(feature: Path) -> None:
    out = server._workspace_diff(feature / "src")
    assert sorted(f["path"] for f in out["files"]) == ["cart.ts", "menu.ts", "new.ts"]


def test_no_main_compares_with_the_last_commit(tmp_path: Path) -> None:
    # Sprint 450: not the first commit, which marked everything since it added.
    root = repo(tmp_path / "trunk", branch="trunk")
    (root / "a.txt").write_text("1\n")
    commit_all(root, "one")
    (root / "b.txt").write_text("2\n")
    commit_all(root, "two")
    assert server._workspace_diff(root) == {"base": "head", "files": []}
    (root / "b.txt").write_text("2\nmore\n")
    out = server._workspace_diff(root)
    assert out["base"] == "head"
    assert [(f["path"], f["status"]) for f in out["files"]] == [("b.txt", "M")]
    hunks = server._workspace_hunks(root, "b.txt")
    assert hunks["base"] == "head" and [h["lines"] for h in hunks["hunks"]] == [["+more"]]


def test_a_repository_with_no_commit_has_no_base(tmp_path: Path) -> None:
    # Sprint 450: git's empty tree as the base marked every line added, and the editor drew the text teal.
    root = repo(tmp_path / "empty")
    (root / "x.txt").write_text("x\n")
    assert server._workspace_diff(root) == {"base": "no_commit", "files": []}
    assert server._workspace_hunks(root, "x.txt") == {
        "base": "no_commit",
        "path": "x.txt",
        "hunks": [],
    }


def test_a_plain_folder_has_no_base_and_no_files(tmp_path: Path) -> None:
    (tmp_path / "plain").mkdir()
    (tmp_path / "plain" / "f.txt").write_text("f\n")
    assert server._workspace_diff(tmp_path / "plain") == {"base": "none", "files": []}
