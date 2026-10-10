# Sprint 119 — The window reads both session shapes

```yaml
---
id: 119
status: closed
opened_at: 2026-10-09
closed_at: 2026-10-09
phase: 1
pass_kind: functional
roadmap: substrate/process/planning/ROADMAP-2026-10-09-session-topology-structure.md
---
```

## why

After K262 a session writes `ModelReply` per model call and `Returned`, not `FinalAnswer` and `Park`. Sessions already on disk keep the old kinds. The window reads both before the writer changes (research P6).

## scope

- `envelope_kinds.gen.ts` gains `Returned`.
- `session_controller.ts`:
  - shows a `ModelReply` with `stop_reason` `tool_use` and empty text as nothing;
  - shows one reply row per answering `ModelReply`;
  - treats `Returned` and `Park` alike for the turn's end and the parked state;
  - keeps hiding an old `FinalAnswer` that repeats its reply.
- `reveal_component.ts`: lanes, `kindOf`, `connFor` and the stream labels treat `Returned` as `Park` was treated.

## prerequisites

- K259 closed.

## context_files

- `sdd-kit-2/AGENTS.md`
- `substrate/process/planning/RESEARCH-2026-10-09-session-topology-structure-round4.md`
- `substrate/process/planning/ROADMAP-2026-10-09-session-topology-structure.md`
- `substrate/process/signals/session-vocabulary.md`
- `substrate/process/BLACKBOARD.md`
- `substrate-ui/web/vm/envelope_kinds.gen.ts` and its generator
- `substrate-ui/web/vm/session_controller.ts`
- `substrate-ui/web/reveal_component.ts`
- `substrate-ui/harness/shakeout/lib/electron.ts`

## signal contract

### Emits

None new.

### Invariants

- The locked UI vocabulary file is unchanged.
- An old session renders exactly as before.

## artifact contract

### Files created

- `substrate-ui/harness/shakeout/both_session_shapes.ts`

### Files modified

- `substrate-ui/web/vm/envelope_kinds.gen.ts`
- `substrate-ui/web/vm/session_controller.ts`
- `substrate-ui/web/reveal_component.ts`
- `substrate-ui/package.json` (`gates:electron`)

### Content assertions

- `session_controller.ts` handles `EnvelopeKind.Returned`.
- `reveal_component.ts` maps `Returned` wherever it maps `Park`.

### Command exit codes

- `npm run build` returns 0.
- `SHAKEOUT_APP=/Applications/Substrate.app npx tsx harness/shakeout/both_session_shapes.ts` returns 0 on a fresh build, and non-zero on the build before.

## observation contract

### Driving steps

- The installed app (its own home) attaches a session whose record has the old shape, then one whose record has the new shape, written as files.

### Expected

- Each turn shows one reply row.
- The status reads parked after each turn.
- The graph's external lane shows the turn's end on both.

## done criteria

The window shows old and new sessions the same way.

## result

- The kernel's `vocabulary.py` gains `LEGACY_SESSION_KINDS` (`Park`, `FinalAnswer`) and `LEGACY_PARK_REASONS`. `scripts/gen_kinds.py` adds `TURN_END_KINDS` and the legacy set, so `EnvelopeKind` carries `Returned` now and keeps `FinalAnswer` and `Park` after K262 stops registering them.
- `session_controller.ts`:
  - `Returned` and `Park` share one case, and old reasons read as new (`final_answer` → `replied`, `interrupt` → `interrupted`);
  - the turn-end row reads `· returned (<reason>) — your turn`;
  - a `ModelReply` with no text (a v0.3 tool-only call) adds no row.
- `reveal_component.ts`: `_isTurnEnd` (`Returned`, `Park`) and `_isReturnProducer` (`return`, `park`) replace the eight `Park`/`'park'` checks. The side graph's lane label reads "returned".
- Gate `harness/shakeout/both_session_shapes.ts` and its fixture `harness/shakeout/fixtures/write_session_shapes.py`. The fixture writes an old-shape and a new-shape session with the same two turns, through a one-producer kernel topology, into the gate's own SUBSTRATE_HOME.
  - Red on the installed build of 11:51: the new-shape session never showed a turn end.
  - Green on the reinstalled build: both sessions show the replies "It is 5." and "Any time." once each, two "returned (replied)" rows, and a "returned" lane of 2 segments.
- Against the installed app, also passing: driver_chip_on_resume, resume_after_two_ends, graph_model_lane_on_resume, split_pane_header_inset, lifecycle_gates, transcript_follow. `npm run build` exits 0. UI suite 215 passed. Kernel ruff, format, mypy clean.
- Substrate.app reinstalled (signed, not notarized) and reopened.
