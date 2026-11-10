# Sprint 405 — the editor is an open view

```yaml
---
id: 405
status: closed
phase: code editor, phase 1 (round 6), R1
pass_kind: architecture
---
```

## scope

`web/app/derive/open_view.ts`: `Base` gains `"editor"`. `toggleEditor(st)` goes to the editor from panes, meta or a page, and from the editor back to panes (spec r6 §4: "every other view has its own key, goes straight there from anywhere, and the same key or esc returns to the pane"). `editorBase(st)` says the editor is the base. `toggleMeta` from the editor goes to meta; `togglePage` opens a page over the editor and closes back to it; `show("editor")` is valid. The spec `web/app/__tests__/open_view.spec.ts` gains one test per transition, and the three existing tests pass unchanged.

## prerequisites

- 404

## context_files

- `web/app/derive/open_view.ts`, `web/app/__tests__/open_view.spec.ts`
- Design: spec r6 §4; D86; `runs/design/sheet-v11/24h.png` (each view by its key; the pane is the base view)
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r6.md` R1

## signal contract

### Emits

- none: a pure derivation. App's VIEW_CHANGED (card 407) writes `editor` from these values.

### Invariants

- `metaBase`, `pageOf`, `closePage` keep their results for every state without `editor`.

## artifact contract

### Files modified

- `web/app/derive/open_view.ts`, `web/app/__tests__/open_view.spec.ts`

### Content assertions

- `open_view.ts` exports `toggleEditor` and `editorBase`; `Base` includes `"editor"`.

### Command exit codes

- `npx tsx --test web/app/__tests__/open_view.spec.ts` returns 0.
- `npx tsc --noEmit` returns 0.

## observation contract

None: no behaviour reaches the window until card 407, whose gate covers these transitions in the running app.

## done criteria

The window's open-view state can hold the editor, with the transitions the design names.

## self-review checklist

- [x] One verifiable property.
- [x] Design inputs listed (24h).
- [x] Emits: none.
- [x] Gradable.
- [x] Architecture card; behaviour covered by 407.
- [x] Two files, one concept.
