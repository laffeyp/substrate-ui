---
id: 332
status: closed
phase: shell-to-react E6.1
pass_kind: functional
---

# Sprint 332 — a Content-Security-Policy on the page (F320, F344)

## scope

Plan row E6. `web/reveal.html` sets `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'`. `web/reveal.ts` wrote a `<style>` element for Electron's title bar, which `style-src 'self'` blocks; its rules are in `web/app/window.css`, scoped to `body[data-electron="1"]` as before, and reveal.ts only sets the attribute. No other inline style, script, `innerHTML` or `new Function` is in `web/`.

## artifact contract

- Modified: `web/reveal.html` (contains the policy), `web/reveal.ts` (no `createElement("style")`), `web/app/window.css`. `npm run build` 0.

## result

Closed 2026-11-05. A probe confirmed the policy is enforced in the app: an inline `<style>` added after load raised `style-src-elem` and did not apply.

## Rubber Duck pass

No signals.
