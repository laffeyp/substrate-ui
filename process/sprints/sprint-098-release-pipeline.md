---
id: 098
status: built; first full run waits on a commit and the kernel 1.1.2 release (Architect)
class: C (Humble & Farley, "only build your binaries once"; Apple TN2206, sealed resources)
---

# Sprint 098 — one release command

## done

- `scripts/release.sh` (`npm run release`), seven hard gates: (1) both trees clean; (2) `gen_kinds --check`, substrate-ui pytest, `npm run build`; (3) bundled runtime via `fetch-python-runtime.sh`; (4) electron-builder sign, `--notarize` optional; (5) `codesign --verify --deep --strict` and the commit recorded in `Info.plist`; (6) `smoke:packaged` (real-model turn, Structure, quit) and the Axis-A shakeout against THAT bundle, then a second signature check proving the gates wrote nothing into it; (7) `--install`: quit the app, move the old bundle to the Trash, `ditto` this one in, verify its signature in place. No step edits a signed bundle.
- `electron-builder.config.js`: `mac.extendInfo` records `SubstrateUICommit` and `SubstrateKernelVersion` in `Info.plist` before signing.
- `fetch-python-runtime.sh`: the drift guard also refuses uncommitted changes in `../substrate/src` (it counted commits only, so today's uncommitted kernel edits would have shipped missing from the wheel). Verified: it refuses and lists the files.
- `harness/shakeout/lib/server.ts`: `SHAKEOUT_APP=<bundle>` runs the flows against a packaged bundle's own interpreter and `server.py`, with `PYTHONDONTWRITEBYTECODE=1`. `npm run shakeout:packaged`. This is the gate sprint 091 was marked done without.

## checks run (2026-10-01)

- `npm run release` refuses at stage 1 and lists every uncommitted file in both repos.
- `shakeout:packaged` against the installed `/Applications/Substrate.app` (build 1790667186, Sep 29): `pane_header_clip`, `pane_prompt_isolation`, `reveal_mode_direction`, `model_reply_render` 5/5 each; `cli_discovery` 5/5 with 1–3 defects per run; `cli_version_picker` hit the 15-minute watchdog. Stopped after that flow. Bundle signature verified before and after.

## open

- Full pipeline run: needs (a) a commit of today's work in both repos and (b) kernel `1.1.2` on PyPI with `SUBSTRATE_VERSION` bumped. Both are the Architect's call.
- `cli_version_picker` hangs 15 minutes in packaged mode, as it did in source mode in sprint 091, where it was recorded as "model latency". A 15-minute hang is a defect. `cli_discovery` reports 1–3 defects per run. Neither diagnosed.

- **Closed 2026-10-01.** `cli_version_picker` and `cli_discovery`: `sprint-098a-open-items-closed.md`. The full pipeline run still waits on the commit and the kernel 1.1.2 release.
