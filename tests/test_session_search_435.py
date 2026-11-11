# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""The workspace search without git (UI sprint 435; research RESEARCH-2026-11-10-editor-search-r2). Plain
folders written here: the server's own walk applies .gitignore and .ignore with no repository, skips VS
Code's names and folders, searches hidden files, skips binary and oversized files; Python's re takes \\d, \\b,
\\s and lookaround; whole word; include and exclude globs; ranges in UTF-16 units; the replace works out new
texts line by line ($1, ^ per line), for all, one file or one match, and writes nothing.
"""

from __future__ import annotations

import subprocess
from pathlib import Path

import pytest

import server


@pytest.fixture
def ws(tmp_path: Path) -> Path:
    root = tmp_path / "ws"
    for d in ("src/lib", "build", "node_modules/pkg", ".git", "logs", "docs"):
        (root / d).mkdir(parents=True)
    (root / ".gitignore").write_text("build/\n*.log\n!keep.log\n/docs/draft.md\n")
    (root / "src" / ".ignore").write_text("generated.ts\n")
    (root / "src/lib/cart.ts").write_text("const total = 12;\nlet subtotal = 3;\n  total += tax;\n")
    (root / "src/generated.ts").write_text("total\n")
    (root / "src/lib/generated.ts").write_text(
        "total\n"
    )  # .ignore's pattern has no slash: any depth below src
    (root / "build/out.js").write_text("total\n")
    (root / "node_modules/pkg/index.js").write_text("total\n")
    (root / ".git/config").write_text("total\n")
    (root / "logs/run.log").write_text("total\n")
    (root / "logs/keep.log").write_text("total\n")
    (root / "docs/draft.md").write_text("total\n")
    (root / "docs/guide.md").write_text("Total cost\n")
    (root / ".env").write_text("TOTAL=1\n")  # hidden: searched
    (root / "blob.bin").write_bytes(b"total\x00")
    (root / "big.txt").write_text("total\n" + "x" * server.WORKSPACE_READ_MAX)
    return root


def rows(out: dict[str, object]) -> list[str]:
    return [f"{f['path']}:{ln['line']}" for f in out["files"] for ln in f["lines"]]  # type: ignore[index, union-attr]


def test_the_walk_needs_no_git_and_applies_ignore_files(
    ws: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    def no_git(*a: object, **k: object) -> None:
        raise AssertionError(f"git was run: {a}")

    monkeypatch.setattr(subprocess, "run", no_git)
    files, cut = server._workspace_files(ws)
    assert files == [
        ".env",
        ".gitignore",
        "big.txt",
        "blob.bin",
        "docs/guide.md",
        "logs/keep.log",
        "src/.ignore",
        "src/lib/cart.ts",
    ]
    assert cut is False
    out = server._workspace_search(ws, "total", regex=False, case=False)
    assert rows(out) == [
        ".env:1",
        "docs/guide.md:1",
        "logs/keep.log:1",
        "src/lib/cart.ts:1",
        "src/lib/cart.ts:2",
        "src/lib/cart.ts:3",
    ]


def test_the_regex_editors_write(ws: Path) -> None:
    assert rows(server._workspace_search(ws, r"\btotal\s=\s\d+", regex=True, case=True)) == [
        "src/lib/cart.ts:1"
    ]
    assert rows(server._workspace_search(ws, r"total\s=\s\d+", regex=True, case=True)) == [
        "src/lib/cart.ts:1",
        "src/lib/cart.ts:2",
    ]
    assert rows(server._workspace_search(ws, r"\btotal\b", regex=True, case=True)) == [
        "logs/keep.log:1",
        "src/lib/cart.ts:1",
        "src/lib/cart.ts:3",
    ]
    assert rows(server._workspace_search(ws, r"(?<=const )total", regex=True, case=True)) == [
        "src/lib/cart.ts:1"
    ]
    with pytest.raises(server.SearchQueryError):
        server._workspace_search(ws, "(", regex=True, case=True)


def test_whole_word_and_the_ranges(ws: Path) -> None:
    out = server._workspace_search(ws, "total", regex=False, case=True, word=True)
    assert rows(out) == ["logs/keep.log:1", "src/lib/cart.ts:1", "src/lib/cart.ts:3"]
    cart = next(f for f in out["files"] if f["path"] == "src/lib/cart.ts")  # type: ignore[union-attr, index]
    assert [ln["ranges"] for ln in cart["lines"]] == [[[6, 11]], [[2, 7]]]  # type: ignore[index]
    assert out["matches"] == 3


def test_ranges_count_utf16_units(tmp_path: Path) -> None:
    (tmp_path / "e.txt").write_text("😀 total\n")
    out = server._workspace_search(tmp_path, "total", regex=False, case=True)
    assert out["files"][0]["lines"][0]["ranges"] == [[3, 8]]  # type: ignore[index]


def test_include_and_exclude_globs(ws: Path) -> None:
    assert rows(server._workspace_search(ws, "total", regex=False, case=False, include="src")) == [
        "src/lib/cart.ts:1",
        "src/lib/cart.ts:2",
        "src/lib/cart.ts:3",
    ]
    assert rows(
        server._workspace_search(ws, "total", regex=False, case=False, include="*.md, .env")
    ) == [".env:1", "docs/guide.md:1"]
    assert rows(
        server._workspace_search(ws, "total", regex=False, case=False, exclude="src/**, logs")
    ) == [".env:1", "docs/guide.md:1"]
    assert rows(
        server._workspace_search(ws, "total", regex=False, case=False, include="./docs")
    ) == ["docs/guide.md:1"]


def test_replace_works_out_new_texts_and_writes_nothing(ws: Path) -> None:
    before = (ws / "src/lib/cart.ts").read_text()
    out = server._workspace_replace(ws, r"(\w+) = (\d+)", "$2 = $1", regex=True, case=True)
    assert [(f["path"], f["replaced"]) for f in out["files"]] == [("src/lib/cart.ts", 2)]  # type: ignore[index]
    cart = next(f for f in out["files"] if f["path"] == "src/lib/cart.ts")  # type: ignore[union-attr, index]
    assert cart["text"] == "const 12 = total;\nlet 3 = subtotal;\n  total += tax;\n"
    assert (ws / "src/lib/cart.ts").read_text() == before
    assert len(str(cart["sha256"])) == 64


def test_caret_is_each_lines_start(tmp_path: Path) -> None:
    (tmp_path / "a.py").write_text("import a\nimport b\r\nimport c")
    out = server._workspace_replace(tmp_path, "^import", "from", regex=True, case=True)
    assert out["files"][0]["text"] == "from a\nfrom b\r\nfrom c"  # type: ignore[index]
    assert out["replaced"] == 3


def test_replace_in_one_file_and_one_match(ws: Path) -> None:
    one_file = server._workspace_replace(
        ws, "total", "sum", regex=False, case=True, path="src/lib/cart.ts"
    )
    assert [f["path"] for f in one_file["files"]] == ["src/lib/cart.ts"]  # type: ignore[index]
    assert one_file["replaced"] == 3
    one = server._workspace_replace(
        ws,
        "total",
        "sum",
        regex=False,
        case=True,
        word=True,
        path="src/lib/cart.ts",
        line=3,
        index=0,
    )
    assert one["files"][0]["text"] == "const total = 12;\nlet subtotal = 3;\n  sum += tax;\n"  # type: ignore[index]
    with pytest.raises(server.WorkspaceEscapeError):
        server._workspace_replace(ws, "total", "sum", regex=False, case=True, path="../outside.txt")


def test_a_fixed_replacement_is_taken_as_written(tmp_path: Path) -> None:
    (tmp_path / "a.txt").write_text("a.b\n")
    out = server._workspace_replace(tmp_path, "a.b", "$& \\n", regex=False, case=True)
    assert out["files"][0]["text"] == "$& \\n\n"  # type: ignore[index]


def test_gitignore_globs() -> None:
    g = server._Glob("**/gen/*.ts", "")
    assert (
        g.matches("gen/a.ts", False)
        and g.matches("x/y/gen/a.ts", False)
        and not g.matches("gen/sub/a.ts", False)
    )
    d = server._Glob("out/", "pkg")
    assert (
        d.matches("pkg/out", True)
        and d.matches("pkg/x/out", True)
        and not d.matches("pkg/out", False)
        and not d.matches("out", True)
    )
    assert server._Glob("[!a]bc", "").matches("xbc", False) and not server._Glob(
        "[!a]bc", ""
    ).matches("abc", False)
