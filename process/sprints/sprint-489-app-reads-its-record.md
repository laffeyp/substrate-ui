# Sprint 489 — the app takes its name, store, logs and link scheme from its record

```yaml
---
id: 489
status: pending
phase: second build (roadmap r1), E3
pass_kind: functional
---
```

## scope

`electron/main.ts` line 290 names the app "Substrate" whatever the bundle is, and the data folder, the single-instance lock and the logs all follow that name (measured: they follow the name set before the first path lookup), so a Next bundle would share all three with the working install, and its server would use `~/.substrate`. At launch `main.ts` reads its install's name from the packaged `package.json`'s `productName` (written by sprint 488; `app.getName()` before any `setName` returns it) and finds its record in `identity.json` by that name; in source mode, with no `productName`, the record is `substrate`. It names the app from the record, passes `SUBSTRATE_HOME` = `~/<record.store>` to the server, and handles deep links of the record's scheme. A launch with `SUBSTRATE_HOME` already set (`npm run electron`, the gates) keeps today's behaviour: "Substrate Dev", its own home. One verifiable property: with the working install open, the Next bundle opens beside it and every path it writes is its own.

## prerequisites

- 488.

## context_files

- `../sdd-kit-3/AGENTS.md`
- `process/planning/2026-11-11-second-build/PAPER-2026-11-11-second-build-r2.md` (sections 2, 3)
- `electron/main.ts` (lines 180–200 the trace root, 288–320 the name and paths, 495–530 the server spawn, 734–760 the lock and deep links)
- `electron/identity.json`
- `../substrate/src/substrate/home.py`
- `harness/shakeout/lifecycle_gates.ts` (F5 deep link, F7 bad `SUBSTRATE_HOME`)

## signal contract

### Emits

No new tag. `APP_BOOTED.home_kind` stays `default` for a record's store and `env` for a set `SUBSTRATE_HOME`.

### Consumes

- `APP_BOOTED`, `SERVER_STARTED`, the server's `server bound` log line.

### Invariants

- The working install's name, store, data folder, logs and scheme are unchanged.
- No process of the Next bundle opens a file under `~/.substrate` or `~/Library/Logs/Substrate`.

## artifact contract

### Files created

- none

### Files modified

- `electron/main.ts`

### Content assertions

- `main.ts` has no literal `"Substrate"` passed to `app.setName`; the name comes from the record.

### Command exit codes

- `npm run build`, `npm run test:unit` return 0.

## observation contract

### UI driving steps

With `/Applications/Substrate.app` open, open `dist-electron-next/mac-arm64/Substrate Next.app`; send one message in it with the deterministic driver; quit it by name ("Substrate Next"). `lifecycle_gates` against both bundles.

### Expected log substrings

- `~/Library/Logs/Substrate Next/substrate.log`: `app boot`, `server up`.
- `~/Library/Logs/Substrate/substrate.log`: no line from the Next bundle's launch.

### Expected runtime signals

- Next's `APP_BOOTED` `home_kind` default; its session's manifest under `~/.substrate-next/sessions/`; `~/.substrate/sessions/` unchanged in count and status.
- The working install's main pid unchanged before and after Next quits.

### Expected screenshot / visual state

- Both windows on screen at once, each showing its own session list.

## done criteria

The test install opens, works and quits beside the working install without touching any of its files.

## notes

Mutant: the hardcoded `setName("Substrate")` put back puts Next's log lines into `~/Library/Logs/Substrate`.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] context_files cover the name, the paths, the spawn, the lock and deep links.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present, with both installs running.
- [x] One file.
