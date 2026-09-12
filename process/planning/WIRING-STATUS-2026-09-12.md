# Wiring status — 2026-09-12

Snapshot against `SUBSTRATE-WIRING-2026-09-12.md`. Head is
`b60035a`, local matches origin/main. Walkthrough: 9 of 9.

## Rounds landed

- **Round 1** — session lifecycle wired through the bridge. Items 2,
  4, 5, 6, 8, 9, 10, 12, 15, 16, 17 all live behind
  `session_create`, `record_read`, `turn_submit`, `session_end`,
  `session_resume`, `list_sessions`.
- **Round 2** — real driver roster. `list_drivers` walks Ollama's
  `/api/tags` + PATH; the picker reads `state.driverRoster`.
  Deterministic is always present, ollama models appear if the
  daemon answers, `claude` / `gemini` appear if the binary is on
  PATH.
- **Round 3a** — framework brackets on `record_read` and a real
  topology graph from `topology_introspect` in the structure lens.
- **Round 3b** — `scene_project` off the record; the scene lens
  reads `state.sceneFrames`.
- **Round 5a** — `session_rename`, `turn_interrupt`, `bundle_attach`,
  `tools_restrict`, `workspace_diff`. Commit `0e3cbb1`.
- **Round 5b** — `record_export` op + wired export dialog with a live
  path input and a record-dir / events.jsonl toggle. Commit
  `0b6dfd2`.
- **Round 6** — live envelope push. Bridge runs one
  `substrate.api.attach` follower thread per subscribed session and
  emits `envelopes_appended` messages as new envelopes seal.
  Renderer subscribes on bind and resume, unsubscribes on
  session_end, folds pushes into `state.records` by `seq`.
  `_submitTurn` dropped the 500 ms polling loop. Commit `b60035a`.

## Open

- **Round 3c — `topology_build_and_launch`.** The prototype's
  Studio button currently calls `topology_build`, which writes a
  stub file at `~/.substrate/topologies/<name>.py`. Launching a
  chosen topology in-process needs two things the code does not
  yet have:
  1. The registry's `session_topology_factory` is fixed at
     construction to `_build_session_topology_from_manifest`,
     which only builds `session_topology`. Dispatching to another
     topology (say `adversarial_pair_review`) means switching on
     `manifest.role` inside the factory.
  2. Non-session topologies take arguments the Studio form does
     not yet collect (arms, verifier, oracle). The form has
     producers / views / triggers / routes as strings; the target
     topologies take typed Python objects. A resolver from short
     names to substrate factory callables — with argument
     collection in the form — is the missing piece.
- **Round 4 — assay projection.** `op_list_assays` returns `[]`.
  `assay.build_report(suite, results)` exists on the substrate
  side, but nothing enumerates past assay runs or reconstructs
  `Suite` + `CaseResult` from a run's records. Landing
  `assay_report(assay_name)` needs a substrate surface that names
  and loads a stored preregistration and gathers its arm records.

## Ops present in the bridge

`ping`, `hello`, `halt`, `reply`, `read_recent_workspaces`,
`list_sessions`, `session_resume`, `probe_driver`, `record_read`,
`turn_submit`, `session_end`, `session_create`, `list_assays`,
`topology_validate`, `topology_build`, `driver_change`,
`list_drivers`, `topology_introspect`, `scene_project`,
`session_rename`, `turn_interrupt`, `bundle_attach`,
`tools_restrict`, `workspace_diff`, `record_export`,
`record_subscribe`, `record_unsubscribe`.

The `signals/bridge-reasons.json` bridge_ops table and
`bridge/vocab.py`'s `BridgeOp` enum match; the import-time drift
assertion is intact.
