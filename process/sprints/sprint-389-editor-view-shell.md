# Sprint 389 — ⌘⇧E opens the editor view shell; ⌘⇧E returns to the pane

```yaml
---
id: 389
status: reverted
phase: code editor, phase 1
pass_kind: functional
---
```

## scope

⌘⇧E toggles the editor view on the focused pane. The menu item sends `"toggle-editor"` through the shell command channel. App.tsx receives it, flips `editorOpen` on the focused `AppPane`, and renders `EditorShell` — an empty three-column container (left, centre, right) with the transcript and input bar below. Closing emits EDITOR_CLOSED and restores the pane's terminal view. A pane with no session ignores the key.

Four files touched instead of two. The coupling: the menu item in `menu.ts`, the command type in `shell.ts`, the handler in `App.tsx`, and the new component in `editor/EditorShell.tsx` form one circuit — removing any one leaves the feature dead.

Five signals fire across one open-close cycle: EDITOR_OPENED, EDITOR_DRAWN, PANE_DRAWN(state=editor) on open; EDITOR_CLOSED, PANE_DRAWN(state=session) on close. The EDITOR_DRAWN payload carries initial state (tab_count 0, no columns folded, the default binding, showing spine, left_tab files).

## prerequisites

- Sprint 388 (vocabulary v0.27 → v0.28 completed in this session, not as a sprint card; the v0.28 vocabulary and its generated code must exist before this sprint runs).

## context_files

- `sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json` (vocabulary v0.28)
- `BLACKBOARD.md`
- `WORKING_AGREEMENT.md`
- `web/app/App.tsx` (the command handler at line 682, AppState/AppPane at line 140, render at line 1094)
- `web/app/state/shell.ts` (ShellCommand union at line 39)
- `electron/menu.ts` (View submenu, the `send` pattern)
- `web/app/derive/open_view.ts` (ViewState — the editor is pane-level, not here)
- `web/app/keymap.ts` (KeyContext, for later sprints; read to confirm no ⌘⇧E conflict)
- `web/vm/instrumentation/sdd.ts` (emit pattern)
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r4.md`

## signal contract

### Emits

- `EDITOR_OPENED` (binding)
- `EDITOR_CLOSED` (tab_count: 0)
- `EDITOR_DRAWN` (tab_count: 0, left_folded: false, right_folded: false, bottom_folded: false, binding, showing: "spine", left_tab: "files")
- `PANE_DRAWN` (state: "editor") — on open
- `PANE_DRAWN` (state: "session") — on close, returning to the terminal

### Consumes

- The shell command `"toggle-editor"` from the menu's IPC.
- `AppPane.editorOpen` (new field) to decide the render branch and the PANE_DRAWN state.
- The pane's session binding (defaulted; the setting comes in Phase 2).

### Invariants

- VIEW_CHANGED does not fire on editor open or close (the editor is pane-level; `ViewState.view` stays `"panes"`).
- ⌘⇧E on a pane with no session (unbound, no `sessionId` in snapshots) is a no-op.
- No path or text in any emitted record (E1).
- The locked vocabulary file is not modified.
- Existing keys (⌘M, ⌘E, ⌘D, ⌘⇧D, ⌘3, ⌘,) keep their behaviour.

## artifact contract

### Files created

- `web/app/editor/EditorShell.tsx` — the three-column layout component. Takes `paneId` as prop. Renders three `div` containers (left column, centre, right column) in a flex row, with nothing inside them yet. Background matches the app (#212327). Each column has a `data-editor-column` attribute for the gate.

### Files modified

- `web/app/App.tsx` — `AppPane` gains `editorOpen: boolean` (default false). The `onCommand` handler gains the `"toggle-editor"` branch, which flips `editorOpen` on the focused pane when the pane has a session, emits EDITOR_OPENED or EDITOR_CLOSED, and emits PANE_DRAWN with the new state. The render method gains a branch: when `fp.editorOpen` is true and `showTerminal` is true, render `EditorShell` instead of `PanesView`. EDITOR_DRAWN emits from `componentDidUpdate` when `editorOpen` changes.
- `web/app/state/shell.ts` — `ShellCommand` union gains `"toggle-editor"`.
- `electron/menu.ts` — View submenu gains an "Editor" item with accelerator `CmdOrCtrl+Shift+E`, dispatching `send(getWin(), "toggle-editor")`.
- `WORKING_AGREEMENT.md` — canonical home registry gains a row for `web/app/editor/` ("The editor view: shell, columns, file tree, tab row, inspector, search, quick open").
- `electron/preload.ts` — `ipcRenderer.on("menu:toggle-editor", ...)` line (the menu's IPC channel).
- `web/reveal.ts` — `"toggle-editor"` added to the command dispatch guard at line 100.
- `web/vm/signals/unemitted.json` — 13 editor tags awaiting emit sites.

### Content assertions

- `web/app/editor/EditorShell.tsx` exports a React component named `EditorShell`.
- `web/app/state/shell.ts` contains `"toggle-editor"`.
- `electron/menu.ts` contains `CmdOrCtrl+Shift+E`.
- `web/app/App.tsx` contains `editorOpen`.
- `WORKING_AGREEMENT.md` contains `web/app/editor/`.
- `npm run build` returns 0 (TypeScript compiles).
- `npm run signals --check` returns 0 or the new tags are listed in `unemitted.json` (emit sites are wired but may need the generated code regenerated first).

### Command exit codes

- `npx tsc --noEmit` returns 0
- `npm run build` returns 0

## observation contract

### UI driving steps

From the packaged app (or source via `npm start`):

1. Launch with one pane. The pane starts at its picker.
2. Bind a session (any workspace).
3. Press ⌘⇧E.
4. The pane shows the editor shell: three empty columns in a flex row.
5. Press ⌘⇧E again.
6. The pane returns to the terminal transcript.

### Expected log substrings

In `server.jsonl` or the window's trace: none (editor signals are window-side, in the window's trace file).

### Expected runtime signals

In the window's trace, for one open-close cycle on pane 1:

- `EDITOR_OPENED` with `binding` (the default, "vim" or "nano" per whatever the initial default is).
- `EDITOR_DRAWN` with `tab_count: 0`, `left_folded: false`, `right_folded: false`, `bottom_folded: false`, `showing: "spine"`, `left_tab: "files"`.
- `PANE_DRAWN` with `state: "editor"`, `pane_id: 1`.
- `EDITOR_CLOSED` with `tab_count: 0`.
- `PANE_DRAWN` with `state: "session"`, `pane_id: 1`.

### Expected screenshot / visual state

- After step 4: three side-by-side containers visible (left, centre, right), each empty, background #212327 or close. The transcript and input bar are absent (they move to the bottom panel in a later sprint; for this sprint the editor shell replaces PanesView entirely while open).
- After step 6: the terminal transcript and input bar are visible again.

### Edge case

- On a pane with no session (unbound), ⌘⇧E produces no EDITOR_OPENED, no PANE_DRAWN change, and the pane stays at its picker.

## done criteria

⌘⇧E toggles between the terminal and an empty three-column editor shell on a pane with a session, with EDITOR_OPENED, EDITOR_CLOSED, EDITOR_DRAWN, and PANE_DRAWN firing at the right moments, and the build passing.

## notes

The editor shell replaces `PanesView` in the render tree while open. The transcript and input bar below the editor columns come in a later sprint (the bottom panel with its collapsible sill). For this sprint, the editor view is a full-height replacement — the terminal disappears and the empty columns appear, then ⌘⇧E restores the terminal.

The default binding is "vim" (the roadmap names vim first; the setting to choose comes in Phase 2). EDITOR_DRAWN's `showing` starts at "spine" (the inspector's default); `left_tab` starts at "files" (the tree). These are initial values; the columns are empty containers with no tree or inspector content yet.

The generated signal code (`npm run signals:gen` or equivalent) must include the v0.28 tags before this sprint's TypeScript compiles. If the generated files are stale, regenerate them as a prerequisite step, not as part of the sprint's scope.

## self-review checklist

- [x] Scope is concrete and bounded: one toggle, one component, five signals.
- [x] `context_files` covers App.tsx, shell.ts, menu.ts, open_view.ts, keymap.ts, the vocabulary, the roadmap.
- [x] Signal contract's Emits list references tags in v0.28: EDITOR_OPENED, EDITOR_CLOSED, EDITOR_DRAWN, PANE_DRAWN.
- [x] Artifact contract is gradable: content assertions are grep-checkable, command exit codes named.
- [x] Observation contract is present (functional sprint).
- [ ] Sprint sweet spot: 7 files modified + 2 created, above the ≤2 target. The command path crosses menu.ts → preload.ts → reveal.ts → shell.ts → App.tsx → EditorShell.tsx, plus unemitted.json and WORKING_AGREEMENT.md. Each link is one line; removing any leaves the feature dead. Logged here per hard rule 10.

## result

- **Checks:**
  - `npx tsc --noEmit` returns 0.
  - `npm run build` returns 0 (TypeScript, mypy, eslint, Vite all clean).
  - `npm run signals` returns 0 (vocabulary 0.28, 116 emitted, 13 awaiting).
- **Gate:** `editor_toggle_signals` passes all six checks:
  - toggle-editor on an unbound pane: no-op (no EDITOR_OPENED, no editor shell in DOM).
  - Editor shell visible with 3 columns after open.
  - EDITOR_OPENED (binding=vim), EDITOR_DRAWN (tab_count=0, columns unfolded, showing=spine, left_tab=files), PANE_DRAWN(state=editor) all fired.
  - Editor closed, PanesView returns.
  - EDITOR_CLOSED (tab_count=0) and PANE_DRAWN(state=session) fired.
  - E1: no path or text in any editor signal.
- **Rubber Duck Pass** on the gate's window trace, for one session on pane 1:
  - PANE_DRAWN state=picker, PANE_BOUND binding=session: the pane bound a session through the picker.
  - EDITOR_OPENED binding=vim: the editor view opened on the bound pane; the default binding is vim.
  - EDITOR_DRAWN tab_count=0, left_folded=false, right_folded=false, bottom_folded=false, binding=vim, showing=spine, left_tab=files: the structural state at open — empty, all columns unfolded.
  - PANE_DRAWN state=editor: the pane's drawn state changed from session to editor.
  - EDITOR_CLOSED tab_count=0: the editor closed with no open tabs.
  - PANE_DRAWN state=session: the pane returned to the session view.
  No observations. No path or text in the trace. VIEW_CHANGED did not fire (the editor is pane-level, not window-level).
