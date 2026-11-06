# Research — inventory for the whole-app Vocabulary Session (Step 0)

*2026-11-05. Plan: `PLAN-2026-11-05-sdd-signals-r3.md`, item 1. `grammar/BOOTSTRAP.md` Step 0: the inputs, and every place the running app acts, taken from the code at `0f0ed79`. Counts are from grep over the tracked files; each later step reads the files named here before it writes its layer.*

## Inputs

| Input | Path | Read |
|---|---|---|
| Kit | `../sdd-kit-3/` (every file, `_prior-2026-10-29/` and `example/` included) | 2026-11-05, in full |
| Runbook | `RUNBOOK-2026-10-29-project-r6.md` | 2026-11-05, in full |
| Product and design spec | `../design/received/handoff 5/README.md` (read); `docs/DESIGN-SPEC -2026-11-04- r6.md` §1–4 and the keyboard map; `docs/DESIGN-DECISIONS -through 2026-11-04-.md` | README read; the spec and decisions are read at Step 2, where view and key tags are named |
| Technical spec | the code: `web/app/`, `web/vm/`, `web/reveal/`, `electron/`, `server.py` | inventoried below; each area's files are read at the step that types it |
| Vocabulary | `web/vm/signals/versions/0.6.json` (42 tags) and `0.1`–`0.6` rationales; kernel `../substrate/process/signals/0.4.json`, `session-vocabulary.md` (v0.17) | 0.6 and its rationale read; the others at Step 1 (the kernel join) |
| Postmortems | `2026-09-28-packaging/POSTMORTEM-2026-09-28-sdd-failure-modes-sprint-089-packaging.md` (read); `2026-08-28-piece-g/…`, `2026-09-23-reveal-shell-hardening/…` (2), `2026-09-28-packaging/…-transcript-follow-bottom-regression.md`, `2026-11-04-editor-level/…-dc-runtime-never-retired-r2.md` | the sprint 089 one read; the others at Step 9, against the audit rows they bear on |

The sprint 089 postmortem already named this plan's failure on 2026-09-28: "root causes named from a diff, not from tracing the failing code path"; the check surfaces "the client code that emits the failing string, the network call that triggers it, the server code that services that call, the on-disk state that service reads. All four were skipped." Those four surfaces are what the vocabulary has to make readable.

## Where the app acts

### Window (renderer)

User input handlers in the React tree (`onClick`, `onKeyDown`, `onChange`, `onMouseDown` and the like), by file:

| File | Handlers | Emits today |
|---|---|---|
| `web/app/StudioPage.tsx` | 33 | via `validateSpec`, `buildSpec` (5 `SPEC_*` tags) |
| `web/app/Dialogs.tsx` | 14 | none |
| `web/app/PanePicker.tsx` | 9 | via `App.tsx` picker steps (4 `PICKER_*` tags, v0.6) |
| `web/app/MetaView.tsx` | 9 | none |
| `web/app/TopBar.tsx` | 8 | none |
| `web/app/RecordsPage.tsx` | 5 | none |
| `web/reveal/transcript/AuthPromptCard.tsx` | 4 | none |
| `web/app/PanesView.tsx`, `LanguageLens.tsx`, `InputBar.tsx` | 3 each | `InputBar` via `submitLine` → `TURN_SUBMITTED`, `SLASH_*` |
| `web/app/SideGraph.tsx`, `FindBar.tsx` | 2 each | none |
| `web/reveal/transcript/ToolCard.tsx`, `web/app/StreamLens.tsx`, `FirstRun.tsx`, `App.tsx`, `ActivityLine.tsx` | 1 each | none |

Window-level keys: `web/app/keymap.ts` returns 14 action kinds (`records`, `picker`, `language`, `toggle-meta`, `toggle-tools`, `split`, `toggle-find`, `settings`, `toggle-assays`, `close-find`, `close-dialog`, `close-cards`, `close-surface`, `interrupt`); none is emitted. The picker's own keys (`App.wsKey`) move, pick, fold and step back; only the picks emit (v0.6).

What the window draws: no view tag exists. The transcript rows, the pane headers, the picker's columns, the pages and the dialogs render with no record of what was drawn.

### Window (controller layer, `web/vm/`)

`SessionController` (`web/vm/session_controller.ts`): 40 methods; 45 emit sites over 38 tags. Methods with no emit: `addWorkspace`, `loadSessionsByWorkspace`, `refreshTasks`, `refreshRuns`, `refreshChildren`, `stopTask`, `refreshLanguage`, `pickControls`, `pickWorkspace`, `nameSession`, `renameSession`, `setControl`, `noteLine`, `disconnect`, `openAuthPrompt`, `attachRun` (to be confirmed per method at Step 2). `PaneRegistry` (`web/vm/pane_registry.ts`): 32 methods, no emits; it spawns, drops and focuses controllers, one per pane.

The emitter (`web/vm/instrumentation/sdd.ts`) validates tag and required fields and keeps the last 10,000 in `window.__vmSignals`. The parity check (`web/vm/tools/check-vocabulary-parity.ts`) matches `emit("…")` only and so misses `emitSignal("…")` in `App.tsx` (it reports 38 of 42 emitted).

### Electron main (`electron/main.js`, `electron/menu.js`, `electron/preload.js`)

- IPC: `native:pick-folder`, `native:open-record` (invoke); `native:close-window`, `native:signal` (send; the last is the uncommitted sink).
- Menu items with ids: 7 (`electron/menu.js`), among them New Window, Open Record (⌘O), Close Pane (⌘W), Close Window (⇧⌘W), Meta, Assays, Settings.
- Lifecycle: `app.on` for `activate`, `before-quit`, `open-url`, `second-instance`, `will-quit`, `window-all-closed`; `win.on("focus")`; `webContents.on` for `did-finish-load`, `will-navigate`.
- Server process: spawn, port bind, exit, quit wait.
- Output: 10 `log(...)` calls, free text to stderr, copied to `substrate.log` in packaged mode.

### Server (`server.py`)

30 route patterns (`/api/session`, `/api/session/<id>/…` (files, file, children, language, mcp, runs, tasks, stop), `/api/sessions/by-workspace`, `/api/workspaces`, `/api/models`, `/api/cli/…`, `/api/bundles`, `/api/records…`, `/api/assays`, `/api/topology/…`, `/api/agent`, `/api/diff`, `/api/worktree_diff`, `/api/resolve_child`, `/api/runs/clear`, `/api/applications`, `/api/session/by-name/…`); 4 verb handlers; 133 error-response sites; `log_message` silenced; 8 `print` calls (config warnings, boot notes). Session lifecycle runs through the kernel's `SessionRegistry` (create, turn, interrupt, end, append), whose effects land in the kernel record but whose refusals land nowhere.

### Kernel (`../substrate/`)

Two locked vocabularies (kernel 0.4, session 0.17) and a typed run record per session. Entities the app shares with it: Session, Turn (turn_index), Envelope (seq), Driver, Workspace, Bundle. Step 1 decides each by `ENTITY_MERGE_PROPOSED`, kernel as home.

## The size of the work

About 115 window input handlers, 14 window key actions, 72 controller and registry methods, 11 main-process event sources and 7 menu items, 30 server routes with 133 refusal sites, and the drawn surfaces (transcript, panes, picker, pages, dialogs), against 42 tags today. Steps 1–9 type them; most handlers fold into a smaller set of domain events (a user picks, opens, submits, closes), as foundation 01 asks: tags name what happened, not which button.
