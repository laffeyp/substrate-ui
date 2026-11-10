# Sprint 398 — Terminal dock position (bottom or right)

```yaml
---
id: 398
status: reverted
phase: code editor, phase 1
pass_kind: functional
---
```

## scope

The editor's transcript region (the `bottom` prop content) can dock at the bottom (default, current layout) or at the right of the centre column. A state property `dockPosition: "bottom" | "right"` on `AppPane` controls the layout. The position toggles via a button in the transcript header bar.

When docked right, the transcript occupies a right column in place of the centre column's lower region. The existing right column (inspector) stays on the far right. The drag handle between the centre and the transcript region resizes the transcript width, persisted in localStorage alongside the column widths.

When docked bottom (the current layout), nothing changes from the current behavior.

EditorShell accepts the dock position as a prop and renders the layout accordingly. The transcript sill (collapsed state) adapts to horizontal or vertical orientation.

## prerequisites

- Sprint 396 (resizable widths in localStorage)
- Sprint 390 (bottom panel with sill)

## context_files

- `web/app/editor/EditorShell.tsx` (layout component)
- `web/app/App.tsx` (pane state, passes dock position)

## signal contract

### Emits

None new. The dock position is window-layout state.

### Invariants

- The transcript content renders identically in both positions (same `bottom` prop).
- The dock toggle does not close the editor.

## artifact contract

### Files modified

- `web/app/editor/EditorShell.tsx` — accepts `dockPosition` prop; renders transcript at bottom or right of centre; toggle button in transcript header.
- `web/app/App.tsx` — `AppPane` gains `dockPosition`; passes it to EditorShell; handles the toggle.

### Content assertions

- `web/app/editor/EditorShell.tsx` contains `dockPosition`.
- `web/app/App.tsx` contains `dockPosition`.
- `npx tsc --noEmit` returns 0.
- `npm run build` returns 0.

### Command exit codes

- `npx tsc --noEmit` returns 0
- `npm run build` returns 0

## observation contract

### UI driving steps

1. Launch, bind a session, open the editor.
2. Transcript is at the bottom (default).
3. Click the dock toggle — transcript moves to the right of the centre.
4. Click the dock toggle — transcript returns to the bottom.

### Expected runtime signals

- EDITOR_OPENED, EDITOR_DRAWN fire on open.

## done criteria

The transcript docks bottom or right. A toggle button switches between positions.

## self-review checklist

- [x] Scope is concrete and bounded: 2 files modified.
- [x] `context_files` covers EditorShell and App.tsx.
- [x] Signal contract is present (no new emits).
- [x] Artifact contract is gradable.
- [x] Observation contract is present.
- [x] Sprint sweet spot: 2 files modified.

## result

### Artifact contract

- `web/app/editor/EditorShell.tsx` contains `dockPosition`: PASS.
- `web/app/App.tsx` contains `dockPosition`: PASS.
- `npx tsc --noEmit`: 0.
- `npm run build`: 0.

### Observation contract

Gate test `harness/shakeout/terminal_dock.ts` — 4 checks, all pass:
1. Default dock position is bottom (`data-dock="bottom"`).
2. Transcript renders at bottom (bottom column visible).
3. Click dock toggle — `data-dock` changes to "right".
4. Click dock toggle again — `data-dock` returns to "bottom".

### Rubber Duck Pass

**Step 1 — Sequence narration.** No new signals emitted. Dock position is window-layout state.

**Step 2 — Observations.**
- Missing pair: N/A.
- Order violation: N/A.
- Vocabulary gap: N/A.
- Payload anomaly: N/A.
- Timing surprise: N/A.
- Tone trace: N/A.

**Step 3 — Disposition.** Clean pass.
