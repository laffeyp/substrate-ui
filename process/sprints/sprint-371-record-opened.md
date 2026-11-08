# Sprint 371 — a record opened read-only is written with how it was asked for (RECORD_OPENED, vocabulary v0.19)

```yaml
---
id: 371
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan r3 item 4, records. `attachRecordRoot` in `web/vm/session_controller.ts` now takes `how` from its caller:

| Caller | `how` |
|---|---|
| `web/reveal.ts`: the menu's `open-record` | `open_record` |
| `web/app/App.tsx` `openKey` (⌘O) | `open_record` |
| `web/reveal.ts`: a `substrate://record/` link | `deep_link` |
| `attachRun` (run panes) | `run` |

The pane registry forwards `how`. `RECORD_OPENED` is written once per attach, from the record's stream: `attached` when it opens, and `refused` when it errors or closes first. A missing record answers 404, and the EventSource reports that as a close.

**v0.19:**
- `P-0.19-RECORD-HOW` sets `RECORD_OPENED.how` to `open_record | deep_link | run`. No path attaches a record from the records page; the page opens sessions through `attachExisting`.
- `P-0.19-PAGE-SET` drops `settings` from `PAGE_DRAWN.page`. Settings is a dialog.

## context_files

- `../sdd-kit-3/AGENTS.md`; `web/vm/signals/versions/0.18.json` (`RECORD_OPENED`, `PAGE_DRAWN`)
- `web/vm/session_controller.ts` (`attachRecordRoot`, `attachRun`), `web/vm/client.ts` (`_openSse`), `web/vm/pane_registry.ts`, `web/reveal.ts`, `web/app/App.tsx` (`openKey`), `electron/menu.ts`, `electron/main.ts` (`native:open-record`)
- `harness/shakeout/main_signals.ts` (the dialog replacement and the `open-url` link), `harness/shakeout/run_panes.ts`

## signal contract

### Emits

- `RECORD_OPENED` (`pane_id`, `how`, `outcome`)

### Invariants

- One record per attach.
- No behaviour changes: the attach, its stream and the connection states run as before.

## artifact contract

### Files created

- `web/vm/signals/versions/0.19.json`, `0.19-rationale.md`; `harness/shakeout/record_open_signals.ts`

### Files modified

- `web/vm/session_controller.ts`, `web/vm/pane_registry.ts`, `web/reveal.ts`, `web/app/App.tsx` (one call and one import)
- `harness/shakeout/run_panes.ts` (checks `RECORD_OPENED run attached` for each run pane)
- `current.json` (now pointing at `0.19.json`), `proposals.json`, `unemitted.json`, the generated files, `package.json`

### Command exit codes

`npx tsc --noEmit` 0; `npx tsc -p harness --noEmit` 0; `npm run build` 0; `gen_signals.py --check` 0; `npm run signals` 0.

## observation contract

`harness/shakeout/record_open_signals.ts`, from source and packaged. After one turn in pane 1, whose record is the fixture, it drives three attaches:
1. File ▸ Open Record…, with main's dialog answering that record's folder;
2. a link to the same record;
3. a link to `no-such-record`.

`window-1.jsonl` must hold exactly three records, in order: `open_record attached`, `deep_link attached`, `deep_link refused`. `run_panes.ts` checks that each run pane has one `RECORD_OPENED`, `run attached`.

Plant: the deep link written as `open_record` fails the gate, which prints the three records.

## done criteria

Each record a pane attaches is in the trace with the path that asked and whether it opened.

## result

- **Correction, made while running the gate:** the first run decided `refused` on `onError` only, and the missing record wrote nothing. `client.ts` reports a 404's closed EventSource as `onClose`, so a close before the stream opens now counts as refused too. The note, the rationale and the card say so.
- **Gate run:** the gate first read the record folder from `GET /api/session/<id>`, which has no `record_root` field. It now takes `<SUBSTRATE_HOME>/sessions/<id>/record` from disk.
- **Commands:** `tsc` 0 for the window and for the harness; `npm run build` 0; `gen_signals.py --check` 0.
- **Gates:** `record_open_signals` 0 and `run_panes` 0 from source. The plant fails `record_open_signals`.
- **Rubber Duck Pass**, on that trace:
  - the menu attached pane 1's record;
  - the link attached it again;
  - the link to no record was refused.

  All three are in pane 1. Observations: none.
- **Hand-author log:** four files (`session_controller.ts`, `pane_registry.ts`, `reveal.ts`, one call in `App.tsx`).
