# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""A text file in any encoding opens as text (UI sprint 462; roadmap r13 E14). The file API decodes by the
attachments' rule (`_decode_any`, sprint 446) and names the encoding; anything but plain UTF-8 is read-only, since
the write refuses it; a file with a NUL byte stays binary with no text. FILE_READ names the encoding. The files
are written here by hand."""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

import server
from _serving import call, serving

TRACE = Path(os.environ["SUBSTRATE_TRACE_DIR"]) / "server.jsonl"


@pytest.fixture
def ws(tmp_path: Path) -> Path:
    root = tmp_path / "ws"
    root.mkdir()
    (root / "plain.txt").write_bytes("café crème\n".encode())
    (root / "bom.txt").write_bytes(b"\xef\xbb\xbf" + "café crème\n".encode())
    (root / "wide.txt").write_bytes("café crème\r\n".encode("utf-16"))
    (root / "latin.txt").write_bytes("café crème\n".encode("latin-1"))
    (root / "img.bin").write_bytes(b"\x89PNG\x00\xff")
    return root


@pytest.mark.parametrize(
    ("name", "encoding", "read_only", "text", "ends"),
    [
        ("plain.txt", "utf-8", False, "café crème\n", "lf"),
        ("bom.txt", "utf-8-bom", False, "café crème\n", "lf"),
        ("wide.txt", "utf-16", False, "café crème\r\n", "crlf"),
        ("latin.txt", "latin-1", False, "café crème\n", "lf"),
        ("img.bin", "binary", True, None, None),
    ],
)
def test_each_encoding_reads_as_its_text_and_is_named(
    ws: Path, name: str, encoding: str, read_only: bool, text: str | None, ends: str | None
) -> None:
    got = server._workspace_read(ws, name)
    assert (got["encoding"], got["read_only"], got["text"]) == (encoding, read_only, text)
    if ends is not None:
        assert str(got["line_endings"]).lower() == ends


def test_file_read_names_the_encoding_and_the_write_still_refuses_latin_1(
    app: server.App, tmp_path: Path, ws: Path
) -> None:
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        status, body = call(
            "POST", base + "/api/session", {"driver": "deterministic", "workspace": str(ws)}
        )
        assert status == 200, body
        sid = body["session_id"]
        mark = len(TRACE.read_text().splitlines()) if TRACE.exists() else 0
        for name in ("latin.txt", "wide.txt", "bom.txt", "plain.txt", "img.bin"):
            status, file = call("GET", base + f"/api/session/{sid}/file?path={name}")
            assert status == 200, file
        status, refused = call(
            "PUT",
            base + f"/api/session/{sid}/file?path=latin.txt",
            {"text": "x\n", "view": "editor"},
        )
        assert status == 409, refused
    reads = [
        json.loads(x)["payload"]["encoding"]
        for x in TRACE.read_text().splitlines()[mark:]
        if json.loads(x)["name"] == "FILE_READ"
    ]
    assert reads == ["latin1", "utf16", "utf8_bom", "utf8", "binary"]
    assert (ws / "latin.txt").read_bytes() == "café crème\n".encode("latin-1")
