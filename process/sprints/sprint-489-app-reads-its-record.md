# Sprint 489 — the app takes its name, store, logs and link scheme from its record

```yaml
---
id: 489
status: closed
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

## close

`electron/main.ts` reads `identity.json`, finds its record by Electron's first `app.getName()` (the packaged `productName`; source mode falls to `substrate`), sets that name before any path lookup ("Substrate Dev" when `SUBSTRATE_HOME` is set, as before), passes `SUBSTRATE_HOME` = `~/<store>` to its server when the record's store is not `.substrate`, registers the record's scheme, accepts it from a second launch, and rewrites it to `substrate://` before the window gets the link. New gate `harness/shakeout/two_installs.ts` (a second file, beyond the card's one).

Results (logs `runs/packaged/sprint-489-20261111-231641/`; `test:unit` 0, `pack:dev` 0, `pack:next` 0), with the working install open (build 1794463909, pid 8228):

- `two_installs` on the Next bundle: ok. Next opened through `open`, held `SingletonLock` in `~/Library/Application Support/Substrate Next`, ran one deterministic turn whose session is under `~/.substrate-next/sessions/`, gained one app boot in `~/Library/Logs/Substrate Next/substrate.log`, wrote `APP_BOOTED` packaged true, home_kind default, and quit by name ("Substrate Next"). The working install kept pid 8228; its 129 sessions were unchanged, none added; its log gained no app boot.
- Mutant (`setName("Substrate")` put back, Next rebuilt): fails, "no server up" in Next's log: the mutant took the working install's name, found its lock held, and quit; it wrote no boot into the working install's log.
- `lifecycle_gates` on the working bundle and on the Next bundle: all passed (F5's `substrate://` link reaches both).
- Next's last three traces: one `APP_BOOTED`, one `SERVER_STARTED`, closed by `APP_QUIT_COMPLETED`, no `INVARIANT_BROKEN`.
- Screenshot `next-window.png`: the Next window, named Substrate Next, its own recent workspaces under `~/.substrate-next`. A screen capture of both windows at once was refused: this shell has no Screen Recording permission (runbook troubleshooting).

Found on the way, in the gate: Playwright's launch leaves no `Singleton*` files (its debugging switches), and `SingletonLock` is a symlink to `<host>-<pid>` that `existsSync` reports absent; the gate launches with `open` and reads the lock with `lstat`.

Found, open: the picker's shared-sandbox row is the fixed text `~/.substrate/sandbox` (`web/app/derive/picker.ts` line 16), a token each server resolves to its own store (`server.py` lines 1909–1914). In the Next install the data is `~/.substrate-next/sandbox`, but the row names the working install's folder. Both installs' windows also read "substrate" in the top bar.

Rubber Duck Pass: narrated from Next's trace: `APP_BOOTED` (packaged true, home_kind default, gate_isolated true) opened each launch, the server's `SERVER_STARTED` followed once, `APP_QUIT_COMPLETED` closed it. Observation (payload anomaly): `APP_BOOTED` cannot say which install spoke; sprint 490 adds `app_name`, recorded. Observation (tone trace): the sandbox row's text, recorded above.
