# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""File size changes nothing (UI sprint 471; the Architect, 2026-11-11: "File size limits shouldn't change anything at
all … There's no difference between editing a big file or a small file"). A 5 MB file in UTF-8, in Latin-1, and one
that is not text read whole, save whole with one character changed (a save's body is the file, past the 4 MiB cap
every other request keeps), compare with their base, and are searched. The files are written here by hand."""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

import pytest

import server
from _serving import call, call_raw, serving

TRACE = Path(os.environ["SUBSTRATE_TRACE_DIR"]) / "server.jsonl"
SIZE = 5 * 1024 * 1024


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
    line = "needle café\n"
    (root / "big.txt").write_text(line * (SIZE // len(line.encode()) + 1), encoding="utf-8")
    (root / "latin.txt").write_bytes((line * (SIZE // len(line) + 1)).encode("latin-1"))
    (root / "blob.bin").write_bytes(bytes(range(256)) * (SIZE // 256 + 1))
    git(root, "add", "-A")
    git(root, "commit", "-q", "-m", "base")
    return root


def test_large_files_read_save_compare_and_search_as_small_ones(
    app: server.App, tmp_path: Path, ws: Path
) -> None:
    for name in ("big.txt", "latin.txt", "blob.bin"):
        assert (ws / name).stat().st_size > server._MAX_BODY_BYTES
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        status, body = call(
            "POST", base + "/api/session", {"driver": "deterministic", "workspace": str(ws)}
        )
        assert status == 200, body
        sid = body["session_id"]
        mark = len(TRACE.read_text().splitlines()) if TRACE.exists() else 0
        saved = {}
        for name, encoding, codec in [
            ("big.txt", "utf-8", "utf-8"),
            ("latin.txt", "latin-1", "latin-1"),
            ("blob.bin", "latin-1", "latin-1"),
        ]:
            status, read = call("GET", base + f"/api/session/{sid}/file?path={name}&as=latin-1")
            assert status == 200, read
            before = (ws / name).read_bytes()
            assert read["text"] == before.decode(codec)
            assert "too_large" not in read
            # One character changed: the third, "e" in the text files, byte 2 in blob.bin.
            text = read["text"][:2] + "Q" + read["text"][3:]
            status, out = call(
                "PUT",
                base + f"/api/session/{sid}/file?path={name}",
                {"text": text, "encoding": encoding, "base_sha256": read["sha256"]},
            )
            assert status == 200, out
            after = (ws / name).read_bytes()
            assert len(after) == len(before)
            assert [k for k in range(len(before)) if before[k] != after[k]] == [2]
            saved[name] = after
        # The base comparison of each, in its text.
        for name in ("big.txt", "latin.txt", "blob.bin"):
            status, hunks = call("GET", base + f"/api/session/{sid}/diff?path={name}")
            assert status == 200, hunks
            assert [h["new_start"] for h in hunks["hunks"]] == [1], name
        # Another request over the cap is still refused.
        status, _ = call_raw(
            "POST",
            base + "/api/session",
            None,
            headers={"Content-Length": str(server._MAX_BODY_BYTES + 1)},
        )
        assert status == 413
    events = [json.loads(x) for x in TRACE.read_text().splitlines()[mark:]]
    reads = [e["payload"]["encoding"] for e in events if e["name"] == "FILE_READ"]
    assert reads == ["utf8", "latin1", "binary"]
    written = [e["payload"]["encoding"] for e in events if e["name"] == "FILE_WRITTEN"]
    assert written == ["utf8", "latin1", "bytes"]
    # The search reads the 5 MB UTF-8 file too (it searches UTF-8 text, as ripgrep does by default).
    found = server._workspace_search(ws, "neQdle", regex=False, case=True)
    got = [f"{f['path']}:{ln['line']}" for f in found["files"] for ln in f["lines"]]  # type: ignore[index, union-attr]
    assert got == ["big.txt:1"]
