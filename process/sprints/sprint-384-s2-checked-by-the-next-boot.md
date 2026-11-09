# Sprint 384 — S2 is checked by the next boot (vocabulary v0.24, P-0.24-S2-NEXT-BOOT)

```yaml
---
id: 384
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan r4 item 10. S2 says APP_QUIT_COMPLETED is main's last record of a boot. Main's writer refuses records after it, so S2 breaks only when a boot ends without it, and that boot cannot report it. When main opens its trace, `checkLastBoot` (`electron/main.ts`) reads the end of the previous boot's main.jsonl in the same folder; a line cut short is skipped. If the last whole record is not APP_QUIT_COMPLETED, main writes INVARIANT_BROKEN S2 with that boot's id and its last record. The single-instance lock means the earlier boot has ended. `scripts/read_trace.py` says whether a launch closed (sprint 383).

## context_files

- `web/vm/signals/versions/0.23.json` (S2)
- `electron/main.ts` (`openTrace`, `closeTrace`, `mainRecord`), `electron/invariants.ts`
- launch `~/Library/Logs/Substrate/traces/20261108-060110-406b03/`: four records, the last SERVER_EXITED

## signal contract

### Emits

INVARIANT_BROKEN `rule` S2, `context.state` `{ boot_id, last: { name, proc_seq, wall }, expected }`.

## artifact contract

- **Files modified:** `electron/main.ts`; `electron/invariants.ts` (its header).
- **Command exit codes:** `tsc` 0; build 0.

## observation contract

`fault_signals.ts` launches 1 and 2 (sprint 382). Launch 1 is killed after MAIN_FAULTED. Launch 2's main.jsonl must hold exactly one INVARIANT_BROKEN: S2, with launch 1's boot id and its last record's name. Launch 2 must end with APP_QUIT_COMPLETED.

**Plant:** with `checkLastBoot` removed, the gate fails.

## done criteria

A boot that ends without closing is reported in the trace by the next boot.

## result

- **Gate:** `fault_signals` launch 2 reports `S2 {"boot_id":"20261109-024636-fd9dde","last":{"name":"MAIN_FAULTED","proc_seq":11,…}}` and closes.
- **Plant:** with `checkLastBoot` removed, it fails on "launch 2 reports S2 for launch 1".
- **Rubber Duck Pass:** launch 2 opens APP_BOOTED, TRACE_OPENED, then INVARIANT_BROKEN S2 for launch 1. Observations: none.
