# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Every file edits as text and saves as it is (UI sprint 465; roadmap r13 E14; the Architect, 2026-11-11: every file
editable by hand, by default). A save names its encoding and the server writes the text in it: a Latin-1 file stays
Latin-1, UTF-16 keeps its mark and byte order, UTF-8 keeps its mark, and a file that is not text, read as Latin-1 (every
byte one character), saves byte for byte. FILE_WRITTEN names the encoding. The files are written here by hand."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

import pytest

import server
from _serving import call, serving

TRACE = Path(os.environ["SUBSTRATE_TRACE_DIR"]) / "server.jsonl"
BLOB = bytes(range(256))


@pytest.fixture
def ws(tmp_path: Path) -> Path:
    root = tmp_path / "ws"
    root.mkdir()
    (root / "latin.txt").write_bytes("café\n".encode("latin-1"))
    (root / "le.txt").write_bytes(b"\xff\xfe" + "café\n".encode("utf-16-le"))
    (root / "be.txt").write_bytes(b"\xfe\xff" + "café\n".encode("utf-16-be"))
    (root / "bom.txt").write_bytes(b"\xef\xbb\xbf" + "café\n".encode())
    (root / "blob.bin").write_bytes(BLOB)
    return root


def _put(base: str, sid: str, path: str, body: dict[str, Any]) -> tuple[int, Any]:
    return call("PUT", base + f"/api/session/{sid}/file?path={path}", body)


def test_each_file_saves_in_its_own_encoding_and_a_binary_file_byte_for_byte(
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
        assert _put(base, sid, "latin.txt", {"text": "cañe\n", "encoding": "latin-1"})[0] == 200
        assert _put(base, sid, "le.txt", {"text": "caféZ\n", "encoding": "utf-16"})[0] == 200
        assert _put(base, sid, "be.txt", {"text": "caféZ\n", "encoding": "utf-16"})[0] == 200
        assert _put(base, sid, "bom.txt", {"text": "caféZ\n", "encoding": "utf-8-bom"})[0] == 200
        status, read = call("GET", base + f"/api/session/{sid}/file?path=blob.bin&as=latin-1")
        assert status == 200, read
        assert (read["encoding"], read["read_only"], read["text"]) == (
            "binary",
            False,
            BLOB.decode("latin-1"),
        )
        unchanged = {"text": read["text"], "encoding": "latin-1", "base_sha256": read["sha256"]}
        status, same = _put(base, sid, "blob.bin", unchanged)
        assert status == 200, same
        assert hashlib.sha256((ws / "blob.bin").read_bytes()).hexdigest() == read["sha256"]
        edited = read["text"].replace("A", "B")
        status, _ = _put(base, sid, "blob.bin", {"text": edited, "encoding": "latin-1"})
        assert status == 200
        status, refused = _put(base, sid, "latin.txt", {"text": "日本\n", "encoding": "latin-1"})
        assert status == 400, refused
    assert (ws / "latin.txt").read_bytes() == "cañe\n".encode("latin-1")
    assert (ws / "le.txt").read_bytes() == b"\xff\xfe" + "caféZ\n".encode("utf-16-le")
    assert (ws / "be.txt").read_bytes() == b"\xfe\xff" + "caféZ\n".encode("utf-16-be")
    assert (ws / "bom.txt").read_bytes() == b"\xef\xbb\xbf" + "caféZ\n".encode()
    want = bytearray(BLOB)
    want[0x41] = 0x42
    assert (ws / "blob.bin").read_bytes() == bytes(want)
    written = [
        json.loads(x)["payload"]["encoding"]
        for x in TRACE.read_text().splitlines()[mark:]
        if json.loads(x)["name"] == "FILE_WRITTEN"
    ]
    assert written == ["latin1", "utf16", "utf16", "utf8_bom", "bytes", "bytes"]
