# Sprint 487 — a test server started from a session keeps to its own trace

```yaml
---
id: 487
status: closed
phase: second build (roadmap r1), E1
pass_kind: functional
---
```

## scope

`harness/shakeout/lib/server.ts` starts `server.py` with `...process.env`, so from a session inside the working install it passes on the working backend's `SUBSTRATE_TRACE_DIR`, `SUBSTRATE_BOOT_ID` and `SUBSTRATE_PARENT_PID`. The test server then appends its records to the working install's `server.jsonl` under the working boot id (measured: `vm_smoke` wrote 6 records, `SERVER_STARTED` at `proc_seq` 0). The harness server drops those three variables from its child's environment, as a terminal run has them. One verifiable property: with the three variables set in the parent, the harness server writes nothing into the named trace folder.

## prerequisites

- 486.

## context_files

- `../sdd-kit-3/AGENTS.md`
- `process/planning/2026-11-11-second-build/PAPER-2026-11-11-second-build-r2.md` (section 3)
- `harness/shakeout/lib/server.ts`, `harness/vm_smoke.ts`
- `server.py` (the trace writer, lines 499–530; the watchdog, lines 6930–6945)
- `web/vm/signals/versions/current.json` (`SERVER_STARTED`, the merge by boot_id and proc_seq)

## signal contract

### Emits

No new tag.

### Consumes

- `SERVER_STARTED`, `TRACE_OPENED` in the named trace folder (none expected).

### Invariants

- A launch's `server.jsonl` holds one `SERVER_STARTED` per server it started.
- A terminal run of `vm_smoke` and every gate behave as before.

## artifact contract

### Files created

- `harness/shakeout/trace_inherit.ts` (gate)

### Files modified

- `harness/shakeout/lib/server.ts`

### Content assertions

- `server.ts`'s child environment has no `SUBSTRATE_TRACE_DIR`, `SUBSTRATE_BOOT_ID` or `SUBSTRATE_PARENT_PID` taken from the parent.

### Command exit codes

- `npm run build`, `npx tsx harness/vm_smoke.ts` return 0.

## observation contract

### UI driving steps

Gate `trace_inherit`: sets the three variables to a scratch folder, a fake boot id and its own pid, as a session's `bash` passes them; starts the harness server; drives one turn; stops it. Then `vm_smoke` from a terminal.

### Expected log substrings

- The scratch folder holds no `server.jsonl`.

### Expected runtime signals

- The harness server's own state root, not the scratch folder, is where its records go.

### Expected screenshot / visual state

- None (no window).

## done criteria

A test run from inside the working install writes nothing into the working install's record.

## notes

The kernel comment on the store lock (`../substrate/src/substrate/topologies/session_registry.py`, corrected 2026-11-11) is uncommitted: `../substrate`'s pre-commit hook fails on ruff over 8 untracked scripts in `process/planning/substrate-boundary-and-runbook-2026-11-09/`, which this work did not write. Mutant: the spread environment put back fails the gate.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] context_files cover the leak, the writer and the vocabulary's merge rule.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Two files.

## close

`harness/shakeout/lib/server.ts` builds its child's environment in `serverEnv`, which drops `INHERITED_LAUNCH_VARS` (`SUBSTRATE_TRACE_DIR`, `SUBSTRATE_BOOT_ID`, `SUBSTRATE_PARENT_PID`). Gate `harness/shakeout/trace_inherit.ts` sets the three as a session's `bash` passes them, opens a session on the deterministic driver, runs one turn to its park and ends it, then reads the named folder.

- From source: ok; no `server.jsonl` in the inherited folder.
- On the bundle (`dist-electron/mac-arm64/Substrate.app`, build 1794463909, its own interpreter and `server.py`): ok, packaged true.
- Mutant (the three kept): fails, "6 records written into the inherited trace folder (boot ids running-app-boot)", the symptom measured before the sprint.
- `npm run build` 0; `vm_smoke` 0, 12 of 12.

The gate's first two runs failed on the gate's own fault: it read `BASE_URL` before `start()` set the port (the module names it a live binding) and skipped the roster load `vm_smoke` does first. Both fixed in the gate.

No bundle is built or installed: the app's code is unchanged. Sprint 491 observes the fix from a real session inside the working install.

Rubber Duck Pass: the trace the sprint concerns is the server's `server.jsonl`. Narrated: with the fix, the test server opened no trace (its `TRACE_OPENED` and `SERVER_STARTED` went nowhere, as on a terminal run); with the mutant, `SERVER_STARTED` and five more records landed under a boot id not the test server's own, breaking the merge by boot_id and proc_seq. No observations remain.
