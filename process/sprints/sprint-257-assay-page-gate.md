---
id: 257
status: closed
phase: shell-to-react B5 gate
pass_kind: functional
---

# Sprint 257 — gate: the assay page

## scope

`harness/shakeout/assay_page.ts` copies the fixture into the app's bench results folder, then: ⌘3 opens the page and the listing names the fixture (`ASSAYS_LOADED` count 1); a click draws one line per arm in the server's order, each arm's pass^k equal to the server's passes/cases, the control reading "control", never-run arms "not run", and the failed control check in plain words (`ASSAY_REPORT_LOADED` arms 4); ⌘3 again returns to the panes; View ▸ Assays opens it and Escape closes it; with the fixture removed the page shows the empty note. `gates:electron` runs it (52 scripts). `harness/pixel/capture.ts`'s comment on why the page is not captured is brought up to date.

## artifact contract

- Created: `harness/shakeout/assay_page.ts`. Modified: `package.json` (`gates:electron` contains `assay_page.ts`), `harness/pixel/capture.ts` (comment).
- `npx tsc -p harness` 0.

## observation contract

`assay_page.ts` exits 0; `escape_order`, `records_keys`, `first_run_footer`, `menu_commands`, `electron_menu` exit 0; Axis C bugs 0; pixels equal `baseline-2026-11-05-b6`.

## result

Closed 2026-11-05. Gate 0 ("report [["strong_ref","3/4","control"],["weak_single","not run","not run"],["ensemble_no_correction","not run","not run"],["full","2/4","—"]]; the failed control check said; ASSAY_REPORT_LOADED arms 4; ⌘3 again closes it; View ▸ Assays opens it; Escape closes it; no cells files: the empty note"). The five gates 0; Axis C bugs 0; pixels 28/28.

## Rubber Duck pass

`ASSAYS_LOADED {count: 1}` — the listing was read; `ASSAY_REPORT_LOADED {name: coding-fixture, arms: 4}` — the report was read, four arms. Order: the listing before the report, as the page reads them. Observations: none.
