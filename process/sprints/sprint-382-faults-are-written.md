# Sprint 382 — crashes and hangs are written (WINDOW_FAULTED, MAIN_FAULTED, RENDERER_GONE, WINDOW_UNRESPONSIVE, WINDOW_RESPONSIVE, CHILD_PROCESS_GONE, RUN_FAULTED, SERVER_UNCAUGHT; vocabulary v0.24)

```yaml
---
id: 382
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan r4 item 9. Each process writes the faults it printed to stderr or to nobody:

- **The window** (`web/reveal.ts`): its `error` and `unhandledrejection` events.
- **Main** (`electron/main.ts`):
  - Node's `uncaughtExceptionMonitor` and `warning` events;
  - Electron's `render-process-gone`, `unresponsive`, `responsive`, `preload-error` and `child-process-gone`.
- **The server** (`server.py`): `_run_background`'s exception, and `threading.excepthook` and `sys.excepthook`, each chained to the hook before it (`_install_fault_hooks`).
- **SERVER_EXITED** gains `error_type`, the exception class on the last line of the server's stderr.

Every hook observes and changes nothing. Electron still shows its error box on an uncaught exception, and still prints its warning on a rejection. `P-0.24-FAULTS`, `P-0.24-SERVER-EXITED-CAUSE`.

## context_files

- `../sdd-kit-3/AGENTS.md`; `web/vm/signals/versions/0.23.json` (SERVER_EXITED, SERVER_FAULTED, S1, T1, T2)
- `electron/main.ts`, `electron/invariants.ts`, `web/reveal.ts`, `web/vm/instrumentation/sdd.ts`, `server.py` (`_Trace`, `Handler._fault`, `_run_background`, `main`)
- `node_modules/electron/electron.d.ts` (`RenderProcessGoneDetails`, the `child-process-gone` details, `preload-error`)

## signal contract

### Emits

- WINDOW_FAULTED (`error_type`, `source` error | rejection | preload, `where`)
- MAIN_FAULTED (`error_type`, `source` exception | rejection)
- RENDERER_GONE (`reason`, `exit_code`), in the window's context
- WINDOW_UNRESPONSIVE, then WINDOW_RESPONSIVE (`unresponsive_ms`)
- CHILD_PROCESS_GONE (`type`, `reason`, `exit_code`)
- RUN_FAULTED (`run_id`, `error_type`, `where`)
- SERVER_UNCAUGHT (`thread`, `error_type`, `where`)
- SERVER_EXITED `error_type`

### Invariants

- No message text in any payload (E1).
- One WINDOW_UNRESPONSIVE per hang: Electron repeats the event about every 16 s.
- S1 admits SERVER_UNCAUGHT as the first record of a server that dies before it binds (`P-0.24-S1-SERVER-CRASH`).
- T1 and T2 waits end at SERVER_EXITED (`P-0.24-T1-T2-END-AT-EXIT`).

## artifact contract

### Files created

- `harness/shakeout/fault_signals.ts`
- `tests/test_server_faults.py`
- `web/vm/signals/versions/0.24.json`, `0.24-rationale.md`

### Files modified

- `electron/main.ts`, `web/reveal.ts`, `server.py`, `electron/invariants.ts`
- `web/app/__tests__/invariants.spec.ts`
- the generated files, `proposals.json`, `current.json`
- `package.json` (`gates:electron`)

### Command exit codes

`npx tsc --noEmit` 0; `npm run build` 0; `npm run test:unit` 0; `npm run signals` 0; `gen_signals.py --check` 0; `pytest tests/test_server_faults.py` 0.

## observation contract

`harness/shakeout/fault_signals.ts`, run from source and packaged. Three launches share one state root.

**Launch 1** plants each fault in turn, and window-1.jsonl or main.jsonl must hold each record:

- a window `TypeError` thrown from a timer, and a `RangeError` rejection;
- a render error, from meta's stream lens given envelopes it cannot draw;
- a main rejection;
- the GPU process killed;
- Electron's `unresponsive` twice, then `responsive`;
- `preload-error` emitted;
- the renderer crashed;
- main throwing from a timer.

The gate then kills the app.

**Launch 2:** its main.jsonl holds INVARIANT_BROKEN S2 naming launch 1. **Launch 3:** with `<home>/sessions` a file, the server dies (`FileExistsError`); server.jsonl's one record is SERVER_UNCAUGHT, SERVER_EXITED carries `error_type`, and no rule breaks.

No trace file holds the word "planted".

The hang is emitted rather than driven. Measured on Electron 44: with a debugger attached, a 45 s spin fires `responsive` alone; without one, `unresponsive` comes at 16.6 s. Playwright attaches a debugger to every page.

**Plants:** with the window's `unhandledrejection` listener renamed, the gate fails on two checks.

## done criteria

Every fault the app can suffer in window, main or server is in the trace with its class and place.

## result

- **Commands:**
  - `tsc` 0; build 0;
  - unit 161, then 162 with the T1/T2 case;
  - `test_server_faults.py` 2 passed.
- **Gate:** `fault_signals` 0 from source.
- **Plant:** with the window's `unhandledrejection` listener renamed, and `checkLastBoot` removed (sprint 384), it fails on four checks.
- **Rubber Duck Pass**, on the source launch's main.jsonl:
  - APP_BOOTED, TRACE_OPENED, SERVER_SPAWNED, SERVER_BOUND, WINDOW_OPENED;
  - MAIN_FAULTED rejection RangeError; CHILD_PROCESS_GONE gpu;
  - WINDOW_UNRESPONSIVE, then WINDOW_RESPONSIVE 604 ms;
  - WINDOW_FAULTED preload SyntaxError at preload.js;
  - RENDERER_GONE killed, exit code 2;
  - MAIN_FAULTED exception TypeError;
  - nothing after: the boot was killed.

  Observations, each `resolved-here`:
  - a server that died at startup broke T1 five seconds after its SERVER_EXITED (`P-0.24-T1-T2-END-AT-EXIT`);
  - the dying server's first record is SERVER_UNCAUGHT (`P-0.24-S1-SERVER-CRASH`).
