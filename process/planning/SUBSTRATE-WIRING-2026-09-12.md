# Substrate wiring — prototype v7 to the running backend

*Written 2026-09-12. Supersedes `EPIC-PLAN-v0.2` for the actual work. This document names, seam by seam, what the prototype at `handoff_latest/prototypes/Substrate Prototype v7.dc.html` reads or writes as fake data, what the substrate library already does, what the bridge already exposes, and what work remains. Line numbers cite the four files that carry the whole system: the prototype HTML, `bridge/main.py`, `bridge/vocab.py`, and `substrate/src/substrate/session_registry.py`.*

---

## Inventory — what already exists

### Substrate library (`substrate/src/substrate/`)

`SessionRegistry` at `session_registry.py:245`. Its public methods:

| Method | Line | Returns |
|---|---|---|
| `create(session_id, name, driver, workspace, workspace_shape, bundle, seed)` | 400 | `SessionManifest` |
| `get(session_id)` | 732 | `SessionManifest \| None` |
| `by_name(name)` | 729 | `session_id \| None` |
| `list_all()` | 735 | `list[SessionManifest]` |
| `list_children(parent_id)` | 738 | `list[SessionManifest]` |
| `turn_sync(session_id, resume_event_builder, timeout_seconds)` | 747 | `(manifest, record_root)` |
| `try_enqueue_turn(session_id)` | 878 | `(admitted, cap)` |
| `interrupt(session_id)` | 912 | `dict \| None` |
| `set_name(session_id, name)` | 472 | `SessionManifest` |
| `set_driver(session_id, driver)` | 693 | `SessionManifest` |
| `set_driver_params(session_id, params)` | 550 | `SessionManifest` |
| `set_bundle(session_id, bundle)` | 645 | `SessionManifest` |
| `set_tools(session_id, tools)` | 502 | `SessionManifest` |
| `set_per_turn(session_id, per_turn)` | 528 | `SessionManifest` |
| `delete(session_id)` | 993 | `SessionManifest` |
| `update_status(session_id, status)` | 984 | `SessionManifest` |
| `next_turn_index / advance_turn_index` | 903 / 908 | `int` |
| `boot_scan()` | 344 | list of session_ids |

Records are on disk at `manifest.record_root`. `substrate.api.read_record(path)` yields envelopes.

`TopologyBuilder` is exported at `substrate/src/substrate/api.py:94`. A studio-authored builder runs by injecting a factory into `SessionRegistry(session_topology_factory=…)` and calling `create`.

`substrate.assay` at `substrate/src/substrate/assay/` carries the real engine:

- `assay/report.py:172 Report` + `assay/report.py:331 build_report` produce the arm-level statistics the prototype's assay surface renders.
- `assay/stats.py:97 bootstrap_delta_pass_k`, `assay/stats.py:249 equivalence_verdict_score_tost`, `assay/report.py:37 exact_mcnemar_p`, `assay/stats.py:325 benjamini_hochberg` — every statistic the prototype names on line 361 ("Δ-pass¹ +.17 · paired bootstrap p=.008 · BH-FDR significant") already has a function.
- `assay/run.py` runs an arm × case × trial matrix; `assay/preregistration.py` locks the arms hash the prototype's "arms_hash ✓" cites.

### Bridge (`bridge/main.py`, `bridge/vocab.py`)

Ops present, with the substrate call each wraps:

| Op | Bridge fn | Substrate call | Returns |
|---|---|---|---|
| `ping` | inline | — | `{op:"pong", t}` |
| `read_recent_workspaces` | `op_read_recent_workspaces` | reads `~/.substrate/recent-workspaces.json` | `list[{path, shape, last_used}]` |
| `list_sessions` | `op_list_sessions` :258 | `reg.list_all()` | list of manifest dicts |
| `list_assays` | `op_list_assays` :549 | **returns `[]`** — assay projection not wired | `[]` |
| `session_create` | `op_session_create` :147 | `reg.create(...)` | `{session_id, session_name, manifest_path, workspace_path, workspace_shape}` |
| `session_resume` | `op_session_resume` :294 | `reg.get(...)` | `{session_id, session_name, workspace_path, workspace_shape, driver, status, record_root, last_turn_index}` |
| `session_end` | `op_session_end` :495 | `reg.turn_sync(END_ON_EXIT_SENTINEL, ...)` | `{end_reason, record_finalised, envelope_seq}` |
| `turn_submit` | `op_turn_submit` :443 | `reg.try_enqueue_turn` + `reg.turn_sync(...)` | `{session_id, turn_index}` |
| `probe_driver` | `op_probe_driver` :174 | ollama `/api/show` or `<cli> --version` | `{available, context_tokens?, model_families?}` |
| `driver_change` | `op_driver_change` :227 | `op_probe_driver` + `reg.set_driver(...)` | `{session_id, from_driver, to_driver}` |
| `record_read` | `op_record_read` :318 | `substrate.api.read_record(...)` | `{session_id, envelopes: [...] }` — child_record_root already attached to delegate ToolCall rows |
| `topology_validate` | `op_topology_validate` :566 | regex + int checks | `{topo_name, producer_count, view_count, trigger_count, route_count}` |
| `topology_build` | `op_topology_build` :599 | writes a stub `.py` file | `{topo_name, record_root: <path to stub>}` |

The bridge uses stdio request/reply. `hello` fires once at startup. There is no push channel; a completed turn's ack is delivered when `turn_sync` returns.

### Prototype (`handoff_latest/prototypes/Substrate Prototype v7.dc.html`)

A single `<script type="text/x-dc">` at line 515 holds every handler and every fake data source. Fake data sites, each one a hook for substrate:

| Prototype site | Line | What it fakes |
|---|---|---|
| Initial `panes` state | 527 | one hardcoded pane `fix-race-in-metering` with driver `kimi-k2` |
| `_bindPane(id, ws)` | 536 | writes two hardcoded transcript lines (`session … started`, `◐ parked`) instead of calling substrate |
| Driver picker options | 761, 923, 1062 | seven hardcoded driver names |
| First-run driver list `frRows` | 1119 | six hardcoded driver categories |
| Records surface — extra sessions | 341 | `docs-pass`, `scratch`, `swebench-repro` hardcoded |
| Records surface — assays list | 349 | `rev_kimi_vs_glm` / `coding_cells` hardcoded |
| Assay surface `arms` | 907 | four hardcoded arm rows with pre-baked deltas |
| Delegate child fixtures `CH` | 654 | six hardcoded child transcripts (`reviewer-a`, `verifier`, `floor_a`, `floor_b`, `floor_c`) |
| Fan-out `fanRows` | 710 | derived from `CH`; three hardcoded child summaries |
| Transcript `EVFULL` | 809 | 244-event hardcoded fixture across seq 214–244 |
| Scripted fade-ins `fdU1..fdPark` | 719, 727 | opacity 0→1 timing per line, not real event arrival |
| `_validate()` | 630 | client-side sanity check |
| `doBuild()` | 1046 | writes a status string; no substrate call |
| Records `sim` for rate-limit | 105, 1079 | prototype `simulateRateLimit` prop; not a real envelope |
| Scene grid `G` | 905 | hardcoded 12×12 |
| Structure listing | 297–313 | hardcoded producers/triggers/views/termination |
| Diff / context / run slash | 902 | slash commands have no handler |

### The prototype's core loop

`DCLogic.setState(patch)` re-renders. `renderVals()` at line 648 produces the flat object the JSX-like template reads. Everything the DOM shows derives from `this.state = {...}` plus what `renderVals` computes. Substrate wires into that class in one of two shapes: mutate `state.EV` when new envelopes arrive; call `bridge.request(op, payload)` from a handler, then `setState` when the promise resolves.

---

## Seams — what to hook up

Each row: **fake data site** → **substrate call to make** → **status**.

### Session lifecycle

1. **First-run driver picker.** Prototype `frRows` at 1119. Substrate needs a `list_drivers` op — it does not exist. `probe_driver` tests one; the prototype's roster wants a scan. Build the op: ollama `/api/tags` for installed models, `which claude` / `which gemini` for CLIs, deterministic always, `context_tokens` from `/api/show` for the picked one. New bridge op; no substrate changes.

2. **Bind a fresh pane.** Prototype `_bindPane` at 536. Replace with `bridge.request("session_create", {session_id: newId(), name: ..., driver, workspace_path, workspace_shape, bundle: "", seed: ""})`. The bridge op already exists (`op_session_create` :147). On the reply, dispatch `record_read` to fetch initial envelopes (SessionStarted + Park).

3. **Resume a pane from records.** Prototype records-surface click at 337 (`backToSession`). Replace with `bridge.request("session_resume", {session_id})` and `record_read`. Both ops exist.

4. **Records surface listing.** Prototype extra sessions at 341, workspace groupings hardcoded. Replace with `list_sessions` + client-side group-by `manifest.workspace`. Bridge op exists. The prototype's five workspace headings (`~/code/substrate`, `~/notes/substrate-docs`, `~/.substrate`, plus assays) collapse to the actual set of `manifest.workspace` strings on disk.

5. **Prompt submit.** Prototype `onPromptKey` at 1049, `onPvKey` per-pane at 747. Replace with `bridge.request("turn_submit", {session_id, text, timeout_seconds: 60})`. Bridge op exists. On ack, re-fetch `record_read` and reassign `EV` in state.

6. **End session confirm.** Prototype `doEndSession` at 1113. Replace with `bridge.request("session_end", {session_id})`. Bridge op exists. On ack, mark pane's `ended: true`.

7. **Rename.** Prototype `nameKey` at 798 stores name locally. Substrate has `reg.set_name` at 472. Bridge op missing — write `op_session_rename`. Small.

### Driver

8. **Driver picker options per pane.** Prototype `driverOpts` at 761. Same fix as #1 — call `list_drivers`. The picker's active-highlight of `pane.driver` needs no substrate call.

9. **Driver pick commits.** Prototype `d.pick` inside `driverOpts.map`. Replace with `bridge.request("driver_change", {session_id, driver, driver_params: {}})`. Bridge op exists.

### Transcript

10. **Transcript body.** Prototype `EVFULL` at 809. Replace with the envelope list from `record_read`. Bridge op exists. **The renderer's shape holds** — `EV.map(e => {seq, kind, prod, gist, payload, content})` is the same shape `record_read` returns; the field names are identical (seq, kind, producer_kind, summary, payload, content).

11. **Envelope arrival cadence.** Between `turn_submit` sent and `turn_submit` acked, envelopes land on disk as the driver produces them. The prototype's opacity fade-ins (`fdU1`…`fdPark` at 719) simulate that arrival. Two paths for the real thing:
    - **A. Poll `record_read` every 400ms while a turn is in flight, stop on ack.** Zero substrate work. Wasteful under many idle sessions; fine for one.
    - **B. Push channel from the bridge.** Substrate's `runtime.py` emits envelopes into the record via `api.append_envelope`. Wrap that call with a tap that writes `{"op": "envelope", "session_id": …, "envelope": …}` to stdout as the envelope lands. Bridge stays request/reply for everything else; envelope arrivals push. Small substrate touch (one tap), medium bridge change (new outgoing op kind).
    Path A is enough for a first working shell. Path B is worth doing next.

12. **Delegate descent.** Prototype `descendReviewer` at 933 and `CH` at 654. Replace `CH[k]` lookup with `bridge.request("record_read", {record_root: <child_record_root from parent's delegate ToolResult>})`. Bridge op accepts a `record_root` payload; the parent's `record_read` already attaches `child_record_root` to each delegate `ToolCall` row (bridge/main.py:415). Wire only.

13. **Fan-out.** Prototype `fanRows` at 710 built from `CH`. Detection is client-side: adjacent delegate `ToolCall` envelopes at the same step form a fan-out group. Substrate's delegate.py already runs parallel delegates. Wire only; the detection logic already existed in the reducer I deleted at Q0 — port back if needed.

14. **Nested descent** (H7). Prototype `nestedDescent` at 456, an on/off toggle that keeps the parent visible above the child. Client-side; no substrate call.

### Machinery panel (reveal view)

15. **Swim-lane graph.** Prototype `sideLanes` at 887, `spansByKind` at 841. Every span is a producer's `ProducerStarted → ProducerCompleted` bracket over the same envelope list `record_read` returns. Wire only. The framework-bracket envelopes (`TriggerFired`, `ProducerStarted`, `ProducerCompleted`) are filtered out by `record_read` at `bridge/main.py:360` when it enforces `VISIBLE_KINDS`. To draw the graph, the shell needs the raw envelopes. Choice: a `record_read` mode flag (`include_framework_brackets: true`) that skips the VISIBLE_KINDS filter, or a separate op. Small bridge change.

16. **Inspect drawer.** Prototype `selE` at 836, opens a payload / content panel on row click. Every field it shows is on the envelope. Wire only.

17. **Mode chips (stream/i/o/structure/scene).** Client-side projection over the same envelope list. Wire only.

18. **Structure listing.** Prototype at 297–313 hardcodes session_topology's producers, triggers, views. Substrate has `session_topology(...)` in `substrate/topologies/session/`. A new bridge op `topology_introspect(session_id)` reads the session's built topology and returns `{producers: [{name, emits, initial}], triggers: [{id, on, starts}], views: [{name, def}], termination: str}`. Small — the topology object exposes these fields already.

19. **Scene lens.** Prototype `sceneCells` at 973 hardcoded 12×12 grid. Real: the current record has, on the last seq, an envelope with `payload.kind == "Generation.grid"` (per prototype line 317) whose payload carries the cell array. Bridge op `scene_project(session_id)` walks the record backward for the latest Generation envelope and returns its cells. Zero if none — the tab hides itself (prototype behaviour). New bridge op, thin.

### Studio

20. **Studio validate.** Prototype `_validate` at 630. Replace with `bridge.request("topology_validate", {topo_name, producer_count, view_count, trigger_count, route_count})`. Bridge op exists but only checks name shape + count minimums. To match the prototype's client-side rules (initial producer required, trigger.starts exists, emitted kinds consumed) the bridge op needs those checks. Small extension.

21. **Studio build + launch.** Prototype `doBuild` at 1046 writes a message. Bridge `op_topology_build` writes a stub `.py` file. Neither runs the topology. The real thing:
    - Bridge grows `topology_build_and_launch(spec)` that constructs a `TopologyBuilder` from the studio spec (producers/views/triggers/routes/termination), wraps it in a `session_topology_factory` closure, calls `reg.create(...)` with a fresh session_id, and returns `{topo_name, session_id, record_root}`.
    - Substrate's `TopologyBuilder` (`api.py:94`) is real; the wrap-and-create is bridge code. Medium work.

22. **Studio canvas node-graph.** Prototype `canvasCards` at 1004. Client-side layout. Wire only; the drag positions live in `state.cardPos`.

### Assay surface

23. **Assay listing.** Prototype records-surface `openAssay` at 918. Bridge `list_assays` returns `[]`. Substrate has `assay/preregistration.py:69 Preregistration` (records the arm × case × trial matrix) and `assay/report.py:172 Report` (holds arm-level statistics). A `list_assays` op walks `~/.substrate/assays/` (or the equivalent) for preregistered runs, returns `[{assay_name, arms_count, cases_count, trials_count, cells_count, finding_ready, path}]`. Bridge op needs the walk logic; substrate provides the file format via `Preregistration`.

24. **Assay grid rows.** Prototype `arms` at 907. Substrate's `Report.arms[i]` (`assay/report.py:49 ArmReport`) carries every field the prototype renders: `overall_pass_hat_k`, `by_bin` (easy/med/hard/adv), `delta`, `p_value`, `verdict` (superior/inconclusive/underpowered/no-effect). New bridge op `assay_report(assay_name)` calls `assay/report.py:331 build_report` on the stored preregistration + trial records, returns the arm rows. Substrate side is there; wire only.

25. **Assay cell drill-in.** Prototype clicks a cell for its three trial records (prototype line 372). New bridge op `assay_cell(assay_name, arm, case)` returns three trial record roots.

### Dialogs and headers

26. **Settings — theme.** Prototype `themeChips` at 1103. Client-side; the shell reads it and applies a `data-theme` root attribute. No substrate call.

27. **Settings — font-size.** Prototype `fontOverride` at 1107. Client-side; setState.

28. **Settings — nested-descent.** Same. Client-side.

29. **Settings — key bindings display.** Read-only text. Client-side.

30. **Export dialog.** Prototype `doExport` at 1111. New bridge op `record_export(session_id, target_path, format)`. `format` is `record_dir` (copy segments + manifest to a `.record` directory) or `flat_events_jsonl` (concatenate every envelope into one file). Substrate has record segments and manifest layout; the op copies or reads-and-writes. Medium — file IO code, no substrate library changes.

31. **End-confirm dialog.** Wired at #6.

32. **Slash commands (nine).** `CMDS` at 902:
    - `/list` — surface toggle to records. Client-side.
    - `/run` — launch a topology. Depends on #21.
    - `/inspect` — narrate a record. Client-side using `record_read` output; a lightweight beat-narrator that reads UserMessage/ToolCall/FinalAnswer/Park.
    - `/diff` — worktree diff. New bridge op `workspace_diff(session_id)` — runs `git diff` in the manifest's `workspace` when the shape is `worktree` or `flat` and returns the patch text.
    - `/context` — inject a record slice into the next turn's prompt. This is a `turn_submit` variant that pre-pastes a record slice into `text`. Client-side composition; no bridge op.
    - `/model` — driver_change. Wired at #9.
    - `/studio` — surface toggle to studio. Client-side.
    - `/export` — surface toggle to export dialog. Client-side + #30.
    - `/exit` — session_end. Wired at #6.

### Rate-limit visibility

33. **RateLimitedWaiting.** Prototype `simRL` at 1115 is a prop toggle. Real: substrate's ollama driver emits `RateLimitedWaiting` envelopes with `{retry_index, retry_max, retry_after_seconds}`. `record_read` already surfaces them (`bridge/main.py:394`). The bottom bar's status pill reads them off the transcript. Wire only.

### Interrupt

34. **Interrupt an in-flight turn.** Substrate has `reg.interrupt(session_id)` at `session_registry.py:912`. Bridge has no op. New op `turn_interrupt(session_id)` that wraps it. The prototype does not sketch a UI for this; add a button when the pane's `status` is `RUNNING`.

### Bundle + tools restrict

35. **Bundle attach.** Substrate has `reg.set_bundle` at 645. Bridge op `bundle_attach(session_id, bundle_path)` — new. The prototype has no explicit UI; the workspace popover shows `bundle` when set (needs an add-affordance).

36. **Tools restrict.** Substrate has `reg.set_tools` at 502. Bridge op `tools_restrict(session_id, tools)` — new. UI slot per settings-dialog extension.

### First-run

37. **Six-row driver picker on first launch.** #1 covers the roster. The prototype's modal at 493–511 is client-side; the first pick fires `frDone` and `set_driver` on pane 1's default session. Wire depends on #1 + #9.

---

## New bridge ops — the full list

The bridge grows these; each one is small and the substrate side already carries the capability:

| Op | Wraps | Payload | Returns |
|---|---|---|---|
| `list_drivers` | `probe_driver` × N | `{}` | `[{name, kind, available, context_tokens?, model_families?}]` |
| `session_rename` | `reg.set_name` | `{session_id, name}` | `{session_id, name}` |
| `turn_interrupt` | `reg.interrupt` | `{session_id}` | `{interrupted: bool, at_seq?}` |
| `bundle_attach` | `reg.set_bundle` | `{session_id, bundle}` | `{session_id, bundle}` |
| `tools_restrict` | `reg.set_tools` | `{session_id, tools: [str]}` | `{session_id, tools}` |
| `topology_introspect` | reads `session_topology` | `{session_id}` | `{producers: [...], triggers: [...], views: [...], termination}` |
| `scene_project` | `api.read_record` scan | `{session_id}` | `{kind, seq, cells}` or `null` |
| `record_export` | file copy or events dump | `{session_id, target, format}` | `{path, bytes}` |
| `workspace_diff` | `git diff` in workspace | `{session_id}` | `{patch_text}` |
| `topology_build_and_launch` | `TopologyBuilder` + `reg.create` | `{topo_name, producers, views, triggers, routes, termination, responder, seed}` | `{topo_name, session_id, record_root}` |
| `assay_report` | `assay/report.build_report` | `{assay_name}` | `Report`-shaped dict |
| `assay_cell` | reads preregistered trial records | `{assay_name, arm, case}` | `[{record_root, trial_id, pass}]` |
| `list_assays` (extend) | walks preregistered runs | `{}` | `[{assay_name, cases, arms, trials, finding_ready}]` |
| `record_read` (extend) | flag to include brackets | `{session_id, include_framework_brackets: bool}` | envelopes |
| `topology_validate` (extend) | client-side checks | `{...}` | `{ok / errors[]}` with the six ratified rules |

Twelve new ops, three extensions. Zero of these need new substrate library code — each wraps an existing method. Two involve nontrivial bridge logic: `topology_build_and_launch` (constructs a `TopologyBuilder` from a form spec) and `assay_report` (calls `build_report` on a preregistered run + trial records).

---

## Substrate library work — what's missing under the ops

The substrate library needs no new capability for items 1–37 above **except**:

- **Envelope-arrival tap** (item #11 path B). If the shell wants push instead of poll for transcript growth, `runtime.py`'s envelope-append site needs to fire a callback the bridge can subscribe to. This is one method on the runtime, plus a subscription list on the registry. Small.
- **Scene event schema.** The prototype at line 317 expects `Generation.grid` events with cell arrays. Whichever substrate topology emits scenes (`game_of_life`, etc.) needs to actually be running and emitting for the scene lens to draw. This is a "run one" question, not a "build one" question; the topology exists in `substrate.benchmarks` or similar.

Everything else — the ops enumerated above — has substrate methods behind it already.

---

## The transcript-update decision

Path A (poll) — the shell polls `record_read` every 400ms after `turn_submit` is sent. When `turn_submit` returns, do one final `record_read` and stop polling. Cost: repeated file reads. Bridge stays request/reply. Zero substrate work. Ship first.

Path B (push) — the bridge grows an outgoing message kind `envelope` that fires whenever a subscribed session appends. Substrate grows an append-hook. `substrate` is already in-process to the bridge; the hook is a Python callable, not a subprocess event. Small change on both sides. Do this second, once path A is working.

---

## Order of work — minimal viable, then real

**Round 1 — the app talks to substrate.** Land items 2, 4, 5, 6, 8, 9, 10, 12, 15, 16, 17. Uses only existing bridge ops. The app binds a workspace, runs a turn, sees envelopes appear, ends the session, resumes from records. Estimated bridge changes: zero. Client-side wiring in the DC script.

**Round 2 — the app talks to real drivers.** Land items 1, 8, 37. New bridge op: `list_drivers`. First-run picker works against the real roster.

**Round 3 — machinery and studio.** Land items 18, 19, 20, 21, 22. New bridge ops: `topology_introspect`, `scene_project`, `topology_build_and_launch`. `topology_validate` extended.

**Round 4 — assays real.** Land items 23, 24, 25. New bridge ops: `assay_report`, `assay_cell`, `list_assays` extension.

**Round 5 — dialogs and long-tail ops.** Land items 7, 30, 32/`/diff`, 34, 35, 36. New bridge ops: `session_rename`, `record_export`, `workspace_diff`, `turn_interrupt`, `bundle_attach`, `tools_restrict`.

**Round 6 — push transcript.** Path B for item 11. Substrate touch + bridge outgoing message.

Rounds 1 and 2 give a working shell. Round 3 completes the machinery lens and studio launch. Round 4 turns the assay surface real. Rounds 5 and 6 finish the long tail.

---

## What to build first — one specific move

Before any of the rounds above, the client-side plumbing that binds a DC state field to a bridge call needs to exist. The prototype's `DCLogic` class already has `setState` and `componentDidMount`. Two additions:

1. In `electron/preload.js`, expose `window.bridge.request(op, payload) → Promise<result>`. The bridge already replies request/reply on stdio; preload wraps the ipcMain roundtrip with a request_id map.
2. In the prototype's `<script>`, add three helpers to the `DCLogic` subclass — `async _bridge(op, payload)`, `_pollRecord(session_id)` that polls `record_read` on an interval, `_onEnvelope(env)` that mutates `state.EV`. Nothing else touches the prototype's shape.

Once those two land, every one of items 1–37 becomes a one-handler edit inside the existing `Component` class.
