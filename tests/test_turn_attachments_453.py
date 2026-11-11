# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""A selection's attachment (UI sprint 453; roadmap r13 E10.3; ADD-TO-MESSAGE-2026-11-10-r3 rules 5 and 9). A `lines`
attachment's span is [first, last] or [line, column, line, column] (columns from 1, both ends included); the page
may send the selection's `text`, the buffer as shown, which the record keeps. The files are written here by hand."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

import server
from _serving import call, serving
from substrate.api import read_record

CART = "export const total = 1;\nexport function add(a, b) {\n  return a + b;\n}\n"


@pytest.fixture
def ws(tmp_path: Path) -> Path:
    root = tmp_path / "ws"
    (root / "src").mkdir(parents=True)
    (root / "src" / "cart.ts").write_text(CART)
    return root


def _send(app: server.App, tmp_path: Path, ws: Path, attachments: list[dict[str, Any]]) -> tuple[int, Any]:
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        status, body = call("POST", base + "/api/session", {"driver": "deterministic", "workspace": str(ws)})
        assert status == 200, body
        sid = str(body["session_id"])
        status, body = call("POST", base + f"/api/session/{sid}/turn", {"text": "look", "attachments": attachments})
    if status != 200:
        return status, body
    root = app.registry.get(sid).record_root  # type: ignore[union-attr]
    msgs = [e["payload"] for e in read_record(root, resolve_blobs=True) if e["kind"] == "UserMessage"]
    return status, [a.get("text", "") for a in msgs[-1]["attachments"]]


def test_a_selection_s_text_from_the_page_is_what_the_record_keeps(app: server.App, tmp_path: Path, ws: Path) -> None:
    status, texts = _send(app, tmp_path, ws, [
        {"kind": "lines", "label": "cart.ts 2–3", "ref": "src/cart.ts", "span": [2, 3], "text": "export function add(a, b) {\n  return a + b + 1;\n"},
        {"kind": "lines", "label": "cart.ts 1:8–22", "ref": "src/cart.ts", "span": [1, 8, 1, 22], "text": "const total = 1"},
    ])
    assert status == 200, texts
    assert texts == [
        "(src/cart.ts, lines 2–3)\nexport function add(a, b) {\n  return a + b + 1;\n",
        "(src/cart.ts, 1:8–1:22)\nconst total = 1",
    ]


def test_without_text_an_inline_span_slices_the_file(app: server.App, tmp_path: Path, ws: Path) -> None:
    status, texts = _send(app, tmp_path, ws, [
        {"kind": "lines", "label": "cart.ts 1:8–22", "ref": "src/cart.ts", "span": [1, 8, 1, 22]},
        {"kind": "lines", "label": "cart.ts 2:17–3:14", "ref": "src/cart.ts", "span": [2, 17, 3, 14]},
        {"kind": "lines", "label": "cart.ts 3", "ref": "src/cart.ts", "span": [3, 3]},
    ])
    assert status == 200, texts
    assert texts == [
        "(src/cart.ts, 1:8–1:22)\nconst total = 1",
        "(src/cart.ts, 2:17–3:14)\nadd(a, b) {\n  return a + b",
        "(src/cart.ts, line 3)\n  return a + b;\n",
    ]


def test_a_selection_over_64_kb_goes_as_its_path_and_range(app: server.App, tmp_path: Path, ws: Path) -> None:
    big = ("y" * 99 + "\n") * 700
    status, texts = _send(app, tmp_path, ws, [{"kind": "lines", "label": "cart.ts 1–700", "ref": "src/cart.ts", "span": [1, 700], "text": big}])
    assert status == 200, texts
    assert texts == ["(not inlined: 68.4 KB, 700 lines, over the 64 KB a selection goes inline; src/cart.ts, lines 1–700; read them with your file tools)"]


@pytest.mark.parametrize(
    ("attachment", "says"),
    [
        ({"kind": "lines", "label": "x", "ref": "src/cart.ts", "span": [1, 2, 3]}, "span"),
        ({"kind": "lines", "label": "x", "ref": "src/cart.ts", "span": [2, 1, 1, 4]}, "span"),
        ({"kind": "lines", "label": "x", "ref": "src/cart.ts", "span": [1, 9, 1, 3]}, "span"),
        ({"kind": "lines", "label": "x", "ref": "src/cart.ts", "span": [1, 0, 1, 3]}, "span"),
        ({"kind": "lines", "label": "x", "ref": "src/cart.ts", "span": [1, 2], "text": 7}, "text"),
        ({"kind": "file", "label": "x", "ref": "src/cart.ts", "text": "mine"}, "text"),
        ({"kind": "lines", "label": "x", "ref": "../out.ts", "span": [1, 1], "text": "x"}, "outside the workspace"),
    ],
)
def test_a_malformed_selection_is_refused(app: server.App, tmp_path: Path, ws: Path, attachment: dict[str, Any], says: str) -> None:
    status, body = _send(app, tmp_path, ws, [attachment])
    assert status == 400 and says in body["error"], body
