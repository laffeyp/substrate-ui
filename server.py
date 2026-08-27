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
import os
import re
import subprocess
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
from substrate.topologies.tool_loop import tool_loop_topology
from substrate.topologies.tool_loop.delegate import make_delegate
from substrate.topologies.tool_loop.tools import full_suite

from builder import SpecError, build_from_spec
from demo_topologies import approval_event, resumable_topology
from substrate.reference import CliResponder, DeterministicResponder, OllamaResponder

# Sprint 214a: daemon-side session API. SessionRegistry is a MODULE-scope singleton
# so every handler sees the same catalog + per-session lock. Initialized in main()
# with a session_topology_factory closure that resolves a manifest's driver string
# to a Responder and rebuilds the session_topology per turn.
_SESSION_REGISTRY: Any = None


def _daemon_driver_resolver(name: str) -> Any:
    """Daemon-side resolver: `deterministic` → seeded stub; `claude` / `gemini` →
    CliResponder; anything else → OllamaResponder (a real local or `:cloud` tag).
    Sprint 213a's `_default_model_resolver` in substrate ships a smaller default
    without CLI knowledge; the daemon knows more, so it wraps.
    """
    if name == "deterministic":
        return DeterministicResponder(seed=0)
    if name == "claude":
        return CliResponder(["claude", "-p"], name="claude")
    if name == "gemini":
        return CliResponder(["gemini", "-p"], name="gemini")
    return OllamaResponder(model=name, timeout=300.0)


def _build_session_topology_from_manifest(manifest: Any) -> Any:
    """The `session_topology_factory` closure the SessionRegistry calls per turn.
    Reconstructs the session_topology from a manifest's persistent fields —
    driver string, workspace, seed, session_id. The daemon binds this at boot.
    """
    from substrate.topologies.session import session_topology
    from substrate.topologies.session.transcript import resolve_driver_context_tokens
    from substrate.topologies.tool_loop.tools import full_suite

    responder = _daemon_driver_resolver(manifest.driver)
    return session_topology(
        driver=responder,
        driver_name=manifest.driver,
        driver_context_tokens=resolve_driver_context_tokens(manifest.driver, responder),
        seed=manifest.seed,
        tools=full_suite(Path(manifest.workspace)),
        per_turn="",
        max_turns=200,
        turn_max_steps=24,
        session_id=manifest.session_id,
        workspace_path=manifest.workspace,
        record_root=Path(manifest.record_root),
        script=None,
    )


def _responder_for(spec: dict[str, object]) -> object:
    """The Responder a model-backed authored topology runs against: 'deterministic' (CI mode, pure +
    seeded — the default; no network, replay-stable) or 'ollama' (a real local LLM; loud failure if
    Ollama is not running — never a silent stub)."""
    if str(spec.get("responder") or "deterministic").lower() == "ollama":
        return OllamaResponder(model=str(spec.get("model_name") or "llama3.2"), timeout=300.0)
    return DeterministicResponder(seed=int(spec.get("seed", 0)))  # type: ignore[arg-type]


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
            await asyncio.sleep(
                0.5
            )  # ~3s total, so the console can follow it being written
            yield LiveTick(n=i)

    def topo(b: Any) -> None:
        b.producer_kind("ticker", schemas=[LiveTick], schema_version=1, start=ticker)
        b.initial("ticker")
        b.termination(api.threshold_count("LiveTick", 6))

    return topo


_EXTRA_TOPOS = {
    "live_demo": _slow_topology
}  # launchable, alongside the bundled topologies
# run_name -> the launch thread. The server SPAWNED the run, so it alone knows if it's still alive:
# a launch whose thread is dead with no terminal RunFinalised has TORN — the authoritative signal
# that distinguishes "incomplete = live (still writing)" from "incomplete = torn (dead)" (review #36).
_LAUNCHES: dict[str, "threading.Thread"] = {}
MAX_LIVE_RUNS = (
    8  # concurrency cap: a POST flood can't spawn unbounded run threads (security-3)
)


def _is_live(name: str) -> bool:
    th = _LAUNCHES.get(name)
    if th is None:
        return False
    if th.is_alive():
        return True
    _LAUNCHES.pop(
        name, None
    )  # evict the dead thread (no unbounded growth on a long-lived server)
    return False


def _agent_params(q: dict[str, list[str]]) -> tuple[bool, int, float]:
    """(think, max_tokens, timeout) from the request; max_tokens 0 = uncapped."""
    think = q.get("think", ["false"])[0].lower() in ("1", "true", "on")
    max_tokens = int(q.get("max_tokens", ["0"])[0] or 0)
    timeout = float(q.get("timeout", ["300"])[0] or 300)
    return think, max_tokens, timeout


def _agent_models() -> dict[str, object]:
    """The drivers the terminal can pick: local Ollama models (read live) + the CLI presets
    (claude/gemini) + the CI stand-in. Ollama tags are best-effort (empty if the daemon is down — the
    UI still offers the CLI + deterministic). The default is the biggest local OSS model if present."""
    import urllib.request as _u

    ollama: list[str] = []
    try:
        with _u.urlopen("http://localhost:11434/api/tags", timeout=2) as r:  # noqa: S310 - localhost
            tags = msgspec.json.decode(r.read())
        ollama = sorted(
            str(m.get("name", "")) for m in tags.get("models", []) if m.get("name")
        )
    except Exception:  # noqa: BLE001 — no ollama / daemon down: still offer claude/gemini/deterministic
        ollama = []
    # Default to a VERIFIED AGENTIC model, not the biggest coder. The agency assay (RESEARCH R-16/R-17)
    # found the top coder qwen3-coder:480b WRITE-SPINS — it is the worst agent — so shipping it as the
    # default is a bug. Prefer thinking+tools models that self-verify (write->run->check), scored
    # agency 100: kimi/glm/nemotron/deepseek-v4-pro. Fall back to any local model, else deterministic.
    prefer = [
        "kimi-k2.6:cloud",
        "glm-5.1:cloud",
        "nemotron-3-super:cloud",
        "deepseek-v4-pro:cloud",
    ]
    default = next(
        (m for m in prefer if m in ollama), ollama[0] if ollama else "deterministic"
    )
    return {
        "models": [*ollama, "claude", "gemini", "deterministic"],
        "cli": ["claude", "gemini"],
        "default": default,
    }


HOST, PORT = (
    os.environ.get("SUBSTRATE_UI_HOST", "127.0.0.1"),
    int(os.environ.get("SUBSTRATE_UI_PORT", "8765")),
)
# Static frontend: Vite builds web/*.ts + web/*.html to web/dist/. If dist/ exists, serve from
# there (production shape); otherwise fall back to web/ (transitional — the source-level index.html
# won't load its <script type="module" src="./app.ts"> without the Vite runtime).
_WEB_SRC = Path(__file__).resolve().parent / "web"
_WEB_DIST = _WEB_SRC / "dist"
WEB = _WEB_DIST if _WEB_DIST.is_dir() else _WEB_SRC
TERMINAL_V1 = Path(__file__).resolve().parent / "terminal-v1" / "web"  # sub-project (A10) — currently empty; round-1 archived to _deprecated/terminal-v1-round1/
RUNS = (
    Path(__file__).resolve().parent / "runs"
)  # generated/live records (failed/paused/broken demos)
# per-conversation agent workspaces — a DEDICATED session dir, never the server cwd (a scribble-in-the-
# repo footgun the cockpit hit live). A bare `?workspace=<name>` resolves under here; an absolute path
# is a project the user picked. Git-worktree-per-session isolation is the next step (Galley/Sculptor).
_SESSIONS_BASE = Path.home() / ".substrate" / "sessions"


def _session_worktree(repo: Path, session_id: str) -> tuple[Path, str]:
    """Git-worktree-per-session isolation (Galley/Sculptor pattern, from the research): a session
    driven against a REPO operates in its own worktree — a checkout on a fresh branch
    `substrate/<session>` at `~/.substrate/sessions/wt/<repo>-<session>` — so the agent works ADJACENT
    to your repo, on a diffable branch, without touching your working tree, and parallel sessions do
    not collide. Idempotent (reuse the worktree if it exists). Raises if `repo` is not a git repo."""
    repo = repo.expanduser().resolve()
    if not (repo / ".git").exists():
        raise ValueError(f"{repo} is not a git repository")
    wt = _SESSIONS_BASE / "wt" / f"{repo.name}-{session_id}"
    branch = f"substrate/{session_id}"
    if wt.exists():
        return wt, branch
    wt.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(  # -B reuses/creates the branch; worktree off HEAD
        ["git", "-C", str(repo), "worktree", "add", "-B", branch, str(wt), "HEAD"],
        check=True,
        capture_output=True,
        text=True,
    )
    return wt, branch


def _worktree_diff(wt: Path) -> dict[str, object]:
    """What the agent CHANGED in a session worktree — the 'show me what it did' half of B. `git diff`
    including new files (intent-to-add), plus the changed-file list. Raises if not a git worktree."""
    wt = Path(wt).expanduser().resolve()
    if not (wt / ".git").exists():
        raise ValueError(f"{wt} is not a git worktree")
    subprocess.run(  # intent-to-add so write_file'd NEW files show in the diff too
        ["git", "-C", str(wt), "add", "-A", "--intent-to-add"], check=False, capture_output=True
    )
    diff = subprocess.run(
        ["git", "-C", str(wt), "diff"], capture_output=True, text=True
    ).stdout
    names = subprocess.run(
        ["git", "-C", str(wt), "diff", "--name-status"], capture_output=True, text=True
    ).stdout
    return {"diff": diff, "files": names.strip().splitlines()}


_SESSION_PREFIXES = (
    "launch_",
    "build_",
    "resume_",
)  # hash-suffixed session runs (prunable; vs the stable demo_* fixtures)
_CT = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
}


_SAFE_RECORD_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")


def _record_path(name: str) -> Path | None:
    """Resolve a record name to a path: a generated/live record under runs/ first, else a bundled
    demo record. The production seam points runs/ at a live records directory. A record name is a
    flat identifier — reject anything with a path separator or `..` so a request cannot read outside
    runs/ (a traversal like `../../etc/x`)."""
    if not _SAFE_RECORD_NAME.match(name) or ".." in name:
        return None
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


def _resolve_child_name(path_str: str) -> str | None:
    """Given a delegate ToolResult's `child_root` (an absolute path to a `.record` dir), return the
    SERVED record name if that path is one of the records this server serves, else None. It MATCHES the
    path against the served set — it never READS the arbitrary path — so the record-navigation stays
    `runs/`-only and the traversal-safety posture holds. A real cockpit child in a session workspace is
    not served, so it resolves to None (the UI shows it display-only rather than as a dead link)."""
    if not path_str:
        return None
    try:
        target = Path(path_str).resolve()
    except (OSError, ValueError):
        return None
    for name in _record_names():
        p = _record_path(name)
        if p is not None and p.resolve() == target:
            return name
    return None


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
            (
                str((e.get("payload") or {}).get("run_id"))
                for e in events
                if e.get("kind") == "substrate.RunStarted"
            ),
            "",
        )
        out.append(
            {
                "name": name,
                "run_id": run_id,
                "status": g.status,  # incomplete | paused | finalised | failed (the real run-level outcome)
                "final_reason": g.final_reason,
                "paused_on": g.paused_on,
                "resumable": name
                in _RESUMABLE,  # a paused run the UI can feed + continue
                "total_events": s.total_events,
                "producers_failed": s.producers_failed
                + s.input_build_failures
                + s.predicate_quarantines
                + s.invalid_emissions,
                "application_events": s.application_events,
                # a prunable session run is hash-suffixed (launch_/build_/resume_); bundled demos +
                # the named demo_* fixtures are stable "demos" (kept by the prune).
                "source": "run" if name.startswith(_SESSION_PREFIXES) else "demo",
            }
        )
    return out


def _io(events: list[dict[str, object]]) -> dict[str, object]:
    """The I/O surface, derived from the record (nothing invented, §7.1): INPUT = the seed the run
    ran on (the initial firing's resolved_input — often null for a build-parameterized topology);
    OUTPUTS = the application events as artifacts (each citing its seq); finalisation = the
    RunFinalised payload if any."""
    init = next(
        (
            e
            for e in events
            if e.get("kind") == "substrate.TriggerFired"
            and (e.get("payload") or {}).get("trigger_id") == "__initial__"
        ),
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
    "narrate_full": lambda ev: [
        _builtins(line) for line in api.narrate(ev, lifecycle=True)
    ],
    "io": _io,
}


# ── the assay seam: a results file (arms x cases x trials) read as ONE arm comparison ──────────
# Read-only projections, like the record ones, but at the ABOVE-a-run altitude: many records compared.
BENCH_RESULTS = Path(
    os.environ.get(
        "BENCH_RESULTS",
        str(
            Path(__file__).resolve().parent.parent
            / "substrate"
            / "process"
            / "bench_results"
        ),
    )
)


def _assays_index() -> list[dict[str, object]]:
    """The assay rail: each cells file + its provenance (fingerprint/models/margin/trials) + counts."""
    from substrate.assay.cells import read_meta, read_rows

    out: list[dict[str, object]] = []
    if not BENCH_RESULTS.exists():
        return out
    for cells in sorted(BENCH_RESULTS.glob("*.jsonl")):
        try:
            meta, rows = read_meta(cells), read_rows(cells)
        except Exception:  # noqa: BLE001 — a malformed/partial file shows empty, never crashes the rail
            meta, rows = {}, []
        out.append(
            {
                "name": cells.stem,
                "fingerprint": meta.get("config_fp"),
                "strong_model": meta.get("strong_model"),
                "weak_models": meta.get("weak_models"),
                "margin": meta.get("margin"),
                "trials": meta.get("trials"),
                "n_cells": len(rows),
                "arms": sorted({str(r.get("arm")) for r in rows}),
            }
        )
    return out


# build_report runs a 5000-sample bootstrap (~8s on 71×10 cells), so cache by (name, file mtime): a
# DONE run computes once then serves instantly; a LIVE run's file mtime changes as it grows, so it
# recomputes only when there is new data — never stale, never recomputing the unchanged.
_ASSAY_CACHE: dict[str, tuple[float, dict[str, object]]] = {}


def _assay_report(name: str) -> dict[str, object]:
    """The arm matrix: report_from_cells -> the per-arm read (both currencies, deltas, margin-verdict)."""
    from substrate.assay.cells import report_from_cells

    cells = BENCH_RESULTS / f"{name}.jsonl"
    if not _SAFE_RECORD_NAME.match(name) or not cells.exists():
        return {"error": f"no assay {name!r}"}
    mtime = cells.stat().st_mtime
    cached = _ASSAY_CACHE.get(name)
    if cached and cached[0] == mtime:
        return cached[1]
    report, meta = report_from_cells(cells)
    result: dict[str, object] = {
        "name": name,
        "meta": meta,
        "report": _builtins(report),
    }
    _ASSAY_CACHE[name] = (mtime, result)
    return result


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

    def _origin_ok(self) -> bool:
        # CSRF defence on the state-changing POSTs: a browser request carries an Origin; require it to
        # match the Host it arrived on (same-origin). A cross-site form or a DNS-rebound page carries a
        # foreign Origin -> rejected. Non-browser clients (curl, the test runner) send no Origin.
        origin = self.headers.get("Origin")
        if not origin:
            return True
        return urlparse(origin).netloc == self.headers.get("Host", "")

    def _at_run_capacity(self) -> bool:
        # cap concurrent spawned runs so an unauthenticated POST flood can't exhaust threads/memory.
        return sum(1 for t in _LAUNCHES.values() if t.is_alive()) >= MAX_LIVE_RUNS

    def do_POST(self) -> None:  # noqa: N802 — the thin control layer (launch + resume only, per ruling C1)
        path = unquote(urlparse(self.path).path)
        if not self._origin_ok():
            self._error(
                403, "cross-origin request rejected (Origin does not match Host)"
            )
            return
        try:
            if path == "/api/session":
                self._session_create()
                return
            if path.startswith("/api/session/") and path.endswith("/turn"):
                session_id = path[len("/api/session/") : -len("/turn")]
                self._session_turn(session_id)
                return
            if path == "/api/launch":
                self._launch(parse_qs(urlparse(self.path).query))
                return
            if path == "/api/agent":
                self._agent(parse_qs(urlparse(self.path).query))
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
            if path == "/api/runs/clear":
                self._clear_runs()
                return
            self._error(404, f"no control endpoint {path!r}")
        except Exception as exc:  # noqa: BLE001
            self._error(500, f"{type(exc).__name__}: {exc}")

    def _clear_runs(self) -> None:
        """Prune the accumulating session runs under runs/ — the hash-suffixed launch_/build_/resume_
        records. Bundled demos live in the topology packages (not runs/) and the named demo_* fixtures
        are KEPT; only session runs are deleted. Skip a record a live launch thread is still writing."""
        import shutil

        live = {name for name, t in _LAUNCHES.items() if t.is_alive()}
        removed, kept = 0, 0
        if RUNS.exists():
            for rec in sorted(RUNS.glob("*.record")):
                if not rec.stem.startswith(_SESSION_PREFIXES) or rec.stem in live:
                    kept += 1
                    continue
                try:
                    shutil.rmtree(rec)
                    removed += 1
                except OSError:
                    kept += 1
        self._json({"removed": removed, "kept": kept})

    def _read_json_body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            data = msgspec.json.decode(raw)
        except Exception as exc:  # noqa: BLE001
            raise ValueError(f"POST body is not JSON: {type(exc).__name__}: {exc}") from exc
        return data if isinstance(data, dict) else {}

    def _session_create(self) -> None:
        """Sprint 214a: POST /api/session. Body:
            {"driver": "deterministic", "name": "reviewer"?, "workspace": "/path"?,
             "workspace_shape": "flat"?, "seed": "…"?, "bundle": null?}
        Registers the session via SessionRegistry.create, returns
            {"session_id", "name", "record", "workspace_shape"}.
        409 on colliding name.
        """
        if _SESSION_REGISTRY is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        try:
            body = self._read_json_body()
        except ValueError as exc:
            self._error(400, str(exc))
            return
        driver = str(body.get("driver") or "deterministic")
        name = body.get("name")
        workspace = str(body.get("workspace") or str(_SESSIONS_BASE / "default"))
        workspace_shape = str(body.get("workspace_shape") or "flat")
        # Piece-B review finding 6: TECH-SPEC §4 names this field `seed_text`;
        # the earlier draft read `seed` only, so a client following the spec
        # silently sent nothing. Both names accepted; the spec wins on writes.
        seed = str(body.get("seed_text") or body.get("seed") or "")
        bundle = body.get("bundle")
        session_id = f"s_{uuid.uuid4().hex[:24]}"
        try:
            manifest = _SESSION_REGISTRY.create(
                session_id=session_id,
                name=str(name) if name is not None else None,
                driver=driver,
                workspace=workspace,
                workspace_shape=workspace_shape,
                bundle=str(bundle) if bundle is not None else None,
                seed=seed,
            )
        except Exception as exc:
            # NameCollision carries existing_session_id per sprint 211.
            if type(exc).__name__ == "NameCollision":
                self._json(
                    {
                        "error": "name already taken",
                        "existing_session_id": getattr(exc, "existing_session_id", None),
                    },
                    409,
                )
                return
            self._error(500, f"{type(exc).__name__}: {exc}")
            return
        self._json(
            {
                "session_id": manifest.session_id,
                "name": manifest.name,
                "record": manifest.record_root,
                "workspace_shape": manifest.workspace_shape,
            }
        )

    def _session_turn(self, session_id: str) -> None:
        """Sprint 214a: POST /api/session/<id>/turn. Body:
            {"text": "hello"}
        Runs one turn via SessionRegistry.turn_sync (the same seam the delegate
        wire uses, per piece-C review finding 3's fix). Per-session threading.Lock
        serializes concurrent callers. Returns {status, final_seq?, error?}.
        """
        if _SESSION_REGISTRY is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        manifest = _SESSION_REGISTRY.get(session_id)
        if manifest is None:
            self._error(404, f"unknown session_id {session_id!r}")
            return
        try:
            body = self._read_json_body()
        except ValueError as exc:
            self._error(400, str(exc))
            return
        text = str(body.get("text") or "")
        if not text:
            self._error(400, "POST /api/session/<id>/turn requires body {'text': '...'}")
            return
        # Piece-B review finding 7: TECH-SPEC §4 names `seq` in the response
        # as the record's tail cursor at turn start. Read before the turn fires
        # so a client that lost the previous response can resume from a known
        # boundary. The value is the caller's view; two concurrent callers may
        # see the same seq — that is fine, the lock serializes what follows.
        record_root_pre = Path(manifest.record_root)
        seq_at_start = -1
        if record_root_pre.exists():
            try:
                for env in api.read_record(record_root_pre):
                    seq_at_start = max(seq_at_start, int(env.get("seq", -1)))
            except Exception:  # noqa: BLE001 — mid-write; a pre-turn snapshot may skew
                seq_at_start = -1
        # Sprint 214a: compute next turn_index INSIDE the per-session lock via
        # `resume_event_builder`, so two concurrent POST /turn calls see two
        # distinct tail states rather than the same pre-lock snapshot.
        from substrate.topologies.session import UserMessage as SessionUserMessage

        def _build(_manifest: Any, record_root_locked: Path) -> Any:
            next_turn_index = 0
            if record_root_locked.exists():
                try:
                    for env in api.read_record(record_root_locked):
                        if env.get("kind") == "UserMessage":
                            payload = env.get("payload") or {}
                            if isinstance(payload, dict) and "turn_index" in payload:
                                next_turn_index = int(payload["turn_index"]) + 1
                except Exception:  # noqa: BLE001
                    next_turn_index = 0
            return SessionUserMessage(
                text=text,
                turn_index=next_turn_index,
                assembled_prompt=text,
                slash_source="daemon",
            )

        try:
            updated_manifest, root_after = _SESSION_REGISTRY.turn_sync(
                session_id,
                resume_event_builder=_build,
                timeout_seconds=600.0,
            )
        except Exception as exc:
            if type(exc).__name__ == "SessionEndedMidTurn":
                self._json(
                    {"status": "ended", "error": "session_ended_mid_delegate"}, 410
                )
                return
            self._error(500, f"{type(exc).__name__}: {exc}")
            return
        # Return the record's tail seq so the caller can page /events from there.
        final_seq = -1
        for env in api.read_record(root_after):
            final_seq = max(final_seq, int(env.get("seq", -1)))
        self._json(
            {
                "seq": seq_at_start,
                "status": updated_manifest.status,
                "final_seq": final_seq,
                "record": str(root_after),
            }
        )

    def _session_list(self) -> None:
        """Sprint 214b: GET /api/session. Returns `{"live": [...], "parked": [...],
        "ended": [...], "interrupted": [...]}` — every manifest bucketed by status.
        The daemon's boot scan already reclassified each manifest against the
        record's own tail (sprint 211 + review finding 5 fold); this handler just
        reads the in-memory catalog.
        """
        if _SESSION_REGISTRY is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        buckets: dict[str, list[dict[str, Any]]] = {
            "live": [],
            "parked": [],
            "ended": [],
            "interrupted": [],
        }
        for manifest in _SESSION_REGISTRY.list_all():
            payload = {
                "session_id": manifest.session_id,
                "name": manifest.name,
                "driver": manifest.driver,
                "workspace": manifest.workspace,
                "workspace_shape": manifest.workspace_shape,
                "record": manifest.record_root,
                "created_at": manifest.created_at,
                "bundle": manifest.bundle,
            }
            key = "live" if manifest.status == "running" else manifest.status
            if key in buckets:
                buckets[key].append(payload)
        self._json(buckets)

    def _session_by_name(self, name: str) -> None:
        """Sprint 214b: GET /api/session/by-name/<name>. Returns `{"session_id":
        "..."}` or 404 with `{"error": "unknown name"}`. Names are case-sensitive.
        """
        if _SESSION_REGISTRY is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        session_id = _SESSION_REGISTRY.by_name(name)
        if session_id is None:
            self._error(404, f"unknown session name: {name!r}")
            return
        self._json({"session_id": session_id, "name": name})

    def _session_delete(self, session_id: str) -> None:
        """Sprint 214b: DELETE /api/session/<id>. Removes the manifest + by-name
        entry + per-session lock. **The record directory stays** — SDD hard rule
        12 says the audit trail is the work, and the record is the durable
        evidence of what the session did. Returns 204 on success; 404 on unknown
        session_id. A subsequent POST /turn on that id returns 404 (the manifest
        is gone) — piece B's contract for a deleted session.
        """
        if _SESSION_REGISTRY is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        try:
            _SESSION_REGISTRY.delete(session_id)
        except KeyError:
            self._error(404, f"unknown session_id {session_id!r}")
            return
        # Piece-B review finding 16: HTTP 204 must not carry a body; a missing
        # Content-Length on a keep-alive HTTP/1.1 connection leaves some clients
        # reading until close and stalling the pipelined session. Explicit zero.
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _session_events(self, session_id: str, since_seq: int) -> None:
        """Sprint 214c: GET /api/session/<id>/events?since_seq=N. Server-Sent
        Events stream of the session's record. Each envelope arrives as
        `data: <json>\\n\\n`. The stream stays open across turn pauses — the
        session record keeps growing as `Runtime.resume` fires — and closes
        when `substrate.RunFinalised` lands OR the client disconnects.

        Filtering by `since_seq` lets a reconnecting client resume from a known
        cursor without re-reading the whole record. Default `since_seq=-1`
        means "from the start."

        Runs in the thread the ThreadingHTTPServer dispatched for this GET;
        blocking `api.attach(record_root).read_new()` polls the record filesystem
        directly. Broken pipe (`OSError` on `self.wfile.write`) terminates the
        loop cleanly — the SSE contract lets either side hang up.
        """
        if _SESSION_REGISTRY is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        manifest = _SESSION_REGISTRY.get(session_id)
        if manifest is None:
            self._error(404, f"unknown session_id {session_id!r}")
            return
        record_root = Path(manifest.record_root)
        # SSE headers per the WHATWG spec: text/event-stream, no cache, keep-alive.
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Accel-Buffering", "no")  # nginx/proxy hint if fronted
        self.end_headers()
        try:
            follower = api.attach(record_root)
            # Emit backlog first (frames already on the record past since_seq),
            # then poll for new growth. The follower keeps its own segment
            # cursors so we never re-emit frames as we cross segment rolls.
            finalised = False
            while not finalised:
                for env in follower.read_new():
                    seq = int(env.get("seq", -1))
                    # Piece-B review finding 2: check the finalisation kind
                    # BEFORE the seq filter, else a client reconnecting with
                    # `since_seq >= runfinalised_seq` sees every envelope
                    # discarded, `finalised` never flips, and the loop polls
                    # forever. `LiveRecord.follow(until_finalised=True)` gets
                    # this ordering right; the manual reimplementation had not.
                    is_final = env.get("kind") == "substrate.RunFinalised"
                    if is_final:
                        finalised = True
                    if seq <= since_seq and not is_final:
                        continue
                    # Piece-B review finding 15: msgspec.json.encode returns
                    # bytes; the earlier .decode()+concat+.encode() shape was
                    # three needless round trips per envelope.
                    frame = b"data: " + msgspec.json.encode(env) + b"\n\n"
                    self.wfile.write(frame)
                    self.wfile.flush()
                    if is_final:
                        break
                if finalised:
                    break
                # Poll cadence: match LiveRecord's own 500ms default rather than
                # busy-waiting. A finalised or ended session breaks the loop above.
                time.sleep(0.2)
        except (BrokenPipeError, ConnectionResetError, OSError):
            # Client hung up mid-stream. Every SSE server has to tolerate this.
            return

    def _launch(self, q: dict[str, list[str]]) -> None:
        """Launch a bundled topology to a fresh record. The launch IS the recorded control action —
        the run opens with substrate.RunStarted at seq 0 (§7.7: control is a thin layer, and every
        control action is itself an event). Runs to a terminal, then the console reads the record."""
        name = q.get("topology", [""])[0]
        factory = bundled.BUNDLED.get(name) or _EXTRA_TOPOS.get(name)
        if factory is None:
            self._error(404, f"unknown topology {name!r}")
            return
        if self._at_run_capacity():
            self._error(429, "too many concurrent runs; wait for some to finish")
            return
        # name the record by a UNIQUE id — never an in-memory counter (a counter resets on restart
        # and collides with a prior on-disk record; clobbering it is silent data loss on a durable
        # artifact — review #35). BACKGROUND the run (a daemon thread, fresh loop) so the request
        # returns immediately — a synchronous launch can't deliver live-attach, and a slow/real run
        # would block the request for its whole duration (review #35 finding 3).
        run_name = f"launch_{name}_{uuid.uuid4().hex[:12]}"
        root = RUNS / f"{run_name}.record"
        th = threading.Thread(
            target=lambda: asyncio.run(api.Runtime(root).run(factory())), daemon=True
        )
        _LAUNCHES[run_name] = (
            th  # track liveness — a dead thread w/o a terminal = torn (review #36)
        )
        th.start()
        # wait only until RunStarted is on the record, so the console can immediately read + follow it.
        for _ in range(80):
            try:
                if root.exists() and any(
                    e.get("kind") == "substrate.RunStarted"
                    for e in api.read_record(root)
                ):
                    break
            except Exception:  # noqa: BLE001 - record mid-write; keep waiting
                pass
            time.sleep(0.05)
        status = api.run_graph(root).status if root.exists() else "incomplete"
        self._json({"name": run_name, "status": status, "launched": name})

    def _agent(self, q: dict[str, list[str]]) -> None:
        """Launch a LIVE tool-using agent run — this is what the interactive terminal drives. With
        `model=ollama` (+ `name`, `task`) a real local LLM drives the FULL_SUITE tool loop toward the
        task; the default `model=deterministic` runs the pure calculator loop (fast, no network) so
        the console and CI can drive an agent with no Ollama. Backgrounded exactly like /api/launch —
        the console followLive's the record: the terminal streams the model turns + tool results as
        they land, and the graph/stream/scene animate. The agent run is itself a recorded run (the
        model->tool->model loop is on the log), replayable and inspectable like any other."""
        model = (q.get("model", ["deterministic"])[0] or "deterministic").lower()
        if self._at_run_capacity():
            self._error(429, "too many concurrent runs; wait for some to finish")
            return
        # the per-conversation WORKSPACE: the directory the agent's tools operate in (relative paths
        # + bash resolve there, absolute paths still go where named). This is ergonomics, not a jail.
        # Per-session workspace, NEVER the server cwd (review C-16 corrected a stale "launch dir" note):
        # an absolute `?workspace=` is a project the user picked; a bare name is a named session dir
        # under ~/.substrate/sessions/ (the client passes the conversation id so its turns share one
        # dir); absent -> a fresh adhoc session dir. Created if missing.
        ws_arg = q.get("workspace", [""])[0]
        wt_arg = q.get("worktree", [""])[
            0
        ]  # a repo path -> isolate this session in its own worktree
        session = (
            re.sub(r"[^A-Za-z0-9._-]", "-", ws_arg)[:40]
            or f"adhoc-{uuid.uuid4().hex[:8]}"
        )
        branch = ""
        if (
            wt_arg
        ):  # git-worktree-per-session: operate on a branch adjacent to the repo (B)
            try:
                workspace, branch = _session_worktree(Path(wt_arg), session)
            except Exception as exc:  # noqa: BLE001 — not a repo / git failed: fall back, surfaced
                workspace = _SESSIONS_BASE / session
                branch = f"(worktree failed: {type(exc).__name__})"
        elif ws_arg:
            p = Path(ws_arg).expanduser()
            workspace = p if p.is_absolute() else (_SESSIONS_BASE / session)
        else:
            workspace = _SESSIONS_BASE / session
        workspace.mkdir(parents=True, exist_ok=True)
        suite = full_suite(workspace)
        # W2.2 follow-on: give the cockpit agent a `delegate` tool. Its child RECORDS land as flat SERVED
        # runs/ records (child_record_root -> RUNS/<base>_cN.record) so the UI's delegated-child branch can
        # navigate to them; the child's tool WORKSPACE stays under the session workspace. Real-model
        # branches only (the deterministic calculator has no responder to hand a child).
        child_base = "delegate_child_" + uuid.uuid4().hex[:8]

        def _with_delegate(responder: object) -> dict[str, object]:
            return {
                **suite,
                "delegate": make_delegate(
                    responder=responder,  # type: ignore[arg-type]
                    root=workspace,
                    child_suite_factory=full_suite,
                    child_record_root=lambda n: RUNS / f"{child_base}_c{n}.record",
                ),
            }

        think, max_tokens, timeout = _agent_params(q)
        if model == "ollama":
            model_name = q.get("name", ["llama3.2:1b"])[0]
            task = q.get("task", [""])[0] or "Use the available tools to help."
            responder = OllamaResponder(
                model=model_name, think=think, max_tokens=max_tokens, timeout=timeout
            )
            topo = tool_loop_topology(
                model=responder,
                walkthrough=True,
                deterministic=False,
                tools=_with_delegate(responder),
                task=task,
                max_steps=24,
            )
            label = "agent_" + re.sub(r"[^A-Za-z0-9]+", "-", model_name.split(":")[0])
        elif model in ("claude", "gemini", "cli"):
            # a command-line model/agent drives the loop (CliResponder). `claude`/`gemini` are presets;
            # `cli` takes an arbitrary `?command=...`. Substrate provides the tools, so even a plain
            # prompt->text CLI (gemini) is a tool-using agent here. (gemini needs its own auth to run.)
            task = q.get("task", [""])[0] or "Use the available tools to help."
            preset = {"claude": ["claude", "-p"], "gemini": ["gemini", "-p"]}
            cmd = preset.get(model) or q.get("command", [""])[0].split()
            if not cmd:
                self._error(
                    400,
                    "cli agent needs a command (model=claude|gemini, or ?command=...)",
                )
                return
            responder = CliResponder(cmd, name=model, timeout=max(timeout, 600.0))
            topo = tool_loop_topology(
                model=responder,
                walkthrough=True,
                deterministic=False,
                tools=_with_delegate(responder),
                task=task,
                max_steps=24,
            )
            label = "agent_" + model
        else:
            topo = (
                tool_loop_topology()
            )  # deterministic calculator loop — CI-safe, no network
            label = "agent_calc"
        run_name = f"launch_{label}_{uuid.uuid4().hex[:12]}"  # launch_ prefix => prunable session run
        root = RUNS / f"{run_name}.record"
        th = threading.Thread(
            target=lambda: asyncio.run(api.Runtime(root).run(topo)), daemon=True
        )
        _LAUNCHES[run_name] = th
        th.start()
        for _ in range(
            80
        ):  # wait only until RunStarted lands, so the console can follow immediately
            try:
                if root.exists() and any(
                    e.get("kind") == "substrate.RunStarted"
                    for e in api.read_record(root)
                ):
                    break
            except Exception:  # noqa: BLE001 - record mid-write; keep waiting
                pass
            time.sleep(0.05)
        status = api.run_graph(root).status if root.exists() else "incomplete"
        self._json(
            {
                "name": run_name,
                "status": status,
                "agent": model,
                "workspace": str(workspace),
                "branch": branch,
                "params": {"think": think, "max_tokens": max_tokens, "timeout": timeout},
            }
        )

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

        if self._at_run_capacity():
            self._error(429, "too many concurrent runs; wait for some to finish")
            return
        resume_name = f"resume_{name}_{uuid.uuid4().hex[:12]}"
        root = RUNS / f"{resume_name}.record"
        shutil.copytree(src, root)
        for lock in root.rglob(".lock"):
            lock.unlink()
        th = threading.Thread(
            target=lambda: asyncio.run(
                api.Runtime(root, persistent=True).resume(
                    topo, resume_event=ev_factory()
                )
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
        self._json(
            {"name": resume_name, "status": api.run_graph(root).status, "resumed": name}
        )

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
            topo = build_from_spec(spec, _responder_for(spec))
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
        if self._at_run_capacity():
            self._error(429, "too many concurrent runs; wait for some to finish")
            return
        run_name = f"build_{name}_{uuid.uuid4().hex[:12]}"
        root = RUNS / f"{run_name}.record"
        th = threading.Thread(
            target=lambda: asyncio.run(api.Runtime(root).run(topo)), daemon=True
        )
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
        out: dict[str, object] = {
            "name": run_name,
            "status": g.status if g else "incomplete",
            "built": name,
        }
        # "never matured" is only true against a TERMINAL graph. If the wait timed out and the run is
        # still incomplete, a trigger is "unfired" merely because the run hasn't reached it yet -- a
        # spurious signal on the slow (Ollama) path (ui-backend-5). Only report it for a settled run.
        if g is not None and g.status != "incomplete":
            authored = [t["id"] for t in spec.get("triggers", [])]
            fired = {i.trigger_id for i in g.instances if i.trigger_id}
            unfired = [t for t in authored if t not in fired]
            if unfired:
                out["unfired_triggers"] = (
                    unfired  # authored Triggers whose Predicate never matured
                )
        self._json(out)

    def do_DELETE(self) -> None:  # noqa: N802 — sprint 214b: DELETE /api/session/<id>
        path = unquote(urlparse(self.path).path)
        if not self._origin_ok():
            self._error(403, "cross-origin request rejected (Origin does not match Host)")
            return
        try:
            if path.startswith("/api/session/"):
                session_id = path[len("/api/session/") :]
                # Piece-B review finding 3: reject sub-resource paths like
                # `/api/session/<id>/turn` — the `<id>` slot is flat, never a
                # nested path. Without this, a DELETE against a sub-resource
                # reached `SessionRegistry.delete("<id>/turn")` and returned 404
                # pretending the mangled id was the session name.
                if not session_id or "/" in session_id:
                    self._error(404, f"no delete endpoint {path!r}")
                    return
                self._session_delete(session_id)
                return
            self._error(404, f"no delete endpoint {path!r}")
        except Exception as exc:  # noqa: BLE001
            self._error(500, f"{type(exc).__name__}: {exc}")

    def do_GET(self) -> None:  # noqa: N802
        path = unquote(urlparse(self.path).path)
        try:
            # Sprint 214b: session list + by-name lookup routed BEFORE the generic
            # /api/records paths so `/api/session/by-name/<name>` does not fall
            # through to `_static`.
            if path == "/api/session":
                self._session_list()
                return
            if path.startswith("/api/session/by-name/"):
                self._session_by_name(unquote(path[len("/api/session/by-name/") :]))
                return
            if path.startswith("/api/session/") and path.endswith("/events"):
                session_id = path[len("/api/session/") : -len("/events")]
                # Piece-B review finding 17: a malformed query parameter is a
                # 400 (Bad Request), not a 500. `int("abc")` used to raise
                # ValueError and fall through to do_GET's generic 500 branch.
                raw_since = parse_qs(urlparse(self.path).query).get("since_seq", ["-1"])[0]
                try:
                    since_seq = int(raw_since)
                except ValueError:
                    self._error(400, f"since_seq must be an integer, got {raw_since!r}")
                    return
                self._session_events(session_id, since_seq)
                return
            if path == "/api/records":
                self._json(_records_index())
                return
            if path == "/api/models":
                self._json(_agent_models())
                return
            if path == "/api/worktree_diff":  # what the agent changed in a session worktree
                wt = parse_qs(urlparse(self.path).query).get("path", [""])[0]
                try:
                    self._json(_worktree_diff(Path(wt)))
                except Exception as exc:  # noqa: BLE001 — not a worktree / git issue -> typed error
                    self._json({"error": str(exc), "diff": "", "files": []})
                return
            if path == "/api/assays":
                self._json(_assays_index())
                return
            if path.startswith("/api/assay/"):
                res = _assay_report(unquote(path[len("/api/assay/") :]))
                self._json(res, 404 if "error" in res else 200)
                return
            if path == "/api/topologies":
                self._json(
                    bundled.names() + list(_EXTRA_TOPOS)
                )  # the launchable topologies
                return
            if path == "/api/diff":
                self._diff(parse_qs(urlparse(self.path).query))
                return
            if path == "/api/resolve_child":  # W2.2: a delegate ToolResult's child_root -> served name
                cp = parse_qs(urlparse(self.path).query).get("path", [""])[0]
                self._json({"name": _resolve_child_name(cp)})
                return
            if path.startswith("/api/records/"):
                self._api_record(path[len("/api/records/") :])
                return
            if path.startswith("/terminal-v1/") or path == "/terminal-v1":
                self._static_root(TERMINAL_V1, path[len("/terminal-v1") :] or "/")
                return
            self._static(path)
        except Exception as exc:  # noqa: BLE001 - surface any read error as JSON, never a crash
            # do NOT leak a full traceback (absolute paths, internals) in the response body; the
            # typed name + message is enough for the client. Log the traceback server-side instead.
            traceback.print_exc()
            self._error(500, f"{type(exc).__name__}: {exc}")

    def _api_record(self, rest: str) -> None:
        parts = rest.split("/")
        name = parts[0]
        record = _record_path(name)
        if record is None:
            self._error(404, f"no record {name!r}")
            return
        events = list(api.read_record(record))
        if (
            len(parts) == 1
        ):  # the whole run: events + the manifest + the run-level status
            manifest = next(
                (
                    (e.get("payload") or {}).get("topology")
                    for e in events
                    if e.get("kind") == "substrate.RunStarted"
                ),
                None,
            )
            g = api.run_graph(events)
            self._json(
                {
                    "name": name,
                    "status": g.status,
                    "events": events,
                    "manifest": manifest,
                }
            )
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
            out["live"] = _is_live(
                name
            )  # server-authoritative liveness: is the launch still writing?
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
            self._json(
                {"a": a, "b": b, "equivalent": False, "divergence": _builtins(div)}
            )

    def _explain(
        self, name: str, events: list[dict[str, object]], producer: str
    ) -> None:
        try:
            exp = api.explain_producer(events, producer)
            chain = api.trace_ancestry(events, producer)
        except (api.ProducerNotFound, api.SequenceOutOfRange) as exc:
            self._error(404, str(exc))
            return
        self._json(
            {"explanation": _builtins(exp), "ancestry": [_builtins(e) for e in chain]}
        )

    def _static(self, path: str) -> None:
        self._static_root(WEB, path)

    def _static_root(self, root: Path, path: str) -> None:
        rel = "index.html" if path in ("", "/") else path.lstrip("/")
        target = (root / rel).resolve()
        # contain to root via relative_to, not startswith — startswith(root) also passes a sibling
        # like "…/web-evil/secret", a prefix-traversal. relative_to raises when target escapes root.
        try:
            target.relative_to(root.resolve())
        except ValueError:
            self._error(404, f"not found: {path}")
            return
        if not target.is_file():
            self._error(404, f"not found: {path}")
            return
        self._send(
            200, target.read_bytes(), _CT.get(target.suffix, "application/octet-stream")
        )


def main() -> None:
    WEB.mkdir(exist_ok=True)
    # Sprint 211: boot-scan the on-disk session catalog. Rebuilds the in-memory
    # SessionRegistry from ~/.substrate/sessions/*/manifest.json, checking every
    # record's true status (hot segment → interrupted; RunFinalised → ended;
    # otherwise → parked) and rewriting manifests whose stored status disagrees.
    from session_registry import SessionRegistry

    global _SESSION_REGISTRY
    registry = SessionRegistry(session_topology_factory=_build_session_topology_from_manifest)
    _SESSION_REGISTRY = registry
    skipped = registry.boot_scan()
    manifests = registry.list_all()
    summary = (
        f"substrate-ui read-API server on http://{HOST}:{PORT}  "
        f"(records: {', '.join(bundled.names())}; "
        f"sessions: {len(manifests)} — "
        f"{sum(1 for m in manifests if m.status == 'parked')} parked, "
        f"{sum(1 for m in manifests if m.status == 'interrupted')} interrupted, "
        f"{sum(1 for m in manifests if m.status == 'ended')} ended)"
    )
    if skipped:
        summary += f"; SKIPPED {len(skipped)} unparseable manifest(s): {', '.join(skipped[:5])}"
        if len(skipped) > 5:
            summary += f" ... (+{len(skipped) - 5} more)"
    print(summary)
    srv = ThreadingHTTPServer((HOST, PORT), Handler)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        srv.shutdown()


if __name__ == "__main__":
    main()
