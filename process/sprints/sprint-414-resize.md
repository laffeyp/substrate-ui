# Sprint 414 — drag the columns' edges and the substrate terminal's top edge; sizes kept

```yaml
---
id: 414
status: closed
phase: code editor, phase 1 (round 6), R10
pass_kind: functional
---
```

## scope

`web/app/editor/sizes.ts` (new): the sizes start at frame 24a's (left 210, right 300, terminal 176 px), are kept per mode in localStorage (`substrate.editor.sizes.code`) until collection restore, and are held to the room (side columns ≥ 120 px and never below the centre's 240 px; the terminal ≥ 96 px, leaving the centre 120 px). `web/app/editor/EditorView.tsx`: a 6 px grab zone over each divider line; a drag resizes live; its end saves the sizes and writes one EDITOR_COLUMN_RESIZED (column, size, the divider line left out). Spec `web/app/__tests__/editor_sizes.spec.ts`; gate `harness/shakeout/editor_resize.ts`.

## context_files

- Design: spec r6 §5.1 (5) "widths remembered per mode"; D51; D90; `runs/design/sheet-v11/24a.png` (the sizes and the 1 px divider `#2d2f33`)
- `web/vm/signals/versions/0.29.json` (EDITOR_COLUMN_RESIZED), `harness/pixel/png.ts`

## observation contract

Real mouse drags (left +80, right −60, terminal −150), then Escape and ⌘⇧E. Four readings agree after each drag: the mouse's distance, the DOM box, the divider lines decoded from a screenshot, and one EDITOR_COLUMN_RESIZED per drag after close. From source and on the packaged bundle.

### Adversarial

- Could a drag write a record per pointer move? The gate requires exactly three records for three drags.
- Could the DOM resize while the screen does not? The divider lines are found in the screenshot's pixels.
