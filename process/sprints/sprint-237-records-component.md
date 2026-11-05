---
id: 237
status: closed
phase: shell-to-react B4.2
pass_kind: functional
---

# Sprint 237 — the records page component and its store

## scope

`web/app/state/records.ts` holds the open groups, the fetched pages, the lit row and the folder picker's busy flag, with the actions: open or fold a group (the first open fetches 50), load more, add a workspace through the OS picker, and the page's keys over the rows as drawn. Opening a session binds the focused pane, which DCLogic owns, so DCLogic registers that action (`setOpenSession`). `web/app/RecordsPage.tsx` draws the page with the template's styles and data-* hooks and redraws once a second for the relative times, which the template redrew whenever DCLogic did.

## context_files

`web/reveal.html` (records block), `web/reveal_component.ts` (records block, `_recordsKey`, `_treeKey`), `web/vm/session_controller.ts` (`loadSessionsByWorkspace`); design: `design/received/handoff 5/docs/DESIGN-SPEC -2026-11-04- r6.md` (records surface).

## artifact contract

- Created: `web/app/state/records.ts` (contains `recordsKey`, `setOpenSession`; store on `globalThis.__substrateRecords`), `web/app/RecordsPage.tsx` (contains `data-records-workspaces`, `data-records-session`).
- `npm run build` 0.

## result

Closed 2026-11-05. Build 0.

## Rubber Duck pass

No signals.
