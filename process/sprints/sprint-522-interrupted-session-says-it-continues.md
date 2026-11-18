# Sprint 522 — A session the app stopped mid-turn says a message continues it

```yaml
---
id: 522
status: closed
phase: core stalls (roadmap 2026-11-18-core-stalls r1, C5)
pass_kind: functional
depends_on: [521]
plan: process/planning/2026-11-18-core-stalls/ROADMAP-2026-11-18-core-stalls-r1.md
---
```

## scope

A session whose record ends mid-turn — the app killed or crashed during a turn — boots `interrupted`. Opening it, the pane's activity line drew the last turn red: "turn 44 · 9s · no tools · ended: the turn ended without parking (session interrupted)". The turn did end without a reply; the session itself is not broken, and its next message resumes it (review 2026-11-18, § 2.4; app 521's test). The line says so: for an `interrupted` session, "ended: the app stopped during this turn; a message continues the session". Other statuses keep their text. One verifiable property: attaching an `interrupted` session sets that text, and the activity line draws it.

## context_files

- `web/vm/session_controller.ts` (`attachExisting`), `web/reveal/activity.ts`, `web/reveal/__tests__/turn_state.spec.ts`
- `WORKING_AGREEMENT.md` (the tone canon)

## signal contract

### Emits

- `PANE_DRAWN` as before (`turn_state` `failed`); no vocabulary change.

## artifact contract

### Files modified

- `web/vm/session_controller.ts`, `web/reveal/__tests__/turn_state.spec.ts`

### Command exit codes

- `npm run build`, `npm run test:unit` return 0; the tone canon's standing grep finds no new hit.

## observation contract

The installed Substrate Next opens an `interrupted` session and the activity line reads the new text.

## close

`web/vm/session_controller.ts`: `attachExisting` gives an `interrupted` session's last turn the detail "the app stopped during this turn; a message continues the session"; other non-running statuses keep "the turn ended without parking (session <status>)".

- `web/reveal/__tests__/turn_state.spec.ts`: the new case attaches a session whose manifest reads `interrupted` and draws the activity line: `failed`, "· ended: the app stopped during this turn; a message continues the session". `npm run test:unit` 255 of 255.
- Mutant (the old text back): 1 failure.
- `npm run build` 0. The tone canon's grep finds nothing in the new text.
- The observation in the installed build follows the roadmap's install.

Rubber Duck Pass: `PANE_DRAWN.turn_state` stays `failed` for that turn, which ended without a reply; only the words change. No observations.
