# Sprint 399 — Sides swap

```yaml
---
id: 399
status: reverted
phase: code editor, phase 1
pass_kind: functional
---
```

## scope

The left and right columns can swap positions: files moves to the right, inspector moves to the left. A state property `sidesSwapped: boolean` on `AppPane` controls this. A button in the left column header (or right, depending on swap state) toggles the swap.

When swapped, the left column's content (FILES header, file tree, no-git indicator, fold button) renders on the right, and the right column's content (inspector, fold button) renders on the left. The fold state, drag handles, and widths follow the content — `leftFolded` still controls the file tree's column regardless of which side it sits on.

## prerequisites

- Sprint 390 (the three-column layout)

## context_files

- `web/app/editor/EditorShell.tsx` (layout)
- `web/app/App.tsx` (pane state)

## signal contract

### Emits

None new. Column swap is window-layout state.

## artifact contract

### Files modified

- `web/app/editor/EditorShell.tsx` — accepts `sidesSwapped` prop; renders columns in swapped order when true.
- `web/app/App.tsx` — `AppPane` gains `sidesSwapped`; passes it to EditorShell; toggle handler.

### Content assertions

- `web/app/editor/EditorShell.tsx` contains `sidesSwapped`.
- `npx tsc --noEmit` returns 0.
- `npm run build` returns 0.

### Command exit codes

- `npx tsc --noEmit` returns 0
- `npm run build` returns 0

## observation contract

### UI driving steps

1. Launch, bind, open editor.
2. Files column is on the left (default).
3. Toggle swap — files column moves to the right, inspector to the left.
4. Toggle swap — columns return to default positions.

## done criteria

Sides swap toggles the left and right columns.

## self-review checklist

- [x] Scope is concrete and bounded: 2 files modified.
- [x] `context_files` covers EditorShell and App.tsx.
- [x] Signal contract is present (no new emits).
- [x] Artifact contract is gradable.
- [x] Observation contract is present.
- [x] Sprint sweet spot: 2 files modified.

## result

### Artifact contract

- `web/app/editor/EditorShell.tsx` contains `sidesSwapped`: PASS.
- `npx tsc --noEmit`: 0.
- `npm run build`: 0.

### Observation contract

Gate test `harness/shakeout/sides_swap.ts` — 3 checks, all pass:
1. Default: files column is to the left of centre (x < centre.x).
2. After swap: files column is to the right of centre.
3. After swap back: files column returned to the left.

### Rubber Duck Pass

**Step 1 — Sequence narration.** No new signals. Column swap is layout.

**Step 2 — Observations.**
- Missing pair: N/A.
- Order violation: N/A.
- Vocabulary gap: N/A.
- Payload anomaly: N/A.
- Timing surprise: N/A.
- Tone trace: N/A.

**Step 3 — Disposition.** Clean pass.
