# Sprint 092 — Isolate test and shakeout state from production

```yaml
---
id: 092
status: pending
opened_at: 2026-09-30
phase: config-externalization
pass_kind: functional
---
```

## scope

Set `SUBSTRATE_HOME` to a temp directory in both the pytest `conftest.py` and the shakeout `ServerHandle`, so test sessions never land in `~/.substrate/sessions/`. Clean up the 79 orphaned test sessions already there.

## context

4,352 sessions exist under `~/.substrate/sessions/`. 79 point at `/var/folders/` or `/tmp/pytest-` paths — created by the shakeout harness and pytest runs that wrote to production state. The workspace list filter (`is_dir()`) hides the dead ones, but the sessions themselves persist, slowing boot scan and accumulating indefinitely.

## artifact contract

### Files created

- `tests/conftest.py` — session-scoped fixture setting `SUBSTRATE_HOME` to a temp dir.

### Files modified

- `harness/shakeout/lib/server.ts` — `ServerHandle.start()` sets `SUBSTRATE_HOME` to a temp dir in the spawned server's env.

### Invariants

- After a pytest run, `ls ~/.substrate/sessions/` count does not increase.
- After a shakeout run, `ls ~/.substrate/sessions/` count does not increase.
- Existing test files continue to pass.
