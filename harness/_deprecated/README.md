# Retired harness scripts (UI sprint 106, 2026-10-07)

Kept for the audit trail; not run. Each was read, traced and run on 2026-10-07
(`process/sprints/sprint-106-test-hygiene.md`).

| script | written for | why retired | coverage now |
|---|---|---|---|
| `mount_seam_check.ts` | sprint 071, the React mount seam | expects a transcript mount at boot; mounts appear once a session opens | Axis A `pane_split_transcript` |
| `_electron_spike.ts`, `electron_spike/` | sprint 077, a one-time proof that Playwright drives Electron | its question was answered | every Electron gate since |
| `_electron_sprint078_exit.ts` | sprint 078 exit: spawn and load | no SUBSTRATE_HOME, so it takes the installed app's single-instance lock; assumes port 8765 | packaged smoke, lifecycle gates |
| `_electron_sprint079_exit.ts` | sprint 079 exit: two instances, two ports | the single-instance design (sprint 094) forbids what it asserts | lifecycle gates; startup_timing's second-instance check |
| `_electron_sprint080_exit.ts` | sprint 080 exit: native menus | as 078 | Axis C `electron_menu` |
| `_electron_sprint081_exit.ts` | sprint 081 exit: deep links | as 078 | lifecycle F5, Axis C `electron_deeplink` |
| `_run_caret_pin.ts` | sprint 075, five runs of caret_pin | a wrapper | `caret_pin` in Axis A; `SHAKEOUT_RUNS` for repetition |
| `pixel_baseline.ts`, `pixel_baseline_states.ts`, `pixel_diff.ts` | sprint 070, proving the Phase 8 React migration matched the dc-runtime render | Phase 8 closed 2026-09-24; the screens hold run-specific text (record ids, event counts), so a fixed baseline drifts every run | the Axis A UI flows; the baseline PNGs stay in `captures/pixel-baseline-2026-09-23/` |
