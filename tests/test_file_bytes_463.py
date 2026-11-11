# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Every file that is not text opens as its bytes, at any size (UI sprint 463; roadmap r13 E14). The bytes route
sends a slice of any file, up to 256 KB, as base64 with the file's size; a file over the read limit that is not
text is still named binary, so the editor opens it in the bytes view. FILE_BYTES_READ names each read. The files
are written here by hand."""

from __future__ import annotations

import base64
import json
import os
from pathlib import Path

import pytest

import server
from _serving import call, serving

TRACE = Path(os.environ["SUBSTRATE_TRACE_DIR"]) / "server.jsonl"
BIG = 3 * 1024 * 1024


@pytest.fixture
def ws(tmp_path: Path) -> Path:
    root = tmp_path / "ws"
    root.mkdir()
    (root / "pic.jpg").write_bytes(b"\xff\xd8\xff\xe0" + bytes(range(256)) * 4)
    # Each 16-byte row holds its own offset, so any slice can be checked.
    (root / "big.bin").write_bytes(b"".join(n.to_bytes(16, "big") for n in range(0, BIG, 16)))
    (root / "big.txt").write_bytes(b"a line of text\n" * (BIG // 15 + 1))
    return root


def test_a_large_file_that_is_not_text_is_named_binary_and_a_large_text_file_is_not(
    ws: Path,
) -> None:
    big = server._workspace_read(ws, "big.bin")
    assert (big["too_large"], big["encoding"], big["read_only"], big["text"]) == (
        True,
        "binary",
        True,
        None,
    )
    txt = server._workspace_read(ws, "big.txt")
    assert (txt["too_large"], txt["encoding"], txt["text"]) == (True, None, None)


def test_the_route_sends_slices_of_any_size_and_names_each_read(
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
        status, head = call(
            "GET", base + f"/api/session/{sid}/bytes?path=pic.jpg&offset=0&length=8"
        )
        assert status == 200, head
        assert (head["size"], head["offset"], head["length"]) == (4 + 1024, 0, 8)
        assert base64.b64decode(head["data"]) == b"\xff\xd8\xff\xe0\x00\x01\x02\x03"
        last = BIG - 16
        status, end = call(
            "GET", base + f"/api/session/{sid}/bytes?path=big.bin&offset={last}&length=64"
        )
        assert status == 200, end
        assert (end["size"], end["length"]) == (BIG, 16)
        assert base64.b64decode(end["data"]) == last.to_bytes(16, "big")
        status, capped = call(
            "GET", base + f"/api/session/{sid}/bytes?path=big.bin&offset=0&length=9999999"
        )
        assert (status, capped["length"]) == (200, 256 * 1024)
        status, past = call(
            "GET", base + f"/api/session/{sid}/bytes?path=big.bin&offset={BIG + 5}&length=16"
        )
        assert (status, past["length"], past["data"]) == (200, 0, "")
        status, _ = call("GET", base + f"/api/session/{sid}/bytes?path=../secret&offset=0&length=8")
        assert status == 400
        status, _ = call("GET", base + f"/api/session/{sid}/bytes?path=pic.jpg&offset=-1&length=8")
        assert status == 400
        status, _ = call("GET", base + f"/api/session/{sid}/bytes?path=nope.bin&offset=0&length=8")
        assert status == 404
    reads = [
        (json.loads(x)["payload"]["offset"], json.loads(x)["payload"]["length"])
        for x in TRACE.read_text().splitlines()[mark:]
        if json.loads(x)["name"] == "FILE_BYTES_READ"
    ]
    assert reads == [(0, 8), (BIG - 16, 16), (0, 256 * 1024), (BIG + 5, 0)]
