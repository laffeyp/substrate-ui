# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""A turn's attachments (UI sprint 388; editor plan round 2, item 0(e); kernel K344).

POST /api/session/<id>/turn takes `attachments`, each {kind, label, ref, span?}, and puts them on
the turn's UserMessage with their text read at that moment: a file's text, a line range, a record
event's kind and payload; a folder and an image carry none. TURN_ACCEPTED counts them (vocabulary
v0.27) with no path or text (E1). A bad attachment is a 400 before the turn queues."""

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


def _mark() -> int:
    return len(TRACE.read_text().splitlines()) if TRACE.exists() else 0


def _since(mark: int) -> list[dict[str, Any]]:
    return [json.loads(x) for x in TRACE.read_text().splitlines()[mark:]]


@pytest.fixture
def ws(tmp_path: Path) -> Path:
    root = tmp_path / "ws"
    (root / "src").mkdir(parents=True)
    (root / "src" / "cart.py").write_text("one\ntwo\nthree\nfour\n")
    (root / "blob.bin").write_bytes(b"\xff\xfe\x00")
    (tmp_path / "secret.txt").write_text("no")
    return root


def _session(base: str, ws: Path) -> str:
    status, body = call(
        "POST", base + "/api/session", {"driver": "deterministic", "workspace": str(ws)}
    )
    assert status == 200, body
    sid = str(body["session_id"])
    status, body = call("POST", base + f"/api/session/{sid}/turn", {"text": "hello"})
    assert status == 200, body
    return sid


def _user_messages(app: server.App, sid: str) -> list[dict[str, Any]]:
    root = app.registry.get(sid).record_root  # type: ignore[union-attr]
    return [e["payload"] for e in read_record(root) if e["kind"] == "UserMessage"]


def test_attachments_reach_the_record_with_their_text(
    app: server.App, tmp_path: Path, ws: Path
) -> None:
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        sid = _session(base, ws)
        first = _user_messages(app, sid)[0]
        seq = next(
            e["seq"]
            for e in read_record(app.registry.get(sid).record_root)  # type: ignore[union-attr]
            if e["kind"] == "UserMessage"
        )
        mark = _mark()
        attachments = [
            {"kind": "file", "label": "cart.py", "ref": "src/cart.py"},
            {"kind": "lines", "label": "cart.py 2–3", "ref": "src/cart.py", "span": [2, 3]},
            {"kind": "folder", "label": "src", "ref": "src"},
            {"kind": "event", "label": "turn 0", "ref": f"seq:{seq}"},
            {"kind": "image", "label": "shot.png", "ref": "shot.png"},
        ]
        status, body = call(
            "POST",
            base + f"/api/session/{sid}/turn",
            {"text": "look", "attachments": attachments},
        )
        assert status == 200, body
        recs = _since(mark)
    got = _user_messages(app, sid)[1]["attachments"]
    assert [(a["kind"], a["label"], a["ref"]) for a in got] == [
        (a["kind"], a["label"], a["ref"]) for a in attachments
    ]
    assert got[0]["text"] == "one\ntwo\nthree\nfour\n"
    assert got[1]["text"] == "two\nthree\n" and got[1]["span"] == [2.0, 3.0]
    assert "text" not in got[2] and "text" not in got[4]  # empty, omitted by omit_defaults
    event = json.loads(got[3]["text"])
    assert event["kind"] == "UserMessage" and event["payload"]["text"] == first["text"]
    accepted = [r["payload"] for r in recs if r["name"] == "TURN_ACCEPTED"]
    assert accepted == [{"session_id": sid, "turn_index": 1, "attachments": 5}]
    assert "cart.py" not in json.dumps(recs) and "three" not in json.dumps(recs)  # E1


@pytest.mark.parametrize(
    ("attachment", "says"),
    [
        ({"kind": "sound", "label": "x", "ref": "x"}, "kind must be one of"),
        ({"kind": "file", "label": "", "ref": "src/cart.py"}, "label"),
        ({"kind": "file", "label": "s", "ref": "../secret.txt"}, "outside the workspace"),
        ({"kind": "file", "label": "m", "ref": "src/missing.py"}, "not a file"),
        ({"kind": "file", "label": "b", "ref": "blob.bin"}, "not UTF-8"),
        ({"kind": "lines", "label": "l", "ref": "src/cart.py", "span": [3, 2]}, "span"),
        ({"kind": "folder", "label": "f", "ref": "src/cart.py"}, "not a directory"),
        ({"kind": "event", "label": "e", "ref": "seq:9999"}, "no event at seq 9999"),
        ({"kind": "event", "label": "e", "ref": "7"}, "seq:<n>"),
    ],
)
def test_a_bad_attachment_is_refused_before_the_turn(
    app: server.App, tmp_path: Path, ws: Path, attachment: dict[str, Any], says: str
) -> None:
    app.install_registry(tmp_path / "sessions")
    with serving(app) as base:
        sid = _session(base, ws)
        mark = _mark()
        status, body = call(
            "POST",
            base + f"/api/session/{sid}/turn",
            {"text": "look", "attachments": [attachment]},
        )
        recs = _since(mark)
    assert status == 400 and says in body["error"], body
    assert len(_user_messages(app, sid)) == 1
    assert [r["name"] for r in recs if r["name"] in ("TURN_ACCEPTED", "API_REFUSED")] == [
        "API_REFUSED"
    ]
    assert (tmp_path / "secret.txt").read_text() == "no"
