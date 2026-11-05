---
id: 245
status: closed
phase: shell-to-react B6.4
pass_kind: functional
---

# Sprint 245 — `Surface.Studio` goes; B6 checked

## scope

`web/vm/kinds.ts` drops `Surface.Studio`; `web/app/hover.css` drops the studio button's rule. Two comments that listed the studio page (`chrome.ts`, `footer.ts`) name the records and assays pages.

## artifact contract

- Modified: `web/vm/kinds.ts`, `web/app/hover.css` (and two comment lines). No `studio` left in `web/` outside the vocabulary files and one comment saying the button went. `npm run build` 0.

## observation contract

`one_top_bar`, `escape_order`, `records_keys`, `first_run_footer`, `naming_sessions` exit 0; Axis C bugs 0; pixel captures differ from `baseline-2026-11-05-b2` only in the top bar's row.

## result

Closed 2026-11-05. Build 0; unit 0; the five gates 0; Axis C bugs 0. Pixels: 26 of 28 differ, all within y 29–49 (device pixels) of the top bar: "records" moves right into Studio's place, and at 900×380 the driver and workspace chips widen into the freed space; first run (its own bar) is unchanged. `captures/pixel/baseline-2026-11-05-b6/` is this run; the run matches it 28 of 28.

## Rubber Duck pass

No signals. Observations: none beyond the planned top-bar change.
