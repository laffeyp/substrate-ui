# Sprint 084 — CLI driver live-probe + sectioned picker + scene crash guard

```yaml
---
id: 084
status: closed
opened_at: 2026-09-25
closed_at: 2026-09-25
closed_by: agent
phase: 9
pass_kind: implementation
---
```

## scope

The driver dropdown must reflect what is on the box. Ollama already
did — live probe of `http://localhost:11434/api/tags`. The CLI side
did not — `claude` and `gemini` were hard-coded strings in
`server.py`, with no `shutil.which` gate and no group in the roster.

Sprint 084 lifts the CLI half to the same live-probe pattern. One
catalog (`KNOWN_CLI_ADAPTERS`) names every CLI Substrate knows how
to speak with, each entry `{name: [command, flag]}`. At roster time
`shutil.which(cmd[0])` filters. The API surface returns a grouped
shape — `cli`, `ollama_cloud`, `ollama_local`, `testing` — alongside
the flat `models` list for legacy consumers. The dropdown builds
section-headed rows from the groups.

Also in the sprint: a scene-tab crash guard. Peter clicked the scene
lens on a session with no grid data and the whole Electron window
disappeared. Root cause: an oversized grid on some attached record
could take Chromium's paint thread down; `_findGrid` had no cap and
no try/catch. Fixed with a 400-cell (20×20) render cap and end-to-end
try/catch on grid detection + cell mapping.

Also: `harness/shakeout/cli_discovery.ts` — a new flow that reads
`/api/models`, iterates every detected CLI, opens a session per
driver, sends "Say hi in three words", asserts park + non-empty
reply, ends. The catalog IS the picker; the shakeout proves every
picker entry actually drives a turn.

## deliverables

- `server.py`
  - `KNOWN_CLI_ADAPTERS` — the catalog. Five entries as of close:
    `claude`, `codex`, `aider`, `cursor-agent`, `opencode`. `gemini`
    removed 2026-09-25 (the Gemini CLI is deprecated upstream).
  - `_agent_models` — replaced. Live-probes Ollama via `/api/tags`
    and CLIs via `shutil.which`. Returns
    `{models, cli, ollama_cloud, ollama_local, testing, default}`.
    Cloud detection catches both `:cloud` and `:<size>-cloud` tag
    conventions (e.g. `qwen3-coder:480b-cloud`).
  - `_daemon_driver_resolver` — reads `KNOWN_CLI_ADAPTERS` for the
    CLI branch; one catalog, one source of truth.
  - `/api/agent` endpoint's CLI preset block — dedup'd against the
    catalog.
- `web/vm/types.ts` — `driverGroups: { label; entries }[]` added to
  Snapshot.
- `web/vm/session_controller.ts` — `ModelsRoster` interface widened
  to carry the group arrays. `loadDriverRoster` computes the groups
  from the server response, skips empty groups, patches
  `driverGroups` alongside the flat `driverRoster`.
- `web/reveal/transcript/useController.ts` — seed `driverGroups: []`
  in the empty snapshot (satisfies TS strict).
- `web/reveal.ts` — mirror `driverGroups` from the controller
  snapshot into the component state patch.
- `web/reveal_component.ts` — `driverOpts` (per-pane) and
  `fpDriverOpts` (focused-pane / reveal-view) rewritten as an
  interleave: each group's `label` emits a `{isHeader:true, ...}`
  entry, each entry inside emits a `{notHeader:true, ...}` picker
  row. Fallback to `driverRoster` when groups are unavailable
  (empty roster or stale server).
- `web/reveal_component.ts` — scene guards. `_findGrid` wrapped in
  try/catch, gated by `SCENE_MAX_CELLS = 400`. `sceneCells` wrapped
  in try/catch. Malformed payloads, oversized matrices, and any
  thrown property access fall to the empty-state message rather
  than taking the renderer down.
- `web/reveal.html`
  - Two dropdown templates (line 28 for `fpDriverOpts`, line 53 for
    `pn.driverOpts`) now render header rows vs picker rows via
    `sc-if d.isHeader` / `sc-if d.notHeader`. Headers style:
    `padding:6px 12px 2px; font-size:9px; letter-spacing:.14em;
    color:#62676f; text-transform:uppercase; cursor:default`.
    Dropdown min-width bumped 180 → 200 to fit the section labels.
- `harness/shakeout/cli_discovery.ts` — new. Reads `/api/models`,
  iterates the `cli` array, drives one turn per driver, asserts
  park + non-empty reply. Empty roster → no defects, no emits
  (honest zero-CLI case).
- `harness/shakeout/run.ts` — `cliDiscovery` registered in AXIS_A.

## observation contract

### gates verified

- `npm run typecheck` — 0 errors.
- `npm run lint` — 0 errors.
- `npm run build` — 0 errors. `dist/reveal.html` 196.03 kB
  (43.23 kB gzipped, +0.4 kB over Sprint 083; under the 60 kB
  Phase 8 budget).
- `npm run smoke:vm` — 11/11.
- `npx tsx web/vm/tools/check-vocabulary-parity.ts` — 30/30
  (`signals/0.1.json` untouched; no new tags).

### behavior gate

Playwright probe against a freshly-launched Electron on
peterlaffey@2026-09-25:

- Roster returned three groups: `cli agents` (3 entries — `claude`,
  `gemini`, `opencode`; `gemini` was still in the catalog for this
  probe, removed same day), `ollama · cloud` (8), `ollama · local`
  (9 including `qwen3-coder:480b-cloud`).
- Scene chip clicked after a driven session. Window stayed alive
  (`data-electron="1"` still on body). "no 2-D grid on this record"
  empty-state message rendered.
- Screenshots at `/tmp/sprint-084-scene.png` and
  `/tmp/sprint-084-picker.png`.

### two benign console errors observed

- `<path> attribute d: Expected moveto path command ('M' or 'm'),
  "{{ ed.d }}"` — an unrendered template placeholder in the stream
  lens's SVG path binding. Unrelated to Sprint 084's scope;
  pre-existing; filed for a follow-up polish sprint.
- `404 Not Found` on a favicon-shaped resource fetch. Also
  pre-existing.

## rubber duck pass

**Sequence narration.** `/api/models` returns the grouped shape.
`loadDriverRoster` patches `driverGroups`. `reveal.ts` mirrors it
into component state. `driverOpts`/`fpDriverOpts` interleave
headers. dc-runtime renders each row via the header-branch or
picker-branch `sc-if`. Clicking a picker row calls
`vm.pickDriver(name)` — unchanged. `signals/0.1.json` untouched;
`DRIVER_ROSTER_LOADED` still fires with `count` and `default`.

**Observations, six categories.**
- Missing pair — none.
- Order violation — none.
- Vocabulary gap — none (no new tags; grouping is a UI concern).
- Payload anomaly — none (`DRIVER_ROSTER_LOADED` payload shape
  unchanged).
- Timing surprise — none (loadDriverRoster still runs once at boot;
  no new fetch, no new race).
- Tone trace — headers use lowercase kebab labels (`cli agents`,
  `ollama · cloud`, `ollama · local`) — on the shell's plain
  register.

**Dispositions.** Clean. Zero halted. Two pre-existing console
warnings surfaced above for future cleanup (not Sprint 084 scope).

## follow-ups

- Sprint 085 — auth-prompt-in-transcript. When a chosen CLI driver
  is not authed, spawn its login command in a pty and stream the
  live stdout into a transcript card so the user completes the
  CLI's real login flow inside Substrate. Research doc:
  `process/planning/RESEARCH-2026-09-25-cli-adapter-login-flow-in-substrate-v2.md`.
- Future — API-key section of the dropdown. A separate row shape
  (KeyEntryCard) for CLIs whose auth model is a per-provider key
  paste (aider; opencode providers other than local Ollama).
  Distinct from Sprint 085 and named in the research doc.
- Future polish — the `{{ ed.d }}` unrendered SVG binding in the
  stream lens; the favicon 404. Both pre-existing; neither loads
  the current architecture.

## artifact

Card written 2026-09-25 as this file. Code lives in the commit
that lands with this sprint close.
