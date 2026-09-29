# Sprint 090 — Route substrate-ui paths through `substrate_home()`

```yaml
---
id: 090
status: done
opened_at: 2026-09-29
phase: config-externalization
pass_kind: functional
---
```

## scope

Update `fetch-python-runtime.sh` to pin `substrate-kernel==1.1.1`. Replace every `Path.home() / ".substrate"` in substrate-ui's Python code with `substrate_home()` imported from `substrate.api`. Add `SUBSTRATE_HOME=~/.substrate-dev` to the `npm run electron` script in `package.json` so the dev build uses a separate state root. The installed `.app` sets nothing and keeps `~/.substrate`.

## prerequisites

- substrate sprint 248 (`substrate-kernel==1.1.1` on PyPI)

## context_files

- `sdd-kit-3/AGENTS.md`
- `BLACKBOARD.md`
- `server.py` — lines 248, 1299, 1331, 1353, 1412, 1450, 1471, 1487, 2720, 4015
- `session_registry.py` (if it has its own `.substrate` references — verify at execution time)
- `scripts/fetch-python-runtime.sh` — line 41 (version pin)
- `package.json` — the `electron` script
- `process/planning/ROADMAP-2026-09-29-configuration-externalization.md`

## signal contract

### Emits

No new signals.

### Consumes

- All files listed in `context_files`.

### Invariants

- `grep -n "Path.home().*\.substrate" server.py` returns 0 lines after this sprint.
- The `npm run electron` script sets `SUBSTRATE_HOME`.
- The packaged `.app` does not set `SUBSTRATE_HOME` (inherits nothing; falls back to `~/.substrate`).
- `fetch-python-runtime.sh` line 41 reads `SUBSTRATE_VERSION="1.1.1"`.

## artifact contract

### Files modified

- `server.py` — all `Path.home() / ".substrate"` sites converted to `substrate_home()`.
- `scripts/fetch-python-runtime.sh` — `SUBSTRATE_VERSION` bumped to `1.1.1`.
- `package.json` — `electron` script gains `SUBSTRATE_HOME` env var.

### Content assertions

- `grep -c "Path.home().*\.substrate" server.py` returns `0`.
- `grep -c "substrate_home()" server.py` returns >= 8.
- `grep 'SUBSTRATE_VERSION="1.1.1"' scripts/fetch-python-runtime.sh` matches.
- `package.json`'s `electron` script contains `SUBSTRATE_HOME`.

### Command exit codes

- `uv run python -m pytest tests/` returns 0 (from the substrate repo, existing suite)
- `npm run electron` starts the dev server writing state to `~/.substrate-dev/` (manual verification)

## observation contract

### UI driving steps

1. Run `npm run electron`. Observe startup.
2. Open a session, type one message, observe reply.
3. Check `~/.substrate-dev/sessions/` — a session directory exists.
4. Check `~/.substrate-dev/daemon.sock` — the socket file exists.
5. Quit the app.

### Expected log substrings

- `[server]` log shows the daemon binding to `~/.substrate-dev/daemon.sock`.

### Expected runtime signals

- Existing shakeout flows pass without regression.

## done criteria

Zero `Path.home() / ".substrate"` literals remain in substrate-ui's Python code. The dev build writes to `~/.substrate-dev/`. The packaged `.app` continues writing to `~/.substrate/`. Both can run simultaneously.

## notes

The `SUBSTRATE_HOME` env var in `package.json`'s electron script needs `cross-env` or a shell-compatible form. On macOS, `SUBSTRATE_HOME=$HOME/.substrate-dev` in a shell script works. The `package.json` `electron` script is currently `"electron ."` — it becomes `"SUBSTRATE_HOME=$HOME/.substrate-dev electron ."` or uses a wrapper script. Verify the exact form at execution time.

The `session_registry.py` in substrate-ui may or may not have its own `.substrate` references independent of `server.py`. Grep at execution time — the response file's count of 11 includes both files.

The `BENCH_RESULTS` path at `server.py:1739-1748` is left as-is per the roadmap — the env var override already exists in the code, and the assay rail degrades gracefully in the packaged build. An Architect ruling on sprint 249 (kernel-side) covers this.
