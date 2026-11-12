# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""The workspace file API, read side (UI sprint 348; editor shared work 0(c)).

Every path is held to the session's workspace: an absolute path, a `..` that climbs out, and a
symlink that points out are refused. A directory lists directories first, then files, each by name;
a symlink is listed as `link` and not followed. A file reads as UTF-8 text with its line endings, or
as binary with no text; at any size (sprint 471).
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

import server
from _serving import call, serving


@pytest.fixture
def ws(tmp_path: Path) -> Path:
    root = tmp_path / "ws"
    (root / "src").mkdir(parents=True)
    (root / "src" / "a.py").write_text("x = 1\ny = 2\n")
    (root / "notes.md").write_bytes(b"one\r\ntwo\r\n")
    (root / "img.bin").write_bytes(b"\x89PNG\x00\xff")
    (root / "Zeta").mkdir()
    outside = tmp_path / "secret.txt"
    outside.write_text("no")
    os.symlink(outside, root / "out-link")
    return root


def test_listing_orders_directories_first_and_does_not_follow_links(ws: Path) -> None:
    out = server._workspace_list(ws, "")
    assert out["dir"] == ""
    assert [(e["name"], e["kind"]) for e in out["entries"]] == [
        ("src", "dir"),
        ("Zeta", "dir"),
        ("img.bin", "file"),
        ("notes.md", "file"),
        ("out-link", "link"),
    ]
    assert [e["name"] for e in server._workspace_list(ws, "src")["entries"]] == ["a.py"]


def test_reading_text_binary_and_over_the_cap(ws: Path) -> None:
    text = server._workspace_read(ws, "src/a.py")
    assert (text["encoding"], text["line_endings"], text["text"], text["size"]) == (
        "utf-8",
        "lf",
        "x = 1\ny = 2\n",
        12,
    )
    assert server._workspace_read(ws, "notes.md")["line_endings"] == "crlf"
    binary = server._workspace_read(ws, "img.bin")
    assert (binary["encoding"], binary["text"]) == ("binary", None)
    # Sprint 471: no size limit; the facts carry no `too_large`.
    assert "too_large" not in text


@pytest.mark.parametrize(
    "rel", ["/etc/passwd", "../secret.txt", "src/../../secret.txt", "out-link"]
)
def test_paths_outside_the_workspace_are_refused(ws: Path, rel: str) -> None:
    with pytest.raises(server.WorkspaceEscapeError):
        server._workspace_read(ws, rel)


def test_the_routes_serve_a_sessions_workspace(app: server.App, tmp_path: Path, ws: Path) -> None:
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        status, body = call(
            "POST", base + "/api/session", {"driver": "deterministic", "workspace": str(ws)}
        )
        assert status == 200, body
        sid = body["session_id"]
        status, listing = call("GET", base + f"/api/session/{sid}/files?dir=src")
        assert status == 200, listing
        assert [e["name"] for e in listing["entries"]] == ["a.py"]
        status, file = call("GET", base + f"/api/session/{sid}/file?path=src/a.py")
        assert (status, file["text"]) == (200, "x = 1\ny = 2\n")
        status, refused = call("GET", base + f"/api/session/{sid}/file?path=../secret.txt")
        assert status == 400, refused
        status, missing = call("GET", base + f"/api/session/{sid}/file?path=nope.txt")
        assert status == 404, missing
        status, unknown = call("GET", base + "/api/session/s_nope/files")
        assert status == 404, unknown
