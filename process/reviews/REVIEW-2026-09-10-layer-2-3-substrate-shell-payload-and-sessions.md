# Layer 2 + Layer 3 review — substrate-shell payload schemas and sessions

*2026-09-10 · reviews `substrate-ui/signals/0.1.json` §`layer_2_payload` (lines 224-361) and §`layer_3_sessions` (lines 362-504) against the design lock, the substrate seam, and the shell's own current source. Layer 2 types every tag's payload; Layer 3 names the situated event streams the tags nest inside. No design change is proposed anywhere below.*

---

## Method

Same reproducible shape as the Layer 0 / Layer 1 reviews. One reused grounding pass, one payload walk, one session-nesting walk.

1. **Read the draft.** `substrate-ui/signals/0.1.json` §`layer_2_payload` (envelope + 107 payload_schemas) and §`layer_3_sessions` (14 strata + halts_check + nesting_diagram).
2. **Verify Layer 1 count matches.** `shell_tag_count: 107`, updated from 101 to reflect the six gaps and the stratum reclassification the Layer 1 review surfaced. `layer_2_payload.payload_schemas` keys are the same 107 by construction — no schema without a tag, no tag without a schema.
3. **Walk every payload_schema forward.** For each of the 107 keys: (a) required fields carry non-null typed values; (b) every enum matches its substrate-side source (WorkspaceShape, SessionEndReason, ParkReason, ToolLoop tool names); (c) every foreign key (`pane_id`, `session_id`, `request_id`, etc.) matches a Layer 0 entity; (d) the privacy contract holds (prompt / find contents are length-only, never text).
4. **Verify enums against substrate source.** `substrate/src/substrate/topologies/session/vocabulary.py` (`SessionEndReason`, `ParkReason`, `SessionWarningKind`, `PromptSource`) and `substrate/src/substrate/session_registry.py` (`SessionStatus`, `WorkspaceShape`, `NameCollision`, `SessionEndedMidTurn`, `FreshSessionRequiresUserMessage`, `TornRecordOnResume`).
5. **Walk every Layer 3 stratum forward.** For each of the 14 strata: (a) boundary_open and boundary_close cite real Layer 1 tags; (b) persistent_attributes trace to a real payload field on the boundary_open; (c) framed_tags list is consistent with the nesting hierarchy.
6. **Halt checks.** BOOTSTRAP §Step 4 halts: `no boundary-open candidates`, `boundary-open candidate frames no tags`, `framing inferred without doc support`.
7. **Cross-check with Prototype v7 state class.** v7's `state = { revealed, mode, dir, sel, childOpen, promptVal, surface, studioView, level, sent, descent, descPv, descExtra, fanOpen, fanSel, findOpen, findQ, findScope, nestedDescent, showSettings, showExport, showEndConfirm, ended, frDone, theme, fontOverride, panes, focused, cols, rows, colW, rowW, revealL, ddFor, wsFor, allSessions, dropHint, ... }` — every runtime state slot should fit under one of the 14 strata.

---

## Layer 2 — payload schemas

### Envelope

The envelope shape (`{t, kind, payload}`) matches `src/renderer/emit.ts` in the shell scaffold (verified in the earlier abandoned-scaffold read; the current substrate-ui restart will land the same shape). `t` is `performance.now() - START` clamped to integer ms; `kind` matches the `^[A-Z][A-Z0-9_]*[A-Z0-9]$` pattern; `payload` is the per-tag object.

The envelope note references "107 tag names" — matches the updated Layer 1 count.

### Count check

107 payload_schemas keys total. By category (from Layer 1 by-category totals): 5+7+5+7+10+1+7+9+4+12+7+5+2+8+18 = 107 ✓. Every Layer 1 tag has a payload schema; no orphaned schema.

### Enum discipline — the whole check, one place

| Payload field | Enum | Substrate source | Verdict |
|---|---|---|---|
| PANE_UNBOUND_BOUND.shape · WORKSPACE_BOUND.shape · SESSION_CREATE_REQUESTED.workspace_shape · SESSION_CREATED.workspace_shape | `flat / worktree / isolate` | `session_registry.py:80-90` `WorkspaceShape` StrEnum | ✓ verbatim |
| PANE_SPLIT.axis · DROP_HINT_*.zone / PANE_MOVED.zone | `row / col` · `w / e / n / s / c` | shell-owned (state.ts axis; PANE-MECHANICS §Drop zones "left 30% W / right 30% E / top 30% N / bottom 30% S / center C") | ✓ |
| REVEAL_TOGGLED.from · to | `terminal / reveal` | D4 | ✓ |
| LENS_SWITCHED.from · to | `stream+graph / i/o / structure / scene` | D10 / D20 | ✓ |
| STREAM_LEVEL_TOGGLED.from · to | `all / app` | D26 | ✓ |
| STREAM_DIR_TOGGLED.from · to | `down / side` | D17 | ✓ |
| SURFACE_OPENED.kind · SURFACE_CLOSED.kind | `records / studio / assay` | D5 / D24 / D28 | ✓ |
| STUDIO_VIEW_TOGGLED.from · to | `form / canvas` | D27 | ✓ |
| FIND_OPENED.scope · FIND_SCOPE_CHANGED · REVEAL_FOCUS_MOVED · SETTING_CHANGED.key.enum options | `transcript / stream` etc. | 19h / 19k / 19l / 19c | ✓ |
| TRANSCRIPT_SESSION_ENDED_RENDERED.end_reason · SESSION_END_REQUESTED.source · SESSION_ENDED_ACK.end_reason | `user_exit / user_end / timeout / daemon_shutdown` | `vocabulary.py:35-43` `SessionEndReason` StrEnum | ✓ verbatim |
| TURN_SUBMIT_FAILED.reason | `queue_full / session_ended / fresh_session_requires_user_message / torn_record_on_resume / timeout` | `session_registry.py:164-204` (typed exceptions) + `try_enqueue_turn` return | ✓ verbatim |
| SESSION_CREATED.status | `running / parked / interrupted / ended` | `session_registry.py:65-77` `SessionStatus` StrEnum | ✓ verbatim |
| EXPORT_COMMITTED.kind | `record_dir / events_jsonl` | 19f | ✓ |
| GUTTER_DRAG_*.kind | `col / row / reveal` | PANE-MECHANICS §Dividers + v7:326 revealGutter | ✓ |
| SLASH_COMMAND_ROUTED.command | pattern `^/[a-z_-]+$` | D3 slash inventory | ✓ (open to future commands) |
| **TRANSCRIPT_PARK_RENDERED.park_reason** | **`final_answer / model_error / interrupt / session_open`** | **`vocabulary.py:46-53` `ParkReason` StrEnum** | **✗ MISMATCH — see finding P1** |

### Finding P1 — `park_reason` enum invents a substrate value

**Location.** `payload_schemas.TRANSCRIPT_PARK_RENDERED.park_reason` (line 271):

```
"park_reason": {"enum": ["final_answer", "model_error", "interrupt", "session_open"]}
```

**Substrate source.** `substrate/src/substrate/topologies/session/vocabulary.py:46-53`:

```
class ParkReason(StrEnum):
    FINAL_ANSWER = "final_answer"
    MODEL_ERROR = "model_error"
    INTERRUPT = "interrupt"
```

Three values. The draft's fourth value `session_open` is not a `ParkReason` member. Substrate has `PRODUCER_KIND_SESSION_OPEN` at `vocabulary.py:167` — a producer kind that emits the first UserMessage on a fresh session, distinct from any Park emission.

**Effect.** If the shell renders `TRANSCRIPT_PARK_RENDERED` with `park_reason: "session_open"`, the value never comes from a substrate `Park` envelope. Either the shell fabricates the value (hard rule 2 violation — "workers cannot invent vocabulary"), or the draft mislabels a shell-internal state. If the shell wants to render "the pane parked because we just opened a fresh session and are awaiting the first UserMessage," that is not a substrate Park at all — it is the pre-first-turn state, which appears in v7 at "◐ parked — awaiting your first message" (line 543 of v7's state class) but is emitted shell-side, not by substrate.

**Fix.** Two clean paths, both trivial:
- Remove `session_open` from the enum. `TRANSCRIPT_PARK_RENDERED` renders only from real substrate `Park` envelopes (three values). Add a separate shell tag `TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED` (or the equivalent) for the pre-first-turn line.
- Or, keep `session_open` and document it explicitly as a shell-side pseudo-Park with its own separate lineage — but that would violate the substrate vocabulary boundary Layer 0 spent effort establishing.

The first path is cleaner.

### Privacy contract

The draft's note says "the shell trace never logs prompt text (Layer 7 privacy constraint)." Verified across the payload set:

- `PROMPT_CHANGED.length` (int) — not `text` ✓
- `PROMPT_SUBMITTED.text_length` (int) — not `text` ✓
- `FIND_QUERY_CHANGED.q_length` (int) + `count` (int) — not `q` ✓
- `SLASH_COMMAND_ROUTED.arg_length` (int) — not `arg` (only `command` name is logged) ✓
- `TURN_SUBMIT_REQUESTED.text_length` (int) — not `text` ✓

**Note P2 (minor).** `FIRST_RUN_DRIVER_PICKED.driver_params` (optional object, unrestricted shape) is the one payload that could carry a secret. Ollama probes take `think`, `max_tokens`, `num_ctx`, `timeout` — all non-secret. Cloud drivers may take API keys. Layer 7 (Evidence) should carry a runtime-side discipline: strip any key whose name matches `/key|token|secret|password/i` from `driver_params` before emit. Schema can't enforce this alone.

**Note P3 (minor).** `WORKSPACE_POPOVER_OPENED` carries only `pane_id` (no path). Good. `PANE_UNBOUND_BOUND` and `WORKSPACE_BOUND` carry `workspace_path`. Paths often name projects or user identity. The design surfaces these paths in the UI anyway (sheet 19a WORKSPACE list, 15a header ⌥ chip); logging them in the trace is consistent with what the user already sees on screen. Fine as-is; note only.

### Bridge round-trip correlation

All eight `*_REQUESTED` tags carry `request_id: string` in required. All ten reply tags (`SESSION_CREATED`, `SESSION_CREATE_FAILED`, `SESSION_RENAMED`, `SESSION_RENAME_FAILED`, `TURN_SUBMITTED`, `TURN_SUBMIT_FAILED`, `INTERRUPTED`, `SESSION_ENDED_ACK`, `DRIVER_CHANGED`, `DRIVER_CHANGE_FAILED`, `BUNDLE_ATTACHED`, `BUNDLE_ATTACH_FAILED`, `TOOLS_RESTRICTED`, `WORKSPACE_BOUND`, `PROBE_DRIVER_PROBED`, `PROBE_DRIVER_FAILED`, `BRIDGE_HELLO_RECEIVED`, `BRIDGE_DEAD_SURFACED`) — every reply that pairs with a request carries `request_id`. Two replies stand alone by design (`BRIDGE_HELLO_RECEIVED` and `BRIDGE_DEAD_SURFACED` are unsolicited); correctly omit `request_id`.

### Substrate wire kind reference

`envelope_kind` (string, open) and `envelope_producer_kind` (string|null, open) on `TRANSCRIPT_ROW_RENDERED` and `STREAM_ROW_CLICKED`. Open string is right — D26 full-granularity view reads any kind on the record (kernel lifecycle + session vocabulary + tool_loop kinds like `ToolCall`/`ToolResult`/`FinalAnswer` + downstream topology-emitted kinds); pinning a closed enum would over-restrict.

### depth constraints

- `DELEGATE_CALL_RENDERED.depth`: `minimum: 1, maximum: 2` — matches `delegate.py` `max_depth=2` default ✓
- `DELEGATE_DEPTH_CAP_REFUSED.depth`: `const: 2` — refusal only fires at the cap ✓
- `DESCENT_ENTERED.depth`: `minimum: 1, maximum: 2` ✓
- `DESCENT_EXITED.to_depth`: `minimum: 0, maximum: 1` (climbing back to session = 0, back to depth-1 child = 1) ✓

### Foreign-key discipline

`pane_id → Pane`, `session_id → Session`, `window_id → Window`, `envelope_seq → Envelope`, `record_root → Record`, `child_record_root → Record`, `tool_call_id → DelegateCall`, `driver / to_driver / from_driver → Driver`, `bundle → Bundle`, `anchor_id → Anchor`, `request_id → bridge_request stratum`. Every foreign-key alias in the note traces to a real Layer 0 entity.

### `seed` deprecation note

`SESSION_CREATE_REQUESTED.seed` (required, string). Substrate deprecates seed at create-time (`session_registry.py:421-431`: `DeprecationWarning "SessionManifest.seed is deprecated. The prompt-composition arc (sprints 058-067) moved every real prompt source to a PromptFragment producer; seed has no consumer inside the topology. Pass empty string; a future sprint drops the field."`). The draft correctly types `seed` as a required string (backwards-compat with the SessionManifest API). The shell should always pass `""`. Consider adding a schema note or a Layer 7 constraint: `seed` MUST be empty string per substrate deprecation.

### Layer 2 verdict

Ready pending one real bug (P1: `park_reason.session_open` invents a substrate value) and three minor notes (P2 driver_params secret-stripping; P3 workspace path logging noted; seed deprecation note). Everything else is faithful to the design and to substrate source.

---

## Layer 3 — sessions

### Enumeration

14 strata declared:

| # | Name | Boundary open | Boundary close |
|---|---|---|---|
| 1 | app_session | COLLECTION_OPENED | WINDOW_CLOSED (last window) |
| 2 | first_run | FIRST_RUN_OPENED | FIRST_RUN_COMPLETED |
| 3 | window_session | WINDOW_OPENED | WINDOW_CLOSED |
| 4 | pane_session | PANE_CREATED | PANE_CLOSED |
| 5 | substrate_binding | SESSION_CREATED | SESSION_ENDED_ACK · PANE_CLOSED |
| 6 | turn | TURN_SUBMIT_REQUESTED | TURN_SUBMITTED · TURN_SUBMIT_FAILED |
| 7 | delegate_flow | DELEGATE_CALL_RENDERED | DELEGATE_CALL_FOLDED · DELEGATE_DEPTH_CAP_REFUSED |
| 8 | descent | DESCENT_ENTERED | DESCENT_EXITED |
| 9 | reveal | REVEAL_TOGGLED (to: reveal) | REVEAL_TOGGLED (to: terminal) |
| 10 | surface | SURFACE_OPENED | SURFACE_CLOSED |
| 11 | find | FIND_OPENED | FIND_CLOSED |
| 12 | dialog | SETTINGS_OPENED · EXPORT_DIALOG_OPENED · END_CONFIRM_OPENED | *_CLOSED · *_COMMITTED |
| 13 | bridge_request | *_REQUESTED | *_ACKED · *_FAILED |
| 14 | header_popover | DRIVER_DROPDOWN_OPENED · WORKSPACE_POPOVER_OPENED | *_CLOSED · DRIVER_PICKED |

Every boundary_open and every boundary_close cites a real Layer 1 tag. ✓

### Nesting

The `nesting_diagram` is hierarchically consistent for 13 strata:

```
app_session
├── first_run (× 0..1)
├── window_session (× N)
│     ├── pane_session (× 1..8)
│     │     ├── substrate_binding (× 0..1)
│     │     │     └── turn (× M)
│     │     │           └── delegate_flow (× K)
│     │     │                 └── descent (× 0..1, depth 1..2)
│     │     ├── reveal
│     │     ├── surface (× 0..1)
│     │     ├── find (× 0..1)
│     │     └── header_popover (× 0..1)
│     └── dialog (× 0..1)
└── bridge_request (× many)
```

Wait — the diagram in the JSON does not include `header_popover`. See finding S1.

### Finding S1 — nesting_diagram omits header_popover

**Location.** `layer_3_sessions.nesting_diagram` (lines 365-380) lists 13 strata visually; the `sessions` array (lines 382-495) declares 14. `header_popover` (lines 487-494) is missing from the diagram tree.

**Effect.** A reader taking the diagram as the source of truth misses one stratum. Layer 5 (State-Transition) will need to know header_popover nests under pane_session (per its `pane_id` persistent attribute).

**Fix.** One-line addition to the diagram, under `pane_session`:

```
│     │     ├── header_popover (× 0..1 open; driver_dropdown | workspace_popover)
```

### Finding S2 — halts_check "13 strata" off-by-one

**Location.** `halts_check.no_boundary_open_candidates` (line 498) reads `"not applicable — 13 strata framed above"`. Diagram and `sessions` array carry 14; `session_count` at line 503 = 14.

**Effect.** Trivial copy inconsistency.

**Fix.** Change "13" to "14".

### Framed-tags coverage

Walked every stratum's `framed_tags` against Layer 1's 107 tags. Every Layer 1 tag appears under at least one stratum's framing. Cross-check against the state class in Prototype v7:

- `revealed` boolean → reveal stratum ✓
- `mode` (stream/io/structure/scene) → reveal-internal, LENS_SWITCHED ✓
- `dir` (down/side) → reveal-internal, STREAM_DIR_TOGGLED ✓
- `sel` (selected seq) → reveal-internal, INSPECTOR_OPENED ✓
- `childOpen` → delegate_flow ✓
- `promptVal` → prompt-internal (pane_session) ✓
- `surface` (records/studio/assay/null) → surface stratum ✓
- `studioView` (form/canvas) → surface stratum (studio-specific) ✓
- `level` (all/app) → reveal-internal, STREAM_LEVEL_TOGGLED ✓
- `descent` (array of child keys) → descent stratum ✓
- `fanOpen`, `fanSel` → delegate_flow (fan-out) ✓
- `findOpen`, `findQ`, `findScope` → find stratum ✓
- `nestedDescent` → SETTING_CHANGED (persisted via Settings), applies to descent render ✓
- `showSettings`, `showExport`, `showEndConfirm` → dialog stratum ✓
- `ended` (boolean) → substrate_binding close ✓
- `frDone` (first-run done) → first_run boundary_close ✓
- `theme`, `fontOverride` → SETTING_CHANGED payloads ✓
- `panes`, `focused`, `cols`, `rows`, `colW`, `rowW` → window_session (grid) + pane_session per-pane ✓
- `revealL` (reveal-gutter position) → GUTTER_DRAG_STOPPED with kind=reveal ✓
- `ddFor`, `wsFor` → header_popover stratum ✓
- `allSessions` (registry cache) → substrate_binding state ✓
- `dropHint` → DROP_HINT_* ✓

Every runtime state slot in the prototype has a stratum home. Coverage complete.

### Boundary discipline

- **app_session** closes on WINDOW_CLOSED (last window). ⌘Q via Electron `app.quit()` fires `window-all-closed` handler which chains to WINDOW_CLOSED. Fine.
- **substrate_binding** carries two close paths — SESSION_ENDED_ACK (session finalises on disk) and PANE_CLOSED (unbinding; session persists in registry). Correct per D57 ("closing a pane never deletes") and D68 corollary b (End Session interrupts and finalises).
- **turn** boundary_close = TURN_SUBMITTED or TURN_SUBMIT_FAILED. Two paths; one is happy, one is typed-failure. ✓
- **delegate_flow** boundary_close = DELEGATE_CALL_FOLDED or DELEGATE_DEPTH_CAP_REFUSED. The refusal at depth 2 is a terminal state for that particular delegate call. ✓
- **reveal** is a "stateful binary" (per note) — REVEAL_TOGGLED (to: reveal) opens; REVEAL_TOGGLED (to: terminal) closes. A pane can spend hours in either state. Fine. Layer 4 will need a cadence-invariant: at any moment, reveal is either "open" (one stratum instance) or "not open" (zero).
- **surface** is exactly-zero-or-one at a time; opening a second implicitly closes the first (prior_kind in SURFACE_OPENED payload). ✓
- **dialog** exactly-zero-or-one at a time; esc dismisses the topmost. ✓
- **bridge_request** many concurrent (correlated by request_id). ✓
- **header_popover** at most one per pane; opening a second closes the first (v7's `ddFor` / `wsFor` state pair — only one non-null at a time). ✓

### Halts_check disposition

BOOTSTRAP §Step 4 halt cases:

- **`no_boundary_open_candidates`** — not applicable. 14 strata framed. ✓
- **`boundary_open_frames_zero_tags`** — bridge_request explicitly frames zero nested tags (documented). The stratum brackets its round-trip by request_id; nothing is "inside" a round-trip other than the reply. Fine per the honest documentation.
- **`framing_inferred`** — not applicable. Every stratum has explicit boundary tags in Layer 1.

Halt-cases correctly disposed.

### Finding S3 — reveal stratum instance lifecycle

**Location.** `layer_3_sessions.sessions.reveal` (lines 448-454). Note says "stateful binary. Every pane holds a reveal_bool; toggling flips the pane's level. Non-strict — a pane can spend hours in either state."

**Question.** Is each REVEAL_TOGGLED (to: reveal) a new stratum instance (opening / closing / opening / closing = 2 instances, 2 lifetimes), or is `reveal` a persistent stateful property with just one lifetime per pane? Both readings are defensible. Layer 4 will need to pin this: if instances, Layer 4 cadence constrains the open-close frequency; if persistent, Layer 4 pins the on/off invariant per pane.

**Fix (suggestion for the Architect).** Add one line to the note: "each REVEAL_TOGGLED (to: reveal) opens a new stratum instance; each REVEAL_TOGGLED (to: terminal) closes it. A pane can host any number of reveal-instances across its lifetime." Or the reverse. Ratify to unblock Layer 4.

### Cross-check against Prototype v7 state class

v7's state class holds `sent: []` (line 516) — the send-queue for messages a user typed while descended. Not covered by any stratum. Small: `sent` is a UI-side queue for the "queued — prototype only" message rendering (v7:107-109). Might not need a stratum; it's transient scratch. Note only.

### Layer 3 verdict

Ready pending one small copy inconsistency (S2: "13 strata" should be "14"), one nesting_diagram omission (S1: add header_popover), and one Architect ratification (S3: reveal stratum instance vs persistent). Everything else is faithful and complete.

---

## Ratification verdict

**Layer 2 ready pending fix of finding P1** (`park_reason.session_open` invents a substrate value). The three P-notes (driver_params secret-stripping, workspace path logging, seed deprecation) are documentation refinements, not blockers.

**Layer 3 ready pending fix of findings S1 (add header_popover to diagram) and S2 (14 not 13)** plus one Architect ratification (S3: reveal stratum shape). No blocking halts.

Once P1, S1, S2 apply and S3 rules, Layer 4 (temporal cadence + pairing invariants) can proceed under BOOTSTRAP.md Step 5.

---

## Cross-reference

- Layer 0 review: `substrate-ui/process/reviews/REVIEW-2026-09-10-layer-0-substrate-shell-vocabulary.md`.
- Layer 1 review: `substrate-ui/process/reviews/REVIEW-2026-09-10-layer-1-substrate-shell-lexical.md`.
- Vocabulary source: `substrate-ui/signals/0.1.json` §`layer_2_payload` (lines 224-361) and §`layer_3_sessions` (lines 362-504).
- Substrate seam: `substrate/src/substrate/session_registry.py` (SessionStatus, WorkspaceShape, typed exceptions), `topologies/session/vocabulary.py` (ParkReason, SessionEndReason, SessionWarningKind), `topologies/tool_loop/delegate.py` (max_depth=2, SESSION_ENDED_MID_DELEGATE).
- Design lock: `handoff_latest/prototypes/Substrate Prototype v7.dc.html` state class (lines 515-530) for the runtime state slots cross-check.
- Screenshots on disk: 21 Prototype v7 states + 27 sheet crops at `/private/tmp/claude-501/.../scratchpad/pw/`.
