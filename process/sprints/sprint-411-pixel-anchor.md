# Sprint 411 — the editor view paints its drawn state into a pixel anchor, and the gate checks pixels, signals and disk against each other

```yaml
---
id: 411
status: closed
phase: code editor, phase 1 (round 6), verification for R1–R4
pass_kind: functional
---
```

## scope

`web/app/derive/anchor.ts` lays out a strip of 72 cells, 3 CSS px each: calibration (0, 1), magic 0xB4, the proc_seq of the last EDITOR_DRAWN record (20 bits), tree_rows (16), modified_dots (12), six layout flags, CRC-8. A 0 cell is the sunk surface #1a1c20, a 1 cell #1a1c24. App writes the record `emit` returns into `state/editor.ts`; `EditorView.tsx` paints the strip at the view's bottom-left corner. `harness/shakeout/editor_tree.ts` decodes it from screenshots of the running window with `harness/pixel/png.ts` and requires, at every step on two real folders: the pixels' proc_seq names an EDITOR_DRAWN in `window-1.jsonl` with the same fields; the pixels' tree_rows equals the disk's row count; every 16 px row band in the tree's visible box holds ink; each FILES_LISTED in `server.jsonl` equals its folder's entry count on disk. Technique: sdd-kit-3 TECHNIQUES §2 "deterministic pixel anchors", Addendum A2, B1; the project's KIT_DIARY 2026-11-04 names the editor's views as where it belongs.

## context_files

- `../sdd-kit-3/ADDENDUMS.md` A2, A3, A4, B1, B4; `../sdd-kit-3/TECHNIQUES.md` §2 Visual/UI; `KIT_DIARY.md` 2026-11-04 (pixel anchors)
- `harness/pixel/png.ts`, `web/vm/instrumentation/sdd.ts` (`emit` returns the record with proc_seq)
- Design: D7 (the strip's colours are a step off the sunk surface); `runs/design/sheet-v11/24a.png`

## artifact contract

- Created: `web/app/derive/anchor.ts`, `web/app/__tests__/anchor.spec.ts`. Modified: `web/app/state/editor.ts`, `web/app/App.tsx`, `web/app/editor/EditorView.tsx`, `harness/shakeout/editor_tree.ts`, `harness/shakeout/editor_view.ts` (a run of EDITOR_DRAWN is one step now that the tree draws after its listing).
- `npx tsx --test web/app/__tests__/anchor.spec.ts` 0 (3 tests; every one of the 70 single-cell flips decodes to an error); `npm run test:unit` 0 (171); `npm run build` 0; both gates 0 from source and packaged.

## observation contract

### Adversarial

- Could the strip read right while the screen is stale? Each decode names a proc_seq; the record with that proc_seq must hold the decoded fields.
- Could the decoder misread a cell and still pass? CRC-8 rejects any single flipped cell; the calibration cells must differ by at least 2 in blue or the strip is called illegible.
- Could the DOM hold rows the screen does not paint? The ink check reads the rows from the screenshot.
- Could the gate read a different frame than it measured? The layout is read before and after each screenshot and the screenshot is retaken until they agree.
