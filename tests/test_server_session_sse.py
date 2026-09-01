# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 214c — GET /api/session/<id>/events streams SSE frames.

The endpoint holds the connection open and writes `data: <json>\\n\\n` per
envelope on the record's growing tail. Closes on client disconnect or on
`substrate.RunFinalised`. Filters by `since_seq` so a reconnecting client
resumes without re-reading the whole record.

Testing shape: the tests fire the SSE reader from a background thread against
a real running ThreadingHTTPServer, then either (a) let a POST /turn populate
the record and read the emitted SSE frames, or (b) prime the record first and
verify backlog replay.

Run from the substrate venv:
    cd substrate && uv run python -m pytest ../substrate-ui/tests/test_server_session_sse.py -q
"""

from __future__ import annotations

import json
import socket
import sys
import threading
import time
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
from session_registry import SessionRegistry  # noqa: E402

# TECHNIQUE #38 — F-API-4 test primitives. `assert_event` / `assert_no_event`
# accept ANY iterable of envelope dicts (see substrate.testing._load), so the
# SSE reader's output plugs in directly without a synthetic record file.
from substrate.testing import assert_event, assert_no_event  # noqa: E402


@pytest.fixture
def base(tmp_path: Path) -> str:
    server._SESSION_REGISTRY = SessionRegistry(
        base=tmp_path,
        session_topology_factory=server._build_session_topology_from_manifest,
    )
    srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    srv.shutdown()


def _post_json(url: str, body: dict, timeout: float = 30) -> tuple[int, dict]:
    req = Request(
        url,
        data=json.dumps(body).encode(),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read())
    except HTTPError as exc:
        body_bytes = exc.read()
        try:
            payload = json.loads(body_bytes) if body_bytes else {}
        except json.JSONDecodeError:
            payload = {}
        return exc.code, payload


def _create(base: str, workspace: Path, name: str | None = None) -> str:
    _s, body = _post_json(
        base + "/api/session",
        {"driver": "deterministic", "name": name, "workspace": str(workspace)},
    )
    return body["session_id"]


def _read_sse_frames(
    url: str, max_frames: int, idle_timeout: float = 2.0
) -> list[dict]:
    """Read up to `max_frames` `data:` frames from an SSE stream and close.
    The SSE server holds the socket open past finalisation, so this reader
    stops when either (a) it collects `max_frames` frames, or (b) the server
    goes silent for `idle_timeout` seconds (the backlog is exhausted and
    nothing is streaming right now). Either way the client hangs up cleanly.
    """
    frames: list[dict] = []
    resp = urlopen(url, timeout=idle_timeout)
    buf = b""
    try:
        while len(frames) < max_frames:
            try:
                # `read1(N)` returns AT MOST N bytes but does not wait for the
                # full N — it returns whatever the underlying socket has
                # available in one system-call. `read(N)` waits for the full
                # N or connection close, which for an SSE stream means it
                # blocks past our idle timeout even when data is on the wire.
                chunk = resp.read1(65536)
            except (TimeoutError, socket.timeout):
                # Server went idle. Assume backlog exhausted.
                break
            if not chunk:
                break
            buf += chunk
            while b"\n\n" in buf:
                block, buf = buf.split(b"\n\n", 1)
                for line in block.splitlines():
                    if line.startswith(b"data: "):
                        raw = line[len(b"data: ") :]
                        try:
                            frames.append(json.loads(raw))
                        except json.JSONDecodeError:
                            pass
                    if len(frames) >= max_frames:
                        break
                if len(frames) >= max_frames:
                    break
    finally:
        try:
            resp.close()
        except (OSError, socket.error):
            pass
    return frames


def test_sse_streams_backlog_when_session_already_has_events(
    base: str, tmp_path: Path
) -> None:
    """Prime the record with one turn; then open /events with since_seq=-1 (from
    start). The stream backlogs every envelope on the record before going idle.
    Verified through the F-API-4 primitive (TECHNIQUE #38): `assert_event` and
    `assert_no_event` operate on any envelope iterable, so the parsed SSE frame
    list plugs straight in — no synthetic-record intermediary.
    """
    sid = _create(base, tmp_path / "wsp")
    _post_json(base + f"/api/session/{sid}/turn", {"text": "hello"})
    frames = _read_sse_frames(
        base + f"/api/session/{sid}/events?since_seq=-1",
        max_frames=30,
        idle_timeout=2.0,
    )
    # `substrate.RunStarted` intentionally NOT asserted here: the daemon's
    # POST /turn uses `Runtime.resume` (via `turn_sync` → `_run_resume_sync`),
    # and `_resume_bootstrap` at `runtime.py:409` deliberately does not write
    # RunStarted (it treats the run as CONTINUING, not opening). Piece-C
    # review finding 16 named this as the substrate-primitive gap that sprint
    # 214 was to decide; sprint 214a-c ship the endpoints without changing
    # that primitive. The SSE stream faithfully replays whatever is on the
    # record — the gap is at the writer, not the SSE reader.
    assert_event(frames, "UserMessage", text="hello", turn_index=0)
    assert_event(frames, "ModelReply", turn_index=0)
    assert_event(frames, "FinalAnswer")
    assert_event(frames, "Park", reason="final_answer")


def test_sse_since_seq_filters_backlog(base: str, tmp_path: Path) -> None:
    """`since_seq=N` skips every envelope with seq <= N. A caller that already
    read up to seq 5 opens with since_seq=5 and sees only seq > 5.
    """
    sid = _create(base, tmp_path / "wsp")
    _post_json(base + f"/api/session/{sid}/turn", {"text": "prior"})
    all_frames = _read_sse_frames(
        base + f"/api/session/{sid}/events?since_seq=-1",
        max_frames=30,
        idle_timeout=2.0,
    )
    assert all_frames, "expected at least the RunStarted envelope"
    max_seen_seq = max(int(f["seq"]) for f in all_frames)
    cutoff = max_seen_seq // 2  # midpoint of what's on the record

    filtered = _read_sse_frames(
        base + f"/api/session/{sid}/events?since_seq={cutoff}",
        max_frames=30,
        idle_timeout=2.0,
    )
    # Every filtered frame carries a seq strictly above the cutoff.
    assert all(int(f["seq"]) > cutoff for f in filtered)
    # The filtered stream also stayed non-empty — a since_seq at the midpoint
    # of a turn's envelopes must still stream the tail.
    assert filtered


def test_sse_streams_new_events_as_a_turn_lands(base: str, tmp_path: Path) -> None:
    """Fire the SSE reader BEFORE the turn lands. Frames arrive as the record
    grows. Uses since_seq=<current_max> so backlog doesn't dominate.
    """
    sid = _create(base, tmp_path / "wsp")
    # Prime the record with one turn so the record has a substrate.RunStarted
    # envelope AND we know the current tail seq.
    _post_json(base + f"/api/session/{sid}/turn", {"text": "warmup"})
    manifest = server._SESSION_REGISTRY.get(sid)
    from substrate import api as substrate_api

    envs = list(substrate_api.read_record(Path(manifest.record_root)))
    tail_seq = max(int(e["seq"]) for e in envs)

    collected: list[dict] = []
    reader_error: list[BaseException] = []

    def _reader() -> None:
        try:
            frames = _read_sse_frames(
                base + f"/api/session/{sid}/events?since_seq={tail_seq}",
                max_frames=15,
                idle_timeout=3.0,
            )
            collected.extend(frames)
        except BaseException as exc:  # noqa: BLE001
            reader_error.append(exc)

    reader_thread = threading.Thread(target=_reader, daemon=True)
    reader_thread.start()
    # Give the reader a moment to hit the poll loop.
    time.sleep(0.5)
    # Fire a new turn; the reader picks up the fresh envelopes as they land.
    _post_json(base + f"/api/session/{sid}/turn", {"text": "streamed turn"})
    reader_thread.join(timeout=15)
    assert not reader_error, f"reader failed: {reader_error[0]!r}"
    # The second turn's UserMessage streamed through — assert via F-API-4 primitive
    # (TECHNIQUE #38): the parsed frame list is an envelope iterable that
    # `assert_event` reads directly. A regression that dropped the fresh envelope
    # from the stream fails this specific assertion, not a lookalike.
    assert_event(collected, "UserMessage", text="streamed turn")
    # And the warmup turn's UserMessage did NOT re-appear — since_seq filtered it.
    assert_no_event(collected, "UserMessage", text="warmup")


def test_sse_unknown_session_returns_404(base: str) -> None:
    try:
        urlopen(base + "/api/session/s_nonexistent/events", timeout=5)
        raise AssertionError("expected 404")
    except HTTPError as exc:
        assert exc.code == 404
        body = json.loads(exc.read())
        assert "unknown session_id" in body["error"]
