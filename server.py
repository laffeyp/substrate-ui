#!/usr/bin/env python3
"""substrate-ui read-API server — the production seam (build-order step 1).

Serves the REAL substrate read API over HTTP as JSON: `read_record` + the tested projections
(`run_graph`, `topology_graph`, `narration_summary`, `narrate`) + provenance
(`explain_producer` / `trace_ancestry`). The UI reads a record THROUGH this; it never
re-implements the runtime (replacing the prototype's embedded `data.js` + client-side
`engine.js` with the one tested Python source of truth).

Built on `substrate.api` for the READ SEAM (read_record + the projections — the api-faithful
core; product principle 8 / F-API-6 in spirit). The bundled-topology registry is imported only to
ENUMERATE the demo records (`record_path` / `names`); it is NOT the read path and isn't needed when
pointed at a live `runs/` dir. No new dependencies (stdlib http.server + msgspec, which substrate
ships). Records today are the generated `runs/*.record` + the bundled CI records; pointing this at
live `attach()` is the same read code with a different record source.

Run (from the substrate venv so `substrate` imports):
    cd substrate && uv run python ../substrate-ui/server.py
Then open http://127.0.0.1:8765/ .
"""

from __future__ import annotations

import asyncio
import threading
import time
import traceback
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

import msgspec
from msgspec import Struct
from substrate import api
from substrate.topologies import bundled

from builder import SpecError, build_from_spec
from demo_topologies import approval_event, resumable_topology

# paused demo record -> (topology to re-resolve, the external resume event). Resume reattaches to
# the record and injects the event so the resume Trigger fires the continuation (review #37: resume
# self-records like launch, on the same seq sequence; we resume a COPY so the template stays paused).
_RESUMABLE = {"demo_resumable": (resumable_topology, approval_event)}


# ── a deliberately SLOW launchable topology, so live-attach has something to watch grow ──────
class LiveTick(Struct, frozen=True):
    n: int


def _slow_topology() -> Any:
    async def ticker(_inp: Any) -> Any:
        for i in range(1, 7):
            await asyncio.sleep(0.5)  # ~3s total, so the console can follow it being written
            yield LiveTick(n=i)

    def topo(b: Any) -> None:
        b.producer_kind("ticker", schemas=[LiveTick], schema_version=1, start=ticker)
        b.initial("ticker")
        b.termination(api.threshold_count("LiveTick", 6))

    return topo


_EXTRA_TOPOS = {"live_demo": _slow_topology}  # launchable, alongside the bundled topologies
# run_name -> the launch thread. The server SPAWNED the run, so it alone knows if it's still alive:
# a launch whose thread is dead with no terminal RunFinalised has TORN — the authoritative signal
# that distinguishes "incomplete = live (still writing)" from "incomplete = torn (dead)" (review #36).
_LAUNCHES: dict[str, "threading.Thread"] = {}


def _is_live(name: str) -> bool:
    th = _LAUNCHES.get(name)
    if th is None:
        return False
    if th.is_alive():
        return True
    _LAUNCHES.pop(name, None)  # evict the dead thread (no unbounded growth on a long-lived server)
    return False

HOST, PORT = "127.0.0.1", 8765
WEB = Path(__file__).resolve().parent / "web"  # the static frontend
RUNS = Path(__file__).resolve().parent / "runs"  # generated/live records (failed/paused/broken demos)
_CT = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"}


def _record_path(name: str) -> Path | None:
    """Resolve a record name to a path: a generated/live record under runs/ first, else a bundled
    demo record. The production seam points runs/ at a live records directory."""
    local = RUNS / f"{name}.record"
    if local.exists():
        return local
    path = bundled.record_path(name)
    return path if path.exists() else None


def _record_names() -> list[str]:
    """The served records: the generated non-clean runs (runs/*.record — failed/paused/broken)
    first, then the bundled clean demos."""
    local = sorted(p.stem for p in RUNS.glob("*.record")) if RUNS.exists() else []
    return local + bundled.names()


def _builtins(obj: object) -> object:
    """msgspec Struct (frozen projection result) -> JSON-able builtins."""
    return msgspec.to_builtins(obj)


def _records_index() -> list[dict[str, object]]:
    """The record list for the rail: each record's real run-level status + a one-glance summary
    (so a broken/paused run is flagged in the list itself — §7.2)."""
    out: list[dict[str, object]] = []
    for name in _record_names():
        path = _record_path(name)
        if path is None:
            continue
        events = list(api.read_record(path))
        s = api.narration_summary(events)
        g = api.run_graph(events)
        run_id = next(
            (str((e.get("payload") or {}).get("run_id")) for e in events if e.get("kind") == "substrate.RunStarted"),
            "",
        )
        out.append(
            {
                "name": name,
                "run_id": run_id,
                "status": g.status,  # incomplete | paused | finalised | failed (the real run-level outcome)
                "final_reason": g.final_reason,
                "paused_on": g.paused_on,
                "resumable": name in _RESUMABLE,  # a paused run the UI can feed + continue
                "total_events": s.total_events,
                "producers_failed": s.producers_failed
                + s.input_build_failures
                + s.predicate_quarantines
                + s.invalid_emissions,
                "application_events": s.application_events,
            }
        )
    return out


def _io(events: list[dict[str, object]]) -> dict[str, object]:
    """The I/O surface, derived from the record (nothing invented, §7.1): INPUT = the seed the run
    ran on (the initial firing's resolved_input — often null for a build-parameterized topology);
    OUTPUTS = the application events as artifacts (each citing its seq); finalisation = the
    RunFinalised payload if any."""
    init = next(
        (e for e in events
         if e.get("kind") == "substrate.TriggerFired"
         and (e.get("payload") or {}).get("trigger_id") == "__initial__"),
        None,
    )
    seed = (init.get("payload") or {}).get("resolved_input") if init else None
    # the substrate's OTHER designated input channel: b.baseline() -> RunStarted.payload.baseline
    # ("fixtures, seeds, environment identifiers, so every record is interpretable from a known
    # baseline"). io must surface it, else a baseline-seeded run shows null input (review #34).
    started = next((e for e in events if e.get("kind") == "substrate.RunStarted"), None)
    baseline = (started.get("payload") or {}).get("baseline") if started else None
    outputs = [
        {"seq": e["seq"], "kind": e["kind"], "payload": e.get("payload")}
        for e in events
        if not str(e.get("kind", "")).startswith("substrate.")
    ]
    fin = next((e for e in events if e.get("kind") == "substrate.RunFinalised"), None)
    return {
        "input": seed,
        "baseline": baseline or None,
        "outputs": outputs,
        "finalisation": (fin.get("payload") or None) if fin else None,
    }


# route name -> function(events) -> JSON-able
_PROJECTIONS = {
    "events": lambda ev: ev,
    "run_graph": lambda ev: _builtins(api.run_graph(ev)),
    "topology_graph": lambda ev: _builtins(api.topology_graph(ev)),
    "summary": lambda ev: _builtins(api.narration_summary(ev)),
    "narrate": lambda ev: [_builtins(line) for line in api.narrate(ev)],
    "narrate_full": lambda ev: [_builtins(line) for line in api.narrate(ev, lifecycle=True)],
    "io": _io,
}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args: object) -> None:  # quiet
        pass

    def _send(self, code: int, body: bytes, ctype: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _json(self, obj: object, code: int = 200) -> None:
        self._send(code, msgspec.json.encode(obj), "application/json")

    def _error(self, code: int, message: str) -> None:
        self._json({"error": message}, code)

    def do_POST(self) -> None:  # noqa: N802 — the thin control layer (launch + resume only, per ruling C1)
        path = unquote(urlparse(self.path).path)
        try:
            if path == "/api/launch":
                self._launch(parse_qs(urlparse(self.path).query))
                return
            if path == "/api/resume":
                self._resume(parse_qs(urlparse(self.path).query))
                return
            if path == "/api/validate":
                self._validate()
                return
            if path == "/api/build":
                self._build()
                return
            self._error(404, f"no control endpoint {path!r}")
        except Exception as exc:  # noqa: BLE001
            self._error(500, f"{type(exc).__name__}: {exc}")

    def _launch(self, q: dict[str, list[str]]) -> None:
        """Launch a bundled topology to a fresh record. The launch IS the recorded control action —
        the run opens with substrate.RunStarted at seq 0 (§7.7: control is a thin layer, and every
        control action is itself an event). Runs to a terminal, then the console reads the record."""
        name = q.get("topology", [""])[0]
        factory = bundled.BUNDLED.get(name) or _EXTRA_TOPOS.get(name)
        if factory is None:
            self._error(404, f"unknown topology {name!r}")
            return
        # name the record by a UNIQUE id — never an in-memory counter (a counter resets on restart
        # and collides with a prior on-disk record; clobbering it is silent data loss on a durable
        # artifact — review #35). BACKGROUND the run (a daemon thread, fresh loop) so the request
        # returns immediately — a synchronous launch can't deliver live-attach, and a slow/real run
        # would block the request for its whole duration (review #35 finding 3).
        run_name = f"launch_{name}_{uuid.uuid4().hex[:12]}"
        root = RUNS / f"{run_name}.record"
        th = threading.Thread(target=lambda: asyncio.run(api.Runtime(root).run(factory())), daemon=True)
        _LAUNCHES[run_name] = th  # track liveness — a dead thread w/o a terminal = torn (review #36)
        th.start()
        # wait only until RunStarted is on the record, so the console can immediately read + follow it.
        for _ in range(80):
            try:
                if root.exists() and any(e.get("kind") == "substrate.RunStarted" for e in api.read_record(root)):
                    break
            except Exception:  # noqa: BLE001 - record mid-write; keep waiting
                pass
            time.sleep(0.05)
        status = api.run_graph(root).status if root.exists() else "incomplete"
        self._json({"name": run_name, "status": status, "launched": name})

    def _resume(self, q: dict[str, list[str]]) -> None:
        """Resume a paused run (ruling C1: the other control). Resume a COPY (unique id) so the
        paused template stays re-resumable: reattach to the copy persistent-bus, inject the external
        event -> the resume Trigger fires the continuation, on the SAME seq sequence (self-records,
        like launch). Backgrounded + tracked in _LAUNCHES so liveness/torn detection works the same.

        CAVEAT (review #38): resuming a COPY is a DEMO affordance — it keeps the fixture re-runnable.
        PRODUCTION resume is single-shot: a real pause is consumed IN PLACE (you cannot approve the
        same gate twice). Don't read this as the resume contract — it's so the demo can be replayed."""
        name = q.get("record", [""])[0]
        spec = _RESUMABLE.get(name)
        src = _record_path(name)
        if spec is None or src is None:
            self._error(404, f"{name!r} is not a resumable record")
            return
        topo, ev_factory = spec
        import shutil

        resume_name = f"resume_{name}_{uuid.uuid4().hex[:12]}"
        root = RUNS / f"{resume_name}.record"
        shutil.copytree(src, root)
        for lock in root.rglob(".lock"):
            lock.unlink()
        th = threading.Thread(
            target=lambda: asyncio.run(
                api.Runtime(root, persistent=True).resume(topo, resume_event=ev_factory())
            ),
            daemon=True,
        )
        _LAUNCHES[resume_name] = th
        th.start()
        for _ in range(80):  # the continuation is fast; wait briefly for a terminal
            try:
                if api.run_graph(root).status in ("finalised", "failed"):
                    break
            except Exception:  # noqa: BLE001 - mid-write
                pass
            time.sleep(0.05)
        self._json({"name": resume_name, "status": api.run_graph(root).status, "resumed": name})

    def _body(self) -> dict[str, object]:
        length = int(self.headers.get("Content-Length", 0))
        return msgspec.json.decode(self.rfile.read(length)) if length else {}

    def _validate(self) -> None:
        """The Studio's live validation: does the authored spec build? (static b.build() — the
        'allowable ways' = exactly what the runtime would accept; rejects bad wiring before a run)."""
        try:
            topo = build_from_spec(self._body())
            b = api.TopologyBuilder()
            topo(b)
            b.build()
        except (SpecError, api.RegistrationError) as exc:
            self._json({"valid": False, "error": str(exc)})
            return
        except Exception as exc:  # noqa: BLE001 - any spec malformation -> a clean invalid, never a crash
            self._json({"valid": False, "error": f"{type(exc).__name__}: {exc}"})
            return
        self._json({"valid": True})

    def _build(self) -> None:
        """Build & launch: translate the authored spec into a REAL topology and RUN it — the run
        opens with substrate.RunStarted (the authored topology becomes a genuine recorded run; the
        Studio's 'one act that causes things'). Backgrounded + tracked like launch (§7.7)."""
        try:
            spec = self._body()
            topo = build_from_spec(spec)
            b = api.TopologyBuilder()
            topo(b)
            b.build()  # validate the wiring before running
        except (SpecError, api.RegistrationError) as exc:
            self._error(400, str(exc))
            return
        except Exception as exc:  # noqa: BLE001
            self._error(400, f"{type(exc).__name__}: {exc}")
            return
        name = str(spec.get("name") or "authored")
        run_name = f"build_{name}_{uuid.uuid4().hex[:12]}"
        root = RUNS / f"{run_name}.record"
        th = threading.Thread(target=lambda: asyncio.run(api.Runtime(root).run(topo)), daemon=True)
        _LAUNCHES[run_name] = th
        th.start()
        # authored stub topologies are deterministic + fast — wait briefly for a TERMINAL so the
        # build result can be honest about which authored Triggers actually fired (review #39).
        g = None
        for _ in range(80):  # up to ~4s
            try:
                if root.exists():
                    g = api.run_graph(root)
                    if g.status != "incomplete":
                        break
            except Exception:  # noqa: BLE001 - record not yet readable (pre-RunStarted)
                pass
            time.sleep(0.05)
        out: dict[str, object] = {"name": run_name, "status": g.status if g else "incomplete", "built": name}
        if g is not None:
            authored = [t["id"] for t in spec.get("triggers", [])]
            fired = {i.trigger_id for i in g.instances if i.trigger_id}
            unfired = [t for t in authored if t not in fired]
            if unfired:
                out["unfired_triggers"] = unfired  # authored Triggers whose Predicate never matured
        self._json(out)

    def do_GET(self) -> None:  # noqa: N802
        path = unquote(urlparse(self.path).path)
        try:
            if path == "/api/records":
                self._json(_records_index())
                return
            if path == "/api/topologies":
                self._json(bundled.names() + list(_EXTRA_TOPOS))  # the launchable topologies
                return
            if path == "/api/diff":
                self._diff(parse_qs(urlparse(self.path).query))
                return
            if path.startswith("/api/records/"):
                self._api_record(path[len("/api/records/") :])
                return
            self._static(path)
        except Exception as exc:  # noqa: BLE001 - surface any read error as JSON, never a crash
            self._error(500, f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}")

    def _api_record(self, rest: str) -> None:
        parts = rest.split("/")
        name = parts[0]
        record = _record_path(name)
        if record is None:
            self._error(404, f"no record {name!r}")
            return
        events = list(api.read_record(record))
        if len(parts) == 1:  # the whole run: events + the manifest + the run-level status
            manifest = next(
                ((e.get("payload") or {}).get("topology") for e in events if e.get("kind") == "substrate.RunStarted"),
                None,
            )
            g = api.run_graph(events)
            self._json({"name": name, "status": g.status, "events": events, "manifest": manifest})
            return
        sub = parts[1]
        if sub == "explain" and len(parts) >= 3:
            self._explain(name, events, parts[2])
            return
        proj = _PROJECTIONS.get(sub)
        if proj is None:
            self._error(404, f"unknown projection {sub!r}")
            return
        out = proj(events)
        if sub == "run_graph" and isinstance(out, dict):
            out["live"] = _is_live(name)  # server-authoritative liveness: is the launch still writing?
        self._json(out)

    def _diff(self, q: dict[str, list[str]]) -> None:
        """first_divergence(a, b) — where two records split by seq, or D-8-equivalent (#30 Q-E1)."""
        a, b = q.get("a", [""])[0], q.get("b", [""])[0]
        pa, pb = _record_path(a), _record_path(b)
        if pa is None or pb is None:
            self._error(404, f"unknown record(s): {a!r} / {b!r}")
            return
        div = api.first_divergence(pa, pb)
        if div is None:
            self._json({"a": a, "b": b, "equivalent": True})
        else:
            self._json({"a": a, "b": b, "equivalent": False, "divergence": _builtins(div)})

    def _explain(self, name: str, events: list[dict[str, object]], producer: str) -> None:
        try:
            exp = api.explain_producer(events, producer)
            chain = api.trace_ancestry(events, producer)
        except (api.ProducerNotFound, api.SequenceOutOfRange) as exc:
            self._error(404, str(exc))
            return
        self._json({"explanation": _builtins(exp), "ancestry": [_builtins(e) for e in chain]})

    def _static(self, path: str) -> None:
        rel = "index.html" if path in ("", "/") else path.lstrip("/")
        target = (WEB / rel).resolve()
        if not str(target).startswith(str(WEB.resolve())) or not target.is_file():
            self._error(404, f"not found: {path}")
            return
        self._send(200, target.read_bytes(), _CT.get(target.suffix, "application/octet-stream"))


def main() -> None:
    WEB.mkdir(exist_ok=True)
    srv = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"substrate-ui read-API server on http://{HOST}:{PORT}  (records: {', '.join(bundled.names())})")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        srv.shutdown()


if __name__ == "__main__":
    main()
