# Sprint 407 — ⌘⇧E opens the editor view with its four areas; ⌘⇧E or Escape returns

```yaml
---
id: 407
status: closed
phase: code editor, phase 1 (round 6), R1 and R3
pass_kind: functional
---
```

## scope

In the running app, ⌘⇧E on a pane with a session replaces the panes with the editor view on the focused pane's session, and ⌘⇧E or Escape returns to the panes. On a pane with no session (its picker), ⌘⇧E leaves the window as it is and writes EDITOR_KEY_REFUSED (`no_session`). The view draws frame 24a's four areas at its measured sizes: a 210 px sunk left column whose tab row reads `files`; the centre, a ground surface under a 26 px sunk tab row; a 300 px sunk right column headed `INSPECTOR`; and below the centre only, a 176 px bottom panel headed `SUBSTRATE TERMINAL` holding the focused pane's transcript, activity line, task rows, find bar and input bar. Nothing Phase 1 does not make work is drawn (no fold marks, no search field, no tabs, no status line).

Files: `web/app/App.tsx` (the key's actions, the refusal, VIEW_CHANGED's `editor`, EDITOR_OPENED, EDITOR_CLOSED, EDITOR_DRAWN, and leaving the editor when the focused pane has no session); `web/app/editor/EditorView.tsx` (new). Gate: `harness/shakeout/editor_view.ts`.

## prerequisites

- 405, 406

## context_files

- `web/app/App.tsx`, `web/app/derive/open_view.ts`, `web/app/keymap.ts`, `web/app/ActivityLine.tsx`, `web/app/FindBar.tsx`, `web/app/InputBar.tsx`, `web/reveal/transcript/Transcript.tsx`
- `web/vm/signals/versions/0.29.json` (VIEW_CHANGED, EDITOR_OPENED, EDITOR_CLOSED, EDITOR_DRAWN, EDITOR_KEY_REFUSED; editor_run; S11)
- `harness/shakeout/view_signals.ts`, `harness/shakeout/lib/electron.ts`
- Design (hard rule 8): spec r6 §2, §4, §5.1; D7, D8, D9, D40, D81, D86; `runs/design/sheet-v11/24a.png` (geometry measured from it: header 33 px; left 210 px and right 300 px, sunk `#1a1c20`, 1 px divider `#2d2f33`; centre ground `#212327` under a 26 px sunk tab row; bottom panel 176 px under the centre only; footer 27 px raised `#2a2d33`; selected tab band `#2e3138`); `runs/design/sheet-v11/24h.png`

## signal contract

### Emits

- `VIEW_CHANGED` (from `panes`, to `editor`, cause `key`; from `editor`, to `panes`, cause `key` or `close`)
- `EDITOR_OPENED` (pane context; no binding)
- `EDITOR_DRAWN` (tab_count 0, left/right/bottom_folded false, showing `spine`, left_tab `files`, dock `bottom`, sides_swapped false, focus false, tree_rows 0, modified_dots 0)
- `EDITOR_CLOSED` (tab_count 0)
- `EDITOR_KEY_REFUSED` (key `Meta+Shift+E`, reason `no_session`)
- `KEY_ROUTED` (key `Meta+Shift+E`, action `toggle-editor`; key `Escape`, action `close-editor`)

### Invariants

- In each pane's records, EDITOR_OPENED comes before any other editor tag of its run (S11) and each EDITOR_OPENED is closed by EDITOR_CLOSED or PANE_CLOSED.
- No INVARIANT_BROKEN in `main.jsonl`.
- No path or text in any editor payload (E1).

## artifact contract

### Files created

- `web/app/editor/EditorView.tsx`, `harness/shakeout/editor_view.ts`

### Files modified

- `web/app/App.tsx`; `web/vm/signals/unemitted.json` (the four tags this card emits leave it)

### Content assertions

- `EditorView.tsx` sets `data-editor-view` and `data-editor-area` on `left`, `centre`, `right`, `bottom`.
- `App.tsx` contains `Signal.EDITOR_OPENED`, `Signal.EDITOR_CLOSED`, `Signal.EDITOR_DRAWN`, `Signal.EDITOR_KEY_REFUSED`.

### Command exit codes

- `npm run build` returns 0; `npm run test:unit` returns 0.
- `npx tsx harness/shakeout/editor_view.ts` returns 0 (from source).
- `SHAKEOUT_APP=$PWD/dist-electron/mac-arm64/Substrate.app npx tsx harness/shakeout/editor_view.ts` returns 0 on a bundle built after this card's code (`npm run pack:runtime && npm run pack:dev`), its APP_BOOTED reading `packaged: true`.

## observation contract

### UI driving steps

1. Launch; at pane 1's picker press ⌘⇧E (Playwright keyboard on the window). The picker stays; no `[data-editor-view]`.
2. Bind pane 1 through the picker (`bindPaneAsUser`, keys and clicks); send one turn, `hello`, and wait for its park.
3. ⌘⇧E: `[data-editor-view]` with its four areas; the input bar inside `[data-editor-area="bottom"]`; the panes view gone.
4. Screenshots at content sizes 1512×945 and 504×945.
5. Escape with the input bar focused: the panes return.
6. ⌘⇧E, then ⌘⇧E again: the editor, then the panes.
7. ⌘⇧E, ⌘3 (assays over the editor), Escape (back to the editor), Escape (back to the panes).

### Expected runtime signals (window-1.jsonl, read after close)

In order, pane 1's: EDITOR_KEY_REFUSED(Meta+Shift+E, no_session); then for each of the three opens EDITOR_OPENED → EDITOR_DRAWN → … → EDITOR_CLOSED(0). VIEW_CHANGED: panes→editor key, editor→panes close, panes→editor key, editor→panes key, panes→editor key, editor→assay key, assay→editor close, editor→panes close.

### Expected screenshot / visual state

- 1512: four areas at the frame's sizes; left tab `files` on the selection band; `INSPECTOR` and `SUBSTRATE TERMINAL` headers; the transcript's `hello` turn and the input bar in the bottom panel; read beside `24a.png`.
- 504: the four areas still drawn, the centre narrowed first; labels do not wrap (D32).

### Adversarial

- Could a gate pass while a real ⌘⇧E does nothing? Only if something in the native menu claims ⌘⇧E before the window: the gate lists every menu item's accelerator in the main process and fails if one is ⌘⇧E.
- Could the trace be the dev build's while the bundle is broken? The packaged run reads APP_BOOTED `packaged: true` from that launch's own `main.jsonl`.
- Could the editor draw over a pane with no session? Step 1 and the refusal.

## done criteria

⌘⇧E shows frame 24a's four areas on the focused session and returns, in the packaged app, with its tags in that launch's trace.

## self-review checklist

- [x] One verifiable property.
- [x] Design canon in `context_files` (hard rule 8): spec, decisions, 24a, 24h.
- [x] Emits only v0.29 tags.
- [x] Gradable.
- [x] Observation contract with the real input path, the packaged trace, two screenshot widths, adversarial cases.
- [x] Two product files, one concept (the view shown); the gate is the observation contract's.
