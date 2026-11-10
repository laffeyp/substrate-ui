# Sprint 409 — the editor view names the way back: the "⌘⇧E pane" chip and the footer hint

```yaml
---
id: 409
status: closed
phase: code editor, phase 1 (round 6), R2
pass_kind: functional
---
```

## scope

In the editor view the top bar's view chip reads `⌘⇧E pane`, dark text on the accent (#212327 on #82a5c8), as frame 24a draws it; a click on it returns to the panes (VIEW_CHANGED cause `button`). The footer's hint reads `esc or ⌘⇧E back to the pane`. 24a's footer also draws `⌃⇧\` inspector ⇄ record`; that swap is a later phase, so the hint leaves it out (D6). Five files: `web/app/App.tsx` (the chip's fields and click, the chrome field), `web/app/state/chrome.ts` (`editorOpen`), `web/app/derive/footer.ts` (the hint), `web/app/Footer.tsx` (passes the field), `web/app/__tests__/footer.spec.ts`. Logged under hard rule 10: the hint reaches the footer only through the chrome store App writes. The gate `harness/shakeout/editor_view.ts` gains the chip and footer checks and a click on the chip.

## prerequisites

- 407

## context_files

- `web/app/App.tsx` (`topBarView`, `toggleReveal`, `publish`), `web/app/TopBar.tsx`, `web/app/state/top_bar.ts`, `web/app/state/chrome.ts`, `web/app/derive/footer.ts`, `web/app/Footer.tsx`, `web/app/__tests__/footer.spec.ts`
- Design (hard rule 8): spec r6 §4 ("the header chip names the way back … '⌘⇧E pane' in the editor"); D7, D40, D86; `runs/design/sheet-v11/24a.png` (header right: the accent chip `⌘⇧E pane`; footer right: `esc or ⌘⇧E back to the pane · ⌃⇧\` inspector ⇄ record`)

## signal contract

### Emits

- `VIEW_CHANGED` (from `editor`, to `panes`, cause `button`) on a click on the chip.
- `EDITOR_CLOSED` (tab_count 0) for that close.

### Invariants

- In panes and meta the chip and hint are as before (`meta` / `panes`; `⌘M toggles meta`; `esc back to session` with a page open).

## artifact contract

### Files modified

- `web/app/App.tsx`, `web/app/state/chrome.ts`, `web/app/derive/footer.ts`, `web/app/Footer.tsx`, `web/app/__tests__/footer.spec.ts`, `harness/shakeout/editor_view.ts`, `WORKING_AGREEMENT.md` (hand-author log)

### Content assertions

- `footer.ts` contains `esc or ⌘⇧E back to the pane`; `App.tsx` contains `⌘⇧E pane`.

### Command exit codes

- `npx tsx --test web/app/__tests__/footer.spec.ts` returns 0; `npm run build` returns 0.
- `editor_view.ts` from source and with `SHAKEOUT_APP` on a fresh bundle return 0.

## observation contract

### UI driving steps

- Sprint 407's steps, then: ⌘⇧E; read the chip and the footer; click the chip.

### Expected runtime signals

- The trace ends its VIEW_CHANGED list with `key panes→editor`, `button editor→panes`, and pane 1's editor records with a fourth OPENED, DRAWN, CLOSED(0).

### Expected screenshot / visual state

- 1512 screenshot: the chip `⌘⇧E pane` on the accent at the top bar's right; the footer's right reads `esc or ⌘⇧E back to the pane`; read beside 24a.

### Adversarial

- Could the chip read right and do nothing? The gate clicks it and requires the panes and the `button` VIEW_CHANGED.

## done criteria

The editor view names the way back where 24a draws it, and the chip takes it.

## self-review checklist

- [x] One verifiable property.
- [x] Design canon listed (spec §4, 24a).
- [x] Emits only existing tags.
- [x] Gradable.
- [x] Observation contract present.
- [ ] Two files: no, five; logged in the hand-author log (hard rule 10).
