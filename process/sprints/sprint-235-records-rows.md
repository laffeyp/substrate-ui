---
id: 235
status: closed
phase: shell-to-react B4.1a
pass_kind: functional
---

# Sprint 235 — the records page's rows as a pure function

## scope

Plan round 5, row B4. `web/app/derive/records.ts` builds the records page's groups and session lines, and the flat order the keys walk, from the server's workspaces and sessions, the open groups, their fetched pages, the lit row and the time. It is `reveal_component.ts`'s records block moved as data, without the handlers it built inline. One fix: `relTime` floors the difference, where the block printed "12.345s ago" for a fractional `createdAt` (the pixel gate's relative-time pattern has matched the decimals since sprint 198).

## artifact contract

- Created: `web/app/derive/records.ts` (contains `export function records`, `relTime`, `isScratchPath`), `web/app/__tests__/records.spec.ts`.
- `npm run test:unit` 0.

## result

Closed 2026-11-05. Spec 3/3 (with sprint 236's, 6/6).

## Rubber Duck pass

No signals.
