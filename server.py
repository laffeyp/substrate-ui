#!/usr/bin/env python3
# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
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
import contextlib
import functools
import hashlib
import os
import re
import select
import shutil
import signal
import socket
import json
import subprocess
import sys
import tempfile
import threading
import time
import traceback
import uuid
import socketserver
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from collections.abc import Callable, Iterator
from typing import Any, cast
from urllib.parse import parse_qs, unquote, urlparse

import msgspec
from signals_gen import (
    ApiRefusedArea,
    DiffReadBase,
    FileReadEncoding,
    FilesReplacePreparedScope,
    FileWrittenWritten,
    Signal,
    SessionCreatedWorkspaceShape,
    TraceOpenedProcess,
)
from substrate import api
from substrate.topologies import bundled
from substrate.topologies.session.environment import session_baseline
from substrate.topologies.session.vocabulary import (
    HANDOFF_DEFAULT,
    LENGTH_DEFAULT,
    TONE_DEFAULT,
    Control,
)
from substrate.adapters.harness_streams import SUBSTRATE_MCP_SERVER
from substrate.topologies.session.mcp_channel import handle_jsonrpc
from substrate.topologies.session.model_class import (
    GuidanceLevel,
    class_variant,
    classify,
    guidance_bundle,
    guidance_level,
)
from substrate.topologies.session.skills import make_skill_tool
from substrate.topologies.tool_loop.delegate import make_delegate
from substrate.topologies.tool_loop.tools import full_suite

from session_errors import (
    FRESH_SESSION_NEVER_OPENED,
    RECORD_TORN,
    SESSION_DELETED,
    SESSION_ENDED_MID_TURN,
)
from substrate.app import (
    FreshSessionRequiresUserMessage,
    NameCollision,
    SessionEndedMidTurn,
    SessionManifest,
    SessionRegistry,
    SessionStatus,
    TornRecordOnResume,
    build,
    language_view,
    release_python_home,
    review,
    run_hold,
)
from substrate.app import daemon_client as _substrate_daemon_client
from substrate.adapters import DriverParamKey
from substrate.adapters.models import (
    CliResponder,
    DeterministicResponder,
    OllamaResponder,
    ollama_base_url,
)


class _UnixHTTPServer(socketserver.ThreadingUnixStreamServer):
    """Sprint 217e: UDS variant of ThreadingHTTPServer. `BaseHTTPRequestHandler`
    reads `self.server.server_name` and `server_port` in `date_time_string`;
    `ThreadingUnixStreamServer` does not set them (no host/port for a Unix
    socket). Synthesized here so the handler runs unchanged over UDS.
    Threads are daemon so a graceful shutdown does not have to wait on them.
    """

    daemon_threads = True

    def __init__(self, socket_path: str, app: App) -> None:
        super().__init__(socket_path, Handler)
        self.server_name = "localhost"
        self.server_port = 0
        self.app = app


@dataclass
class App:
    """Everything the console's request handlers share, built once by `main()` and handed to both
    HTTP servers; a handler reads it as `self.app` (lens audit F318, F412: these were 13
    module-level tables that every test reassigned or relied on the conftest to restore). A test
    builds its own App and serves it with `_serving.serving(app)`."""

    # The session catalog and its per-session locks; None until `install_registry`.
    registry: SessionRegistry | None = None
    # Application manifests (`GET /api/applications`); empty answers `[]`, not 500.
    applications: dict[str, Any] = field(default_factory=dict)
    # run_id -> {"record_root", "thread", "started_at", "application", "await_completion"} for
    # POST /api/topology/<name>/run; GET .../status reads it.
    topology_runs: dict[str, dict[str, Any]] = field(default_factory=dict)
    # Set once shutdown starts, so a second SIGTERM is a no-op.
    shutdown_started: threading.Event = field(default_factory=threading.Event)
    # UI sprint 168: session_id -> (the record's size on disk, its language view). The view is
    # recomputed only when the record has grown.
    language_cache: dict[str, tuple[int, dict[str, Any]]] = field(default_factory=dict)
    # Responders by (driver name, params key), shared across sessions on purpose: an
    # OllamaResponder's connection pool is costly to rebuild per turn, and a rate-limit semaphore
    # must bound the whole process (REVIEW-2026-08-28 Q9). DeterministicResponder is never cached:
    # its seed is state.
    # Key: (driver, params, workspace); the workspace is set for CLI drivers only (sprint 114).
    responder_cache: dict[tuple[str, tuple[tuple[str, Any], ...], str | None, str | None], Any] = (
        field(default_factory=dict)
    )
    model_thinking_cache: dict[str, bool] = field(default_factory=dict)
    version_cache: dict[str, dict[str, Any]] = field(default_factory=dict)
    version_cache_at: dict[str, float] = field(default_factory=dict)
    cli_pty_lock: threading.Lock = field(default_factory=threading.Lock)
    cli_pty_sessions: dict[str, dict[str, Any]] = field(default_factory=dict)
    record_summary_cache: dict[Path, tuple[tuple[tuple[str, int, int], ...], dict[str, object]]] = (
        field(default_factory=dict)
    )
    record_summary_lock: threading.Lock = field(default_factory=threading.Lock)
    assay_cache: dict[str, tuple[float, dict[str, object]]] = field(default_factory=dict)
    # The address a harness driver reaches this daemon's MCP endpoint on (UI sprint 129); set when
    # the TCP server binds. None: no TCP server, so no driver is given MCP.
    mcp_base: str | None = None

    def install_registry(
        self, base: Path | None = None, *, turn_queue_cap: int = 4, auto_boot: bool = True
    ) -> SessionRegistry:
        """A session registry under `base` whose turns build this App's session topology."""
        self.registry = SessionRegistry(
            base=base,
            session_topology_factory=functools.partial(_build_session_topology_from_manifest, self),
            turn_queue_cap=turn_queue_cap,
            auto_boot=auto_boot,
        )
        return self.registry


class AppHTTPServer(ThreadingHTTPServer):
    """The TCP listener; carries the App its handlers read."""

    def __init__(self, address: tuple[str, int], app: App) -> None:
        super().__init__(address, Handler)
        self.app = app
        app.mcp_base = f"http://127.0.0.1:{self.server_address[1]}"


# REVIEW-2026-08-28 Q6: the six "record mid-write; poll again" sites
# used to catch bare Exception, which swallowed every bug inside
# `api.read_record` + every bug in the filter predicate + every bug
# in the payload access. The correct shape names the record-io classes.
# `api.RecordGapError` covers a torn sealed tail; `api.FsyncError`
# covers a durability write hole; `OSError` covers the file-not-yet-
# created race a fresh session's poll hits. Everything else — a
# KeyError from a shape drift, a TypeError from a broken filter —
# propagates and surfaces on the caller's response.
_RECORD_IO_ERRORS: tuple[type[BaseException], ...] = (
    api.RecordGapError,
    api.FsyncError,
    OSError,
)


def _tail_seq(record_root: Path) -> int:
    """The record's highest seq, -1 when it has none, from its last frame alone (lens audit F310:
    the turn, end and run handlers read the whole record to find this one number)."""
    try:
        last = api.read_last_envelope(record_root)
    except _RECORD_IO_ERRORS:
        return -1
    return int(last["seq"]) if last is not None else -1


def _application_spec_to_wire(spec: Any) -> dict[str, Any]:
    """Local wire adapter re-export so the handler stays import-side-effect free."""
    from substrate.topologies.applications.registry import spec_to_wire

    return spec_to_wire(spec)


def _params_cache_key(params: dict[str, Any] | None) -> tuple[tuple[str, Any], ...]:
    """Turn a driver_params dict into a hashable, order-independent cache key.
    Empty dict and None hash the same (both mean "responder defaults"). A deterministic session's
    `script` (UI sprint 182) is the session's tool calls, not the responder's, so it is left out."""
    if not params:
        return ()
    return tuple(sorted((k, v) for k, v in params.items() if k != DriverParamKey.SCRIPT))


def _mcp_url(app: App, session_id: str) -> str:
    return f"{app.mcp_base}/api/session/{session_id}/mcp"


def _owned_workspace(workspace: str | None) -> bool:
    """Whether a workspace is a per-session sandbox, which only Substrate uses."""
    if not workspace:
        return False
    try:
        return Path(workspace).resolve().is_relative_to(_sessions_base().resolve())
    except OSError:
        return False


def _mcp_flags(
    app: App, name: str, session_id: str | None, workspace: str | None = None
) -> list[str]:
    """The flags that hand a harness driver this daemon's MCP endpoint for one session (UI sprint
    129, kernel K284), or none: the driver's profile names no MCP style, there is no session, or
    the daemon has no TCP address. cursor-agent reads MCP servers only from `.cursor/mcp.json` in
    its workspace (a parent folder's is not read, tested 2026-10-10), so it gets MCP only in a
    per-session sandbox, where `_write_mcp_config` puts that file; in a folder the operator picked
    it gets the stream alone and nothing is written there."""
    style = KNOWN_CLI_ADAPTERS.get(name, {}).get("mcp_style")
    if not style or not session_id or not app.mcp_base:
        return []
    url = _mcp_url(app, session_id)
    if style == "cursor-workspace-file":
        return ["--approve-mcps"] if _owned_workspace(workspace) else []
    if style == "claude-mcp-config":
        server = {"mcpServers": {SUBSTRATE_MCP_SERVER: {"type": "http", "url": url}}}
        return ["--mcp-config", json.dumps(server)]
    if style == "codex-config":
        return ["-c", f"mcp_servers.{SUBSTRATE_MCP_SERVER}.url={json.dumps(url)}"]
    raise ValueError(f"{name}: unknown mcp_style {style!r}")


def _write_mcp_config(app: App, name: str, session_id: str, workspace: str) -> None:
    """cursor-agent's MCP config, in a per-session sandbox only (see `_mcp_flags`)."""
    if KNOWN_CLI_ADAPTERS.get(name, {}).get("mcp_style") != "cursor-workspace-file":
        return
    if not app.mcp_base or not _owned_workspace(workspace):
        return
    config = Path(workspace) / ".cursor" / "mcp.json"
    config.parent.mkdir(parents=True, exist_ok=True)
    servers = {"mcpServers": {SUBSTRATE_MCP_SERVER: {"url": _mcp_url(app, session_id)}}}
    config.write_text(json.dumps(servers), encoding="utf-8")


def _daemon_driver_resolver(
    app: App,
    name: str,
    params: dict[str, Any] | None = None,
    *,
    workspace: str | None = None,
    session_id: str | None = None,
) -> Any:
    """Daemon-side resolver: `deterministic` → seeded stub; `claude` / `gemini` →
    CliResponder; anything else → OllamaResponder (a real local or `:cloud` tag).
    Sprint 213a's `_default_model_resolver` in substrate ships a smaller default
    without CLI knowledge; the daemon knows more, so it wraps.

    F13: cached by `(driver name, params key)` so the HTTP client + connection
    pool survive across turns for the same param combo. A param change lands a
    fresh Responder instance (cache miss on the new key); the old one lingers in
    the cache until the process exits — fine because Responders are lightweight
    and the daemon's session count is bounded. DeterministicResponder is
    excluded (stateful seed).

    Sprint 032c (piece G mechanical translation): `params` names the per-session
    driver knobs OllamaResponder accepts at construction — `think`, `max_tokens`,
    `timeout`, `num_ctx`. None or empty means "responder defaults." Ignored for
    the CLI-adapter and Deterministic branches (those adapters have no equivalent
    knobs; documented as such).

    Sprint 114: `workspace` is the session's workspace. A CLI adapter runs its
    subprocess there, so the CLI agent reads and writes the session's files; the
    CLI branch's cache key carries it, so two sessions on one CLI driver hold two
    Responders. The Ollama and deterministic branches ignore it.
    """
    cli_workspace = workspace if name in KNOWN_CLI_ADAPTERS else None
    mcp_flags = _mcp_flags(app, name, session_id, cli_workspace)
    # A responder carrying a session's MCP address belongs to that session alone.
    key = (name, _params_cache_key(params), cli_workspace, session_id if mcp_flags else None)
    cached = app.responder_cache.get(key)
    if cached is not None:
        return cached
    if name == "deterministic":
        # DeterministicResponder is stateful; skip cache entirely.
        return DeterministicResponder(seed=0)
    if name in KNOWN_CLI_ADAPTERS:
        # One catalog, one source of truth. Adding a CLI adapter here
        # requires only the KNOWN_CLI_ADAPTERS entry above.
        # Sprint 087: params may name a specific model version via
        # `driver_version`. The cache key already folds params in, so
        # two versions of the same CLI cache as two Responders.
        version = None
        if isinstance(params, dict):
            raw = params.get("driver_version")
            if isinstance(raw, str) and raw:
                version = raw
        cli_cmd = _cli_command(app, name, version=version)
        if cli_cmd is None:
            raise ValueError(f"no command for CLI driver {name!r}")
        # Responder.name carries the version too so log lines and
        # error messages point at the exact model that failed.
        display_name = f"{name}:{version}" if version else name
        profile = KNOWN_CLI_ADAPTERS[name]
        responder: Any = CliResponder(
            cli_cmd + mcp_flags,
            name=display_name,
            cwd=cli_workspace,
            system_flag=profile.get("system_flag"),
            env=profile.get("env"),
            stream_format=profile.get("stream_format"),
            stream_flags=profile.get("stream_flags"),
        )
    else:
        p = params or {}
        # Sprint 051: num_ctx must match the model's advertised context, not
        # a hardcoded 32768. Live probe (2026-08-31) confirmed Ollama
        # SILENTLY TRUNCATES a prompt that exceeds num_ctx — sent a ~2000-
        # token prompt with num_ctx=512, got prompt_eval_count=258 back,
        # no warning field, no error, just the tail of the prompt. That
        # means: our compaction budgeted against kimi's 262144-token
        # advertised context (via resolve_driver_context_tokens), but the
        # responder built here capped Ollama input at 32768. Kimi silently
        # lost ~200 K tokens per turn and the TranscriptCompacted event
        # on the record undercounted what actually got dropped.
        #
        # Resolution: probe /api/show once at responder construction
        # (light call, cached process-wide by resolve_driver_context_tokens
        # too), cap at 262144 in case of a runaway advert, and let the
        # user override with a smaller num_ctx if VRAM matters. The
        # session topology also passes this same value to compaction
        # via resolve_driver_context_tokens — one number, two consumers.
        probe = OllamaResponder(model=name)  # for the /api/show probe only
        try:
            advertised = probe.context_tokens()
        except Exception:  # noqa: BLE001 — /api/show unreachable → fall back
            advertised = 32768
        num_ctx_default = min(advertised, 262144)
        # Sprint 085 followup — think capability is per model. Ollama returns
        # 400 "model does not support thinking" when think:true is sent to
        # a non-thinking model (e.g. huihui_ai/qwen2.5-coder-abliterate:7b).
        # Sprint 045 defaulted think=True across the board for the cloud
        # reasoning models; that broke local coder models. Probe the
        # model's capabilities via /api/show and let it decide.
        think_default = _model_supports_thinking(app, name)
        responder = OllamaResponder(
            model=name,
            # Cloud reasoning models (kimi/glm/nemotron/deepseek-v4) advertise
            # `thinking` in /api/show capabilities and get think=True by
            # default. Coder models (qwen2.5-coder, etc) do not and get
            # think=False. Explicit driver_params["think"] wins over the probe.
            think=bool(p.get("think", think_default)),
            max_tokens=int(p.get("max_tokens", 0)),
            num_ctx=int(p.get("num_ctx", num_ctx_default)),
            timeout=float(p["timeout"]) if p.get("timeout") is not None else None,
        )
    app.responder_cache[key] = responder
    return responder


def _load_daemon_config(config_path: Path | None = None) -> dict[str, Any]:
    """Sprint 216: read `~/.substrate/config.toml` for daemon knobs. Returns
    `{"turn_queue_cap": int}` with defaults filled. Missing file or missing
    keys use defaults; a malformed file logs a warning and uses defaults.
    """
    import tomllib

    path = config_path if config_path is not None else api.substrate_home() / "config.toml"
    defaults: dict[str, Any] = {"turn_queue_cap": 4}
    if not path.exists():
        return defaults
    try:
        with path.open("rb") as fp:
            data = tomllib.load(fp)
    except (OSError, tomllib.TOMLDecodeError) as exc:
        print(f"daemon config at {path}: {api.describe_error(exc)}; using defaults", flush=True)
        return defaults
    section = data.get("session")
    session_section = section if isinstance(section, dict) else {}
    cap = session_section.get("turn_queue_cap", defaults["turn_queue_cap"])
    if isinstance(cap, int) and cap >= 1:
        defaults["turn_queue_cap"] = cap
    return defaults


def _interrupt_then_end(
    app: App, session_id: str, source: str, timeout_seconds: float
) -> tuple[Any, Path]:
    """End a session, interrupting its running turn first. UI sprint 101 (quit) and 107 (`/end`
    and the child cascade): turns have no time limit and the end turn waits for the session's
    lock, so ending a session mid-turn used to wait for the model to finish. A hard interrupt
    stops the turn the way ctrl+c does (it parks; the record says it was cancelled), then the
    end turn runs. Raises what `turn_sync` raises."""
    from substrate.topologies.session import SessionEndRequested

    if app.registry is None:
        raise RuntimeError("no session registry: the daemon has not started")
    manifest = app.registry.get(session_id)
    if manifest is not None and manifest.status == SessionStatus.RUNNING:
        try:
            app.registry.interrupt(session_id, tier="hard")
        except Exception as exc:  # noqa: BLE001 — best-effort; the end below still runs
            traceback.print_exception(exc)
    return app.registry.turn_sync(
        session_id,
        resume_event=SessionEndRequested(session_id=session_id, source=source),
        timeout_seconds=timeout_seconds,
    )


# The domain an /api/ path belongs to (API_REFUSED.area, SERVER_FAULTED.area; vocabulary v0.11).
# Most specific first; a path no route serves is "unrouted".
_AREA_RULES: tuple[tuple[str, ApiRefusedArea], ...] = (
    (r"/api/session/[^/]+/(turn|interrupt)", ApiRefusedArea.TURN),
    (r"/api/session/[^/]+/(files|file|diff|search|search/replace|files/find|files/list)(/watch)?", ApiRefusedArea.FILES),
    (r"/api/session/[^/]+/children", ApiRefusedArea.CHILDREN),
    (r"/api/session/[^/]+/language(/.*)?", ApiRefusedArea.LANGUAGE),
    (r"/api/session/[^/]+/mcp", ApiRefusedArea.MCP),
    (r"/api/session/[^/]+/runs(/.*)?", ApiRefusedArea.RUNS),
    (r"/api/session/[^/]+/tasks(/.*)?", ApiRefusedArea.TASKS),
    (r"/api/sessions?(/.*)?", ApiRefusedArea.SESSION),
    (r"/api/workspaces(/.*)?", ApiRefusedArea.WORKSPACE),
    (r"/api/cli/.*", ApiRefusedArea.CLI),
    (r"/api/records(/.*)?", ApiRefusedArea.RECORDS),
    (r"/api/runs(/.*)?", ApiRefusedArea.RUNS),
    (r"/api/assays?(/.*)?", ApiRefusedArea.ASSAYS),
    (r"/api/(topology|applications)(/.*)?", ApiRefusedArea.TOPOLOGY),
    (r"/api/models(/.*)?", ApiRefusedArea.MODELS),
    (r"/api/bundles(/.*)?", ApiRefusedArea.BUNDLES),
    (r"/api/agent", ApiRefusedArea.AGENT),
    (r"/api/(diff|worktree_diff)", ApiRefusedArea.DIFF),
    (r"/api/resolve_child", ApiRefusedArea.CHILDREN),
)


def _api_area(path: str) -> ApiRefusedArea:
    for pattern, area in _AREA_RULES:
        if re.fullmatch(pattern, path):
            return area
    return ApiRefusedArea.UNROUTED


def _site(skip: tuple[str, ...]) -> str:
    """function:line of the first frame above the named helpers."""
    for frame in reversed(traceback.extract_stack()[:-1]):
        if frame.name not in skip:
            return f"{frame.name}:{frame.lineno}"
    return "unknown"


class _Trace:
    """The server's part of the launch trace (vocabulary v0.8; plan
    process/planning/2026-11-05-sdd-signals, item 2). Electron main names the launch's folder and
    boot id in SUBSTRATE_TRACE_DIR and SUBSTRATE_BOOT_ID; this writes server.jsonl there, one JSON
    object per line with the record context (boot_id, process, proc_seq, wall, window_id null).
    Writes are synchronous appends under a lock (the HTTP server is threaded), so lines stay in
    order and every failure is seen. A line that cannot be written is counted and reported to main
    on stdout as `substrate-ui trace_lost=<total>`: the first loss at once, later ones on the next
    line that is written and at shutdown (`flush_loss`). Main writes each report to main.jsonl as
    TRACE_LOST (process server), so a capped or unopenable server.jsonl still has its losses in the
    trace. No size cap ("no cap on the trace", 2026-11-05); SUBSTRATE_SERVER_TRACE_CAP (bytes) sets
    one for the loss gate only. Without the folder (the server run alone, the Python tests) nothing
    is written and nothing is reported."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._boot = os.environ.get("SUBSTRATE_BOOT_ID", "")
        self._seq = 0
        self._bytes = 0
        self._reported = 0
        self._announced = False
        self.lost = 0
        try:
            self._cap = int(os.environ.get("SUBSTRATE_SERVER_TRACE_CAP", "0")) or 0
        except ValueError:
            self._cap = 0
        self._fd: int | None = None
        folder = os.environ.get("SUBSTRATE_TRACE_DIR")
        self._on = bool(folder)
        if folder:
            try:
                self._fd = os.open(
                    os.path.join(folder, "server.jsonl"),
                    os.O_WRONLY | os.O_CREAT | os.O_APPEND,
                    0o644,
                )
            except OSError as exc:
                self._fd = None
                print(f"trace: server.jsonl not opened in {folder}: {exc}", flush=True)

    def _write(self, name: str, payload: dict[str, Any]) -> bool:
        rec = {
            "boot_id": self._boot,
            "process": "server",
            "proc_seq": self._seq,
            "wall": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime())
            + f".{int(time.time() * 1000) % 1000:03d}Z",
            "window_id": None,
            "name": name,
            "payload": payload,
        }
        self._seq += 1
        line = (json.dumps(rec, separators=(",", ":")) + "\n").encode()
        if self._fd is None or (self._cap and self._bytes + len(line) > self._cap):
            self.lost += 1
            return False
        try:
            os.write(self._fd, line)
        except OSError:
            self.lost += 1
            return False
        self._bytes += len(line)
        return True

    def _report(self) -> None:
        # stdout is main's pipe; main parses this line (electron/main.ts, SERVER_LOSS_RE).
        self._reported = self.lost
        try:
            print(f"substrate-ui trace_lost={self.lost}", flush=True)
        except OSError:
            pass

    def emit(self, name: Signal, payload: dict[str, Any]) -> None:
        """Writes the record. The tag is a generated name (signals_gen.py, sprint 363)."""
        if not self._on:
            return
        with self._lock:
            wrote = self._write(name, payload)
            if self.lost > self._reported and (wrote or not self._announced):
                self._announced = not wrote
                self._report()

    def flush_loss(self) -> None:
        """At shutdown: report losses not yet reported (a capped file never writes again)."""
        with self._lock:
            if self.lost > self._reported:
                self._report()


TRACE = _Trace()


def _fault_where(exc: BaseException) -> str:
    """The deepest server.py function an exception passed through (SERVER_FAULTED.where, RUN_FAULTED,
    SERVER_UNCAUGHT); unknown when it never passed through this file."""
    where = "unknown"
    tb = exc.__traceback__
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == __file__:
            where = tb.tb_frame.f_code.co_name
        tb = tb.tb_next
    return where


def _install_fault_hooks() -> None:
    """An exception that escapes a server thread outside the request handlers is written as
    SERVER_UNCAUGHT (vocabulary v0.24, P-0.24-FAULTS), then handed to the hook that was there before,
    so Python prints it as it always did. The main thread's own uncaught exception goes through
    sys.excepthook the same way."""
    before_thread = threading.excepthook
    before_sys = sys.excepthook

    def on_thread(args: threading.ExceptHookArgs) -> None:
        if args.exc_value is not None and not isinstance(args.exc_value, SystemExit):
            TRACE.emit(
                Signal.SERVER_UNCAUGHT,
                {
                    "thread": args.thread.name if args.thread is not None else "unknown",
                    "error_type": type(args.exc_value).__name__,
                    "where": _fault_where(args.exc_value),
                },
            )
        before_thread(args)

    def on_main(kind: type[BaseException], value: BaseException, tb: Any) -> None:
        if not isinstance(value, (SystemExit, KeyboardInterrupt)):
            TRACE.emit(
                Signal.SERVER_UNCAUGHT,
                {"thread": "MainThread", "error_type": kind.__name__, "where": _fault_where(value)},
            )
        before_sys(kind, value, tb)

    threading.excepthook = on_thread
    sys.excepthook = on_main


def _shutdown_all_sessions(app: App, *, per_session_timeout: float = 10.0) -> dict[str, int]:
    """Sprint 215d + 217a: end every running/parked session cleanly on daemon
    shutdown. For each manifest whose status is not `ended` or `interrupted`,
    inject `SessionEndRequested(session_id, source="daemon_shutdown")` via
    `SessionRegistry.turn_sync`. The session topology's `end-on-user-end`
    trigger reads the source and yields `SessionEnded{reason: "daemon_shutdown"}`;
    `RunFinalised` follows; `turn_sync` transitions the manifest to `"ended"`.

    Sprint 217a: `FreshSessionRequiresUserMessage` catches the fresh-session
    edge — a manifest whose record was never opened (created via POST /session
    but no /turn ever fired). SIGTERM's SessionEndRequested cannot open a
    fresh record via the `first_message` path; the manifest transitions to
    `"ended"` at the daemon layer without opening the record on disk.

    Sequential — waits up to `per_session_timeout` seconds per session,
    matching the parent card's "wait up to 10s per session for graceful
    pause, then exit" wording. Best-effort per session: an exception on
    one session does not stop the loop.

    Returns `{"ended": N, "skipped_fresh": F, "skipped_ended": M, "failed": K, "background_stopped": B}`:
      - ended:         SessionEndRequested drove a clean SessionEnded on the record
      - skipped_fresh: manifest had no record on disk; transitioned to "ended"
                       at the daemon layer without opening
      - skipped_ended: manifest already had status "ended" or "interrupted"
                       before the sweep — nothing to do
      - failed:        an unexpected exception on one session; the sweep continued
      - background_stopped: bash background tasks stopped at quit (UI sprint 103)
    """
    result = {
        "ended": 0,
        "skipped_fresh": 0,
        "skipped_ended": 0,
        "failed": 0,
        "background_stopped": 0,
    }
    if app.registry is None:
        return result
    # UI sprint 103: background commands do not outlive the daemon (Claude Code cleans its
    # background tasks up at exit). This runs first and the sweep below cannot undo it.
    try:
        from substrate.topologies.tool_loop.background import TABLE as _BG

        result["background_stopped"] = _BG.stop_all("the app quit")
    except Exception as exc:  # noqa: BLE001 — shutdown must not raise
        traceback.print_exception(exc)
    for manifest in list(app.registry.list_all()):
        if manifest.status in (SessionStatus.ENDED, SessionStatus.INTERRUPTED):
            result["skipped_ended"] += 1
            continue
        try:
            _interrupt_then_end(app, manifest.session_id, "daemon_shutdown", per_session_timeout)
            result["ended"] += 1
        except Exception as exc:  # noqa: BLE001 — best-effort; log and move on
            if isinstance(exc, FreshSessionRequiresUserMessage):
                # Fresh session: no record on disk to end. Transition the
                # manifest to "ended" at the daemon layer without opening
                # the run. Rule 12 preserves nothing (no record existed);
                # the manifest hint just gets a terminal status.
                try:
                    app.registry.update_status(manifest.session_id, SessionStatus.ENDED)
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

    # UI sprint 103: the session id owns the bash tool's background tasks, so this session's tools
    # see only its tasks and ending or deleting the session stops them.
    all_tools = full_suite(Path(manifest.workspace), owner=manifest.session_id)
    allowed = _allowed_tool_names(manifest)
    if allowed is None:
        return all_tools
    return {name: tool for name, tool in all_tools.items() if name in allowed}


def _allowed_tool_names(manifest: Any) -> set[str] | None:
    """The session's tool allow-list, or None for unrestricted. It governs every tool the session
    binds, the substrate toolkit (delegate, run_topology, …) included (UI sprint 109, N001: the
    toolkit was added after the filter, so a read-only reviewer could still delegate)."""
    if not manifest.tools:
        return None
    allowed = set(manifest.tools)
    if "bash" in allowed:  # a task the model can start, it must be able to read and stop
        allowed |= {"bash_output", "bash_stop", "bash_tasks"}
    return allowed


# ── sprint 225a: application dispatch — one-shot topology launcher ──────


def _build_code_review_from_inputs(
    app: App, inputs: dict[str, Any], folder: Path
) -> Callable[..., Any]:
    """`fanout_review_topology` — inputs.<role>_model per DEFAULT_ROLES
    resolve into the `responders` dict; `judge_model` into `judge`. A CLI
    role runs in the repo under review, not the run folder (sprint 115)."""
    from substrate.topologies.applications.fanout_review import fanout_review_topology
    from substrate.topologies.code_review import DEFAULT_ROLES

    repo = str(inputs["repo"])
    responders = {
        role: _daemon_driver_resolver(app, str(inputs[f"{role}_model"]), workspace=repo)
        for role in DEFAULT_ROLES
    }
    judge = _daemon_driver_resolver(app, str(inputs["judge_model"]), workspace=repo)
    return fanout_review_topology(
        repo=repo,
        ref=str(inputs.get("ref", "HEAD~1")),
        responders=responders,
        judge=judge,
        quorum=int(inputs.get("quorum", 3)),
    )


def _build_best_of_n_verified_from_inputs(
    app: App, inputs: dict[str, Any], folder: Path
) -> Callable[..., Any]:
    """`best_of_n_verified_topology` — drafter_model + verify_model both
    resolve into Responders. The verify=Check | Responder union collapses
    to Responder here; a deterministic-check variant is a future card."""
    from substrate.topologies.applications.best_of_n_verified import best_of_n_verified_topology

    return best_of_n_verified_topology(
        task=str(inputs["task"]),
        drafter=_daemon_driver_resolver(app, str(inputs["drafter_model"]), workspace=str(folder)),
        verify=_daemon_driver_resolver(app, str(inputs["verify_model"]), workspace=str(folder)),
        n=int(inputs.get("n", 3)),
        max_rounds=int(inputs.get("max_rounds", 2)),
    )


def _build_research_sweep_from_inputs(
    app: App, inputs: dict[str, Any], folder: Path
) -> Callable[..., Any]:
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
        reader=_daemon_driver_resolver(app, str(inputs["reader_model"]), workspace=str(folder)),
        critic=_daemon_driver_resolver(app, str(inputs["critic_model"]), workspace=str(folder)),
        synthesizer=_daemon_driver_resolver(
            app, str(inputs["synthesizer_model"]), workspace=str(folder)
        ),
    )


# Dispatch table: manifest.name -> callable that builds the topology from
# the wire inputs. New applications wire in one entry per name. The
# manifest's [inputs] schema still gates required fields at the endpoint
# layer; this table only knows how to translate resolved values into
# topology kwargs (including the role-to-Responder mapping). `folder` is the
# run's own directory, where a CLI role runs (sprint 115); the launcher makes it
# and removes it when the run ends.
_APP_BUILDERS: dict[str, Callable[[App, dict[str, Any], Path], Callable[..., Any]]] = {
    "code_review": _build_code_review_from_inputs,
    "best_of_n_verified": _build_best_of_n_verified_from_inputs,
    "research_sweep": _build_research_sweep_from_inputs,
}


def _build_pair_coding_composite(session_registry: Any, inputs: dict[str, Any]) -> tuple[Any, Any]:
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
    app: App, manifest: Any, first_turn_user_message: Any = None
) -> Any:
    """The `session_topology_factory` closure the SessionRegistry calls per turn.
    Reconstructs the session_topology from a manifest's persistent fields —
    driver string, workspace, seed, session_id. The daemon binds this at boot.

    Sprint 217a: `first_turn_user_message` threads the first-turn UserMessage
    into the topology's `first_message` producer when `turn_sync` detects an
    empty record and composes `Runtime.run(...)`. On subsequent turns the
    argument is None; the topology registers no `first_message` producer
    and `Runtime.resume(topology, resume_event=UserMessage)` continues the run.
    """
    from substrate.topologies.session import session_topology
    from substrate.topologies.session.transcript import resolve_driver_context

    # UI sprint 159: a session opened before workspaces were expanded at open stores
    # `~/.substrate/sandbox`; a CLI driver given that as its cwd fails with FileNotFoundError on
    # every turn. Resolve it once, by the open's own rule, for every use below; the manifest on
    # disk is left as it is.
    if isinstance(manifest, msgspec.Struct) and str(cast(Any, manifest).workspace).startswith("~"):
        manifest = msgspec.structs.replace(
            manifest, workspace=_resolve_workspace_arg(cast(Any, manifest).workspace)
        )

    responder = _daemon_driver_resolver(
        app,
        manifest.driver,
        manifest.driver_params,
        workspace=manifest.workspace,
        session_id=manifest.session_id,
    )
    # UI sprint 129: a harness driver given this daemon's MCP endpoint takes the session's tools
    # as registered MCP tools (kernel K284).
    mcp_on = bool(_mcp_flags(app, manifest.driver, manifest.session_id, manifest.workspace))
    if mcp_on:
        _write_mcp_config(app, manifest.driver, manifest.session_id, manifest.workspace)
    session_tools = _tools_for_manifest(manifest)
    # Sprint 228: fold the substrate toolkit (piece F sprints 226-228)
    # into every session's tool suite alongside full_suite. The tools
    # accept an injected daemon client + registries — substrate._daemon
    # is the shipped wire client; the daemon binds its own registries
    # here so every session sees the CURRENT applications catalog,
    # session list, and record dir.
    from substrate.app import daemon_client as _substrate_daemon
    from substrate.topologies.tool_loop.substrate_tools import (
        make_inspect_record,
        make_list_applications,
        make_list_records,
        make_list_sessions,
        make_list_topologies,
        make_run_topology,
        make_run_topology_poll,
    )

    session_tools = {
        **session_tools,
        "run_topology": make_run_topology(_substrate_daemon),
        "run_topology_poll": make_run_topology_poll(_substrate_daemon),
        "inspect_record": make_inspect_record(),
        "list_records": make_list_records(_sessions_base()),
        "list_topologies": make_list_topologies(),
        "list_applications": make_list_applications(app.applications),
        "list_sessions": make_list_sessions(cast(SessionRegistry, app.registry)),
        # Sprint 053: fold `delegate` in, closing the Sprint 228 card-vs-implementation
        # drift the shakeout (sprint 052) surfaced. Sprint 228's card specified eight
        # substrate-toolkit tools including delegate; commit c455b5a shipped seven.
        # Kernel K333: every child is a session in the registry, on this session's model unless
        # the call names another, with this session's bundle, controls and tools.
        "delegate": make_delegate(
            session_registry=cast(SessionRegistry, app.registry),
            parent_session_id=manifest.session_id,
            parent_record_root=Path(manifest.record_root),
        ),
        # Kernel K330-K332: the session holds the runs it starts. `build` works one task on a new
        # branch, `review` starts one reviewer per style; `run` stops, steps through and replays
        # them.
        build.BUILD_TOOL_NAME: build.make_build_tool(
            functools.partial(_start_build, app, manifest), Path(manifest.workspace)
        ),
        review.REVIEW_TOOL_NAME: review.make_review_tool(
            functools.partial(_start_review, app, manifest)
        ),
        run_hold.RUN_TOOL_NAME: run_hold.make_run_tool(manifest.session_id),
    }
    # Kernel K277: the `skill` tool loads a named guide (dellm) when the user asks for it.
    model_class = _model_class(manifest.driver)
    session_tools["skill"] = make_skill_tool(Path(manifest.workspace), model_class)
    allowed = _allowed_tool_names(manifest)
    if allowed is not None:
        session_tools = {name: tool for name, tool in session_tools.items() if name in allowed}
    # § S.9: the window and the layer it came from (CLI settings, documented, config, default).
    context_tokens, context_source = resolve_driver_context(manifest.driver, responder)
    topo = session_topology(
        driver=responder,
        driver_name=manifest.driver,
        driver_context_tokens=context_tokens,
        driver_context_source=context_source,
        # Kernel K296: the Length and Tone positions, at their defaults when the manifest names none.
        length=manifest.length or LENGTH_DEFAULT,
        tone=manifest.tone or TONE_DEFAULT,
        # Kernel K334 (§ Y): how readily the model hands work to a topology.
        handoff=manifest.handoff or HANDOFF_DEFAULT,
        seed=manifest.seed,
        tools=session_tools,
        per_turn=manifest.per_turn,
        max_turns=200,
        turn_max_steps=24,
        session_id=manifest.session_id,
        workspace_path=manifest.workspace,
        # Sprint 240 wires SessionStarted; thread the manifest fields
        # required by that envelope's schema.
        workspace_shape=manifest.workspace_shape,
        # UI sprint 132: the guidance level was resolved at creation and is on the manifest; the
        # session reads that bundle every turn (no per-turn remap by model class).
        bundle=manifest.bundle,
        parent_session_id=manifest.composite_of,
        # UI sprint 182: a deterministic session may carry its tool calls in its driver params.
        # An empty script still means scripted, so no script param passes None.
        script=[(str(t), list(a)) for t, a in (manifest.driver_params or {})["script"]]
        if manifest.driver == "deterministic" and (manifest.driver_params or {}).get("script")
        else None,
        first_turn_user_message=first_turn_user_message,
        mcp=mcp_on,
        # Kernel K310-K311 (vocabulary v0.11 § W): each turn's language is measured before it
        # returns, and LanguageProfile / LanguageDrift land on the record.
        language=True,
        # The role prompt resolves against the session's workspace, the same root the create-time
        # check used. Before 2026-10-08 neither argument was passed and no UI session carried its
        # role's prompt (lens audit F316, N004).
        role=class_variant(manifest.role, model_class)
        if manifest.role == "default"
        else manifest.role,
        role_repo_root=Path(manifest.workspace),
        # Kernel sprint K273: the environment the model is told about, computed here because it
        # reads git, the clock and the platform. The session records it once, at open.
        baseline=session_baseline(
            manifest.workspace,
            manifest.driver,
            tuple(str(a) for a in getattr(responder, "command", ())),
        ),
        # UI sprint 121: the opt-in layout, only where the driver has a system channel.
        cache_layout=_cache_layout_refusal(manifest.driver, manifest.driver_params) is None
        and bool((manifest.driver_params or {}).get("cache_layout")),
        # Kernel K276: the operator's and the workspace repo's memory indexes, at session open.
        memory=True,
        model_class=model_class,
    )
    return topo


def _run_driver(app: App, manifest: Any) -> tuple[Callable[[Path], Any], int]:
    """A run's model: the session's, run in the run's worktree, and its window."""
    from substrate.topologies.session.transcript import resolve_driver_context

    def driver_for(worktree: Path) -> Any:
        return _daemon_driver_resolver(
            app, manifest.driver, manifest.driver_params, workspace=str(worktree)
        )

    tokens, _ = resolve_driver_context(manifest.driver, driver_for(Path(manifest.workspace)))
    return driver_for, tokens


def _start_build(app: App, manifest: Any, card: Any) -> tuple[str, str]:
    """Start a build of `card` on the session's repository, on the session's model, guidance
    bundle and model class. Records go under `<sessions>/runs/`, worktrees under `<sessions>/wt/`."""
    driver_for, tokens = _run_driver(app, manifest)
    base = _sessions_base()
    return build.start_build(
        run_hold.TABLE,
        owner=manifest.session_id,
        run_id=f"r_{uuid.uuid4().hex[:12]}",
        repo=Path(manifest.workspace),
        card=card,
        driver_for=driver_for,
        driver_name=manifest.driver,
        driver_context_tokens=tokens,
        model_class=_model_class(manifest.driver),
        bundle=manifest.bundle,
        worktrees=base / "wt",
        records=base / "runs",
    )


def _start_review(app: App, manifest: Any, target: str, styles: list[str], focus: str) -> list[str]:
    """Start the session's reviewers on its workspace's repository, each on the session's model
    run in its own worktree. Records go under `<sessions>/runs/`, worktrees under `<sessions>/wt/`."""
    driver_for, tokens = _run_driver(app, manifest)
    base = _sessions_base()
    return review.start_review(
        run_hold.TABLE,
        owner=manifest.session_id,
        run_id=f"r_{uuid.uuid4().hex[:12]}",
        repo=Path(manifest.workspace),
        target=target,
        styles=styles,
        focus=focus,
        driver_for=driver_for,
        driver_name=manifest.driver,
        driver_context_tokens=tokens,
        worktrees=base / "wt",
        records=base / "runs",
    )


# A finished topology run's handle stays this long, so a status poll after it ends still reads
# its outcome; then it is dropped (lens audit F295: the table only grew).
_TOPOLOGY_RUN_LINGER_S = 3600.0


def _forget_finished_topology_runs(app: App) -> None:
    now = time.time()
    for run_id, handle in list(app.topology_runs.items()):
        if not handle["thread"].is_alive() and now - handle["started_at"] > _TOPOLOGY_RUN_LINGER_S:
            app.topology_runs.pop(run_id, None)


def _is_live(app: App, name: str) -> bool:
    """A topology run this server started is still writing its record (`<run_id>.record`). The
    server spawned the run, so its thread is the authority on liveness: incomplete with a live
    thread is still being written; incomplete with a dead one is torn (review #36)."""
    handle = app.topology_runs.get(name)
    return handle is not None and handle["thread"].is_alive()


# Sprint 084 — the CLI-adapter catalog. Every entry names a CLI Substrate
# knows how to speak with (argv shape that reads a prompt as the final
# positional arg and prints the reply on stdout). Detection at roster time
# is `shutil.which(command[0])`; only present binaries surface. Adding a
# new CLI adapter is one entry here plus (if the argv shape needs a
# different flag) the same entry consulted by `_daemon_driver_resolver`.
# The catalog IS the source of truth — no other file names CLI presets.
KNOWN_CLI_ADAPTERS: dict[str, Any] = {
    # Sprint 085 — catalog widened from [cmd, flag] to a dict with the
    # full auth lifecycle. Every value verified live on peterlaffey@
    # 2026-09-25 (see process/planning/RESEARCH-2026-09-25-cli-adapter-
    # login-flow-in-substrate-v2.md). `command` is what CliResponder
    # runs for a turn (prompt appended as final positional arg).
    # `login_command` spawns the CLI's own interactive login flow —
    # Substrate hosts it inside a pty and streams the stdout into a
    # transcript card. Only URL-based OAuth flows fit the current card;
    # login_command:None means the CLI is selectable as a driver but
    # no auth card fires. `logout_command` clears
    # stored creds. `status_command` reports authed state.
    #
    # Sprint 087 (2026-09-27) — `versions` names the curated model
    # picks the dropdown exposes per CLI. Each entry:
    #   id     — stable identifier the client sends back as
    #            driver_version; also feeds cache keys.
    #   label  — short display string for the dropdown row.
    #   flag   — argv fragment appended after `command`. Verified via
    #            each CLI's `--help` on 2026-09-27.
    # `default_version`: the id picked when the client sends no
    # driver_version. Passing None as the version sends no flag —
    # the CLI picks its own default. Adding a version to the picker
    # is one row in this list; no other file names CLI versions.
    # Sprint 087c (2026-09-27) — versions are LIVE-PROBED per CLI when
    # the CLI exposes a listing command (see `list_command` below).
    # Anthropic's `claude` and OpenAI's `codex` publish no such
    # command today, so those two carry a curated fallback here and
    # the `/api/models` payload marks them `"source": "curated"`.
    # Cursor's `cursor-agent --list-models` is a real listing command;
    # its result marks `"source": "live"` when the probe succeeds.
    # `versions` is the FALLBACK for the two curated CLIs. The
    # runtime pipeline is: `_probe_cli_versions(name)` → live command
    # (if any) → parsed tree → else this fallback. Editing the
    # curated fallback stays a hand-maintained step; live-listed
    # CLIs never touch this block.
    "claude": {
        "command": ["claude", "-p"],
        # The driver profile (UI sprint 120; RESEARCH-2026-10-10-substrate-default-guidance-r7).
        # `isolation_flags` switch off what Claude Code would load from this machine: its MCP
        # servers and every settings source (CLAUDE.md, hooks, output style, memory). Its own
        # tools stay on, and `--dangerously-skip-permissions` lets them write and run without a
        # prompt; headless `-p` otherwise starts read-only. `system_flag` carries Substrate's
        # system text (session vocabulary § P.3).
        # `env` removes Claude Code's git and commit instructions, where its attribution
        # trailer lives. `slash_commands`: `claude -p "/<command>"` runs the command locally
        # (UI sprint 123).
        "isolation_flags": [
            "--strict-mcp-config",
            "--setting-sources",
            "",
            "--dangerously-skip-permissions",
        ],
        "system_flag": ["--system-prompt"],
        "env": {"CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS": "1"},
        # UI sprint 129 (kernel K283, K284): its event stream carries every tool call it makes,
        # and it takes Substrate's tools as an MCP server named in `--mcp-config`.
        "stream_format": "claude-stream-json",
        "stream_flags": ["--output-format", "stream-json", "--verbose"],
        "mcp_style": "claude-mcp-config",
        "slash_commands": True,
        "login_command": ["claude", "auth", "login"],
        "logout_command": ["claude", "auth", "logout"],
        "status_command": ["claude", "auth", "status"],
        # No `list_command`: `claude --help` shows no models subcommand
        # (2026-09-27) and a bogus `--model` returns
        # `[claude-code:unrecognized_model]` without listing valid
        # choices. Fallback is curated by hand.
        "versions": [
            {
                "id": "opus",
                "label": "Opus",
                "default_pin": "opus-5-5",
                "pins": [
                    {"id": "opus-5-5", "label": "5.5", "flag": ["--model", "claude-opus-5-5"]},
                    {"id": "opus-4-8", "label": "4.8", "flag": ["--model", "claude-opus-4-8"]},
                    {"id": "opus-4-7", "label": "4.7", "flag": ["--model", "claude-opus-4-7"]},
                    {"id": "opus-4-6", "label": "4.6", "flag": ["--model", "claude-opus-4-6"]},
                    {"id": "opus-4-5", "label": "4.5", "flag": ["--model", "claude-opus-4-5"]},
                    {"id": "opus-4-1", "label": "4.1", "flag": ["--model", "claude-opus-4-1"]},
                    {"id": "opus-4", "label": "4", "flag": ["--model", "claude-opus-4"]},
                    {"id": "opus-3", "label": "3", "flag": ["--model", "claude-3-opus"]},
                ],
            },
            {
                "id": "sonnet",
                "label": "Sonnet",
                "default_pin": "sonnet-5-5",
                "pins": [
                    {"id": "sonnet-5-5", "label": "5.5", "flag": ["--model", "claude-sonnet-5-5"]},
                    {"id": "sonnet-4-6", "label": "4.6", "flag": ["--model", "claude-sonnet-4-6"]},
                    {"id": "sonnet-4-5", "label": "4.5", "flag": ["--model", "claude-sonnet-4-5"]},
                    {"id": "sonnet-4", "label": "4", "flag": ["--model", "claude-sonnet-4"]},
                    {"id": "sonnet-3-7", "label": "3.7", "flag": ["--model", "claude-3-7-sonnet"]},
                    {"id": "sonnet-3-5", "label": "3.5", "flag": ["--model", "claude-3-5-sonnet"]},
                    {"id": "sonnet-3", "label": "3", "flag": ["--model", "claude-3-sonnet"]},
                ],
            },
            {
                "id": "haiku",
                "label": "Haiku",
                "default_pin": "haiku-4-5",
                "pins": [
                    {"id": "haiku-4-5", "label": "4.5", "flag": ["--model", "claude-haiku-4-5"]},
                    {"id": "haiku-3-5", "label": "3.5", "flag": ["--model", "claude-3-5-haiku"]},
                    {"id": "haiku-3", "label": "3", "flag": ["--model", "claude-3-haiku"]},
                ],
            },
            {
                "id": "fable",
                "label": "Fable",
                "default_pin": "fable-5-1",
                "pins": [
                    {"id": "fable-5-1", "label": "5.1", "flag": ["--model", "claude-fable-5-1"]},
                    {"id": "fable-5", "label": "5", "flag": ["--model", "claude-fable-5"]},
                ],
            },
        ],
        "default_family": "opus",
    },
    "codex": {
        # `exec` refuses to run outside a git repo it trusts, and by default runs read-only. A
        # per-session sandbox is a plain directory, and a session driver has to write: no git
        # check, no sandbox, no approvals.
        "command": [
            "codex",
            "exec",
            "--skip-git-repo-check",
            "--dangerously-bypass-approvals-and-sandbox",
        ],
        # UI sprint 129: `exec --json` streams every item; an MCP server is a config override.
        "stream_format": "codex-json",
        "stream_flags": ["--json"],
        "mcp_style": "codex-config",
        # `--device-auth` prints URL + one-time code to stdout without
        # spawning a local callback server, so the pty renders cleanly
        # even when Substrate is sandboxed.
        "login_command": ["codex", "login", "--device-auth"],
        "logout_command": ["codex", "logout"],
        "status_command": ["codex", "login", "status"],
        # No `list_command`: codex.js has no `list-models` subcommand;
        # its embedded catalog is only reachable by binary inspection,
        # which we don't do. Fallback is curated by hand.
        "versions": [
            {
                "id": "gpt-6",
                "label": "GPT-6",
                "default_pin": "gpt-6-astra",
                "pins": [
                    {"id": "gpt-6-astra", "label": "Astra", "flag": ["-m", "gpt-6-astra"]},
                    {"id": "gpt-6-sol", "label": "Sol", "flag": ["-m", "gpt-6-sol"]},
                    {"id": "gpt-6-luna", "label": "Luna", "flag": ["-m", "gpt-6-luna"]},
                ],
            },
            {
                "id": "gpt-5-6",
                "label": "GPT-5.6",
                "default_pin": "gpt-5-6-sol",
                "pins": [
                    {"id": "gpt-5-6-sol", "label": "Sol", "flag": ["-m", "gpt-5.6-sol"]},
                    {"id": "gpt-5-6-terra", "label": "Terra", "flag": ["-m", "gpt-5.6-terra"]},
                    {"id": "gpt-5-6-luna", "label": "Luna", "flag": ["-m", "gpt-5.6-luna"]},
                ],
            },
            {
                "id": "gpt-5",
                "label": "GPT-5",
                "default_pin": "gpt-5-5",
                "pins": [
                    {"id": "gpt-5-5", "label": "5.5", "flag": ["-m", "gpt-5.5"]},
                    {"id": "gpt-5-4", "label": "5.4", "flag": ["-m", "gpt-5.4"]},
                ],
            },
        ],
        "default_family": "gpt-6",
    },
    "cursor-agent": {
        # Headless, cursor-agent stops at "Workspace Trust Required" without `--trust`, and only
        # proposes file changes without `--force`. A session driver has to work and write.
        "command": ["cursor-agent", "-p", "--trust", "--force", "--sandbox", "disabled"],
        # UI sprint 129: its stream carries every tool call.
        "stream_format": "cursor-stream-json",
        "stream_flags": ["--output-format", "stream-json"],
        # Its MCP servers come from `.cursor/mcp.json` in the workspace (see `_mcp_flags`).
        "mcp_style": "cursor-workspace-file",
        # NO_OPEN_BROWSER=1 keeps the auth URL in stdout instead of also
        # spawning an OS browser open — the pty renders the URL as a
        # click for the user.
        "login_command": ["cursor-agent", "login"],
        "logout_command": ["cursor-agent", "logout"],
        # `cursor-agent status` (alias `whoami`) exists as of 2026.09.23 (`cursor-agent --help`:
        # "status|whoami — View authentication status"); prints "Not logged in" when unauthed.
        # The old "no status subcommand" left authed=None, so an unauthed cursor-agent was
        # offered and every turn came back empty (UI sprint 097).
        "status_command": ["cursor-agent", "status"],
        # LIVE listing available: `cursor-agent --list-models` prints
        # the account's supported models when authed. The probe
        # invokes it with a short timeout; on any failure (unauthed,
        # network) the fallback below applies with source="curated".
        "list_command": ["cursor-agent", "--list-models"],
        "versions": [
            {
                "id": "sonnet",
                "label": "Sonnet",
                "default_pin": "sonnet-4-thinking",
                "pins": [
                    {
                        "id": "sonnet-4-thinking",
                        "label": "4 thinking",
                        "flag": ["--model", "sonnet-4-thinking"],
                    },
                    {"id": "sonnet-4", "label": "4", "flag": ["--model", "sonnet-4"]},
                ],
            },
            {
                "id": "opus",
                "label": "Opus",
                "default_pin": "opus-4",
                "pins": [
                    {"id": "opus-4", "label": "4", "flag": ["--model", "opus-4"]},
                ],
            },
            {
                "id": "gpt",
                "label": "GPT",
                "default_pin": "gpt-5-5",
                "pins": [
                    {"id": "gpt-5-5", "label": "5.5", "flag": ["--model", "gpt-5.5"]},
                    {"id": "gpt-5", "label": "5", "flag": ["--model", "gpt-5"]},
                ],
            },
        ],
        "default_family": "sonnet",
    },
    # opencode removed 2026-09-25 — Peter's ruling: not our business.
    # aider removed 2026-09-25 — no login command exists (aider takes
    # OPENAI_API_KEY / ANTHROPIC_API_KEY / --api-key PROVIDER=KEY per
    # invocation). Peter's ruling: not supported until the API-key
    # dropdown section lands.
    # gemini removed 2026-09-25 — the Gemini CLI is deprecated upstream.
}


# UI sprint 122: a skill name is one path component the kernel resolves under a skills directory.
_SKILL_NAME = re.compile(r"[A-Za-z0-9][A-Za-z0-9_-]{0,63}")

_MODEL_CLASS_CACHE: dict[str, str] = {}


def _model_class(name: str) -> str:
    """Kernels K278, K288: harness_agent for a CLI adapter; for an Ollama model, small below 14B
    parameters, medium below 70B (from /api/show `details.parameter_size`), else large. Cached per model; an
    unreachable Ollama answers large for this call only."""
    if name in KNOWN_CLI_ADAPTERS:
        return classify(is_cli=True)
    if name == "deterministic":
        return ""
    if name in _MODEL_CLASS_CACHE:
        return _MODEL_CLASS_CACHE[name]
    import urllib.request as _u

    try:
        req = _u.Request(  # noqa: S310 - localhost
            f"{ollama_base_url()}/api/show",
            data=msgspec.json.encode({"name": name}),
            headers={"Content-Type": "application/json"},
        )
        with _u.urlopen(req, timeout=3) as r:  # noqa: S310
            info = msgspec.json.decode(r.read())
        size = (info.get("details") or {}).get("parameter_size")
    except Exception:  # noqa: BLE001 — Ollama unreachable: large, uncached
        return classify(is_cli=False)
    result = classify(is_cli=False, parameter_size=size)
    _MODEL_CLASS_CACHE[name] = result
    return result


def _model_supports_thinking(app: App, name: str) -> bool:
    """Probe Ollama's /api/show for the model's capabilities; returns True iff
    "thinking" is in the capabilities list. Cached per-model for the process
    lifetime — capabilities don't change without a re-pull. A failed probe
    answers True (the Sprint 045 default for the cloud reasoning models) for
    this call only and is not cached: while Ollama is unreachable the turn's
    chat call fails anyway, and the next turn probes again (lens audit F305)."""
    if name in app.model_thinking_cache:
        return app.model_thinking_cache[name]
    import urllib.request as _u

    try:
        req = _u.Request(  # noqa: S310 - localhost
            f"{ollama_base_url()}/api/show",
            data=msgspec.json.encode({"name": name}),
            headers={"Content-Type": "application/json"},
        )
        with _u.urlopen(req, timeout=3) as r:  # noqa: S310
            info = msgspec.json.decode(r.read())
        caps = info.get("capabilities") or []
        result = "thinking" in caps
    except Exception:  # noqa: BLE001 — Ollama unreachable: answer the default, cache nothing
        return True
    app.model_thinking_cache[name] = result
    return result


def _resolve_pin(entry: dict[str, Any], version: str | None) -> dict[str, Any] | None:
    """Walk the CLI catalog's family tree to find the pin whose flag we
    append. `version` may be:
      - None                → default_family → its default_pin.
      - a family id         → that family's default_pin.
      - a pin id            → that pin (searched across every family).
    Returns the pin dict (with `flag`), or None when nothing matches.
    """
    families = entry.get("versions") or []

    def _pin_by_id(family: dict[str, Any], pin_id: str) -> dict[str, Any] | None:
        return next((p for p in (family.get("pins") or []) if p.get("id") == pin_id), None)

    def _family_default(family: dict[str, Any]) -> dict[str, Any] | None:
        return _pin_by_id(family, family.get("default_pin", ""))

    if version is None:
        default_family_id = entry.get("default_family")
        family = next((f for f in families if f.get("id") == default_family_id), None)
        return _family_default(family) if family else None
    for family in families:
        if family.get("id") == version:
            return _family_default(family)
        pin = _pin_by_id(family, version)
        if pin is not None:
            return pin
    return None


# Sprint 087c — live-probe cache for per-CLI version lists. The
# `/api/models` handler asks _probe_cli_versions(name) for each
# installed CLI; the result is cached per-process for VERSION_CACHE_TTL_S
# seconds. Users who log a CLI in/out and want the picker to refresh
# right away can restart the daemon; a longer-lived cache-bust hook
# (e.g. clear on POST /api/cli/<name>/logout) is a follow-up.
_VERSION_CACHE_TTL_S = 300.0


def _parse_cursor_agent_list_models(text: str) -> dict[str, Any] | None:
    """Best-effort parser for `cursor-agent --list-models`. Cursor's own
    docs describe the output as a plain list of ids, one per line, in
    the shape `<id>[ (default)]`. We collect ids, drop anything that
    doesn't look like a slug, and group by family prefix (segment
    before the first dash-number). Returns None on empty or
    unparseable output — the caller falls back to curated.
    """
    if not text:
        return None
    ids: list[str] = []
    default: str | None = None
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        # A model line is `<id>`, `<id> (default)` or, since 2026.09, `<id> - <Label>`. Any other
        # line is a heading: "Available models:" once, "Available models" with no colon now, which
        # was taken as a model id and sent as `--model Available`.
        parts = line.split()
        head = parts[0]
        if not head[0].isalpha() or head.endswith(":"):
            continue
        if len(parts) > 1 and parts[1] not in ("-", "(default)"):
            continue
        ids.append(head)
        if "(default)" in line and default is None:
            default = head
    if not ids:
        return None
    # Group by family: the prefix up to and including the first digit.
    families: dict[str, list[str]] = {}

    def _family_key(mid: str) -> str:
        parts = mid.split("-")
        if not parts:
            return mid
        return parts[0]

    for mid in ids:
        families.setdefault(_family_key(mid), []).append(mid)
    fam_list = []
    for key, pins in families.items():
        fam_list.append(
            {
                "id": key,
                "label": key.capitalize(),
                "default_pin": pins[0],
                "pins": [{"id": p, "label": p, "flag": ["--model", p]} for p in pins],
            }
        )
    return {
        "families": fam_list,
        "default_family": fam_list[0]["id"] if fam_list else None,
        "source": "live",
        "default_pin_id": default,
    }


def _probe_cli_versions(app: App, name: str) -> dict[str, Any]:
    """Return the version tree for one CLI. Live-probes when the
    catalog entry names a `list_command` and the CLI accepts it;
    otherwise returns the curated fallback with source="curated".
    Cached per-process for _VERSION_CACHE_TTL_S seconds."""
    now = time.monotonic()
    cached_at = app.version_cache_at.get(name, 0.0)
    if now - cached_at < _VERSION_CACHE_TTL_S and name in app.version_cache:
        return app.version_cache[name]
    entry = KNOWN_CLI_ADAPTERS.get(name) or {}
    curated_families = entry.get("versions") or []
    curated_default_family = entry.get("default_family")
    curated = {
        "families": [
            {
                "id": f["id"],
                "label": f["label"],
                "default_pin": f.get("default_pin"),
                "pins": [
                    # Preserve `flag` so _resolve_pin below can build
                    # the argv from this tree without going back to
                    # KNOWN_CLI_ADAPTERS.
                    {"id": p["id"], "label": p["label"], "flag": p.get("flag") or []}
                    for p in (f.get("pins") or [])
                ],
            }
            for f in curated_families
        ],
        "default_family": curated_default_family,
        "source": "curated",
    }
    list_cmd = entry.get("list_command")
    if isinstance(list_cmd, list) and list_cmd:
        try:
            proc = subprocess.run(  # noqa: S603 — operator-configured CLI probe
                list_cmd, capture_output=True, text=True, timeout=6.0
            )
            if proc.returncode == 0 and proc.stdout.strip():
                parsed = None
                if name == "cursor-agent":
                    parsed = _parse_cursor_agent_list_models(proc.stdout)
                if parsed and parsed.get("families"):
                    app.version_cache[name] = parsed
                    app.version_cache_at[name] = now
                    return parsed
        except (OSError, subprocess.SubprocessError):
            pass  # fall through to curated
    app.version_cache[name] = curated
    app.version_cache_at[name] = now
    return curated


def _cache_layout_refusal(driver: str, params: dict[str, Any] | None) -> str | None:
    """UI sprint 121: `driver_params.cache_layout` puts every session-stable text on the system
    channel, so only a driver whose profile names a system flag can take it. The reason a
    request is refused, or None."""
    if not params or not params.get("cache_layout"):
        return None
    if (KNOWN_CLI_ADAPTERS.get(driver) or {}).get("system_flag"):
        return None
    return (
        f"driver_params.cache_layout needs a driver with a system channel flag; {driver!r} has none"
    )


def _cli_command(app: App, name: str, version: str | None = None) -> list[str] | None:
    """Argv for a CLI adapter. Reads the LIVE version tree from
    _probe_cli_versions so a client that picks a live-listed pin id
    resolves against the same tree the picker rendered — not a stale
    curated snapshot. `version` selects a family or a pin from that
    tree; the resolved pin's flag is appended after the base command and
    the profile's `isolation_flags` (UI sprint 120).
    Missing entry / no pin resolved → base command and isolation flags only.
    """
    entry = KNOWN_CLI_ADAPTERS.get(name)
    if entry is None:
        return None
    cmd = list(entry["command"]) + list(entry.get("isolation_flags") or [])
    tree = _probe_cli_versions(app, name)
    # `_resolve_pin` works on any shape whose families carry pins with
    # `id` and `flag`; both the curated and the live tree do.
    pin = _resolve_pin(
        {"versions": tree.get("families", []), "default_family": tree.get("default_family")},
        version,
    )
    if pin is None:
        return cmd
    flag = pin.get("flag") or []
    return cmd + list(flag)


# ── Sprint 085a — CLI adapter auth-in-transcript (pty side) ─────────────────
# Substrate spawns the CLI's own login command inside a pseudo-terminal and
# streams its stdout into a transcript card. The card's stdin routes back to
# the pty. Everything below runs inside the substrate-ui HTTP server; the
# renderer talks to it via /api/cli/<name>/pty/{start,stream,stdin,close}
# and /api/cli/<name>/{status,logout}. See
# process/planning/RESEARCH-2026-09-25-cli-adapter-login-flow-in-substrate-v2.md
# for the per-CLI verified behavior.

# Request bodies are JSON control messages; the largest legitimate one is a pasted turn. 4 MiB is
# above any of those and far below what would exhaust memory.
_MAX_BODY_BYTES = 4 * 1024 * 1024


class BodyTooLarge(ValueError):
    """A request body over _MAX_BODY_BYTES; answered 413."""


_CLI_PTY_MAX_BUFFER = 512 * 1024  # 512KB per session — plenty for a login walk


def _cli_status(cli_name: str, timeout: float = 5.0) -> dict[str, Any]:
    """Probe a CLI's authed state. Returns {authed: bool, raw: str, detail?: str}.
    A CLI with no status_command returns {authed: None} — caller decides."""
    entry = KNOWN_CLI_ADAPTERS.get(cli_name)
    if entry is None:
        return {"authed": None, "raw": "", "detail": "unknown cli"}
    status_cmd = entry.get("status_command")
    if not status_cmd:
        return {"authed": None, "raw": "", "detail": "no status_command"}
    if not isinstance(status_cmd, list):
        raise TypeError(f"cli {cli_name!r}: status_command must be an argv list")
    try:
        proc = subprocess.run(  # noqa: S603 — operator-chosen CLI in the catalog
            status_cmd, capture_output=True, text=True, timeout=timeout
        )
    except subprocess.TimeoutExpired:
        return {"authed": False, "raw": "", "detail": "status probe timed out"}
    except FileNotFoundError:
        return {"authed": False, "raw": "", "detail": "cli binary not found"}
    combined = (proc.stdout + proc.stderr).strip()
    # Per-CLI parse. Small, explicit — the research doc §2 verified each shape.
    if cli_name == "claude":
        # Emits JSON; loggedIn:true means authed.
        try:
            j = msgspec.json.decode(proc.stdout.encode())
            return {"authed": bool(j.get("loggedIn")), "raw": combined}
        except (msgspec.DecodeError, ValueError):
            return {"authed": False, "raw": combined}
    if cli_name == "codex":
        # `codex login status` prints "Not logged in" when unauthed.
        return {"authed": "Not logged in" not in combined, "raw": combined}
    if cli_name == "cursor-agent":
        return {"authed": "Not logged in" not in combined, "raw": combined}
    return {"authed": None, "raw": combined, "detail": "no parser"}


def _cli_pty_start(app: App, cli_name: str) -> str:
    """Fork a pty, spawn the CLI's login_command, return the session id.
    Bytes accumulate in a rolling buffer; the SSE stream reads from index 0
    on connect (so late subscribers see backlog + growth) and truncates at
    _CLI_PTY_MAX_BUFFER. Non-blocking master fd; a background thread drains."""
    import fcntl
    import pty
    import select as _select

    entry = KNOWN_CLI_ADAPTERS.get(cli_name)
    if entry is None:
        raise ValueError(f"unknown cli {cli_name!r}")
    login_cmd = entry.get("login_command")
    if not login_cmd:
        raise ValueError(f"cli {cli_name!r} has no login_command")
    if not isinstance(login_cmd, list):
        raise TypeError(f"cli {cli_name!r}: login_command must be an argv list")

    master_fd, slave_fd = pty.openpty()
    flag = fcntl.fcntl(master_fd, fcntl.F_GETFL)
    fcntl.fcntl(master_fd, fcntl.F_SETFL, flag | os.O_NONBLOCK)

    env = dict(os.environ)
    # cursor-agent: keep the URL in stdout instead of also auto-opening the browser.
    if cli_name == "cursor-agent":
        env["NO_OPEN_BROWSER"] = "1"

    proc = subprocess.Popen(  # noqa: S603 — operator-chosen CLI in the catalog
        login_cmd,
        stdin=slave_fd,
        stdout=slave_fd,
        stderr=slave_fd,
        close_fds=True,
        env=env,
        start_new_session=True,
    )
    os.close(slave_fd)

    sid = uuid.uuid4().hex
    session: dict[str, Any] = {
        "proc": proc,
        "master_fd": master_fd,
        "output_bytes": bytearray(),
        "closed": False,
        "exit_code": None,
        "cli": cli_name,
        "lock": threading.Lock(),
    }
    with app.cli_pty_lock:
        app.cli_pty_sessions[sid] = session

    def _drain() -> None:
        while True:
            try:
                r, _, _ = _select.select([master_fd], [], [], 0.2)
                if master_fd in r:
                    try:
                        chunk = os.read(master_fd, 4096)
                    except OSError:
                        chunk = b""
                    if chunk:
                        with session["lock"]:
                            session["output_bytes"].extend(chunk)
                            # Cap the buffer — drop from the front on overflow.
                            over = len(session["output_bytes"]) - _CLI_PTY_MAX_BUFFER
                            if over > 0:
                                del session["output_bytes"][:over]
                    else:
                        break
                if proc.poll() is not None:
                    # Final drain before exit.
                    try:
                        rest = os.read(master_fd, 65536)
                    except OSError:
                        rest = b""
                    if rest:
                        with session["lock"]:
                            session["output_bytes"].extend(rest)
                    break
            except Exception:  # noqa: BLE001 — pty reads can fail in odd ways; end the drain
                break
        with session["lock"]:
            session["closed"] = True
            session["exit_code"] = proc.returncode
        try:
            os.close(master_fd)
        except OSError:
            pass
        _cli_pty_forget_later(app, sid)

    threading.Thread(target=_drain, daemon=True, name=f"cli-pty-{sid}").start()
    return sid


def _cli_pty_write(app: App, sid: str, data: bytes) -> bool:
    """Forward user keystrokes to the pty's master fd. Returns False if the
    session is gone or closed."""
    with app.cli_pty_lock:
        session = app.cli_pty_sessions.get(sid)
    if session is None:
        return False
    with session["lock"]:
        if session["closed"]:
            return False
        master_fd = session["master_fd"]
    try:
        os.write(master_fd, data)
        return True
    except OSError:
        return False


# A finished login pty stays readable this long, so a stream that connects late still gets the
# backlog and the exit code; then it leaves the table (lens audit F317: entries were never removed).
_CLI_PTY_LINGER_S = 60.0


def _cli_pty_forget_later(app: App, sid: str) -> None:
    def _forget() -> None:
        with app.cli_pty_lock:
            app.cli_pty_sessions.pop(sid, None)

    t = threading.Timer(_CLI_PTY_LINGER_S, _forget)
    t.daemon = True
    t.start()


def _cli_pty_close(app: App, sid: str) -> bool:
    """Kill the pty session and remove it from the table. Idempotent. A stream already reading
    holds its own reference and still sees the exit."""
    with app.cli_pty_lock:
        session = app.cli_pty_sessions.pop(sid, None)
    if session is None:
        return False
    proc = session["proc"]
    if proc.poll() is None:
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        except OSError:
            try:
                proc.terminate()
            except OSError:
                pass
    return True


def _agent_models(app: App) -> dict[str, object]:
    """The drivers the terminal can pick — live-probed on both sides.
    Ollama tags come from `<ollama_base_url()>/api/tags`. CLI adapters
    come from `shutil.which(cmd[0])` against every entry in
    KNOWN_CLI_ADAPTERS. The dropdown reflects what is actually on the box:
    nothing installed → empty CLI section + empty Ollama section (with
    deterministic still in Testing for harness pins). The default is a
    verified-agentic Ollama cloud tag if one is present, else the first
    installed CLI, else the first Ollama tag, else deterministic."""
    import shutil
    import urllib.request as _u

    ollama: list[str] = []
    try:
        with _u.urlopen(f"{ollama_base_url()}/api/tags", timeout=2) as r:  # noqa: S310 - Ollama
            tags = msgspec.json.decode(r.read())
        ollama = sorted(str(m.get("name", "")) for m in tags.get("models", []) if m.get("name"))
    except Exception:  # noqa: BLE001 — no ollama / daemon down: CLI + deterministic still surface
        ollama = []

    # Ollama's cloud tags use two conventions: `:cloud` (simple) and
    # `:<size>-cloud` (the newer variant tag, e.g. `qwen3-coder:480b-cloud`).
    # Both are Ollama-hosted models; the tag string is what tells us so.
    def _is_cloud(tag: str) -> bool:
        suffix = tag.rsplit(":", 1)[-1] if ":" in tag else ""
        return suffix == "cloud" or suffix.endswith("-cloud")

    ollama_cloud = [t for t in ollama if _is_cloud(t)]
    ollama_local = [t for t in ollama if not _is_cloud(t)]
    # SUBSTRATE_CLI_ADAPTERS, when set, limits discovery to the comma-separated names it lists
    # (empty: none), as OLLAMA_BASE_URL moves the Ollama side. The offline gates set both, so the
    # roster they bind from does not depend on what this machine has installed.
    allowed_env = os.environ.get("SUBSTRATE_CLI_ADAPTERS")
    allowed = (
        None if allowed_env is None else {n.strip() for n in allowed_env.split(",") if n.strip()}
    )
    cli = sorted(
        name
        for name, entry in KNOWN_CLI_ADAPTERS.items()
        if (allowed is None or name in allowed)
        and (cmd := entry.get("command"))
        and isinstance(cmd, list)
        and shutil.which(cmd[0])
    )
    # Sprint 085 followup — subset of cli entries with a login_command
    # the AuthPromptCard can host. Opencode is present as a driver but
    # its TUI login does not fit the text-stream card; excluded here.
    cli_login_supported = sorted(
        name for name in cli if KNOWN_CLI_ADAPTERS[name].get("login_command")
    )
    # Preference order for the default — see agency assay R-16/R-17. Fall
    # through: verified-agentic cloud → first installed CLI → first Ollama
    # tag → deterministic. Harnesses that must not pay cloud tokens open
    # the terminal with ?driver=deterministic (reveal.ts reads
    # window.location.search) — that wins over this server-side default.
    prefer = [
        "kimi-k2.7-code:cloud",
        "glm-5.2:cloud",
        "nemotron-3-super:cloud",
        "deepseek-v4-pro:cloud",
    ]
    default = next(
        (m for m in prefer if m in ollama),
        cli[0] if cli else (ollama[0] if ollama else "deterministic"),
    )
    # Sprint 087c — LIVE per-CLI version probe. Each entry carries
    # source="live" when the CLI's own list command answered, or
    # source="curated" when we fell back. The dropdown reads both
    # branches identically; the source flag is data the daemon summary
    # and future UI banners can surface ("Cursor list from account",
    # "Claude list curated 2026-09-27").
    cli_versions: dict[str, dict[str, Any]] = {}
    for name in cli:
        tree = _probe_cli_versions(app, name)
        if tree.get("families"):
            cli_versions[name] = tree
    return {
        "models": [*ollama, *cli, "deterministic"],  # flat list — legacy consumers
        "cli": cli,
        "cli_login_supported": cli_login_supported,
        "cli_versions": cli_versions,
        "ollama_cloud": ollama_cloud,
        "ollama_local": ollama_local,
        "testing": ["deterministic"],
        "default": default,
    }


def _list_sessions_snapshot(app: App) -> dict[str, list[dict[str, Any]]]:
    """Every session manifest bucketed by status. Shared by GET
    /api/session (rendered as-is) and by `_recent_workspaces` (used to
    derive distinct workspace paths when there is no
    ~/.substrate/recent-workspaces.json file). Returns empty buckets
    when the registry has not booted yet."""
    buckets: dict[str, list[dict[str, Any]]] = {
        "live": [],
        "parked": [],
        "ended": [],
        "interrupted": [],
    }
    if app.registry is None:
        return buckets
    for manifest in app.registry.list_all():
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
        key = "live" if manifest.status == SessionStatus.RUNNING else manifest.status
        if key in buckets:
            buckets[key].append(payload)
    return buckets


_RECENT_WORKSPACES_MAX = 64


def _resolve_workspace_arg(raw: str) -> str:
    """A client's workspace string as the absolute directory it names. `~/.substrate/sandbox` is
    the sandbox under this daemon's state root (`substrate_home()/sandbox`, so a test or gate home
    keeps its own); any other `~` expands to the user's home. A relative path is refused: it
    would resolve against the server's working directory, which is how literal `~` folders
    appeared inside the kernel and UI repos (lens audit F002, F375)."""
    if raw == "~/.substrate/sandbox" or raw.startswith("~/.substrate/sandbox/"):
        tail = raw[len("~/.substrate/sandbox") :].lstrip("/")
        return (
            str(api.substrate_home() / "sandbox" / tail)
            if tail
            else str(api.substrate_home() / "sandbox")
        )
    path = Path(raw).expanduser()
    if not path.is_absolute():
        raise ValueError(f"workspace must be an absolute path (or start with ~), got {raw!r}")
    return str(path)


# Editor shared work 0(c) (UI sprints 348, 387): the workspace file API. Each path is held to the
# session's workspace: an absolute path is refused, and so is any path that resolves, symlinks
# followed, outside it. A write goes on the session's record as the kernel's FileWritten (item 0(d),
# K340) before the file changes.
WORKSPACE_READ_MAX = 2 * 1024 * 1024


class WorkspaceEscapeError(ValueError):
    """A path names something outside the session's workspace."""


def _workspace_target(root: Path, rel: str) -> Path:
    """`rel` inside `root`, resolved. Raises WorkspaceEscapeError for an absolute path, a NUL, or a
    path that resolves (symlinks followed) outside `root`."""
    if rel.startswith("/") or "\x00" in rel:
        raise WorkspaceEscapeError(f"not a path inside the workspace: {rel!r}")
    base = root.resolve(strict=True)
    target = (base / rel).resolve(strict=False)
    if target != base and base not in target.parents:
        raise WorkspaceEscapeError(f"{rel!r} resolves outside the workspace")
    return target


def _workspace_list(root: Path, rel: str) -> dict[str, object]:
    """A directory's entries, directories first, each by name: kind (`dir`, `file`, `link`), size,
    modified time. A symlink is listed as `link` and not followed."""
    target = _workspace_target(root, rel or ".")
    if not target.is_dir():
        raise NotADirectoryError(f"{rel!r} is not a directory")
    entries: list[dict[str, object]] = []
    for child in target.iterdir():
        st = child.lstat()
        kind = "link" if child.is_symlink() else "dir" if child.is_dir() else "file"
        entries.append(
            {"name": child.name, "kind": kind, "size": st.st_size, "modified": st.st_mtime}
        )
    entries.sort(key=lambda e: (e["kind"] != "dir", str(e["name"]).lower(), str(e["name"])))
    base = root.resolve(strict=True)
    return {"dir": str(target.relative_to(base)) if target != base else "", "entries": entries}


# The empty tree's object id (git hash-object -t tree /dev/null): the base of a repository with no commit.
_EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"


def _git_out(root: Path, *args: str, env: dict[str, str] | None = None) -> str | None:
    """`git -C root args…` stdout, or None when git fails or is missing."""
    try:
        proc = subprocess.run(  # noqa: S603 — git with fixed arguments, in the session's workspace
            ["git", "-C", str(root), *args],  # noqa: S607 — git from PATH, as the kernel's workspace.py runs it
            capture_output=True,
            text=True,
            timeout=30,
            env=env,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    return proc.stdout if proc.returncode == 0 else None


def _workspace_diff(root: Path) -> dict[str, object]:
    """What changed in a session's workspace against main (UI sprint 412; design spec r6 §5: "each hunk
    vs main"; D48: modified dots from the real diff). The base is main's merge-base with HEAD; with no
    `main`, the default branch (`origin/HEAD`); with neither, the repository's first commit (the empty
    tree when it has none); `none` when the workspace is not in a git repository. New files count:
    they are marked intent-to-add in a scratch copy of the index (`GIT_INDEX_FILE`), so the
    workspace's own index is never written, as the kernel's `worktree_diff` does. Paths are relative to
    the workspace; ignored files are left out. Each file is `{path, status}`, status `A`, `M` or `D`."""
    base_kind, base = _diff_base(root)
    if base is None:
        return {"base": base_kind, "files": []}
    with _scratch_index(root) as env:
        out = _git_out(root, "diff", "--name-status", "--no-renames", "--relative", base, env=env) or ""
    files = []
    for line in out.splitlines():
        status, _, path = line.partition("\t")
        if path:
            files.append({"path": path, "status": status[:1]})
    return {"base": base_kind, "files": files}


def _diff_base(root: Path) -> tuple[DiffReadBase, str | None]:
    """The base `_workspace_diff` and `_workspace_hunks` compare against, and its kind; (NONE, None)
    outside a git work tree."""
    if _git_out(root, "rev-parse", "--is-inside-work-tree") is None:
        return DiffReadBase.NONE, None
    base_kind = DiffReadBase.FIRST_COMMIT
    base: str | None = None
    if _git_out(root, "rev-parse", "--verify", "--quiet", "refs/heads/main") is not None:
        base_kind, base = DiffReadBase.MAIN, (_git_out(root, "merge-base", "main", "HEAD") or "").strip() or None
    else:
        default = (_git_out(root, "symbolic-ref", "--quiet", "refs/remotes/origin/HEAD") or "").strip()
        if default:
            base_kind, base = DiffReadBase.DEFAULT_BRANCH, (_git_out(root, "merge-base", default, "HEAD") or "").strip() or None
    if base is None:
        roots = (_git_out(root, "rev-list", "--max-parents=0", "HEAD") or "").split()
        base_kind, base = DiffReadBase.FIRST_COMMIT, (roots[-1] if roots else _EMPTY_TREE)
    return base_kind, base


@contextlib.contextmanager
def _scratch_index(root: Path) -> Iterator[dict[str, str]]:
    """An environment whose GIT_INDEX_FILE is a scratch copy of the workspace's index with every new
    file marked intent-to-add, so a diff counts new files and the workspace's own index is untouched."""
    index = (_git_out(root, "rev-parse", "--git-path", "index") or "").strip()
    index_path = Path(index) if Path(index).is_absolute() else root / index
    with tempfile.TemporaryDirectory(prefix="substrate-ui-diff-") as tmp:
        scratch = Path(tmp) / "index"
        if index_path.is_file():
            shutil.copyfile(index_path, scratch)
        env = {**os.environ, "GIT_INDEX_FILE": str(scratch)}
        _git_out(root, "add", "-A", "--intent-to-add", ".", env=env)
        yield env


_HUNK_HEADER = re.compile(r"^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@")


def _workspace_hunks(root: Path, rel: str) -> dict[str, object]:
    """One file's changes against the base `_workspace_diff` uses (UI sprint 418; roadmap
    2026-11-09-code-editor r8, E2): `git diff -U0` with the same scratch index, so a new file reads as
    all added. Each hunk: `old_start`, `old_count`, `new_start`, `new_count` (git's ranges, a count of 0
    for a pure insertion or removal) and `lines`, each `-text` or `+text`. Outside a git work tree the
    base is `none` and there are no hunks. The path is held to the workspace (`_workspace_target`)."""
    target = _workspace_target(root, rel)
    base_kind, base = _diff_base(root)
    if base is None:
        return {"base": base_kind, "path": rel, "hunks": []}
    with _scratch_index(root) as env:
        out = _git_out(root, "diff", "-U0", "--no-color", "--no-ext-diff", "--no-renames", "--relative", base, "--", str(target.relative_to(root.resolve())), env=env) or ""
    hunks: list[dict[str, object]] = []
    for line in out.splitlines():
        m = _HUNK_HEADER.match(line)
        if m:
            hunks.append({
                "old_start": int(m.group(1)), "old_count": int(m.group(2) if m.group(2) is not None else 1),
                "new_start": int(m.group(3)), "new_count": int(m.group(4) if m.group(4) is not None else 1),
                "lines": [],
            })
        elif hunks and line[:1] in ("-", "+") and not line.startswith(("--- ", "+++ ")):
            cast(list[str], hunks[-1]["lines"]).append(line)
    return {"base": base_kind, "path": rel, "hunks": hunks}


# UI sprints 434, 435 (roadmap 2026-11-09-code-editor r10, E8; research RESEARCH-2026-11-10-editor-search-r2): the
# workspace search, the server's own walk and match as VS Code's ripgrep does it, with no git. The walk skips
# VS Code's files.exclude names and its search.exclude folders, applies each folder's .gitignore and .ignore
# whether or not the workspace is a git repository (ripgrep --no-require-git), searches hidden files, follows
# no symlink, and skips a file over the file API's read cap, with a NUL byte (binary, as ripgrep decides) or
# not UTF-8. Lines split on \n, as the editor counts them; a match never spans lines.
WORKSPACE_SKIP_NAMES = frozenset({".git", ".svn", ".hg", ".jj", ".DS_Store", "Thumbs.db"})
WORKSPACE_SKIP_DIRS = frozenset({"node_modules", "bower_components"})
WORKSPACE_IGNORE_FILES = (".gitignore", ".ignore")
WORKSPACE_WALK_MAX_FILES = 50_000
WORKSPACE_SEARCH_MAX_LINES = 2000
WORKSPACE_SEARCH_MAX_TEXT = 1000


class SearchQueryError(ValueError):
    """The query does not compile, or a glob is malformed."""


def _glob_regex(pat: str) -> str:
    """A gitignore(5) glob as a regex over a /-separated path: `*` and `?` stop at `/`, `**/` is any run of
    folders, a trailing `**` everything below, `[...]` a class (`[!...]` negated), `\\x` the literal x."""
    out: list[str] = []
    i = 0
    while i < len(pat):
        c = pat[i]
        if c == "*" and pat[i : i + 2] == "**":
            if pat[i + 2 : i + 3] == "/":
                out.append("(?:.*/)?")
                i += 3
            else:
                out.append(".*")
                i += 2
            continue
        if c == "*":
            out.append("[^/]*")
        elif c == "?":
            out.append("[^/]")
        elif c == "[":
            end = pat.find("]", i + 2 if pat[i + 1 : i + 2] in ("!", "^") else i + 1)
            if end < 0:
                out.append(re.escape(c))
            else:
                body = pat[i + 1 : end]
                neg = body[:1] in ("!", "^")
                body = body[1:] if neg else body
                out.append("[" + ("^" if neg else "") + body.replace("\\", "\\\\") + "]")
                i = end + 1
                continue
        elif c == "\\" and i + 1 < len(pat):
            out.append(re.escape(pat[i + 1]))
            i += 2
            continue
        else:
            out.append(re.escape(c))
        i += 1
    return "".join(out)


class _Glob:
    """One gitignore-style pattern, read from a file in folder `base` (or given as a search glob, base "").
    A pattern with a `/` before its end is anchored to `base`; one without matches a name at any depth."""

    def __init__(self, line: str, base: str) -> None:
        self.negate = line.startswith("!")
        pat = line[1:] if self.negate else line
        if pat.startswith("\\!") or pat.startswith("\\#"):
            pat = pat[1:]
        self.dir_only = pat.endswith("/")
        pat = pat.rstrip("/")
        self.anchored = "/" in pat
        pat = pat.lstrip("/")
        self.base = base
        self.rx = re.compile(_glob_regex(pat), re.DOTALL)

    def matches(self, rel: str, is_dir: bool) -> bool:
        if self.dir_only and not is_dir:
            return False
        if self.base:
            if not rel.startswith(self.base + "/"):
                return False
            rel = rel[len(self.base) + 1 :]
        return bool(self.rx.fullmatch(rel if self.anchored else rel.rsplit("/", 1)[-1]))


def _ignore_rules(folder: Path, base: str) -> list[_Glob]:
    rules: list[_Glob] = []
    for name in WORKSPACE_IGNORE_FILES:
        try:
            text = (folder / name).read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        for raw in text.splitlines():
            line = raw.rstrip() if not raw.endswith("\\ ") else raw
            if not line or line.startswith("#"):
                continue
            try:
                rules.append(_Glob(line, base))
            except re.error:
                continue  # a line git would not read either
    return rules


def _ignored(rules: list[_Glob], rel: str, is_dir: bool) -> bool:
    """gitignore's rule: the last pattern that matches decides; `!` re-includes."""
    out = False
    for r in rules:
        if r.matches(rel, is_dir):
            out = not r.negate
    return out


def _globs(spec: str) -> list[_Glob]:
    """VS Code's "files to include / exclude": comma-separated globs, read as ripgrep's -g reads them, the
    way .gitignore patterns are read; a leading `./` anchors to the workspace."""
    out: list[_Glob] = []
    for part in spec.split(","):
        p = part.strip()
        if p.startswith("./"):
            p = "/" + p[2:]
        if p:
            try:
                out.append(_Glob(p, ""))
            except re.error as exc:
                raise SearchQueryError(f"glob {p!r}: {exc}") from None
    return out


def _workspace_files(root: Path, include: str = "", exclude: str = "", unreadable: list[str] | None = None) -> tuple[list[str], bool]:
    """The workspace's searchable files, relative and /-separated, in path order, and whether the walk
    stopped at WORKSPACE_WALK_MAX_FILES. An include glob keeps a file when it or one of its folders matches.
    A folder the walk cannot read is added to `unreadable` (its relative path) and skipped."""
    base = root.resolve(strict=True)
    inc, exc = _globs(include), _globs(exclude)
    found: list[str] = []
    cut = False

    def included(rel: str) -> bool:
        if not inc:
            return True
        parts = rel.split("/")
        return any(g.matches("/".join(parts[:n]), n < len(parts)) for g in inc for n in range(1, len(parts) + 1))

    def walk(folder: Path, rel_dir: str, rules: list[_Glob]) -> None:
        nonlocal cut
        rules = rules + _ignore_rules(folder, rel_dir)
        try:
            entries = sorted(os.scandir(folder), key=lambda e: e.name)
        except OSError:
            if unreadable is not None:
                unreadable.append(rel_dir)
            return
        for entry in entries:
            if cut:
                return
            if entry.name in WORKSPACE_SKIP_NAMES or entry.is_symlink():
                continue
            rel = f"{rel_dir}/{entry.name}" if rel_dir else entry.name
            is_dir = entry.is_dir(follow_symlinks=False)
            if is_dir and entry.name in WORKSPACE_SKIP_DIRS:
                continue
            if _ignored(rules, rel, is_dir) or any(g.matches(rel, is_dir) for g in exc):
                continue
            if is_dir:
                walk(Path(entry.path), rel, rules)
            elif entry.is_file(follow_symlinks=False) and included(rel):
                if len(found) == WORKSPACE_WALK_MAX_FILES:
                    cut = True
                    return
                found.append(rel)

    walk(base, "", [])
    found.sort()
    return found, cut


def _read_text(path: Path) -> tuple[str, str] | None:
    """A file's text and its SHA-256, or None when it is over the read cap, binary or not UTF-8."""
    try:
        if path.stat().st_size > WORKSPACE_READ_MAX:
            return None
        data = path.read_bytes()
    except OSError:
        return None
    if b"\x00" in data:
        return None
    try:
        return data.decode("utf-8"), hashlib.sha256(data).hexdigest()
    except UnicodeDecodeError:
        return None


def _search_regex(query: str, *, regex: bool, case: bool, word: bool) -> re.Pattern[str]:
    """The query as Python's `re` reads it: a pattern, or the text escaped. Whole word adds `\\b` at an end
    that is a word character, as VS Code's createRegExp does."""
    src = query if regex else re.escape(query)
    if word:
        src = ("\\b" if re.match(r"\w", query[:1]) else "") + f"(?:{src})" + ("\\b" if re.match(r"\w", query[-1:]) else "")
    try:
        return re.compile(src, 0 if case else re.IGNORECASE)
    except re.error as exc:
        raise SearchQueryError(str(exc)) from None


def _u16(s: str, i: int) -> int:
    """Index i of s counted in UTF-16 units, as the page's strings count."""
    return i if s.isascii() else len(s[:i].encode("utf-16-le")) // 2


def _lines(text: str) -> list[tuple[str, str]]:
    """Each line's text and its end (`\\r\\n`, `\\n`, or "" for the last)."""
    out: list[tuple[str, str]] = []
    for part in text.split("\n"):
        out.append((part[:-1], "\r\n") if part.endswith("\r") else (part, "\n"))
    out[-1] = (out[-1][0] + ("\r" if out[-1][1] == "\r\n" else ""), "")
    return out


def _workspace_search(
    root: Path, query: str, *, regex: bool, case: bool, word: bool = False, include: str = "", exclude: str = "",
    buffers: dict[str, str] | None = None,
) -> dict[str, object]:
    """The workspace's matches (UI sprint 435). Each file is `{path, lines: [{line, text, ranges}]}`, ranges
    the [start, end) of each match in UTF-16 units; `lines` and `matches` count them; `truncated` marks a
    result cut at WORKSPACE_SEARCH_MAX_LINES or a walk cut at WORKSPACE_WALK_MAX_FILES. UI sprint 436:
    `buffers`, the editor's unsaved text by path, is searched in place of the file on disk, as VS Code
    searches an open editor's text (searchService.ts `getOpenEditorResults`); `buffers` in the result counts
    the walked files read from them."""
    buffers = buffers or {}
    if not query:
        return {"names": [], "files": [], "lines": 0, "matches": 0, "truncated": False, "buffers": 0, "unreadable": 0}
    rx = _search_regex(query, regex=regex, case=case, word=word)
    unreadable: list[str] = []
    paths, truncated = _workspace_files(root, include, exclude, unreadable)
    names = _name_matches(paths, rx)
    base = root.resolve(strict=True)
    files: list[dict[str, object]] = []
    count = matches = from_buffers = 0
    for rel in paths:
        got = (buffers[rel], "") if rel in buffers else _read_text(base / rel)
        from_buffers += rel in buffers
        if got is None:
            continue
        hits: list[dict[str, object]] = []
        for n, (line, _end) in enumerate(_lines(got[0]), 1):
            ranges = [[_u16(line, m.start()), _u16(line, m.end())] for m in rx.finditer(line) if m.end() > m.start()]
            if not ranges:
                continue
            if count == WORKSPACE_SEARCH_MAX_LINES:
                truncated = True
                break
            text = line[:WORKSPACE_SEARCH_MAX_TEXT]
            cap = _u16(line, len(text))
            hits.append({"line": n, "text": text, "ranges": [r for r in ranges if r[0] < cap]})
            count += 1
            matches += len(ranges)
        if hits:
            files.append({"path": rel, "lines": hits})
        if count == WORKSPACE_SEARCH_MAX_LINES and truncated:
            break
    return {"names": names, "files": files, "lines": count, "matches": matches, "truncated": truncated, "buffers": from_buffers, "unreadable": len(unreadable)}


# UI sprint 442 (SEARCH-BAR-2026-11-10): the search bar finds names as well as text, by the bar's one rule.
WORKSPACE_SEARCH_MAX_NAMES = 500


def _name_matches(paths: list[str], rx: re.Pattern[str]) -> list[dict[str, object]]:
    """The walked files and their folders whose name or path the query matches: `{path, kind, ranges}`, kind
    `file` or `dir`, ranges the matches in the path in UTF-16 units. A match in the name ranks above one only
    in the folders, a shorter path above a longer one, then the path's order; at most
    WORKSPACE_SEARCH_MAX_NAMES. A binary file's name is matched like any other."""
    dirs = sorted({"/".join(p.split("/")[:n]) for p in paths for n in range(1, p.count("/") + 1)})
    found: list[tuple[int, int, str, dict[str, object]]] = []
    for path, kind in [*((d, "dir") for d in dirs), *((f, "file") for f in paths)]:
        at = path.rfind("/") + 1
        spans = [(m.start(), m.end()) for m in rx.finditer(path) if m.end() > m.start()]
        if not spans:
            continue
        in_name = any(start >= at for start, _ in spans)
        found.append((0 if in_name else 1, len(path), path, {"path": path, "kind": kind, "ranges": [[_u16(path, a), _u16(path, b)] for a, b in spans]}))
    found.sort(key=lambda x: (x[0], x[1], x[2]))
    return [x[3] for x in found[:WORKSPACE_SEARCH_MAX_NAMES]]


# UI sprint 437: the tree's find by name, as VS Code's ExplorerFindProvider (explorerViewer.ts): files whose
# name matches, at most 512, and folders whose name matches, both from the same walk as the search (so ignored
# files are not found), case ignored; fuzzy reads `abc` as `*a*b*c*`, else `*abc*`.
WORKSPACE_FIND_MAX_FILES = 512


def _name_regex(query: str, *, fuzzy: bool) -> re.Pattern[str]:
    q = query.lower()
    return re.compile(".*".join(re.escape(c) for c in q) if fuzzy else re.escape(q))


def _workspace_find_names(root: Path, query: str, *, fuzzy: bool) -> dict[str, object]:
    """The files and folders whose name matches `query` (UI sprint 437), relative and in path order;
    `truncated` when more than WORKSPACE_FIND_MAX_FILES files matched or the walk was cut."""
    if not query:
        return {"files": [], "folders": [], "truncated": False, "unreadable": 0}
    rx = _name_regex(query, fuzzy=fuzzy)
    unreadable: list[str] = []
    paths, truncated = _workspace_files(root, unreadable=unreadable)
    files: list[str] = []
    folders: set[str] = set()
    for rel in paths:
        parts = rel.split("/")
        for n in range(1, len(parts)):
            if rx.search(parts[n - 1].lower()):
                folders.add("/".join(parts[:n]))
        if rx.search(parts[-1].lower()):
            if len(files) == WORKSPACE_FIND_MAX_FILES:
                truncated = True
            else:
                files.append(rel)
    return {"files": files, "folders": sorted(folders), "truncated": truncated, "unreadable": len(unreadable)}


def _expand_replacement(template: str, m: re.Match[str]) -> str:
    """A regex replacement as editors write it: `$1`–`$99`, `$<name>`, `$&` the match, `$$` a dollar, and
    `\\n`, `\\t`, `\\\\`; anything else as written."""
    out: list[str] = []
    i = 0
    while i < len(template):
        c, nxt = template[i], template[i + 1 : i + 2]
        if c == "$" and nxt == "$":
            out.append("$")
            i += 2
        elif c == "$" and nxt == "&":
            out.append(m.group(0))
            i += 2
        elif c == "$" and nxt.isdigit():
            two = template[i + 1 : i + 3]
            k = int(two) if two.isdigit() and int(two) <= (m.re.groups or 0) else int(nxt)
            if 0 < k <= (m.re.groups or 0):
                out.append(m.group(k) or "")
                i += 1 + len(str(k))
            else:
                out.append(c)
                i += 1
        elif c == "$" and nxt == "<" and ">" in template[i + 2 :]:
            name = template[i + 2 : template.index(">", i + 2)]
            if name in m.re.groupindex:
                out.append(m.group(name) or "")
                i += 3 + len(name)
            else:
                out.append(c)
                i += 1
        elif c == "\\" and nxt in ("n", "t", "\\"):
            out.append({"n": "\n", "t": "\t", "\\": "\\"}[nxt])
            i += 2
        else:
            out.append(c)
            i += 1
    return "".join(out)


def _replaced(text: str, rx: re.Pattern[str], replacement: str, *, regex: bool, line: int | None = None, index: int | None = None) -> tuple[str, int]:
    """The text with its matches replaced line by line, as the search found them (so `^` and `$` are each
    line's), and how many: every match, the matches on one line, or the index-th match on that line."""
    out: list[str] = []
    done = 0
    for n, (body, end) in enumerate(_lines(text), 1):
        if line is not None and n != line:
            out.append(body + end)
            continue
        seen = 0

        def sub(m: re.Match[str]) -> str:
            nonlocal seen, done
            if m.end() == m.start():
                return m.group(0)
            seen += 1
            if index is not None and seen - 1 != index:
                return m.group(0)
            done += 1
            return _expand_replacement(replacement, m) if regex else replacement

        out.append(rx.sub(sub, body) + end)
    return "".join(out), done


def _workspace_replace(
    root: Path, query: str, replacement: str, *, regex: bool, case: bool, word: bool = False, include: str = "", exclude: str = "",
    path: str | None = None, line: int | None = None, index: int | None = None, buffers: dict[str, str] | None = None,
) -> dict[str, object]:
    """The new text of each file a replace changes (UI sprint 435), not written: every file the search
    finds, the one `path`, or one match (`path`, `line`, `index`). Each file is `{path, text, before,
    sha256, replaced, buffer}`: before, the text replaced in (UI sprint 436, for the replace's one undo);
    sha256 the hash of the file on disk, for the write's conflict check; buffer true when the text came
    from the editor's unsaved buffer (`buffers`), which the page then changes and saves."""
    buffers = buffers or {}
    rx = _search_regex(query, regex=regex, case=case, word=word)
    base = root.resolve(strict=True)
    if path is not None:
        _workspace_target(root, path)
        paths = [path]
    else:
        paths = _workspace_files(root, include, exclude)[0]
    files: list[dict[str, object]] = []
    total = 0
    for rel in paths:
        disk = _read_text(base / rel)
        got = (buffers[rel], disk[1] if disk else "") if rel in buffers else disk
        if got is None:
            continue
        text, n = _replaced(got[0], rx, replacement, regex=regex, line=line, index=index)
        if n:
            files.append({"path": rel, "text": text, "before": got[0], "sha256": got[1], "replaced": n, "buffer": rel in buffers})
            total += n
    return {"files": files, "replaced": total}


def _buffers(body: dict[str, Any]) -> dict[str, str]:
    """A request body's `buffers`: the editor's unsaved text by workspace path, strings only."""
    raw = body.get("buffers")
    return {str(k): v for k, v in raw.items() if isinstance(v, str)} if isinstance(raw, dict) else {}


def _line_endings(text: str) -> str | None:
    """`lf`, `crlf`, `mixed`, or None for a text with no line break."""
    crlf = text.count("\r\n")
    lf = text.count("\n") - crlf
    if not crlf and not lf:
        return None
    return "mixed" if crlf and lf else "crlf" if crlf else "lf"


def _file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


class WorkspaceConflictError(ValueError):
    """A write that would overwrite something it may not: the file changed since the caller read it
    (`base_sha256` differs), or the file is not UTF-8 text."""


def _workspace_read(root: Path, rel: str, max_bytes: int = WORKSPACE_READ_MAX) -> dict[str, object]:
    """A file's facts and, for UTF-8 text up to `max_bytes`, its text: size, modified time, the
    sha256 of its bytes (a write sends it back as `base_sha256`), encoding (`utf-8` or `binary`),
    line endings. Over the cap the text is null and `too_large` true."""
    target = _workspace_target(root, rel)
    if not target.is_file():
        raise FileNotFoundError(f"{rel!r} is not a file in the workspace")
    st = target.stat()
    base = root.resolve(strict=True)
    out: dict[str, object] = {
        "path": str(target.relative_to(base)),
        "size": st.st_size,
        "modified": st.st_mtime,
        "too_large": st.st_size > max_bytes,
        "sha256": _file_sha256(target),
        "encoding": None,
        "line_endings": None,
        "text": None,
    }
    if st.st_size > max_bytes:
        return out
    data = target.read_bytes()
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        out["encoding"] = "binary"
        return out
    out.update(encoding="utf-8", line_endings=_line_endings(text), text=text)
    return out


# UI sprint 388, editor shared work 0(e): a turn's attachments (kernel K344, session vocabulary
# § AC). The kinds the chips carry. File, lines, folder and image resolve by round 3's rules (sprint 446,
# `_attachment_text`): content or a reference line; event to the record entry's kind and payload; the
# others are recorded with empty text until their views come.
ATTACHMENT_KINDS = (
    "file",
    "folder",
    "lines",
    "image",
    "time_range",
    "element",
    "plan_item",
    "event",
)


# UI sprint 446 (roadmap r13 E10.1; ADD-TO-MESSAGE-2026-11-10-r3 rules 1-8): a message is never refused for
# what it carries. Content goes inline when it is text and small; anything else goes as its reference, one
# line saying why, which the model can follow with its own file tools. The two caps keep inlined content,
# which every later turn sends again, small: 64 KB a file (about 16,000 tokens, under Claude Code's 25,000 a
# read) and 256 KB a message (a quarter of the 1 MB argument cap the coding harnesses run under).
ATTACH_FILE_INLINE_MAX = 64 * 1024
ATTACH_MESSAGE_INLINE_MAX = 256 * 1024
ATTACH_FOLDER_LIST_MAX = 200
ATTACH_BINARY_SNIFF = 8 * 1024
ATTACH_FOLLOW = "read it with your file tools"


def _human_size(n: int) -> str:
    if n < 1024:
        return f"{n} B"
    if n < 1024 * 1024:
        return f"{n / 1024:.1f} KB"
    return f"{n / (1024 * 1024):.1f} MB"


def _decode_any(data: bytes) -> tuple[str, str] | None:
    """`data` as text with its encoding's name, or None for binary (round 3 rule 3, after ripgrep's guide):
    a byte-order mark names the encoding; without one, a NUL byte in the first 8 KB is binary; otherwise
    UTF-8, and bytes that are not UTF-8 decode one for one as Latin-1, which reads every byte."""
    if data.startswith(b"\xef\xbb\xbf"):
        return data[3:].decode("utf-8", errors="replace"), "UTF-8"
    if data.startswith((b"\xff\xfe", b"\xfe\xff")):
        try:
            return data.decode("utf-16"), "UTF-16"
        except UnicodeDecodeError:
            pass
    if b"\x00" in data[:ATTACH_BINARY_SNIFF]:
        return None
    try:
        return data.decode("utf-8"), "UTF-8"
    except UnicodeDecodeError:
        return data.decode("latin-1"), "Latin-1"


def _line_count(text: str) -> int:
    return text.count("\n") + (1 if text and not text.endswith("\n") else 0)


def _attachment_text(
    kind: str, ref: str, span: tuple[float, ...], workspace: Path, room: int
) -> tuple[str, int, bool]:
    """A file, line-range, folder or image attachment's text: (the text, the bytes it inlines, whether it
    went as its reference). `room` is what is left of the message's 256 KB. A path outside the workspace
    raises WorkspaceEscapeError, the one refusal left besides a malformed request."""
    target = _workspace_target(workspace, ref or ".")
    lines_note = f", lines {int(span[0])}–{int(span[1])}" if kind == "lines" else ""
    if kind == "folder":
        if not target.is_dir():
            return f"(not found when the message was sent: {ref}/)", 0, True
        base = workspace.resolve(strict=True)
        rel_dir = str(target.relative_to(base)) if target != base else ""
        files, cut = _workspace_files(workspace, include=rel_dir) if rel_dir else _workspace_files(workspace)
        shown = files[:ATTACH_FOLDER_LIST_MAX]
        files_n = lambda n: f"{n:,} file{'' if n == 1 else 's'}"  # noqa: E731
        head = f"({rel_dir or '.'}/, {files_n(len(files))}{', the walk stopped there' if cut else ''})"
        body = "\n".join([head, *shown] + ([f"(and {files_n(len(files) - len(shown))} more)"] if len(files) > len(shown) else []))
        size = len(body.encode("utf-8"))
        if size > room:
            return f"(not inlined: a listing of {files_n(len(files))}, past the 256 KB a message inlines; {rel_dir or '.'}/; list it with your file tools)", 0, True
        return body, size, False
    if not target.is_file():
        return f"(not found when the message was sent: {ref}{lines_note})", 0, True
    size = target.stat().st_size
    if kind == "image":
        return f"(not inlined: an image, {_human_size(size)}; {ref}; {ATTACH_FOLLOW})", 0, True
    with target.open("rb") as fh:
        sniff = fh.read(ATTACH_BINARY_SNIFF)
    utf16 = sniff.startswith((b"\xff\xfe", b"\xfe\xff"))
    binary = f"(not inlined: {_human_size(size)}, binary; {ref}; {ATTACH_FOLLOW})"
    if not utf16 and not sniff.startswith(b"\xef\xbb\xbf") and b"\x00" in sniff:
        return binary, 0, True
    follow = "read them with your file tools" if kind == "lines" else ATTACH_FOLLOW
    if size > WORKSPACE_READ_MAX:
        # Past the read cap: too big to inline whatever it holds; its lines counted by their LF bytes where
        # the encoding has one-byte LFs (not UTF-16).
        count = ""
        if not utf16:
            with target.open("rb") as fh:
                n = sum(chunk.count(b"\n") for chunk in iter(lambda: fh.read(1 << 20), b""))
            count = f", {n:,} lines"
        return f"(not inlined: {_human_size(size)}{count}, over the 64 KB a file goes inline; {ref}{lines_note}; {follow})", 0, True
    decoded = _decode_any(target.read_bytes())
    if decoded is None:
        return binary, 0, True
    text, encoding = decoded
    if kind == "lines":
        text = "".join(text.splitlines(keepends=True)[int(span[0]) - 1 : int(span[1])])
    used = len(text.encode("utf-8"))
    what = f"{_human_size(used)}, {_line_count(text):,} lines"
    if used > ATTACH_FILE_INLINE_MAX:
        return f"(not inlined: {what}, over the 64 KB a file goes inline; {ref}{lines_note}; {follow})", 0, True
    if used > room:
        return f"(not inlined: {what}, past the 256 KB a message inlines; {ref}{lines_note}; {follow})", 0, True
    enc = "" if encoding == "UTF-8" else f", {encoding}"
    return f"({ref}{lines_note}{enc})\n{text}", used, False


def _resolve_attachments(raw: object, workspace: Path, record_root: Path) -> tuple[tuple[Any, ...], int]:
    """The body's `attachments`, each {kind, label, ref, span?}, as kernel `Attachment`s with their text
    read now (UI sprint 446: by round 3's rules, through `_attachment_text`), and how many went as their
    reference. ValueError names a malformed one, and WorkspaceEscapeError a path outside the workspace;
    nothing else refuses a message."""
    from substrate.topologies.session.vocabulary import Attachment

    if raw is None:
        return (), 0
    if not isinstance(raw, list):
        raise ValueError("attachments must be a list or absent")
    out: list[Any] = []
    room = ATTACH_MESSAGE_INLINE_MAX
    by_reference = 0
    for i, item in enumerate(raw):
        if not isinstance(item, dict):
            raise ValueError(f"attachments[{i}] must be an object")
        kind, label, ref = item.get("kind"), item.get("label"), item.get("ref")
        if kind not in ATTACHMENT_KINDS:
            raise ValueError(f"attachments[{i}].kind must be one of {', '.join(ATTACHMENT_KINDS)}")
        if not isinstance(label, str) or not label:
            raise ValueError(f"attachments[{i}].label must be a non-empty string")
        if not isinstance(ref, str):
            raise ValueError(f"attachments[{i}].ref must be a string")
        span_raw = item.get("span", [])
        if not (
            isinstance(span_raw, list)
            and all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in span_raw)
        ):
            raise ValueError(f"attachments[{i}].span must be a list of numbers")
        span = tuple(float(x) for x in span_raw)
        if kind == "lines" and (len(span) != 2 or not all(x == int(x) for x in span) or not 1 <= span[0] <= span[1]):
            raise ValueError(f"attachments[{i}].span must be [first, last] lines, from 1")
        text = ""
        if kind in ("file", "lines", "folder", "image"):
            try:
                text, used, referred = _attachment_text(kind, ref, span, workspace, room)
            except OSError as exc:
                # A file the server cannot open (permission, a vanished folder) still goes, as its reference.
                text, used, referred = f"(not inlined: it could not be read, {exc.strerror or type(exc).__name__}; {ref}; {ATTACH_FOLLOW})", 0, True
            room -= used
            by_reference += int(referred)
        elif kind == "event":
            m = re.fullmatch(r"seq:(\d+)", ref)
            if m is None:
                raise ValueError(f"attachments[{i}].ref must be seq:<n> for an event")
            seq = int(m.group(1))
            entry = next((e for e in api.read_record(record_root) if e.get("seq") == seq), None)
            if entry is None:
                raise ValueError(f"the record has no event at seq {seq}")
            text = json.dumps(
                {"kind": entry.get("kind"), "payload": entry.get("payload")}, ensure_ascii=False
            )
        out.append(Attachment(kind=kind, label=label, ref=ref, span=span, text=text))
    return tuple(out), by_reference


# UI sprint 349, editor shared work 0(c): watching a workspace. A snapshot maps each file's path
# (relative, "/"-separated) to its modified time and size; two snapshots give the changes. Links are
# not followed, and `.git` folders are left out. A tree past WATCH_MAX_FILES is cut there, and the
# snapshot says so.
WATCH_MAX_FILES = 20_000
WATCH_POLL_S = 0.5


def _workspace_snapshot(
    root: Path, max_files: int = WATCH_MAX_FILES
) -> tuple[dict[str, tuple[int, int]], bool]:
    """Each file under `root` with its (modified ns, size); True when the walk stopped at the cap."""
    base = root.resolve(strict=True)
    files: dict[str, tuple[int, int]] = {}
    for dirpath, dirnames, filenames in os.walk(base, followlinks=False):
        # `.git` folders are git's own bookkeeping, rewritten on every commit; the session's
        # workspace is a git repository (VS Code's watcher leaves `**/.git/objects/**` out too).
        dirnames[:] = sorted(d for d in dirnames if d != ".git")
        # A link to a folder is listed among the folders and not followed; it counts as a file here.
        links = [d for d in dirnames if (Path(dirpath) / d).is_symlink()]
        dirnames[:] = [d for d in dirnames if d not in links]
        for name in sorted([*filenames, *links]):
            full = Path(dirpath) / name
            try:
                st = full.lstat()
            except OSError:
                continue
            files[full.relative_to(base).as_posix()] = (st.st_mtime_ns, st.st_size)
            if len(files) >= max_files:
                return files, True
    return files, False


def _workspace_changes(
    before: dict[str, tuple[int, int]], after: dict[str, tuple[int, int]]
) -> list[dict[str, str]]:
    """The files created, modified (time or size) and deleted between two snapshots, by path."""
    out = [{"path": p, "change": "created"} for p in after.keys() - before.keys()]
    out += [{"path": p, "change": "deleted"} for p in before.keys() - after.keys()]
    out += [
        {"path": p, "change": "modified"}
        for p in after.keys() & before.keys()
        if after[p] != before[p]
    ]
    return sorted(out, key=lambda c: (c["path"], c["change"]))


def _canonical_workspace(path: str) -> str:
    """Sprint 086b — one string per real directory. Expands `~` and
    strips a trailing slash (it does not resolve symlinks). Two Records rows
    that pointed at the same directory (`~/.substrate/sandbox` vs
    `/Users/peterlaffey/.substrate/sandbox`) now dedupe. Sessions and
    workspaces both store this form so exact-string filters do not
    miss matches."""
    from pathlib import Path as _Path

    if not isinstance(path, str) or not path:
        return path
    try:
        expanded = _Path(path).expanduser()
        return str(expanded).rstrip("/") or "/"
    except (OSError, RuntimeError):
        return path


# Session per-workspace bucket: sessions whose workspace looks like a
# per-session sandbox (`<home>/.substrate/sessions/<id>/workspace`)
# get collapsed under a single Records row rooted at the parent dir.
# Test-fixture debris (walkthrough, harness, /tmp, /var/folders) is
# hidden entirely — it is dev artifact, not user work.
_PER_SESSION_SANDBOX_RE = None  # lazy-compiled below


def _sessions_dir_root() -> str:
    return str(api.substrate_home() / "sessions")


def _is_per_session_sandbox(path: str) -> bool:
    """Anywhere under ~/.substrate/sessions/. Covers every shape
    substrate has ever produced: top-level `<id>/workspace`, nested
    `<id>/workspace/delegate-runs/fan-<id>/workspace`, legacy
    `default`/`adhoc-<x>` bare paths. Everything under that root
    collapses under one Records row."""
    import re as _re

    global _PER_SESSION_SANDBOX_RE
    if _PER_SESSION_SANDBOX_RE is None:
        _PER_SESSION_SANDBOX_RE = _re.compile(r"\.substrate/sessions/")
    return isinstance(path, str) and bool(_PER_SESSION_SANDBOX_RE.search(path))


def _is_test_fixture_workspace(path: str) -> bool:
    import re as _re

    if not isinstance(path, str):
        return False
    return bool(
        _re.search(r"(^/var/folders/|^/tmp/|substrate-walkthrough-|substrate-harness-)", path)
    )


def _classify_workspace_shape(path: str) -> str:
    """Best-effort shape classification for a user-picked workspace path.
    `worktree` = a directory that looks like a git working tree; `sandbox`
    = a directory under a known sandbox root; `path` = anything else."""
    from pathlib import Path as _Path

    p = _Path(path)
    try:
        if (p / ".git").exists():
            return "worktree"
    except OSError:
        pass
    home_sandbox = api.substrate_home() / "sandbox"
    if path == str(home_sandbox) or path == "~/.substrate/sandbox":
        return "sandbox"
    return "path"


def _is_temp_workspace(path: str) -> bool:
    """Sprint 093c — True for a path that lives in a temp directory: the
    system temp root, /tmp, /var/folders (both with and without the
    /private prefix), or any `pytest-of-<user>` component. Test runs and
    harnesses mint these and delete them; they are never a workspace the
    user picked, so they are refused by class, not by name. Paths under
    the current state root are exempt: a test points SUBSTRATE_HOME at a
    temp dir, and its sandbox rows are real for that run."""
    import tempfile
    from pathlib import Path as _Path

    try:
        p = _Path(path).expanduser().resolve()
    except (OSError, RuntimeError):
        return False
    try:
        if p.is_relative_to(api.substrate_home().expanduser().resolve()):
            return False
    except (OSError, RuntimeError):
        pass
    if any(part.startswith("pytest-of-") for part in p.parts):
        return True
    roots = {"/tmp", "/private/tmp", "/var/folders", "/private/var/folders", tempfile.gettempdir()}  # noqa: S108 — classifying temp paths, not writing to one
    for root in roots:
        try:
            if p.is_relative_to(_Path(root).resolve()):
                return True
        except (OSError, RuntimeError):
            continue
    return False


def _remember_workspace(path: str) -> None:
    """Append the canonical form of `path` to
    `~/.substrate/recent-workspaces.json`. LRU trimmed to
    _RECENT_WORKSPACES_MAX. Idempotent — the same directory landed via
    a tilde form and an absolute form both resolve to one canonical
    row. Called from POST /api/session after a successful open and
    from POST /api/workspaces when the user picks a folder through
    the OS dialog. Per-session sandboxes are skipped — those collapse
    under one synthesized row rooted at `_sessions_dir_root()`; the
    recent-workspaces file is for USER-picked directories only."""
    if not isinstance(path, str) or not path:
        return
    canonical = _canonical_workspace(path)
    if not os.path.isabs(canonical):
        # A relative path ("." was stored) means the server's cwd, which differs between source
        # and packaged builds. Refused (UI sprint 097).
        return
    if _is_per_session_sandbox(canonical) or _is_temp_workspace(canonical):
        return
    file = api.substrate_home() / "recent-workspaces.json"
    try:
        file.parent.mkdir(parents=True, exist_ok=True)
    except OSError:
        return
    existing: list[dict[str, str]] = []
    if file.exists():
        try:
            data = msgspec.json.decode(file.read_bytes())
            if isinstance(data, list):
                existing = [
                    row
                    for row in data
                    if isinstance(row, dict) and isinstance(row.get("path"), str)
                ]
        except Exception:  # noqa: BLE001 — malformed file → rewrite
            existing = []
    # Canonicalize existing entries too so an old tilde form on disk
    # collapses with the newly-added absolute form.
    canonicalized = []
    canonical_seen: set[str] = set()
    for row in existing:
        cp = _canonical_workspace(str(row["path"]))
        if cp in canonical_seen:
            continue
        canonical_seen.add(cp)
        canonicalized.append(
            {"path": cp, "shape": row.get("shape") or _classify_workspace_shape(cp)}
        )
    without = [row for row in canonicalized if row["path"] != canonical]
    shape = _classify_workspace_shape(canonical)
    updated = [{"path": canonical, "shape": shape}, *without][:_RECENT_WORKSPACES_MAX]
    try:
        file.write_bytes(msgspec.json.encode(updated))
    except OSError:
        return


def _recent_workspaces(app: App) -> list[dict[str, str]]:
    """One row per distinct canonical directory a session ever ran in,
    plus every entry the user has recorded via the folder picker in
    `~/.substrate/recent-workspaces.json`. Per-session sandboxes
    (`~/.substrate/sessions/<id>/workspace`) collapse under one
    synthesized row at `<home>/.substrate/sessions/` — that row is
    the scroll bucket for sessions where the user never picked a
    workspace. Temp-directory paths (/tmp, /var/folders, pytest-of-*)
    are refused by `_is_temp_workspace` (Sprint 093c); every other
    path appears as its own row.
    A stable `~/.substrate/sandbox` row always exists so a fresh
    box has one bindable target."""
    from pathlib import Path as _Path

    seen: dict[str, dict[str, str]] = {}
    order: list[str] = []

    def _add(path: str, shape: str, *, must_exist: bool = True) -> None:
        if not isinstance(path, str) or not path:
            return
        cp = _canonical_workspace(path)
        if not cp:
            return
        if cp in seen:
            return
        if not os.path.isabs(cp) or _is_temp_workspace(cp):
            return
        if must_exist and not _Path(cp).is_dir():
            return
        seen[cp] = {"path": cp, "shape": shape}
        order.append(cp)

    home_file = api.substrate_home() / "recent-workspaces.json"
    if home_file.exists():
        try:
            data = msgspec.json.decode(home_file.read_bytes())
            if isinstance(data, list):
                for row in data:
                    if not isinstance(row, dict):
                        continue
                    p, s = row.get("path"), row.get("shape")
                    if isinstance(p, str) and isinstance(s, str):
                        _add(p, s)
        except Exception:  # noqa: BLE001, S110 — file malformed / unreadable, keep going
            pass
    # Derive every distinct workspace across every session bucket.
    # Per-session sandboxes collapse under one synthesized row; every
    # other path (real folders, test fixtures) appears as-is.
    per_session_seen = False
    try:
        sessions = _list_sessions_snapshot(app)
    except Exception:  # noqa: BLE001
        sessions = {"live": [], "parked": [], "interrupted": [], "ended": []}
    for bucket in ("live", "parked", "interrupted", "ended"):
        for entry in sessions.get(bucket, []):
            if not isinstance(entry, dict):
                continue
            workspace = entry.get("workspace")
            if not isinstance(workspace, str) or not workspace:
                continue
            canonical = _canonical_workspace(workspace)
            if _is_per_session_sandbox(canonical):
                per_session_seen = True
                continue
            shape = (
                entry.get("workspace_shape")
                if isinstance(entry.get("workspace_shape"), str)
                else _classify_workspace_shape(canonical)
            )
            _add(canonical, shape or "path")
    # Synthesized per-session sandbox row — one for the collective set.
    if per_session_seen:
        _add(_sessions_dir_root(), "per-session-sandboxes", must_exist=False)
    # Stable sandbox row so a fresh user has one bindable target.
    sandbox = str(api.substrate_home() / "sandbox")
    _add(sandbox, "sandbox", must_exist=False)
    return [seen[canonical] for canonical in order]


# The default address is the one the CLI's TCP fallback dials (SUBSTRATE_DAEMON_HOST /
# SUBSTRATE_DAEMON_PORT, 127.0.0.1:8765), read from the kernel's daemon client so the two cannot
# drift (lens audit F063). main() reads --host / --port and overrides these before binding;
# --port 0 asks the OS for an ephemeral port that the readback line prints for Electron.
HOST, PORT = _substrate_daemon_client.tcp_host_port()
# Static frontend: Vite builds web/*.ts + web/*.html to web/dist/. If dist/ exists, serve from
# there (production shape); otherwise fall back to web/ (transitional — the source-level index.html
# won't load its <script type="module" src="./app.ts"> without the Vite runtime).
_WEB_SRC = Path(__file__).resolve().parent / "web"
_WEB_DIST = _WEB_SRC / "dist"
WEB = _WEB_DIST if _WEB_DIST.is_dir() else _WEB_SRC


def _runs_dir() -> Path:
    """Generated/live run records: `<state root>/runs`. Resolved at each use,
    never at import — Sprint 093 (Twelve-Factor III; Composition Root). An
    import-time constant froze the state root before tests or the launcher
    set SUBSTRATE_HOME, so a test run wrote into the real ~/.substrate.
    Nothing is created here; `api.Runtime(root)` creates the record dir
    (and its parents) when it writes."""
    return api.substrate_home() / "runs"


def _sessions_base() -> Path:
    """Per-conversation session dirs: `<state root>/sessions`. Resolved at
    each use, never at import (Sprint 093)."""
    return api.substrate_home() / "sessions"


# History of the runs root: was `Path(__file__).resolve().parent / "runs"`. In the packaged .app, that
# resolves inside `Contents/Resources/app.asar.unpacked/`, which macOS refuses
# to write to on a notarized bundle installed under /Applications — every
# launch/build/resume/delegate wrote `PermissionError: [Errno 1] Operation not
# permitted`, the HTTP layer answered `"status":"incomplete"`, and every view
# that reads a record (Structure among them) found nothing. `~/.substrate/`
# is where sessions already live; keeping `runs/` alongside them puts every
# writable-record path in the same tree, in both source and packaged mode.
# Review 2026-09-28 § F1. (Full `app.getPath('userData')` isolation is a
# follow-on for F8; that would also move `~/.substrate/sessions/` and the
# daemon socket, a larger cross-project change.)
# Session dirs (`_sessions_base()`) are per-conversation agent workspaces — a DEDICATED session
# dir, never the server cwd (a scribble-in-the-repo footgun the cockpit hit live). A bare
# `?workspace=<name>` resolves under there; an absolute path is a project the user picked.


def _worktree_diff(wt: Path) -> dict[str, object]:
    """What the agent changed in a session worktree (`substrate.app.workspace.worktree_diff`,
    read-only). Only worktrees under the sessions' `wt/` folder, where the registry makes them
    (kernel K315), are served; any other path is refused (lens audit F301)."""
    from substrate.app import workspace

    wt = Path(wt).expanduser().resolve()
    root = (_sessions_base() / "wt").resolve()
    if not wt.is_relative_to(root) or wt == root:
        raise ValueError(f"{wt} is not a session worktree")
    return workspace.worktree_diff(wt)


_SESSION_PREFIXES = (
    "launch_",
    "build_",
    "resume_",
    "s_topo_",
)  # generated runs (prunable; vs the stable demo_* fixtures). launch_/build_/resume_ records
# predate 2026-10-08, when those endpoints were deleted; s_topo_ are /api/topology/<name>/run.
_CT = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
}


_SAFE_RECORD_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")


_SESSION_ID_RE = re.compile(r"^s_[0-9a-f]{8,32}$")


def _record_path(name: str) -> Path | None:
    """Resolve a record name to a path: a generated/live record under runs/ first, else a bundled
    demo record, else a session record under `_sessions_base()/<session_id>/record`. The production
    seam points runs/ at a live records directory. A record name is a flat identifier — reject
    anything with a path separator or `..` so a request cannot read outside its resolved root
    (a traversal like `../../etc/x`).

    Piece-G sprint 035 adds the session-records branch: `/api/agent` and `/api/session` land
    records under `~/.substrate/sessions/<session_id>/record`, and legacy readers (the dock's
    `followLive` polling loop) expect to reach them by name through `/api/records/<name>`. The
    session-id shape (`s_[0-9a-f]{8,32}`) is checked against `_SESSION_ID_RE`; only names matching
    that shape can resolve to the sessions tree, so runs/ and bundled records still win first.
    """
    if not _SAFE_RECORD_NAME.match(name) or ".." in name:
        return None
    local = _runs_dir() / f"{name}.record"
    if local.exists():
        return local
    path = bundled.record_path(name)
    if path.exists():
        return path
    if _SESSION_ID_RE.match(name):
        session_record = _sessions_base() / name / "record"
        if session_record.exists():
            return session_record
    return None


def _record_names() -> list[str]:
    """The served records: the generated non-clean runs (runs/*.record — failed/paused/broken)
    first, then the bundled clean demos."""
    local = sorted(p.stem for p in _runs_dir().glob("*.record")) if _runs_dir().exists() else []
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


def _bundles_index() -> list[dict[str, object]]:
    """Sprint 034a: the bundle catalog for the rail's four-bucket read
    (sprint 034b) and the daily-driver terminal's create-time picker
    (sprint 035w). Consumes `substrate.bundles.list_bundles()` (substrate
    sprint 238). Response shape per bundle:

        {name, description, tools_enabled, slot_count}

    `slot_count` counts the three prose slots present per §7b (methodology,
    style, per_turn). A bundle with only methodology has slot_count=1.
    """
    list_bundles = api.list_bundles  # F-API-6: public surface only (Sprint 097)

    out: list[dict[str, object]] = []
    for b in list_bundles():
        prose_slots = [b.methodology, b.style, b.per_turn]
        slot_count = sum(1 for slot in prose_slots if slot)
        out.append(
            {
                "name": b.name,
                "description": b.description,
                "tools_enabled": list(b.tools_enabled),
                "slot_count": slot_count,
            }
        )
    return out


def _segment_fingerprint(path: Path) -> tuple[tuple[str, int, int], ...]:
    """Name, size and mtime of each event segment: an append, a roll or a close changes it."""
    out: list[tuple[str, int, int]] = []
    for seg in sorted(path.glob("events-*.jsonl")):
        try:
            st = seg.stat()
        except OSError:
            continue  # rolled or closed between glob and stat; the next request sees the new name
        out.append((seg.name, st.st_size, st.st_mtime_ns))
    return tuple(out)


def _record_summary(app: App, name: str, path: Path) -> dict[str, object]:
    """One rail row, recomputed only when the record's segments changed (lens audit F311: every
    request re-read every record and ran run_graph + narration_summary on each)."""
    key = path.resolve()
    fingerprint = _segment_fingerprint(path)
    with app.record_summary_lock:
        cached = app.record_summary_cache.get(key)
    if cached is not None and cached[0] == fingerprint:
        return {**cached[1], "name": name}
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
    row: dict[str, object] = {
        "name": name,
        "run_id": run_id,
        "status": g.status,  # incomplete | paused | finalised | failed (the real run-level outcome)
        "final_reason": g.final_reason,
        "paused_on": g.paused_on,
        "total_events": s.total_events,
        "producers_failed": s.producers_failed
        + s.input_build_failures
        + s.predicate_quarantines
        + s.invalid_emissions,
        "application_events": s.application_events,
        # a prunable run (`_SESSION_PREFIXES`) is a "run"; bundled demos and the named demo_*
        # fixtures are stable "demos" (kept by the prune).
        "source": "run" if name.startswith(_SESSION_PREFIXES) else "demo",
    }
    with app.record_summary_lock:
        app.record_summary_cache[key] = (fingerprint, row)
    return row


def _records_index(app: App, exclude_sessions: bool = False) -> list[dict[str, object]]:
    """The record list for the rail: each record's real run-level status + a one-glance summary
    (so a broken/paused run is flagged in the list itself — §7.2).

    `exclude_sessions=True` drops records whose name starts with one of `_SESSION_PREFIXES` or
    matches `_SESSION_ID_RE` (`s_[0-9a-f]{8,32}`): the rail renders live sessions in their own
    bucket from `GET /api/session`.
    """
    out: list[dict[str, object]] = []
    for name in _record_names():
        if exclude_sessions and (name.startswith(_SESSION_PREFIXES) or _SESSION_ID_RE.match(name)):
            continue
        path = _record_path(name)
        if path is None:
            continue
        out.append(_record_summary(app, name, path))
    return out


def _io(events: list[dict[str, Any]]) -> dict[str, object]:
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


def _topology_graph(events: list[dict[str, Any]]) -> dict[str, Any]:
    """The record's structure (`api.topology_graph`), plus what the structure lens needs and the
    manifest projection leaves out (UI sprint 138): the kinds written from outside the topology,
    and the RunStarted manifest's exports, baseline and config.

    `outside` is read from the record, for any topology: a kind some trigger subscribes to that no
    producer emits, or a kind the record holds with no producer (the app's `inject_event` and a
    resume's input). Lifecycle kinds (`substrate.*`) are the runtime's and are left out."""
    graph = _builtins(api.topology_graph(events))
    if not isinstance(graph, dict):
        raise TypeError(f"topology_graph projected to {type(graph).__name__}, not an object")
    emitted = {k for p in graph.get("producers", []) for k in p.get("emits", [])}
    subscribed = {k for t in graph.get("triggers", []) for k in t.get("on", [])}
    unproduced = {
        str(e.get("kind"))
        for e in events
        if e.get("producer") is None and not str(e.get("kind", "")).startswith("substrate.")
    }
    outside = {k for k in subscribed if k not in emitted} | unproduced
    graph["outside"] = sorted(k for k in outside if not k.startswith("substrate."))
    started = next((e for e in events if e.get("kind") == api.RUN_STARTED), None)
    payload = (started.get("payload") or {}) if started else {}
    topology = payload.get("topology") or {}
    graph["exports"] = topology.get("exports") or []
    graph["baseline"] = payload.get("baseline") or {}
    graph["config"] = payload.get("config") or {}
    return graph


# route name -> function(events) -> JSON-able
_PROJECTIONS = {
    "events": lambda ev: ev,
    "run_graph": lambda ev: _builtins(api.run_graph(ev)),
    "topology_graph": _topology_graph,
    "summary": lambda ev: _builtins(api.narration_summary(ev)),
    "narrate": lambda ev: [_builtins(line) for line in api.narrate(ev)],
    "narrate_full": lambda ev: [_builtins(line) for line in api.narrate(ev, lifecycle=True)],
    "io": _io,
}


# ── the assay seam: a results file (arms x cases x trials) read as ONE arm comparison ──────────
# Read-only projections, like the record ones, but at the ABOVE-a-run altitude: many records compared.
def _bench_results() -> Path:
    raw = os.environ.get("BENCH_RESULTS")
    if raw:
        return Path(raw)
    return api.substrate_home() / "bench_results"


def _assays_index() -> list[dict[str, object]]:
    """The assay rail: each cells file + its provenance (fingerprint/models/margin/trials) + counts."""
    from substrate.assay.cells import read_meta, read_rows

    out: list[dict[str, object]] = []
    br = _bench_results()
    if not br.exists():
        return out
    for cells in sorted(br.glob("*.jsonl")):
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


def _assay_report(app: App, name: str) -> dict[str, object]:
    """The arm matrix: report_from_cells -> the per-arm read (both currencies, deltas, margin-verdict)."""
    from substrate.assay.cells import report_from_cells

    cells = _bench_results() / f"{name}.jsonl"
    if not _SAFE_RECORD_NAME.match(name) or not cells.exists():
        return {"error": f"no assay {name!r}"}
    mtime = cells.stat().st_mtime
    cached = app.assay_cache.get(name)
    if cached and cached[0] == mtime:
        return cached[1]
    report, meta = report_from_cells(cells)
    result: dict[str, object] = {
        "name": name,
        "meta": meta,
        "report": _builtins(report),
    }
    app.assay_cache[name] = (mtime, result)
    return result


class Handler(BaseHTTPRequestHandler):
    @property
    def app(self) -> App:
        """The App of the server this request arrived on (`AppHTTPServer`, `_UnixHTTPServer`)."""
        return self.server.app  # type: ignore[attr-defined, no-any-return]

    def log_message(self, *args: object) -> None:  # quiet
        pass

    def _send(self, code: int, body: bytes, ctype: str) -> None:
        # Every /api/ refusal, from _error or a direct _json(..., 4xx/5xx): API_REFUSED (v0.11), its
        # cause the handler line that refused. The response text stays out of the trace (E1).
        path = urlparse(self.path).path
        if code >= 400 and path.startswith("/api/"):
            TRACE.emit(
                Signal.API_REFUSED,
                {
                    "area": _api_area(unquote(path)),
                    "status": code,
                    "cause": _site(("_send", "_json", "_error", "_fault")),
                },
            )
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        # Dev/local: never let the browser cache HTML or JS. Edits to
        # web/dist land immediately on the next request. Cost is
        # revalidation on each fetch, which is fine on 127.0.0.1.
        if ctype.startswith("text/html") or ctype == "application/javascript":
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, obj: object, code: int = 200) -> None:
        self._send(code, msgspec.json.encode(obj), "application/json")

    def _error(self, code: int, message: str) -> None:
        self._json({"error": message}, code)

    def _fault(self, exc: BaseException) -> None:
        """An exception reached a handler's boundary: SERVER_FAULTED (v0.11) names its type and the
        deepest server.py function it passed through, then the request gets its 500."""
        TRACE.emit(
            Signal.SERVER_FAULTED,
            {
                "area": _api_area(unquote(urlparse(self.path).path)),
                "error_type": type(exc).__name__,
                "where": _fault_where(exc),
            },
        )
        self._error(500, api.describe_error(exc))

    def _host_ok(self) -> bool:
        """DNS-rebinding defence (Jackson et al., *Protecting Browsers from DNS Rebinding Attacks*:
        "reject incoming HTTP requests with unexpected Host headers"). Over TCP the Host must name
        the loopback address this server is bound to, on its port. A rebound page reaches the
        same socket under its own hostname, so its Host is foreign. The Unix socket has no Host
        to forge; file permissions guard it."""
        if isinstance(self.server, _UnixHTTPServer):
            return True
        port = cast(tuple[Any, ...], self.server.server_address)[1]
        allowed = {f"127.0.0.1:{port}", f"localhost:{port}", f"[::1]:{port}"}
        return self.headers.get("Host", "") in allowed

    def _origin_ok(self) -> bool:
        # CSRF defence on the state-changing methods: a browser request carries an Origin; it must
        # name this server (same-origin, allowed host). A cross-site form carries a foreign Origin
        # -> rejected. Non-browser clients (curl, the CLI, the test runner) send no Origin.
        origin = self.headers.get("Origin")
        if not origin:
            return True
        return self._host_ok() and urlparse(origin).netloc == self.headers.get("Host", "")

    def _refuse_foreign_host(self) -> bool:
        """True (and the refusal sent) when the request must not be served: a Host that is not this
        server's (403), a foreign Origin on any method (403; a GET that carries an Origin is a
        cross-origin read, e.g. a page subscribing to the login-pty stream), or a body over
        _MAX_BODY_BYTES (413, before any of it is read)."""
        if not self._host_ok():
            self._error(403, "unexpected Host header")
            return True
        if not self._origin_ok():
            self._error(403, "cross-origin request refused")
            return True
        if int(self.headers.get("Content-Length", "0") or "0") > _MAX_BODY_BYTES:
            self.close_connection = True
            self._error(413, f"request body over {_MAX_BODY_BYTES} bytes")
            return True
        return False

    def do_POST(self) -> None:  # noqa: N802 — the thin control layer (launch + resume only, per ruling C1)
        if self._refuse_foreign_host():
            return
        path = unquote(urlparse(self.path).path)
        try:
            if path == "/api/session":
                self._session_create()
                return
            m_run_stop = re.fullmatch(r"/api/session/([^/]+)/runs/([^/]+)/stop", path)
            if m_run_stop:  # UI sprint 182
                self._session_run_stop(m_run_stop.group(1), m_run_stop.group(2))
                return
            m_stop = re.fullmatch(r"/api/session/([^/]+)/tasks/([^/]+)/stop", path)
            if m_stop:  # UI sprint 105
                self._session_task_stop(m_stop.group(1), m_stop.group(2))
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
            m_search = re.fullmatch(r"/api/session/([^/]+)/search", path)
            if m_search:  # UI sprint 436: the search with the editor's unsaved buffers in its body
                try:
                    body = self._read_json_body()
                except (BodyTooLarge, ValueError) as exc:
                    self._error(400, str(exc))
                    return
                args = {k: ["1" if v is True else "0" if v is False else str(v)] for k, v in body.items() if k in ("q", "regex", "case", "word", "include", "exclude")}
                self._session_search(m_search.group(1), args, _buffers(body))
                return
            m_replace = re.fullmatch(r"/api/session/([^/]+)/search/replace", path)
            if m_replace:  # UI sprint 435: a replace's new texts, for the page to write through PUT …/file
                self._session_search_replace(m_replace.group(1))
                return
            m_mcp = re.fullmatch(r"/api/session/([^/]+)/mcp", path)
            if m_mcp:  # UI sprint 129
                self._session_mcp(m_mcp.group(1))
                return
            if path.startswith("/api/topology/") and path.endswith("/run"):
                # Sprint 225a: POST /api/topology/<name>/run — piece-E
                # application dispatch endpoint per TECH-SPEC §7.6 line
                # 1043. One-shot only (session-shape apps route through
                # POST /api/session or /api/session/composite instead).
                topology_name = path[len("/api/topology/") : -len("/run")]
                self._topology_run(topology_name)
                return
            if path == "/api/agent":
                self._agent(parse_qs(urlparse(self.path).query))
                return
            if path == "/api/runs/clear":
                self._clear_runs()
                return
            # Sprint 086 — user picks a folder via the OS dialog; add it
            # to ~/.substrate/recent-workspaces.json so the Records
            # surface offers it.
            if path == "/api/workspaces":
                body = self._read_json_body()
                ws_path = body.get("path")
                if not isinstance(ws_path, str) or not ws_path:
                    self._error(400, "workspace add: {path: string} required")
                    return
                _remember_workspace(ws_path)
                self._json({"ok": True, "workspaces": _recent_workspaces(self.app)})
                return
            # Sprint 085a — CLI auth-in-transcript control endpoints.
            if path.startswith("/api/cli/") and path.endswith("/pty/start"):
                cli_name = path[len("/api/cli/") : -len("/pty/start")]
                self._cli_pty_start_endpoint(cli_name)
                return
            if path.startswith("/api/cli/") and "/pty/stdin/" in path:
                head, _, sid = path.rpartition("/pty/stdin/")
                cli_name = head[len("/api/cli/") :]
                self._cli_pty_stdin_endpoint(cli_name, sid)
                return
            if path.startswith("/api/cli/") and "/pty/close/" in path:
                head, _, sid = path.rpartition("/pty/close/")
                cli_name = head[len("/api/cli/") :]
                self._cli_pty_close_endpoint(cli_name, sid)
                return
            if path.startswith("/api/cli/") and path.endswith("/logout"):
                cli_name = path[len("/api/cli/") : -len("/logout")]
                self._cli_logout_endpoint(cli_name)
                return
            self._error(404, f"no control endpoint {path!r}")
        except Exception as exc:  # noqa: BLE001 — top-level do_POST boundary: a runaway inside any endpoint must become a JSON 500, not kill the daemon thread.
            self._fault(exc)

    def _clear_runs(self) -> None:
        """Prune the accumulating session runs under runs/ — the hash-suffixed launch_/build_/resume_
        records. Bundled demos live in the topology packages (not runs/) and the named demo_* fixtures
        are KEPT; only session runs are deleted. Skip a record a live launch thread is still writing."""
        import shutil

        live = {name for name in self.app.topology_runs if _is_live(self.app, name)}
        removed, kept = 0, 0
        if _runs_dir().exists():
            for rec in sorted(_runs_dir().glob("*.record")):
                if not rec.stem.startswith(_SESSION_PREFIXES) or rec.stem in live:
                    kept += 1
                    continue
                try:
                    shutil.rmtree(rec)
                    removed += 1
                except OSError:
                    kept += 1
        self._json({"removed": removed, "kept": kept})

    # ── Sprint 085a — CLI auth-in-transcript endpoints ─────────────────
    def _cli_pty_start_endpoint(self, cli_name: str) -> None:
        try:
            sid = _cli_pty_start(self.app, cli_name)
        except ValueError as exc:
            self._error(400, str(exc))
            return
        except FileNotFoundError:
            self._error(404, f"cli {cli_name!r} binary not found")
            return
        self._json({"sid": sid, "cli": cli_name})

    def _cli_pty_stream_endpoint(self, cli_name: str, sid: str) -> None:
        import base64 as _b64

        with self.app.cli_pty_lock:
            session = self.app.cli_pty_sessions.get(sid)
        if session is None or session["cli"] != cli_name:
            self._error(404, f"unknown pty session {sid!r} for cli {cli_name!r}")
            return
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Accel-Buffering", "no")
        self.end_headers()
        emitted = 0
        try:
            while True:
                with session["lock"]:
                    total = len(session["output_bytes"])
                    closed = session["closed"]
                    exit_code = session["exit_code"]
                    chunk = (
                        bytes(session["output_bytes"][emitted:total]) if total > emitted else b""
                    )
                if chunk:
                    frame = b"data: " + _b64.b64encode(chunk) + b"\n\n"
                    self.wfile.write(frame)
                    self.wfile.flush()
                    emitted = total
                if closed:
                    exit_frame = (
                        b"event: exit\ndata: "
                        + msgspec.json.encode({"exit_code": exit_code})
                        + b"\n\n"
                    )
                    self.wfile.write(exit_frame)
                    self.wfile.flush()
                    return
                time.sleep(0.15)
        except (BrokenPipeError, ConnectionResetError, OSError):
            return

    def _cli_pty_stdin_endpoint(self, cli_name: str, sid: str) -> None:
        with self.app.cli_pty_lock:
            session = self.app.cli_pty_sessions.get(sid)
        if session is None or session["cli"] != cli_name:
            self._error(404, f"unknown pty session {sid!r} for cli {cli_name!r}")
            return
        length = int(self.headers.get("Content-Length", "0") or "0")
        data = self.rfile.read(length) if length > 0 else b""
        ok = _cli_pty_write(self.app, sid, data)
        self._json({"ok": ok, "wrote": len(data) if ok else 0})

    def _cli_pty_close_endpoint(self, cli_name: str, sid: str) -> None:
        with self.app.cli_pty_lock:
            session = self.app.cli_pty_sessions.get(sid)
        if session is None or session["cli"] != cli_name:
            self._error(404, f"unknown pty session {sid!r} for cli {cli_name!r}")
            return
        _cli_pty_close(self.app, sid)
        self._json({"ok": True})

    def _cli_logout_endpoint(self, cli_name: str) -> None:
        entry = KNOWN_CLI_ADAPTERS.get(cli_name)
        if entry is None:
            self._error(404, f"unknown cli {cli_name!r}")
            return
        logout_cmd = entry.get("logout_command")
        if not logout_cmd:
            self._error(400, f"cli {cli_name!r} has no logout_command")
            return
        if not isinstance(logout_cmd, list):
            self._error(500, f"cli {cli_name!r}: logout_command must be an argv list")
            return
        try:
            proc = subprocess.run(logout_cmd, capture_output=True, text=True, timeout=15)  # noqa: S603
        except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
            self._error(500, f"logout failed: {exc}")
            return
        self._json(
            {
                "ok": proc.returncode == 0,
                "exit_code": proc.returncode,
                "stdout": proc.stdout,
                "stderr": proc.stderr,
            }
        )

    def _read_json_body(self) -> dict[str, Any]:
        """The one JSON body reader. A body over _MAX_BODY_BYTES raises BodyTooLarge (sent as 413)
        before any of it is read."""
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            return {}
        if length > _MAX_BODY_BYTES:
            raise BodyTooLarge(length)
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
        if self.app.registry is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        try:
            body = self._read_json_body()
        except ValueError as exc:
            self._error(400, str(exc))
            return
        driver = str(body.get("driver") or "deterministic")
        name = body.get("name")
        _workspace_arg = body.get("workspace")
        workspace_shape = str(body.get("workspace_shape") or "flat")
        # Sprint 223c: `isolate` (§9c Mode 3). Mutual exclusion with
        # workspace_shape: "worktree" — pick one, don't hide the operator's
        # intent behind silent precedence.
        isolate = bool(body.get("isolate"))
        if isolate and workspace_shape == "worktree":
            self._error(
                400,
                "isolate=true and workspace_shape='worktree' are mutually exclusive; pick one",
            )
            return
        # Sprint 046: workspace resolution matches product spec round 12
        # §9c and §3. Every session gets its OWN workspace under
        # ~/.substrate/sessions/<id>/workspace/ — never a shared
        # `default/` singleton. The session_id is not yet known at this
        # point (create() below assigns it), so mint a fresh one here
        # and force it through _forced_session_id. Substrate creates the
        # workspace dir at open — the spec says "substrate creates" and
        # a first-run bare `substrate` must Just Work, not fail on a
        # nonexistent cwd inside the bash tool.
        _minted_sid = f"s_{uuid.uuid4().hex[:24]}"
        _forced_session_id: str | None = None
        if isolate:
            workspace_shape = "isolate"
            workspace = str(_sessions_base() / _minted_sid / "workspace")
            _forced_session_id = _minted_sid
        elif _workspace_arg:
            # Caller pointed at a specific path. If it's a git repo the
            # session-registry create() promotes shape → worktree and
            # substrate creates the worktree there; if it's a plain
            # directory the session writes into it flat (Mode 1).
            try:
                workspace = _resolve_workspace_arg(str(_workspace_arg))
            except ValueError as exc:
                self._error(400, str(exc))
                return
        else:
            # Bare session, no --workspace. Spec §3 line 35 + §9c line 587:
            # sandbox at ~/.substrate/sessions/<id>/workspace/, flat shape.
            workspace = str(_sessions_base() / _minted_sid / "workspace")
            _forced_session_id = _minted_sid
        try:
            Path(workspace).mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            self._error(400, f"workspace {workspace!r} is not creatable: {exc}")
            return
        # Piece-B review finding 6: TECH-SPEC §4 names this field `seed_text`;
        # the earlier draft read `seed` only, so a client following the spec
        # silently sent nothing. Both names accepted; the spec wins on writes.
        seed = str(body.get("seed_text") or body.get("seed") or "")
        # Sprint 054: default the session bundle to substrate's shipped
        # `session` bundle when the caller omits it. Without a bundle,
        # substrate/topologies/session/__init__.py line 896 skips the
        # bundle_methodology + bundle_style producers and the daily
        # driver runs without its intended system-prompt fragments. Callers
        # can still pass `null` explicitly to opt out; only a MISSING field
        # defaults.
        # UI sprint 132 (kernel K288): with no bundle named, the session gets its model's default
        # guidance level (high for a CLI or a large model, medium, or low), resolved once, here,
        # and stored on the manifest. A bundle the caller names, a level's bundle included, is
        # used as given; `null` still opts out.
        if "bundle" in body:
            bundle = body.get("bundle")
        else:
            bundle = guidance_bundle(guidance_level(_model_class(driver)))
        # Sprint 223a: `role` per TECH-SPEC §1.6.5. Resolve at create time so
        # a nonexistent role name fails 400 immediately rather than at first
        # `/turn`. The resolver's `RegistrationError` carries the four-layer
        # search trail; forward the message verbatim.
        role = str(body.get("role") or "default")
        try:
            from substrate.topologies.session.roles import resolve_role_prompt

            resolve_role_prompt(role, repo_root=Path(workspace))
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
        # Sprint 032c: `driver_params` on POST. Same shape as PATCH; validated
        # via SessionRegistry.set_driver_params-style rules but at create time
        # we accept as-is and let the manifest carry it (the registry's
        # `create` does not validate — it trusts the daemon boundary).
        # Missing → None (responder defaults). Wrong shape → 400.
        driver_params_raw = body.get("driver_params")
        driver_params: dict[str, Any] | None = None
        if driver_params_raw is not None:
            if not isinstance(driver_params_raw, dict):
                self._error(
                    400,
                    f"driver_params must be an object or absent; got {type(driver_params_raw).__name__}",
                )
                return
            # Reuse the registry's validator by round-tripping through
            # set_driver_params after create — cleaner than duplicating validation
            # here. Store the raw dict on the manifest at create; validate below.
            driver_params = dict(driver_params_raw)
            refusal = _cache_layout_refusal(str(driver), driver_params)
            if refusal:
                self._error(400, refusal)
                return
        # Kernel K296 (session vocabulary § T): the Length and Tone positions; absent or null is
        # the default. The registry refuses an unknown position.
        controls: dict[str, str | None] = {}
        for control in Control:
            raw = body.get(control)
            if raw is not None and not isinstance(raw, str):
                self._error(400, f"{control} must be a string or null; got {type(raw).__name__}")
                return
            controls[control] = raw or None
        session_id = _forced_session_id or f"s_{uuid.uuid4().hex[:24]}"
        try:
            manifest = self.app.registry.create(
                session_id=session_id,
                name=str(name) if name is not None else None,
                driver=driver,
                workspace=workspace,
                workspace_shape=workspace_shape,
                bundle=str(bundle) if bundle is not None else None,
                seed=seed,
                role=role,
                tools=tools,
                driver_params=driver_params,
                length=controls[Control.LENGTH],
                tone=controls[Control.TONE],
                handoff=controls[Control.HANDOFF],
            )
            # Validate driver_params at the same boundary as PATCH does. If
            # the client sent bad shape/values, roll back the create so the
            # session never lands corrupt.
            if driver_params is not None:
                try:
                    self.app.registry.set_driver_params(session_id, driver_params)
                except ValueError as exc:
                    self.app.registry.delete(session_id)
                    self._error(400, f"driver_params: {exc}")
                    return
        except NameCollision as exc:  # carries existing_session_id (sprint 211)
            self._json(
                {"error": "name already taken", "existing_session_id": exc.existing_session_id},
                409,
            )
            return
        except ValueError as exc:  # an unknown Length or Tone position (K296)
            self._error(400, str(exc))
            return
        except Exception as exc:  # noqa: BLE001 — the handler boundary: anything else is a 500 naming its type
            self._fault(exc)
            return
        # Sprint 086 — remember this workspace on session open so the
        # Records surface can offer it as a bindable row later.
        # `_remember_workspace` skips session-sandbox and temp paths.
        _remember_workspace(manifest.workspace)
        TRACE.emit(
            Signal.SESSION_CREATED,
            {
                "session_id": manifest.session_id,
                "driver": str(manifest.driver),
                "workspace_shape": str(manifest.workspace_shape),
            },
        )
        # Sprint 032c: re-read the manifest post-validation (set_driver_params
        # rolls it forward with the validated dict). driver_params on the
        # response so the UI can echo it in the header without a GET.
        current = self.app.registry.get(session_id) or manifest
        self._json(
            {
                "session_id": manifest.session_id,
                "name": manifest.name,
                "record": manifest.record_root,
                "workspace": manifest.workspace,
                "workspace_shape": manifest.workspace_shape,
                "bundle": manifest.bundle,
                Control.LENGTH: manifest.length,  # kernel K296
                Control.TONE: manifest.tone,
                Control.HANDOFF: manifest.handoff,  # kernel K334
                "role": manifest.role,
                "driver_params": dict(current.driver_params)
                if current.driver_params is not None
                else None,
            }
        )

    def _session_turn(self, session_id: str) -> None:
        """Sprint 214a: POST /api/session/<id>/turn. Body:
            {"text": "hello"}
        Runs one turn via SessionRegistry.turn_sync (the same seam the delegate
        wire uses, per piece-C review finding 3's fix). Per-session threading.Lock
        serializes concurrent callers. Returns {status, final_seq?, error?}.
        UI sprint 388: optional `attachments`, each {kind, label, ref, span?}, go on the
        UserMessage with their text (`_resolve_attachments`).
        """
        if self.app.registry is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        # Sprint 216: 410 for a session that was live and is now gone. A
        # deleted session's record directory stays (SDD rule 12); its
        # manifest is popped. A caller that resolved the session name
        # earlier and hits /turn after the DELETE gets 410, not 404. A
        # never-existed session still returns 404.
        manifest = self.app.registry.get(session_id)
        if manifest is None:
            if self.app.registry.has_session_dir(session_id):
                self._json(
                    {
                        "ok": False,
                        "status": SessionStatus.ENDED,
                        "error": SESSION_DELETED,
                    },
                    410,
                )
                return
            self._error(404, f"unknown session_id {session_id!r}")
            return
        # Sprint follow-up 2026-09-25: ended sessions are resumable now.
        # turn_sync flips SessionStatus.ENDED to SessionStatus.PARKED under the lock and
        # continues the record. Do not pre-reject at the server layer.
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
            if not (isinstance(kinds, list) and all(isinstance(k, str) for k in kinds)):
                self._error(400, "context.kinds must be a list of strings")
                return
            context_slice = {
                "parent_seq_range": tuple(seq_range),
                "kinds": tuple(kinds),
            }
        # UI sprint 122: `/dellm` sends {"skill": "dellm"}. The turn's UserMessage carries
        # slash_source "skill:<name>", and the session loads the skill before the model starts
        # (kernel K277, session vocabulary § P.10).
        skill_raw = body.get("skill")
        slash_source = "daemon"
        if skill_raw is not None:
            if not isinstance(skill_raw, str) or not skill_raw:
                self._error(400, "skill must be a non-empty string or absent")
                return
            if not _SKILL_NAME.fullmatch(skill_raw):
                self._error(400, f"skill name {skill_raw!r} must be letters, digits, '-' or '_'")
                return
            slash_source = f"skill:{skill_raw}"
        # UI sprint 123: `//<command>` sends {"text": "/<command>", "driver_command": true}. Only a
        # driver whose profile takes slash commands gets it, as written (session vocabulary
        # § P.11); the model's history leaves the turn out.
        if body.get("driver_command"):
            driver_name = cast(
                SessionManifest, cast(SessionRegistry, self.app.registry).get(session_id)
            ).driver
            if not (KNOWN_CLI_ADAPTERS.get(driver_name) or {}).get("slash_commands"):
                self._error(400, f"This driver has no slash commands ({driver_name}).")
                return
            if not text.startswith("/"):
                self._error(400, "a driver command starts with /")
                return
            slash_source = "driver"
        # UI sprint 388: attachments, resolved now so a bad one is a 400 before the turn queues; since sprint
        # 446 only a malformed one or a path outside the workspace is bad.
        try:
            attachments, by_reference = _resolve_attachments(
                body.get("attachments"), Path(manifest.workspace), Path(manifest.record_root)
            )
        except (ValueError, OSError) as exc:
            self._error(400, str(exc))
            return
        # Sprint 216: per-session queue cap. Increment the counter under the
        # registry's fast lock; refuse the (cap+1)th caller with 429
        # immediately (no block). Every admission MUST pair with
        # dequeue_turn in a `finally`, or the counter leaks.
        admitted, position = self.app.registry.try_enqueue_turn(session_id)
        if not admitted:
            cap = self.app.registry.turn_queue_cap()
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
        seq_at_start = _tail_seq(Path(manifest.record_root))
        # Sprint 214a: compute next turn_index INSIDE the per-session lock via
        # `resume_event_builder`, so two concurrent POST /turn calls see two
        # distinct tail states rather than the same pre-lock snapshot.
        from substrate.topologies.session import UserMessage as SessionUserMessage

        def _build(_manifest: Any, record_root_locked: Path) -> Any:
            # F14: use the registry's in-memory counter instead of scanning
            # the entire record for the tail UserMessage.turn_index.
            next_turn_index = cast(SessionRegistry, self.app.registry).next_turn_index(session_id)
            # The turn is handed to the kernel now, under the session's lock (TURN_ACCEPTED).
            TRACE.emit(
                Signal.TURN_ACCEPTED,
                {
                    "session_id": session_id,
                    "turn_index": next_turn_index,
                    "attachments": len(attachments),
                    "by_reference": by_reference,
                },
            )
            # Sprint 217e: prefix a context slice to assembled_prompt when the
            # caller passed `context` in the body. The extractor is delegate's
            # existing helper; it reads the parent (== this session's) record
            # over the given seq range + kinds, caps at 8 KiB with event-
            # boundary drops, and returns the formatted text. Empty slice ->
            # empty assembled_prompt. K261: assembled_prompt is set only when a slice was
            # attached; per_turn goes into the prompt once, from the model's prompt builder.
            assembled_prompt = ""
            if context_slice is not None and record_root_locked.exists():
                from substrate.topologies.tool_loop.delegate import prefix_context_slice

                sliced = prefix_context_slice(record_root_locked, text, context_slice)
                assembled_prompt = sliced if sliced != text else ""
            return SessionUserMessage(
                text=text,
                turn_index=next_turn_index,
                assembled_prompt=assembled_prompt,
                slash_source=slash_source,
                attachments=attachments,
            )

        try:
            try:
                updated_manifest, root_after = self.app.registry.turn_sync(
                    session_id,
                    resume_event_builder=_build,
                )
            except SessionEndedMidTurn:
                self._json(
                    {
                        "ok": False,
                        "status": SessionStatus.ENDED,
                        "error": SESSION_ENDED_MID_TURN,
                    },
                    410,
                )
                return
            except TornRecordOnResume as exc:
                self._json(
                    {
                        "ok": False,
                        "status": SessionStatus.INTERRUPTED,
                        "error": RECORD_TORN,
                        "detail": str(exc),
                    },
                    410,
                )
                return
            except Exception as exc:  # noqa: BLE001 — the handler boundary: anything else is a 500 naming its type
                self._fault(exc)
                return
            # Return the record's tail seq so the caller can page /events from there.
            final_seq = _tail_seq(root_after)
            self._json(
                {
                    "seq": seq_at_start,
                    "status": updated_manifest.status,
                    "final_seq": final_seq,
                    "record": str(root_after),
                }
            )
        finally:
            self.app.registry.dequeue_turn(session_id)

    def _session_mcp(self, session_id: str) -> None:
        """UI sprint 129: POST /api/session/<id>/mcp, the MCP endpoint a harness driver calls
        (streamable HTTP, JSON responses). Each JSON-RPC message goes to the kernel's
        `handle_jsonrpc`; a `tools/call` waits while the session's running model step runs the
        tool and records it (kernel K284). A notification gets 202 and no body."""
        if self.app.registry is None or self.app.registry.get(session_id) is None:
            self._error(404, f"unknown session_id {session_id!r}")
            return
        message = self._read_json_body()
        reply = handle_jsonrpc(session_id, message)
        if reply is None:
            self._send(202, b"", "application/json")
            return
        self._json(reply)

    def _session_end(self, session_id: str) -> None:
        """Sprint 215a: POST /api/session/<id>/end. Body optional:
            {"source": "user_end"?}
        Injects `SessionEndRequested(session_id, source)` as the resume event
        via `SessionRegistry.turn_sync`. The session topology's
        `end-on-user-end` trigger (`session/__init__.py:499-509`) fires on any
        `SessionEndRequested` and routes through the `session_end` producer to
        emit `SessionEnded{reason: "user_end", total_turns: N}`;
        `finalise_on("SessionEnded")` matches; the run finalises;
        `turn_sync` transitions the manifest to `"ended"`.

        Response: `{seq, status: "ended", final_seq, record}`. 404 on unknown
        session_id; 410 on a session already ended (the `SessionEndedMidTurn`
        shape).
        """
        if self.app.registry is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        manifest = self.app.registry.get(session_id)
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

        # Sprint 225b: cascade to child sub-agents FIRST. A composite parent
        # (a session that has children via composite_of) ends each child
        # before ending itself. Per-child failure is best-effort — logged
        # and continued — so a single stuck child does not block the parent's
        # SessionEnded from landing on the record.
        # Kernel K333: delegate children nest; every descendant ends, deepest first.
        children = self.app.registry.descendants(session_id)
        for child_manifest in children:
            try:
                _interrupt_then_end(
                    self.app, child_manifest.session_id, "composite_parent_end", 30.0
                )
            except FreshSessionRequiresUserMessage:
                self.app.registry.update_status(child_manifest.session_id, SessionStatus.ENDED)
            except Exception:  # noqa: BLE001 — child cascade is best-effort; one child's failure does not block the parent.
                traceback.print_exc()

        # Pre-request tail seq (piece-B review finding 7 shape).
        seq_at_start = _tail_seq(Path(manifest.record_root))

        try:
            updated_manifest, root_after = _interrupt_then_end(self.app, session_id, source, 60.0)
        except SessionEndedMidTurn:
            self._json({"status": SessionStatus.ENDED, "error": SESSION_ENDED_MID_TURN}, 410)
            return
        except FreshSessionRequiresUserMessage:
            # Sprint 220 (piece-D dispatch): a fresh session that never opened its record cannot
            # receive a SessionEndRequested (which is not a UserMessage). Transition the manifest
            # to "ended" at the daemon layer without opening. Same shape as _shutdown_all_sessions.
            self.app.registry.update_status(session_id, SessionStatus.ENDED)
            self._json(
                {
                    "seq": seq_at_start,
                    "status": SessionStatus.ENDED,
                    "final_seq": seq_at_start,
                    "record": manifest.record_root,
                    "reason": FRESH_SESSION_NEVER_OPENED,
                }
            )
            return
        except TornRecordOnResume as exc:
            self._json(
                {"status": SessionStatus.INTERRUPTED, "error": RECORD_TORN, "detail": str(exc)}, 410
            )
            return
        except Exception as exc:  # noqa: BLE001 — the handler boundary: anything else is a 500 naming its type
            self._fault(exc)
            return
        final_seq = _tail_seq(root_after)
        self._json(
            {
                "seq": seq_at_start,
                "status": updated_manifest.status,
                "final_seq": final_seq,
                "record": str(root_after),
            }
        )

    def _session_workspace_root(self, session_id: str) -> Path | None:
        """The session's workspace as a directory, or None after sending the 404 that says why."""
        manifest = self.app.registry.get(session_id) if self.app.registry is not None else None
        if manifest is None:
            self._error(404, f"unknown session {session_id!r}")
            return None
        raw = str(manifest.workspace or "")
        if not raw:
            self._error(404, f"session {session_id!r} has no workspace")
            return None
        root = Path(_resolve_workspace_arg(raw) if raw.startswith("~") else raw)
        if not root.is_dir():
            self._error(404, f"the workspace {raw!r} does not exist")
            return None
        return root

    def _session_files_watch(self, session_id: str) -> None:
        """UI sprint 349: GET /api/session/<id>/files/watch, Server-Sent Events. The first event
        (`event: ready`) carries the file count and whether the walk was cut at WATCH_MAX_FILES; each
        later `data:` event carries `{"changes": [{path, change}]}`, change `created`, `modified` or
        `deleted`, found by comparing snapshots every WATCH_POLL_S. A comment every 15 s keeps the
        stream open; a client hanging up ends it."""
        root = self._session_workspace_root(session_id)
        if root is None:
            return
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Accel-Buffering", "no")
        self.end_headers()
        try:
            before, cut = _workspace_snapshot(root)
            sent = 0
            TRACE.emit(
                Signal.FILES_WATCH_OPENED,
                {"session_id": session_id, "files": len(before), "truncated": cut},
            )
            ready = msgspec.json.encode({"files": len(before), "truncated": cut})
            self.wfile.write(b"event: ready\ndata: " + ready + b"\n\n")
            self.wfile.flush()
            last_write = time.monotonic()
            while True:
                time.sleep(WATCH_POLL_S)
                # A client that hung up makes its socket readable with nothing to read; without this
                # check the hang-up showed only at the second write after it (TCP accepts the first).
                readable, _, _ = select.select([self.connection], [], [], 0)
                if readable and not self.connection.recv(1, socket.MSG_PEEK):
                    raise ConnectionResetError("the client closed the watch stream")
                after, _ = _workspace_snapshot(root)
                changes = _workspace_changes(before, after)
                before = after
                if changes:
                    self.wfile.write(
                        b"data: " + msgspec.json.encode({"changes": changes}) + b"\n\n"
                    )
                    self.wfile.flush()
                    sent += 1
                    last_write = time.monotonic()
                elif time.monotonic() - last_write >= 15.0:
                    self.wfile.write(b": ping\n\n")
                    self.wfile.flush()
                    last_write = time.monotonic()
        except (BrokenPipeError, ConnectionResetError, OSError):
            TRACE.emit(Signal.FILES_WATCH_CLOSED, {"session_id": session_id, "change_events": sent})
            return

    def _session_files(self, session_id: str, what: str, q: dict[str, list[str]]) -> None:
        """UI sprint 348: GET /api/session/<id>/files?dir=<rel> lists a directory of the session's
        workspace; GET /api/session/<id>/file?path=<rel> reads one file's facts and text. Each path
        is held to the workspace (`_workspace_target`)."""
        root = self._session_workspace_root(session_id)
        if root is None:
            return
        try:
            if what == "files":
                listing = _workspace_list(root, q.get("dir", [""])[0])
                TRACE.emit(
                    Signal.FILES_LISTED,
                    {"session_id": session_id, "entries": len(cast(list[Any], listing["entries"]))},
                )
                self._json(listing)
            else:
                facts = _workspace_read(root, q.get("path", [""])[0])
                encoding = (
                    FileReadEncoding.TOO_LARGE
                    if facts["too_large"]
                    else FileReadEncoding.UTF8
                    if facts["encoding"] == "utf-8"
                    else FileReadEncoding.BINARY
                )
                TRACE.emit(
                    Signal.FILE_READ,
                    {"session_id": session_id, "bytes": facts["size"], "encoding": encoding},
                )
                self._json(facts)
        except WorkspaceEscapeError as exc:
            self._error(400, str(exc))
        except (FileNotFoundError, NotADirectoryError) as exc:
            self._error(404, str(exc))

    def _session_diff(self, session_id: str, q: dict[str, list[str]]) -> None:
        """UI sprint 412: GET /api/session/<id>/diff, the workspace's changes against main
        (`_workspace_diff`), written as DIFF_READ with its base and file count. UI sprint 418:
        `?path=<rel>` reads that file's hunks (`_workspace_hunks`), DIFF_READ carrying their count."""
        root = self._session_workspace_root(session_id)
        if root is None:
            return
        rel = q.get("path", [""])[0]
        if rel:
            try:
                one = _workspace_hunks(root, rel)
            except WorkspaceEscapeError as exc:
                self._error(400, str(exc))
                return
            TRACE.emit(
                Signal.DIFF_READ,
                {"session_id": session_id, "base": one["base"], "files": 1 if one["hunks"] else 0, "hunks": len(cast(list[Any], one["hunks"]))},
            )
            self._json(one)
            return
        diff = _workspace_diff(root)
        TRACE.emit(
            Signal.DIFF_READ,
            {"session_id": session_id, "base": diff["base"], "files": len(cast(list[Any], diff["files"]))},
        )
        self._json(diff)

    def _session_search(self, session_id: str, q: dict[str, list[str]], buffers: dict[str, str] | None = None) -> None:
        """UI sprint 434: GET /api/session/<id>/search?q=<query>&regex=1&case=1, the workspace's
        matching lines (`_workspace_search`), written as FILES_SEARCHED with its counts and no query
        or path (E1). A query git grep refuses is a 400 with git's message."""
        root = self._session_workspace_root(session_id)
        if root is None:
            return
        def flag(key: str) -> bool:
            return q.get(key, ["0"])[0] == "1"

        regex, word = flag("regex"), flag("word")
        try:
            out = _workspace_search(
                root, q.get("q", [""])[0], regex=regex, case=flag("case"), word=word,
                include=q.get("include", [""])[0], exclude=q.get("exclude", [""])[0], buffers=buffers,
            )
        except SearchQueryError as exc:
            self._error(400, str(exc))
            return
        TRACE.emit(
            Signal.FILES_SEARCHED,
            {"session_id": session_id, "regex": regex, "word": word, "files": len(cast(list[Any], out["files"])), "lines": out["lines"], "matches": out["matches"], "truncated": out["truncated"], "buffers": out["buffers"], "unreadable": out["unreadable"], "names": len(cast(list[Any], out["names"]))},
        )
        self._json(out)

    def _session_files_list(self, session_id: str) -> None:
        """UI sprint 441: GET /api/session/<id>/files/list, every file of the workspace the search's walk
        reaches (`_workspace_files`: ignore files applied in or out of a git repository, VS Code's skipped
        names and folders), for quick open; written as FILES_LISTED_ALL with its counts and no path (E1)."""
        root = self._session_workspace_root(session_id)
        if root is None:
            return
        unreadable: list[str] = []
        files, truncated = _workspace_files(root, unreadable=unreadable)
        TRACE.emit(
            Signal.FILES_LISTED_ALL,
            {"session_id": session_id, "files": len(files), "truncated": truncated, "unreadable": len(unreadable)},
        )
        self._json({"files": files, "truncated": truncated, "unreadable": len(unreadable)})

    def _session_find_names(self, session_id: str, q: dict[str, list[str]]) -> None:
        """UI sprint 437: GET /api/session/<id>/files/find?q=<name>&fuzzy=1, the files and folders whose name
        matches (`_workspace_find_names`), written as FILES_FOUND with its counts and no name or path (E1)."""
        root = self._session_workspace_root(session_id)
        if root is None:
            return
        fuzzy = q.get("fuzzy", ["0"])[0] == "1"
        out = _workspace_find_names(root, q.get("q", [""])[0], fuzzy=fuzzy)
        TRACE.emit(
            Signal.FILES_FOUND,
            {"session_id": session_id, "fuzzy": fuzzy, "name_length": len(q.get("q", [""])[0]), "files": len(cast(list[Any], out["files"])), "folders": len(cast(list[Any], out["folders"])), "truncated": out["truncated"], "unreadable": out["unreadable"]},
        )
        self._json(out)

    def _session_search_replace(self, session_id: str) -> None:
        """UI sprint 435: POST /api/session/<id>/search/replace, body `{q, regex, case, word, include,
        exclude, replace, path?, line?, index?}`: the new text of each file the replace changes, and the
        hash each was read at (`_workspace_replace`). Nothing is written here; the page writes each file
        through PUT …/file, one FileWritten each, and a file changed since is refused there (409)."""
        root = self._session_workspace_root(session_id)
        if root is None:
            return
        try:
            body = self._read_json_body()
            line, index = body.get("line"), body.get("index")
            out = _workspace_replace(
                root, str(body.get("q") or ""), str(body.get("replace") or ""),
                regex=body.get("regex") is True, case=body.get("case") is True, word=body.get("word") is True,
                include=str(body.get("include") or ""), exclude=str(body.get("exclude") or ""),
                path=str(body["path"]) if body.get("path") else None,
                line=line if isinstance(line, int) else None, index=index if isinstance(index, int) else None,
                buffers=_buffers(body),
            )
        except BodyTooLarge as exc:
            self._error(413, str(exc))
            return
        except (SearchQueryError, WorkspaceEscapeError) as exc:
            self._error(400, str(exc))
            return
        except ValueError as exc:
            self._error(400, str(exc))
            return
        scope = FilesReplacePreparedScope.ONE if body.get("index") is not None else FilesReplacePreparedScope.FILE if body.get("path") else FilesReplacePreparedScope.ALL
        TRACE.emit(
            Signal.FILES_REPLACE_PREPARED,
            {"session_id": session_id, "scope": scope, "files": len(cast(list[Any], out["files"])), "replaced": out["replaced"]},
        )
        self._json(out)

    def _session_file_write(self, session_id: str, q: dict[str, list[str]]) -> None:
        """UI sprint 387: PUT /api/session/<id>/file?path=<rel>, body `{"text": str, "base_sha256":
        str?, "view": str?}`. The new text goes to a temporary file beside the target; the edit goes
        on the session's record as FileWritten (SessionRegistry.append_event, kernel K340); then the
        temporary file replaces the target. A session whose record cannot take the edit (no record
        yet, an ended session) still has its file written, off the record (`written: "off_record"`,
        seq null): the editor is an editor whether the session is on or off (the Architect,
        2026-11-09; UI sprint 427). `base_sha256`, the hash the read returned, makes a
        write to a file changed since then a 409 (optimistic concurrency, as HTTP's If-Match). A
        path outside the workspace is 400; a folder that does not exist, 404."""
        from substrate.topologies.session import FileWritten

        registry = self.app.registry
        if registry is None:
            self._error(503, "no session registry: the daemon has not started")
            return
        root = self._session_workspace_root(session_id)
        if root is None:
            return
        rel = q.get("path", [""])[0]
        try:
            body = self._read_json_body()
            text = body.get("text")
            if not isinstance(text, str):
                raise ValueError("body needs `text`, a string")
            view = str(body.get("view") or "editor")
            target = _workspace_target(root, rel)
            if not target.parent.is_dir():
                raise FileNotFoundError(f"no folder for {rel!r} in the workspace")
            if target.is_dir():
                raise WorkspaceEscapeError(f"{rel!r} is a folder")
            old_text: str | None = None
            if target.exists():
                base = body.get("base_sha256")
                if base is not None and base != _file_sha256(target):
                    raise WorkspaceConflictError(f"{rel!r} changed since it was read")
                try:
                    old_text = target.read_bytes().decode("utf-8")
                except UnicodeDecodeError:
                    raise WorkspaceConflictError(f"{rel!r} is not a UTF-8 text file") from None
            new_bytes = text.encode("utf-8")
            if len(new_bytes) > WORKSPACE_READ_MAX:
                raise WorkspaceConflictError(f"text over {WORKSPACE_READ_MAX} bytes")
            rel_path = str(target.relative_to(root.resolve(strict=True)))
            fd, tmp = tempfile.mkstemp(dir=str(target.parent), prefix=".substrate-write-")
            try:
                with os.fdopen(fd, "wb") as fh:
                    fh.write(new_bytes)
                try:
                    written = registry.append_event(
                        session_id,
                        FileWritten(path=rel_path, old_text=old_text, new_text=text, view=view),
                    )
                except api.RecordNotAtRestError:
                    # The session is off (ended, or no record yet): the file is written all the same.
                    written = {"written": "off_record", "seq": None}
                os.replace(tmp, target)
            except BaseException:
                with contextlib.suppress(FileNotFoundError):
                    os.unlink(tmp)
                raise
        except BodyTooLarge as exc:
            self._error(413, str(exc))
            return
        except WorkspaceEscapeError as exc:
            self._error(400, str(exc))
            return
        except ValueError as exc:
            self._error(409 if isinstance(exc, WorkspaceConflictError) else 400, str(exc))
            return
        except FileNotFoundError as exc:
            self._error(404, str(exc))
            return
        except TimeoutError as exc:
            self._error(503, f"the record was busy, so the file is unchanged: {exc}")
            return
        TRACE.emit(
            Signal.FILE_WRITTEN,
            {
                "session_id": session_id,
                "bytes": len(new_bytes),
                "created": old_text is None,
                "written": FileWrittenWritten(written["written"]),
                "seq": written["seq"],
            },
        )
        self._json(
            {
                "path": rel_path,
                "size": len(new_bytes),
                "sha256": hashlib.sha256(new_bytes).hexdigest(),
                "written": written["written"],
                "seq": written["seq"],
            }
        )

    def _session_tasks(self, session_id: str) -> None:
        """UI sprint 105: GET /api/session/<id>/tasks — the session's bash background tasks."""
        from substrate.topologies.tool_loop.background import TABLE as _BG

        if self.app.registry is None or self.app.registry.get(session_id) is None:
            self._error(404, f"unknown session {session_id!r}")
            return
        self._json({"tasks": [t.describe() for t in _BG.tasks_of(session_id)]})

    def _session_task_stop(self, session_id: str, task_id: str) -> None:
        """UI sprint 105: POST /api/session/<id>/tasks/<task_id>/stop — stop it from the app. The
        model hears about it at its next step (sprint 104), as Claude Code's agent moves on when the
        user stops a task from /tasks."""
        from substrate.topologies.tool_loop.background import TABLE as _BG

        if self.app.registry is None or self.app.registry.get(session_id) is None:
            self._error(404, f"unknown session {session_id!r}")
            return
        try:
            task = _BG.get(session_id, task_id)
        except KeyError:
            self._error(404, f"unknown task {task_id!r} in session {session_id!r}")
            return
        _BG.stop(task, "stopped from the app")
        self._json(task.describe())

    def _session_children(self, session_id: str) -> None:
        """UI sprint 183: GET /api/session/<id>/children — the sessions whose parent it is (a
        delegate's children, kernel K333), oldest first."""
        if self.app.registry is None or self.app.registry.get(session_id) is None:
            self._error(404, f"unknown session {session_id!r}")
            return
        children = sorted(self.app.registry.list_children(session_id), key=lambda m: m.created_at)
        self._json(
            {
                "children": [
                    {
                        "session_id": m.session_id,
                        "name": m.name,
                        "driver": m.driver,
                        "created_at": m.created_at,
                    }
                    for m in children
                ]
            }
        )

    def _session_runs(self, session_id: str) -> None:
        """UI sprint 182: GET /api/session/<id>/runs — the runs the session started (kernel K330)."""
        if self.app.registry is None or self.app.registry.get(session_id) is None:
            self._error(404, f"unknown session {session_id!r}")
            return
        self._json({"runs": run_hold.TABLE.listing(session_id)})

    def _session_run_stop(self, session_id: str, run_id: str) -> None:
        """UI sprint 182: POST /api/session/<id>/runs/<run_id>/stop — the caller stops its run from
        the app; the run's session ends `caller_stop`, and the caller's model is told at its next
        step."""
        if self.app.registry is None or self.app.registry.get(session_id) is None:
            self._error(404, f"unknown session {session_id!r}")
            return
        try:
            run_hold.TABLE.stop(session_id, run_id)
        except KeyError:
            self._error(404, f"unknown run {run_id!r} in session {session_id!r}")
            return
        self._json({"runs": run_hold.TABLE.listing(session_id)})

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
        if self.app.registry is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        manifest = self.app.registry.get(session_id)
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
        # Phase 8 item 5: `?tier=soft|hard`; default "hard" preserves
        # pre-Phase-8 behavior for callers that don't pass a tier.
        qs = parse_qs(urlparse(self.path).query)
        tier_raw = qs.get("tier", ["hard"])[0]
        if tier_raw not in ("soft", "hard"):
            self._error(400, f"tier must be 'soft' or 'hard', got {tier_raw!r}")
            return
        # Phase 8 item 9 descent-scope: an optional `?record_root=<path>`
        # routes the interrupt to a delegate CHILD's runtime rather than
        # the parent session's. The client sends this when the pane is
        # descended into a delegate — `S.descent[-1]` holds the child's
        # record_root string. Empty / absent → session scope.
        record_root_raw = qs.get("record_root", [""])[0].strip()
        record_root_arg = record_root_raw or None
        ref = self.app.registry.interrupt(session_id, tier=tier_raw, record_root=record_root_arg)
        if ref is None:
            self._json({"interrupted": False, "landed": False, "session_id": session_id})
            return
        # Poll the record for a matching ProducerCancelled envelope. Poll interval
        # 50 ms; cap at max_wait_ms. Match on the (kind, instance) pair the
        # dispatch returned; a caller who reads landed=true knows the envelope
        # naming this specific instance is on disk.
        landed = False
        if max_wait_ms > 0:
            deadline = time.monotonic() + (max_wait_ms / 1000.0)
            target_instance = str(ref.get("instance", ""))
            # Descent scope: poll the CHILD's record for the ProducerCancelled
            # or InterruptRequested envelope. Session scope: parent's record.
            record_root = Path(record_root_arg) if record_root_arg else Path(manifest.record_root)
            while time.monotonic() < deadline:
                try:
                    for env in api.read_record(record_root):
                        if env.get("kind") != api.PRODUCER_CANCELLED:
                            continue
                        producer = (env.get("payload") or {}).get("producer") or {}
                        if (
                            isinstance(producer, dict)
                            and producer.get("instance") == target_instance
                        ):
                            landed = True
                            break
                except _RECORD_IO_ERRORS:  # REVIEW-2026-08-28 Q6: narrow mid-write catch
                    pass
                if landed:
                    break
                time.sleep(0.05)
        # Phase 8 item 5: distinguish a real cancel from a soft signal.
        # ref = {"kind": "signal", "instance": "soft", ...} means the tier
        # was received while a tool was running; the model will read the
        # InterruptRequested envelope on its next turn (items 6-7).
        is_signal = isinstance(ref, dict) and ref.get("kind") == "signal"
        self._json(
            {
                "interrupted": True,
                "landed": landed or is_signal,
                "tier": tier_raw,
                "signal": is_signal,
                "producer": ref,
                "session_id": session_id,
                "scope": "descent" if record_root_arg else "session",
                "record_root": record_root_arg or "",
            }
        )

    def _session_list(self) -> None:
        """Sprint 214b: GET /api/session. Returns `{"live": [...], "parked": [...],
        "ended": [...], "interrupted": [...]}` — every manifest bucketed by status.
        The daemon's boot scan already reclassified each manifest against the
        record's own tail (sprint 211 + review finding 5 fold); this handler just
        reads the in-memory catalog.
        """
        if self.app.registry is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        self._json(_list_sessions_snapshot(self.app))

    def _session_get(self, session_id: str) -> None:
        """Sprint 035w: GET /api/session/<id>. Returns the manifest slice the
        UI needs to render header fields — session_id, name, driver, workspace,
        workspace_shape, bundle, record, created_at, status, role,
        driver_params. 404 for unknown id."""
        if self.app.registry is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        manifest = self.app.registry.get(session_id)
        if manifest is None:
            self._error(404, f"not found: /api/session/{session_id}")
            return
        self._json(
            {
                "session_id": manifest.session_id,
                "name": manifest.name,
                "driver": manifest.driver,
                "workspace": manifest.workspace,
                "workspace_shape": manifest.workspace_shape,
                "bundle": manifest.bundle,
                Control.LENGTH: manifest.length,  # kernel K296
                Control.TONE: manifest.tone,
                Control.HANDOFF: manifest.handoff,  # kernel K334
                "record": manifest.record_root,
                "created_at": manifest.created_at,
                "status": manifest.status,
                "role": manifest.role,
                "driver_params": dict(manifest.driver_params)
                if manifest.driver_params is not None
                else None,
                "tools": list(manifest.tools) if manifest.tools is not None else None,
            }
        )

    def _session_by_name(self, name: str) -> None:
        """Sprint 214b: GET /api/session/by-name/<name>. Returns `{"session_id":
        "..."}` or 404 with `{"error": "unknown name"}`. Names are case-sensitive.
        """
        if self.app.registry is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        session_id = self.app.registry.by_name(name)
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
        if self.app.registry is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        # Sprint 225b: cascade delete to child sub-agents first. Rule 12
        # preserves every record dir on disk; only manifests + by-name
        # entries drop. Per-child KeyError is a race (child dropped
        # between list_children and delete); ignore per the best-effort
        # contract.
        children = self.app.registry.descendants(session_id)  # K333: deepest first
        for child_manifest in children:
            try:
                self.app.registry.delete(child_manifest.session_id)
            except KeyError:
                pass
        try:
            self.app.registry.delete(session_id)
        except KeyError:
            self._error(404, f"unknown session_id {session_id!r}")
            return
        # Piece-B review finding 16: HTTP 204 must not carry a body; a missing
        # Content-Length on a keep-alive HTTP/1.1 connection leaves some clients
        # reading until close and stalling the pipelined session. Explicit zero.
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _record_events_by_path(self, raw_path: str, since_seq: int) -> None:
        """Phase 8 item 4: SSE stream of a record given its filesystem path.
        Descent onto a delegate child record uses this — the delegate
        machinery writes the child at
        `<delegation_root>/delegate-runs/d<depth>-c<n>/record` and the
        parent's ToolResult carries that path in `payload.child_root`.
        The shell posts the path here and streams the child's envelopes.

        Safety: resolve the path, require it exists as a directory, and
        require it live under one of a known set of roots so a client
        cannot read arbitrary files off disk. Allowed roots: _runs_dir(),
        `~/.substrate/sessions`, `/tmp`, `/var/folders` (macOS temp
        parents that hold delegate-runs in tests).
        """
        from pathlib import Path as _Path

        try:
            resolved = _Path(raw_path).resolve()
        except (OSError, RuntimeError) as exc:
            self._error(400, f"path could not be resolved: {exc}")
            return
        if not resolved.exists() or not resolved.is_dir():
            self._error(404, f"no record directory at {raw_path!r}")
            return
        allowed_roots = [
            _runs_dir().resolve(),
            (api.substrate_home() / "sessions").resolve(),
        ]
        ok = False
        for root in allowed_roots:
            try:
                resolved.relative_to(root)
                ok = True
                break
            except ValueError:
                continue
        if not ok:
            self._error(403, f"path {raw_path!r} outside allowed record roots")
            return
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Accel-Buffering", "no")
        self.end_headers()
        try:
            # Sprint 095: the kernel redeems blob Claim Checks (substrate.api, F-API-6).
            follower = api.attach(resolved, resolve_blobs=True)
            finalised = False
            while not finalised:
                for env in follower.read_new():
                    seq = int(env.get("seq", -1))
                    is_final = env.get("kind") == api.RUN_FINALISED
                    if is_final:
                        finalised = True
                    if seq <= since_seq and not is_final:
                        continue
                    frame = b"data: " + msgspec.json.encode(env) + b"\n\n"
                    self.wfile.write(frame)
                    self.wfile.flush()
                if finalised:
                    break
                time.sleep(0.1)
        except (OSError, BrokenPipeError):
            return

    def _session_language(self, session_id: str) -> None:
        """UI sprint 168: GET /api/session/<id>/language. The kernel's language view of the
        session's record (`app.language_view`: lines, lanes, shifts, changes), cached until the
        record grows. A session with no record yet answers an empty view."""
        if self.app.registry is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        manifest = self.app.registry.get(session_id)
        if manifest is None:
            self._error(404, f"unknown session_id {session_id!r}")
            return
        record_root = Path(manifest.record_root)
        size = (
            sum(f.stat().st_size for f in record_root.glob("*") if f.is_file())
            if record_root.is_dir()
            else -1
        )
        cached = self.app.language_cache.get(session_id)
        if cached is not None and cached[0] == size:
            self._json(cached[1])
            return
        if size < 0:
            view: dict[str, Any] = {
                "lines": [],
                "lanes": {},
                "shifts": [],
                "changes": [],
                "last_seq": -1,
            }
        else:
            view = language_view(record_root)
        self.app.language_cache[session_id] = (size, view)
        self._json(view)

    def _session_events(self, session_id: str, since_seq: int) -> None:
        """Sprint 214c: GET /api/session/<id>/events?since_seq=N. Server-Sent
        Events stream of the session's record. Each envelope arrives as
        `data: <json>\\n\\n`. The stream stays open across turn pauses — the
        session record keeps growing as `Runtime.resume` fires — and closes,
        after an `end` event, when the record's last frame is a
        `substrate.RunFinalised`, OR when the client disconnects.

        Filtering by `since_seq` lets a reconnecting client resume from a known
        cursor without re-reading the whole record. Default `since_seq=-1`
        means "from the start."

        Runs in the thread the ThreadingHTTPServer dispatched for this GET;
        blocking `api.attach(record_root).read_new()` polls the record filesystem
        directly. Broken pipe (`OSError` on `self.wfile.write`) terminates the
        loop cleanly — the SSE contract lets either side hang up.
        """
        if self.app.registry is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        manifest = self.app.registry.get(session_id)
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
            follower = api.attach(record_root, resolve_blobs=True)  # Sprint 095
            # Emit backlog first (frames already on the record past since_seq),
            # then poll for new growth. The follower keeps its own segment
            # cursors so we never re-emit frames as we cross segment rolls.
            last_write = time.monotonic()
            while True:
                batch = follower.read_new()
                for env in batch:
                    if int(env.get("seq", -1)) <= since_seq:
                        continue
                    frame = b"data: " + msgspec.json.encode(env) + b"\n\n"
                    self.wfile.write(frame)
                    self.wfile.flush()
                    last_write = time.monotonic()
                # The stream ends when the record ends: its last frame is a RunFinalised past the
                # client's cursor. Ended sessions are resumable (turn_sync flips ended -> parked
                # and the run continues on the same record), so a resumed session's record holds
                # one RunFinalised per earlier end, each followed by more turns. Closing at the
                # first of them cut a reattaching client off from everything after it: its reply
                # arrived only when the next typed line reopened the stream (2026-10-08). A
                # RunFinalised at or before since_seq is history too: a client that reattaches
                # past it to follow a resumed turn stays open, with the 15 s keep-alive, until it
                # hangs up. The `end` event tells the client the close is final, so its
                # EventSource does not reconnect.
                last = batch[-1] if batch else None
                if (
                    last is not None
                    and last.get("kind") == api.RUN_FINALISED
                    and int(last.get("seq", -1)) > since_seq
                ):
                    self.wfile.write(b"event: end\ndata: end\n\n")
                    self.wfile.flush()
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
        Reads the manifest from `app.applications`; resolves `<role>_model`
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
        spec = self.app.applications.get(application_name)
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
        # Sprint 115: the folder a CLI role runs in. Without one it ran in the server's
        # directory (the kernel repo or the app bundle) and read that as its project.
        folder = Path(tempfile.mkdtemp(prefix=f"substrate-{application_name}-"))
        try:
            topology_factory = builder(self.app, resolved, folder)
        except Exception as exc:  # noqa: BLE001 — application builder can raise anything a topology constructor does; malformed inputs → 400 naming the class.
            shutil.rmtree(folder, ignore_errors=True)
            self._error(400, api.describe_error(exc))
            return

        run_id = f"s_topo_{uuid.uuid4().hex[:20]}"
        # `<run_id>.record`, like every run under runs/: listed by /api/records, served by name,
        # pruned by /api/runs/clear (lens audit F295: the bare dir was none of these, and 389 of
        # them piled up in a real home).
        record_root = _runs_dir() / f"{run_id}.record"
        record_root.mkdir(parents=True, exist_ok=True)
        _forget_finished_topology_runs(self.app)
        await_completion = body.get("await_completion", True)
        started_at = time.time()

        if await_completion:
            try:
                result = asyncio.run(
                    api.Runtime(record_root).run(topology_factory, name=application_name)
                )
            except Exception as exc:  # noqa: BLE001 — topology run boundary: any Producer/View failure surfaces as HTTP 500 with the class name.
                self._fault(exc)
                return
            finally:
                shutil.rmtree(folder, ignore_errors=True)
            final_seq = _tail_seq(record_root)
            self._json(
                {
                    "run_id": run_id,
                    "record_root": str(record_root),
                    # The run's own outcome: a paused or failed run said "finalised" before
                    # (lens audit F296).
                    "status": result.status,
                    "final_seq": final_seq,
                    "application": application_name,
                }
            )
            return

        # Background thread — sprint 225d polls the record.
        run_handle: dict[str, Any] = {}

        def _run_background() -> None:
            try:
                result = asyncio.run(
                    api.Runtime(record_root).run(topology_factory, name=application_name)
                )
                run_handle["result_status"] = result.status
            except Exception as exc:  # noqa: BLE001 — background worker; kept for the status poll
                traceback.print_exc()
                TRACE.emit(
                    Signal.RUN_FAULTED,
                    {
                        "run_id": run_id,
                        "error_type": type(exc).__name__,
                        "where": _fault_where(exc),
                    },
                )
                # UI sprint 102: a run that raised left no RunFinalised, and the status poll
                # read "running" forever. The error is kept for it to report.
                run_handle["error"] = api.describe_error(exc)
            finally:
                shutil.rmtree(folder, ignore_errors=True)

        thread = threading.Thread(target=_run_background, daemon=True)
        run_handle.update(
            {
                "record_root": record_root,
                "thread": thread,
                "started_at": started_at,
                "application": application_name,
            }
        )
        self.app.topology_runs[run_id] = run_handle
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
        handle = self.app.topology_runs.get(run_id)
        if handle is None:
            self._error(
                404,
                f"unknown run_id {run_id!r} (started via await_completion=false?)",
            )
            return
        record_root = Path(handle["record_root"])
        elapsed_seconds = time.time() - float(handle["started_at"])
        status = "running"
        ended = False  # the record shows how the run ended (finalised, or torn = failed)
        output: Any = None
        if record_root.exists():
            try:
                envelopes = list(
                    api.read_record(record_root, resolve_blobs=True)
                )  # Sprint 095: output is returned
            except Exception:  # noqa: BLE001 — read_record already skips a half-written last frame; what raises here is a gap or a CRC failure, so the run is failed (lens audit F297: this comment said "treat as running").
                envelopes = []
                status = api.RunStatus.FAILED
                ended = True
            else:
                if envelopes and envelopes[-1].get("kind") == api.RUN_FINALISED:
                    status = api.RunStatus.FINALISED
                    ended = True
                    # Extract the application terminal envelope's payload as `output`
                    # (Solved / Verdict / Synthesis). One tail scan; nothing exotic.
                    for env in reversed(envelopes):
                        kind = str(env.get("kind", ""))
                        if kind.startswith("substrate."):
                            continue
                        output = env.get("payload")
                        break
        # UI sprint 102: the worker thread ended and the record never finalised (or never
        # appeared): the run failed. Before, this read "running" forever.
        thread = handle.get("thread")
        if not ended and thread is not None and not thread.is_alive():
            if (
                "result_status" in handle
            ):  # it returned: paused, finalised or failed, as the run says
                status = str(handle["result_status"])
            else:
                status = api.RunStatus.FAILED
                output = {
                    "error": handle.get("error", "the run ended without finalising its record")
                }
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
            builder_manifest, reviewer_manifest = builder(self.app.registry, resolved)
        except Exception as exc:  # noqa: BLE001 — composite builder can raise anything a topology constructor does; malformed inputs → 400 naming the class.
            self._error(400, api.describe_error(exc))
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
          - model: `deterministic` (default), `ollama` (with `name`), or a KNOWN_CLI_ADAPTERS key.
          - name: the Ollama model tag; required when model=ollama (400 without it).
          - workspace: caller-supplied path (like the old shape).

        Response: `{record, session_id, ok: true}`. The pre-bridge `legacy=true` shape, which
        ran a launch thread and could run a request-named argv, was deleted on 2026-10-08.
        """
        if self.app.registry is None:
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
            driver = q.get("name", [""])[0]
            if not driver:
                # The bridge had its own default tag (llama3.2:1b), a third model default beside
                # `_agent_models`' preference list and the manifests' (lens audit F306).
                self._error(400, "model=ollama needs name=<ollama tag>")
                return
        elif model == "deterministic" or model in KNOWN_CLI_ADAPTERS:
            driver = model
        else:
            # Any other value used to run the deterministic stub without a word, so a request for
            # a real adapter missing from a hand list (codex, cursor-agent) got canned replies
            # (lens audit F298).
            choices = ", ".join(["deterministic", "ollama", *sorted(KNOWN_CLI_ADAPTERS)])
            self._error(400, f"unknown model {model!r}; one of: {choices}")
            return

        # Find-or-create by name. A collision-free session name means create;
        # a hit means resume.
        session_id: str | None = None
        if session_name:
            session_id = self.app.registry.by_name(session_name)

        if session_id is None:
            session_id = f"s_{uuid.uuid4().hex[:24]}"
            workspace = (
                str(Path(ws_arg).expanduser().resolve())
                if ws_arg and Path(ws_arg).expanduser().is_absolute()
                else str(_sessions_base() / (session_name or f"adhoc-{uuid.uuid4().hex[:8]}"))
            )
            Path(workspace).mkdir(parents=True, exist_ok=True)
            try:
                self.app.registry.create(
                    session_id=session_id,
                    name=session_name or None,
                    driver=driver,
                    workspace=workspace,
                    workspace_shape="flat",
                    bundle=None,
                    seed="",
                )
                TRACE.emit(
                    Signal.SESSION_CREATED,
                    {
                        "session_id": session_id,
                        "driver": str(driver),
                        "workspace_shape": SessionCreatedWorkspaceShape.FLAT,
                    },
                )
            except NameCollision as exc:
                # Race: another caller with the same name won. Reuse theirs.
                session_id = exc.existing_session_id

        # Route the task as a UserMessage through turn_sync — same seam
        # /api/session/<id>/turn uses. Per-session threading.Lock serializes.
        from substrate.topologies.session import UserMessage as SessionUserMessage

        def _build(_manifest: Any, _record_root: Path) -> Any:
            next_turn_index = cast(SessionRegistry, self.app.registry).next_turn_index(session_id)
            # The turn is handed to the kernel now, under the session's lock (TURN_ACCEPTED).
            TRACE.emit(
                Signal.TURN_ACCEPTED,
                {"session_id": session_id, "turn_index": next_turn_index, "attachments": 0},
            )
            return SessionUserMessage(
                text=task,
                turn_index=next_turn_index,
                assembled_prompt="",  # K261: per_turn reaches the prompt once, from the builder
                slash_source="daemon",
            )

        try:
            updated_manifest, root_after = self.app.registry.turn_sync(
                session_id, resume_event_builder=_build
            )
        except SessionEndedMidTurn:
            self._json(
                {"ok": False, "status": SessionStatus.ENDED, "error": SESSION_ENDED_MID_TURN},
                410,
            )
            return
        except Exception as exc:  # noqa: BLE001 — bridge surfaces the class + text
            self._fault(exc)
            return

        self._json(
            {
                "ok": True,
                "session_id": updated_manifest.session_id,
                "record": str(root_after),
                "status": updated_manifest.status,
            }
        )

    def _session_patch(self, session_id: str) -> None:
        """PATCH /api/session/<id>. The body may carry any of `driver`, `name`, `tools`,
        `per_turn`, `bundle` and `driver_params`; an absent key leaves that field alone. Returns
        the updated manifest shape.

        `workspace`, `workspace_shape` and `seed` are fixed at create: a body carrying one gets
        400 naming it. Any other key gets 400 as unknown.
        """
        if self.app.registry is None:
            self._error(503, "session registry not initialized (boot ordering)")
            return
        manifest = self.app.registry.get(session_id)
        if manifest is None:
            self._error(404, f"unknown session_id {session_id!r}")
            return
        try:
            body = self._read_json_body()
        except ValueError as exc:
            self._error(400, str(exc))
            return
        _PATCHABLE = {
            "driver",
            "name",
            "tools",
            "per_turn",
            "bundle",
            "guidance",  # UI sprint 161: a level, set as its bundle (vocabulary § U)
            "driver_params",
            *Control,
        }
        _NOT_YET = {"workspace", "workspace_shape", "seed"}
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
            updated = self.app.registry.set_driver(session_id, driver)
        if "name" in body:
            new_name = body["name"]
            if not isinstance(new_name, str) or not new_name:
                self._error(400, "name must be a non-empty string")
                return
            try:
                updated = self.app.registry.set_name(session_id, new_name)
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
            updated = self.app.registry.set_tools(session_id, tools_value)
        if "per_turn" in body:
            per_turn_raw = body["per_turn"]
            if per_turn_raw is None:
                per_turn_value = ""
            elif isinstance(per_turn_raw, str):
                per_turn_value = per_turn_raw
            else:
                self._error(
                    400, f"per_turn must be a string or null; got {type(per_turn_raw).__name__}"
                )
                return
            updated = self.app.registry.set_per_turn(session_id, per_turn_value)
        if "bundle" in body:
            # Sprint 032b: mid-session bundle PATCH. null clears; a string is
            # validated by `SessionRegistry.set_bundle` (loads via load_bundle
            # to catch a typo before it lands in the manifest). Effect is
            # seen at the next turn's UserMessage.assembled_prompt.
            bundle_raw = body["bundle"]
            if bundle_raw is not None and not isinstance(bundle_raw, str):
                self._error(
                    400, f"bundle must be a string or null; got {type(bundle_raw).__name__}"
                )
                return
            bundle_value = str(bundle_raw) if bundle_raw else None
            try:
                updated = self.app.registry.set_bundle(session_id, bundle_value)
            except api.BundleNotFoundError as exc:
                self._error(400, f"unknown bundle {bundle_value!r}: {exc}")
                return
            except ValueError as exc:  # a name that is not one path component (substrate.naming)
                self._error(400, str(exc))
                return
        if "guidance" in body:
            # UI sprint 161 (vocabulary § U): a guidance level is its bundle. `auto` is the model's
            # default level, resolved as at open; the bundle path records SessionChanged and
            # writes the level's text again at the next turn.
            level_raw = body["guidance"]
            if not isinstance(level_raw, str) or not level_raw:
                self._error(400, f"guidance must be a level name; got {level_raw!r}")
                return
            try:
                level = (
                    guidance_level(_model_class(updated.driver))
                    if level_raw == "auto"
                    else level_raw
                )
                updated = self.app.registry.set_bundle(session_id, guidance_bundle(level))
            except ValueError:
                levels = ", ".join(["auto", *(str(lv) for lv in GuidanceLevel)])
                self._error(400, f"unknown guidance level {level_raw!r}; one of {levels}")
                return
        if any(control in body for control in Control):
            # Kernel K296: either control; null returns it to the default. The next turn records
            # SessionChanged and writes the `control` text again (vocabulary § T.3).
            values: dict[str, str | None] = {
                Control.LENGTH: updated.length,
                Control.TONE: updated.tone,
                Control.HANDOFF: updated.handoff,
            }
            for control in Control:
                if control in body:
                    raw = body[control]
                    if raw is not None and not isinstance(raw, str):
                        self._error(
                            400, f"{control} must be a string or null; got {type(raw).__name__}"
                        )
                        return
                    values[control] = raw or None
            try:
                updated = self.app.registry.set_controls(
                    session_id,
                    length=values[Control.LENGTH],
                    tone=values[Control.TONE],
                    handoff=values[Control.HANDOFF],
                )
            except ValueError as exc:
                self._error(400, str(exc))
                return
        if "driver_params" in body:
            # Sprint 032c (piece G mechanical translation): per-session
            # driver params (think/max_tokens/timeout/num_ctx). null clears
            # every override. Validated by SessionRegistry.set_driver_params
            # (unknown key / wrong type → ValueError → 400).
            params_raw = body["driver_params"]
            if params_raw is not None and not isinstance(params_raw, dict):
                self._error(
                    400,
                    f"driver_params must be an object or null; got {type(params_raw).__name__}",
                )
                return
            params_value: dict[str, Any] | None = dict(params_raw) if params_raw else None
            refusal = _cache_layout_refusal(updated.driver, params_value)
            if refusal:
                self._error(400, refusal)
                return
            try:
                updated = self.app.registry.set_driver_params(session_id, params_value)
            except ValueError as exc:
                self._error(400, f"driver_params: {exc}")
                return
        self._json(
            {
                "session_id": updated.session_id,
                "name": updated.name,
                "driver": updated.driver,
                "workspace": updated.workspace,
                "workspace_shape": updated.workspace_shape,
                "bundle": updated.bundle,
                Control.LENGTH: updated.length,  # kernel K296
                Control.TONE: updated.tone,
                Control.HANDOFF: updated.handoff,  # kernel K334
                "driver_params": dict(updated.driver_params)
                if updated.driver_params is not None
                else None,
                "record": updated.record_root,
                "status": updated.status,
            }
        )

    def do_PATCH(self) -> None:  # noqa: N802 — sprint 215c: PATCH /api/session/<id>
        if self._refuse_foreign_host():
            return
        path = unquote(urlparse(self.path).path)
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
            self._fault(exc)

    def do_PUT(self) -> None:  # noqa: N802 — UI sprint 387: PUT /api/session/<id>/file
        if self._refuse_foreign_host():
            return
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        try:
            m = re.fullmatch(r"/api/session/([^/]+)/file", path)
            if m:
                self._session_file_write(m.group(1), parse_qs(parsed.query))
                return
            self._error(404, f"no put endpoint {path!r}")
        except Exception as exc:  # noqa: BLE001 — top-level do_PUT boundary: same shape as do_POST / do_PATCH.
            self._fault(exc)

    def do_DELETE(self) -> None:  # noqa: N802 — sprint 214b: DELETE /api/session/<id>
        if self._refuse_foreign_host():
            return
        path = unquote(urlparse(self.path).path)
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
            self._fault(exc)

    def do_GET(self) -> None:  # noqa: N802
        if self._refuse_foreign_host():
            return
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
                # `app.applications` dict; the load fires at main().
                self._json(
                    [_application_spec_to_wire(spec) for spec in self.app.applications.values()]
                )
                return
            if path.startswith("/api/topology/") and path.endswith("/status"):
                # Sprint 225d — GET /api/topology/<name>/status?run_id=<id>.
                # Piggybacks on app.topology_runs (populated by 225a's
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
            if path.startswith("/api/session/") and "/" not in path[len("/api/session/") :]:
                self._session_get(path[len("/api/session/") :])
                return
            m_language = re.fullmatch(r"/api/session/([^/]+)/language", path)
            if m_language:  # UI sprint 168
                self._session_language(m_language.group(1))
                return
            m_children = re.fullmatch(r"/api/session/([^/]+)/children", path)
            if m_children:  # UI sprint 183
                self._session_children(m_children.group(1))
                return
            m_runs = re.fullmatch(r"/api/session/([^/]+)/runs", path)
            if m_runs:  # UI sprint 182
                self._session_runs(m_runs.group(1))
                return
            m_watch = re.fullmatch(r"/api/session/([^/]+)/files/watch", path)
            if m_watch:  # UI sprint 349, editor shared work 0(c)
                self._session_files_watch(m_watch.group(1))
                return
            m_diff = re.fullmatch(r"/api/session/([^/]+)/diff", path)
            if m_diff:  # UI sprint 412: the workspace's changes against main
                self._session_diff(m_diff.group(1), parse_qs(urlparse(self.path).query))
                return
            m_all = re.fullmatch(r"/api/session/([^/]+)/files/list", path)
            if m_all:  # UI sprint 441: quick open's file list
                self._session_files_list(m_all.group(1))
                return
            m_find = re.fullmatch(r"/api/session/([^/]+)/files/find", path)
            if m_find:  # UI sprint 437: the tree's find by name
                self._session_find_names(m_find.group(1), parse_qs(urlparse(self.path).query))
                return
            m_search = re.fullmatch(r"/api/session/([^/]+)/search", path)
            if m_search:  # UI sprint 434: the workspace search (frame 24j)
                self._session_search(m_search.group(1), parse_qs(urlparse(self.path).query))
                return
            m_files = re.fullmatch(r"/api/session/([^/]+)/(files|file)", path)
            if m_files:  # UI sprint 348, editor shared work 0(c)
                self._session_files(
                    m_files.group(1), m_files.group(2), parse_qs(urlparse(self.path).query)
                )
                return
            m_tasks = re.fullmatch(r"/api/session/([^/]+)/tasks", path)
            if m_tasks:  # UI sprint 105
                self._session_tasks(m_tasks.group(1))
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
                # Sprint 034a: optional ?exclude_sessions=true filter.
                q = parse_qs(urlparse(self.path).query)
                exclude = (q.get("exclude_sessions", ["false"])[0] or "false").lower() in (
                    "1",
                    "true",
                    "yes",
                )
                self._json(_records_index(self.app, exclude_sessions=exclude))
                return
            if path == "/api/records/by-path/events":
                # Phase 8 item 4: SSE stream of an arbitrary record path so
                # the shell can descend into a delegate child record whose
                # root came from a ToolResult(tool='delegate').payload.child_root.
                # Path safety: resolve, require it exists, refuse traversal
                # into anything outside the user's substrate tree
                # (~/.substrate, _runs_dir(), TMP delegate-runs).
                q = parse_qs(urlparse(self.path).query)
                raw_path = q.get("path", [""])[0]
                if not raw_path:
                    self._error(400, "path query param required")
                    return
                raw_since = q.get("since_seq", ["-1"])[0]
                try:
                    since_seq = int(raw_since)
                except ValueError:
                    self._error(400, f"since_seq must be an integer, got {raw_since!r}")
                    return
                self._record_events_by_path(raw_path, since_seq)
                return
            if path == "/api/bundles":
                # Sprint 034a: bundle catalog for the rail's four-bucket read
                # (034b) and the terminal-view create-time picker (035w).
                self._json(_bundles_index())
                return
            if path == "/api/models":
                self._json(_agent_models(self.app))
                return
            # Sprint 085a — CLI auth read endpoints.
            if path.startswith("/api/cli/") and path.endswith("/status"):
                cli_name = path[len("/api/cli/") : -len("/status")]
                self._json(_cli_status(cli_name))
                return
            if path.startswith("/api/cli/") and "/pty/stream/" in path:
                head, _, sid = path.rpartition("/pty/stream/")
                cli_name = head[len("/api/cli/") :]
                self._cli_pty_stream_endpoint(cli_name, sid)
                return
            if path == "/api/workspaces":
                # Phase-4 addition: read-only listing of workspace paths a
                # UI can offer as a picker default. Falls back to distinct
                # workspace fields across live sessions when there is no
                # ~/.substrate/recent-workspaces.json.
                self._json(_recent_workspaces(self.app))
                return
            # Sprint 086 — paginated per-workspace session listing.
            # `?path=<workspace>&offset=<n>&limit=<m>` returns the newest
            # `limit` sessions (default 50) whose workspace path matches
            # exactly, starting at `offset`. Sort key is created_at desc.
            # Response: {rows: [...], total: <n>}. Records surface uses
            # this to render a scrollable per-workspace list without the
            # legacy 8-item cap.
            if path == "/api/sessions/by-workspace":
                q = parse_qs(urlparse(self.path).query)
                target = (q.get("path", [""])[0] or "").strip()
                if not target:
                    self._error(400, "path=<workspace> required")
                    return
                try:
                    offset = max(0, int(q.get("offset", ["0"])[0]))
                    limit = max(1, min(500, int(q.get("limit", ["50"])[0])))
                except ValueError:
                    self._error(400, "offset and limit must be integers")
                    return
                target_c = _canonical_workspace(target)
                sessions_root_c = _canonical_workspace(_sessions_dir_root())
                snap = _list_sessions_snapshot(self.app)
                merged: list[dict[str, Any]] = []
                for bucket_name in ("live", "parked", "interrupted", "ended"):
                    for row in snap.get(bucket_name, []):
                        if not isinstance(row, dict):
                            continue
                        ws = row.get("workspace")
                        if not isinstance(ws, str):
                            continue
                        ws_c = _canonical_workspace(ws)
                        # Per-session sandbox root collapses every
                        # <root>/<id>/workspace under one query target.
                        matches = ws_c == target_c or (
                            target_c == sessions_root_c and _is_per_session_sandbox(ws_c)
                        )
                        if matches:
                            merged.append({**row, "workspace": ws_c, "status": bucket_name})
                merged.sort(key=lambda r: r.get("created_at") or 0, reverse=True)
                total = len(merged)
                page = merged[offset : offset + limit]
                self._json({"rows": page, "total": total, "offset": offset, "limit": limit})
                return
            if path == "/api/worktree_diff":  # what the agent changed in a session worktree
                wt = parse_qs(urlparse(self.path).query).get("path", [""])[0]
                try:
                    self._json(_worktree_diff(Path(wt)))
                except Exception as exc:  # noqa: BLE001 — not a worktree / git issue -> typed error
                    self._json({"error": api.describe_error(exc), "diff": "", "files": []})
                return
            if path == "/api/assays":
                self._json(_assays_index())
                return
            if path.startswith("/api/assay/"):
                res = _assay_report(self.app, unquote(path[len("/api/assay/") :]))
                self._json(res, 404 if "error" in res else 200)
                return
            if path == "/api/diff":
                self._diff(parse_qs(urlparse(self.path).query))
                return
            if (
                path == "/api/resolve_child"
            ):  # W2.2: a delegate ToolResult's child_root -> served name
                cp = parse_qs(urlparse(self.path).query).get("path", [""])[0]
                self._json({"name": _resolve_child_name(cp)})
                return
            if path.startswith("/api/records/"):
                self._api_record(path[len("/api/records/") :])
                return
            self._static(path)
        except Exception as exc:  # noqa: BLE001 - surface any read error as JSON, never a crash
            # do NOT leak a full traceback (absolute paths, internals) in the response body; the
            # typed name + message is enough for the client. Log the traceback server-side instead.
            traceback.print_exc()
            self._fault(exc)

    def _api_record(self, rest: str) -> None:
        parts = rest.split("/")
        name = parts[0]
        record = _record_path(name)
        if record is None:
            self._error(404, f"no record {name!r}")
            return
        events = list(
            api.read_record(record, resolve_blobs=True)
        )  # Sprint 095: the inspector shows payloads
        if len(parts) == 1:  # the whole run: events + the manifest + the run-level status
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
                self.app, name
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
        # Phase 6 closed 2026-09-22: `/` serves the reveal shell, the
        # only shell. The classic sprint-051 tree moved to
        # `_deprecated/classic-tree/` — its source is intact, mineable,
        # and re-instatable, but not routed. Every other asset path
        # falls through to _static_root unchanged.
        if path in ("", "/"):
            self._static_root(WEB, "/reveal.html")
            return
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
        self._send(200, target.read_bytes(), _CT.get(target.suffix, "application/octet-stream"))


def main() -> None:
    global HOST, PORT
    # UI sprint 177: this interpreter found its home at startup; the processes the server starts (a
    # session's bash, a run's checks, a CLI driver) get the user's environment, not the bundle's.
    release_python_home()
    _install_fault_hooks()
    # Sprint 079: --port / --host CLI flags. --port 0 binds an
    # ephemeral port; the readback line printed before serve_forever
    # is what Electron (electron/main.ts) matches to learn the bound
    # port. The default is the module-level HOST/PORT.
    import argparse

    parser = argparse.ArgumentParser(description="substrate-ui HTTP server")
    parser.add_argument("--host", default=HOST, help="bind host (default: %(default)s)")
    parser.add_argument(
        "--port", type=int, default=PORT, help="bind port; 0 = ephemeral (default: %(default)s)"
    )
    args = parser.parse_args()
    HOST = args.host
    PORT = args.port
    # WEB is served static from the bundle in packaged mode; the .app is
    # read-only. This mkdir is a no-op when `web/dist/` already exists
    # (the normal case, since electron-builder unpacks it), and would
    # EPERM otherwise. Guard so a stale build doesn't crash boot.
    try:
        WEB.mkdir(exist_ok=True)
    except OSError:
        pass
    # Sprint 211: boot-scan the on-disk session catalog. Rebuilds the in-memory
    # SessionRegistry from ~/.substrate/sessions/*/manifest.json, checking every
    # record's true status (hot segment → interrupted; RunFinalised → ended;
    # otherwise → parked) and rewriting manifests whose stored status disagrees.
    cfg = _load_daemon_config()
    # The composition root: the one App every handler on both listeners reads.
    app = App()
    registry = app.install_registry(
        turn_queue_cap=int(cfg["turn_queue_cap"]),
        # The scan runs once, on the background thread below. The constructor's default scan ran
        # it a first time on this thread, so the port readback still waited on it (F319).
        auto_boot=False,
    )
    # Sprint 223 — application catalog boot-scan. Scans
    # `substrate/topologies/applications/*.manifest.toml` and loads what
    # parses. `on_error="skip"` per §7.6: a fresh install has zero
    # manifests; a malformed one is logged and skipped so one bad file
    # does not kill the daemon. Served by `GET /api/applications`.
    from substrate.topologies.applications.registry import load_manifests

    app.applications = load_manifests(on_error="skip")
    # Sprint 087b — session boot-scan runs in the background. On this
    # box the scan walks ~4k session dirs and re-derives status for each
    # by tailing the record log; that blocked the port readback for
    # 5–15 s and kept Electron from ever painting. The scan publishes each
    # session under the registry's manifest lock as a compare-and-set, so a
    # request landing mid-scan sees the sessions published so far and a
    # session it changes is never overwritten by the scan (F319).
    # /api/session returns a partial list until the scan completes; the
    # client's Records view reloads on demand.
    summary = (
        f"substrate-ui read-API server on http://{HOST}:{PORT}  "
        f"(records: {', '.join(bundled.names())}; sessions: scanning in background)"
    )

    def _run_boot_scan() -> None:
        started = time.monotonic()
        skipped = registry.boot_scan()
        manifests = registry.list_all()
        elapsed = time.monotonic() - started
        note = (
            f"boot_scan: {len(manifests)} manifest(s) in {elapsed:.2f}s — "
            f"{sum(1 for m in manifests if m.status == SessionStatus.PARKED)} parked, "
            f"{sum(1 for m in manifests if m.status == SessionStatus.INTERRUPTED)} interrupted, "
            f"{sum(1 for m in manifests if m.status == SessionStatus.ENDED)} ended"
        )
        if skipped:
            note += f"; SKIPPED {len(skipped)} unparseable manifest(s): {', '.join(skipped[:5])}"
            if len(skipped) > 5:
                note += f" ... (+{len(skipped) - 5} more)"
        print(note, flush=True)
        TRACE.emit(
            Signal.STORE_SCANNED,
            {
                "sessions_found": len(manifests),
                "parked": sum(1 for m in manifests if m.status == SessionStatus.PARKED),
                "interrupted": sum(1 for m in manifests if m.status == SessionStatus.INTERRUPTED),
                "ended": sum(1 for m in manifests if m.status == SessionStatus.ENDED),
                "skipped": len(skipped),
                "duration_ms": int(elapsed * 1000),
            },
        )

    # Sprint 217e: bind a UDS listener alongside the TCP one. TECH-SPEC §6
    # names `~/.substrate/daemon.sock` as the primary transport, with TCP as
    # fallback. Both sockets share the same `Handler`; the CLI tries UDS first.
    # The UDS path is fixed at `~/.substrate/daemon.sock` unless
    # `SUBSTRATE_DAEMON_SOCK` overrides it (tests pass a tmp path).
    uds_path = Path(
        os.environ.get("SUBSTRATE_DAEMON_SOCK", str(api.substrate_home() / "daemon.sock"))
    )
    uds_path.parent.mkdir(parents=True, exist_ok=True)
    # Stale socket file from a crashed prior daemon: unlink so bind can succeed.
    try:
        uds_path.unlink()
    except FileNotFoundError:
        pass
    # UI sprint 106: a Unix socket path is limited to sizeof(sun_path) bytes (104 on macOS,
    # 108 on Linux; unix(4)/unix(7)). A long SUBSTRATE_HOME made the bind raise
    # `OSError: AF_UNIX path too long` and the daemon died before serving. The socket is the
    # CLI's preferred transport, not the only one: without it the daemon still serves TCP.
    uds_srv: _UnixHTTPServer | None
    try:
        uds_srv = _UnixHTTPServer(str(uds_path), app)
        summary += f"; UDS at {uds_path}"
    except OSError as exc:
        uds_srv = None
        summary += f"; UDS unavailable ({exc}; {len(str(uds_path))}-byte path), TCP only"
    srv = AppHTTPServer((HOST, PORT), app)
    # Sprint 079: bound-port readback for the Electron main process.
    # ThreadingHTTPServer((HOST, 0), ...) picks an ephemeral port; the
    # actual bound value lives on srv.server_address. Print it as the
    # first stdout line, flushed, so electron/main.ts can match
    # /^substrate-ui port=(\d+)$/ deterministically before any other
    # output. PORT is refreshed too so the summary line below prints
    # the real value.
    PORT = srv.server_address[1]
    print(f"substrate-ui port={PORT}", flush=True)
    summary = summary.replace(f"http://{HOST}:{args.port}", f"http://{HOST}:{PORT}", 1)
    print(summary)
    # v0.8 S1: the server's first record, written before either listener serves; the store's
    # counts follow in STORE_SCANNED when the background scan ends.
    TRACE.emit(Signal.SERVER_STARTED, {"port": PORT})
    TRACE.emit(Signal.TRACE_OPENED, {"process": TraceOpenedProcess.SERVER})
    if uds_srv is not None:
        threading.Thread(target=uds_srv.serve_forever, daemon=True).start()
    threading.Thread(target=_run_boot_scan, daemon=True, name="boot_scan").start()

    def _say(msg: str) -> None:
        # stdout is a pipe to Electron. Once Electron is gone, print()
        # raises BrokenPipeError; shutdown must not die on its own log line.
        try:
            print(msg, flush=True)
        except OSError:
            pass

    def _shutdown_sequence() -> None:
        """End sessions, then stop both servers. Must run OFF the thread that
        runs `srv.serve_forever()`: the Python docs say `shutdown()` "must be
        called while serve_forever() is running in a different thread
        otherwise it will deadlock". The signal handler runs on the main
        thread, which is the serving thread, so calling this inline from the
        handler deadlocked — measured 2026-10-01: the server was still alive
        31 s after SIGTERM with zero sessions, and Electron's 45 s SIGKILL
        ended every quit (Sprint 094; Twelve-Factor IX)."""
        _say("SIGTERM received; ending sessions cleanly...")
        outcome = _shutdown_all_sessions(app, per_session_timeout=10.0)
        _say(
            f"shutdown: ended={outcome['ended']} "
            f"skipped_fresh={outcome['skipped_fresh']} "
            f"skipped_ended={outcome['skipped_ended']} "
            f"failed={outcome['failed']}"
        )
        TRACE.emit(
            Signal.SERVER_STOPPED,
            {
                "ended": outcome["ended"],
                "skipped": outcome["skipped_fresh"] + outcome["skipped_ended"],
                "failed": outcome["failed"],
            },
        )
        TRACE.flush_loss()
        if uds_srv is not None:
            uds_srv.shutdown()
        srv.shutdown()  # returns once serve_forever() on the main thread exits

    _shutdown_claim_lock = threading.Lock()

    def _claim_shutdown() -> bool:
        """True for the first caller only (Sprint 215d: a second SIGTERM, or
        SIGTERM racing the watchdog, is a no-op). Called from threads, never
        from the signal handler."""
        with _shutdown_claim_lock:
            if app.shutdown_started.is_set():
                return False
            app.shutdown_started.set()
            return True

    # Self-pipe: the signal handler writes one byte and does nothing else. The
    # Python docs (signal, "Signals and threads"): "Synchronization primitives
    # such as threading.Lock should not be used within signal handlers. Doing
    # so can lead to unexpected deadlocks." A handler that called Event.set()
    # and Thread.start() did deadlock (2026-10-01: main thread parked in the
    # handler's lock wait, no "SIGTERM received" line, Electron's 45 s SIGKILL
    # ended the quit). os.write takes no Python lock.
    _sig_r, _sig_w = os.pipe()
    os.set_blocking(_sig_w, False)

    def _sigterm_handler(_signum: int, _frame: Any) -> None:
        try:
            os.write(_sig_w, b"T")
        except OSError:
            pass  # pipe full: a byte is already waiting

    def _shutdown_waiter() -> None:
        os.read(_sig_r, 1)  # blocks until the handler writes
        if _claim_shutdown():
            _shutdown_sequence()

    threading.Thread(target=_shutdown_waiter, name="shutdown-waiter", daemon=True).start()
    signal.signal(signal.SIGTERM, _sigterm_handler)

    # Sprint 082: parent-death watchdog. Electron's main process
    # normally SIGTERMs us cleanly via the process group. When
    # Electron is hard-terminated (Playwright's _electron.launch +
    # app.close(), for example), the SIGTERM never fires and this
    # subprocess becomes an orphan holding its port. The watchdog
    # thread polls getppid() and initiates shutdown once we
    # re-parent to init (pid 1).
    parent_pid_at_start = os.getppid()
    # Sprint 094: watch the APP, not merely our direct parent. In source
    # mode the chain is Electron -> `uv run` -> python; when Electron dies,
    # `uv` lives on, our ppid never changes, and the backend orphans
    # (2026-10-01: 11 source-mode backends from Sep 28-30 still running).
    # electron/main.ts passes its own pid as SUBSTRATE_PARENT_PID.
    try:
        app_pid = int(os.environ.get("SUBSTRATE_PARENT_PID", "") or 0) or None
    except ValueError:
        app_pid = None

    def _app_alive() -> bool:
        if app_pid is None:
            return True
        try:
            os.kill(app_pid, 0)
        except ProcessLookupError:
            return False
        except PermissionError:
            return True  # exists, owned by someone else
        return True

    def _ppid_watchdog() -> None:
        while not app.shutdown_started.is_set():
            time.sleep(1)
            ppid = os.getppid()
            if not _app_alive() or (ppid != parent_pid_at_start and ppid == 1):
                # The print used to raise BrokenPipeError here (the pipe's
                # reader, Electron, is the process that died), killing this
                # thread before shutdown; an orphaned backend then held its
                # port and ~/.substrate indefinitely (seen 2026-09-29, pid
                # 38409). _say swallows that, and the handler's sys.exit
                # only ends this thread, so exit the process explicitly.
                _say(
                    f"parent process died (was {parent_pid_at_start}, now reparented to init); shutting down"
                )
                if not _claim_shutdown():
                    return
                try:
                    _shutdown_sequence()  # this thread is not the serving thread
                    try:
                        uds_path.unlink()
                    except FileNotFoundError:
                        pass
                finally:
                    os._exit(0)

    threading.Thread(target=_ppid_watchdog, daemon=True).start()

    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        if uds_srv is not None:
            uds_srv.shutdown()
    finally:
        # Reached when the shutdown thread's srv.shutdown() stops the loop,
        # or on Ctrl-C. Remove the socket so the next daemon binds cleanly.
        try:
            uds_path.unlink()
        except FileNotFoundError:
            pass


if __name__ == "__main__":
    main()
