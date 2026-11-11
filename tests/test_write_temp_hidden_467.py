# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""The server's own write files stay out of the workspace's listings (UI sprint 467; roadmap r13 E14). A write puts its
bytes in a temp file beside the target, appends FileWritten, then renames; the window re-lists inside that span. The
tree's listing, the watch's snapshot and the search walk (quick open's list) skip a name with the write's prefix and
list every other name, dot-files included. The files are written here by hand."""

from __future__ import annotations

from pathlib import Path

import server

TEMP = server.WRITE_TEMP_PREFIX + "x1"


def test_the_listings_skip_a_write_temp_file(tmp_path: Path) -> None:
    root = tmp_path / "ws"
    (root / "sub").mkdir(parents=True)
    for folder in (root, root / "sub"):
        (folder / TEMP).write_bytes(b"in flight")
        (folder / ".keep").write_text("kept\n")
    names = [e["name"] for e in server._workspace_list(root, "")["entries"]]  # type: ignore[index]
    assert names == ["sub", ".keep"]
    sub = [e["name"] for e in server._workspace_list(root, "sub")["entries"]]  # type: ignore[index]
    assert sub == [".keep"]
    snapshot, cut = server._workspace_snapshot(root)
    assert (sorted(snapshot), cut) == ([".keep", "sub/.keep"], False)
    files, cut = server._workspace_files(root)
    assert (files, cut) == ([".keep", "sub/.keep"], False)


def test_the_write_names_its_temp_file_with_the_prefix() -> None:
    assert server.WRITE_TEMP_PREFIX == ".substrate-write-"
    assert "prefix=WRITE_TEMP_PREFIX" in Path(server.__file__).read_text()
