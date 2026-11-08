# Sprint 365 — the window writes each dialog's opening and closing (DIALOG_OPENED, DIALOG_CLOSED)

```yaml
---
id: 365
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan r3 item 4, the window's dialogs. Every dialog opens through `web/app/state/dialogs.ts`, which writes `DIALOG_OPENED` with the dialog's id. `closeDialog` takes the close's outcome from its caller and writes `DIALOG_CLOSED` when a dialog was open:
- `confirmed`: export's ↵ button and "end session";
- `cancelled`: the backdrop and the cancel and close buttons;
- `escape`: the Escape key, routed in `App.tsx`.

Settings has no confirm button. Its "close esc" button closes it as `cancelled`.

## context_files

- `../sdd-kit-3/AGENTS.md`; `web/vm/signals/versions/current.json` (`DIALOG_OPENED`, `DIALOG_CLOSED`)
- `web/app/state/dialogs.ts`, `web/app/Dialogs.tsx`, `web/app/App.tsx` (the Escape route), `web/app/keymap.ts`
- `harness/shakeout/dialogs.ts`, `harness/shakeout/lib/electron.ts` (`windowRecords`)
- design canon: no copy, layout or style changes; the dialogs draw as before

## signal contract

### Emits

- `DIALOG_OPENED` (`dialog`: `settings`, `export`, `end-session`)
- `DIALOG_CLOSED` (`dialog`, `outcome`: `DialogClosedOutcome`)

### Invariants

- Each close of an open dialog writes exactly one `DIALOG_CLOSED`. A close with no dialog open writes nothing.
- Dialog records carry no pane in their context.
- No behaviour, text or layout changes.

## artifact contract

### Files modified

- `web/app/state/dialogs.ts`, `web/app/Dialogs.tsx`, `web/app/App.tsx` (one line, and one import)
- `harness/shakeout/dialogs.ts`, `web/vm/signals/unemitted.json`

### Command exit codes

`npx tsc --noEmit` 0; `npx tsc -p harness --noEmit` 0; `npm run build` 0; `npm run signals` 0; `npm run test:unit` 0.

## observation contract

`harness/shakeout/dialogs.ts`, from source and packaged, drives these steps:
1. end-session opens, then cancel esc;
2. end-session opens, then "end session";
3. ⌘, then Escape;
4. a reload, then ⌘,.

After the app closes, `window-1.jsonl` holds exactly these dialog records, in order, each with `pane_id` null: OPENED end-session, CLOSED end-session cancelled, OPENED end-session, CLOSED end-session confirmed, OPENED settings, CLOSED settings escape, OPENED settings.

Plant: Escape written as `cancelled` fails the gate, which names the record.

## done criteria

Each dialog the window opens and closes is in the trace with how it closed.

## result

- **Emits.** `web/app/state/dialogs.ts` writes `DIALOG_OPENED` from its one opener, and `DIALOG_CLOSED` from `closeDialog`. `closeDialog` now requires the outcome, so `tsc` rejects a close that names none. In `Dialogs.tsx`, the backdrop and the cancel and close buttons close as `cancelled`, and export's ↵ and "end session" as `confirmed`. App's Escape route closes as `escape`.
- **Commands:** `tsc` 0 for the window and for the harness; `npm run build` 0; `npm run signals` 0 (74 live tags named); unit 147; Python 297 passed, 5 skipped.
- **Gates:** `dialogs` 0 from source and packaged, with 7 dialog records in order. All 67 source gates 0.
- **Plant:** Escape written as `cancelled` fails `dialogs`, which prints `DIALOG_CLOSED settings cancelled`.
- **Rubber Duck Pass**, on the packaged `dialogs` trace:
  - end-session opened, then closed cancelled;
  - end-session opened, then closed confirmed;
  - settings opened, then closed with Escape;
  - after the reload, settings opened. The app quit with it still open, so no close follows.

  Each record has a null pane. Observations: none.
