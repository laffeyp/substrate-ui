# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""The tree's find by name (UI sprint 437; VS Code's ExplorerFindProvider): files and folders whose name
matches, from the search's walk (ignored files are not found), case ignored, fuzzy or continuous, files capped.
"""

from __future__ import annotations

from pathlib import Path

import pytest

import server


@pytest.fixture
def ws(tmp_path: Path) -> Path:
    for d in ("src/cart", "src/lib", "build"):
        (tmp_path / d).mkdir(parents=True)
    (tmp_path / ".gitignore").write_text("build/\n")
    for f in (
        "src/cart/Cart.ts",
        "src/cart/index.ts",
        "src/lib/checkout.ts",
        "src/lib/tax.ts",
        "build/cart.js",
        "README.md",
    ):
        (tmp_path / f).write_text("x\n")
    return tmp_path


def test_continuous_names_files_and_folders(ws: Path) -> None:
    out = server._workspace_find_names(ws, "cart", fuzzy=False)
    assert out == {
        "files": ["src/cart/Cart.ts"],
        "folders": ["src/cart"],
        "truncated": False,
        "unreadable": 0,
    }


def test_fuzzy_names(ws: Path) -> None:
    assert server._workspace_find_names(ws, "ckt", fuzzy=True)["files"] == ["src/lib/checkout.ts"]
    assert server._workspace_find_names(ws, "ckt", fuzzy=False)["files"] == []


def test_the_cap_marks_the_result_cut(ws: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(server, "WORKSPACE_FIND_MAX_FILES", 1)
    out = server._workspace_find_names(ws, "t", fuzzy=False)
    assert len(out["files"]) == 1 and out["truncated"] is True  # type: ignore[arg-type]


def test_an_empty_name_finds_nothing(ws: Path) -> None:
    assert server._workspace_find_names(ws, "", fuzzy=True) == {
        "files": [],
        "folders": [],
        "truncated": False,
        "unreadable": 0,
    }


def test_an_unreadable_folder_is_counted(ws: Path) -> None:
    locked = ws / "src" / "locked"
    locked.mkdir()
    (locked / "cart.ts").write_text("x\n")
    locked.chmod(0)
    try:
        out = server._workspace_find_names(ws, "cart", fuzzy=False)
        assert out["unreadable"] == 1 and out["files"] == ["src/cart/Cart.ts"]
    finally:
        locked.chmod(0o755)
