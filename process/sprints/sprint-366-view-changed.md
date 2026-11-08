# Sprint 366 — the window writes each change of its open view (VIEW_CHANGED, vocabulary v0.17)

```yaml
---
id: 366
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan r3 item 4, the window's open view. `App.tsx` writes `VIEW_CHANGED` from `componentDidUpdate` when the open view (`vs.view`: panes, meta, or a page: records, assay, studio) differs from the previous commit. The code path that changed the view notes its cause first, as `PANE_FOCUSED`'s cause is noted:

| Path | Cause |
|---|---|
| ⌘M, ⌘3 (`onKey`) | `key` |
| View ▸ Meta, View ▸ Assays (`onCommand`) | `menu` |
| the top bar's view button, records and studio | `button` |
| a split (`split`) | `split` |
| a session row on the records page (`setOpenSession`) | `records_open` |
| Escape on a page (`close-surface`) | `close` |
| `/language` (the shell subscription's open tick) | `language` (new) |
| the design tool's `view` prop | `tweak` (new) |

`toggleMeta` and `toggleSurface` take the cause from their callers.

**v0.17** (`P-0.17-VIEW-CAUSES`, `PAYLOAD_FIELD_PROPOSED`) adds `language` and `tweak`. Each is a path that changes the view and that none of the six earlier causes names.

## context_files

- `../sdd-kit-3/AGENTS.md`; `web/vm/signals/versions/0.16.json` (`VIEW_CHANGED`)
- `web/app/App.tsx`, `web/app/derive/open_view.ts`, `web/app/keymap.ts`, `web/app/TopBar.tsx`, `web/app/state/records.ts`, `electron/menu.ts`
- `harness/shakeout/records_keys.ts`, `harness/shakeout/electron_menu.ts`, `harness/shakeout/language_bar_line.ts` (how each path is driven)
- design canon: no copy, layout or style changes

## signal contract

### Emits

- `VIEW_CHANGED` (`from`, `to`: the open view; `cause`: `ViewChangedCause`)

### Invariants

- One `VIEW_CHANGED` per commit whose open view changed, carrying the cause of the path that changed it. A commit that leaves the view as it was writes none.
- No pane in the record's context.
- No behaviour, text or layout changes.

## artifact contract

### Files created

- `web/vm/signals/versions/0.17.json`, `0.17-rationale.md`
- `harness/shakeout/view_signals.ts`

### Files modified

- `web/app/App.tsx`
- `web/vm/signals/versions/current.json` (now pointing at `0.17.json`), `proposals.json`, `unemitted.json`; the generated `web/vm/signals.gen.ts`, `electron/signals.gen.ts`, `signals_gen.py`
- `package.json` (`gates:electron` runs `view_signals`)

### Command exit codes

`npx tsc --noEmit` 0; `npm run build` 0; `npm run signals` 0; `python3 scripts/gen_signals.py --check` 0; `npm run test:unit` 0; `npm run test:py` 0.

## observation contract

`harness/shakeout/view_signals.ts` runs from source and against the package. After one turn it drives these ten changes, in this order:

| # | Action | Cause | Change |
|---|---|---|---|
| 1 | ⌘M | key | panes→meta |
| 2 | View ▸ Meta | menu | meta→panes |
| 3 | `/language` | language | panes→meta |
| 4 | the view button | button | meta→panes |
| 5 | ⌘3 | key | panes→assay |
| 6 | Escape | close | assay→panes |
| 7 | records | button | panes→records |
| 8 | a session row | records_open | records→panes |
| 9 | ⌘M | key | panes→meta |
| 10 | ⌘D | split | meta→panes |

`window-1.jsonl` must hold exactly those ten records, in that order, each with `pane_id` null. `tweak` is not driven, because only the design tool's tweak editor sets the prop.

Plant: a split's cause written as `key` fails the gate, which names the record.

## done criteria

Every change of the window's open view is in the trace, with what changed it.

## result

- **Emits.** `App.tsx` writes `VIEW_CHANGED` from `componentDidUpdate`, carrying the cause noted by the path that changed the view. `toggleMeta` and `toggleSurface` now require a cause.
- **Vocabulary:** v0.17. A first draft of the proposal described `language` as a language shift; reading `App.tsx:625` showed `/language` sets it, and the note, proposal and rationale were corrected before any commit.
- **Commands:** `tsc` 0; `npm run build` 0; `npm run signals` 0 (75 live tags named, 12 pending); `gen_signals.py --check` 0; unit 147; Python 297 passed, 5 skipped.
- **Gates:** `view_signals` 0 from source and packaged, with 10 records in order. All 67 source gates 0, `view_signals` included. Packaged, these eight exit 0: `dialogs`, `view_signals`, `main_signals`, `pane_signals`, `trace_files`, `lifecycle_gates`, `transcript_follow`, `run_panes`.
- **Plant:** a split's cause written as `key` fails `view_signals`, which prints `key meta→panes` as the tenth record.
- **Rubber Duck Pass**, on the packaged `view_signals` trace:
  - the key, the menu, `/language` and the view button alternate panes and meta;
  - the key opens the assay page and Escape closes it;
  - the records button opens the records page, and a session row closes it back to panes;
  - the key opens meta, and a split returns to panes.

  Each change has one record with a null pane. Observations: none.
