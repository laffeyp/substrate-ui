# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""An image sent as a file chip goes as an image (UI sprint 460; roadmap r13 E10.5; ADD-TO-MESSAGE-2026-11-10-r3
rule 7). The editor's tree sends every file as `file`; the server names a file whose first bytes are a JPEG, PNG,
GIF or WebP signature (the four the Claude API reads) as an image with its format and its path, so the model knows
to open it. Any other file with a NUL byte stays `binary`, and a text file named `.png` goes as text: the bytes
decide. The files are written here by hand."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

import server
from _serving import call, serving
from substrate.api import read_record

PNG = b"\x89PNG\r\n\x1a\n" + bytes(100)
JPEG = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01" + bytes(100)
GIF = b"GIF89a" + bytes(100)
WEBP = b"RIFF\x64\x00\x00\x00WEBPVP8 " + bytes(100)
ZIP = b"PK\x03\x04" + bytes(100)


@pytest.fixture
def ws(tmp_path: Path) -> Path:
    root = tmp_path / "ws"
    (root / "img").mkdir(parents=True)
    for name, data in {
        "a.png": PNG,
        "b.jpg": JPEG,
        "c.gif": GIF,
        "d.webp": WEBP,
        "e.zip": ZIP,
    }.items():
        (root / "img" / name).write_bytes(data)
    (root / "img" / "notes.png").write_text("not a picture\n")
    return root


def _send(
    app: server.App, tmp_path: Path, ws: Path, attachments: list[dict[str, Any]]
) -> list[str]:
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        status, body = call(
            "POST", base + "/api/session", {"driver": "deterministic", "workspace": str(ws)}
        )
        assert status == 200, body
        sid = str(body["session_id"])
        status, body = call(
            "POST", base + f"/api/session/{sid}/turn", {"text": "look", "attachments": attachments}
        )
        assert status == 200, body
    root = app.registry.get(sid).record_root  # type: ignore[union-attr]
    msgs = [
        e["payload"] for e in read_record(root, resolve_blobs=True) if e["kind"] == "UserMessage"
    ]
    return [a.get("text", "") for a in msgs[-1]["attachments"]]


def test_each_image_format_goes_as_an_image_by_its_bytes(
    app: server.App, tmp_path: Path, ws: Path
) -> None:
    names = ["a.png", "b.jpg", "c.gif", "d.webp", "e.zip", "notes.png"]
    texts = _send(
        app, tmp_path, ws, [{"kind": "file", "label": n, "ref": f"img/{n}"} for n in names]
    )
    follow = "read it with your file tools"
    assert texts == [
        f"(not inlined: an image, PNG, 108 B; img/a.png; {follow})",
        f"(not inlined: an image, JPEG, 112 B; img/b.jpg; {follow})",
        f"(not inlined: an image, GIF, 106 B; img/c.gif; {follow})",
        f"(not inlined: an image, WebP, 116 B; img/d.webp; {follow})",
        f"(not inlined: 104 B, binary; img/e.zip; {follow})",
        "(img/notes.png)\nnot a picture\n",
    ]


def test_an_image_chip_names_its_format_and_one_without_a_signature_stays_an_image(
    app: server.App, tmp_path: Path, ws: Path
) -> None:
    texts = _send(
        app,
        tmp_path,
        ws,
        [
            {"kind": "image", "label": "a.png", "ref": "img/a.png"},
            {"kind": "image", "label": "e.zip", "ref": "img/e.zip"},
        ],
    )
    assert texts == [
        "(not inlined: an image, PNG, 108 B; img/a.png; read it with your file tools)",
        "(not inlined: an image, 104 B; img/e.zip; read it with your file tools)",
    ]


@pytest.mark.parametrize(
    ("head", "fmt"),
    [
        (PNG, "PNG"),
        (JPEG, "JPEG"),
        (GIF, "GIF"),
        (b"GIF87a", "GIF"),
        (WEBP, "WebP"),
        (ZIP, None),
        (b"RIFF\0\0\0\0WAVE", None),
        (b"", None),
    ],
)
def test_image_format_reads_the_signatures(head: bytes, fmt: str | None) -> None:
    assert server._image_format(head) == fmt
