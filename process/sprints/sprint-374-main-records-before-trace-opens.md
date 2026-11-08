# Sprint 374 — main's records asked for before the trace opens are held, not dropped

```yaml
---
id: 374
status: active
phase: SDD re-centre
pass_kind: functional
---
```

## scope

A fault the runtime checker found (sprint 373). On the source gate run of 2026-11-08, `electron_deeplink`'s cold launch broke S1: `main.jsonl` opened with DEEP_LINK_RECEIVED at `proc_seq` 0, before APP_BOOTED. Two causes in `electron/main.ts`:
- `openTrace` set the trace folder and then ran `buildCommits()`, whose `git` calls take about 29 ms. The gate's `open-url` was written in that gap.
- An `open-url` before `whenReady` (macOS delivers a cold launch's link that way) reached `traceWrite` with no folder. That returns before the loss count, so the record was dropped with no TRACE_LOST. Item 2 of the plan says a failed append never stays silent.

The fix:
- `mainRecord` holds any record asked for before `openTrace` has run. `openTrace` writes them after APP_BOOTED and TRACE_OPENED, each with its own `wall`; the order key is the order written.
- `openTrace` runs `buildCommits()` before it sets the folder.
- If the folder cannot be made, the held records are counted as lost and named on stderr.

## context_files

- `electron/main.ts` (`mainRecord`, `openTrace`, `forwardDeepLink`, `open-url`); `harness/shakeout/electron_deeplink.ts`
- `web/vm/signals/versions/0.21.json` (S1, `record_context`)

## signal contract

### Emits

No new tag. APP_BOOTED stays main's first record (S1); DEEP_LINK_RECEIVED on a cold launch reaches `main.jsonl`.

## artifact contract

### Files modified

- `electron/main.ts`; `harness/shakeout/electron_deeplink.ts`

### Command exit codes

`npx tsc -p electron --noEmit` 0; `npm run build` 0.

## observation contract

`electron_deeplink`'s cold launch (gate `SHAKEOUT_AXIS=C run.ts`), after its flush check, closes the app and reads `main.jsonl`. It must open with APP_BOOTED, hold a DEEP_LINK_RECEIVED, and hold no INVARIANT_BROKEN.

Plant: with the hold turned off, axis C fails with "cold: main.jsonl opens APP_BOOTED, TRACE_OPENED, SERVER_SPAWNED, SERVER_BOUND". The link is dropped, as on a real cold launch before the fix.

## done criteria

A link that opens the app is in the trace, after APP_BOOTED.
