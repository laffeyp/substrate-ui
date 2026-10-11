# Sprint 121 — The daemon uses standard

```yaml
---
id: 121
status: closed
closed_at: 2026-10-10
phase: 1
pass_kind: functional
roadmap: substrate/process/planning/ROADMAP-2026-10-10-default-guidance.md
asked: 2026-10-10 (Architect)
---
```

## why

New sessions still open on the bare bundle; PATCH never reaches the record; caching has no opt-in.

## scope

- Default bundle `standard` (`server.py` session create).
- PATCH and `/model` write `SessionChanged` (inject on a live run; ahead of the next `UserMessage` on a parked one).
- `cache_layout` in `driver_params` (`DriverParamKey`), `claude` only, default false.

## design as built (written before the run, 2026-10-10)

- **The default bundle is `standard`.** It is set in three places: `server.py`'s session create (`body.get("bundle", …)`), `delegate.py`'s child default, and the UI's `bundleSlug`. Naming `harness` or `session` still gets the bare harness.
- **`SessionChanged` needs no daemon change.** K274 detects a PATCH of driver, bundle or `per_turn` in the model step, because the daemon rebuilds the topology from the manifest every turn. This card checks it in the installed app.
- **`cache_layout`.**
  - Kernel: `DriverParamKey.CACHE_LAYOUT` (bool), checked by `set_driver_params`; `session_topology(cache_layout=False)`. When true, the model step's head split uses `SYSTEM_SOURCES | CACHE_LAYOUT_SOURCES`, where `CACHE_LAYOUT_SOURCES` is `role`, `bundle_methodology` and `tools_suite`; K276 adds `memory`.
  - Daemon: create and PATCH refuse `cache_layout` with a 400 unless the driver's profile has a `system_flag`, which today means `claude` only. The daemon passes the value to the topology.
  - No UI control is added.

### Predicted breaks

- UI tests that read the default bundle name (`test_server_session_patch_bundle.py`).
- Kernel tests that assume delegate's child bundle is `harness`.

## checks

- A new session in the installed app opens on `standard`.
- `/model` mid-session puts an update line in the next prompt.
- `cache_layout` is refused for an Ollama driver.

## result

- **Built as designed.**
  - The default bundle is `standard` in `server.py`, `delegate.py` and the UI's `bundleSlug`.
  - `DriverParamKey.CACHE_LAYOUT` (bool). The registry's bool guard had refused any bool for a key other than `think`; it now exempts `cache_layout`.
  - `CACHE_LAYOUT_SOURCES` (`role`, `bundle_methodology`, `tools_suite`).
  - `head_block`, `compose_model_prompt` and the model step take `system_sources`, and `session_topology(cache_layout=)` sets it.
  - The daemon's `_cache_layout_refusal` returns 400 on create or PATCH for a driver without a system flag, and passes the flag to the topology only where the profile has one.
- **Tests.**
  - `test_daemon_uses_standard_121.py`, 4:
    - a new session opens on `standard`: the style on `system`, CLAUDE.md under its header in the head, the hook line after the message;
    - a PATCH of the driver between turns records `SessionChanged(driver, deterministic, stand-in)` and puts the update line after the next message;
    - `cache_layout` is refused for `deterministic` on create and on PATCH;
    - it is accepted for `claude`.
  - `test_system_channel_272.py` gained the layout test: the default keeps role, methodology and tools in the user turn, and the opt-in moves them to `system`.
- **Predicted break,** fixed: `test_server_session_patch_bundle.py` pinned the default name.
- **Not predicted,** fixed: `test_server_session_patch_per_turn.py` read `PromptComposed.text` without resolving blobs; with `standard` the prompt is large enough to be stored as a blob.
- **Checks** (targeted): 24 UI tests and 21 kernel tests passed; `tsc` and `mypy --strict` are clean. The installed-app check, a new session on `standard` and `/model` mid-session, runs on the end-of-roadmap build with the full suites.

- **Installed-app check (end of roadmap, 2026-10-10).** Build from the working tree: signed, not notarized, verification build. All 11 Electron gates pass. The `session_prompt_once_across_restart` gate first failed because it read raw JSONL and `standard` makes `PromptComposed` large enough to be a blob; the gate now resolves blobs and reports 7 fragments, written once and reused after a restart. Session `s_971d2e719c47407b8d8f052a`, on the app's own daemon, in a scratch git repo: the session opened on `standard` (manifest and `SessionStarted`), class `harness_agent`, with the Claude profile's flags; `system` 3,021 B starting with the style; the head carries Claude Code's header and CLAUDE.md.
