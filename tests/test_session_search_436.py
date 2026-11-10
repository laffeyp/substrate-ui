# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""The search reads the editor's unsaved buffers (UI sprint 436; research RESEARCH-2026-11-10-editor-search-r2,
VS Code's getOpenEditorResults). A plain folder written here: a buffer's text is searched in place of the file
on disk, and the disk's matches for that file are dropped; a buffer outside the walk is not searched; a replace
works from the buffer, returns the text before it, the disk's hash and buffer true.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

import server


def rows(out: dict[str, object]) -> list[str]:
    return [f"{f['path']}:{ln['line']}" for f in out["files"] for ln in f["lines"]]  # type: ignore[index, union-attr]


def test_a_buffer_is_searched_in_place_of_the_disk(tmp_path: Path) -> None:
    (tmp_path / "a.ts").write_text("total\n")
    (tmp_path / "b.ts").write_text("nothing\n")
    out = server._workspace_search(tmp_path, "total", regex=False, case=True, buffers={"a.ts": "x\nx\n", "b.ts": "one\ntotal here\n"})
    assert rows(out) == ["b.ts:2"]
    assert out["buffers"] == 2


def test_a_buffer_outside_the_walk_is_not_searched(tmp_path: Path) -> None:
    (tmp_path / "a.ts").write_text("total\n")
    (tmp_path / ".gitignore").write_text("gen.ts\n")
    (tmp_path / "gen.ts").write_text("x\n")
    out = server._workspace_search(tmp_path, "total", regex=False, case=True, buffers={"gen.ts": "total\n"})
    assert rows(out) == ["a.ts:1"] and out["buffers"] == 0


def test_a_replace_works_from_the_buffer(tmp_path: Path) -> None:
    (tmp_path / "a.ts").write_text("total\n")
    (tmp_path / "b.ts").write_text("total\n")
    out = server._workspace_replace(tmp_path, "total", "sum", regex=False, case=True, buffers={"a.ts": "total total\n"})
    by = {f["path"]: f for f in out["files"]}  # type: ignore[union-attr, index]
    assert by["a.ts"]["text"] == "sum sum\n" and by["a.ts"]["before"] == "total total\n" and by["a.ts"]["buffer"] is True
    assert by["a.ts"]["sha256"] == hashlib.sha256(b"total\n").hexdigest()
    assert by["b.ts"]["before"] == "total\n" and by["b.ts"]["buffer"] is False
    assert out["replaced"] == 3


def test_a_bodys_buffers_are_strings_by_path() -> None:
    assert server._buffers({"buffers": {"a.ts": "x", "b.ts": 3}}) == {"a.ts": "x"}
    assert server._buffers({"buffers": "no"}) == {} and server._buffers({}) == {}
