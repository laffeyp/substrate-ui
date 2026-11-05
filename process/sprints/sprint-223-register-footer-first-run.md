---
id: 223
status: closed
phase: shell-to-react B2.3a
pass_kind: functional
---

# Sprint 223 — the boot script registers the footer and first run

## scope

`web/reveal.ts` registers two mount kinds, `footer` and `first-run`, one root each per window. Until sprints 224 and 225 add their host divs, they mount nothing.

## artifact contract

- Modified: `web/reveal.ts` (contains `name: "footer"` and `name: "first-run"`).
- `npm run build` 0.

## result

Closed 2026-11-05. Build 0.

## Rubber Duck pass

No signals. Observations: none. Disposition: none needed.
