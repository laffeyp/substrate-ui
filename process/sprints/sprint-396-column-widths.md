# Sprint 396 — Resizable column widths persisted in localStorage

```yaml
---
id: 396
status: reverted
phase: code editor, phase 1
pass_kind: functional
---
```

## scope

The editor's three column widths (left, right, bottom height) become resizable by dragging the border between columns. The current values persist in `localStorage` under the key `substrate:editor-column-widths` as a JSON object `{ left: number, right: number, bottomHeight: number }`. On mount, EditorShell reads the stored values and falls back to the current constants (`LEFT_WIDTH=240`, `RIGHT_WIDTH=280`, `BOTTOM_MIN_HEIGHT=180`). On drag-end, it writes the new values.

The drag handles are thin (4px) dividers between columns that show a resize cursor on hover. Left column: right edge. Right column: left edge. Bottom panel: top edge. Each has a minimum (120px for side columns, 100px for bottom) and a maximum (half the container dimension).

The mode key is `"editor"`. The localStorage key includes it so that other future modes store their own widths.

## prerequisites

- Sprint 390 (the three-column layout exists)

## context_files

- `web/app/editor/EditorShell.tsx` (the layout component)

## signal contract

### Emits

None. Column resize is window-layout, not a vocabulary action.

### Invariants

- Widths persist across editor close/open within the same Electron session.
- Widths persist across app restarts (localStorage survives).

## artifact contract

### Files modified

- `web/app/editor/EditorShell.tsx` — column widths read from localStorage on mount, written on drag-end. Drag handles between columns. Minimum and maximum constraints.

### Content assertions

- `web/app/editor/EditorShell.tsx` contains `localStorage`.
- `web/app/editor/EditorShell.tsx` contains `substrate:editor-column-widths`.
- `npx tsc --noEmit` returns 0.
- `npm run build` returns 0.

### Command exit codes

- `npx tsc --noEmit` returns 0
- `npm run build` returns 0

## observation contract

### UI driving steps

1. Launch, bind a session, open the editor.
2. Drag the left column's right border to a new width. Close and reopen the editor — the left column keeps the new width.

### Expected runtime signals

- EDITOR_OPENED, EDITOR_DRAWN fire on each open.

## done criteria

Column widths are draggable and persist in localStorage across editor open/close cycles.

## self-review checklist

- [x] Scope is concrete and bounded: 1 file modified.
- [x] `context_files` covers EditorShell.
- [x] Signal contract is present (no new emits).
- [x] Artifact contract is gradable.
- [x] Observation contract is present.
- [x] Sprint sweet spot: 1 file modified.

## result

### Artifact contract

- `web/app/editor/EditorShell.tsx` contains `localStorage`: PASS.
- `web/app/editor/EditorShell.tsx` contains `substrate:editor-column-widths`: PASS.
- `npx tsc --noEmit`: 0.
- `npm run build`: 0.

### Observation contract

Gate test `harness/shakeout/column_widths.ts` — 3 checks, all pass:
1. Default left column renders at ~240px.
2. Drag handles present (2 column, 1 row).
3. After writing `{ left: 300 }` to localStorage and reopening the editor, left column renders at ~300px.

### Rubber Duck Pass

**Step 1 — Sequence narration.** No new signals emitted. Column widths are window-layout state, not vocabulary actions.

**Step 2 — Observations.**
- Missing pair: N/A.
- Order violation: N/A.
- Vocabulary gap: N/A — column resize is layout, not a user action the vocabulary tracks.
- Payload anomaly: N/A.
- Timing surprise: N/A.
- Tone trace: N/A.

**Step 3 — Disposition.** Clean pass.
