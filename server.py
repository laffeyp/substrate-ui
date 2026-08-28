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
import signal
import subprocess
import sys
import threading
import time
import traceback
import uuid
import socketserver
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
from session_errors import (
    FRESH_SESSION_NEVER_OPENED,
    RECORD_TORN,
    SESSION_ENDED_MID_DELEGATE,
)
from session_registry import (
    STATUS_ENDED,
    STATUS_INTERRUPTED,
    STATUS_PARKED,
    STATUS_RUNNING,
    FreshSessionRequiresUserMessage,
    NameCollision,
    SessionEndedMidTurn,
    TornRecordOnResume,
)
from substrate.reference import CliResponder, DeterministicResponder, OllamaResponder


class _UnixHTTPServer(socketserver.ThreadingUnixStreamServer):
    """Sprint 217e: UDS variant of ThreadingHTTPServer. `BaseHTTPRequestHandler`
    reads `self.server.server_name` and `server_port` in `date_time_string`;
    `ThreadingUnixStreamServer` does not set them (no host/port for a Unix
    socket). Synthesized here so the handler runs unchanged over UDS.
    Threads are daemon so a graceful shutdown does not have to wait on them.
    """

    daemon_threads = True

    def __init__(self, socket_path: str, handler_cls: type) -> None:
        super().__init__(socket_path, handler_cls)
        self.server_name = "localhost"
        self.server_port = 0

# Sprint 214a: daemon-side session API. SessionRegistry is a MODULE-scope singleton
# so every handler sees the same catalog + per-session lock. Initialized in main()
# with a session_topology_factory closure that resolves a manifest's driver string
# to a Responder and rebuilds the session_topology per turn.
_SESSION_REGISTRY: Any = None
# Sprint 223 — application catalog. Populated at main() via
# `applications.registry.load_manifests()`; served by `GET /api/applications`.
# Empty at import time so a fresh daemon (or a test that spins the server
# without wiring the registry) responds with `[]` rather than 500.
_APPLICATIONS: dict[str, Any] = {}
# Sprint 225a: async runs launched via POST /api/topology/<name>/run
# with await_completion=false. run_id -> {"record_root", "thread",
# "started_at", "application", "await_completion"}. Sprint 225d's
# GET /api/topology/<name>/status?run_id=<id> reads from here.
_TOPOLOGY_RUNS: dict[str, dict[str, Any]] = {}


def _application_spec_to_wire(spec: Any) -> dict[str, Any]:
    """Local wire adapter re-export so the handler stays import-side-effect free."""
    from substrate.topologies.applications.registry import spec_to_wire

    return spec_to_wire(spec)

# Sprint 215d: SIGTERM guard so a second signal during shutdown is a no-op
# instead of re-entering `_shutdown_all_sessions` on a half-torn catalog.
_SHUTDOWN_STARTED = threading.Event()


_RESPONDER_CACHE: dict[str, Any] = {}


def _daemon_driver_resolver(name: str) -> Any:
    """Daemon-side resolver: `deterministic` → seeded stub; `claude` / `gemini` →
    CliResponder; anything else → OllamaResponder (a real local or `:cloud` tag).
    Sprint 213a's `_default_model_resolver` in substrate ships a smaller default
    without CLI knowledge; the daemon knows more, so it wraps.

    F13: cached by driver string so the HTTP client + connection pool survive
    across turns. DeterministicResponder is excluded (stateful seed).
    """
    cached = _RESPONDER_CACHE.get(name)
    if cached is not None:
        return cached
    if name == "deterministic":
        return DeterministicResponder(seed=0)
    if name == "claude":
        responder = CliResponder(["claude", "-p"], name="claude")
    elif name == "gemini":
        responder = CliResponder(["gemini", "-p"], name="gemini")
    else:
        responder = OllamaResponder(model=name, timeout=300.0)
    _RESPONDER_CACHE[name] = responder
    return responder


def _load_daemon_config(config_path: Path | None = None) -> dict[str, Any]:
    """Sprint 216: read `~/.substrate/config.toml` for daemon knobs. Returns
    `{"turn_queue_cap": int}` with defaults filled. Missing file or missing
    keys use defaults; a malformed file logs a warning and uses defaults.
    """
    import tomllib

    path = config_path if config_path is not None else Path.home() / ".substrate" / "config.toml"
    defaults: dict[str, Any] = {"turn_queue_cap": 4}
    if not path.exists():
        return defaults
    try:
        with path.open("rb") as fp:
            data = tomllib.load(fp)
    except (OSError, tomllib.TOMLDecodeError) as exc:
        print(f"daemon config at {path}: {type(exc).__name__}: {exc}; using defaults", flush=True)
        return defaults
    session_section = data.get("session") if isinstance(data.get("session"), dict) else {}
    cap = session_section.get("turn_queue_cap", defaults["turn_queue_cap"])
    if isinstance(cap, int) and cap >= 1:
        defaults["turn_queue_cap"] = cap
    return defaults


def _shutdown_all_sessions(*, per_session_timeout: float = 10.0) -> dict[str, int]:
    """Sprint 215d + 217a: end every running/parked session cleanly on daemon
    shutdown. For each manifest whose status is not `ended` or `interrupted`,
    inject `SessionEndRequested(session_id, source="daemon_shutdown")` via
    `SessionRegistry.turn_sync`. The session topology's `end-on-user-end`
    trigger reads the source and yields `SessionEnded{reason: "daemon_shutdown"}`;
    `RunFinalised` follows; `turn_sync` transitions the manifest to `"ended"`.

    Sprint 217a: `FreshSessionRequiresUserMessage` catches the fresh-session
    edge — a manifest whose record was never opened (created via POST /session
    but no /turn ever fired). SIGTERM's SessionEndRequested cannot open a
    fresh record via the `session_open` path; the manifest transitions to
    `"ended"` at the daemon layer without opening the record on disk.

    Sequential — waits up to `per_session_timeout` seconds per session,
    matching the parent card's "wait up to 10s per session for graceful
    pause, then exit" wording. Best-effort per session: an exception on
    one session does not stop the loop.

    Returns `{"ended": N, "skipped_fresh": F, "skipped_ended": M, "failed": K}`:
      - ended:         SessionEndRequested drove a clean SessionEnded on the record
      - skipped_fresh: manifest had no record on disk; transitioned to "ended"
                       at the daemon layer without opening
      - skipped_ended: manifest already had status "ended" or "interrupted"
                       before the sweep — nothing to do
      - failed:        an unexpected exception on one session; the sweep continued
    """
    result = {"ended": 0, "skipped_fresh": 0, "skipped_ended": 0, "failed": 0}
    if _SESSION_REGISTRY is None:
        return result
    from substrate.topologies.session import SessionEndRequested

    for manifest in list(_SESSION_REGISTRY.list_all()):
        if manifest.status in (STATUS_ENDED, STATUS_INTERRUPTED):
            result["skipped_ended"] += 1
            continue
        try:
            _SESSION_REGISTRY.turn_sync(
                manifest.session_id,
                resume_event=SessionEndRequested(
                    session_id=manifest.session_id, source="daemon_shutdown"
                ),
                timeout_seconds=per_session_timeout,
            )
            result["ended"] += 1
        except Exception as exc:  # noqa: BLE001 — best-effort; log and move on
            if isinstance(exc, FreshSessionRequiresUserMessage):
                # Fresh session: no record on disk to end. Transition the
                # manifest to "ended" at the daemon layer without opening
                # the run. Rule 12 preserves nothing (no record existed);
                # the manifest hint just gets a terminal status.
                try:
                    _SESSION_REGISTRY.update_status(manifest.session_id, STATUS_ENDED)
                    result["skipped_fresh"] += 1
                except Exception:  # noqa: BLE001 — shutdown sweep must not raise; unknown per-session failure buckets as `failed` and the loop continues.
                    result["failed"] += 1
                continue
            traceback.print_exception(exc)
            result["failed"] += 1
    return result


def _tools_for_manifest(manifest: Any) -> dict[str, Any]:
    """Pure function: given a session manifest, return the tool dict the
    session topology will bind. Extracted so tests can observe the filter
    without wiring an in-process daemon.

    manifest.tools == None or () → the full suite (unrestricted).
    manifest.tools == ("read_file", "grep") → those two tools only.
    An allow-list entry that names a tool absent from full_suite is
    dropped silently (unknown name → nothing to bind to).
    """
    from substrate.topologies.tool_loop.tools import full_suite

    all_tools = full_suite(Path(manifest.workspace))
    if manifest.tools:
        return {name: all_tools[name] for name in manifest.tools if name in all_tools}
    return all_tools


# ── sprint 225a: application dispatch — one-shot topology launcher ──────


def _build_code_review_from_inputs(inputs: dict[str, Any]) -> Callable[..., Any]:
    """`fanout_review_topology` — inputs.<role>_model per DEFAULT_ROLES
    resolve into the `responders` dict; `judge_model` into `judge`."""
    from substrate.topologies.applications.fanout_review import fanout_review_topology
    from substrate.topologies.code_review import DEFAULT_ROLES

    responders = {
        role: _daemon_driver_resolver(str(inputs[f"{role}_model"])) for role in DEFAULT_ROLES
    }
    judge = _daemon_driver_resolver(str(inputs["judge_model"]))
    return fanout_review_topology(
        repo=str(inputs["repo"]),
        ref=str(inputs.get("ref", "HEAD~1")),
        responders=responders,
        judge=judge,
        quorum=int(inputs.get("quorum", 3)),
    )


def _build_best_of_n_verified_from_inputs(inputs: dict[str, Any]) -> Callable[..., Any]:
    """`best_of_n_verified_topology` — drafter_model + verify_model both
    resolve into Responders. The verify=Check | Responder union collapses
    to Responder here; a deterministic-check variant is a future card."""
    from substrate.topologies.applications.best_of_n_verified import best_of_n_verified_topology

    return best_of_n_verified_topology(
        task=str(inputs["task"]),
        drafter=_daemon_driver_resolver(str(inputs["drafter_model"])),
        verify=_daemon_driver_resolver(str(inputs["verify_model"])),
        n=int(inputs.get("n", 3)),
        max_rounds=int(inputs.get("max_rounds", 2)),
        watchdog_seconds=float(inputs.get("watchdog_seconds", 30.0)),
    )


def _build_research_sweep_from_inputs(inputs: dict[str, Any]) -> Callable[..., Any]:
    """`research_sweep_topology` — three role-model kwargs; documents is a
    list of {label, text} dicts on the wire, translated here to the
    [(label, text), ...] tuple shape the topology expects."""
    from substrate.topologies.applications.research_sweep import research_sweep_topology

    docs_raw = inputs.get("documents") or []
    if not isinstance(docs_raw, list):
        raise ValueError(f"documents must be a list; got {type(docs_raw).__name__}")
    documents = [(str(d["label"]), str(d["text"])) for d in docs_raw]
    return research_sweep_topology(
        question=str(inputs["question"]),
        documents=documents,
        reader=_daemon_driver_resolver(str(inputs["reader_model"])),
        critic=_daemon_driver_resolver(str(inputs["critic_model"])),
        synthesizer=_daemon_driver_resolver(str(inputs["synthesizer_model"])),
        watchdog_seconds=float(inputs.get("watchdog_seconds", 30.0)),
    )


# Dispatch table: manifest.name -> callable that builds the topology from
# the wire inputs. New applications wire in one entry per name. The
# manifest's [inputs] schema still gates required fields at the endpoint
# layer; this table only knows how to translate resolved values into
# topology kwargs (including the role-to-Responder mapping).
_APP_BUILDERS: dict[str, Callable[[dict[str, Any]], Callable[..., Any]]] = {
    "code_review": _build_code_review_from_inputs,
    "best_of_n_verified": _build_best_of_n_verified_from_inputs,
    "research_sweep": _build_research_sweep_from_inputs,
}


def _build_pair_coding_composite(
    session_registry: Any, inputs: dict[str, Any]
) -> tuple[Any, Any]:
    """Sprint 225c — register the pair_coding builder + reviewer pair.
    Returns `(builder_manifest, reviewer_manifest)` — the reviewer's
    `composite_of` points at the builder's session_id so sprint 225b's
    cascade end/rm ties both together."""
    from substrate.topologies.applications.pair_coding_composite import (
        pair_coding_application,
    )

    return pair_coding_application(
        session_registry=session_registry,
        builder_driver_model=str(inputs["builder_driver_model"]),
        reviewer_driver_model=str(inputs["reviewer_driver_model"]),
        workspace=str(inputs["workspace"]),
    )


# Dispatch table for `runs = "session_composite"` apps. Each entry takes
# the SessionRegistry + resolved inputs and returns two session manifests
# (parent + one child today; a fan-composite extension would return N+1).
_COMPOSITE_APP_BUILDERS: dict[str, Callable[[Any, dict[str, Any]], tuple[Any, Any]]] = {
    "pair_coding": _build_pair_coding_composite,
}


def _validate_topology_inputs(spec: Any, inputs: dict[str, Any]) -> str | None:
    """Return an error message if required fields are missing; None if OK."""
    for field_name, field_spec in spec.inputs_schema.items():
        if not isinstance(field_spec, dict):
            continue
        # A field with no `default` and not marked optional is required. The
        # manifest schema uses TOML inline-table shape {type=..., default=...}.
        if "default" in field_spec:
            continue
        if field_name not in inputs:
            return f"missing required input {field_name!r}"
    return None


def _build_session_topology_from_manifest(
    manifest: Any, first_turn_user_message: Any = None
) -> Any:
    """The `session_topology_factory` closure the SessionRegistry calls per turn.
    Reconstructs the session_topology from a manifest's persistent fields —
    driver string, workspace, seed, session_id. The daemon binds this at boot.

    Sprint 217a: `first_turn_user_message` threads the first-turn UserMessage
    into the topology's `session_open` producer when `turn_sync` detects an
    empty record and composes `Runtime.run(...)`. On subsequent turns the
    argument is None; the topology fires without a `session_open` initial
    and `Runtime.resume(topology, resume_event=UserMessage)` continues the run.
    """
    from substrate.topologies.session import session_topology
    from substrate.topologies.session.transcript import resolve_driver_context_tokens
    from substrate.topologies.tool_loop.tools import full_suite

    responder = _daemon_driver_resolver(manifest.driver)
    session_tools = _tools_for_manifest(manifest)
    return session_topology(
        driver=responder,
        driver_name=manifest.driver,
        driver_context_tokens=resolve_driver_context_tokens(manifest.driver, responder),
        seed=manifest.seed,
        tools=session_tools,
        per_turn=manifest.per_turn,
        max_turns=200,
        turn_max_steps=24,
        session_id=manifest.session_id,
        workspace_path=manifest.workspace,
        record_root=Path(manifest.record_root),
        script=None,
        first_turn_user_message=first_turn_user_message,
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
                if e.get("kind") == api.RUN_STARTED
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
            if e.get("kind") == api.TRIGGER_FIRED
            and (e.get("payload") or {}).get("trigger_id") == "__initial__"
        ),
        None,
    )
    seed = (init.get("payload") or {}).get("resolved_input") if init else None
    # the substrate's OTHER designated input channel: b.baseline() -> RunStarted.payload.baseline
    # ("fixtures, seeds, environment identifiers, so every record is interpretable from a known
    # baseline"). io must surface it, else a baseline-seeded run shows null input (review #34).
    started = next((e for e in events if e.get("kind") == api.RUN_STARTED), None)
    baseline = (started.get("payload") or {}).get("baseline") if started else None
    outputs = [
        {"seq": e["seq"], "kind": e["kind"], "payload": e.get("payload")}
        for e in events
        if not str(e.get("kind", "")).startswith("substrate.")
    ]
    fin = next((e for e in events if e.get("kind") == api.RUN_FINALISED), None)
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
            if path.startswith("/api/session/") and path.endswith("/end"):
                session_id = path[len("/api/session/") : -len("/end")]
                self._session_end(session_id)
                return
            if path.startswith("/api/session/") and path.endswith("/interrupt"):
                session_id = path[len("/api/session/") : -len("/interrupt")]
                self._session_interrupt(session_id)
                return
            if path.startswith("/api/topology/") and path.endswith("/run"):
                # Sprint 225a: POST /api/topology/<name>/run — piece-E
                # application dispatch endpoint per TECH-SPEC §7.6 line
                # 1043. One-shot only (session-shape apps route through
                # POST /api/session or /api/session/composite instead).
                topology_name = path[len("/api/topology/") : -len("/run")]
                self._topology_run(topology_name)
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
        except Exception as exc:  # noqa: BLE001 — top-level do_POST boundary: a runaway inside any endpoint must become a JSON 500, not kill the daemon thread.
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
        except msgspec.DecodeError as exc:
            raise ValueError(f"POST body is not JSON: {exc}") from exc
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
        # Sprint 223c: `isolate` (§9c Mode 3). When true, the session's tool
        # writes stay in a per-session directory under ~/.substrate/sessions/
        # regardless of the caller's `workspace`. Mutual exclusion with
        # `workspace_shape: "worktree"` — the two shape a session two
        # different ways; picking one silently would hide the operator's
        # intent. Enforce explicit halt.
        isolate = bool(body.get("isolate"))
        if isolate and workspace_shape == "worktree":
            self._error(
                400,
                "isolate=true and workspace_shape='worktree' are mutually exclusive; "
                "pick one",
            )
            return
        if isolate:
            workspace_shape = "isolate"
            # The session_id is not yet known at this point; use a fresh uuid
            # so the isolated workspace path can be created before create()
            # returns. session_id below matches this same uuid.
            _iso_uuid = uuid.uuid4().hex[:24]
            _iso_ws = _SESSIONS_BASE / f"s_{_iso_uuid}" / "workspace"
            _iso_ws.mkdir(parents=True, exist_ok=True)
            workspace = str(_iso_ws)
            _forced_session_id = f"s_{_iso_uuid}"
        else:
            _forced_session_id = None
        # Piece-B review finding 6: TECH-SPEC §4 names this field `seed_text`;
        # the earlier draft read `seed` only, so a client following the spec
        # silently sent nothing. Both names accepted; the spec wins on writes.
        seed = str(body.get("seed_text") or body.get("seed") or "")
        bundle = body.get("bundle")
        # Sprint 223a: `role` per TECH-SPEC §1.6.5. Resolve at create time so
        # a nonexistent role name fails 400 immediately rather than at first
        # `/turn`. The resolver's `RegistrationError` carries the four-layer
        # search trail; forward the message verbatim.
        role = str(body.get("role") or "default")
        try:
            from substrate.topologies.session.roles import resolve_role_prompt

            resolve_role_prompt(role, repo_root=Path.cwd())
        except Exception as exc:  # noqa: BLE001 — RegistrationError forwarded as 400
            self._error(400, f"role {role!r}: {exc}")
            return
        # Sprint 223b: `tools` on POST per TECH-SPEC §7 line 674. Same shape as
        # the PATCH branch (217e): list of non-empty strings. Empty list → None
        # (unrestricted). Missing → None. Any other type → 400.
        tools_raw = body.get("tools")
        tools: tuple[str, ...] | None = None
        if tools_raw is not None:
            if not isinstance(tools_raw, list):
                self._error(400, f"tools must be a list of strings; got {type(tools_raw).__name__}")
                return
            for t in tools_raw:
                if not isinstance(t, str) or not t:
                    self._error(400, f"tools must be non-empty strings; offending element: {t!r}")
                    return
            tools = tuple(tools_raw) if tools_raw else None
        session_id = _forced_session_id or f"s_{uuid.uuid4().hex[:24]}"
        try:
            manifest = _SESSION_REGISTRY.create(
                session_id=session_id,
                name=str(name) if name is not None else None,
                driver=driver,
                workspace=workspace,
                workspace_shape=workspace_shape,
                bundle=str(bundle) if bundle is not None else None,
                seed=seed,
                role=role,
                tools=tools,
            )
        except Exception as exc:
            # NameCollision carries existing_session_id per sprint 211.
            if isinstance(exc, NameCollision):
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
                "role": manifest.role,
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
        # Sprint 216: 410 for a session that was live and is now gone. A
        # deleted session's record directory stays (SDD rule 12); its
        # manifest is popped. A caller that resolved the session name
        # earlier and hits /turn after the DELETE gets 410, not 404. A
        # never-existed session still returns 404.
        manifest = _SESSION_REGISTRY.get(session_id)
        if manifest is None:
            if _SESSION_REGISTRY.has_session_dir(session_id):
                self._json(
                    {"ok": False, "status": STATUS_ENDED, "error": SESSION_ENDED_MID_DELEGATE},
                    410,
                )
                return
            self._error(404, f"unknown session_id {session_id!r}")
            return
        if manifest.status == STATUS_ENDED:
            self._json(
                {"ok": False, "status": STATUS_ENDED, "error": SESSION_ENDED_MID_DELEGATE},
                410,
            )
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
        # Sprint 217e: optional `context` block per TECH-SPEC §4. Shape:
        #   {"parent_seq_range": [int, int], "kinds": [str, ...]}
        # The daemon reads a slice of this session's own record over the given
        # seq range, filtered by kinds, capped at 8 KiB (delegate's rule), and
        # prefixes it to UserMessage.assembled_prompt. UserMessage.text stays
        # as the raw user text.
        context_raw = body.get("context")
        context_slice: dict[str, Any] | None = None
        if context_raw is not None:
            if not isinstance(context_raw, dict):
                self._error(400, "context must be an object or absent")
                return
            seq_range = context_raw.get("parent_seq_range")
            if not (
                isinstance(seq_range, list)
                and len(seq_range) == 2
                and all(isinstance(x, int) for x in seq_range)
            ):
                self._error(
                    400,
                    "context.parent_seq_range must be [lo, hi] with two integers",
                )
                return
            kinds = context_raw.get("kinds", [])
            if not (
                isinstance(kinds, list) and all(isinstance(k, str) for k in kinds)
            ):
                self._error(400, "context.kinds must be a list of strings")
                return
            context_slice = {
                "parent_seq_range": tuple(seq_range),
                "kinds": tuple(kinds),
            }
        # Sprint 216: per-session queue cap. Increment the counter under the
        # registry's fast lock; refuse the (cap+1)th caller with 429
        # immediately (no block). Every admission MUST pair with
        # dequeue_turn in a `finally`, or the counter leaks.
        admitted, position = _SESSION_REGISTRY.try_enqueue_turn(session_id)
        if not admitted:
            cap = _SESSION_REGISTRY.turn_queue_cap()
            self._json(
                {
                    "ok": False,
                    "error": "session queue full",
                    "queue_position": position,
                    "queue_cap": cap,
                },
                429,
            )
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
            # F14: use the registry's in-memory counter instead of scanning
            # the entire record for the tail UserMessage.turn_index.
            next_turn_index = _SESSION_REGISTRY.next_turn_index(session_id)
            # Sprint 217e: prefix a context slice to assembled_prompt when the
            # caller passed `context` in the body. The extractor is delegate's
            # existing helper; it reads the parent (== this session's) record
            # over the given seq range + kinds, caps at 8 KiB with event-
            # boundary drops, and returns the formatted text. Empty slice ->
            # unchanged assembled_prompt.
            assembled_prompt = text
            if context_slice is not None and record_root_locked.exists():
                from substrate.topologies.tool_loop.delegate import _prefix_context_slice

                assembled_prompt = _prefix_context_slice(
                    record_root_locked, text, context_slice
                )
            # Sprint 223d: per_turn (spec §7b) prefixes every UserMessage's
            # assembled_prompt. Empty string is the no-op default.
            live_pt = _manifest.per_turn
            if live_pt:
                assembled_prompt = f"{live_pt}\n\n{assembled_prompt}"
            return SessionUserMessage(
                text=text,
                turn_index=next_turn_index,
                assembled_prompt=assembled_prompt,
                slash_source="daemon",
            )

        try:
            try:
                updated_manifest, root_after = _SESSION_REGISTRY.turn_sync(
                    session_id,
                    resume_event_builder=_build,
                    timeout_seconds=600.0,
                )
            except Exception as exc:
                if isinstance(exc, SessionEndedMidTurn):
                    self._json(
                        {"ok": False, "status": STATUS_ENDED, "error": SESSION_ENDED_MID_DELEGATE},
                        410,
                    )
                    return
                if isinstance(exc, TornRecordOnResume):
                    self._json(
                        {
                            "ok": False,
                            "status": STATUS_INTERRUPTED,
                            "error": RECORD_TORN,
                            "detail": str(exc),
                        },
                        410,
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
        finally:
            _SESSION_REGISTRY.dequeue_turn(session_id)

    def _session_end(self, session_id: str) -> None:
        """Sprint 215a: POST /api/session/<id>/end. Body optional:
            {"source": "user_end"?}
        Injects `SessionEndRequested(session_id, source)` as the resume event
        via `SessionRegistry.turn_sync`. The session topology's
        `end-on-user-end` trigger (`session/__init__.py:499-509`) fires on any
        `SessionEndRequested` and routes through the `session_end` producer to
        emit `SessionEnded{reason: "user_end", total_turns: N}`;
        `threshold_count("SessionEnded", 1)` matches; the run finalises;
        `turn_sync` transitions the manifest to `"ended"`.

        Response: `{seq, status: "ended", final_seq, record}`. 404 on unknown
        session_id; 410 on a session already ended (the `SessionEndedMidTurn`
        shape).
        """
        if _SESSION_REGISTRY is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        manifest = _SESSION_REGISTRY.get(session_id)
        if manifest is None:
            self._error(404, f"unknown session_id {session_id!r}")
            return
        # Body is optional; a client that wants to name the source can pass
        # `{"source": "..."}` and the string lands on the SessionEndRequested
        # payload for the record's audit trail.
        source = "user_end"
        try:
            body = self._read_json_body()
            if isinstance(body.get("source"), str) and body["source"]:
                source = str(body["source"])
        except ValueError as exc:
            self._error(400, str(exc))
            return

        from substrate.topologies.session import SessionEndRequested

        # Sprint 225b: cascade to child sub-agents FIRST. A composite parent
        # (a session that has children via composite_of) ends each child
        # before ending itself. Per-child failure is best-effort — logged
        # and continued — so a single stuck child does not block the parent's
        # SessionEnded from landing on the record.
        children = _SESSION_REGISTRY.list_children(session_id)
        for child_manifest in children:
            try:
                child_end_event = SessionEndRequested(
                    session_id=child_manifest.session_id, source="composite_parent_end"
                )
                _SESSION_REGISTRY.turn_sync(
                    child_manifest.session_id,
                    resume_event=child_end_event,
                    timeout_seconds=30.0,
                )
            except FreshSessionRequiresUserMessage:
                _SESSION_REGISTRY.update_status(child_manifest.session_id, STATUS_ENDED)
            except Exception:  # noqa: BLE001 — child cascade is best-effort; one child's failure does not block the parent.
                traceback.print_exc()

        # Pre-request tail seq (piece-B review finding 7 shape).
        record_root_pre = Path(manifest.record_root)
        seq_at_start = -1
        if record_root_pre.exists():
            try:
                for env in api.read_record(record_root_pre):
                    seq_at_start = max(seq_at_start, int(env.get("seq", -1)))
            except Exception:  # noqa: BLE001 — mid-write; snapshot may skew
                seq_at_start = -1

        resume_event = SessionEndRequested(session_id=session_id, source=source)
        try:
            updated_manifest, root_after = _SESSION_REGISTRY.turn_sync(
                session_id,
                resume_event=resume_event,
                timeout_seconds=60.0,
            )
        except Exception as exc:
            if isinstance(exc, SessionEndedMidTurn):
                self._json(
                    {"status": STATUS_ENDED, "error": SESSION_ENDED_MID_DELEGATE}, 410
                )
                return
            # Sprint 220 (piece-D dispatch): a fresh session that never opened
            # its record cannot receive a SessionEndRequested (which is not a
            # UserMessage). Transition the manifest to "ended" at the daemon
            # layer without opening. Same shape as _shutdown_all_sessions.
            if isinstance(exc, FreshSessionRequiresUserMessage):
                _SESSION_REGISTRY.update_status(session_id, STATUS_ENDED)
                self._json(
                    {
                        "seq": seq_at_start,
                        "status": STATUS_ENDED,
                        "final_seq": seq_at_start,
                        "record": manifest.record_root,
                        "reason": FRESH_SESSION_NEVER_OPENED,
                    }
                )
                return
            if isinstance(exc, TornRecordOnResume):
                self._json(
                    {
                        "status": STATUS_INTERRUPTED,
                        "error": RECORD_TORN,
                        "detail": str(exc),
                    },
                    410,
                )
                return
            self._error(500, f"{type(exc).__name__}: {exc}")
            return
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

    def _session_interrupt(self, session_id: str) -> None:
        """Sprint 217d: POST /api/session/<id>/interrupt. Cancels the running
        turn's model producer through the v0.3 `Runtime.cancel_producer`
        primitive. The cancel is dispatched synchronously (up to a 1-second
        wait for the loop-side closure); the resulting `substrate.ProducerCancelled`
        envelope lands on the record asynchronously. This handler waits up to
        `max_wait_ms` (default 3000; capped at 30000) for the envelope to land
        before returning, so a client that reads the response knows whether the
        interrupt actually landed rather than just dispatched.

        Response body:
          `{"interrupted": true, "landed": true, "producer": <ref>, "session_id": ...}`
            — cancel dispatched and ProducerCancelled observed on the record.
          `{"interrupted": true, "landed": false, "producer": <ref>, "session_id": ...}`
            — cancel dispatched; envelope not yet on the record within the wait.
             The client watches `/events` for the landing.
          `{"interrupted": false, "landed": false, "session_id": ...}`
            — no live producer to interrupt (idle session; not an error).

        Query string: `?max_wait_ms=3000` (default), `?max_wait_ms=0` skips the
        poll and returns the dispatch outcome immediately.

        404 on unknown session_id.
        """
        if _SESSION_REGISTRY is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        manifest = _SESSION_REGISTRY.get(session_id)
        if manifest is None:
            self._error(404, f"unknown session_id {session_id!r}")
            return
        # Parse wait cap. Malformed → 400.
        try:
            raw = parse_qs(urlparse(self.path).query).get("max_wait_ms", ["3000"])[0]
            max_wait_ms = max(0, min(30000, int(raw)))
        except ValueError:
            self._error(400, f"max_wait_ms must be an integer, got {raw!r}")
            return
        ref = _SESSION_REGISTRY.interrupt(session_id)
        if ref is None:
            self._json(
                {"interrupted": False, "landed": False, "session_id": session_id}
            )
            return
        # Poll the record for a matching ProducerCancelled envelope. Poll interval
        # 50 ms; cap at max_wait_ms. Match on the (kind, instance) pair the
        # dispatch returned; a caller who reads landed=true knows the envelope
        # naming this specific instance is on disk.
        landed = False
        if max_wait_ms > 0:
            deadline = time.monotonic() + (max_wait_ms / 1000.0)
            target_instance = str(ref.get("instance", ""))
            record_root = Path(manifest.record_root)
            while time.monotonic() < deadline:
                try:
                    for env in api.read_record(record_root):
                        if env.get("kind") != api.PRODUCER_CANCELLED:
                            continue
                        producer = (env.get("payload") or {}).get("producer") or {}
                        if isinstance(producer, dict) and producer.get("instance") == target_instance:
                            landed = True
                            break
                except Exception:  # noqa: BLE001 — mid-write; poll again
                    pass
                if landed:
                    break
                time.sleep(0.05)
        self._json(
            {
                "interrupted": True,
                "landed": landed,
                "producer": ref,
                "session_id": session_id,
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
            key = "live" if manifest.status == STATUS_RUNNING else manifest.status
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
        # Sprint 225b: cascade delete to child sub-agents first. Rule 12
        # preserves every record dir on disk; only manifests + by-name
        # entries drop. Per-child KeyError is a race (child dropped
        # between list_children and delete); ignore per the best-effort
        # contract.
        children = _SESSION_REGISTRY.list_children(session_id)
        for child_manifest in children:
            try:
                _SESSION_REGISTRY.delete(child_manifest.session_id)
            except KeyError:
                pass
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
            last_write = time.monotonic()
            while not finalised:
                for env in follower.read_new():
                    seq = int(env.get("seq", -1))
                    # Piece-B review finding 2: check the finalisation kind
                    # BEFORE the seq filter, else a client reconnecting with
                    # `since_seq >= runfinalised_seq` sees every envelope
                    # discarded, `finalised` never flips, and the loop polls
                    # forever. `LiveRecord.follow(until_finalised=True)` gets
                    # this ordering right; the manual reimplementation had not.
                    is_final = env.get("kind") == api.RUN_FINALISED
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
                    last_write = time.monotonic()
                    if is_final:
                        break
                if finalised:
                    break
                # F11: SSE keep-alive comment every 15s during idle so a
                # reverse proxy with an idle timeout does not kill the
                # connection. An SSE comment (`: ...\n\n`) is invisible
                # to EventSource clients per the WHATWG spec.
                if time.monotonic() - last_write >= 15.0:
                    self.wfile.write(b": ping\n\n")
                    self.wfile.flush()
                    last_write = time.monotonic()
                time.sleep(0.2)
        except (BrokenPipeError, ConnectionResetError, OSError):
            # Client hung up mid-stream. Every SSE server has to tolerate this.
            return

    def _topology_run(self, application_name: str) -> None:
        """Sprint 225a: POST /api/topology/<name>/run.

        Body: `{inputs: {...}, await_completion?: bool, ...}`.
        Reads the manifest from `_APPLICATIONS`; resolves `<role>_model`
        strings via `_daemon_driver_resolver`; hands the resolved inputs
        to the `_APP_BUILDERS` dispatch. `runs = "session"` and
        `runs = "session_composite"` return 400 with a pointer at the
        right endpoint (this launcher is one-shot only per §7.6).

        `await_completion=true` (default): blocks; response is
        `{run_id, record_root, status: "finalised", final_seq}`.
        `await_completion=false`: spawns a worker thread; response is
        `{run_id, record_root, status: "running"}` and sprint 225d's
        status endpoint polls the record to observe transitions.
        """
        spec = _APPLICATIONS.get(application_name)
        if spec is None:
            self._error(404, f"unknown application {application_name!r}")
            return
        if spec.runs == "session":
            self._error(
                400,
                f"application {application_name!r} has runs='session'; open it via "
                "POST /api/session (session-shape apps do not dispatch through /run)",
            )
            return
        if spec.runs == "session_composite":
            self._topology_run_composite(application_name, spec)
            return
        try:
            body = self._read_json_body()
        except ValueError as exc:
            self._error(400, str(exc))
            return
        inputs = body.get("inputs", {})
        if not isinstance(inputs, dict):
            self._error(400, "`inputs` must be an object")
            return
        missing = _validate_topology_inputs(spec, inputs)
        if missing:
            self._error(400, missing)
            return
        # Fold defaults from the manifest schema into the resolved inputs
        # so builders can rely on every field being present.
        resolved: dict[str, Any] = {}
        for field_name, field_spec in spec.inputs_schema.items():
            if field_name in inputs:
                resolved[field_name] = inputs[field_name]
            elif isinstance(field_spec, dict) and "default" in field_spec:
                resolved[field_name] = field_spec["default"]

        builder = _APP_BUILDERS.get(application_name)
        if builder is None:
            self._error(
                501,
                f"application {application_name!r} has no dispatch builder in "
                "_APP_BUILDERS; the manifest parses but no runner is wired",
            )
            return
        try:
            topology_factory = builder(resolved)
        except Exception as exc:  # noqa: BLE001 — application builder can raise anything a topology constructor does; malformed inputs → 400 naming the class.
            self._error(400, f"{type(exc).__name__}: {exc}")
            return

        run_id = f"s_topo_{uuid.uuid4().hex[:20]}"
        record_root = _SESSIONS_BASE.parent / "runs" / run_id
        record_root.mkdir(parents=True, exist_ok=True)
        await_completion = body.get("await_completion", True)
        started_at = time.time()

        if await_completion:
            try:
                asyncio.run(api.Runtime(record_root).run(topology_factory))
            except Exception as exc:  # noqa: BLE001 — topology run boundary: any Producer/View failure surfaces as HTTP 500 with the class name.
                self._error(500, f"{type(exc).__name__}: {exc}")
                return
            final_seq = -1
            for envelope in api.read_record(record_root):
                final_seq = max(final_seq, int(envelope.get("seq", -1)))
            self._json(
                {
                    "run_id": run_id,
                    "record_root": str(record_root),
                    "status": "finalised",
                    "final_seq": final_seq,
                    "application": application_name,
                }
            )
            return

        # Background thread — sprint 225d polls the record.
        def _run_background() -> None:
            try:
                asyncio.run(api.Runtime(record_root).run(topology_factory))
            except Exception:  # noqa: BLE001 — background worker; failure surfaces via the record's tail on next status poll.
                traceback.print_exc()

        thread = threading.Thread(target=_run_background, daemon=True)
        _TOPOLOGY_RUNS[run_id] = {
            "record_root": record_root,
            "thread": thread,
            "started_at": started_at,
            "application": application_name,
        }
        thread.start()
        self._json(
            {
                "run_id": run_id,
                "record_root": str(record_root),
                "status": "running",
                "application": application_name,
            }
        )

    def _topology_status(self, application_name: str, run_id: str) -> None:
        """Sprint 225d: GET /api/topology/<name>/status?run_id=<id>.

        Response shape per TECH-SPEC §8 line 1057: `{run_id, status,
        record_root, elapsed_seconds, output?, application}`. Status
        derives from the record's tail using the same rules
        `_scan_record_status` uses on session boot: RunFinalised → finalised,
        torn → failed, empty → running (or `unknown` if the record dir
        never came into existence), anything else with a tail → running.

        Unknown run_id → 404. Application name in the URL is a UX signal
        for the caller; the actual lookup is by run_id.
        """
        handle = _TOPOLOGY_RUNS.get(run_id)
        if handle is None:
            self._error(
                404,
                f"unknown run_id {run_id!r} (started via await_completion=false?)",
            )
            return
        record_root = Path(handle["record_root"])
        elapsed_seconds = time.time() - float(handle["started_at"])
        status = "running"
        output: Any = None
        if record_root.exists():
            try:
                envelopes = list(api.read_record(record_root))
            except Exception:  # noqa: BLE001 — torn record while the background run is mid-write; treat as running until stable.
                envelopes = []
                status = "failed"
            else:
                if envelopes and envelopes[-1].get("kind") == api.RUN_FINALISED:
                    status = "finalised"
                    # Extract the application terminal envelope's payload as `output`
                    # (Solved / Verdict / Synthesis). One tail scan; nothing exotic.
                    for env in reversed(envelopes):
                        kind = str(env.get("kind", ""))
                        if kind.startswith("substrate."):
                            continue
                        output = env.get("payload")
                        break
        self._json(
            {
                "run_id": run_id,
                "status": status,
                "record_root": str(record_root),
                "elapsed_seconds": elapsed_seconds,
                "application": application_name,
                **({"output": output} if output is not None else {}),
            }
        )

    def _topology_run_composite(self, application_name: str, spec: Any) -> None:
        """Sprint 225c: dispatch a `runs = "session_composite"` app.

        Reads the manifest inputs the same way `_topology_run` does,
        then hands them to the composite factory keyed on the app name.
        Returns the pair of registered session_ids + record roots. The
        caller drives turns via the ordinary POST /api/session/<id>/turn
        endpoint on either session; sprint 225b's cascade takes care of
        end/rm.

        Only `pair_coding` today; new composites register one entry in
        `_COMPOSITE_APP_BUILDERS`.
        """
        try:
            body = self._read_json_body()
        except ValueError as exc:
            self._error(400, str(exc))
            return
        inputs = body.get("inputs", {})
        if not isinstance(inputs, dict):
            self._error(400, "`inputs` must be an object")
            return
        missing = _validate_topology_inputs(spec, inputs)
        if missing:
            self._error(400, missing)
            return
        resolved: dict[str, Any] = {}
        for field_name, field_spec in spec.inputs_schema.items():
            if field_name in inputs:
                resolved[field_name] = inputs[field_name]
            elif isinstance(field_spec, dict) and "default" in field_spec:
                resolved[field_name] = field_spec["default"]

        builder = _COMPOSITE_APP_BUILDERS.get(application_name)
        if builder is None:
            self._error(
                501,
                f"composite application {application_name!r} has no builder in "
                "_COMPOSITE_APP_BUILDERS",
            )
            return
        try:
            builder_manifest, reviewer_manifest = builder(_SESSION_REGISTRY, resolved)
        except Exception as exc:  # noqa: BLE001 — composite builder can raise anything a topology constructor does; malformed inputs → 400 naming the class.
            self._error(400, f"{type(exc).__name__}: {exc}")
            return
        self._json(
            {
                "application": application_name,
                "builder_session_id": builder_manifest.session_id,
                "reviewer_session_id": reviewer_manifest.session_id,
                "builder_record": builder_manifest.record_root,
                "reviewer_record": reviewer_manifest.record_root,
            }
        )

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
                    e.get("kind") == api.RUN_STARTED
                    for e in api.read_record(root)
                ):
                    break
            except Exception:  # noqa: BLE001 - record mid-write; keep waiting
                pass
            time.sleep(0.05)
        status = api.run_graph(root).status if root.exists() else "incomplete"
        self._json({"name": run_name, "status": status, "launched": name})

    def _agent(self, q: dict[str, list[str]]) -> None:
        """`/api/agent` compat bridge (TECH-SPEC §7 line 690).

        Per the spec: `/api/agent` stays for one release; internally creates a
        session on first request and routes subsequent requests to
        `/api/session/<id>/turn`. Same-`session`-param calls reuse the session
        (find-by-name); different `session` values create separate sessions.
        Concurrent calls on the same session serialize on the registry's
        per-session threading.Lock.

        Query params:
          - session: session name (find-or-create key). Missing → adhoc.
          - task: the user message text for this turn.
          - model: `deterministic` (default), `ollama`, or a driver string.
          - name: driver model name when model=ollama (e.g. `llama3.2:1b`).
          - workspace: caller-supplied path (like the old shape).
          - legacy: `true` → run the pre-bridge behavior for one release.
                    The bridge default routes through SessionRegistry.

        Response: `{record, session_id, ok: true, deprecated: true?}`. The
        `deprecated: true` field lands on legacy=true responses so a caller
        can see the shape is on its way out.
        """
        if (q.get("legacy", [""])[0] or "").lower() == "true":
            self._agent_legacy(q)
            return
        if _SESSION_REGISTRY is None:
            # No silent legacy fallback. The bridge is the default; the
            # legacy shape ships one release with explicit `legacy=true`
            # opt-in per TECH-SPEC §7 line 690. A caller reaching here
            # without a registry is a real 503 — the daemon boots the
            # registry at main() and every serve_forever call sees it.
            self._error(503, "session registry not initialized (boot ordering)")
            return

        session_name = q.get("session", [""])[0] or ""
        task = q.get("task", [""])[0] or "Use the available tools to help."
        model = (q.get("model", ["deterministic"])[0] or "deterministic").lower()
        ws_arg = q.get("workspace", [""])[0]
        # Driver string per the create/PATCH shape. `model=ollama` + `name=X`
        # → driver=X so /api/session's PATCH-driver stays useful downstream.
        if model == "ollama":
            driver = q.get("name", ["llama3.2:1b"])[0]
        elif model in ("claude", "gemini", "cli"):
            driver = model
        else:
            driver = "deterministic"

        # Find-or-create by name. A collision-free session name means create;
        # a hit means resume.
        session_id: str | None = None
        if session_name:
            session_id = _SESSION_REGISTRY.by_name(session_name)

        if session_id is None:
            session_id = f"s_{uuid.uuid4().hex[:24]}"
            workspace = (
                str(Path(ws_arg).expanduser().resolve())
                if ws_arg and Path(ws_arg).expanduser().is_absolute()
                else str(_SESSIONS_BASE / (session_name or f"adhoc-{uuid.uuid4().hex[:8]}"))
            )
            Path(workspace).mkdir(parents=True, exist_ok=True)
            try:
                _SESSION_REGISTRY.create(
                    session_id=session_id,
                    name=session_name or None,
                    driver=driver,
                    workspace=workspace,
                    workspace_shape="flat",
                    bundle=None,
                    seed="",
                )
            except NameCollision as exc:
                # Race: another caller with the same name won. Reuse theirs.
                session_id = exc.existing_session_id

        # Route the task as a UserMessage through turn_sync — same seam
        # /api/session/<id>/turn uses. Per-session threading.Lock serializes.
        from substrate.topologies.session import UserMessage as SessionUserMessage

        def _build(_manifest: Any, _record_root: Path) -> Any:
            next_turn_index = _SESSION_REGISTRY.next_turn_index(session_id)
            assembled = task
            live_pt = _manifest.per_turn
            if live_pt:
                assembled = f"{live_pt}\n\n{assembled}"
            return SessionUserMessage(
                text=task,
                turn_index=next_turn_index,
                assembled_prompt=assembled,
                slash_source="daemon",
            )

        try:
            updated_manifest, root_after = _SESSION_REGISTRY.turn_sync(
                session_id, resume_event_builder=_build, timeout_seconds=600.0
            )
        except SessionEndedMidTurn:
            self._json(
                {"ok": False, "status": STATUS_ENDED, "error": SESSION_ENDED_MID_DELEGATE}, 410
            )
            return
        except Exception as exc:  # noqa: BLE001 — bridge surfaces the class + text
            self._error(500, f"{type(exc).__name__}: {exc}")
            return

        self._json(
            {
                "ok": True,
                "session_id": updated_manifest.session_id,
                "record": str(root_after),
                "status": updated_manifest.status,
            }
        )

    def _agent_legacy(self, q: dict[str, list[str]]) -> None:
        """The pre-bridge behavior. Stays one release per TECH-SPEC §7 line 690.

        Callers that pass `?legacy=true` get the old launch-thread shape;
        every other caller goes through the session-routed bridge above.
        Response gains `deprecated: true` so the shape is visible.
        """
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
                    e.get("kind") == api.RUN_STARTED
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
                "deprecated": True,
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
            builder = api.TopologyBuilder()
            topo(builder)
            builder.build()
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
            builder = api.TopologyBuilder()
            topo(builder)
            builder.build()  # validate the wiring before running
        except (SpecError, api.RegistrationError) as exc:
            self._error(400, str(exc))
            return
        except Exception as exc:  # noqa: BLE001 — TopologyBuilder.build() can raise anything a Producer's constructor does; malformed authoring spec → 400 naming the class.
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

    def _session_patch(self, session_id: str) -> None:
        """Sprint 215c: PATCH /api/session/<id>. Body:
            {"driver"?: "kimi-k2.6:cloud", "name"?: "renamed"}
        Every absent key leaves that field alone. Returns the updated
        manifest shape.

        `tools` and `per_turn` are NOT PATCH-able yet — both need
        `SessionManifest` schema growth. A body carrying them returns 400
        naming which fields are deferred; this keeps the failure explicit
        rather than silently ignoring the ask.
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
        _PATCHABLE = {"driver", "name", "tools", "per_turn"}
        _NOT_YET = {"workspace", "workspace_shape", "bundle", "seed"}
        keys = set(body.keys())
        deferred = keys & _NOT_YET
        if deferred:
            self._error(
                400,
                f"fields {sorted(deferred)} are not PATCH-able yet; "
                "SessionManifest schema growth needed (piece-B follow-up)",
            )
            return
        unknown = keys - _PATCHABLE - _NOT_YET
        if unknown:
            self._error(400, f"unknown PATCH fields: {sorted(unknown)}")
            return
        if not (keys & _PATCHABLE):
            self._error(400, "PATCH body has no mutable fields")
            return
        updated = manifest
        if "driver" in body:
            driver = body["driver"]
            if not isinstance(driver, str) or not driver:
                self._error(400, "driver must be a non-empty string")
                return
            updated = _SESSION_REGISTRY.set_driver(session_id, driver)
        if "name" in body:
            new_name = body["name"]
            if not isinstance(new_name, str) or not new_name:
                self._error(400, "name must be a non-empty string")
                return
            try:
                updated = _SESSION_REGISTRY.set_name(session_id, new_name)
            except Exception as exc:
                if isinstance(exc, NameCollision):
                    self._json(
                        {
                            "error": "name already taken",
                            "existing_session_id": getattr(exc, "existing_session_id", None),
                        },
                        409,
                    )
                    return
                raise
        if "tools" in body:
            tools_raw = body["tools"]
            if not isinstance(tools_raw, list) or not all(
                isinstance(t, str) and t for t in tools_raw
            ):
                self._error(400, "tools must be a list of non-empty strings")
                return
            # Empty list is legitimate — treated as "no restriction" (None).
            tools_value: tuple[str, ...] | None = tuple(tools_raw) if tools_raw else None
            updated = _SESSION_REGISTRY.set_tools(session_id, tools_value)
        if "per_turn" in body:
            per_turn_raw = body["per_turn"]
            if per_turn_raw is None:
                per_turn_value = ""
            elif isinstance(per_turn_raw, str):
                per_turn_value = per_turn_raw
            else:
                self._error(400, f"per_turn must be a string or null; got {type(per_turn_raw).__name__}")
                return
            updated = _SESSION_REGISTRY.set_per_turn(session_id, per_turn_value)
        self._json(
            {
                "session_id": updated.session_id,
                "name": updated.name,
                "driver": updated.driver,
                "workspace": updated.workspace,
                "workspace_shape": updated.workspace_shape,
                "record": updated.record_root,
                "status": updated.status,
            }
        )

    def do_PATCH(self) -> None:  # noqa: N802 — sprint 215c: PATCH /api/session/<id>
        path = unquote(urlparse(self.path).path)
        if not self._origin_ok():
            self._error(403, "cross-origin request rejected (Origin does not match Host)")
            return
        try:
            if path.startswith("/api/session/"):
                session_id = path[len("/api/session/") :]
                if not session_id or "/" in session_id:
                    self._error(404, f"no patch endpoint {path!r}")
                    return
                self._session_patch(session_id)
                return
            self._error(404, f"no patch endpoint {path!r}")
        except Exception as exc:  # noqa: BLE001 — top-level do_PATCH boundary: same shape as do_POST — never let a per-endpoint exception kill the daemon thread.
            self._error(500, f"{type(exc).__name__}: {exc}")

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
        except Exception as exc:  # noqa: BLE001 — top-level do_DELETE boundary: same shape as do_POST / do_PATCH.
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
            if path == "/api/applications":
                # Sprint 223 — piece E's flat manifest catalog. Response
                # shape is a JSON list of parsed specs per TECH-SPEC §7.6
                # line 1044: `{name, description, inputs_schema,
                # output_kind, runs}`. Read from the boot-loaded
                # `_APPLICATIONS` dict; the load fires at main().
                self._json(
                    [_application_spec_to_wire(spec) for spec in _APPLICATIONS.values()]
                )
                return
            if path.startswith("/api/topology/") and path.endswith("/status"):
                # Sprint 225d — GET /api/topology/<name>/status?run_id=<id>.
                # Piggybacks on _TOPOLOGY_RUNS (populated by 225a's
                # await_completion=false path); returns status derived
                # from the record's tail.
                topology_name = path[len("/api/topology/") : -len("/status")]
                run_id = parse_qs(urlparse(self.path).query).get("run_id", [""])[0]
                if not run_id:
                    self._error(400, "missing required query param `run_id`")
                    return
                self._topology_status(topology_name, run_id)
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
                    if e.get("kind") == api.RUN_STARTED
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
    cfg = _load_daemon_config()
    registry = SessionRegistry(
        session_topology_factory=_build_session_topology_from_manifest,
        turn_queue_cap=int(cfg["turn_queue_cap"]),
    )
    _SESSION_REGISTRY = registry
    # Sprint 223 — application catalog boot-scan. Scans
    # `substrate/topologies/applications/*.manifest.toml` and loads what
    # parses. `on_error="skip"` per §7.6: a fresh install has zero
    # manifests; a malformed one is logged and skipped so one bad file
    # does not kill the daemon. Served by `GET /api/applications`.
    global _APPLICATIONS
    from substrate.topologies.applications.registry import load_manifests

    _APPLICATIONS = load_manifests(on_error="skip")
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
    # Sprint 217e: bind a UDS listener alongside the TCP one. TECH-SPEC §6
    # names `~/.substrate/daemon.sock` as the primary transport, with TCP as
    # fallback. Both sockets share the same `Handler`; the CLI tries UDS first.
    # The UDS path is fixed at `~/.substrate/daemon.sock` unless
    # `SUBSTRATE_DAEMON_SOCK` overrides it (tests pass a tmp path).
    uds_path = Path(
        os.environ.get("SUBSTRATE_DAEMON_SOCK", str(Path.home() / ".substrate" / "daemon.sock"))
    )
    uds_path.parent.mkdir(parents=True, exist_ok=True)
    # Stale socket file from a crashed prior daemon: unlink so bind can succeed.
    try:
        uds_path.unlink()
    except FileNotFoundError:
        pass
    uds_srv = _UnixHTTPServer(str(uds_path), Handler)
    summary += f"; UDS at {uds_path}"
    print(summary)
    srv = ThreadingHTTPServer((HOST, PORT), Handler)
    threading.Thread(target=uds_srv.serve_forever, daemon=True).start()

    def _sigterm_handler(_signum: int, _frame: Any) -> None:
        # Sprint 215d: a second SIGTERM during shutdown is a no-op.
        if _SHUTDOWN_STARTED.is_set():
            return
        _SHUTDOWN_STARTED.set()
        print("SIGTERM received; ending sessions cleanly...", flush=True)
        outcome = _shutdown_all_sessions(per_session_timeout=10.0)
        print(
            f"shutdown: ended={outcome['ended']} "
            f"skipped_fresh={outcome['skipped_fresh']} "
            f"skipped_ended={outcome['skipped_ended']} "
            f"failed={outcome['failed']}",
            flush=True,
        )
        srv.shutdown()
        uds_srv.shutdown()
        try:
            uds_path.unlink()
        except FileNotFoundError:
            pass
        sys.exit(0)

    signal.signal(signal.SIGTERM, _sigterm_handler)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        srv.shutdown()
        uds_srv.shutdown()
        try:
            uds_path.unlink()
        except FileNotFoundError:
            pass


if __name__ == "__main__":
    main()
