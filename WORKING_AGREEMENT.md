# WORKING_AGREEMENT.md — substrate-ui

*Project-specific overrides and additions on top of `../sdd-kit-3/AGENTS.md` (imported by `CLAUDE.md` at the repo root). The Agent reads AGENTS.md first (the methodology) then this file (the project specifics). This file augments; it never overrides AGENTS.md hard rules. When the two conflict, AGENTS.md wins.*

*Current as of 2026-11-10 (the vocabulary row and footer name v0.42, 143 tags; sprint 435). The version it replaces is at `process/archive/WORKING_AGREEMENT-2026-11-08-v0.27.md` (v0.27; the v0.28 edition of 2026-11-09 was never committed); the v0.26 one at `process/archive/WORKING_AGREEMENT-2026-11-08-v0.26.md`; the v0.25 one at `process/archive/WORKING_AGREEMENT-2026-11-08-v0.25.md`; the v0.24 one at `process/archive/WORKING_AGREEMENT-2026-11-08-v0.24.md`; the v0.23 one at `process/archive/WORKING_AGREEMENT-2026-11-08-v0.23.md`; the v0.19 one at `process/archive/WORKING_AGREEMENT-2026-11-08-v0.19.md`; the v0.17 one at `process/archive/WORKING_AGREEMENT-2026-11-07-v0.17.md`; the v0.16 one at `process/archive/WORKING_AGREEMENT-2026-11-07-v0.16-s365.md`; the v0.15 one at `process/archive/WORKING_AGREEMENT-2026-11-07-v0.15.md`; the v0.14 one at `process/archive/WORKING_AGREEMENT-2026-11-07-v0.14.md`; the v0.13 one at `process/archive/WORKING_AGREEMENT-2026-11-07-v0.13.md`; the v0.12 one at `process/archive/WORKING_AGREEMENT-2026-11-07-v0.12.md`; the v0.11 one at `process/archive/WORKING_AGREEMENT-2026-11-06-v0.11.md`; the v0.10 one at `process/archive/WORKING_AGREEMENT-2026-11-06-v0.10.md`; the v0.9 one at `process/archive/WORKING_AGREEMENT-2026-11-06-v0.9.md`; the v0.8 one at `process/archive/WORKING_AGREEMENT-2026-11-06-v0.8.md`; the v0.7 one at `process/archive/WORKING_AGREEMENT-2026-11-05-v0.7.md`; the v0.6 one at `process/archive/WORKING_AGREEMENT-2026-11-05-v0.6.md`, and the one before atthe one before at `process/archive/WORKING_AGREEMENT-2026-10-11-to-2026-11-05.md`; the one before, at `process/archive/WORKING_AGREEMENT-2026-06-17-to-2026-10-11.md`, described the browser console, its Chrome harnesses and a root `signals/` folder, all retired since.*

---

## Project identity

- **Project name:** substrate-ui (the app ships as Substrate).
- **Project type:** a macOS desktop app (Electron) over the Substrate runtime. A Python HTTP daemon, `server.py`, runs sessions and serves records; the window is the reveal shell, TypeScript built by Vite.
- **Primary languages:** Python 3.12+ (`server.py`, stdlib `http.server`); TypeScript 5 (`web/`); JavaScript (`electron/`).
- **Relationship to substrate:** a separate repo that depends on the kernel as a library: `substrate.api`, the bundled topologies, and the session topology's public modules (`substrate.topologies.session`, its `vocabulary`). The kernel is bundled into the app by `npm run pack:runtime`.
- **Adopted SDD kit version:** `sdd-kit-3` (read-only canon at `../sdd-kit-3/`; earlier work ran under `sdd-kit-2`; `../sdd-kit-4/` is kept for analysis, not in use).

---

## Project class

**Desktop app / frontend** + **Backend** (per `../sdd-kit-3/TECHNIQUES.md` Section 2). Behaviour is checked in the running app, not the DOM alone: the Electron gates drive the real window (Playwright's `_electron`), and screenshots are read.

---

## Project scope (verbatim from BLACKBOARD ## Decisions)

> substrate-ui is the read + thin-control console over the Substrate runtime. It reads run records and live runs through `substrate.api` ONLY (no kernel imports), and presents: the record rail, the run-as-graph (firing-anchored Producer-instance lifespans + spawn-cohort bands), the event stream, the provenance inspector, the health verdict, record diff (first-divergence by seq), the I/O pane, and thin control (launch a bundled topology; resume a paused run; the Studio: author a Topology and build-and-launch it for real). Single-operator, dozens-of-Producers scale. Control is LAUNCH + RESUME-only (no mid-run mutation). The runtime is the source of truth; the UI is a lens, never a controller of run semantics.

*The scope above is the Decision as recorded. Since the daily-driver work (2026-08) the app also opens and drives sessions, panes and their workspaces; the release roadmap (`process/planning/ROADMAP-2026-10-11-before-distribution.md`) is the current plan.*

---

## Canonical home registry

*Per AGENTS.md hard rule 7. Consult before authoring; a new module gets its row before it lands.*

| Surface / type | Canonical home | Notes |
|---|---|---|
| HTTP daemon: sessions, turns, records, applications, models roster, `topology_graph` and other read projections | `server.py` | Sole backend. |
| Electron main process, native menu, preload bridge | `electron/main.ts`, `electron/menu.ts`, `electron/preload.ts` (TypeScript since sprint 363, `tsc -p electron` compiles them to `dist-main/`, which `package.json` `main` names) | The window, the Window and Edit menus, the server child process. |
| The window's page | `web/reveal.html` | The page shell and its Content-Security-Policy; mounts `#root`. |
| The window (React): open view, panes, focus, keys, picker, dialogs, pages | `web/app/App.tsx` and its components in `web/app/*.tsx` | Typed React, bundled from `node_modules` (shell-to-React move, sprints 199–345). |
| Pure derivations the window draws from | `web/app/derive/*.ts` | No I/O, no state; each has a spec in `web/app/__tests__/`. |
| Window stores | `web/app/state/*.ts` | `createStore` + `useSyncExternalStore`. |
| Window-level key routing | `web/app/keymap.ts` | `windowKey(ev, ctx)` returns the action. |
| Widgets that keep their own DOM | `web/app/widgets.ts` | Sprint 347. |
| The editor view: shell, columns, file tree, tab row, inspector, search, quick open | `web/app/editor/` | Phase 1 from sprint 403 (roadmap r6); the first attempt, sprints 389–402, is in `_deprecated/editor-phase-1-2026-11-09/`. |
| Bootstrap: controller registry, menu and deep-link wiring, App mount | `web/reveal.ts` | |
| The transcript (React) | `web/reveal/transcript/` (`Transcript.tsx`, `Row.tsx`, `ToolCard.tsx`, `ModelReply.tsx`, `useToolOutputMode.ts`, …) | |
| The window's signal emitter | `web/vm/instrumentation/sdd.ts` | Checks each record (`check.ts`); stamps the window's part of the record context; hands each record to main. |
| The signal checker (retired, sprint 363) | `_deprecated/signal-checker-2026-11-07/` | Replaced by the generated types: the compiler rejects a broken emit. |
| The vocabulary linter and the tags awaiting emit sites | `web/vm/tools/check-vocabulary-parity.ts` (`npm run signals`, run by the pre-commit hook), `web/vm/signals/unemitted.json` | Window, main and server; both directions; the list only shrinks (sprint 355). |
| The trace on disk: main's writer and the window's records | `electron/main.ts` (the trace writer), `electron/preload.ts` (`native.signal`) | One folder per launch under the logs folder; one file per process (plan `2026-11-05-sdd-signals` item 2). |
| The trace on disk: the server's writer | `server.py` (`_Trace`) | Writes `server.jsonl` into the folder main names (item 2); reports its losses to main on stdout, and main writes them to `main.jsonl` as `TRACE_LOST` (sprint 354). |
| The trace reader | `scripts/read_trace.py` (`tests/test_read_trace.py`; gate `harness/shakeout/trace_reader.ts`) | Prints one launch's signals from every process as one listing in foundation 02's `format_for_ai` shape, filtered by category, window, pane or session, each session's signals joined to its kernel record by seq (plan item 6, sprint 378). |
| The runtime checker | `electron/invariants.ts`, fed by `electron/main.ts` (`checkRecord`, `readServerRecords`, the 250 ms timer) | Every record main writes, its own and each window's, and each server record read from `server.jsonl`, checked against the vocabulary's ordering, timing and pairing rules; a break is an INVARIANT_BROKEN in `main.jsonl` (plan item 5, sprints 373, 375, 376). |
| Session bar line, markdown, timeline helpers | `web/reveal/activity.ts`, `web/reveal/markdown.ts`, `web/reveal/timeline.ts` | |
| Per-pane session controller (open, turns, slash commands, stream) | `web/vm/session_controller.ts` | One controller per pane (`web/vm/pane_registry.ts`). |
| Snapshot and row types | `web/vm/types.ts` | |
| Fold / unfold all tool output | `web/vm/tool_output_mode.ts` | ⌘E, `/fold`, `/unfold` (UI sprint 140). |
| Kernel names the UI reads, generated | `web/vm/envelope_kinds.gen.ts`, `web/vm/statuses.gen.ts`, `web/vm/controls.gen.ts` | Written by `scripts/gen_kinds.py` from the kernel; `tests/test_envelope_kinds_generated_096.py` fails when one is stale. Never hand-copy a kernel name. |
| substrate-ui's own signal vocabulary | `web/vm/signals/versions/current.json` → `0.42.json` (143 tags, 142 live; window, Electron main and server) + `0.42-rationale.md`, `0.41-rationale.md`, `0.40-rationale.md`, `0.39-rationale.md`, `0.38-rationale.md`, `0.37-rationale.md`, `0.36-rationale.md`, `0.35-rationale.md`, `0.34-rationale.md`, `0.33-rationale.md`, `0.32-rationale.md`, `0.31-rationale.md`, `0.30-rationale.md`, `0.29-rationale.md`, `0.28-rationale.md`, `0.27-rationale.md`, `0.26-rationale.md`, `0.25-rationale.md`, `0.24-rationale.md`, `0.23-rationale.md`, `0.22-rationale.md`, `0.21-rationale.md`, `0.20-rationale.md`, `0.19-rationale.md`, `0.18-rationale.md`, `0.17-rationale.md`, `0.16-rationale.md`, `0.15-rationale.md`, `0.14-rationale.md`, `0.13-rationale.md`, `0.12-rationale.md`, `0.11-rationale.md`, `0.10-rationale.md`, `0.9-rationale.md`, `0.8-rationale.md` and `0.7-rationale.md` (every other layer); typed proposals in `web/vm/signals/proposals.json`; earlier versions beside it | The only place a tag name or enum value is written. `scripts/gen_signals.py` generates the code's names from it (next row); `npm run signals` checks every live tag is named in the code or listed as pending. |
| The vocabulary's names in code | `web/vm/signals.gen.ts` and `electron/signals.gen.ts` (TypeScript string enums: `Signal`, one per enum field, `SignalPayloads`), `signals_gen.py` (`StrEnum`s); generated by `python3 scripts/gen_signals.py`, `--check` and `tests/test_signals_generated.py` fail when stale | Never edited by hand. Every emit names its tag and enum values through them; `emit` and `mainRecord` take only `Signal`, so a raw string fails `tsc`. |
| Unit specs | `web/reveal/__tests__/*.spec.ts` | `npm run test:unit`. |
| Python tests (real server over HTTP) | `tests/*.py` | `npm run test:py`. |
| Electron gates (the observation contract) | `harness/shakeout/*.ts`, shared helpers in `harness/shakeout/lib/` (`electron.ts`: `launchArgs`, `bindPaneAsUser`) | `npm run gates:electron`. |
| Packaging | `electron-builder.config.js`, `scripts/fetch-python-runtime.sh` | |

---

## Dependency policy

*No additions without surfacing per AGENTS.md.*

- **Backend:** Python standard library + `msgspec` + `substrate`. No web framework.
- **Frontend:** TypeScript built by Vite; React 18.3.1 and ReactDOM 18.3.1 in `dependencies`, bundled from `node_modules` as modules (sprints 329, 331; the UMD copies, `./vendor/` and `web/shims/` are retired with dc-runtime). CodeMirror 6 in `dependencies` for the editor view, pinned: `@codemirror/state` 6.7.6, `@codemirror/view` 6.43.15, `@codemirror/commands` 6.11.1, `@codemirror/language` 6.13.1, and the grammars `@codemirror/lang-javascript` 6.2.5, `lang-python` 6.2.1, `lang-json` 6.0.2, `lang-html` 6.4.12, `lang-css` 6.3.1, `lang-markdown` 6.5.2, `@codemirror/legacy-modes` 6.5.5 (sprint 419), `@replit/codemirror-vim` 6.4.0 and its peer `@codemirror/search` 6.7.2 (sprint 423), all MIT (sprint 347; the choice over Monaco is `process/planning/2026-11-04-editor-level/RESEARCH-2026-11-04-editor-level-and-modes-r8.md`). Dev dependencies are pinned in `package.json`: electron, electron-builder, @electron/notarize, typescript, vite, tsx, eslint with typescript-eslint, playwright, pixelmatch (the pixel gate, sprint 194), jsdom (the DOM for unit specs of mounted components, sprint 206), @types/jsdom, @types/node, @types/react, @types/react-dom.

---

## Tone canon — the eight-word vocabulary contract (load-bearing)

- **The eight words and nothing else for the primitives:** Producer, Bus, View, Predicate, Trigger, Route, TerminationPolicy, Topology.
- **No anthropomorphism:** never "agent", "actor", "speaker", "worker" for a Producer. (`cursor-agent` is a product's name, not a reframe.)
- **No marketing reframes:** never "workflow", "step", "task", "pipeline-stage" for the runtime concepts.
- **Sequence numbers where identification happens:** "at seq 14".
- **No emoji** in committed files.

**Standing check (before any UI close):**

```bash
grep -rEn '\bagent\b|workflow|orchestrat|\bactor\b|\bspeaker\b' server.py web/reveal.html web/partials web/reveal_component.ts web/reveal web/vm \
  | grep -viE 'cursor-agent|//|#|demo_topolog|__tests__'   # expect: zero hits in primitive-naming positions
```

Read each hit: on 2026-10-11 the eight hits were docstrings where "agent" names a CLI model (claude, codex) and the legacy `/api/agent` route, none naming a primitive.

---

## Build and verification commands

*From `substrate-ui/`. Report exit codes; do not silently retry.*

- **Build:** `npm run build` — tsc, the harness tsc, Electron main's tsc into a cleared `dist-main/`, mypy on `server.py` (`uv run --project ../substrate mypy server.py`), eslint, then Vite into `web/dist/` (the server serves `web/dist/`). Expected exit 0.
- **Generated kernel names:** `uv run --project ../substrate python scripts/gen_kinds.py` after any kernel vocabulary change; `--check` exits 1 when a file is stale.
- **Unit specs, with the signal-vocabulary check:** `npm run test:unit` — runs `npm run signals` (every `emit` names a locked tag) and then the specs. Expected exit 0.
- **Python tests:** `npm run test:py`. Expected exit 0.
- **Electron gates (the observation contract):** `npm run gates:electron`. One gate, `resume_ended_session.ts`, runs the package at `dist-electron/mac-arm64/Substrate.app`, so build the package first (below). `SHAKEOUT_APP=/Applications/Substrate.app` runs a gate against the installed app.
- **Package (signed, not notarized):** `npm run build && npm run pack:runtime && npx electron-builder --mac --config electron-builder.config.js -c.mac.notarize=false`. `pack:runtime` bundles the kernel from `../substrate`.
- **Install:** quit the running app (`osascript -e 'tell application "Substrate" to quit'`), move `/Applications/Substrate.app` to the Trash, copy `dist-electron/mac-arm64/Substrate.app` with `ditto`, clear quarantine, verify with `codesign --verify --deep --strict`. Never `pkill` by pattern: the installed app runs the same server command line.
- **Lint:** `uv run --project ../substrate ruff check server.py`; eslint runs in `npm run build`.
- **Read a launch's signals:** `uv run --project ../substrate python scripts/read_trace.py [--boot ID] [--home DIR] [--category C] [--window N] [--pane N] [--session ID]`. Without `--home` it reads the installed app's launches.
- **Commit hook** (`.githooks/pre-commit`, via `core.hooksPath`): tsc, the signal-vocabulary check, and the kernel's status-literal gate.

---

## Observation contract environment — two tracks

A behaviour-touching change is done when the trace rule holds and both tracks pass.

- **The trace rule** (plan `2026-11-05-sdd-signals` item 8, sprint 381): no sprint that adds or changes behaviour closes until its tags fire in the packaged app's trace, its failure rows under their named fixtures or planted faults. The gate asserts tag, payload and order on the trace files, read after the app closes. Every gate fails when its launch's `main.jsonl` holds an INVARIANT_BROKEN (`harness/shakeout/lib/electron.ts`), except a gate that plants them (`launchArgs({ plantsBreaks: true })`). The Rubber Duck Pass narrates the packaged trace through `scripts/read_trace.py`.

- **Track 1 — structural:** the Electron gates assert the running window: elements, the record behind them, behaviour across panes and views. A new behaviour gets a gate, and the gate is seen to fail on the old code where the old code can run.
- **Track 2 — perceptual:** screenshots of the running window, read by the agent, at the widths the user works at (a 14-inch MacBook at full screen is 1512 points; the window's minimum is a third of the screen, about 504 points) and in a split pane.

---

## External SDK bridge mappings

### Apple App Store Connect API — notarization credentials

The three non-secret identifiers Sprint 089's Section D + `electron-builder.config.js`'s `mac.notarize: true` block read from the environment. This file is the canonical home so a compact summary can never rewrite them from a plausible-looking hallucination (2026-09-28 issuer-UUID drift, filed on drift watchlist).

- **Team ID (Developer ID Application identity):** `ZVL8XB9XGU` — Green Rose Systems, LLC. The `identity` field in `electron-builder.config.js` mac block. Not a secret.
- **App Store Connect API key ID:** `C3977SD347`. Passed to `notarytool` / `electron-builder` as `APPLE_API_KEY_ID`. The value equals the substring between `AuthKey_` and `.p8` in the key filename. Not a secret.
- **App Store Connect issuer UUID:** `ce7e5b05-566f-4024-bdfc-e7de968b3218`. Passed as `APPLE_API_ISSUER`. One UUID per Apple developer organization; visible at App Store Connect → Users and Access → Integrations → App Store Connect API (top of the page). Not a secret.
- **Private key file (the ONLY secret):** `~/.appstoreconnect/private_keys/AuthKey_C3977SD347.p8`. Passed as `APPLE_API_KEY`. `chmod 600`. Never commits.
- **Invocation shape:** `APPLE_API_KEY=~/.appstoreconnect/private_keys/AuthKey_C3977SD347.p8 APPLE_API_KEY_ID=C3977SD347 APPLE_API_ISSUER=ce7e5b05-566f-4024-bdfc-e7de968b3218 npm run dist`.
- **Verification (auth alone, no submission):** `xcrun notarytool history --key <p8> --key-id <id> --issuer <uuid>` returns a list rather than HTTP 401.

If the C3977SD347 key ever rotates: the new `.p8` lands at `~/.appstoreconnect/private_keys/AuthKey_<NEW_ID>.p8`, this section gets an amended entry (never overwritten — rule 12), and `electron-builder`'s environment picks up the new `APPLE_API_KEY_ID` at the next dist run. The issuer UUID and team ID do not rotate on key rotation.

### The kernel's session vocabulary

Kinds, statuses and the Length and Tone positions come from `../substrate/process/signals/session-vocabulary.md` and its code (`substrate.topologies.session.vocabulary`), through the generated files above. substrate-ui never redeclares them.

---

## Working with the Architect

- Each ask is written into the roadmap and `process/planning/OPEN-ITEMS-2026-10-10.md` before work on it starts.
- When the Architect is trying the installed app and calling out items one at a time, finish the one item, report, and stop; do not roll into the next.
- A narrow ask changes only what it names.

---

## Post-close addenda (rule-12 shape for fold work)

When a fold-pass edit touches surfaces the closed card did not enumerate, it lands as `sprints/sprint-NNN-CLOSEOUT-ADDENDUM.md` — not as an edit to the closed card. Precedent: `sprints/sprint-033-CLOSEOUT-ADDENDUM.md` (2026-08-28).

---

## Documents

- **Records** (`BLACKBOARD.md`, `KIT_DIARY.md`): append at the end, newest last; nothing above the last entry changes.
- **Ground files** (this file, `README.md`, `CLAUDE.md`, the runbook at the repo root, the signal vocabulary): one copy, edited in place, dated on the first line; a prior version goes to `process/archive/`.
- **Working documents** (designs, plans, roadmaps, research, status reports, postmortems, reviews): one folder per piece of work, `process/planning/YYYY-MM-DD-subject/`; one round per file, never edited; a new round names the file it supersedes, and the old round moves to the folder's `superseded/`. `process/planning/README.md` lists every piece of work, its status and its sprints.
- **Sprint cards** (`process/sprints/`): `status:` is one of `pending`, `active`, `closed`, `closed-partial`, `reverted`, `withdrawn`, `superseded`.
- **Read the current set:** `process/planning/README.md`, the folders it marks open, the ground files, `tail -n 60 BLACKBOARD.md`, and every decision with `grep -nE '^- \*\*[0-9-]{10} (user|agent-resolved)\*\*' BLACKBOARD.md`. Open anything else only when a current document points to it.
- **Names:** `TYPE-YYYY-MM-DD-subject.md`, later rounds `-r2`, `-r3`; files already on disk keep their names. Nothing is deleted. Another project's files live in that project.

---


## Hand-author log (hard rule 10)

| Date | Sprint | What was bypassed | Why |
|---|---|---|---|
| 2026-11-10 | 431 | Hard rule 6: `derive/follow.ts` and its spec, `derive/inspector.ts`, `editor/EditorView.tsx`, `editor/Centre.tsx`, `editor/FileTree.tsx`, `state/editor.ts`, `App.tsx`, the anchor and its spec, `electron/invariants.ts` and its spec, the vocabulary; gate `editor_follow.ts`. | A followed edit is read from the record, marked in the centre or the tree, recorded by App and the anchor, and checked by S10 in main; the call-id fix is the derivation both the follow and the inspector use. |
| 2026-11-09 | 430 | Hard rule 6: `editor/EditorView.tsx`, `editor/Inspector.tsx`, `MetaView.tsx`, `state/meta.ts`, `state/editor.ts`, the footer and its spec, `keymap.ts` and its spec, `App.tsx`, the anchor and its spec, `follow_bottom.ts`, the vocabulary; gate `editor_record.ts`. | The column reuses meta's lenses, its swap is a key, a chip and a record, ◂ crosses from the inspector to meta's selection, and the footer and anchor draw the state. |
| 2026-11-09 | 429 | Hard rule 6: `derive/inspector.ts` and its spec, `editor/Inspector.tsx`, `editor/Centre.tsx`; gate `editor_history.ts`. | The lit row and the step texts are the inspector's derivation, the step is written by the centre's save, and Undo reaches the centre only. |
| 2026-11-09 | 428 | Hard rule 6: `editor/Inspector.tsx`, `editor/Centre.tsx`, `state/editor.ts`, `keymap.ts` and its spec, `App.tsx`, the vocabulary; gate `editor_find.ts`. | The section's fields are the inspector's, the query and its marks live in the centre's buffer, and ⌘F reaches them only through the key map and App. |
| 2026-11-09 | 427 | Hard rule 6: `server.py` and its test, `state/settings.ts`, `editor/bindings.ts`, `editor/Centre.tsx`, `editor/EditorView.tsx`, `editor/StatusLine.tsx`, `state/editor.ts`, `App.tsx`, `derive/anchor.ts` and its spec, the vocabulary, four gates and the harness helper. | Removing read-only touches every place it was drawn, recorded and enforced; saving with the session off needs the server's write and the editor's save together; the default binding changes the gates that typed vim keys. |
| 2026-11-09 | 426 | Hard rule 6: `electron/menu.ts`, `electron/preload.ts`, `web/reveal.ts`, `state/shell.ts`, `App.tsx`, `editor/Centre.tsx`, the vocabulary files; gate `editor_undo.ts`. | Edit ▸ Undo reaches the window only through menu, preload, the boot script's command list and App, and the buffer it undoes is the centre's. |
| 2026-11-09 | 425 | Hard rule 6: `editor/Centre.tsx`, `editor/bindings.ts`, `editor/StatusLine.tsx`, `editor/EditorView.tsx`, `state/editor.ts`, `state/shell.ts`, `App.tsx`, `derive/anchor.ts` and its spec, `electron/menu.ts`, `electron/preload.ts`, `web/reveal.ts`, the vocabulary files; gate `editor_save.ts`. | File ▸ Save reaches the window only through menu, preload, the boot script's command list and App; the three save commands share the centre's one save; the offer's state is drawn by the centre and recorded by App and the anchor. |
| 2026-11-09 | 424 | Hard rule 6: `editor/StatusLine.tsx` and `derive/status_line.ts` (new) with its spec, `derive/inspector.ts`, `derive/anchor.ts` and its spec, `editor/Centre.tsx`, `editor/bindings.ts`, `editor/EditorView.tsx`, `state/editor.ts`, `App.tsx`, the vocabulary files, the pixel reader; gate `editor_status.ts`. | The status line's mode comes from the binding, its position and count from the centre, its record from App's EDITOR_DRAWN and the anchor's third row, which the reader decodes; the marks recount shares the count's diff. |
| 2026-11-09 | 423 | Hard rule 6: `editor/bindings.ts` (new), `editor/Centre.tsx`, `editor/EditorView.tsx`, `state/settings.ts`, `Dialogs.tsx`, `state/editor.ts`, `state/shell.ts`, `keymap.ts` and its spec, `App.tsx`, `package.json`; gate `editor_editing.ts`. | The binding is a setting (store, dialog) that the centre applies; vim's Escape and nano's ⌃X need the key map and App's handler; the unsaved list lives in the editor store; none edits without the rest. |
| 2026-11-09 | 422 | Hard rule 6: the inspector component, its derivation and spec, the anchor and its spec, `EditorView.tsx`, `Centre.tsx`, `state/editor.ts`, `App.tsx`, `unemitted.json`, the pixel reader and the gate. | The inspector's counts reach EDITOR_DRAWN (App) and the anchor (EditorView) only through the store, the outline and caret come from the centre, and the anchor's second row is checked only by the reader that decodes it; the attribution fix is the derivation the component draws. |
| 2026-11-09 | 416 | Hard rule 6: eight files (`electron/menu.ts`, `electron/preload.ts`, `web/app/state/shell.ts`, `web/reveal.ts`, `App.tsx`, `state/editor.ts`, `editor/EditorView.tsx`, `editor/sizes.ts` and its spec). | A View item reaches the window only through menu, preload, the boot script's command list and App's handler, as Meta and Assays do; the three layout commands share that path and the view's one layout. |
| 2026-11-09 | 415 | Hard rule 6: six files (`keymap.ts` and its spec, `state/editor.ts`, `editor/EditorView.tsx`, `App.tsx`, `InputBar.tsx`). | The fold keys are the key map's, the fold state is read by App's EDITOR_DRAWN and drawn by the view, and the sill needs the input bar's compact padding; none works without the rest. |
| 2026-11-09 | 410 | Hard rule 6: four window files (`editor/FileTree.tsx`, `state/editor.ts`, `editor/EditorView.tsx`, `App.tsx`). | The tree's row count reaches EDITOR_DRAWN, which App writes, only through a store, and the tree needs the session and workspace App holds. |
| 2026-11-09 | 409 | Hard rule 6: five window files (`App.tsx`, `state/chrome.ts`, `derive/footer.ts`, `Footer.tsx`, `footer.spec.ts`). | The editor's footer hint reaches the footer only through the chrome store App writes, so the chip, the store field, the derivation, the footer and its spec change together. |
| 2026-11-08 | 375 | Hard rule 6: three files (`electron/invariants.ts`, `electron/main.ts`, `scripts/gen_signals.py`). | The timing rules' windows come from the vocabulary through the generator, and main's timer is what finds a wait no record ends; the checker alone cannot break a timing rule. |
| 2026-11-07 | 372 | Hard rule 6: three page files (`RecordsPage.tsx`, `AssayPage.tsx`, `StudioPage.tsx`). | `PAGE_DRAWN` is one tag whose rows each page counts from its own state. |
| 2026-11-07 | 371 | Hard rule 6: four window files (`session_controller.ts`, `pane_registry.ts`, `reveal.ts`, one call in `App.tsx`). | `attachRecordRoot` now requires `how`, so each of its callers and the registry's forwarder pass it. |
| 2026-11-07 | 370 | Hard rule 6: three window files (`session_controller.ts`, `AuthPromptCard.tsx`, one prop in `Row.tsx`). | The sign-in's start is decided in the controller and its end in the card, which needs its pane from `Row`. |
| 2026-11-07 | 368 | Hard rule 6: three window files and a spec (`state/meta.ts`, `MetaView.tsx`, two calls in `App.tsx`, `meta.spec.ts`). | `setMode` now takes the pane and its session, so each of its three callers and the spec pass them. |
| 2026-11-07 | 365 | Hard rule 6: three window files (`state/dialogs.ts`, `Dialogs.tsx`, one line of `App.tsx`). | `closeDialog` now requires its outcome, so each caller supplies one; Escape's caller is in `App.tsx`. |
| 2026-11-07 | 364 | Hard rule 6: four files (`electron-builder.config.js`, `package.json`, `server.py`, this file's build line). | The packaging fix and the server's type check close the same gap left by sprint 363, which shipped `signals_gen.py` with no packager entry and no type checker; mypy cannot join the build until its 12 errors are fixed. |
| 2026-11-07 | 363 | Hard rule 6: one card covered Electron main's move to TypeScript, the generator, the typed emitters in three processes, every emit call site, the checker's removal and the gates that used it. | A call site moved to generated names compiles only once its emitter is typed, and an emitter typed by tag leaves the runtime checker nothing to check; the parts do not stand alone. |
| 2026-11-06 | 358 | Hard rule 6: three files (`session_controller.ts`, `Row.tsx`, `Transcript.tsx`). | A skip without its draw, or a draw without its fold, leaves T4 unanswerable; the scroll tag was split off to sprint 359. |
| 2026-11-06 | 355 | Hard rule 6 (two files a sprint): one card covered the vocabulary change, the shared checker specification, the three checkers, the build posture in each process, the linter and the gates, about twenty files. | The three checkers implement one specification and one test runs it against all of them, so a split would have left two of the three processes unchecked between sprints and the cross-run test without its subjects. The dual and observation contracts applied to the whole. |

*WORKING_AGREEMENT.md for substrate-ui, current 2026-11-10. An Electron app over the Substrate kernel. Own signal vocabulary at `web/vm/signals/versions/current.json` (v0.42, 143 tags); kernel names reach the UI only through generated files. The eight-word tone canon binds user-facing strings.*
