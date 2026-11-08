# Sprint 360 — panes opened, closed, focused and bound; the window's first record (plan item 4, panes and window)

```yaml
---
id: 360
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan item 4, panes and the window: `PANE_OPENED`, `PANE_CLOSED`, `PANE_FOCUSED`, `PANE_BOUND`, `WINDOW_BOOTED`. A trace then says which panes exist, which has focus and what each shows, and S1's window clause holds.

Files:
- `web/app/App.tsx`: `notePanes`, run from each commit, writes what that commit changed. Pane 1's opening is written at mount. Where the state cannot say why, the path that made the change notes its cause first. The eight `PICKER_*` emits now pass their pane in the record context.
- `web/reveal.ts`: `WINDOW_BOOTED` is boot's first statement.

Design context (hard rule 8): nothing drawn changes. The notes are instance fields; no state, branch or call order moves.

## context_files

- `../sdd-kit-3/AGENTS.md`, `templates/SPRINT_CARD.md`, `grammar/PRINCIPLES.md`
- `web/vm/signals/versions/0.13.json` (pane tags, sessions, S1, S4, record context), `proposals.json`, `unemitted.json`
- `web/app/App.tsx` (read in full), `web/reveal.ts`, `web/app/keymap.ts`, `web/app/PanesView.tsx`
- `harness/shakeout/lib/electron.ts`, `run_panes.ts`, `delegate_pane.ts`, `trace_files.ts`

## signal contract

### Emits

- `PANE_OPENED` (pane_id, cause)
- `PANE_CLOSED` (pane_id, had_session)
- `PANE_FOCUSED` (pane_id, cause)
- `PANE_BOUND` (pane_id, binding, how, session_id when known)
- `WINDOW_BOOTED` (vocab_version)

### Invariants

- S1: `WINDOW_BOOTED` is a window file's first record.
- S4: `PICKER_COMMITTED` is followed by `PANE_BOUND` how picker.
- Every pane record carries its pane in the record context.

## artifact contract

### Files created

- `web/vm/signals/versions/0.14.json`, `0.14-rationale.md`
- `harness/shakeout/pane_signals.ts`
- this card
- `process/archive/WORKING_AGREEMENT-2026-11-07-v0.13.md`

### Files modified

- Code: `web/app/App.tsx`, `web/reveal.ts`
- Gates: `harness/shakeout/lib/electron.ts` (`windowRecords`), `run_panes.ts`, `delegate_pane.ts`, `trace_files.ts` (the picker's context check, which sprint 352's rule had set to null)
- `package.json`: `pane_signals` added to `gates:electron`
- Vocabulary: `proposals.json` (six proposals), `unemitted.json` (21 → 16), `current.json` → `0.14.json`
- `WORKING_AGREEMENT.md`

### Command exit codes

`npx tsc --noEmit` 0; `npm run lint` 0; `npm run build` 0; `npm run test:unit` 0; `uv run python -m pytest tests/ -q` 0; `npm run signals` 0.

## observation contract

`harness/shakeout/pane_signals.ts`, from source and packaged. It drives, in order:
- boot;
- the picker on pane 1;
- ⌘D;
- clicks on panes 1 and 2;
- File ▸ Close Pane;
- ⌘D, then a session opened on pane 3 through `window.__vm`;
- a reload with `?session=<pane 1's session>`.

It checks:
- 16 window records in order (the list is in the gate's header);
- the record counts (4 opened, 3 bound, 5 focused, 1 closed);
- each record's pane context;
- `WINDOW_BOOTED` first, with current.json's version.

`run_panes.ts` checks `PANE_OPENED` run and `PANE_BOUND` record run for each run pane. `delegate_pane.ts` checks `PANE_OPENED` delegate and `PANE_BOUND` child with the child's id.

Plants:
- click note removed → a `SIGNAL_REJECTED` with no cause; the source build throws and the launcher names it;
- every binding written `direct` → step 4 named;
- `WINDOW_BOOTED` moved after pane 1's opening → S1 named.

## done criteria

A trace names each pane's opening, closing, focus and binding with its cause. The window file opens with `WINDOW_BOOTED`.

## result

- **Built** as scoped. Vocabulary v0.14, six proposals:
  - `PANE_OPENED` loses `restore`;
  - `PANE_FOCUSED` loses `key` and gains `close`;
  - `PANE_BOUND` gains `direct`, and "bound" is defined as no longer at the picker;
  - `had_session` is defined;
  - `WINDOW_BOOTED` is written at boot's start;
  - the record context's `pane_id` is the pane the record is about.
- **Commands.**
  - `npx tsc --noEmit` 0; `npm run lint` 0; `npm run build` 0;
  - `npm run test:unit` 194 passed;
  - Python 321 passed, 5 skipped;
  - `npm run signals` 0: v0.14, 72 tags emitted, 16 pending.
- **Gates from source.** All 67 `gates:electron` commands were run, each on its own:
  - 66 exited 0. `trace_files` failed: it checked sprint 352's rule, a picker record with no pane in its context, which v0.14 replaces. The check now asks for pane 1.
  - After the fix, `trace_files` exits 0 in all four modes, and so does `pane_signals`.
- **Packaged** (`npm run pack:dev`): `pane_signals`, `trace_files`, `main_signals`, `run_panes`, `delegate_pane` 0.
- **Plants.** Each was built with exit code 0 read; each gate exited 1 and named its fault:
  - the click note removed: a `SIGNAL_REJECTED` in `window-1.jsonl` for `PANE_FOCUSED` with no cause. In a source build the rejection throws in `componentDidUpdate`, the window stops, the next click times out, and the launcher lists the rejection;
  - every binding written `direct`: step 4, `PANE_BOUND` picker, missing;
  - `WINDOW_BOOTED` after pane 1's opening: "S1: window-1.jsonl opens with PANE_OPENED".

  Restored (`cmp` equal), rebuilt, gates 0.
- **Rubber Duck Pass** (`TRACE_PRINT=1`, source, window-1.jsonl):
  - 0: `WINDOW_BOOTED` 0.14. The window began.
  - 1: `PANE_OPENED` 1 start.
  - 13, 14: `PICKER_COMMITTED` 1 (default sandbox), then `PANE_BOUND` 1 session picker. S4 holds.
  - 18, 19: `PANE_OPENED` 2 split, `PANE_FOCUSED` 2 split.
  - 23, 24: `PANE_FOCUSED` 1 click, then 2 click.
  - 25, 26: `PANE_CLOSED` 2 had_session false, `PANE_FOCUSED` 1 close.
  - 27, 28: `PANE_OPENED` 3 split, `PANE_FOCUSED` 3 split.
  - 36: `PANE_BOUND` 3 session direct, with its id.
  - After the reload: 0 `WINDOW_BOOTED`, 2 `PANE_OPENED` 1 start, 5 `PANE_BOUND` 1 session restore, with pane 1's earlier id.

  Observations:
  - Missing pair: none.
  - Order violation: the reload starts `proc_seq` again at 0 in the same `window-1.jsonl`, so two records share each order key in one file, against the record context's "the order key". The counter is in `web/vm/instrumentation/sdd.ts`, outside this sprint's files. Recorded (BLACKBOARD), fixed as its own change next.
  - Payload anomaly: the picker records' pane context was null. Resolved here, with `P-0.14-CONTEXT-PANE`.
  - Vocabulary gaps: three, resolved in v0.14: `direct`, `close`, and the two causes that could not happen.
  - Timing surprise: none.
  - Tone trace: n/a.
- **Fault found, logged, not changed here.** A record attached through File ▸ Open Record or a `substrate://record/` link goes to pane 1's controller (`web/reveal.ts`, `App.tsx` `openKey`). `attachRecordRoot` sets `sessionId` null (`web/vm/session_controller.ts`), and the window's flag for pane 1 stays unbound. So `PanesView` draws `PanePicker` over the record, and no `PANE_BOUND` is written. Seen by reading; not yet driven in the app. Its own change, with `RECORD_OPENED` in the records area.
