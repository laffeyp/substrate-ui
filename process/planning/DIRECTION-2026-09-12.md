# Direction — where we are and how we got here

*2026-09-12. A plain narrative of the twists and turns, for posterity. The audit-trail docs are all on disk; this document ties them together in one place.*

---

## The trail

The substrate-ui repo started 2026-09-08 with an Architect directive: "substrate-ui is dead. Take the prototype and make it real." The prototype at `handoff_latest/prototypes/Substrate Prototype v7.dc.html` — a 1132-line HTML file with inline state and handlers under the dc-runtime — is the design lock.

**First mistake.** I read that directive as "reimplement the prototype in React with a signal spine." Sprints 001 through 033 built a fresh React shell under `src/render/`, a reducer under `src/reducer/`, an observability spine under `src/observability/`, an emit contract keyed to `signals/0.1.json` (108 tags), a mouth-side Emitter that rejects invented tags, a Layer-5 state-transition checker, a Layer-7 pixel-anchor test system, and 36 e2e harnesses. The React shell rendered a placeholder tree with `data-testid` anchors — enough for the signal graders to grade, not enough to look like anything. The prototype at `handoff_latest/prototypes/` sat unread.

**Second mistake.** When the visual gap became obvious after Sprint 033 launched, I read it as "port v7 into React component-by-component." Wrote `EPIC-PLAN-v0.2-2026-09-12-prototype-port.md` — seventeen Q sprints (Q0 rip-out through Q16 push-transcript). Landed Q0/Q1/Q2 — ripped out every `.tsx` under `src/render/` except `Anchor.tsx`, deleted all 36 harnesses, wrote a stub `App.tsx`, ported v7's outer chrome, pane grid, and per-pane header into JSX. Ratifying seven halt items on the aggressive path (delete up front, no fake data, defer studio canvas, port first-run, port nested-descent).

**The real problem.** After Q0–Q2 the user pointed at the running Electron window and asked why we were reinventing a working UI. Loaded the prototype directly in Electron: it renders, every screen is interactive, every state transition works. The prototype was never the sketch. It was the finished product built against a `state = {}` object with fake data at eight seams: `_bindPane`, `EVFULL`, `CH` (delegate children), `_validate`/`doBuild`, driver picker options, records-surface listing, assay grid arms, and the scripted opacity fade-ins that simulate live envelope arrival.

**Third framing (correct).** The project is: point Electron at the prototype, expose `window.bridge.request(op, payload)` from the preload, replace the eight fake data sources with real substrate calls, extend substrate where the prototype's sketches (assays, topology-launch, structure lens, scene lens) need real capabilities behind them. Wrote `SUBSTRATE-WIRING-2026-09-12.md` — a crosswalk of every fake data site against substrate's actual surface with file:line citations.

**Reviewer pass.** Spawned a fresh reviewer subagent on the wiring doc. It read the prototype, the shell code, and core substrate (`session_registry.py`, `api.py`, `runtime.py`, `topologies/session/`, `topologies/tool_loop/`, `assay/`, adapters) in full. Findings at `process/reviews/REVIEW-2026-09-12-wiring-plan.md`. Four load-bearing errors:

1. `op_record_read` at `bridge/main.py:418` did not return raw `payload` or `content` blocks — the prototype's inspect drawer at lines 277 / 280 would not render off it. Round-0 fix, not Round 6.
2. Round 1's "zero new bridge ops" claim was false. Item #8 (driver picker roster) depends on `list_drivers` from Round 2; item #15 (swim-lane graph) depends on the framework-brackets flag on `record_read` from Round 3.
3. Path B (push transcript) invented an `api.append_envelope` symbol that does not exist. The ratified push mechanism is `substrate.api.attach` / `LiveRecord` at `projections/attach.py`, exported at `api.py:38`.
4. `ArmReport` at `assay/report.py:49` has no `by_bin` field. The prototype's assay grid columns easy·8 / med·12 / hard·8 / adv·4 need a substrate-side extension to `build_report`, not a wrap.

Three smaller notes: `topology_introspect` duplicates `substrate.api.topology_graph` at `projections/graph.py`, exported at `api.py:70`. `/inspect` duplicates `substrate.api.narrate` at `projections/narrate.py`, exported at `api.py:72`. The Studio form-to-`TopologyBuilder` mapping has an unaddressed callable-resolution layer.

## Where we are now

Live under Electron: the prototype at `app/prototype-v7.html` loads by default. Bridge is alive against substrate 1.0.1. `window.bridge.request(op, payload)` works from the preload.

Real wiring landed at commit `7951cd4`:

- Pane 1 boots unbound; the workspace picker renders inside the main pane; typing a path and pressing ↵ fires `session_create` through the bridge and `record_read` follows.
- `op_record_read` returns raw `payload`, per-kind `content` blocks (`ASSEMBLED_PROMPT`, `TEXT`, `OUTPUT.STDOUT`, etc.), `schema`, and `timestamp`. The inspect drawer renders from real records.
- `state.records[session_id]` holds the envelope list. `envelopeList` in `renderVals` reads from there when the focused pane is bound; falls back to the demo fixtures when unbound (until Round 5 removes those).
- Every abbreviation the user flagged is renamed. `EV/EVFULL/EVLITE/realEV/realRec/shownEV/selE/pn/fp/pl/S/LOW/_evTexts` → `envelopeList/demoEnvelopesFull/demoEnvelopesLite/envelopesLive/recordEnvelopes/envelopesShown/selectedEnvelope/paneEntry/focusedPane/producerLabel or payload_dict/state/bracketKinds/envelopeSearchText`.

Currently mid-work at this commit:

- Prompt Enter (main + per-pane) calls `turn_submit` and polls `record_read` at 500ms until ack. Envelopes surface as the run produces them.
- End-confirm dialog calls `session_end` on the focused pane's session; the pane's `ended` flag flips on ack.
- Records surface loads `list_sessions` on open. Each row maps `{session_id, name, status, workspace, workspace_shape, driver}` from the SessionRegistry.
- Per-pane driver picker fires `driver_change` when the pane is bound; local-only when unbound.

## What comes next

Round 1 remaining seams:
- Records surface click-to-resume via `session_resume`.
- Descend into a delegate child via `record_read({record_root})` — the bridge already attaches `child_record_root` to delegate ToolCall envelopes.
- Fan-out detection (client-side over adjacent delegate ToolCalls at the same step).

Round 2 (new bridge op needed):
- `list_drivers` — enumerate installed ollama models via `/api/tags`, CLIs via `which claude`/`which gemini`, deterministic.
- First-run picker binds against the roster.

Round 3:
- `record_read` extension to include framework brackets (`TriggerFired` / `ProducerStarted` / `ProducerCompleted`) for the swim-lane graph.
- `topology_introspect` → reuse `substrate.api.topology_graph`.
- `scene_project` — the game_of_life / Generation.grid tab.
- `topology_build_and_launch` — the callable-resolution layer for producer names is a real design question.

Round 4 (assay):
- `list_assays` — walk `~/.substrate/assays/` for preregistered runs.
- `assay_report` — call `substrate.assay.report.build_report` on stored preregistration + trial records.
- `assay_cell` — three trial records for one arm × case.
- The easy/med/hard/adv column split needs an extension to `build_report` for per-bin subtotals.

Round 5:
- `session_rename`, `record_export`, `workspace_diff`, `turn_interrupt`, `bundle_attach`, `tools_restrict`.

Round 6:
- Push transcript via `substrate.api.attach` / `LiveRecord`. Replaces the polling loop with a subscribable stream.

## What survives from the earlier work

The bridge layer is real and used: 14 ops at `bridge/main.py` wired to `SessionRegistry` methods. The `bridge-reasons.json` single-source table survives with typed reason enums on both sides. `BridgeOp` StrEnum + JSON assertion at import survives. Every capability the prototype needs sits behind an op that either exists or wraps a substrate method that exists.

The React shell under `src/` did not survive. The reducer, the observability spine, the 36 e2e harnesses are gone. Git holds them at HEAD~5 (before `44735e6` port-Q0) if any needs to come back; nothing needs to.

`signals/0.1.json` — the 108-tag vocabulary — is not being used by the prototype today. The prototype has no signal-emission contract. Whether the app grows one later, and whether that contract routes through `signals/0.1.json`, is a decision for after the wiring rounds finish.

## Docs on disk

The full trail:

- `process/planning/EPIC-PLAN-v0.1-2026-09-10.md` — the original 48-sprint signal-spine plan (superseded).
- `process/planning/EPIC-PLAN-v0.2-2026-09-12-prototype-port.md` — the port-to-React plan (Q0/Q1/Q2 executed then abandoned; superseded).
- `process/planning/SUBSTRATE-WIRING-2026-09-12.md` — the wire-the-prototype plan (current, with four corrections pending from the review).
- `process/planning/DIRECTION-2026-09-12.md` — this document.
- `process/reviews/REVIEW-2026-09-11-checkpoint-sprints-001-024.md` — reviewer's grade on the React-shell sprints.
- `process/reviews/REVIEW-2026-09-12-drift-extension.md` — additional drift findings.
- `process/reviews/REVIEW-2026-09-12-project-state-against-v0.2-plan.md` — auto-review from the Stop hook.
- `process/reviews/REVIEW-2026-09-12-wiring-plan.md` — reviewer's grade on the wiring plan; source of the four load-bearing fixes.
- `BLACKBOARD.md`, `KIT_DIARY.md` — every closed sprint carries a paragraph; the React-shell sprints 001–033 remain there as audit trail.

Every earlier plan stays on disk untouched. Nothing gets rewritten; new versions land as new files. That's the audit trail.
