# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""End to end, through the server: Esc while a long session's turn is still loading.

The stall of 2026-11-17 (review `REVIEW-2026-11-18-esc-interrupts-and-session-stalls.md`): an Esc
reached a turn while it was reading a long record, the cancel ran before the model producer's
first step, the producer wrote no frame, and the turn never ended; the session's lock was held
until the app was killed. Kernel K354 records such a producer, K355 keeps an interrupt the loop
cannot take yet, app 518 reports it, app 519 bounds the quit.

Nothing here is patched. A session is continued from a long hand-written Claude Code session file
through `POST /api/session`, so its record holds thousands of imported events and every later turn
reads them back. A turn is sent with `POST /turn`; the moment the session reads `running`, an
interrupt is sent with `POST /interrupt`, while the turn is still loading the record.
"""

from __future__ import annotations

import json
import threading
import time
from pathlib import Path
from typing import Any

import pytest
from _serving import call, serving
from substrate.api import read_record

import server

_WORDS = (
    "the window counts each turn before it sends the prompt and the record holds every event "
    "a session writes while the model reads files runs commands and replies to the person"
).split()


def _text(i: int, n: int) -> str:
    return " ".join(f"{_WORDS[(i + k) % len(_WORDS)]}{(i * 7 + k) % 101}" for k in range(n))


def _session_file(path: Path, turns: int) -> None:
    """A Claude Code session file in its JSONL form: after one compaction, `turns` exchanges,
    each a message, a reply with a Bash call, the call's result and a closing reply."""
    lines: list[dict[str, Any]] = [
        {"type": "system", "subtype": "compact_boundary", "content": "Conversation compacted"},
        {
            "type": "user",
            "isCompactSummary": True,
            "message": {"role": "user", "content": "SUMMARY: a long piece of work so far."},
        },
    ]
    for i in range(turns):
        lines += [
            {
                "type": "user",
                "message": {"role": "user", "content": f"message {i}: {_text(i, 30)}"},
            },
            {
                "type": "assistant",
                "message": {
                    "role": "assistant",
                    "content": [
                        {"type": "text", "text": f"Looking. {_text(i + 1, 10)}"},
                        {
                            "type": "tool_use",
                            "id": f"toolu_{i}",
                            "name": "Bash",
                            "input": {"command": f"grep -rn term{i} src"},
                        },
                    ],
                },
            },
            {
                "type": "user",
                "message": {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": f"toolu_{i}",
                            "content": _text(i + 2, 60),
                        }
                    ],
                },
            },
            {
                "type": "assistant",
                "message": {
                    "role": "assistant",
                    "content": [{"type": "text", "text": f"reply {i}"}],
                },
            },
        ]
    path.write_text("\n".join(json.dumps(x) for x in lines) + "\n", encoding="utf-8")


def _status(base: str, sid: str) -> str:
    _code, body = call("GET", base + f"/api/session/{sid}")
    return str(body.get("status"))


@pytest.mark.timeout(300)
def test_esc_while_a_long_session_loads(app: server.App, tmp_path: Path) -> None:
    app.install_registry(tmp_path / "sessions")
    session_file = tmp_path / "long-session.jsonl"
    _session_file(session_file, turns=2500)
    ws = tmp_path / "ws"
    ws.mkdir()
    with serving(app) as base:
        code, body = call(
            "POST",
            base + "/api/session",
            {
                "driver": "deterministic",
                "workspace": str(ws),
                "make_repository": False,
                "continue_from": {"tool": "claude_code", "path": str(session_file)},
            },
        )
        assert code == 200, body
        sid = str(body["session_id"])
        code, body = call("POST", base + f"/api/session/{sid}/turn", {"text": "first"}, timeout=240)
        assert code == 200, body
        record_root = Path(app.registry.get(sid).record_root)  # type: ignore[union-attr]
        envelopes = sum(1 for _ in read_record(record_root))
        assert envelopes > 10_000

        # The turn the Esc lands in.
        turn: dict[str, Any] = {}

        def second() -> None:
            turn["code"], turn["body"] = call(
                "POST", base + f"/api/session/{sid}/turn", {"text": "second"}, timeout=240
            )

        thread = threading.Thread(target=second)
        thread.start()
        deadline = time.monotonic() + 30
        while _status(base, sid) != "running" and time.monotonic() < deadline:
            time.sleep(0.005)
        code, esc = call(
            "POST", base + f"/api/session/{sid}/interrupt?max_wait_ms=60000", {}, timeout=90
        )
        thread.join(240)
        assert not thread.is_alive(), "the turn never came back"
        assert code == 200 and turn["code"] == 200, (esc, turn)
        assert esc["interrupted"] is True and esc["landed"] is True, esc

        # The Esc came before the model's first step — the case that used to strand the turn: the
        # model's ProducerStarted is followed by its ProducerCancelled, with no PromptComposed
        # (the model never ran), and the turn still ends interrupted.
        events = list(read_record(record_root))
        last_message = max(i for i, e in enumerate(events) if e["kind"] == "UserMessage")
        turn_events = events[last_message:]
        kinds = [e["kind"] for e in turn_events]
        cancelled = [e for e in turn_events if e["kind"] == "substrate.ProducerCancelled"]
        assert len(cancelled) == 1, kinds
        model = cancelled[0]["payload"]["producer"]
        assert model["kind"] == "model"
        assert cancelled[0]["payload"]["caller"] == "daemon:interrupt-hard"
        started = next(
            i
            for i, e in enumerate(turn_events)
            if e["kind"] == "substrate.ProducerStarted"
            and e["payload"]["producer"]["instance"] == model["instance"]
        )
        assert "PromptComposed" not in kinds[started : kinds.index("substrate.ProducerCancelled")]
        assert kinds[-2:] == ["Returned", "substrate.TerminationMatched"], kinds
        assert turn_events[-2]["payload"]["reason"] == "interrupted"
        assert _status(base, sid) == "parked"

        # The session takes its next turn; nothing is left holding it.
        code, body = call("POST", base + f"/api/session/{sid}/turn", {"text": "third"}, timeout=240)
        assert code == 200, body
        replies = [e for e in read_record(record_root) if e["kind"] == "ModelReply"]
        assert replies[-1]["payload"]["turn_index"] == 2

    # And the quit ends it cleanly.
    outcome = server._shutdown_all_sessions(app)
    assert outcome["ended"] == 1 and outcome["busy"] == 0 and outcome["deferred"] == 0
