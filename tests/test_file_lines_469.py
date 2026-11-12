# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""A text file of any size is read by line range (UI sprint 469; roadmap r13 E14; the Architect, 2026-11-11: "they could
just scroll down and see the whole file"). One pass indexes a file version's lines; a request reads lines from the
nearest kept line. Lines are counted as the editor counts them, sent without their break or a `\\r` before it, and a
line past 64 KB is sent in part with the count of bytes past it. FILE_LINES_READ names each read. The files are written
here by hand."""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

import server
from _serving import call, serving

TRACE = Path(os.environ["SUBSTRATE_TRACE_DIR"]) / "server.jsonl"


def numbered(n: int, word: str = "ligne é") -> str:
    return "".join(f"{word} {k}\n" for k in range(n))


@pytest.fixture
def ws(tmp_path: Path) -> Path:
    root = tmp_path / "ws"
    root.mkdir()
    (root / "big.txt").write_text(numbered(150_000), encoding="utf-8")
    (root / "latin.txt").write_bytes(numbered(3000).replace("\n", "\r\n").encode("latin-1"))
    (root / "wide.txt").write_bytes(b"\xff\xfe" + numbered(3000).encode("utf-16-le"))
    (root / "bom.txt").write_bytes(b"\xef\xbb\xbf" + numbered(2000).encode())
    (root / "one.json").write_bytes(b"[" + b"1," * (5 * 1024 * 1024 // 2) + b"1]")
    return root


def expected(ws: Path, name: str) -> list[str]:
    data = (ws / name).read_bytes()
    text = server._decode_any(data)
    assert text is not None
    return [line.removesuffix("\r") for line in text[0].split("\n")]


@pytest.mark.parametrize(
    ("name", "encoding"),
    [
        ("big.txt", "utf-8"),
        ("latin.txt", "latin-1"),
        ("wide.txt", "utf-16"),
        ("bom.txt", "utf-8-bom"),
    ],
)
def test_ranges_of_lines_equal_the_decoded_file(ws: Path, name: str, encoding: str) -> None:
    want = expected(ws, name)
    total = len(want)
    for first, count in [(0, 5), (1020, 10), (2040, 20), (total - 3, 10), (total, 5)]:
        out = server._workspace_lines(ws, name, first, count)
        assert (out["encoding"], out["total"], out["from"]) == (encoding, total, min(first, total))
        got = [line["text"] for line in out["lines"]]  # type: ignore[attr-defined]
        assert got == want[first : first + count], (name, first)
        assert all(line["more"] == 0 for line in out["lines"])  # type: ignore[attr-defined]
    # The editor's count: line breaks plus one, so a file ending in a break has an empty last line.
    assert want[-1] == ""
    assert (ws / name).stat().st_size > 0


def test_a_file_over_the_read_limit_reads_anywhere_after_one_pass(ws: Path) -> None:
    assert (ws / "big.txt").stat().st_size > 2 * 1024 * 1024
    before = server.line_index_scans
    first = server._workspace_lines(ws, "big.txt", 0, 1)
    last = server._workspace_lines(ws, "big.txt", 149_999, 1)
    middle = server._workspace_lines(ws, "big.txt", 75_000, 2000)
    assert server.line_index_scans == before + 1
    assert first["lines"] == [{"text": "ligne é 0", "more": 0}]
    assert last["lines"] == [{"text": "ligne é 149999", "more": 0}]
    texts = [line["text"] for line in middle["lines"]]  # type: ignore[attr-defined]
    assert texts == [f"ligne é {k}" for k in range(75_000, 77_000)]
    # A request is held to LINES_MAX lines.
    assert len(server._workspace_lines(ws, "big.txt", 0, 10_000)["lines"]) == server.LINES_MAX  # type: ignore[arg-type]
    # A changed file is a new version: its index is built again.
    with (ws / "big.txt").open("a", encoding="utf-8") as fh:
        fh.write("one more\n")
    again = server._workspace_lines(ws, "big.txt", 150_000, 2)
    assert server.line_index_scans == before + 2
    assert [line["text"] for line in again["lines"]] == ["one more", ""]  # type: ignore[attr-defined]


def test_a_line_past_64_kb_is_sent_in_part(ws: Path) -> None:
    size = (ws / "one.json").stat().st_size
    out = server._workspace_lines(ws, "one.json", 0, 10)
    assert out["total"] == 1
    (line,) = out["lines"]  # type: ignore[misc]
    assert len(line["text"]) == server.LINE_PIECE
    assert line["text"].startswith("[1,1,")
    assert line["more"] == size - server.LINE_PIECE
    # Sprint 470: the byte the unsent part starts at, for the editor to read on.
    assert line["rest"] == server.LINE_PIECE
    assert out["codec"] == "utf-8"
    assert server._workspace_lines(ws, "wide.txt", 0, 1)["codec"] == "utf-16-le"


def test_a_line_sent_in_part_is_cut_on_a_whole_character(ws: Path) -> None:
    # "x" then two-byte characters: byte 65,535 is the first byte of one, so the cut keeps 65,535 bytes.
    data = ("x" + "é" * 40_000 + "\nnext\n").encode()
    (ws / "accents.txt").write_bytes(data)
    out = server._workspace_lines(ws, "accents.txt", 0, 2)
    first, second = out["lines"]  # type: ignore[misc]
    assert first["text"] == "x" + "é" * 32_767
    assert (first["rest"], first["more"]) == (65_535, 80_001 - 65_535)
    assert data[first["rest"] : first["rest"] + first["more"]].decode() == "é" * (40_000 - 32_767)
    assert second == {"text": "next", "more": 0}
    assert server._whole_characters("aé".encode()[:2], "utf-8") == 1
    assert server._whole_characters("😀".encode("utf-16-le")[:2], "utf-16-le") == 0
    assert server._whole_characters(b"ab\xe9", "latin-1") == 3


def test_the_route_reads_lines_names_each_read_and_holds_paths_to_the_workspace(
    app: server.App, tmp_path: Path, ws: Path
) -> None:
    # The observation: 1,000,000 numbered lines (about 40 MB), read at its start, middle and end.
    (ws / "million.txt").write_text(
        "".join(f"line {k:07d} of the million\n" for k in range(1_000_000))
    )
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        status, body = call(
            "POST", base + "/api/session", {"driver": "deterministic", "workspace": str(ws)}
        )
        assert status == 200, body
        sid = body["session_id"]
        mark = len(TRACE.read_text().splitlines()) if TRACE.exists() else 0
        reads = []
        for first, count in [(0, 3), (500_000, 3), (999_999, 3)]:
            status, out = call(
                "GET",
                base + f"/api/session/{sid}/lines?path=million.txt&from={first}&count={count}",
            )
            assert status == 200, out
            assert out["total"] == 1_000_001
            reads.append([line["text"] for line in out["lines"]])
        assert reads == [
            [
                "line 0000000 of the million",
                "line 0000001 of the million",
                "line 0000002 of the million",
            ],
            [
                "line 0500000 of the million",
                "line 0500001 of the million",
                "line 0500002 of the million",
            ],
            ["line 0999999 of the million", ""],
        ]
        status, refused = call("GET", base + f"/api/session/{sid}/lines?path=../x&from=0&count=1")
        assert status == 400, refused
        status, missing = call(
            "GET", base + f"/api/session/{sid}/lines?path=none.txt&from=0&count=1"
        )
        assert status == 404, missing
    events = [json.loads(x) for x in TRACE.read_text().splitlines()[mark:]]
    lines_read = [e["payload"] for e in events if e["name"] == "FILE_LINES_READ"]
    assert [(p["from"], p["count"]) for p in lines_read] == [(0, 3), (500_000, 3), (999_999, 2)]
    assert all(set(p) == {"session_id", "from", "count"} for p in lines_read)
