---
id: 240
status: closed
phase: shell-to-react B4.3b
pass_kind: functional
---

# Sprint 240 — the records page swaps in

## scope

Inside `reveal.html`'s `showRecords` block, the page becomes `<div data-app-mount="records">` with the page's scroll-container style; the block's `sc-if` stays, since the open page is DCLogic's until group E. `reveal_component.ts` loses the records state (`expandedWs`, `pagedByWs`, `addWsBusy`, `recordsSel`), the records block of `renderVals` (the grouping, `_relTime`, `_mapSession`, the fetches), the records fields, and `_recordsKey`; its key handler calls `recordsKey` from the store under the same guards; `componentDidMount` registers how a picked session opens.

## artifact contract

- Modified: `web/reveal.html` (contains `data-app-mount="records"`; no `workspaceGroups`), `web/reveal_component.ts` (no `_workspaceGroups`, `_recordsKey`, `pagedByWs`; contains `setOpenSession`).
- `npm run build` 0; `npm run test:unit` 0.

## observation contract

`records_keys`, `records_box_width`, `records_workspace_box`, `git_workspace_label`, `escape_order`, `first_run_footer` exit 0; pixel captures equal `baseline-2026-11-05-b2`.

## result

Closed 2026-11-05. Build 0; unit 92/92; the six gates 0; pixels 28/28 at 0. A check that each name the removed block declared at its top level is gone from the file: all 0.

## Rubber Duck pass

No signals of the page's own. Observation: the React rows have no whitespace between their spans, so a row's `textContent` runs its parts together ("fixture-4◐ parked"); the flex layout never drew that whitespace and the pixels are equal. `records_keys` took the name as the first space-separated word; resolved in sprint 241.
