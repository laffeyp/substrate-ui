---
id: 253
status: closed
phase: shell-to-react B5.2
pass_kind: functional
---

# Sprint 253 — the assay page component and its store

## scope

`web/app/state/assays.ts` holds the listing, the picked assay and the reports read; the page reads the listing each time it opens and a report once per assay picked. `web/app/AssayPage.tsx` draws the listing (one row per cells file, with what it holds and was run with), and for the picked assay its suite, metric and config state, the warnings in plain words, the arm table and the suite's null rule. With no cells files it says so and names the folder the server reads (`$BENCH_RESULTS`, else `~/.substrate/bench_results`), where the template said `/api/assays` had returned an empty list without calling it (F352). One hover rule for a listing row joins `hover.css`.

## artifact contract

- Created: `web/app/state/assays.ts` (store on `globalThis.__substrateAssays`), `web/app/AssayPage.tsx` (contains `data-assay-row`, `data-assay-report`, `data-assay-arm`, `data-assay-verdict`, `data-assay-warning`, `data-assays-empty`). Modified: `web/app/hover.css` (`.hover-assay-row`).
- `npm run build` 0.

## result

Closed 2026-11-05. Build 0. A screenshot of the page on the fixture showed the listing, the failed control check in red above the table, two hollow "not run" arms and the null rule; it led to two fixes: the listing's arm count reads "2 arms ran" (the report lists four, two of which never ran), and "not run" is dim.

## Rubber Duck pass

No signals of its own; the loads emit through the controller.
