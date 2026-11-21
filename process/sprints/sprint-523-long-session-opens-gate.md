# Sprint 523 — The gate: a long session opens and draws

```yaml
---
id: 523
status: closed
phase: window productionized (roadmap 2026-11-18-window-productionizing r1, W1)
pass_kind: observation
depends_on: []
plan: process/planning/2026-11-18-window-productionizing/ROADMAP-2026-11-19-window-productionizing-r1.md
---
```

## scope

A gate that makes a long session the way real sessions are made and opens it the way the Architect does, end to end, nothing patched. In the launch's scratch state it writes a hand-written Claude Code session file (thousands of exchanges with varied text, as `tests/test_esc_while_a_long_session_loads.py` does), continues it through `POST /api/session` with the `deterministic` driver and a script of many real tool calls through the kernel's tools — reads, writes, short commands, and one `bash` command that streams megabytes in tens of thousands of `ToolProgress` chunks — and runs the turn with `POST /turn` to its end. It then opens the session in a fresh window from a `substrate://session/<id>` link and checks: the window takes in the record's last envelope and draws its last row; the page's working set (`app.getAppMetrics()`) stays under the budget; no `RENDERER_GONE` is written; the time from link to last row is under the bound. One verifiable property: on today's tree the gate fails, and its failure names which check broke.

## context_files

- `process/planning/2026-11-18-window-productionizing/RESEARCH-2026-11-19-window-productionizing.md` (§ 1, § 6)
- `harness/replay_memory.ts` (the measurement this gate turns into a check)
- `harness/shakeout/tool_output_text.ts` (a scripted `deterministic` turn of real tool calls)
- `harness/shakeout/lib/electron.ts`, `lib/procs.ts`, `lib/scratch.ts`
- `tests/test_esc_while_a_long_session_loads.py` (the hand-written Claude Code file's shape)
- The kernel's `bash` tool, for how a running command's output is cut into `ToolProgress` chunks (`../substrate/src/substrate/topologies/tool_loop/tools.py` and its caller), so the streaming command is shaped to make tens of thousands of chunks rather than a few large ones
- `web/vm/signals/versions/current.json` (`STREAM_ENVELOPE_APPENDED`, `TRANSCRIPT_ROW_DRAWN`, `RENDERER_GONE`)

## signal contract

### Emits (read from the trace; no new tags)

- `SESSION_CREATED` (server.jsonl) with `continued_from` `claude_code`
- `DEEP_LINK_RECEIVED` `link_kind` `session` (main.jsonl)
- `SESSION_ATTACH_STARTED`, `STREAM_ATTACHED`, `STREAM_ENVELOPE_APPENDED` up to the record's last seq, `TRANSCRIPT_ROW_DRAWN` for the last row (window-<id>.jsonl)
- No `RENDERER_GONE`, no `INVARIANT_BROKEN`

### Invariants

- No record from this machine is copied or read; the session is made inside the launch's scratch state and removed with it.
- The gate's window is unfocusable and lets the mouse through (`GATE_ISOLATED`), as every gate's is.

## artifact contract

### Files created

- `harness/shakeout/lib/long_session.ts` — writes the hand-written Claude Code file and builds the tool-call script.
- `harness/shakeout/long_session_open.ts` — the gate.

### Content assertions

- The gate prints one JSON line per sample (seconds, envelopes taken in, working set) and a final verdict line naming each check `pass` or `fail`.
- The record the gate makes holds at least 20,000 envelopes, and one call at least 10,000 `ToolProgress` chunks totalling at least 2 MB; the gate checks both before it opens the link and refuses to judge the window on a smaller record.

### Command exit codes

- `npx tsc -p harness --noEmit` returns 0.
- `npx tsx harness/shakeout/long_session_open.ts` returns non-zero on today's tree, its verdict naming the check that broke.

## observation contract

### UI driving steps

- Launch the app (source, or `LONG_APP=$APP` for a bundle); make the session through the server; quit nothing; open a new window on the session by `app.emit("open-url", …, "substrate://session/<id>")`, as `harness/replay_memory.ts` does.

### Expected runtime signals

- As in the signal contract. On today's tree, expected: `RENDERER_GONE` `crashed`, or the working set over budget before the last row.

### Budget and bound (provisional)

- Working set: 1.5 GB for the page. The roadmap's W2 sets the budget from the batched window's measurement; until then 1.5 GB is under the 8.67 GB the page reached and over the 0.55 GB it held at 4,163 envelopes.
- Link to last row: 60 s. The fold alone took 1.9 s for 28,513 envelopes; W2 tightens it.

## done criteria

The gate makes a record of the size that killed the page, opens it from a link, and fails on today's tree with a verdict that names the broken check; it is the check every later W-item runs.
