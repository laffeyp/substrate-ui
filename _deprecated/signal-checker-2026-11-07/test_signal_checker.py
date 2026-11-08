# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""The server's signal checker (server.py _check_signal) against the shared cases in
web/vm/signals/checker-cases.json, which the window's and main's checkers run too
(web/app/__tests__/signal_checker.spec.ts), and the server's build posture: a broken emit is
written as SIGNAL_REJECTED, then raises unless SUBSTRATE_PACKAGED is set (v0.9 E6; sprint 355)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

import server

ROOT = Path(__file__).resolve().parent.parent
SPEC = json.loads((ROOT / "web" / "vm" / "signals" / "checker-cases.json").read_text())
TAGS = {t["name"]: t for t in SPEC["vocabulary"]["tags"]}


def _repeat(r: dict) -> dict:
    return {r["field"]: r["char"] * r["times"] + r.get("suffix", "")}


@pytest.mark.parametrize("case", SPEC["cases"], ids=[c["why"] for c in SPEC["cases"]])
def test_shared_case(case: dict) -> None:
    payload = case["payload"] if "payload" in case else _repeat(case["payload_repeat"])
    verdict = server._check_signal(TAGS, case["tag"], payload)
    if case["ok"]:
        out = case["out"] if "out" in case else _repeat(case["out_repeat"])
        assert verdict == {"ok": True, "payload": out}
    else:
        assert verdict == {"ok": False, "problem": case["problem"], "field": case["field"]}


def _trace(tmp_path: Path, monkeypatch: pytest.MonkeyPatch, packaged: bool) -> server._Trace:
    monkeypatch.setenv("SUBSTRATE_TRACE_DIR", str(tmp_path))
    monkeypatch.setenv("SUBSTRATE_BOOT_ID", "test-boot")
    if packaged:
        monkeypatch.setenv("SUBSTRATE_PACKAGED", "1")
    else:
        monkeypatch.delenv("SUBSTRATE_PACKAGED", raising=False)
    return server._Trace()


def _lines(tmp_path: Path) -> list[dict]:
    return [json.loads(x) for x in (tmp_path / "server.jsonl").read_text().splitlines()]


def test_source_build_raises(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    trace = _trace(tmp_path, monkeypatch, packaged=False)
    with pytest.raises(ValueError, match='"NOT_A_TAG" rejected: unknown_tag'):
        trace.emit("NOT_A_TAG", {})
    with pytest.raises(ValueError, match=r"out_of_range \(port\)"):
        trace.emit("SERVER_STARTED", {"port": 0})
    assert [(x["name"], x["payload"]["problem"]) for x in _lines(tmp_path)] == [
        ("SIGNAL_REJECTED", "unknown_tag"),
        ("SIGNAL_REJECTED", "out_of_range"),
    ]


def test_packaged_writes_signal_rejected(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    trace = _trace(tmp_path, monkeypatch, packaged=True)
    trace.emit("SERVER_STARTED", {"port": 8765, "sessions_found": 3})
    trace.emit("SERVER_STARTED", {"port": 8765})
    lines = _lines(tmp_path)
    assert [x["name"] for x in lines] == ["SIGNAL_REJECTED", "SERVER_STARTED"]
    p = lines[0]["payload"]
    assert (p["process"], p["tag"], p["problem"], p["field"]) == (
        "server",
        "SERVER_STARTED",
        "extra_field",
        "sessions_found",
    )
    assert "test_signal_checker.py" in p["call_site"]
    assert [x["proc_seq"] for x in lines] == [0, 1]
