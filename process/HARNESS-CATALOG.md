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

**Grader invariants (v0.7.3, refreshed at sprint 038 fold).** See the
"Grader invariants — v0.7.3 shape" section below for the current list.
Historical note: the pre-037c list ran twelve checks; three
(checkTurnInsideChatWindow, checkAgentLaunchTerminate, checkChatTurnCount)
retired with the dock at v0.7.3. Two (checkViewSwitched,
checkDriverSessionBookends) landed at sprint 035 + 037a. Studio kind
runs its own EXPECTED_ORDER (10 tags) + checkStudioPairings.

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
7. **Signal grader extension**: extend `tools/capture-grade.ts`'s `EXPECTED_ORDER_SESSION` with any new session tags. The v0.7.1 TAG_SPLIT renamed view flips from `PANE_SWITCHED` to `VIEW_SWITCHED{to_view, prior_view}` with a closed set `{"desktop", "terminal"}`; `checkViewSwitched` (035) + `checkDriverSessionBookends` (035) enforce the pairing.
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

## Piece-G harnesses (sprints 034b, 035s-w, 036a-f, 037a-b)

All four items the earlier "does not exist yet" section listed now
ship — moved here by sprint 038's fold review.

### `harness/capture_rail_four_buckets.js` (sprint 034b)
Fourteen assertions. Rail mounts; four bucket headings (live sessions,
recent records, bundles, records) render in the fixed order; each
bucket fires `RECORDS_LOADED{bucket, count}` once per refresh; bundles
bucket ≥1; records bucket matches the `exclude_sessions=true` subset.
Wired at `npm run capture:rail-four-buckets`.

### `harness/capture_terminal_slash_router.js` (sprint 035s)
Twenty assertions across the seventeen slashes. Drives each slash;
asserts the paired emit and DOM effect. Zero sleeps (037c's CQ-2 fix).
Wired at `npm run capture:terminal-slash-router`.

### `harness/capture_terminal_driver_picker.js` (sprint 035t)
Twelve assertions. Header dropdown queues before session, PATCHes and
fires `DRIVER_PATCHED{driver, prior_driver}` mid-session.
Wired at `npm run capture:terminal-driver-picker`.

### `harness/capture_terminal_interrupt.js` (sprint 035u)
Seven assertions. Ctrl+C with no session prints hint; on idle-parked
session prints "no turn in flight"; with selection does NOT fire
interrupt (proven via `page.waitForRequest(interrupt, {timeout: 500})`);
without selection fires interrupt path.
Wired at `npm run capture:terminal-interrupt`.

### `harness/capture_terminal_params_drawer.js` (sprint 035v)
Sixteen assertions. Params hint shape `think X · tokens Y · timeout Zs`
(∞ when unset); `/set` slash queue-before-session; DRIVER_PARAMS_PATCHED
on PATCH ACK with correct prior; per-key validation (bad values rejected
in-place); hint resets on session close.
Wired at `npm run capture:terminal-params-drawer`.

### `harness/capture_terminal_create_controls.js` (sprint 035w)
Fifteen assertions. Five create-time slashes (`/bundle`, `/tools`,
`/workspace`, `/isolate`, `/name`) queue when no session; four v0.7
tags fire on ACK when the fields were queued; `/workspace` mid-session
prints "workspace is create-only"; manifest.name registered.
Wired at `npm run capture:terminal-create-controls`.

### `harness/capture_desktop_driver_picker.js` (sprint 036a)
Nine assertions. Picker mounts in desktop head; 20 models populate;
picker binds by sid to the newly-opened session; DRIVER_PATCHED
payload correct on flip; manifest updates; picker de-binds after
DRIVER_SESSION_ENDED.
Wired at `npm run capture:desktop-driver-picker`.

### `harness/capture_desktop_bundle_picker.js` (sprint 036b)
Eleven assertions. Six options ((none) + five shipped); BUNDLE_ATTACHED
on flip; NO TranscriptCompacted on swap (032b invariant); clear-to-(none)
sends `{bundle: null}` and lands `manifest.bundle == null`.
Wired at `npm run capture:desktop-bundle-picker`.

### `harness/capture_desktop_workspace_picker.js` (sprint 036c)
Nineteen assertions. Button-and-dialog surface (`+ new session` →
modal). Client-side validation (relative path rejected inline); real
POST /api/session; WORKSPACE_SELECTED lifted from daemon response;
badge reflects `workspace_shape`; cancel doesn't emit; session cleaned
up via POST /end.
Wired at `npm run capture:desktop-workspace-picker`.

### `harness/capture_desktop_tools_drawer.js` (sprint 036d)
Thirteen assertions. Comma-separated input; sort invariant (input
`write_file, bash, grep` → PATCH `{tools: [bash, grep, write_file]}`);
empty clears to unrestricted (daemon stores `None`); create-time
`toolsField()` registers on the 036c dialog.
Wired at `npm run capture:desktop-tools-drawer`.

### `harness/capture_desktop_isolate_toggle.js` (sprint 036e)
Thirteen assertions across three cases: flat + checked (ISOLATE_TOGGLED
fires, shape=isolate); flat + unchecked (no emit, shape=flat); worktree
selected (checkbox has `disabled` attribute + aria-label; click inert;
re-enable on flat; submit fires no ISOLATE_TOGGLED, shape=worktree).
Wired at `npm run capture:desktop-isolate-toggle`.

### `harness/e2e_session.js` (sprint 037a)
Twenty assertions. E2E composition: page load → view flip → turn 1 →
mid-session driver flip via desktop picker → driver reverted → turn 2 →
`/exit`. Substrate-side check: manifest `status: ended`; record carries
`SessionEnded{reason: "user_end", total_turns: 2}`. Bookend invariant
asserted on the live trace. Negative: SESSION_ENDED (tab-unload) does
NOT fire on `/exit`.
Wired at `npm run e2e:session`.

### `harness/capture_session_signals.js` (sprint 037b)
Signal-trace capture. Writes 23-signal trace to
`captures/sprint-037/session.jsonl`. Graded via `--kind session`:
session bookends, contains-in-order (six-tag EXPECTED_ORDER_SESSION),
VIEW_SWITCHED closed-set + desktop-render pairing (three checked),
driver-session bookends (one session, two turns).
Wired at `npm run capture:session-signals` + `npm run grade:session-signals`.

### `harness/capture_session.js` (sprint 037b)
Perceptual capture. Writes four screenshots to `screenshots/37-*.png`:
`terminal-view-empty`, `terminal-view-mid-turn`,
`desktop-view-mid-session`, `desktop-view-four-columns`. The
perceptual pass caught three UX bugs (terminal-column CSS bleed,
desktop chrome bleed into terminal, `className =` wipes) that fifteen
prior JS harnesses missed.
Wired at `npm run capture:session`.

### `tests/test_ui_control_parity.py` (sprint 036f)
Ten pytest cases. Proves the daemon's contract is deterministic per
control: two sessions given the same PATCH/POST body land byte-identical
manifest slices. Covers driver + bundle (with null clear) + tools
(sort + empty-clears) + driver_params + workspace + isolate + the
isolate-worktree mutex + a slash-router chain regression. `check:ui-parity`
runs it at the head of the `signals` gate (~5s) so a divergence fails
FAST before browser fixtures.

## Grader invariants — v0.7.3 shape

`tools/capture-grade.ts` after sprint 037c retirement + sprint 037a
addition:

1. **`checkSessionBookends`** — SESSION_INIT first; SESSION_ENDED, when present, last.
2. **`containsInOrder(EXPECTED_ORDER)`** — supersequence check per fixture-kind.
3. **`checkRecordSelectedLoaded`** — RECORD_SELECTED → RECORD_LOADED matching name within 5s (console kind only).
4. **`checkViewSwitchedRender`** — every VIEW_SWITCHED{to_view:"desktop"} paired with one of {GRAPH_RENDERED, TOPOLOGY_RENDERED, SCENE_RENDERED, IO_RENDERED} with matching subject_record within 500ms.
5. **`checkFrameMonotonic`** — frame counter never decreases across pane-render tags.
6. **`checkInspectorPayloads`** — EVENT_INSPECTED.seq non-negative; PRODUCER_INSPECTED.kind non-empty.
7. **`checkTopologyLaunch`** — TOPOLOGY_LAUNCH_REQUESTED → exactly one TOPOLOGY_LAUNCHED | LAUNCH_REJECTED matching topology_name within 5s.
8. **`checkIncidentPayloads`** — every FETCH_FAILED / LAUNCH_REJECTED / POLL_TIMEOUT carries a non-empty required payload.
9. **`checkViewSwitched`** — VIEW_SWITCHED payload closed-set check (to_view ∈ {desktop, terminal}, prior_view same set, to_view ≠ prior_view).
10. **`checkDriverSessionBookends`** — every DRIVER_SESSION_STARTED matches one DRIVER_SESSION_ENDED with same session_id; every USER_MESSAGE_INJECTED matches one PARK_LANDED with {session_id, turn_index}.
11. **`PAIRINGS`** — DIFF_REQUESTED → DIFF_RENDERED and ASSAY_SELECTED → ASSAY_REPORT_LOADED, each within 5s with matching field.

Retired at 037c (previously #7/#8/#11): checkTurnInsideChatWindow,
checkAgentLaunchTerminate, checkChatTurnCount — their premise tags
are gone from v0.7.3.

## Retired: dock harness content

The console-fixture harness `capture_signals.js` and structural
`e2e_console.js` still exist; sprint 037c trimmed their dock sections
(38 + 73 lines each) while preserving every non-dock assertion
(records, transport, graph, provenance, diff, incidents, launch,
prune, cohorts, content views).
