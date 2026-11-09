# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Print one launch's signals for an AI reader (plan 2026-11-05-sdd-signals item 6, sprint 378).

A launch writes <logs>/traces/<boot_id>/: main.jsonl, server.jsonl and window-<id>.jsonl, one record
per line (electron/main.ts, server.py _Trace). This prints them as one listing in foundation 02's
format_for_ai shape: a header, the count, then the records in order under a "### <category>" line
each time the category changes, each record as `t=<s>  TAG  [where]  field=value ...`.

Order. Within one file the order key is proc_seq. Across files the reader keeps the causal pairs the
trace states: the server's SESSION_CREATED before the window's SESSION_OPEN_ACKED of that session,
the server's k-th TURN_ACCEPTED of a session before the window's k-th TURN_ACK of it, main's k-th
SERVER_SPAWNED before the server's k-th SERVER_STARTED, main's WINDOW_OPENED before that window's
first record. Records those leave unordered go by their wall time, which never overrides an order the
trace states. t is seconds from the launch's first wall time, for reading only.

Join. A record that names a session and a seq (TRANSCRIPT_ROW_DRAWN, TRANSCRIPT_ROW_SKIPPED, and a
pane's STREAM_ENVELOPE_APPENDED, whose session is the pane's last acked or attached one) is followed by
the kernel's entry at that seq, read with substrate's read_record from the record_root the session's
manifest names: `↳ kernel seq=<n> <kind> producer=<p> <payload, cut to 120 characters>`. An entry
that is not there prints as `↳ kernel seq=<n> not in the record of <session> (... ends at seq <m>)`
(evidence E7); a session with no manifest, or whose record cannot be read, says that instead.

Damage and closing. A line that is not a whole JSON record (a launch killed mid-write leaves its last
line cut short) is skipped and counted in the header by file and line number. The header also says
whether the launch closed: APP_QUIT_COMPLETED is main's last record (rule S2); a launch that does not
end with it either is still running or ended without closing, and when a later launch is in the same
folder it has ended, so S2 is broken. The INVARIANT_BROKEN records are counted by rule.

Usage, from substrate-ui/:
  uv run --project ../substrate python scripts/read_trace.py [--boot ID] [--home DIR]
      [--category C[,C]] [--window N] [--pane N] [--session ID]
--boot defaults to the latest launch. --home is the app's state root: the logs are
<home>/electron/logs/traces and the sessions <home>/sessions. Without --home: $SUBSTRATE_HOME the
same way, else the installed app's ~/Library/Logs/Substrate/traces and ~/.substrate/sessions.
"""

from __future__ import annotations

import argparse
import heapq
import json
import os
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

from substrate.api import read_record

ROOT = Path(__file__).resolve().parent.parent
VOCAB = ROOT / "web" / "vm" / "signals" / "versions" / "current.json"
JOINED = {"TRANSCRIPT_ROW_DRAWN", "TRANSCRIPT_ROW_SKIPPED", "STREAM_ENVELOPE_APPENDED"}


def paths(home: str | None) -> tuple[Path, Path]:
    home = home or os.environ.get("SUBSTRATE_HOME")
    if home:
        return Path(home) / "electron" / "logs" / "traces", Path(home) / "sessions"
    return (
        Path.home() / "Library" / "Logs" / "Substrate" / "traces",
        Path.home() / ".substrate" / "sessions",
    )


def load_boot(
    folder: Path, unreadable: dict[str, list[int]] | None = None
) -> list[list[dict[str, Any]]]:
    """Each file's records in proc_seq order. A line that is not a JSON record is skipped, and its
    1-based line number is added to `unreadable[file name]` when that dict is given."""
    chains = []
    for f in sorted(folder.glob("*.jsonl")):
        recs = []
        text = f.read_text(encoding="utf-8", errors="replace")
        for n, line in enumerate(text.splitlines(), 1):
            if not line.strip():
                continue
            try:
                rec = json.loads(line)
            except ValueError:
                rec = None
            if not isinstance(rec, dict) or "name" not in rec or "process" not in rec:
                if unreadable is not None:
                    unreadable.setdefault(f.name, []).append(n)
                continue
            recs.append(rec)
        recs.sort(key=lambda r: r.get("proc_seq", 0))
        chains.append(recs)
    return chains


def merge(chains: list[list[dict[str, Any]]]) -> list[dict[str, Any]]:
    """Each file's records in proc_seq order; the causal pairs across files; wall time between."""
    deps: dict[int, list[int]] = defaultdict(list)  # id(record) -> ids it must follow
    by_name: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for chain in chains:
        for r in chain:
            p = r.get("payload") or {}
            by_name[(r["process"], r["name"])].append(r)
            if p.get("session_id") is not None:
                by_name[(r["process"], r["name"] + ":" + str(p["session_id"]))].append(r)

    def pair(before: list[dict[str, Any]], after: list[dict[str, Any]]) -> None:
        for a, b in zip(before, after):
            deps[id(b)].append(id(a))

    pair(by_name[("main", "SERVER_SPAWNED")], by_name[("server", "SERVER_STARTED")])
    for (proc, key), recs in list(by_name.items()):
        if proc == "server" and key.startswith("SESSION_CREATED:"):
            pair(recs[:1], by_name[("window", "SESSION_OPEN_ACKED:" + key.split(":", 1)[1])][:1])
        if proc == "server" and key.startswith("TURN_ACCEPTED:"):
            pair(recs, by_name[("window", "TURN_ACK:" + key.split(":", 1)[1])])
    opened = {r.get("window_id"): r for r in by_name[("main", "WINDOW_OPENED")]}
    for chain in chains:
        if chain and chain[0]["process"] == "window" and chain[0].get("window_id") in opened:
            deps[id(chain[0])].append(id(opened[chain[0]["window_id"]]))

    out: list[dict[str, Any]] = []
    done: set[int] = set()
    heads = [0] * len(chains)
    heap: list[tuple[str, int, int]] = []
    queued: set[int] = set()

    def offer(c: int) -> None:
        if heads[c] < len(chains[c]) and c not in queued:
            r = chains[c][heads[c]]
            if all(d in done for d in deps[id(r)]):
                heapq.heappush(heap, (r.get("wall", ""), c, heads[c]))
                queued.add(c)

    for c in range(len(chains)):
        offer(c)
    while heap:
        _, c, _ = heapq.heappop(heap)
        queued.discard(c)
        r = chains[c][heads[c]]
        out.append(r)
        done.add(id(r))
        heads[c] += 1
        for k in range(len(chains)):
            offer(k)
    # A pair the trace cannot satisfy (a dependency never written) leaves records; they follow in file order.
    for c, chain in enumerate(chains):
        out.extend(chain[heads[c] :])
    return out


class Kernel:
    """Each session's kernel record, read once, by seq."""

    def __init__(self, sessions: Path) -> None:
        self.sessions = sessions
        # session id -> (entries by seq, record root), or the reason the record could not be read
        self.cache: dict[str, tuple[dict[int, dict[str, Any]], str] | str] = {}

    def _load(self, session_id: str) -> tuple[dict[int, dict[str, Any]], str] | str:
        manifest = self.sessions / session_id / "manifest.json"
        try:
            root = json.loads(manifest.read_text(encoding="utf-8"))["record_root"]
        except OSError:
            return f"no manifest for session {session_id} at {manifest}"
        except (KeyError, ValueError, TypeError) as exc:
            return f"the manifest of {session_id} at {manifest} names no record_root ({type(exc).__name__})"
        try:
            return {int(e["seq"]): e for e in read_record(root, resolve_blobs=True)}, str(root)
        except Exception as exc:  # noqa: BLE001 - the reader reports any failure to read a record
            return f"the record of {session_id} at {root} could not be read ({type(exc).__name__})"

    def entry(self, session_id: str, seq: int) -> tuple[dict[str, Any] | None, str]:
        """The entry at seq, or None and why: the seq is not in the record, or the record is not there."""
        if session_id not in self.cache:
            self.cache[session_id] = self._load(session_id)
        got = self.cache[session_id]
        if isinstance(got, str):
            return None, got
        entries, root = got
        if seq in entries:
            return entries[seq], ""
        last = max(entries) if entries else None
        ends = f"ends at seq {last}" if last is not None else "is empty"
        return None, f"not in the record of {session_id} (the record at {root} {ends})"


def short(v: Any, n: int = 120) -> str:
    s = v if isinstance(v, str) else json.dumps(v, ensure_ascii=False, separators=(",", ":"))
    return s if len(s) <= n else s[: n - 1] + "…"


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Print one launch's signals for an AI reader.")
    ap.add_argument("--boot")
    ap.add_argument("--home")
    ap.add_argument("--category")
    ap.add_argument("--window", type=int)
    ap.add_argument("--pane", type=int)
    ap.add_argument("--session")
    a = ap.parse_args(argv)

    traces, sessions = paths(a.home)
    boots = sorted(p.name for p in traces.glob("*") if p.is_dir()) if traces.is_dir() else []
    boot = a.boot or (boots[-1] if boots else None)
    if not boot or not (traces / boot).is_dir():
        print(
            f"read_trace: no launch {'named ' + a.boot if a.boot else 'at all'} under {traces}",
            file=sys.stderr,
        )
        return 1
    vocab = {t["name"]: t for t in json.loads(VOCAB.read_text(encoding="utf-8"))["tags"]}
    unreadable: dict[str, list[int]] = {}
    records = merge(load_boot(traces / boot, unreadable))
    kernel = Kernel(sessions)
    cats = set(a.category.split(",")) if a.category else None

    pane_session: dict[tuple[Any, Any], Any] = {}
    lines: list[str] = []
    shown = 0
    last_cat = None
    t0 = min((r.get("wall", "") for r in records), default="")

    def secs(w: str) -> float:
        try:
            return (
                datetime.fromisoformat(w.replace("Z", "+00:00"))
                - datetime.fromisoformat(t0.replace("Z", "+00:00"))
            ).total_seconds()
        except ValueError:
            return 0.0

    for r in records:
        p = r.get("payload") or {}
        pane = r.get("pane_id") if r.get("pane_id") is not None else p.get("pane_id")
        key = (r.get("window_id"), pane)
        if r["name"] in ("SESSION_OPEN_ACKED", "SESSION_ATTACH_STARTED") and pane is not None:
            pane_session[key] = p.get("session_id")
        if r["name"] == "PANE_CLOSED":
            pane_session.pop(key, None)
        sid = p.get("session_id") if p.get("session_id") is not None else pane_session.get(key)
        cat = vocab.get(r["name"], {}).get("category", "unknown")
        if cats and cat not in cats:
            continue
        if a.window is not None and r.get("window_id") != a.window:
            continue
        if a.pane is not None and pane != a.pane:
            continue
        if a.session is not None and sid != a.session:
            continue
        if cat != last_cat:
            lines += ["", f"### {cat}"]
            last_cat = cat
        where = r["process"] if r["process"] != "window" else f"window {r.get('window_id')}"
        if pane is not None:
            where += f" pane {pane}"
        fields = "  ".join(f"{k}={short(v, 80)}" for k, v in p.items())
        lines.append(
            f"  t={secs(r.get('wall', '')):.3f}  {r['name']}  [{where}]  {fields}".rstrip()
        )
        shown += 1
        if r["name"] in JOINED and sid and isinstance(p.get("seq"), int) and p["seq"] >= 0:
            e, why = kernel.entry(str(sid), p["seq"])
            if e is None:
                lines.append(f"      ↳ kernel seq={p['seq']} {why}")
            else:
                lines.append(
                    f"      ↳ kernel seq={p['seq']} {e.get('kind')} producer={short(e.get('producer'), 60)} {short(e.get('payload'))}"
                )

    head = records[0] if records else {}
    booted = next((r for r in records if r["name"] == "APP_BOOTED"), {})
    bp = booted.get("payload") or {}
    filters = ", ".join(
        f"{k}={v}"
        for k, v in (
            ("category", a.category),
            ("window", a.window),
            ("pane", a.pane),
            ("session", a.session),
        )
        if v is not None
    )
    print("## Signal Capture")
    print(
        f"Context: launch {head.get('boot_id', boot)}; app {bp.get('app_commit')}, kernel {bp.get('kernel_commit')}, vocabulary {bp.get('vocab_version')}; files {', '.join(sorted(f.name for f in (traces / boot).glob('*.jsonl')))}"
        + (f"; only {filters}" if filters else "")
    )
    print(f"Total signals: {shown} of {len(records)}")
    mains = [r for r in records if r["process"] == "main"]
    later = [b for b in boots if b > boot]
    if mains and mains[-1]["name"] == "APP_QUIT_COMPLETED":
        print("Closed: yes (APP_QUIT_COMPLETED is main's last record)")
    else:
        ends = mains[-1]["name"] if mains else "no main record"
        print(
            f"Closed: no; main's last record is {ends}; "
            + (
                f"a later launch ({later[0]}) is in the folder, so this one ended without closing (S2 broken)"
                if later
                else "no later launch: still running, or ended without closing"
            )
        )
    breaks: dict[str, int] = defaultdict(int)
    for r in records:
        if r["name"] == "INVARIANT_BROKEN":
            breaks[str((r.get("payload") or {}).get("rule"))] += 1
    print(
        "Rule breaks: "
        + (", ".join(f"{k} {v}" for k, v in sorted(breaks.items())) if breaks else "none")
    )
    if unreadable:
        print(
            "Unreadable lines (skipped): "
            + "; ".join(
                f"{f} line {', '.join(map(str, ns))}" for f, ns in sorted(unreadable.items())
            )
        )
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
