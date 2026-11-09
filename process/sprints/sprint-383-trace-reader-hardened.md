# Sprint 383 — the trace reader reads a damaged launch and says which join failed, whether the launch closed, and its rule breaks

```yaml
---
id: 383
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan r4 items 10 and 12, `scripts/read_trace.py`. Four changes:

- **Damaged lines.** `load_boot` skips a line that is not a whole JSON record, and the header counts it by file and line number. A launch killed mid-write leaves its last line cut short.
- **Failed joins.** `Kernel.entry` returns the entry or the reason it has none: no manifest (with its path); a manifest naming no `record_root`; a record that could not be read (with the exception class); or a seq not in the record, with the seq the record ends at.
- **Closing.** The header's `Closed:` line says whether APP_QUIT_COMPLETED is main's last record. A launch that does not end with it is either still running or ended without closing. When a later launch is in the same folder, the earlier one has ended, so S2 is broken.
- **Rule breaks.** `Rule breaks:` counts the INVARIANT_BROKEN records by rule.

## context_files

- `scripts/read_trace.py`, `tests/test_read_trace.py`, `harness/shakeout/trace_reader.ts` (its `not in the record` check)

## signal contract

Reads the trace; emits nothing.

## artifact contract

- **Files modified:** `scripts/read_trace.py`, `tests/test_read_trace.py`.
- **Command exit codes:** `pytest tests/test_read_trace.py` 0; ruff check and format 0.

## observation contract

Fixture files in `tests/test_read_trace.py`:

- a main.jsonl whose last line is cut short;
- a session with no manifest, then one whose record raises PermissionError;
- a launch without its closing record, then a later launch that closed and broke S2.

`harness/shakeout/trace_reader.ts` reads a real launch, from source and packaged.

## done criteria

An agent reading a damaged or unclosed launch learns what is damaged, what did not join and why, and whether the launch closed.

## result

- **Tests:** `tests/test_read_trace.py` 5 passed: the two from sprint 378, and three new.
- **Plant:** each new test fails against the reader before this sprint.
  - The cut line raised `JSONDecodeError`.
  - The joins printed one message for every failure.
  - There was no `Closed:` line.
- **Gate:** `trace_reader` 0 from source.
- **Rubber Duck Pass:** not applicable; the reader emits nothing.
