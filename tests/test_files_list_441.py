# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Quick open's file list (UI sprint 441): the search's walk, in or out of a git repository, ignore files
applied, and its route in the files area."""

from __future__ import annotations

import subprocess
from pathlib import Path

import pytest

import server


def test_the_list_is_the_walk_without_git(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    for d in ("src", "build", "node_modules/x"):
        (tmp_path / d).mkdir(parents=True)
    (tmp_path / ".gitignore").write_text("build/\n")
    for f in ("src/cart.ts", "build/cart.js", "node_modules/x/i.js", "README.md"):
        (tmp_path / f).write_text("x\n")

    def no_git(*a: object, **k: object) -> None:
        raise AssertionError("git was run")

    monkeypatch.setattr(subprocess, "run", no_git)
    assert server._workspace_files(tmp_path) == ([".gitignore", "README.md", "src/cart.ts"], False)


def test_the_route_is_in_the_files_area() -> None:
    assert server._api_area("/api/session/s_1/files/list") == server.ApiRefusedArea.FILES
