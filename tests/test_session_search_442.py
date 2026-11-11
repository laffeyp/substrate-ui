# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""The one search bar (UI sprint 442; SEARCH-BAR-2026-11-10): the server's search matches file names, folder names
and paths by the bar's one rule as well as the text inside files; names in the name rank first, then shorter paths;
a binary file is found by name; an unreadable folder is counted."""

from __future__ import annotations

from pathlib import Path

import pytest

import server


@pytest.fixture
def ws(tmp_path: Path) -> Path:
    for d in ("src/lib", "src/ui", "assets", "build"):
        (tmp_path / d).mkdir(parents=True)
    (tmp_path / ".gitignore").write_text("build/\n")
    (tmp_path / "src/lib/cart.ts").write_text("export const total = 1;\n")
    (tmp_path / "src/ui/CartDrawer.tsx").write_text("drawer\n")
    (tmp_path / "assets/hero.jpeg").write_bytes(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00")
    (tmp_path / "build/cart.js").write_text("cart\n")
    return tmp_path


def names(out: dict[str, object]) -> list[tuple[str, str]]:
    return [(n["path"], n["kind"]) for n in out["names"]]  # type: ignore[index, union-attr]


def test_file_names_with_their_extensions(ws: Path) -> None:
    assert names(server._workspace_search(ws, "jpeg", regex=False, case=False)) == [("assets/hero.jpeg", "file")]


def test_folder_names_and_paths(ws: Path) -> None:
    assert names(server._workspace_search(ws, "lib", regex=False, case=False)) == [("src/lib", "dir"), ("src/lib/cart.ts", "file")]
    out = server._workspace_search(ws, "lib/cart", regex=False, case=False)
    assert names(out) == [("src/lib/cart.ts", "file")]
    assert out["names"][0]["ranges"] == [[4, 12]]  # type: ignore[index]


def test_names_in_the_name_first_then_shorter(ws: Path) -> None:
    assert names(server._workspace_search(ws, "cart", regex=False, case=False)) == [("src/lib/cart.ts", "file"), ("src/ui/CartDrawer.tsx", "file")]
    assert names(server._workspace_search(ws, "src", regex=False, case=False))[0] == ("src", "dir")


def test_the_one_rule_applies_to_names(ws: Path) -> None:
    assert names(server._workspace_search(ws, "cart", regex=False, case=True)) == [("src/lib/cart.ts", "file")]
    assert names(server._workspace_search(ws, r"\.tsx?$", regex=True, case=False)) == [("src/lib/cart.ts", "file"), ("src/ui/CartDrawer.tsx", "file")]
    assert names(server._workspace_search(ws, "Cart", regex=False, case=False, word=True)) == [("src/lib/cart.ts", "file")]


def test_names_and_text_together(ws: Path) -> None:
    out = server._workspace_search(ws, "total", regex=False, case=False)
    assert names(out) == [] and [f["path"] for f in out["files"]] == ["src/lib/cart.ts"]  # type: ignore[union-attr, index]


def test_an_unreadable_folder_is_counted(ws: Path) -> None:
    locked = ws / "src" / "locked"
    locked.mkdir()
    (locked / "cart.ts").write_text("x\n")
    locked.chmod(0)
    try:
        out = server._workspace_search(ws, "cart", regex=False, case=False)
        assert out["unreadable"] == 1 and ("src/locked/cart.ts", "file") not in names(out)
    finally:
        locked.chmod(0o755)
