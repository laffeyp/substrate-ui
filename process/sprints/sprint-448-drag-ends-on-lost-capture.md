# Sprint 448 — a divider drag ends when its pointer capture ends

```yaml
---
id: 448
status: closed
phase: code editor (roadmap r13), the columns (E3)
pass_kind: functional
---
```

*Written after the code, the same day; the bypass is logged in `WORKING_AGREEMENT.md` (hard rule 10).*

## scope

A divider drag in the editor view ends on `lostpointercapture`, which follows every pointerup and also any loss of the pointer capture without one (MDN, Element: lostpointercapture event). Before, a drag ended only on a pointerup reaching the handle. A drag whose pointerup never came kept its move listener, and a later hover over the handle went on resizing the column. One `editor_resize` run on the bundle showed such a drag (BLACKBOARD 2026-11-10, open question).

EDITOR_COLUMN_RESIZED gains `ended`: `pointerup`, `cancelled` (a pointercancel came), `blurred` (the window was out of focus), or `capture_lost`.

Files: `web/app/editor/EditorView.tsx` (`grab`); the vocabulary files; gates `editor_resize.ts` (the capture-lost step; a watch on the handle's node during each drag; the window ignores the OS's mouse) and `pane_grid.ts` (the same guard).

## context_files

- BLACKBOARD 2026-11-10 open question (the lost pointerup); sprint 414's card (the drag); `web/app/editor/EditorView.tsx`; vocabulary 0.51 EDITOR_COLUMN_RESIZED.

## signal contract

Vocabulary v0.52, P-0.52-RESIZE-ENDED: EDITOR_COLUMN_RESIZED.ended.

## artifact contract

- `EditorView.tsx` listens for `lostpointercapture`.
- `npm run build` 0; `npm run test:unit` 0.
- `editor_resize` from source and on the bundle 0.
- `editor_resize` fails on a mutant whose drag ends only on pointerup.

## observation contract

`editor_resize`. After the three drags, a fourth on the left divider:
1. The gate moves it 30 px.
2. It releases the pointer capture.
3. It lifts the button away from the handle.
4. It hovers across the handle.

Expected:
- The column stays at the 30 px drag's size.
- EDITOR_COLUMN_RESIZED reads ended pointerup for the three drags and capture_lost for the fourth.

## done criteria

No drag outlives its pointer capture.
