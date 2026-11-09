# Sprint 386 — the packaged dialogs failure is instrumented; K340-Q-1 is fixed in the kernel (K341)

```yaml
---
id: 386
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan r4 item 13. Two failures from the clean build of 2026-11-08 had no cause.

**The packaged `dialogs` gate failed once.** After the reload, ⌘, opened no settings within 5 s; 25 reruns passed. The failing run's trace was deleted.

Hypothesis: `waitForApp` waits on `window.__vm`, which `web/reveal.ts` sets before React mounts the App and its keydown listener. It was tested where it bites: the App's commit state was read in the same evaluation that first sees `__vm`, on 100 reloads, 40 idle and 60 under eight busy loops. All 100 had committed. The hypothesis is false. React's mount task runs before Playwright's frame-timed poll.

Two changes leave a recurrence nothing to hide:

- `lib/electron.ts` `cleanup` keeps a launch's folders when its gate fails, or when the launch broke a rule, and prints the `read_trace.py` command.
- `dialogs.ts`, on failure, prints the window's records since its last boot. KEY_ROUTED shows whether ⌘, reached the App's keys and what it did; DIALOG_OPENED shows whether the dialog opened.

**The kernel test `test_inspect_record_summary_read_back_by_model` failed 6 of 6 (K340-Q-1).** The cause was found by printing the model's calls in the real test run:

1. `qwen2.5:7b-instruct` drops `/seeded` from pytest's long temp path.
2. The tool answers "no record at <folder>".
3. The model asks for a path.

Fixed in the kernel, K341 (`4a7be72c`):

- the error names the records near the path and the call that reads one;
- the test's own session record moves out of the seeded record's folder.

## context_files

- `harness/shakeout/dialogs.ts`, `harness/shakeout/lib/electron.ts`, `web/reveal.ts`, `web/app/App.tsx` (`componentDidMount`, `onKey`), `web/app/keymap.ts`
- `../substrate/src/substrate/topologies/tool_loop/substrate_tools.py` (`inspect_record`), `../substrate/tests/test_realmodel_tool_comprehension.py`, `../substrate/process/BLACKBOARD.md` (K340-Q-1)

## artifact contract

- **Files modified:** `harness/shakeout/dialogs.ts`, `harness/shakeout/lib/electron.ts`.
- **Kernel files:** K341's (its own commit).

## observation contract

- **`dialogs` plant:** the reload's ⌘, was replaced by ⌘. The gate failed and printed `WINDOW_BOOTED, PANE_DRAWN, KEY_ROUTED Meta+.→none@none`, and the launch's state was kept.
- **K341:** the real-model test 6 of 6 under six pytest temp paths.

## done criteria

The kernel test passes. A recurrence of the `dialogs` failure names its step and keeps its trace.

## result

- **`dialogs`:** 0 from source. The packaged reruns are recorded in the `built` entry.
- **The mount probe:** 0 of 100 reloads saw `__vm` before the App committed.
- **K341:** `tests/test_substrate_tools_inspect_record_227.py` 19, and the real-model test 6 of 6.
- **Rubber Duck Pass**, on the plant's window records:
  1. the window booted;
  2. pane 1 was drawn;
  3. the key Meta+. was routed to no action.

  Observations: none.
