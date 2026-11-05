---
id: 218
status: closed
phase: shell-to-react B2.1a
pass_kind: functional
---

# Sprint 218 — the footer's text as a pure function

## scope

Plan round 5, row B2, logic step for the footer. `web/app/derive/footer.ts` computes the footer's status, its colour, the session line and the hint from the focused pane's state and controller snapshot. The status fixes open item 34: "● finalised" once the session has ended, "● live" while connected, "○ <connection>" otherwise, nothing with no session. The template read `ended`, which nothing set, and a design-tool prop, `simulateRateLimit`, drew "◌ rate-limited · retry 3/6 in 14s" (F356, F328's footer text); neither is carried over.

The session line uses the pane header's title (`_paneTitle`: the snapshot's session name, else the pane's), where the template used the pane's name; the two differ only after a rename.

## context_files

`web/reveal_component.ts` (footer fields), `web/vm/types.ts` (`ConnectionState`, `Snapshot`), `web/vm/session_controller.ts` (`forceClose`, `closeStreamOnEnd`), `process/planning/OPEN-ITEMS-2026-10-10.md` item 34; design: `design/received/handoff 5/docs/FUNCTIONALITY -2026-09-01-.md` ("/exit → end-session confirm → SessionEnded + finalised footer").

## artifact contract

- Created: `web/app/derive/footer.ts` (contains `export function footerText`), `web/app/__tests__/footer.spec.ts`.
- `npm run test:unit` 0.

## signal contract

Emits: none.

## observation contract

Carried by sprint 226's gate.

## result

Closed 2026-11-05. Spec 5/5. Sprint 226's first run found that an explicit end clears `sessionId` (`forceClose`) and keeps `endedReason`, so the end is now read before the session id; the spec covers an ended snapshot with no session id.

## Rubber Duck pass

No signals. Observations: none. Disposition: none needed.
