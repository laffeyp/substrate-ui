# Sprint 372 — each page's rows are written (PAGE_DRAWN)

```yaml
---
id: 372
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan r3 item 4, pages. Each page writes `PAGE_DRAWN` from a `useEffect` keyed on its row count, so it is written when the page opens and whenever the count changes:
- **records** (`RecordsPage.tsx`): `currentRecords().flat`, one row per workspace and one per session shown. The page redraws every 500 ms, and a redraw with the same count writes nothing.
- **assays** (`AssayPage.tsx`): the arm rows, which are the template's empty list until substrate exposes the projection.
- **studio** (`StudioPage.tsx`): the form's producers, views, triggers and routes, with `inert` true, because no endpoint stands behind the page.

The vocabulary's page set is v0.19's (sprint 371): records, assays, studio.

## context_files

- `../sdd-kit-3/AGENTS.md`; `web/vm/signals/versions/0.19.json` (`PAGE_DRAWN`)
- `web/app/RecordsPage.tsx`, `web/app/state/records.ts` (`currentRecords`), `web/app/AssayPage.tsx`, `web/app/StudioPage.tsx`, `web/app/state/studio.ts`
- design canon: no copy, layout or style changes

## signal contract

### Emits

- `PAGE_DRAWN` (`page`, `rows`; `inert` for studio)

### Invariants

- A redraw that leaves the row count as it was writes nothing.

## artifact contract

### Files created

- `harness/shakeout/page_signals.ts`

### Files modified

- `web/app/RecordsPage.tsx`, `web/app/AssayPage.tsx`, `web/app/StudioPage.tsx`; `web/vm/signals/unemitted.json` (INVARIANT_BROKEN is the one tag left, for item 5); `package.json`

### Command exit codes

`npx tsc --noEmit` 0; lint 0; `npm run build` 0; `npm run signals` 0 (86 live tags named, 1 left).

## observation contract

`harness/shakeout/page_signals.ts`, from source and packaged. With one session in a repo-local folder, it drives:
1. the records page;
2. the folder's row, opened;
3. Escape, then ⌘3 for the assay page;
4. Escape, then studio.

`window-1.jsonl` must hold exactly four records:
1. records, with at least one row;
2. records, one row more, equal to the rows the page draws;
3. assays, 0 rows;
4. studio, with the studio store's row count and `inert` true.

Plant: the records page counting its session rows only fails the gate.

## done criteria

Each page's rows are in the trace when it opens and when they change.

## result

- **Commands:** `tsc` 0; lint 0; `npm run build` 0; `npm run signals` 0.
- **Gate:** `page_signals` 0 from source, writing records 1, records 2, assays 0, studio 8 inert. The plant fails it.
- **Rubber Duck Pass**, on that trace:
  - the records page opened on one workspace row;
  - opening that workspace drew its one session;
  - the assay page drew no arm rows;
  - the studio drew its eight form rows, inert.

  Observations: none.
- **Hand-author log:** three page files.
