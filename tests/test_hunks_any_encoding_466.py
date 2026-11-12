# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""A file not in plain UTF-8 compares with its base in the text the editor shows (UI sprint 466; roadmap r13 E14).
git diffs bytes: a NUL byte or UTF-16 gives "Binary files differ" and no hunk, and a Latin-1 diff does not decode as
UTF-8. Each side is decoded by the file API's rule (a file that is not text every byte one character, Latin-1) and git
compares the texts, so the ranges are git's own. Real git repositories; the files are written here by hand."""

from __future__ import annotations

import subprocess
from pathlib import Path

import pytest

import server

BLOB = bytes(range(256))


def git(root: Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-C", str(root), *args], capture_output=True, text=True, check=True
    ).stdout


@pytest.fixture
def ws(tmp_path: Path) -> Path:
    root = tmp_path / "ws"
    root.mkdir()
    git(root, "init", "-q", "-b", "main")
    git(root, "config", "user.email", "t@example.invalid")
    git(root, "config", "user.name", "t")
    (root / "latin.txt").write_bytes("café\r\ncrème\r\n".encode("latin-1"))
    (root / "wide.txt").write_bytes(b"\xff\xfe" + "café\ncrème\n".encode("utf-16-le"))
    (root / "bom.txt").write_bytes(b"\xef\xbb\xbf" + "café\ncrème\n".encode())
    (root / "blob.bin").write_bytes(BLOB)
    (root / ".gitignore").write_text("skip.txt\n")
    git(root, "add", "-A")
    git(root, "commit", "-q", "-m", "base")
    return root


def _hunks(ws: Path, rel: str) -> list[tuple[int, int, int, int, list[str]]]:
    out = server._workspace_hunks(ws, rel)
    assert out["base"] == "head"  # sprint 483: the branch's own last commit
    return [
        (h["old_start"], h["old_count"], h["new_start"], h["new_count"], h["lines"])
        for h in out["hunks"]
    ]


def test_each_encoding_has_one_hunk_in_its_decoded_text(ws: Path) -> None:
    (ws / "latin.txt").write_bytes("cañe\r\ncrème\r\n".encode("latin-1"))
    (ws / "wide.txt").write_bytes(b"\xff\xfe" + "café\ncrèmeZ\n".encode("utf-16-le"))
    (ws / "bom.txt").write_bytes(b"\xef\xbb\xbf" + "caféZ\ncrème\n".encode())
    # Lines as the editor shows them: a text file's line ends as \n, so no \r in a line.
    assert _hunks(ws, "latin.txt") == [(1, 1, 1, 1, ["-café", "+cañe"])]
    assert _hunks(ws, "wide.txt") == [(2, 1, 2, 1, ["-crème", "+crèmeZ"])]
    assert _hunks(ws, "bom.txt") == [(1, 1, 1, 1, ["-café", "+caféZ"])]


def test_a_file_that_is_not_text_compares_byte_for_character(ws: Path) -> None:
    assert _hunks(ws, "blob.bin") == []
    edited = bytearray(BLOB)
    edited[0x41] = 0x42
    (ws / "blob.bin").write_bytes(bytes(edited))
    # Line 2 is bytes 11 to 255 (the one \n is byte 10); its \r byte (13) stays in the line, as in the editor.
    old, new = BLOB[11:].decode("latin-1"), bytes(edited[11:]).decode("latin-1")
    assert "\r" in old
    assert _hunks(ws, "blob.bin") == [(2, 1, 2, 1, ["-" + old, "+" + new])]


def test_new_and_ignored_files(ws: Path) -> None:
    (ws / "fresh.txt").write_bytes("olé\n".encode("latin-1"))
    (ws / "skip.txt").write_bytes("olé\n".encode("latin-1"))
    assert _hunks(ws, "fresh.txt") == [(0, 0, 1, 1, ["+olé"])]
    assert _hunks(ws, "skip.txt") == []


def test_a_plain_utf8_file_is_diffed_as_before(ws: Path) -> None:
    (ws / "plain.txt").write_text("a\nb\n")
    git(ws, "add", "plain.txt")
    git(ws, "commit", "-q", "-m", "plain")
    (ws / "plain.txt").write_text("a\nB\n")
    assert server._decoded_hunks(ws, "main", "plain.txt", ws / "plain.txt") is None
    assert _hunks(ws, "plain.txt") == [(2, 1, 2, 1, ["-b", "+B"])]
