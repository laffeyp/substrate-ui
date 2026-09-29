# Sprint 091 — Source-vs-packaged parity gate

```yaml
---
id: 091
status: done
opened_at: 2026-09-29
phase: config-externalization
pass_kind: observation
---
```

## scope

Run the nine Axis-A shakeout flows against the packaged `.app` binary and compare results to the source-mode baseline. Add `npm run shakeout:packaged` that launches the shakeout runner against `dist-electron/mac-arm64/Substrate.app/Contents/MacOS/Substrate`. A flow that passes in source mode but fails in packaged mode is a finding. This sprint is the observation contract for the entire configuration externalization chain.

## prerequisites

- sprint 090 (substrate-ui paths routed through `substrate_home()`)
- A fresh `npm run dist` build incorporating the 090 changes

## context_files

- `sdd-kit-3/AGENTS.md`
- `harness/shakeout/run.ts` — the existing shakeout runner
- `harness/shakeout/packaged_app_smoke.ts` — the existing packaged smoke (narrow: one deterministic turn)
- `electron-builder.config.js` — the build config
- `process/planning/ROADMAP-2026-09-29-configuration-externalization.md`

## signal contract

### Emits

No new signal tags. The shakeout flows emit the existing v0.1 presentation-model vocabulary.

### Consumes

- `harness/shakeout/run.ts`
- `harness/shakeout/lib/server.ts` (server lifecycle control)
- All nine Axis-A flow files under `harness/shakeout/flows/`

### Invariants

- Every Axis-A flow that passes in source mode also passes against the packaged `.app`.
- The packaged `.app` under test is signed and notarized (verified by `codesign -dv` in the runner).
- The shakeout does not modify `~/.substrate/` (the packaged app's state root).

## artifact contract

### Files created

- `harness/shakeout/packaged_shakeout.ts` (or a configuration flag on the existing runner — verify the cleanest shape at execution time)

### Files modified

- `package.json` — adds `shakeout:packaged` script.

### Content assertions

- `package.json` contains `"shakeout:packaged"`.
- The shakeout:packaged script targets the `.app` binary path.
- A parity report file is written to `captures/shakeout-packaged-<date>/report.json`.

### Command exit codes

- `npm run shakeout:packaged` returns 0 (all nine flows pass)
- `npm run shakeout` returns 0 (source-mode baseline still green)

## observation contract

### UI driving steps

Nine Axis-A flows, driven by the shakeout runner against the packaged `.app`:

1. `cold_boot` — app starts, window appears, health endpoint returns 200.
2. `chat_one_turn` — type a message, receive a reply, message appears in transcript.
3. `attach_existing` — bind to an existing workspace.
4. `slash_router` — type `/help`, verify output.
5. `bundle_picked` — select a bundle, verify manifest reflects it.
6. `studio_build` — open studio, build a topology, verify run record.
7. `refused_open` — attempt an invalid operation, verify the error surface.
8. `refused_turn` — attempt a turn in an invalid state, verify the error surface.
9. `stream_reconnect` — interrupt the SSE stream, verify reconnection.

### Expected log substrings

- `[electron] server bound port=` (server started)
- `[electron] server up on http://127.0.0.1:` (health check passed)

### Expected runtime signals

- Each flow's expected signal sequence matches its source-mode baseline.

### Expected screenshot / visual state

- `cold_boot` frame: window title reads "substrate", background is `#212327`.

## done criteria

All nine Axis-A shakeout flows pass against both source mode (`npm run shakeout`) and packaged mode (`npm run shakeout:packaged`). The parity report shows zero divergences.

## notes

The shakeout runner spawns its own server instance. For the packaged variant, it needs to launch the `.app` binary directly (via Playwright's `_electron.launch({executablePath})`, the same pattern `packaged_app_smoke.ts` uses) rather than spawning `uv run python server.py`. The existing smoke already demonstrates this launch pattern.

The packaged build uses `~/.substrate/` while the dev build uses `~/.substrate-dev/`. The shakeout must not accidentally target the dev state root. Verify that the `.app` binary, launched outside the `npm run electron` env, inherits no `SUBSTRATE_HOME` and falls back correctly.

The `SUBSTRATE_HOME` separation from sprint 090 means the packaged shakeout's sessions, runs, and socket do not collide with a simultaneously-running dev build. This is the direct payoff of the configuration externalization work.
