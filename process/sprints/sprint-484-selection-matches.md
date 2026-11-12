# Sprint 484 — a selection's other occurrences highlighted

```yaml
---
id: 484
status: closed
phase: code editor (roadmap r20), E23
pass_kind: functional
---
```

## scope

The Architect, 2026-11-11: "every time I like highlight like a function or like an object dot function call every object dot function call In the editor should become highlighted, maybe it should be highlighted a little less … I'm talking about in code … We can immediately implement this", with the base case "fine" and the whole file later.

In code (any language but Markdown and plain text), selecting text marks its other occurrences in the lines on screen with `@codemirror/search`'s `highlightSelectionMatches`. That extension searches the visible lines only, case-sensitive, not only whole words, and marks nothing if more than 100 show at once. The marks use `cm-selectionMatch`, a tint softer than find's matches (rgba(130,165,200,.14) against .22).

The setting `selectionMatches` is on by default and saved per viewer. Settings › Editor › match highlight switches it. Settings is grouped under Appearance (theme, look, type size) and Editor (keys, match highlight, bindings), as the tweaks panel.

One verifiable property: a double-click on a word in code marks its other occurrences on screen, and nothing in Markdown or with the setting off.

## prerequisites

- 483.

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/ADDENDUMS.md` A2
- `node_modules/@codemirror/search/dist/index.d.ts` and `index.js` (highlightSelectionMatches: `view.visibleRanges`, `maxMatches` 100, the selection itself unmarked)
- `web/app/state/settings.ts`, `web/app/Dialogs.tsx`, `web/app/editor/Centre.tsx`
- `harness/fixtures/code/` (`models.py`, `README-substrate-ui.md`)

## signal contract

### Emits

No new tag; settings carry none.

### Consumes

- `settings.selectionMatches`.

### Invariants

- Find's own matches are unchanged.

## artifact contract

### Files created

- `harness/shakeout/editor_selection_matches.ts`

### Files modified

- `web/app/state/settings.ts`, `web/app/Dialogs.tsx`, `web/app/editor/Centre.tsx`

### Content assertions

- `Centre.tsx` imports `highlightSelectionMatches` and gives it a compartment (`CONF.matches`).

### Command exit codes

- `npm run build`, `npm run test:unit` return 0

## observation contract

### UI driving steps

Gate `editor_selection_matches`, from source and on the bundle:

- **code:** a double-click on `Responder` in models.py; the marks equal its other occurrences on screen, and each mark's box holds a tint in the screenshot;
- **prose:** a double-click on "the" in the Markdown README selects it and marks none;
- **off:** with Settings › match highlight off, none; on again, the marks return.

## done criteria

Selecting a word or a call in code shows where else it appears on screen.

## notes

Three product files, past the two-file limit: the setting, its row in Settings, and the editor that reads it. Found writing the gate: a double-click on a word past the right edge of the unwrapped lines missed the editor, and "the" was never selected. The gate now picks a word inside the code area both ways, and requires the word selected before it counts.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded.
- [x] context_files cover the extension's real behaviour, the settings, the dialog, the editor.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present, on real files.
- [x] Past the two-file limit, for the reason in the notes.

## close

Gate `editor_selection_matches`, from source and on the bundle (build 1794460977, packaged true):

- **models.py:** "Responder" selected; 5 marked, the 5 other occurrences on screen; all 5 tinted in the screenshot.
- **README:** "the" selected; 0 marked, with 46 on screen.
- **off / on:** off marks 0; on again marks 5.

Mutant: with the highlighter never on, the gate fails (models.py, 0 marks). Unit specs 231/231; `dialogs` 0 on the bundle.

Rubber Duck Pass: no tag changed. No observations.

Installed: CFBundleVersion 1794460977.
