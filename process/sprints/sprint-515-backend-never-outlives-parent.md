# Sprint 515 — A backend must never outlive its parent

```yaml
---
id: 515
status: closed
phase: reliability (orphan backend reaper)
pass_kind: functional
---
```

## scope

`server.py`'s parent-death watchdog ends the backend when Electron dies, but two paths leave it alive: a prior shutdown that set `shutdown_started` (and wedged) makes `_claim_shutdown()` return False, and the watchdog returns without exiting; a sweep hung on a session never reaches its `os._exit`. On 2026-11-16 backend 35270 orphaned this way, ignored SIGTERM, held session `s_e33575fd`'s record lock, and caused a `BusLockedError` on the next window. This sprint arms an `os._exit` hard-exit timer the moment a shutdown is claimed, so a wedged shutdown still kills the process within 60 s, and adds a test that a backend whose parent pid is gone exits on its own.

## prerequisites

- None. This is a defect found in the installed Substrate Next on 2026-11-16.

## context_files

- `sdd-kit-3/AGENTS.md`
- `substrate-ui/WORKING_AGREEMENT.md`
- `substrate-ui/BLACKBOARD.md` (decision entries and tail)
- `substrate-ui/server.py` (the shutdown block: `_claim_shutdown`, `_ppid_watchdog`, `_shutdown_sequence`)
- `substrate-ui/tests/test_server_sigterm_109.py`

## signal contract

### Emits

- No new tags. The watchdog's `_say` lines and `SERVER_STOPPED` (on the clean path) are unchanged.

### Consumes

- `Signal.SERVER_STOPPED` still fires from `_shutdown_sequence` when the sweep runs.

### Invariants

- No out-of-vocabulary tags are emitted.
- A clean SIGTERM quit still ends sessions and exits 0 before the deadline.

## artifact contract

### Files created

- `substrate-ui/tests/test_server_orphan_reaper_515.py`

### Files modified

- `substrate-ui/server.py`

### Content assertions

- `_claim_shutdown` starts a `threading.Timer(_SHUTDOWN_HARD_DEADLINE_S, os._exit, args=(0,))` before returning True.
- `_SHUTDOWN_HARD_DEADLINE_S` is defined as a module-level constant of 60.0 near the shutdown block.

### Command exit codes

- `uv run --project ../substrate python -m pytest substrate-ui/tests/test_server_orphan_reaper_515.py substrate-ui/tests/test_server_sigterm_109.py -q` returns 0.
- `uv run --project ../substrate ruff check substrate-ui/server.py substrate-ui/tests/test_server_orphan_reaper_515.py` returns 0.

## observation contract

- Not required: process-exit behavior is proven by a test that spawns a real server with a dead `SUBSTRATE_PARENT_PID` and asserts exit 0.

## done criteria

A backend whose Electron parent is gone exits on its own within the deadline, even if a prior shutdown claim wedged, and a test proves the reaper fires.

## notes

The two-day orphan 35270 was killed by hand (SIGKILL) on 2026-11-16; SIGTERM did nothing, which is the defect. The stuck-flag mode the timer closes is verified by inspection (inducing a wedged shutdown deterministically is hard); the parent-death exit path is tested.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] `context_files` covers the files to modify and the kit.
- [x] Signal contract's `Emits` list references only existing tags.
- [x] Artifact contract is gradable.
- [x] Observation contract not required for a process-exit fix.
- [x] Sprint sweet spot honored: one server function changed, one test file created, one concept.
