# Sprint 079 — server dynamic port + Electron readback contract

```yaml
---
id: 079
status: closed
opened_at: 2026-09-24
closed_at: 2026-09-24
closed_by: agent
commit: d43cae1
phase: 9
pass_kind: implementation
---
```

## scope

Two Electron instances collide on hard-coded 8765. `server.py` accepts `--port 0` and prints the OS-chosen port; Electron reads it back.

## deliverables (from the commit)

- `server.py` — `argparse` in `main()` for `--host` and `--port`, defaulting to the existing `SUBSTRATE_UI_HOST`/`SUBSTRATE_UI_PORT` env values so callers using them keep working. `--port 0` asks the OS for an ephemeral port. After `ThreadingHTTPServer` binds, read the actual port from `srv.server_address[1]` and print `substrate-ui port=<n>\n` (flushed) as the first stdout line. Rewrite the summary line so it carries the real bound port even when `--port 0` was passed.
- `electron/main.js` — replace the hard-coded `PORT=8765` with a `--port 0` spawn. Buffer stdout, match `/^substrate-ui port=(\d+)$/m` until the readback line appears (5 s timeout), then poll health on the read-back port. `loadURL` uses the same port. The Sprint 078 health-check loop keeps its shape; only the port source changes.
- `harness/_electron_sprint079_exit.ts` — launches two `electron .` instances back to back, waits for each to print `[electron] server bound port=<n>`, asserts the two ports differ and both are listening. PASS: two independent servers on 59771 and 59787 in the run captured.

Shakeout `ServerHandle` unaffected — it spawns without `--port`, keeps default 8765 from the env. Verified.

## exit gates (verified by the commit)

- typecheck ✓
- lint ✓
- 14/14 unit ✓
- `[vm-vocab-parity] OK — vocabulary 0.1 (30 tags: 30 live + 0 retired, locked=true); code emits 30 distinct live tag(s), all locked.`
- smoke:vm 11/11 ✓

## follow-up

Sprint 080: native macOS menu bar + `window.native.onMenuCommand`.

## artifact

Commit `d43cae1` (2026-09-24 17:04:16 -0700). Card is the retro-summary Peter asked for on 2026-09-25.
