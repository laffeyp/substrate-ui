# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 502: change marks start at the repository. A workspace outside every repository is read through the
repositories inside it, each against its own HEAD; nothing outside them is marked."""

from __future__ import annotations

import subprocess
from pathlib import Path

import server


def _repo(at: Path, files: dict[str, str]) -> None:
    for rel, text in files.items():
        (at / rel).parent.mkdir(parents=True, exist_ok=True)
        (at / rel).write_text(text)
    for args in (
        ["init", "-q", "-b", "main"],
        ["config", "user.email", "t@example.invalid"],
        ["config", "user.name", "t"],
        ["add", "-A"],
        ["commit", "-q", "-m", "base"],
    ):
        subprocess.run(["git", "-C", str(at), *args], check=True)


def test_a_plain_workspace_is_read_through_its_repositories(tmp_path: Path) -> None:
    (tmp_path / "loose.txt").write_text("loose\n")
    _repo(tmp_path / "projects" / "alpha", {"src/deep/a.py": "a = 1\n"})
    _repo(tmp_path / "projects" / "beta", {"b.py": "b = 1\n"})
    (tmp_path / "projects" / "alpha" / "src" / "deep" / "a.py").write_text("a = 2\n")
    (tmp_path / "projects" / "alpha" / "new.py").write_text("n = 1\n")
    (tmp_path / "loose.txt").write_text("changed, outside every repository\n")
    got = server._workspace_diff(tmp_path)
    assert got["base"] == "repositories"
    assert got["repos"] == ["projects/alpha", "projects/beta"]
    assert sorted((f["path"], f["status"]) for f in got["files"]) == [  # type: ignore[union-attr]
        ("projects/alpha/new.py", "A"),
        ("projects/alpha/src/deep/a.py", "M"),
    ]


def test_a_file_reads_its_repositorys_hunks(tmp_path: Path) -> None:
    _repo(tmp_path / "alpha", {"x.py": "one\ntwo\n"})
    (tmp_path / "alpha" / "x.py").write_text("one\nTWO\n")
    (tmp_path / "loose.txt").write_text("loose\n")
    got = server._workspace_hunks(tmp_path, "alpha/x.py")
    assert got["base"] == "head" and got["path"] == "alpha/x.py"
    assert [h["lines"] for h in got["hunks"]] == [["-two", "+TWO"]]  # type: ignore[union-attr, index]
    assert server._workspace_hunks(tmp_path, "loose.txt") == {
        "base": "none",
        "path": "loose.txt",
        "hunks": [],
    }


def test_a_plain_folder_with_no_repository_has_no_marks(tmp_path: Path) -> None:
    (tmp_path / "a.txt").write_text("a\n")
    assert server._workspace_diff(tmp_path) == {"base": "none", "files": [], "repos": []}
