# HARNESS-CATALOG.md — substrate-ui test harnesses + tooling

*Instantiated 2026-08-28 (per Architect directive during piece-G planning). Every
Playwright script, screenshot capture, signal capture, grader, and vocab tool in
one place so the next sprint reuses instead of reinventing. Read this before
writing a piece-G harness.*

**Runtime pattern.** Every harness spins real Chrome via `playwright` (repo-local
devDependency, `channel:"chrome"`, no browser download), points at
`http://127.0.0.1:8765` (overridable via `UI_BASE`), and drives the real backend.
No mocks anywhere.

**Two-track observation contract** (AGENTS.md hard rule 9; TECHNIQUES.md
Visual/UI). Every UI-touching sprint runs BOTH: structural (DOM assertions,
`e2e_*.js`) AND perceptual (screenshots viewed by the agent, `capture_*.js`).
Failure mode named on the BLACKBOARD 2026-06-17: "graded file contents while
the app produced silent audio." Never again.

**Signal-trace track** (Sprints 021-032). `capture_signals.js` /
`capture_studio_signals.js` drive scripted paths, dump `window.__signals` to
JSONL under `captures/sprint-021/`, then `tools/capture-grade.ts` validates the
trace against invariants (contains-in-order, pairing with staleness-drop,
payload content, session bookends, frame monotonicity).

---

## Structural E2E harnesses (`harness/e2e_*.js`)

Each returns exit 0 on all DOM assertions green, exit 1 on any fail. Wired into
`package.json` scripts.

| File | Script | Surface tested | Key assertions |
|------|--------|----------------|----------------|
| `e2e_console.js` | `npm run e2e` | The full console: rail, run-as-graph, provenance, seq-cursor, verdict, diff, I/O, launch, live-follow, resume, scene panel, replay transport, terminal, agent chat, content views | 30+ checks. Boots to zero console errors, records load, code_review graph shows 6 lanes + 5-concurrent cohort band + 2 cancelled reviewers, verdict badges (FINALISED / FAILED / PAUSED / NOT CLEAN / LIVE / INCOMPLETE), diff-first-divergence, launch-then-follow, resume without false-NOT-CLEAN flicker, torn record ≠ live, terminal cat/narrate, chat multi-turn against deterministic driver |
| `e2e_studio.js` | `npm run e2e:studio` | `/studio.html` authoring surface | Fills reviewer/judge spec, validates, builds a REAL run, follows the console deep-link, asserts the authored run's Verdict exists |
| `e2e_assay.js` | `npm run e2e:assay` | Assay arm-matrix view (sprint 014) | ASSAYS rail group, four arm rows, both currencies (pass^k + pass@1), compute column, plain-language verdicts. Env: `ASSAY=<name>` overrides default `coding_cells` |
| `e2e_delegate.js` | `npm run e2e:delegate` | Delegate parent→child branch (sprint 017, W2.2) | Selects demo_delegate, switches to I/O, asserts delegate ToolResult renders navigable child branch, clicks into child, asserts breadcrumb, clicks back |

**Common pattern.** All four use `maybeCaptureTail(page, name)` from
`lib/capture-tail.js` — dumps `window.__signals` to
`captures/e2e-<name>.jsonl` when `CAPTURE_SIGNALS=1`; no-op otherwise. Free
signal-trace on any structural run.

---

## Perceptual screenshot captures (`harness/capture_*.js`)

Save PNGs under `screenshots/` (gitignored). The agent then `Read`s each PNG
and grades the VISIBLE surface. Two-track's perceptual half.

| File | Script | What it captures |
|------|--------|-------------------|
| `capture_console.js` | `npm run capture` | 11+ key console frames — boot, code_review with graph, provenance inspector, cursor scrubbed, demo_failed / demo_paused / demo_broken verdicts, diff, I/O, scene panel |
| `capture_states.js` | `npm run capture:states` | Dynamic + edge states the static pass misses — live `● LIVE` pulse mid-write, torn record's amber INCOMPLETE, resume result with interrupted stage bar, event-click inspector (distinct from lane-click), seq-cursor at start edge |
| `capture_studio.js` | `npm run capture:studio` | Studio authoring surface key frames — filled form, validated, built |
| `capture_scene.js` | `npm run capture:scene` | **Deterministic pixel-anchor decode.** Screenshots `.scene-grid`, reads each cell center's pixel, classifies alive (green) vs dead, reconstructs the grid, asserts equality with the record's real `Generation.grid`. **Mechanical decode, not vision-model.** Catches transpose / miscolor / missing-cell render bugs. Blinker mirror-symmetric limitation noted (glider fixture closes it) |
| `capture_assay.js` | `npm run capture:assay` | Assay arm matrix — both currencies legible, margin-verdict colored, provenance pinned. Env: `ASSAY=<name>` |
| `capture_delegate.js` | `npm run capture:delegate` | Element screenshots of the bounded I/O pane at two frames: parent with delegate branch, child with breadcrumb |
| `capture_toolchain.js` | (no script) | Console screenshot for a specific record. Env: `RECORD=<name>`, `OUT=<path>` |

---

## Signal-trace captures + graders

| File | Script | Role |
|------|--------|------|
| `capture_signals.js [sprint-id]` | `npm run capture:signals` | Drives console through the full flow (records, record-load, view toggles, cursor + transport, prune). Dumps `window.__signals` to `captures/sprint-<id>/console.jsonl`. Default sprint 021 |
| `capture_studio_signals.js` | `npm run capture:studio-signals` | Drives `/studio.html` through one authoring round-trip. Dumps to `captures/sprint-021/studio.jsonl` |
| `tools/capture-grade.ts <path> [--kind console|studio]` | `npm run grade:signals` / `npm run grade:studio-signals` | Reads a JSONL trace, grades against invariants. |
| — | `npm run signals` | Chains all four: parity + capture console + grade console + capture studio + grade studio |

**Grader invariants** (`tools/capture-grade.ts`). Console kind runs eight checks:

1. **`checkSessionBookends`** — `SESSION_INIT` must be first; `SESSION_ENDED`, when present, must be last.
2. **`containsInOrder(EXPECTED_ORDER)`** — the console fixture must be a supersequence of ~40 named tags in order.
3. **`checkRecordSelectedLoaded`** — every `RECORD_SELECTED` followed by exactly one matching-name `RECORD_LOADED` within 5s, staleness-drop enforced.
4. **`checkViewSwitchedRender`** — every `PANE_SWITCHED{to_pane: V}` followed by the matching pane-render tag with matching `pane_id` and `subject_record` within 500ms.
5. **`checkFrameMonotonic`** — `frame` counter never decreases across pane-render tags.
6. **`checkInspectorPayloads`** — `EVENT_INSPECTED.seq` non-negative; `PRODUCER_INSPECTED.kind` non-empty.
7. **`checkTurnInsideChatWindow`** — every `TURN_SUBMITTED` inside a `CHAT_ENTERED → CHAT_EXITED` window.
8. **`checkAgentLaunchTerminate`** — `AGENT_LAUNCH_REQUESTED → AGENT_LAUNCHED | LAUNCH_REJECTED{kind:agent}` within 1s; `AGENT_LAUNCHED → exactly one FINAL_ANSWER_RENDERED | POLL_TIMEOUT` with matching `run_name`.
9. **`checkTopologyLaunch`** — `TOPOLOGY_LAUNCH_REQUESTED → exactly one TOPOLOGY_LAUNCHED | LAUNCH_REJECTED` within 5s, matching `topology_name`.
10. **`checkIncidentPayloads`** — every `FETCH_FAILED` / `LAUNCH_REJECTED` / `POLL_TIMEOUT` carries a non-empty required payload.
11. **`checkChatTurnCount`** — `CHAT_EXITED.turns_in_conversation` equals `2 * TURN_SUBMITTED count` (normal) or `2 * count - 1` (in-flight).
12. **`PAIRINGS`** — `DIFF_REQUESTED → DIFF_RENDERED` within 5s matching subject; `ASSAY_SELECTED → ASSAY_REPORT_LOADED` within 5s matching name.

Studio kind runs its own EXPECTED_ORDER (10 tags) + `checkStudioPairings` (`SPEC_VALIDATE_REQUESTED → SPEC_VALIDATED` within 5s; `SPEC_BUILD_REQUESTED → SPEC_BUILT | SPEC_BUILD_REJECTED` within 30s).

---

## Vocabulary tooling (`tools/*.ts`)

| File | Script | Role |
|------|--------|------|
| `check-vocabulary-parity.ts` | `npm run check:vocab-parity` | Parses `signals/versions/current.json`, validates internal consistency (categories declared, strata declared, tag payloads well-formed), walks `web/` + `harness/` + `tools/` for `emit("TAG", ...)` call sites, asserts every emitted tag exists in the lock. Exit 1 on drift |
| `sync-substrate-vocab.ts` | `npm run sync:substrate-vocab` | Copies `../substrate/process/signals/0.2.json` into `signals/mirror/substrate-0.2.json`. Prints fresh sha256. Refreshes the `SUBSTRATE_KINDS` closed set that `web/instrumentation/sdd.ts` cross-checks |

---

## Interactive helpers

| File | Script | Role |
|------|--------|------|
| `open_assay.js` | (no script — `node harness/open_assay.js`) | Opens the console in a VISIBLE Chrome window (headed, not headless), lands on the assay arm matrix. Stays open until the window closes. Env: `ASSAY=<name>` |

---

## Fixture directory conventions

- `screenshots/` — PNGs from `capture_*.js`. Gitignored. Agent reads via `Read <file>.png` for perceptual grading.
- `captures/sprint-<NN>/` — signal-trace JSONLs. `console.jsonl` from `capture_signals.js`; `studio.jsonl` from `capture_studio_signals.js`. `sprint-021` is the canonical location; sprint 032 co-located the studio fixture there deliberately.
- `captures/e2e-<name>.jsonl` — signal-trace tail from an `e2e_*.js` harness run with `CAPTURE_SIGNALS=1`. Ephemeral; each run overwrites.
- `runs/` — server-generated launch records. Prune via the UI's `clear` affordance or `POST /api/runs/clear`.

## REFREEZE

`REFREEZE=1 npm run capture:signals` / `REFREEZE=1 npm run capture:studio-signals` bumps the committed fixture. Ordinary runs diff against the committed fixture; a diff fails the grader. Deliberate re-freeze is the only way to change a locked trace.

---

## How to write a piece-G harness

Piece G ships `harness/e2e_session.js` (tech spec §10 line 20). Adopt these
patterns:

1. **Base URL**: `const BASE = process.env.UI_BASE || "http://127.0.0.1:8765"`.
2. **Launch shape**: `chromium.launch({ channel: "chrome", headless: true })`.
3. **DOM error trap**: `p.on("pageerror", (e) => errors.push(String(e.message)))` and assert `errors.length === 0` at the end.
4. **Fail collection**: push to a `fails[]` array via a `check(cond, msg)` helper; exit 1 if `fails.length > 0`.
5. **Signal-trace tail**: `const { maybeCaptureTail } = require("./lib/capture-tail")`; call at end. Runs iff `CAPTURE_SIGNALS=1`; no-op otherwise.
6. **Perceptual pair**: `harness/capture_session.js` (or a new `capture:` script for piece G) screenshots the DOM states named in the sprint's observation contract. Agent reads each PNG.
7. **Signal grader extension**: extend `tools/capture-grade.ts`'s `EXPECTED_ORDER` with piece-G tags (`DRIVER_SESSION_STARTED`, `USER_MESSAGE_INJECTED`, `PARK_LANDED`, `DRIVER_SESSION_ENDED`); update `VIEW_TO_PANE_ID` if piece G adds `terminal` / `desktop` values to `PANE_SWITCHED.to_pane`.
8. **`package.json` script**: add `"e2e:session": "node harness/e2e_session.js"` and wire into `signals` if the fixture becomes part of the standing gate.

---

### capture_view_toggle.js (sprint 033)

**Purpose:** exercises the two-view scaffold — desktop ⇄ terminal flip via the header toggle and Ctrl+`.
**Kind:** structural + signal-trace + perceptual (two-frame). Twelve assertions.
**Drives:** click `#view-toggle`, press Ctrl+`, restore focus after round-trip.
**Asserts:** initial `#view-desktop.active`; `STATE.view` transitions; `PANE_SWITCHED{to_pane, prior_pane}` with `to_pane` ∈ `{"terminal","desktop"}`; focus preservation across a mouse-toggle cycle.
**Emits used:** `PANE_SWITCHED` (v0.6, extended `to_pane` value set in sprint 033).
**Writes:** `screenshots/33-desktop-view-console.png`, `screenshots/33-terminal-view-empty.png`.
**Run:** `node harness/capture_view_toggle.js` (server on :8765).

### capture_terminal_session.js (sprint 035)

**Purpose:** exercises the new terminal column + piece-B session endpoints end-to-end.
**Kind:** structural + signal-trace + perceptual (two-frame) + session-fixture writer. Fifteen assertions.
**Drives:** flip to #view-terminal, type "hello" + Enter (opens session on first turn), type "again" + Enter, /exit.
**Asserts:** DRIVER_SESSION_STARTED shape, USER_MESSAGE_INJECTED shape, PARK_LANDED after each turn, DRIVER_SESSION_ENDED on /exit, session_id stable across bookends, no page errors.
**Emits used:** DRIVER_SESSION_STARTED, USER_MESSAGE_INJECTED, PARK_LANDED, DRIVER_SESSION_ENDED (v0.6+).
**Writes:** `screenshots/35-terminal-view-post-user-message.png`, `screenshots/35-terminal-view-post-model-reply.png`, `captures/sprint-035/terminal-session.jsonl`.
**Run:** `node harness/capture_terminal_session.js` (server on :8765).
**Grader:** `npx tsx tools/capture-grade.ts captures/sprint-035/terminal-session.jsonl --kind session`.
**Wired into `npm run signals`:** yes (via `capture:terminal-session` + `grade:terminal-session`).

## What DOES NOT exist yet (piece-G territory)

- `harness/e2e_session.js` — the session-shape harness the tech spec names.
- `harness/capture_session.js` — perceptual pair (name pending).
- `harness/capture_session_signals.js` — signal-trace capture for the session path.
- `test_ui_control_parity.py` — Python-side assertion that every UI control produces the same session state as its CLI counterpart (tech spec §10).

Piece G's sprint chain adds these; do not reinvent the wiring above them.
