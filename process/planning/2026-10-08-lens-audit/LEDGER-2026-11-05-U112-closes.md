# Ledger addendum — the U112 rows, 2026-11-05

The ledger (`ROADMAP-2026-10-08-lens-audit-remediation-LEDGER.md`) assigns 37 findings to sprint U112, the move off dc-runtime. That sprint's work was done by plan `PLAN-2026-11-04-shell-to-react-r5.md` (sprints 199–345). This addendum records each row's outcome; the ledger itself is left as generated. "Kept by the user" means the restoration of 2026-11-05 (sprint 334): the move was a refactor, and the user's decision was that it removes and redesigns nothing, so a finding whose fix removed or reworded something is open again.

| id | outcome | where |
|---|---|---|
| F320 | closed | React no longer loads from cdnjs: bundled from node_modules (sprints 199, 331); CSP (332) |
| F321 | closed | `web/shims/` gone; React imported as modules (329, 331) |
| F322 | closed | the `any`-typed React stand-ins gone; `tsc` checks against `@types/react` (329) |
| F327 | closed | `@ts-nocheck` gone: the shell is `web/app/App.tsx`, typed (328) |
| F328 | partly closed | fixed: footer status, workspace card's folder, top-bar text, inspector payload (224, 233, 292); kept by the user: first run's "s-1a04" and "~/Documents/substrate" lines, the end dialog's fixed text where the dialog is the export one (334) |
| F329 | left as it is | the user's decision, 2026-11-05: "descend" stays a control that does nothing |
| F330 | closed | `endSession` sends `source` (337) |
| F331 | closed | the client reads `{"error"}` (336) |
| F332 | closed | before this plan: no driver, no session opens (44ed3e1) |
| F333 | closed | the stream compares wire kinds (288–289); lint reads `.tsx` (330) |
| F334 | closed | no fiber access: snapshots and commands through `web/app/state/shell.ts` (211–212) |
| F335 | closed in part | the duplicate scan gone (338); the per-envelope array copy stays, since the immutable snapshot is the store's contract |
| F336 | closed | ⌘C copies; Ctrl+C interrupts the focused pane (325–327) |
| F337 | closed | one constant for the shared sandbox (274–279) |
| F338 | closed | the comment naming `web/studio.ts` is not in the restored Studio (334) |
| F339 | kept by the user | the branch line and `substrate/<name>` label are back (334) |
| F340 | closed | the timeout line names the responder's count (339) |
| F343 | closed | `support.js` in `_deprecated/dc-runtime/` (329) |
| F344 | closed | no `new Function`; CSP `script-src 'self'` (329, 332) |
| F345 | closed | dc-runtime's own React loader went with `support.js` (329) |
| F346 | closed | no second fetch of the page: dc-runtime gone (329) |
| F347 | closed | the signal buffer keeps the latest 10,000 (340) |
| F348 | closed | the comments name real paths (341) |
| F349 | closed | the activity line no longer strips `{"error":` (336) |
| F350 | closed | the scan cached per snapshot; the window's 500 ms redraw gone (265–269); the records page redraws every 500 ms as it did (334) |
| F351 | kept by the user | the export dialog is back with its text (334) |
| F352 | kept by the user | the assay page's note and table are back (334); its openers stay (⌘3, View ▸ Assays) |
| F353 | kept by the user | Studio is back (334) |
| F354 | closed | before this plan: the crumb's title says only "double-click to rename" (44ed3e1) |
| F355 | closed | the "parity with web/studio.html" comment is not in the restored Studio (334) |
| F356 | kept by the user | the tweak props and the rate-limit line are back (334) |
| F357 | closed | 256-colour and truecolor SGR (342) |
| F358 | closed | fence languages with `+` and `-`; the parser's hang on a refused fence fixed (343) |
| F359 | closed | the parity gate scans `web/reveal/**` and `web/app/**` (sprint A4) |
| F360 | closed | the spec uses the server's error shape (336) |
| F361 | closed | a pane's transcript is a child of its pane (321–324) |
| F471 | closed | with F361 |
