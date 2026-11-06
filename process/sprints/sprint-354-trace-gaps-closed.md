# Sprint 354 — the trace's open gaps closed: SERVER_STARTED at bind (v0.8), server losses reported through main, the window's loss path tested

```yaml
---
id: 354
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Sprint 353 closed plan item 2 with three paths no fault had driven and one locked rule that a correct run could break:

1. `SERVER_STARTED` was written after the boot scan, which runs on a background thread while the server already serves. S1 ("`SERVER_STARTED` the server's first record") fails once any request record exists, and the `server_run` session (opened by `SERVER_STARTED`) would not frame requests served during the scan. Fix in the vocabulary, not by loosening S1: v0.8 splits `SERVER_STARTED` (`TAG_SPLIT_PROPOSED`) into `SERVER_STARTED` (port; written when the port is bound, before either listener serves) and `STORE_SCANNED` (the scan's counts, its skipped manifests and its duration). S1 then holds as written; `P-0.7-OPEN-S1-SERVER` is withdrawn, its cause removed.
2. A line the server could not write was reported only in `server.jsonl` on its next good write. A capped or unopenable file has no next good write, so the loss reached no trace file. Fix: the server reports each loss burst on stdout (`substrate-ui trace_lost=<total>`), first loss at once, the rest on its next good write and at shutdown; main writes it to `main.jsonl` as `TRACE_LOST` (process server) and counts it in `APP_QUIT_COMPLETED.signals_lost`. One reporter per loss: the server no longer writes its own `TRACE_LOST`.
3. The server's loss path had no planted fault. `SUBSTRATE_SERVER_TRACE_CAP` caps `server.jsonl` only (a test seam, as `SUBSTRATE_TRACE_CAP` is for main's files); `TRACE_PLANT=server-cap` drives it.
4. The window's send-loss path (`native.signal` throws, counted, reported as `TRACE_LOST` on the next good send) had no planted fault, since `contextBridge` freezes `window.native` in the app. A unit test drives it in the emitter with a throwing `native.signal`.

Files: `server.py`, `electron/main.js`; the vocabulary (`0.8.json`, `0.8-rationale.md`, `proposals.json`, `current.json`); the gate `harness/shakeout/trace_files.ts`; the unit test `web/app/__tests__/sdd_send_loss.spec.ts`. The registry rows in `WORKING_AGREEMENT.md` name v0.8.

## signal contract

### Emits

`SERVER_STARTED` (port), `TRACE_OPENED` (server), `STORE_SCANNED` (sessions_found, parked, interrupted, ended, skipped, duration_ms), `SERVER_STOPPED`; `TRACE_LOST` (process server) in `main.jsonl`; `TRACE_LOST` (process window) from the emitter.

### Invariants

- S1: `server.jsonl` line 0 is `SERVER_STARTED`, on every run.
- Every server line lost is counted once, in `main.jsonl`.

## observation contract

- `trace_files.ts` (normal run): `server.jsonl` is `SERVER_STARTED`, `TRACE_OPENED`, `STORE_SCANNED`, …, `SERVER_STOPPED`; no `TRACE_LOST` anywhere; `signals_lost` 0.
- `TRACE_PLANT=server-cap`: `SUBSTRATE_SERVER_TRACE_CAP` holds `SERVER_STARTED` only; `server.jsonl` is that one line; `main.jsonl` holds `TRACE_LOST` (process server) whose counts sum to the server lines the run dropped (3: `TRACE_OPENED`, `STORE_SCANNED`, `SERVER_STOPPED`); `signals_lost` equals that sum.
- `TRACE_PLANT=cap` as before.
- `sdd_send_loss.spec.ts`: two throwing sends, then a good one, give one `TRACE_LOST` (process window, count 2) right after the good record, with the next `proc_seq`.

## done criteria

The three runs of `trace_files.ts` and the unit test pass; each fails with its fix reverted.

## result

- **Built** as scoped.
- **Commands.** `npx tsc --noEmit` 0; `npm run build` 0; `npm run test:unit` 144 passed (parity OK: v0.8, 88 tags, 40 emitted); `ruff check server.py` 0, `ruff format --check server.py` 0; `uv run python -m pytest tests/ -q` 266 passed, 5 skipped; `trace_files.ts` 0, `TRACE_PLANT=cap` 0, `TRACE_PLANT=server-cap` 0; `choose_folder_starts_session.ts` 0.
- **Plants, each failing as it should.** Main ignoring `substrate-ui trace_lost=` lines: the `server-cap` run exits 1 ("counts sum to 0, expected 3"). The server not calling `flush_loss` at shutdown: exits 1 ("sum to 1"). The emitter not counting a refused send: the unit test exits 1. Each fix restored after its plant.
- **Rubber Duck Pass** (the printed trace). `SERVER_STARTED` (port 51189): the server bound its port, its first record. `TRACE_OPENED` (server). `STORE_SCANNED` (sessions_found 0, skipped 0, duration_ms 0): the boot scan ended, the gate's store empty. `SERVER_STOPPED` (ended 0, skipped 0, failed 0). proc_seq 0–3, one boot id. Capped at 200 bytes: `server.jsonl` holds `SERVER_STARTED` only; `main.jsonl` holds `TRACE_LOST` (server, count 1) when `TRACE_OPENED` was dropped and `TRACE_LOST` (server, count 2) at shutdown for `STORE_SCANNED` and `SERVER_STOPPED`; `signals_lost` 3. Observations: none.
- **Added in the sprint:** `APP_BOOTED` commits marked `+dirty` when the shipped paths have uncommitted changes; local packaged builds record HEAD instead of "unrecorded" (`electron/main.js`, `electron-builder.config.js`). `trace_files.ts` compares `app_commit` to git in source runs: `8f636bc8dda7+dirty` on the run before commit; with the mark dropped, the gate exits 1. The packaged kernel's mark is not driven by a gate.
