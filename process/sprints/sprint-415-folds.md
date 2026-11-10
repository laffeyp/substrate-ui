# Sprint 415 — columns fold to labelled rails, the terminal to a sill that keeps its input

```yaml
---
id: 415
status: closed
phase: code editor, phase 1 (round 6), R6
pass_kind: functional
---
```

## scope

⌥⌘L, ⌥⌘R and ⌘J fold and unfold the files column, the inspector and the substrate terminal (`web/app/keymap.ts`; ⌥ chords read the physical key, since macOS gives ⌥L the key "¬"). A folded side column is a 26 px rail with its ▸ or ◂ and a vertical label (D51; frame 16c); a click on it unfolds. Each column's header carries a fold mark (◂, ▸, ▾; 24a). The folded terminal is a sill with the same input bar, compact, and "▴ history · ◐ parked" (16c); a character typed into it reopens the panel, the character kept and the caret in the panel's bar (D49 (d)). Each fold is one EDITOR_COLUMN_FOLDED (column, folded, cause); EDITOR_DRAWN and the pixel anchor carry the folded flags. Files: `keymap.ts` and its spec, `state/editor.ts`, `editor/EditorView.tsx`, `App.tsx`, `InputBar.tsx` (logged, hard rule 10). Gate `harness/shakeout/editor_folds.ts`.

## context_files

- Design: spec r6 §5.1 (1); D49 (d), D51; `runs/design/sheet-v11/16c.png` (rails 26 px + line, sill 28 px), `24a.png` (header fold marks)
- `web/vm/signals/versions/0.29.json` (EDITOR_COLUMN_FOLDED with cause; EDITOR_DRAWN)

## observation contract

Real keys and clicks; nine steps; at each the DOM, the pixel anchor's flags and the divider lines in the screenshot agree; after close, EDITOR_COLUMN_FOLDED in order with causes and the EDITOR_DRAWN each anchor names. From source and on the bundle. Adversarial: no native menu item holds ⌥⌘L, ⌥⌘R or ⌘J (checked in main); the typed character must survive the unfold.
