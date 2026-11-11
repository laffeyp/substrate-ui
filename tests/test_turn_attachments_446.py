# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""A message is never refused for what it carries (UI sprint 446; roadmap r13 E10.1;
ADD-TO-MESSAGE-2026-11-10-r3 rules 1-8). Each attachment reaches the record as content, opened by its
workspace path, or as one reference line saying why; TURN_ACCEPTED counts the references. Only a path
outside the workspace and a malformed attachment are refused. The files are written here by hand."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import pytest

import server
from _serving import call, serving
from substrate.api import read_record

TRACE = Path(os.environ["SUBSTRATE_TRACE_DIR"]) / "server.jsonl"
JPEG = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01" + bytes(200)


def _mark() -> int:
    return len(TRACE.read_text().splitlines()) if TRACE.exists() else 0


def _since(mark: int) -> list[dict[str, Any]]:
    return [json.loads(x) for x in TRACE.read_text().splitlines()[mark:]]


@pytest.fixture
def ws(tmp_path: Path) -> Path:
    root = tmp_path / "ws"
    (root / "src").mkdir(parents=True)
    (root / "src" / "cart.ts").write_text("one\ntwo\nthree\n")
    (root / "photo.jpg").write_bytes(JPEG)
    (root / "big.log").write_bytes(b"a log line\n" * 300_000)  # 3.1 MB, past the read cap
    (root / "mid.txt").write_text(("x" * 99 + "\n") * 700)  # 70 KB
    (root / "latin.txt").write_bytes(b"caf\xe9 cr\xe8me\n")
    (root / "utf16.txt").write_bytes("héllo\nwörld\n".encode("utf-16"))
    (root / "bom8.txt").write_bytes(b"\xef\xbb\xbfhi there\n")
    lib = root / "lib"
    lib.mkdir()
    for n in range(205):
        (lib / f"f{n:03}.ts").write_text("x\n")
    (lib / ".gitignore").write_text("*.tmp\n")
    (lib / "skip.tmp").write_text("ignored\n")
    for n in range(5):
        (root / f"chunk{n}.txt").write_text(("y" * 99 + "\n") * 600)  # 60 KB each
    (tmp_path / "secret.txt").write_text("no")
    return root


def _session(base: str, ws: Path) -> str:
    status, body = call("POST", base + "/api/session", {"driver": "deterministic", "workspace": str(ws)})
    assert status == 200, body
    return str(body["session_id"])


def _send(base: str, sid: str, attachments: list[dict[str, Any]]) -> tuple[int, dict[str, Any]]:
    return call("POST", base + f"/api/session/{sid}/turn", {"text": "look", "attachments": attachments})


def _last_attachments(app: server.App, sid: str) -> list[dict[str, Any]]:
    root = app.registry.get(sid).record_root  # type: ignore[union-attr]
    # A large message is offloaded to the record's blob store; the kernel's prompt reads it resolved.
    return [e["payload"] for e in read_record(root, resolve_blobs=True) if e["kind"] == "UserMessage"][-1]["attachments"]


def test_every_file_goes_as_content_or_its_reference(app: server.App, tmp_path: Path, ws: Path) -> None:
    app.install_registry(tmp_path / "sessions")
    (ws / "gone.ts").write_text("soon gone\n")
    with serving(app) as base:
        sid = _session(base, ws)
        (ws / "gone.ts").unlink()
        mark = _mark()
        status, body = _send(base, sid, [
            {"kind": "file", "label": "cart.ts", "ref": "src/cart.ts"},
            {"kind": "file", "label": "photo.jpg", "ref": "photo.jpg"},
            {"kind": "file", "label": "big.log", "ref": "big.log"},
            {"kind": "file", "label": "mid.txt", "ref": "mid.txt"},
            {"kind": "file", "label": "latin.txt", "ref": "latin.txt"},
            {"kind": "file", "label": "utf16.txt", "ref": "utf16.txt"},
            {"kind": "file", "label": "bom8.txt", "ref": "bom8.txt"},
            {"kind": "file", "label": "gone.ts", "ref": "gone.ts"},
            {"kind": "image", "label": "photo.jpg", "ref": "photo.jpg"},
            {"kind": "lines", "label": "cart.ts 2–3", "ref": "src/cart.ts", "span": [2, 3]},
            {"kind": "lines", "label": "mid.txt 1–700", "ref": "mid.txt", "span": [1, 700]},
        ])
        recs = _since(mark)
    assert status == 200, body
    got = [a.get("text", "") for a in _last_attachments(app, sid)]
    assert got[0] == "(src/cart.ts)\none\ntwo\nthree\n"
    assert got[1] == "(not inlined: 212 B, binary; photo.jpg; read it with your file tools)"
    assert got[2] == "(not inlined: 3.1 MB, 300,000 lines, over the 64 KB a file goes inline; big.log; read it with your file tools)"
    assert got[3] == "(not inlined: 68.4 KB, 700 lines, over the 64 KB a file goes inline; mid.txt; read it with your file tools)"
    assert got[4] == "(latin.txt, Latin-1)\ncafé crème\n"
    assert got[5] == "(utf16.txt, UTF-16)\nhéllo\nwörld\n"
    assert got[6] == "(bom8.txt)\nhi there\n"
    assert got[7] == "(not found when the message was sent: gone.ts)"
    assert got[8] == "(not inlined: an image, 212 B; photo.jpg; read it with your file tools)"
    assert got[9] == "(src/cart.ts, lines 2–3)\ntwo\nthree\n"
    assert got[10] == "(not inlined: 68.4 KB, 700 lines, over the 64 KB a file goes inline; mid.txt, lines 1–700; read them with your file tools)"
    accepted = [r["payload"] for r in recs if r["name"] == "TURN_ACCEPTED"]
    assert accepted == [{"session_id": sid, "turn_index": 0, "attachments": 11, "by_reference": 6}]
    assert "API_REFUSED" not in [r["name"] for r in recs]
    assert "cart.ts" not in json.dumps(recs) and "three" not in json.dumps(recs)  # E1


def test_the_message_inlines_at_most_256_kb(app: server.App, tmp_path: Path, ws: Path) -> None:
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        sid = _session(base, ws)
        status, body = _send(base, sid, [{"kind": "file", "label": f"chunk{n}", "ref": f"chunk{n}.txt"} for n in range(5)])
    assert status == 200, body
    got = [a["text"] for a in _last_attachments(app, sid)]
    assert all(t.startswith(f"(chunk{n}.txt)\n") for n, t in enumerate(got[:4]))
    assert got[4] == "(not inlined: 58.6 KB, 600 lines, past the 256 KB a message inlines; chunk4.txt; read it with your file tools)"


def test_a_folder_goes_as_its_listing(app: server.App, tmp_path: Path, ws: Path) -> None:
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        sid = _session(base, ws)
        status, body = _send(base, sid, [
            {"kind": "folder", "label": "lib/", "ref": "lib"},
            {"kind": "folder", "label": "src/", "ref": "src"},
            {"kind": "folder", "label": "cart.ts", "ref": "src/cart.ts"},
        ])
    assert status == 200, body
    lib, src, wrong = (a["text"] for a in _last_attachments(app, sid))
    rows = lib.split("\n")
    assert rows[0] == "(lib/, 206 files)"  # 205 and the ignore file; skip.tmp is ignored
    assert rows[1:3] == ["lib/.gitignore", "lib/f000.ts"] and len(rows) == 1 + 200 + 1
    assert rows[-1] == "(and 6 files more)"
    assert "lib/skip.tmp" not in rows
    assert src == "(src/, 1 file)\nsrc/cart.ts"
    assert wrong == "(not found when the message was sent: src/cart.ts/)"


def test_a_file_that_cannot_be_read_still_goes(app: server.App, tmp_path: Path, ws: Path) -> None:
    app.install_registry(tmp_path / "sessions")
    locked = ws / "locked.txt"
    locked.write_text("private\n")
    try:
        with serving(app) as base:
            sid = _session(base, ws)
            locked.chmod(0)
            status, body = _send(base, sid, [{"kind": "file", "label": "locked.txt", "ref": "locked.txt"}])
    finally:
        locked.chmod(0o600)
    assert status == 200, body
    assert _last_attachments(app, sid)[0]["text"] == "(not inlined: it could not be read, Permission denied; locked.txt; read it with your file tools)"


@pytest.mark.parametrize(
    ("attachment", "says"),
    [
        ({"kind": "file", "label": "s", "ref": "../secret.txt"}, "outside the workspace"),
        ({"kind": "lines", "label": "s", "ref": "../secret.txt", "span": [1, 1]}, "outside the workspace"),
        ({"kind": "folder", "label": "s", "ref": ".."}, "outside the workspace"),
        ({"kind": "sound", "label": "x", "ref": "x"}, "kind must be one of"),
        ({"kind": "file", "label": "", "ref": "src/cart.ts"}, "label"),
        ({"kind": "lines", "label": "l", "ref": "src/cart.ts", "span": [3, 2]}, "span"),
    ],
)
def test_only_a_path_outside_the_workspace_or_a_malformed_attachment_is_refused(
    app: server.App, tmp_path: Path, ws: Path, attachment: dict[str, Any], says: str
) -> None:
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        sid = _session(base, ws)
        status, body = _send(base, sid, [attachment])
    assert status == 400 and says in body["error"], body
    assert (tmp_path / "secret.txt").read_text() == "no"
