# Sprint 378 — one command prints a launch's signals for an AI, joined to the kernel's record

```yaml
---
id: 378
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan r3 item 6. `scripts/read_trace.py` prints one launch's signals, from `main.jsonl`, `server.jsonl` and each `window-<id>.jsonl`, as one listing in foundation 02's `format_for_ai` shape:
- a header naming the launch, the app and kernel commits, and the vocabulary version;
- the count;
- the signals in order, under a `### <category>` line each time the category changes;
- each signal as `t=<s>  TAG  [where]  field=value ...`.

It filters by category, window, pane or session. The command:

```
uv run --project ../substrate python scripts/read_trace.py [--boot ID] [--home DIR] [--category C] [--window N] [--pane N] [--session ID]
```

**Order.** Within one file, by `proc_seq`. Across files, by the causal pairs the trace states:
- the server's SESSION_CREATED before the window's ack of that session;
- the server's k-th TURN_ACCEPTED of a session before the window's k-th TURN_ACK;
- main's k-th SERVER_SPAWNED before the server's k-th SERVER_STARTED;
- main's WINDOW_OPENED before that window's first signal.

Signals those leave unordered go by wall time, which never overrides a stated order. This reads plan item 2's "merges on boot id, then causal keys, then per-process order" for the case the plan leaves open: two signals with no stated order between them.

**Join.** A signal that names a session and a seq is followed by the kernel's entry at that seq: `↳ kernel seq=<n> <kind> producer=<p> <payload, 120 chars>`. The reader uses substrate's `read_record`, on the `record_root` the session's manifest names. A seq the record lacks prints as "not in the record" (evidence E7). The signals that name a seq are TRANSCRIPT_ROW_DRAWN, TRANSCRIPT_ROW_SKIPPED, and a pane's STREAM_ENVELOPE_APPENDED, whose session is the pane's last acked or attached one.

## artifact contract

### Files created

- `scripts/read_trace.py`; `tests/test_read_trace.py`; `harness/shakeout/trace_reader.ts`

### Command exit codes

`ruff check` 0 and `ruff format --check` 0 on both Python files; `pytest tests/test_read_trace.py` 0 (2 passed).

## observation contract

`harness/shakeout/trace_reader.ts`: pane 1 picks the sandbox and the deterministic model and sends "hello"; the app closes; the reader prints pane 1. The listing alone must show, in order:
1. the picker's folder armed;
2. the commit;
3. the session's open acked;
4. the turn submitted;
5. the turn acked;
6. the reply's drawn row, followed by its kernel line naming ModelReply.

No seq may be missing from the record.

Plant: a reader that skips the join prints no kernel line, and the gate fails.
