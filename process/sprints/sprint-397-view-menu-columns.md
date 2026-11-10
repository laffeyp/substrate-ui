# Sprint 397 — View menu entries for column toggles

```yaml
---
id: 397
status: reverted
phase: code editor, phase 1
pass_kind: functional
---
```

## scope

The View menu gains three entries for the editor's column toggles: Files (⌥⌘L), Inspector (⌥⌘R), Transcript (⌘J). Each dispatches its toggle command through the menu IPC channel. The renderer handles the command only when the editor is open; otherwise it is a no-op (consistent with `keymap.ts` gating on `editorOpen`).

The entries sit after the Editor item, separated by a divider, visually grouping the editor's sub-controls.

## prerequisites

- Sprint 390 (column toggles exist in keymap and App.tsx)

## context_files

- `electron/menu.ts` (the menu template)
- `web/app/App.tsx` (handles menu commands via `onCommand`)

## signal contract

### Emits

None new. EDITOR_COLUMN_FOLDED already fires on toggle.

### Invariants

- The menu items dispatch the same commands as the keyboard shortcuts.

## artifact contract

### Files modified

- `electron/menu.ts` — three new items in the View submenu after the Editor entry.

### Content assertions

- `electron/menu.ts` contains `toggle-editor-left`.
- `electron/menu.ts` contains `toggle-editor-right`.
- `electron/menu.ts` contains `toggle-editor-bottom`.
- `npx tsc --noEmit` returns 0.
- `npm run build` returns 0.

### Command exit codes

- `npx tsc --noEmit` returns 0
- `npm run build` returns 0

## observation contract

### UI driving steps

1. Launch, bind a session, open the editor.
2. View menu > Files — left column folds.
3. View menu > Files — left column unfolds.

### Expected runtime signals

- EDITOR_COLUMN_FOLDED fires on each toggle.

## done criteria

The View menu lists Files, Inspector, and Transcript entries that toggle the editor's columns.

## self-review checklist

- [x] Scope is concrete and bounded: 1 file modified.
- [x] `context_files` covers menu.ts and App.tsx.
- [x] Signal contract is present (no new emits).
- [x] Artifact contract is gradable.
- [x] Observation contract is present.
- [x] Sprint sweet spot: 1 file modified.

## result

### Artifact contract

- `electron/menu.ts` contains `toggle-editor-left`: PASS.
- `electron/menu.ts` contains `toggle-editor-right`: PASS.
- `electron/menu.ts` contains `toggle-editor-bottom`: PASS.
- `npx tsc --noEmit`: 0.
- `npm run build`: 0.

Scope grew to 3 files: `electron/menu.ts` (items added), `web/app/state/shell.ts` (ShellCommand type extended), `web/app/App.tsx` (onCommand handler routes new commands with editorOpen guard).

### Observation contract

Gate test `harness/shakeout/view_menu_columns.ts` — 7 checks, all pass:
1. toggle-editor-left folds the left column.
2. toggle-editor-left unfolds the left column.
3. toggle-editor-right folds the right column.
4. toggle-editor-right unfolds the right column.
5. toggle-editor-bottom collapses the bottom panel.
6. toggle-editor-bottom expands the bottom panel.
7. Column commands are no-op when editor is closed.

### Rubber Duck Pass

**Step 1 — Sequence narration.** No new signals emitted. EDITOR_COLUMN_FOLDED fires on each toggle, same as the keyboard path.

**Step 2 — Observations.**
- Missing pair: N/A.
- Order violation: N/A.
- Vocabulary gap: N/A.
- Payload anomaly: N/A.
- Timing surprise: N/A.
- Tone trace: N/A.

**Step 3 — Disposition.** Clean pass.
