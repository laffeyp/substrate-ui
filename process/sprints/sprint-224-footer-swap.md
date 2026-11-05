---
id: 224
status: closed
phase: shell-to-react B2.3b
pass_kind: functional
---

# Sprint 224 — the footer swaps in

## scope

`reveal.html`'s footer line becomes `<div data-app-mount="footer" style="flex:none">`; `reveal_component.ts` drops `footStatus`, `footStatusColor`, `footRecord`, `footHint`, the `ended` state field and the `simulateRateLimit` read, and writes the chrome store after mount and every update (`_publishChrome`). Open item 34 and F356's rate-limit line close here.

## artifact contract

- Modified: `web/reveal.html` (no `footStatus`; contains `data-app-mount="footer"`), `web/reveal_component.ts` (no `footStatus`, no `simulateRateLimit`, contains `_publishChrome`).
- `npm run build` 0.

## observation contract

With sprint 226: `first_run_footer.ts` 0; pixels differ from `baseline-2026-11-05` only where the focused pane has no session, whose footer no longer reads "● live".

## result

Closed 2026-11-05 with sprint 226's run.

## Rubber Duck pass

See sprint 226.
