# Sprint 053 — fold `delegate` into the daily-driver session toolset

```yaml
---
id: 053
status: closed
phase: 5
pass_kind: functional
---
```

## scope

Fix the Sprint 228 card-vs-implementation drift the shakeout surfaced.
`_build_session_topology_from_manifest` in `server.py` (line 437-502)
folds seven substrate-toolkit tools into `session_tools` but drops
`delegate`. Sprint 228's card at
`substrate/process/sprints/sprint-228-toolkit-list-tools.md` names
eight, `delegate` among them. Compose `delegate` in per the card's
original specification.

## context_files

- `substrate/process/sprints/sprint-228-toolkit-list-tools.md` (the
  original specification)
- `server.py` line 45 (import), 437-502 (function), 2371-2423 (the
  studio-path precedent that already composes `delegate`)
- `substrate/src/substrate/topologies/tool_loop/delegate.py`
  `make_delegate` signature
- `harness/shakeout/tools_index.ts` `tool_delegate` flow
- Sprint 052 output (the shakeout report at
  `captures/shakeout-2026-09-21/report.json`)

## signal contract

### Emits

No new tags. The reveal shell already emits
`CHILD_RECORD_ATTACH_REQUESTED` and `STREAM_ATTACHED` under the
`record_root` variant when a session delegates.

### Invariants

- The composition test asserting session_tools contents grows from
  seven substrate-toolkit tools to eight (adding `delegate`).

## artifact contract

### Files modified

- `server.py` — add `"delegate": make_delegate(responder=responder,
  root=Path(manifest.workspace), child_suite_factory=full_suite, ...)`
  to the `session_tools` dict at line 473-482, mirroring the studio
  path's `_with_delegate` at 2378-2400.

### Content assertions

- `grep -n '"delegate": make_delegate' server.py` returns a hit in
  `_build_session_topology_from_manifest`.
- The session toolset the daemon binds contains `delegate` (verified
  via `tests/test_session_tool_suite_composition_228.py` after the
  eight-tool bump).

### Command exit codes

- `SHAKEOUT_AXIS=B SHAKEOUT_RUNS=1 npx tsx harness/shakeout/run.ts`
  returns 0 with `tool_delegate` flow logging at least one `ToolCall`
  with `toolName === "delegate"` and a paired `ToolResult`.

## observation contract

Open a real session via `/`. Prompt: "call the delegate tool once
with a small sub-task and report the child's answer." Verify a tool
card appears in the transcript with `delegate` in the header and a
child record is reachable.

## done criteria

- `delegate` present in every daily-driver session's toolset.
- Shakeout `tool_delegate` flow reaches Park with a real `ToolCall`
  envelope carrying `tool_name="delegate"`.
- Composition test asserts on eight substrate-toolkit tools.
