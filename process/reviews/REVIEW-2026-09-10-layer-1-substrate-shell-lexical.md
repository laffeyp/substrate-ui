# Layer 1 review — substrate-shell lexical (grounded pass)

*2026-09-10 · reviews the `layer_1_lexical` section of `substrate-ui/signals/0.1.json` against the design lock and the substrate seam. Layer 1 is the per-entity tag decomposition; the review checks that every declared tag ties to a rendered element or a bridge call, and that every design surface that changes shell state has a tag. No design change is proposed anywhere below.*

---

## Method

Same reproducible shape as the Layer 0 review (`REVIEW-2026-09-10-layer-0-substrate-shell-vocabulary.md`). Adds one pass: walk the 101 tags forward against the design + substrate seam, walk the design surface backward against the tag list, then check BOOTSTRAP §Step 2's halt conditions.

1. **Read the draft.** `substrate-ui/signals/0.1.json` lines 82-216 — categories, strata, 101 tag entries, four surfaced flags, count totals.
2. **Layer 0 grounding stands.** The 34 shell + 14 substrate reference entities and their design citations were verified in the prior review. Layer 1 decomposes them; the entity list is the ceiling.
3. **Design lock reads carry over.** Prototype v7 (1,132 lines) in full plus turn 15 lock, turn 19 gap close, turn 20 delegate descent on the sheet — all read in the Layer 0 pass; grounding is fresh.
4. **Substrate seam checked against source.** `substrate/src/substrate/session_registry.py` (1,462 lines) for every IPC method's real signature; `topologies/tool_loop/delegate.py:59` for `SESSION_ENDED_MID_DELEGATE`; `topologies/session/vocabulary.py:73-100` for the ten session-vocab kinds; `constants.py:41-52` for the twelve kernel lifecycle kinds.
5. **Prototype v7 screenshots on disk.** 21 states captured by Playwright + Chromium via the Layer 0 pass — every rendered element referenced below is visible in one shot.
6. **Forward walk.** For each of the 101 tags: name the design line (D-number, sheet option id, PANE-MECHANICS invariant, or v7 line range) or the bridge method it corresponds to.
7. **Backward walk.** For each option in turns 15/19/20 and each row in FUNCTIONALITY.md: name the tag(s) that fire when the user reaches it.
8. **Halt checks.** BOOTSTRAP §Step 2 halts: `entity produces > 5 tags`, `load-bearing entity produces zero tags`, `chain decomposition where domain interaction produces multiple lifecycle events at different observability points`.
9. **Count arithmetic.** Sum `shell_tag_count_by_category` and `shell_tag_count_by_stratum` against `shell_tag_count`.

---

## Grounding at a glance

- **101 tags.** By category: 5 + 7 + 5 + 6 + 9 + 1 + 6 + 9 + 4 + 7 + 12 + 5 + 2 + 7 + 16 = 101 ✓. By stratum: 88 event + 3 ambient + 1 summary + 9 incident = 101 ✓.
- **Ambient tags (3):** TRANSCRIPT_ROW_RENDERED, ANCHOR_PAINTED, HARNESS_HEARTBEAT.
- **Summary tags (1):** COLLECTION_PERSISTED.
- **Incident tags (9):** STUDIO_VALIDATE_FAILED, STUDIO_BUILD_REJECTED, SESSION_CREATE_FAILED, SESSION_RENAME_FAILED, TURN_SUBMIT_FAILED, DRIVER_CHANGE_FAILED, BUNDLE_ATTACH_FAILED, BRIDGE_DEAD_SURFACED, DELEGATE_DEPTH_CAP_REFUSED.
- **Fifteen categories.** window · pane · header · prompt · transcript · reveal · lens · surface · find · descent · dialog · layout · harness · bridge · bridge_reply.

## Coverage forward — every tag ties to a design line or bridge call

Walked all 101. Sample of the tighter ties:

- **TURN_SUBMIT_REQUESTED / TURN_SUBMITTED / TURN_SUBMIT_FAILED** wrap `SessionRegistry.turn_sync` guarded by `try_enqueue_turn` / `dequeue_turn` (`session_registry.py:747-874`, cap = 4 at line 281). The `TURN_SUBMIT_FAILED` reason list (`queue_full | session_ended | fresh_session_requires_user_message | torn_record_on_resume | timeout`) matches the typed exceptions in `session_registry.py:164-204` verbatim.
- **PANE_UNBOUND_BOUND** ties to D66f (unbound pane's prompt IS the workspace picker; ↵ binds and starts). Shell-side commit; sits between PANE_CREATED (unbound) and the substrate WORKSPACE_BOUND ack.
- **DELEGATE_DEPTH_CAP_REFUSED** ties to D41 (`max_depth=2` in `delegate.py:354`, refusal rendered as a failed ToolResult per sheet 19j).
- **BRIDGE_HELLO_RECEIVED** ties to `bridge/main.py:35` (`{"op":"hello","substrate":<v>,"protocol":1}`).
- **BRIDGE_DEAD_SURFACED** ties to `electron/ipc.ts:63-71` (`crashesLast30s.length >= 2` triggers `onDead`).
- **INTERRUPT_REQUESTED / INTERRUPTED** ties to `SessionRegistry.interrupt` (`session_registry.py:912-970`, returns `ProducerRef | dict | None` via `runtime.cancel_producer`).
- **FIRST_RUN_DRIVER_PICKED** ties to D69 (probe local Ollama / CLI drivers on PATH / API keys in env / deterministic floor; sheet 19m shows the driver rows).
- **DROP_HINT_ZONE_CHANGED** ties to PANE-MECHANICS §Drop zones (W/E/N/S/C thirds).
- **STREAM_ROW_CLICKED** ties to D23 (side-graph bars are the same element as the row — one click surfaces the Inspector from either).

No tag names a substrate method that does not exist. No tag names a design element that is not in the lock.

## Coverage backward — every design surface has a tag

Walked turns 15 / 19 / 20 option by option.

| Sheet option | Tags that fire |
|---|---|
| 15a terminal + delegate inset | PANE_CREATED, PANE_FOCUSED, PROMPT_CHANGED, PROMPT_SUBMITTED, TRANSCRIPT_ROW_RENDERED, TRANSCRIPT_DELEGATE_LINE_RENDERED, DELEGATE_INLINE_EXPANDED, TRANSCRIPT_PARK_RENDERED, DELEGATE_CALL_RENDERED / DELEGATE_CALL_FOLDED |
| 15b revealed with lenses | REVEAL_TOGGLED, LENS_SWITCHED, STREAM_LEVEL_TOGGLED, STREAM_DIR_TOGGLED, STREAM_ROW_CLICKED, INSPECTOR_OPENED / INSPECTOR_CLOSED |
| 15c other lenses | LENS_SWITCHED (kind: stream+graph / i/o / structure / scene) |
| 15d records | SURFACE_OPENED (kind: records) |
| 15e assay | SURFACE_OPENED (kind: assay) |
| 15f studio form | SURFACE_OPENED (kind: studio), STUDIO_VIEW_TOGGLED (to: form) |
| 15g studio canvas | STUDIO_VIEW_TOGGLED (to: canvas), STUDIO_VALIDATE_REQUESTED / VALIDATED / VALIDATE_FAILED, STUDIO_BUILD_REQUESTED / BUILT / BUILD_REJECTED |
| 15h/i split-once / 2×2 | PANE_SPLIT + PANE_CREATED, DRIVER_DROPDOWN_OPENED / CLOSED, WORKSPACE_POPOVER_OPENED / CLOSED |
| 19a ⌘D workspace picker | PANE_CREATED (unbound), PANE_UNBOUND_BOUND on commit, SESSION_CREATE_REQUESTED → SESSION_CREATED (ack) + WORKSPACE_BOUND (ack) |
| 19b blank new window | WINDOW_OPENED, PANE_CREATED (unbound), then same picker chain |
| 19m first run | FIRST_RUN_OPENED, FIRST_RUN_DRIVER_PICKED, FIRST_RUN_COMPLETED |
| 19c settings | SETTINGS_OPENED, SETTING_CHANGED, SETTINGS_CLOSED |
| 19f export | EXPORT_DIALOG_OPENED, EXPORT_COMMITTED, EXPORT_DIALOG_CLOSED |
| 19g end-session confirm | END_CONFIRM_OPENED → INTERRUPT_REQUESTED (if RUNNING) → INTERRUPTED → SESSION_END_REQUESTED → SESSION_ENDED_ACK; TRANSCRIPT_SESSION_ENDED_RENDERED |
| 19h / 19k / 19l find scopes | FIND_OPENED, FIND_SCOPE_CHANGED, FIND_QUERY_CHANGED, FIND_CLOSED |
| 19i rate-limited | TRANSCRIPT_RATE_LIMITED_RENDERED |
| 19j depth-cap refusal | DELEGATE_DEPTH_CAP_REFUSED |
| 20a-e descent | DESCENT_ENTERED / EXITED, DELEGATE_INLINE_EXPANDED / COLLAPSED, SETTING_CHANGED (key: nested_descent) for 20d/e |
| 20f depth-hue ramp | DESCENT_ENTERED × 5 (paint witness via ANCHOR_PAINTED) |
| 20g fan-out | TRANSCRIPT_FANOUT_LINE_RENDERED, FAN_OUT_INLINE_EXPANDED / WALKED / COLLAPSED, DESCENT_ENTERED on ↵ |

Every design surface is covered.

## Chain-decomposition — the Audio Object pattern

**Turn chain.** `PROMPT_SUBMITTED` (shell UI event on ↵) → `TURN_SUBMIT_REQUESTED` (bridge action) → substrate writes envelopes to the record (`UserMessage → PromptFragment × N → PromptComposed → ModelReply → (ToolCall + ToolResult) × M → FinalAnswer → Park`) each rendered by `TRANSCRIPT_ROW_RENDERED` × K → `TURN_SUBMITTED` (bridge ack).

Two shell tags flank many substrate envelopes. The shell does not mint a shell tag per substrate envelope — right shape. The Layer 1 draft's CHAIN_DECOMPOSITION_CHECK flag names this pattern explicitly and cites Audio Object's `REC_QUEUED → REC_FIRE → REC_START_NOW`. Concur. Layer 5 will pin the ordering invariant.

**End-session chain.** `END_CONFIRM_COMMITTED` → `INTERRUPT_REQUESTED` (guarded by manifest status == RUNNING) → `INTERRUPTED` → `SESSION_END_REQUESTED` → substrate writes SessionEnded → `TRANSCRIPT_SESSION_ENDED_RENDERED` + `SESSION_ENDED_ACK`. Matches D68 corollary b (end-session on a live session interrupts the running turn first).

**Delegate chain.** `TRANSCRIPT_DELEGATE_LINE_RENDERED` (initial ⑂ line) → `DELEGATE_CALL_RENDERED` (ToolCall arrives) → optional `DELEGATE_INLINE_EXPANDED` → optional `DESCENT_ENTERED` → child's own transcript rows (recursive) → `DELEGATE_CALL_FOLDED` (ToolResult with `child_root` arrives) → `DELEGATE_INLINE_COLLAPSED`. Depth cap: `DELEGATE_DEPTH_CAP_REFUSED` if the child hits `max_depth=2`.

## Halt checks

- **`entity produces > 5 tags`.** Pane: 7 (CREATED, CLOSED, FOCUSED, SPLIT, RENAMED, MOVED, UNBOUND_BOUND). Studio: 8. Both surfaced correctly by the draft, both disposed as NOT over-decomposition. Concur — Pane's seven verbs are distinct lifecycle points (create ≠ split ≠ rename ≠ move ≠ unbound→bound); Studio's eight are five verb classes each with tri-state acks for validate/build. Neither is the fabrication the halt catches.
- **`Layer-0 entity produces zero tags`.** Seven passive-render entities (WindowStrip, PaneHeader, DriverChip, WorkspaceChip, Records, Assay, Footer) emit zero shell tags. Surfaced correctly. Each is a paint witness of an ancestor's state — the WindowStrip renders when `panes.length > 1` (derived from PANE_CREATED count); the PaneHeader renders whenever its Pane renders; DriverChip / WorkspaceChip are the click surfaces for the dropdowns and popovers (which carry the events); Records / Assay are Surface renderings driven by SURFACE_OPENED (kind); Footer reads Session status + Descent depth + Record identity. Layer 7 (Evidence) pairs each with a pixel-anchor. Concur — the halt catches load-bearing entities with silent state, not derived entities with paint-only state.
- **Chain decomposition.** Named above. Concur with the draft's disposition.

Every halt check disposed correctly. No blocking halt.

## Substrate seam coverage

Every method the shell IPC surface names has a matching shell tag chain (or an explicit read-only disposition).

| Bridge op | Shell tag chain |
|---|---|
| `list_sessions` | none (read; feeds Records surface via SURFACE_OPENED) |
| `get_session` | none (read) |
| `create_session` | SESSION_CREATE_REQUESTED → SESSION_CREATED / SESSION_CREATE_FAILED ✓ |
| `rename_session` | SESSION_RENAME_REQUESTED → SESSION_RENAMED / SESSION_RENAME_FAILED ✓ |
| `set_driver` | DRIVER_CHANGE_REQUESTED → DRIVER_CHANGED / DRIVER_CHANGE_FAILED ✓ |
| `set_bundle` | BUNDLE_ATTACH_REQUESTED → BUNDLE_ATTACHED / BUNDLE_ATTACH_FAILED ✓ |
| `submit_user_message` | TURN_SUBMIT_REQUESTED → TURN_SUBMITTED / TURN_SUBMIT_FAILED ✓ |
| `interrupt` | INTERRUPT_REQUESTED → INTERRUPTED ✓ |
| `queue_depth` | none (poll) |
| `next_turn_index` | none (poll) |
| `delete_session` | none (missing — see gap #5) |
| `probe_driver` | none (missing — see gap #4) |
| bridge lifecycle | BRIDGE_HELLO_RECEIVED, BRIDGE_DEAD_SURFACED ✓ |

## Six small gaps against the design (surface for ratification, not fixes)

Each gap is a design surface with a tag that could be named but isn't. None is a coverage error; each is a consistency or observation-contract question.

1. **`WORKSPACE_PICKER_WALKED`** (or equivalent). Sheet 19a's picker has `↑↓ pick · ↵ bind + start`. `SlashRouter` has `SLASH_ROUTER_WALKED` (line 110); `FanOutInline` has `FAN_OUT_INLINE_WALKED` (line 124). The workspace picker's keyboard walk has no equivalent. Consistency suggests naming it.
2. **`REVEAL_FOCUS_MOVED`** (transcript vs stream). Prototype v7 has `focusTranscript` and `focusStream` handlers (v7:167, v7:184, v7:252). Find scope depends on which half of the revealed view has focus (sheet 19h stream / 19k transcript / 19l revealed-transcript). No shell tag captures the intra-reveal focus flip. Arguably fine as an implicit Prompt-vs-Stream focus state below Layer 1 granularity; arguably worth naming for the Find scope observation contract.
3. **`TRANSCRIPT_COMPACTED_RENDERED` and `TRANSCRIPT_SESSION_END_REQUESTED_RENDERED`.** Both `TranscriptCompacted` and `SessionEndRequested` are real session-vocab kinds (`vocabulary.py:79, 78`). Neither has a dedicated shell tag; both fall under the generic `TRANSCRIPT_ROW_RENDERED`. The generic covers them, but the surface-changing kinds (Park, SessionEnded, RateLimited) each get named tags — consistency suggests naming `TranscriptCompacted` at minimum since it materially changes the transcript's display state.
4. **`PROBE_DRIVER_REQUESTED / PROBED / FAILED`.** `bridge/registry.py:164 op_probe_driver` is a real bridge op used by FirstRun (19m) and any create-session fail-fast path. Not surfaced as shell tags. Might be covered as internal detail of FIRST_RUN_DRIVER_PICKED, but the round-trip has no observation-contract handle. If the probe fails, the failure has to surface somewhere in the trace.
5. **`SESSION_DELETE_REQUESTED / SESSION_DELETED`.** `session_registry.py:993` exposes `delete` (unlinks manifest + by-name entry, leaves the record). MENU-BAR names Session ▸ End Session which maps to SESSION_END_REQUESTED (finalises via SessionEnded), not delete. Delete isn't in the design lock's shell paths, so omission is design-consistent. Note only — if a build sprint later wires delete (e.g., a records-surface trash affordance), tag pair is needed.
6. **Assay drill-in tags.** Sheet 15d says assays are click-through from records; sheet 15e says "click a cell for its 3 trial records." No `ASSAY_ARM_INSPECTED` / `ASSAY_CELL_OPENED`. Currently covered by SURFACE_OPENED transitions or records-list clicks. Small v0.2 gap when drill-in wires.

## One stratum question

**`TRANSCRIPT_ROW_RENDERED` marked `ambient`.** Foundation 01 characterizes ambient as "sampled at high frequency" (frame timings, memory stats — timer-driven). This tag fires once per substrate-envelope arrival — event-cadence, not sample-cadence. The Layer 4 note the draft anticipates ("cadence 1:1 with envelope arrivals") is event-cadence dressed as cadence-invariant.

Two paths, both defensible:
- **Recategorize as `event`.** Consistent with Foundation 01. Trace fills with them (potentially thousands per session); grader needs to filter.
- **Keep `ambient`, pin the cadence.** Layer 4 declares an ambient invariant "one per envelope arrival, no timer." Non-standard but defensible if the "high frequency" characterization is loosened to "high-volume, cadence-invariant."

Architect's call. Flag only.

`ANCHOR_PAINTED` and `HARNESS_HEARTBEAT` are marked `ambient` and are frame-rate paints. Correct per Foundation 01.

`COLLECTION_PERSISTED` is marked `summary` and is a periodic throttled snapshot. Correct.

## Category boundaries

- **Surface holds 9 tags of which 8 are Studio-specific.** Records and Assay each get one shell tag (SURFACE_OPENED with kind); Studio needs eight verb tags. Not over-decomposition (verified above), but Surface-as-category is Studio-heavy. Alternative `studio` category not chosen. Judgment call; concur with the draft.
- **Reveal holds one tag** (REVEAL_TOGGLED). Fine — the entity is a single toggle.
- **Every other category has 4-16 tags,** grouped by architectural boundary. Consistent with BOOTSTRAP guidance.

## Ratification verdict

Layer 1 is a faithful lexical decomposition of Layer 0 over the core daily-driver design (turns 15 + 19 + 20). Counts arithmetic-check clean. Every tag maps to a design line or a bridge method. Every design surface has a tag or an explicit passive-render disposition. The four already-surfaced flags are correctly named:

1. **NEW_TAG_PROPOSED PANE_UNBOUND_BOUND** — concur keep, gives the shell-side commit its own trace event distinct from the substrate ack (WORKSPACE_BOUND).
2. **OVER_DECOMPOSITION_CHECK Studio** — concur, 8 tags across 5 verb classes is not over-decomposition.
3. **PASSIVE_ENTITIES × 7** — concur, Layer 7 pairs each with a pixel-anchor. Layer 1 is state transitions, not paint.
4. **CHAIN_DECOMPOSITION_CHECK turn chain** — concur, Audio Object REC_QUEUED → REC_FIRE → REC_START_NOW applied to a session turn; Layer 5 will pin the ordering.

Six small gaps and one stratum question surfaced above merit an Architect ruling before lock:

- Gap 1: WORKSPACE_PICKER_WALKED (consistency with other menu-walk tags)
- Gap 2: REVEAL_FOCUS_MOVED (Find scope observation-contract handle)
- Gap 3: TRANSCRIPT_COMPACTED_RENDERED (consistency with other special-shape substrate kinds)
- Gap 4: PROBE_DRIVER_* (bridge round-trip observation)
- Gap 5: SESSION_DELETE_* (note only; not in the design lock's shell paths)
- Gap 6: Assay drill-in (v0.2 when wired)
- Stratum question: TRANSCRIPT_ROW_RENDERED ambient vs event

**Layer 1 ready pending Architect ruling on the four surfaced flags plus the seven items above.** Once ruled, Layer 2 (per-tag payload schemas) can proceed under BOOTSTRAP.md Step 3.

---

## Cross-reference

- Layer 0 review: `substrate-ui/process/reviews/REVIEW-2026-09-10-layer-0-substrate-shell-vocabulary.md`.
- Vocabulary source: `substrate-ui/signals/0.1.json` §`layer_1_lexical` (lines 82-216).
- Design lock: `handoff_latest/prototypes/Substrate Prototype v7.dc.html` and `handoff_latest/sheets/Substrate Shell Directions v3.dc.html` (turns 15 / 19 / 20).
- Substrate seam: `substrate/src/substrate/session_registry.py`, `topologies/session/vocabulary.py`, `topologies/tool_loop/delegate.py`, `constants.py`.
- Screenshots on disk: 21 Prototype v7 states + 27 sheet crops at `/private/tmp/claude-501/.../scratchpad/pw/`.
