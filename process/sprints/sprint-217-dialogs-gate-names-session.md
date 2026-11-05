---
id: 217
status: closed
phase: shell-to-react B1 gate
pass_kind: functional
---

# Sprint 217 — the dialogs gate checks the confirm's session name

## scope

F351's second half is a fixed name in the end-session confirm. The dialogs gate now reads the confirm's heading and requires `End session <name>?` with the name the footer shows (`session <name>`).

## artifact contract

- Modified: `harness/shakeout/dialogs.ts` (contains `end confirm names`).
- `npx tsc -p harness` 0.

## observation contract

`dialogs.ts` exits 0 on the tree; with "fix-race-in-metering" planted in `Dialogs.tsx`, it exits 1.

## result

Closed 2026-11-05. tsc 0. `dialogs.ts` 0 ("end confirm names pane-1; …"). Planted: exit 1, "the confirm reads "End session fix-race-in-metering?"; the footer reads "session pane-1"". Restored and rebuilt.

## Rubber Duck pass

No new signals. Observations: none. Disposition: none needed.
