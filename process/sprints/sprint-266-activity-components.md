---
id: 266
status: closed
phase: shell-to-react C2.2
pass_kind: functional
---

# Sprint 266 — ActivityLine and TaskRows

## scope

`web/app/ActivityLine.tsx`: `ActivityLine` draws the session bar line (the turn word, pulsing while live; the rest; the settings tail and language shifts) and `TaskRows` the running background tasks with their stop links, each for a `paneId` and a `view` (the panes and meta views differ only in padding). The line's clock runs at 500 ms only while the turn is live. Styles and hooks (`data-session-bar-line`, `data-settings-tail`, `data-lang-shift`, `data-vm-tasks`, `data-vm-task-stop`) are the template's.

## artifact contract

- Created: `web/app/ActivityLine.tsx` (contains `export function ActivityLine`, `export function TaskRows`). `npx tsc --noEmit` 0.

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals; a stop link calls the controller's `stopTask`.
