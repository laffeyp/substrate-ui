# Sprint 133 — `electron_smoke` on the first launch after an install

```yaml
---
id: 133
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 1; open item 5)
asked: 2026-10-11 (Architect)
---
```

## scope

- Find the root cause of `electron_smoke` failing on the first gate run after an install, and fix it. It failed on the first run after the U131 install (1 bug, 0 signals) and after the activity-strip install (2 bugs); it passed on every rerun (kit diary 66; sprint 131 result).
- Reproduce first: install, run the gate once, and keep its full output and the app's logs from that launch.
- Unit specs for any changed code; the Electron gates on the installed app.

## checks

- The cause is named with the evidence from a reproduced failing first launch.
- After the fix, three fresh installs each pass `electron_smoke` on their first gate run, and the 11 Electron gates pass on `/Applications/Substrate.app`.

## result

- **What failed.** In the two current failures (2026-10-11 03:16 and 05:30 UTC; the second a minute after an install), the gate waited 30 s to click the roster default row `kimi-k2.7-code:cloud`, which never appeared. The gate then switched to `deterministic` anyway, so the click it failed on was on a model it never used. Twelve fresh first launches did not reproduce it (bytecode stripped; CLI probe slowed 6 s; Ollama's second tag call stalled past its 2 s timeout), so what Ollama returned those two times is not known. Time-boxed by the Architect.
- **The fix: the gate no longer depends on the machine's models.** `launchArgs` starts offline gates on an offline roster: `OLLAMA_BASE_URL` on a closed port and `SUBSTRATE_CLI_ADAPTERS` empty, a new switch in `server.py` `_agent_models` that limits CLI discovery to the names it lists. The bar then offers one row, `deterministic`, and `bindPaneAsUser` picks it as a user would. `electron_smoke` drops its switch to `deterministic` after binding. `driver_chip_on_resume` and `model_half_starts_session` need real models and pass `{ roster: "live" }`.
- **Tests.** `tests/test_cli_adapter_discovery_133.py`: unset, empty and named lists, 3 of 3. The 11 Electron gates pass on the source build; `electron_smoke` alone passes in 1.9 s with 5 of 5 tags. Not rebuilt or installed: the packaged app picks up the `server.py` change at the next build.
- **Found on the way.** The bundle ships without Python bytecode; the first launch wrote 298 `.pyc` files into `/Applications/Substrate.app`. Added to the release roadmap (step 2).

