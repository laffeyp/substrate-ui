# Sprint 353 — the trace on disk: the server's writer; no cap

```yaml
---
id: 353
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

`server.py` writes `server.jsonl` into the launch folder main names (`SUBSTRATE_TRACE_DIR`, `SUBSTRATE_BOOT_ID`), with the record context, synchronous appends under a lock, losses counted and reported as `TRACE_LOST`. `SERVER_STARTED` (after the boot scan, with the store's counts), `TRACE_OPENED`, `SERVER_STOPPED` (at the SIGTERM shutdown). The Architect's direction mid-sprint (2026-11-05, "no cap on the trace, or it needs to be LARGE"): no file has a size cap and no launch folder is removed; `SUBSTRATE_TRACE_CAP` sets a cap for the loss gate only. Plan item 2, last of three. Files: `server.py`, `electron/main.js` (the cap and pruning removed).

## signal contract

Emits: `SERVER_STARTED`, `TRACE_OPENED` (process server), `SERVER_STOPPED`, `TRACE_LOST` (process server).

## observation contract

`harness/shakeout/trace_files.ts`: `server.jsonl` opens with `SERVER_STARTED`, holds `TRACE_OPENED`, ends with `SERVER_STOPPED`, `proc_seq` 0…n, the launch's boot id on every line.

## result

- **Built** as scoped; the server prints one stdout line (copied to `substrate.log`) when it cannot open `server.jsonl`, the one loss that has no file to report in.
- **Commands.** `ruff check`, `ruff format --check` on `server.py` clean; build 0; `npm run test:unit` 143; `pytest tests/` 266 passed, 5 skipped; gates `trace_files` 0 and `TRACE_PLANT=cap trace_files` 0.
- **Rubber Duck Pass** (printed trace). `SERVER_STARTED` (port 61519, 0 sessions found: the gate's empty store), `TRACE_OPENED` (server), `SERVER_STOPPED` (0 ended, 0 skipped, 0 failed), proc_seq 0–2, the launch's boot id. Observations: order, S1's server clause holds today but not once request records exist, because the boot scan runs after serving starts (recorded, open proposal `P-0.7-OPEN-S1-SERVER`, settled in item 4); the server-side loss path has no planted fault (the cap seam reaches it, but the gate's server file stays under 1,500 bytes; recorded).
