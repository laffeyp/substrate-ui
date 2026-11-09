# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""The server's faults outside a request (vocabulary v0.24, P-0.24-FAULTS), read from the trace the
test session keeps on (tests/conftest.py): a background topology run that raises writes RUN_FAULTED
with its run id; an exception that escapes a thread writes SERVER_UNCAUGHT and still reaches the
hook that was there before, so Python prints it as it did."""

from __future__ import annotations

import json
import os
import sys
import threading
import time
from pathlib import Path
from typing import Any

import pytest
from _serving import call, serving
from substrate.topologies.applications.registry import load_manifests

import server

TRACE = Path(os.environ["SUBSTRATE_TRACE_DIR"]) / "server.jsonl"


def _mark() -> int:
    return len(TRACE.read_text().splitlines()) if TRACE.exists() else 0


def _since(mark: int) -> list[dict[str, Any]]:
    return [json.loads(x) for x in TRACE.read_text().splitlines()[mark:]]


def test_a_background_run_that_raises_writes_run_faulted(
    app: server.App, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    sessions = tmp_path / "sessions"
    monkeypatch.setattr(server, "_sessions_base", lambda: sessions)
    sessions.mkdir(parents=True)
    app.install_registry(base=sessions)
    app.applications = load_manifests()
    app.topology_runs = {}

    class Planted:
        def __init__(self, _root: Any) -> None:
            pass

        async def run(self, *_a: Any, **_k: Any) -> Any:
            raise RuntimeError("planted by test_server_faults")

    monkeypatch.setattr(server.api, "Runtime", Planted)
    mark = _mark()
    with serving(app) as base:
        status, body = call(
            "POST",
            base + "/api/topology/best_of_n_verified/run",
            {
                "inputs": {
                    "task": "double 3",
                    "drafter_model": "deterministic",
                    "verify_model": "deterministic",
                    "n": 2,
                    "max_rounds": 1,
                },
                "await_completion": False,
            },
            timeout=30,
        )
        assert status == 200, body
        run_id = body["run_id"]
        deadline = time.time() + 15
        while time.time() < deadline:
            _, poll = call("GET", base + f"/api/topology/best_of_n_verified/status?run_id={run_id}")
            if poll["status"] == "failed":
                break
            time.sleep(0.1)
        assert poll["status"] == "failed", poll
    faulted = [r["payload"] for r in _since(mark) if r["name"] == "RUN_FAULTED"]
    assert faulted == [{"run_id": run_id, "error_type": "RuntimeError", "where": "_run_background"}]
    assert "planted" not in json.dumps(_since(mark))  # no message text (E1)


def test_an_exception_that_escapes_a_thread_writes_server_uncaught(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    heard: list[str] = []
    monkeypatch.setattr(threading, "excepthook", lambda a: heard.append(type(a.exc_value).__name__))
    monkeypatch.setattr(sys, "excepthook", lambda k, v, tb: heard.append("main:" + k.__name__))
    server._install_fault_hooks()
    mark = _mark()

    def boom() -> None:
        raise LookupError("planted by test_server_faults")

    t = threading.Thread(target=boom, name="planted-thread")
    t.start()
    t.join()
    try:
        raise KeyError("planted")
    except KeyError:
        sys.excepthook(*sys.exc_info())  # type: ignore[arg-type]
    recs = [r["payload"] for r in _since(mark) if r["name"] == "SERVER_UNCAUGHT"]
    assert recs == [
        {"thread": "planted-thread", "error_type": "LookupError", "where": "unknown"},
        {"thread": "MainThread", "error_type": "KeyError", "where": "unknown"},
    ]
    assert heard == ["LookupError", "main:KeyError"], "the hooks before still run"
