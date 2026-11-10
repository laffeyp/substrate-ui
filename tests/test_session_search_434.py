# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""The workspace search (UI sprint 434; roadmap 2026-11-09-code-editor r10, E8; frame 24j). Real git
repositories and a plain folder, written here: tracked and untracked files match, ignored and binary
files do not; a fixed string is not a pattern; case folds unless asked; a plain folder is searched
with --no-index; a pattern git refuses raises; the line cap marks the result truncated.
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
    (root / "src").mkdir(parents=True)
    git(root, "init", "-q", "-b", "main")
    git(root, "config", "user.email", "t@example.invalid")
    git(root, "config", "user.name", "t")
    (root / ".gitignore").write_text("build/\n")
    (root / "src" / "cart.ts").write_text("const total = 0;\nfunction addItem() {}\n// Total so far\n")
    (root / "README.md").write_text("cart total\n")
    git(root, "add", "-A")
    git(root, "commit", "-q", "-m", "base")
    (root / "src" / "new.ts").write_text("let total = 1;\n")  # untracked
    (root / "build").mkdir()
    (root / "build" / "out.js").write_text("total\n")  # ignored
    (root / "blob.bin").write_bytes(b"total\x00\x01\x02")  # binary
    return root


def found(out: dict[str, object]) -> list[tuple[str, int, str]]:
    return [(f["path"], ln["line"], ln["text"]) for f in out["files"] for ln in f["lines"]]  # type: ignore[index, union-attr]


def test_tracked_and_untracked_files_match_and_ignored_and_binary_do_not(ws: Path) -> None:
    out = server._workspace_search(ws, "total", regex=False, case=True)
    assert found(out) == [
        ("README.md", 1, "cart total"),
        ("src/cart.ts", 1, "const total = 0;"),
        ("src/new.ts", 1, "let total = 1;"),
    ]
    assert out["lines"] == 3 and out["truncated"] is False


def test_case_folds_unless_asked(ws: Path) -> None:
    lines = found(server._workspace_search(ws, "total", regex=False, case=False))
    assert ("src/cart.ts", 3, "// Total so far") in lines and len(lines) == 4


def test_a_fixed_string_is_not_a_pattern(ws: Path) -> None:
    assert found(server._workspace_search(ws, "addItem()", regex=False, case=True)) == [("src/cart.ts", 2, "function addItem() {}")]
    assert found(server._workspace_search(ws, "add.tem\\(", regex=True, case=True)) == [("src/cart.ts", 2, "function addItem() {}")]
    assert found(server._workspace_search(ws, "add.tem", regex=False, case=True)) == []


def test_a_subfolder_workspace_searches_its_own_paths(ws: Path) -> None:
    assert [p for p, _, _ in found(server._workspace_search(ws / "src", "total", regex=False, case=True))] == ["cart.ts", "new.ts"]


def test_a_plain_folder_is_searched_without_git(tmp_path: Path) -> None:
    (tmp_path / "plain").mkdir()
    (tmp_path / "plain" / "a.txt").write_text("one\ntwo total\n")
    assert found(server._workspace_search(tmp_path / "plain", "total", regex=False, case=True)) == [("a.txt", 2, "two total")]


def test_nothing_matches_and_an_empty_query_reads_nothing(ws: Path) -> None:
    assert server._workspace_search(ws, "zebra", regex=False, case=True) == {"files": [], "lines": 0, "matches": 0, "truncated": False, "buffers": 0, "unreadable": 0}
    assert server._workspace_search(ws, "", regex=False, case=True) == {"files": [], "lines": 0, "matches": 0, "truncated": False, "buffers": 0, "unreadable": 0}


def test_a_pattern_git_refuses_raises(ws: Path) -> None:
    with pytest.raises(server.SearchQueryError):
        server._workspace_search(ws, "(", regex=True, case=True)


def test_the_line_cap_truncates(ws: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(server, "WORKSPACE_SEARCH_MAX_LINES", 2)
    out = server._workspace_search(ws, "total", regex=False, case=True)
    assert out["lines"] == 2 and out["truncated"] is True


def test_a_query_that_looks_like_an_option_is_a_query(ws: Path) -> None:
    (ws / "flags.txt").write_text("run -n twice\n")
    assert found(server._workspace_search(ws, "-n", regex=False, case=True)) == [("flags.txt", 1, "run -n twice")]
