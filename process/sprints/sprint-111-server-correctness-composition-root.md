# Sprint 111 — Server correctness and composition root

```yaml
---
id: 111
status: open
opened_at: 2026-10-08
pass_kind: remediation
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-08-lens-audit-remediation.md
ledger_rows: 26
---
```

## why

await_completion reports FINALISED for any outcome; topology runs leak into the real home unlisted; tildes are not expanded; eight singletons and HOST/PORT live at import (findings §1, §3, §4).

## sources

- *Twelve-Factor App*, III Config; Seemann, *Composition Root*.
- Roadmap decision: Studio and legacy endpoints deleted.

## scope (ledger rows)

Each row closes as named; a row the sprint cannot close halts the sprint.

| id | close | finding |
|---|---|---|
| F002 | fix | server.py POST /api/session — workspace "~/.substrate/sandbox" stored literally (shape flat); tools root Path(manifest.workspace) is relative → resolves against server cwd; literal ./~/.substrate/sandbox in kernel rep… |
| F063 | fix | server.py:1622,4179 default port 8765 = the harness default (lib/server.ts) = the CLI's TCP fallback: a `substrate daemon` and a gate run collide on one port. |
| F294 | fix | ~/.substrate/runs holds 389 `s_topo_*` run dirs (Sep 21-27), 5 `build_shakeout_spec_*.record` (Oct 1 19:50), `launch_agent_calc_*` (Sep 30), `tool_loop` (Sep 12); 8.1 MB. Sprint 107's cleanup removed sessions and gate… |
| F295 | fix | server.py:3111-3113 — `/api/topology/<name>/run` writes `runs/s_topo_<hex>` with no `.record` suffix; `_record_path` (l.1740) looks for `<name>.record`, `_records_index` globs `*.record`, `_clear_runs` prunes only lau… |
| F296 | fix | server.py:3117-3134 — `await_completion=true` (the default) discards `Runtime.run`'s RunResult and answers `"status": api.RunStatus.FINALISED` for a paused or failed run. |
| F297 | fix | server.py:3201-3205 — comment "torn record … treat as running until stable"; code sets `status = FAILED`. |
| F298 | fix | server.py:3378-3383 — `/api/agent` maps `model=ollama` -> name, `claude\|gemini\|cli` -> driver string, anything else -> "deterministic". `codex` and `cursor-agent` (in KNOWN_CLI_ADAPTERS) silently run the determinist… |
| F303 | delete | server.py:4064-4065,1630-1632 — `/terminal-v1` routes to an empty directory ("currently empty; round-1 archived"): dead route. |
| F304 | fix | server.py:894-895,1277 — `http://localhost:11434` hardcoded twice; OllamaResponder honours `OLLAMA_BASE_URL` (adapters/models.py:170). Three sources for the Ollama address. |
| F305 | fix | server.py:883-906 — `_model_supports_thinking` falls back to True when /api/show is unreachable and caches it for the process; a non-thinking model probed while Ollama was briefly down gets `think=True` for the daemon… |
| F306 | fix | model-name defaults in server.py: `prefer` list `kimi-k2.7-code:cloud`, `glm-5.2:cloud`, … (l.1308-1313); manifests default `kimi-k2.6:cloud`; `/api/agent` `llama3.2:1b` (l.3379,3508); `_responder_for` `llama3.2` (l.6… |
| F307 | fix | server.py:717-773 — curated Claude catalog defaults to `opus-4-8` and lists Fable 5.1 but neither `claude-opus-5-5` nor `claude-sonnet-5-5` (the current Claude 5 model IDs). |
| F308 | fix | server.py:1129-1131,1297-1299 — `opencode` status parser and comment remain after opencode's removal (l.871). |
| F309 | fix | server.py:589-608 `_with_session_end_threshold` — the server re-implements session_topology's termination composition (pause-on-Park + SessionEnded threshold) to fix resume-after-end; the fix lives in the console, so … |
| F310 | fix | server.py:583-587,2493-2500,2564-2566,2627-2634,2672-2674 — whole-record scans per turn: `_count_record_kind` (every turn build), pre- and post-turn max-seq scans (twice per /turn and /end). O(record) on every turn. |
| F311 | fix | server.py:1812-1860 — `/api/records` reads every record in runs/ + bundled, and runs run_graph + narration_summary on each, per request; no cache (the assay endpoint has one). |
| F312 | fix | server.py:1375-1390 — `_canonical_workspace` docstring "resolves an absolute path"; code only expands `~`. |
| F315 | fix | server.py:3704-3714 — `_session_patch` docstring: "`tools` and `per_turn` are NOT PATCH-able yet"; l.3727 accepts them (plus bundle, driver_params). |
| F316 | fix | server.py:2303 — role prompts resolve with `repo_root=Path.cwd()` (the server process cwd). |
| F318 | fix | server.py:85-141 — eight mutable module-level singletons (_SESSION_REGISTRY, _APPLICATIONS, _TOPOLOGY_RUNS, _RESPONDER_CACHE, _LAUNCHES, _CLI_PTY_SESSIONS, _VERSION_CACHE, _MODEL_THINKING_CACHE) plus HOST/PORT/WEB res… |
| F319 | fix | server.py:4214-4222 — boot scan runs concurrently with request handlers, justified by "CPython's GIL makes single-key reads/writes atomic"; `list_all` is `list(self._manifests.values())` (atomic only under the GIL; fr… |
| F341 | fix | gen_demo_records.py:40-46,153-155 — writes demo fixtures into the user's real `~/.substrate/runs` by default and `rmtree`s same-named records; server.py `_RESUMABLE` and `/api/resume` (resume-a-copy "DEMO affordance")… |
| F342 | fix | builder.py:29 and server.py:62 import from `substrate.reference` (the deprecated seam per reference/_models.py:11). |
| F375 | fix | literal `~` directories exist: `substrate/~/.substrate/sandbox` (created 2026-09-27 15:27) and `substrate-ui/~` (2026-10-01 20:52). Cause: the UI and gates send the string "~/.substrate/sandbox" (reveal.ts:258, reveal… |
| F412 | fix | server.py:90-1949 — at least 15 further module-level mutable caches and tables (_APPLICATIONS, _TOPOLOGY_RUNS, _RESPONDER_CACHE, _LAUNCHES, _MODEL_THINKING_CACHE, _VERSION_CACHE, _CLI_PTY_SESSIONS, _ASSAY_CACHE, …) pe… |
| F431 | fix | server.py:2421, 2545, 2641, 3436 — every 410 for a deleted or ended session returns error code SESSION_ENDED_MID_DELEGATE ("session_ended_mid_delegate", defined at substrate/src/substrate/topologies/tool_loop/delegate… |

## checks

- Handler reads its dependencies from an App built in main(); tests build their own App.
- `~` expands; no cwd-relative workspace exists.
- await_completion returns the run's real status.
- Topology runs are `.record`, appear in /api/records, and are pruned.
- Studio, /api/launch, demo /api/resume and /api/agent legacy are gone with their tests.
- Each 410 carries a code that names its condition.
- The real ~/.substrate holds no test output (one-time cleanup of 389 s_topo + 5 shakeout records; literal ~ dirs removed).

## result

(filled at close)
