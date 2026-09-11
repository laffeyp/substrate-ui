# Layer 4 + Layer 5 review — substrate-shell temporal and state-transition

*2026-09-10 · reviews `substrate-ui/signals/0.1.json` §`layer_4_temporal` (lines 507-746) and §`layer_5_state_transitions` (lines 747-1050) against the design lock, the substrate seam, and the state class in Prototype v7. Layer 4 pins timing (cadence, pairing, window, forbidden-after, eventually-must, same-step); Layer 5 pins the ordering graph over the tag set. No design change is proposed anywhere below.*

---

## Method

Same reproducible shape as the prior reviews.

1. **Read the draft.** `substrate-ui/signals/0.1.json` §`layer_4_temporal` (30 invariants, 6 kinds, halts_check, counts) and §`layer_5_state_transitions` (36 rules, 6 kinds, graph_checks, counts).
2. **Verify Layer 1 count bumped for the P1 fix.** `shell_tag_count: 108` (was 107); `TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED` added at line 116 and its payload at line 273; `TRANSCRIPT_PARK_RENDERED.park_reason` enum trimmed from four values to three (matching substrate's `ParkReason` StrEnum verbatim). P1 clean.
3. **Verify Layer 3 S1 and S2 fixes.** `header_popover` now appears in the nesting_diagram; halts_check text no longer references "13 strata" as the count. S3 ratified in Layer 5 as instance-per-toggle.
4. **Walk every Layer 4 invariant.** For each: (a) named `from`/`to`/`tag` fields cite real Layer 1 tags; (b) `within` durations trace to substrate source or design; (c) same_step claims match the shell reducer's commit shape; (d) cadence claims cover every ambient tag (BOOTSTRAP §Step 5 halt).
5. **Walk every Layer 5 rule.** For each: (a) `from`/`to`/`before`/`after`/`tags` cite real Layer 1 tags; (b) `key` names a load-bearing foreign key (pane_id, session_id, tool_call_id, request_id, kind+gutter_index); (c) `stratum` names a real Layer 3 stratum; (d) named loops and terminals are consistent with Layer 3's boundary tags.
6. **Halt / graph checks.** BOOTSTRAP §Step 5: cadence for every ambient. BOOTSTRAP §Step 6: no unexpected cycles, no unreachable tags, every stratum has a reachable terminal, no rule conflicts.
7. **Cross-check with Prototype v7 state class and handlers.** `state.ts _gm/_gu` gutter handlers (v7:582-606) for GUTTER_DRAG pairing; `ddFor`/`wsFor` (v7:759-760) for header_popover exclusivity; `_split` (v7:557) for the split-focus same_step; `_bindPane` (v7:536-547) for PANE_UNBOUND_BOUND → SESSION_CREATE_REQUESTED chain.
8. **Cross-check with substrate source.** `session_registry.py:747-874` for turn_sync timeout, :912-970 for interrupt (1s `fut.result` + scheduling), :164-204 for typed exceptions, :400-472 for create, :472-570 for set_name, :645-691 for set_bundle, :694-732 for set_driver. `vocabulary.py:46-53` for ParkReason.

---

## Layer 4 — temporal

### Count arithmetic

30 invariants total. By kind: 6 cadence + 4 same_step + 11 pairing + 3 window + 3 forbidden_after + 3 eventually_must = 30 ✓.

### Ambient cadence coverage (BOOTSTRAP §Step 5 halt)

Ambient set after the Layer 1 recategorization: `{ANCHOR_PAINTED, HARNESS_HEARTBEAT}`. Two tags. Both carry cadence entries.

- `ANCHOR_PAINTED`: "at most one emit per anchor per animation frame (rAF-gated); one emit guaranteed on any shell-state change that flips a paint anchor." Correct per Addendum A2.
- `HARNESS_HEARTBEAT`: "60Hz nominal (rAF); ONLY fires while window.__substrateHarness is truthy (production builds never pay the raf cost)." Correct per B4 witness rule.

BOOTSTRAP §Step 5 halt correctly disposed.

### Same-step invariants

- **PANE_SPLIT + PANE_CREATED.** Both commit in the same reducer tick. Layer 5 pins the order (SPLIT before CREATED). ✓ — matches `state.ts splitPane` (verified in the earlier abandoned scaffold at v7:531-534).
- **PANE_SPLIT + PANE_FOCUSED.** The new pane takes focus in the same tick. ✓ — v7:557 sets `focused = panes[panes.length - 1].id`.
- **TRANSCRIPT_DELEGATE_LINE_RENDERED + DELEGATE_CALL_RENDERED.** Reading the ToolCall envelope paints the line and opens the delegate_flow in one tick. ✓
- **DELEGATE_CALL_FOLDED + TRANSCRIPT_ROW_RENDERED.** The fold-back paints the answer at the same seq the ToolResult arrived on. ✓

### Pairing bounds against substrate source

| Pairing | Bound | Substrate cite | Verdict |
|---|---|---|---|
| PROMPT_SUBMITTED → TURN_SUBMIT_REQUESTED | same reducer tick | shell reducer | ✓ |
| TURN_SUBMIT_REQUESTED → TURN_SUBMITTED / TURN_SUBMIT_FAILED | `timeout_seconds` (default 60s, max 600s) | `session_registry.py:747-874` | ✓ verbatim |
| SESSION_CREATE_REQUESTED → SESSION_CREATED / _FAILED | 5s | `session_registry.py:400-472` (in-process + one flock write) | ✓ generous |
| SESSION_RENAME_REQUESTED → SESSION_RENAMED / _FAILED | 5s | `session_registry.py:472-570` (same shape) | ✓ |
| INTERRUPT_REQUESTED → INTERRUPTED | 2s | `session_registry.py:912-970` (`fut.result(timeout=1.0)` at line 967 + scheduling) | ✓ generous |
| DRIVER_CHANGE_REQUESTED → DRIVER_CHANGED / _FAILED | 5s | `session_registry.py:694-732` | ✓ |
| BUNDLE_ATTACH_REQUESTED → BUNDLE_ATTACHED / _FAILED | 5s | `session_registry.py:645-691` (draft cite reads `647-694` — off by 2, see finding T1) | ~ |
| PROBE_DRIVER_REQUESTED → PROBED / FAILED | 10s | `OllamaResponder.context_tokens` + CLI probes | ✓ |
| BRIDGE_HELLO_RECEIVED → any bridge_request | 3s after spawn | `bridge/main.py:35` | ✓ |
| SESSION_END_REQUESTED → SESSION_ENDED_ACK | `timeout_seconds` (default 60s) | `END_ON_EXIT_SENTINEL` wraps `turn_sync` | ✓ |
| END_CONFIRM_COMMITTED → SESSION_END_REQUESTED | same reducer tick | D68 corollary b | ✓ |

**Finding T1 — set_bundle citation drift.**
- **Location.** `temporal_invariants[BUNDLE_ATTACH_REQUESTED pairing].cite: "session_registry.py:647-694"`.
- **Reality.** `session_registry.py:645-691` is `set_bundle` — off by two lines. Trivial.
- **Fix.** Update cite.

### Window (coalesce) invariants

- FIND_QUERY_CHANGED: 100ms per pane debounce. ✓
- PROMPT_CHANGED: 100ms per pane debounce. ✓
- GUTTER_DRAG_STARTED: exactly one open drag at a time per gutter kind. ✓ — matches `state.ts _gm/_gu` handlers.

### Forbidden_after invariants

- After PANE_CLOSED: no PANE_FOCUSED with the same pane_id. ✓
- After PANE_CLOSED: no transcript/prompt/reveal/lens/find/surface tag with the same pane_id. ✓
- After SESSION_ENDED_ACK: no TURN_SUBMIT_REQUESTED with the same session_id. ✓ — `session_registry.py:788-790` raises `SessionEndedMidTurn`.

### Eventually_must invariants

- END_CONFIRM_COMMITTED → TRANSCRIPT_SESSION_ENDED_RENDERED (bounded by turn_sync timeout). ✓
- PANE_CREATED(session_id: null) → PANE_UNBOUND_BOUND | PANE_CLOSED (unbound pane can't stay unbound forever without user action). ✓ — reasonable, no wall-time bound.
- PANE_UNBOUND_BOUND → SESSION_CREATE_REQUESTED → SESSION_CREATED (bindings dispatch immediately). ✓

### Small Layer 4 notes (not blockers)

- **T2.** No pairing `TURN_SUBMITTED → TRANSCRIPT_PARK_RENDERED` (the turn's finalisation on the transcript side). The turn stratum has TRANSCRIPT_PARK_RENDERED as a framed_tag "once — final" (Layer 3), and Layer 5 has an allowed_set on TRANSCRIPT_ROW_RENDERED for the turn — but no explicit pairing that ties turn-complete to park-rendered. Might be inferable from the substrate envelope arrival, but explicit pairing tightens the grader.
- **T3.** No pairing `SLASH_ROUTER_OPENED → SLASH_ROUTER_CLOSED`. Router closes on pick (SLASH_COMMAND_ROUTED), on esc (SLASH_ROUTER_CLOSED), or on a non-slash character. All three paths close; the pairing is not pinned in Layer 4. Small consistency gap.
- **T4.** No pairing `INSPECTOR_OPENED → INSPECTOR_CLOSED`. D22 says the same click closes. Not pinned in Layer 4 or 5.

### Layer 4 verdict

30 invariants pass. One trivial cite drift (T1). Three small consistency gaps (T2/T3/T4) — inferable from framing but not explicitly pinned. Ambient cadence coverage complete.

---

## Layer 5 — state-transition

### Count arithmetic

36 rules total. By kind: 9 allowed_set + 10 pairing_ordering + 8 terminal + 4 forced_next + 3 exclusive + 2 forbidden_after = 36 ✓.

### Stratum terminal coverage

Every Layer 3 stratum has a Layer 5 terminal:

| Stratum | Terminal tag(s) |
|---|---|
| pane_session | PANE_CLOSED ✓ |
| substrate_binding | SESSION_ENDED_ACK ✓ (PANE_CLOSED also unbinds) |
| turn | TURN_SUBMITTED / TURN_SUBMIT_FAILED ✓ |
| delegate_flow | DELEGATE_CALL_FOLDED / DELEGATE_DEPTH_CAP_REFUSED ✓ |
| descent | DESCENT_EXITED ✓ (paired) |
| reveal | REVEAL_TOGGLED (to: terminal) ✓ (paired) |
| surface | SURFACE_CLOSED ✓ (exclusive) |
| find | FIND_CLOSED ✓ |
| dialog | *_CLOSED / *_COMMITTED ✓ |
| bridge_request | *_ACKED / *_FAILED ✓ (pairing_ordering with request_id) |
| header_popover | *_CLOSED / DRIVER_PICKED ✓ (paired) |
| first_run | FIRST_RUN_COMPLETED ✓ |
| window_session | WINDOW_CLOSED (implicit; not stated as terminal, see finding S4) |
| app_session | WINDOW_CLOSED-last (implicit) |

### Finding S4 — window_session and app_session terminals implicit

**Location.** `layer_5_state_transitions.state_transitions[]`. No `terminal` rule for `WINDOW_CLOSED` (window_session) or for the app_session close.

**Effect.** graph_checks says "every stratum has a reachable terminal" and lists them; the list carries WINDOW_CLOSED and COLLECTION_PERSISTED (summary) but they aren't `terminal` rules. Cosmetic — the terminals exist per Layer 3 boundary_close, but Layer 5's rule set doesn't name them.

**Fix.** Add two terminal rules: `{kind: terminal, tag: WINDOW_CLOSED, stratum: window_session}` and either name app_session's terminal or note "app_session closes when the last window_session closes; not a Layer 5 rule — a Layer 3 boundary."

### Reveal stratum ratification (S3 from Layer 2/3 review)

Layer 5 lines 872-886 pin the ratification: `pairing_ordering` REVEAL_TOGGLED(to:reveal) → REVEAL_TOGGLED(to:terminal) by pane_id (alternating cycle per pane), plus `exclusive` at most one open instance per pane_id at a time. Instance-per-toggle shape. ✓

### Depth cap

`forbidden_after` DESCENT_ENTERED(depth:2) → DESCENT_ENTERED with the same pane_id (deeper impossible). Matches `delegate.py:353` `max_depth=2`. ✓

### Bridge round-trip injectivity

`pairing_ordering` SESSION_CREATE_REQUESTED → SESSION_CREATED OR SESSION_CREATE_FAILED, key `request_id`. Note says: "Every bridge REQUESTED has exactly one reply with matching request_id. Injective mapping — same shape for every bridge_request pair." ✓

### Session-ended-after invariants

`forbidden_after` SESSION_ENDED_ACK → any turn / bridge action targeting the same session_id (TURN_SUBMIT_REQUESTED, INTERRUPT_REQUESTED, DRIVER_CHANGE_REQUESTED, BUNDLE_ATTACH_REQUESTED, SESSION_END_REQUESTED, SESSION_RENAME_REQUESTED). ✓ — substrate raises `SessionEndedMidTurn` at `session_registry.py:788-790`.

### P1 fix in Layer 5

Line 1030-1038: `pairing_ordering` PANE_UNBOUND_BOUND → TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED, key pane_id + session_id, note "After binding, before the first turn, the shell paints the pre-first-turn line. Fires once per session." Cites v7:543 + REVIEW-2026-09-10-layer-2-3 P1. Correct application of the P1 finding.

### Chain of forced_next rules

- PANE_UNBOUND_BOUND → SESSION_CREATE_REQUESTED (key pane_id → session_id). ✓
- END_CONFIRM_COMMITTED → INTERRUPT_REQUESTED (if RUNNING) → SESSION_END_REQUESTED. ✓
- DRIVER_PICKED → DRIVER_CHANGE_REQUESTED (key session_id). ✓
- FIRST_RUN_DRIVER_PICKED → SESSION_CREATE_REQUESTED (key driver + workspace). ✓

### Exclusive constraints

- Reveal instance per pane. ✓
- Surface per pane. ✓
- Header popover per pane (v7's ddFor/wsFor state pair). ✓

### Graph checks

- **unexpected_cycles.** "none. Named loops declared: REVEAL_TOGGLED alternates by `to` field; TURN_SUBMIT_REQUESTED can fire multiple times per substrate_binding; DELEGATE_CALL_RENDERED can fire multiple times per turn; PANE_SPLIT can fire multiple times per window_session." All are expected multi-firing patterns. ✓
- **rule_conflicts.** "none observed." ✓
- **sessions_without_reachable_terminal.** Enumerated; all 14 strata covered. ✓
- **unreachable_tags.** Claim: "none. Every Layer 1 tag appears as a `from` or a `to` in at least one rule or is covered by a stratum's allowed_set 'any pane-scoped tag' catchall." See finding S5.

### Finding S5 — unreachable_tags claim is optimistic

**Location.** `graph_checks.unreachable_tags`.

**Reality.** Several Layer 1 tags do not appear in any Layer 5 rule and are not covered by the `any pane-scoped tag` catchall in pane_session's allowed_set:

- **WINDOW_OPENED, WINDOW_CLOSED** — window_session boundary tags; no explicit allowed_set names them.
- **COLLECTION_OPENED, COLLECTION_PERSISTED, COLLECTION_RESTORED** — collection tags; no explicit rules.
- **ANCHOR_PAINTED, HARNESS_HEARTBEAT** — ambient paint witnesses; no ordering rules (correctly, they don't need them).
- **BRIDGE_HELLO_RECEIVED, BRIDGE_DEAD_SURFACED** — bridge lifecycle; no explicit Layer 5 rule (Layer 4 has the HELLO timeout).
- **LENS_SWITCHED, STREAM_LEVEL_TOGGLED, STREAM_DIR_TOGGLED, STREAM_ROW_CLICKED, INSPECTOR_OPENED, INSPECTOR_CLOSED, REVEAL_FOCUS_MOVED** — reveal-scoped tags; no allowed_set for the reveal stratum's contents.
- **SETTING_CHANGED** — covered by SETTINGS_OPENED's allowed_set. ✓
- **FAN_OUT_INLINE_WALKED, WORKSPACE_PICKER_WALKED, SLASH_ROUTER_WALKED** — walk tags; no explicit rules.
- **TRANSCRIPT_PARK_RENDERED, TRANSCRIPT_SESSION_ENDED_RENDERED, TRANSCRIPT_COMPACTED_RENDERED, TRANSCRIPT_RATE_LIMITED_RENDERED, TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED** — transcript-scoped; covered by TRANSCRIPT_ROW_RENDERED allowed_set which says "any transcript-scoped tag or another TRANSCRIPT_ROW_RENDERED." ✓
- **TOOLS_RESTRICTED, WORKSPACE_BOUND** — bridge_reply tags; not in any explicit rule.

**Effect.** The `unreachable_tags: none` claim is technically defensible only if the catchalls are read broadly. Grader tightness would benefit from either explicit allowed_set rules for each stratum's contents, or a note like "the following tags carry no ordering rule by design: ANCHOR_PAINTED, HARNESS_HEARTBEAT, WINDOW_*, COLLECTION_*, walk tags, ambient bridge lifecycle."

**Fix.** Either (a) add a `reveal` allowed_set naming LENS_SWITCHED/STREAM_*/INSPECTOR_*/REVEAL_FOCUS_MOVED as from-REVEAL_TOGGLED(to:reveal), and a `window_session` allowed_set, or (b) tighten the graph_checks note to distinguish "ordered by explicit rule," "ordered by stratum framing," and "unordered by design (paint witnesses, boundary tags, walk tags)."

### Small Layer 5 notes (not blockers)

- **S6.** No pairing INSPECTOR_OPENED → INSPECTOR_CLOSED (D22 same-click-closes rule not pinned; falls under reveal-stratum framing).
- **S7.** No pairing SLASH_ROUTER_OPENED → SLASH_ROUTER_CLOSED / SLASH_COMMAND_ROUTED.
- **S8.** No forced-precedes for BRIDGE_HELLO_RECEIVED before any *_REQUESTED (Layer 4 has the 3s HELLO timeout; Layer 5 could add "before BRIDGE_HELLO_RECEIVED, no *_REQUESTED can fire" as `forbidden_after` reversed).

### Layer 5 verdict

36 rules pass. Two clean fixes surfaced (S4 window/app terminals, S5 unreachable_tags claim precision). Three small consistency gaps (S6/S7/S8 — inferable but not pinned). Reveal stratum shape ratified. Depth cap and session-ended forbidden_after correctly cite substrate. P1's TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED pairing wired correctly.

---

## Cross-check with Prototype v7 state class

State slots ordering — verified against Layer 5 rules:

- `revealed` bool → REVEAL_TOGGLED alternating cycle ✓
- `mode` (stream/io/structure/scene) → LENS_SWITCHED (needs S5 fix to be explicit) ~
- `childOpen` → DELEGATE_INLINE_EXPANDED/COLLAPSED under delegate_flow allowed_set ✓
- `descent` (array) → DESCENT_ENTERED/EXITED paired, LIFO stack ✓
- `fanOpen` → FAN_OUT_INLINE_EXPANDED/COLLAPSED under delegate_flow allowed_set ✓
- `findOpen`/`findScope` → find stratum allowed_set ✓
- `showSettings`/`showExport`/`showEndConfirm` → dialog allowed_sets ✓
- `ended` bool → SESSION_ENDED_ACK terminal ✓
- `frDone` → FIRST_RUN_COMPLETED terminal ✓
- `panes` array → PANE_CREATED allowed_set with pane-scoped catchall ✓
- `focused` → PANE_FOCUSED (with PANE_CLOSED forbidden_after) ✓
- `cols`/`rows`/`colW`/`rowW` → GUTTER_DRAG pairing_ordering ✓
- `ddFor`/`wsFor` → header_popover exclusive ✓
- `dropHint` → DROP_HINT_SHOWN → DROP_HINT_HIDDEN OR PANE_MOVED pairing_ordering ✓

Every runtime state slot has a Layer 5 rule (explicit or catchall).

---

## Ratification verdict

**Layer 4 ready pending T1 (cite drift for set_bundle line range).** T2/T3/T4 are consistency notes, not blockers.

**Layer 5 ready pending S4 (add window_session terminal) and S5 (tighten unreachable_tags claim).** S6/S7/S8 are consistency notes, not blockers.

Both layers verify against the design lock, substrate source, and v7's state class. Cadence coverage complete, terminal coverage complete, reveal stratum ratified per S3, P1 correctly applied at Layer 1/2/5 in one coherent fix. Counts arithmetic-check clean (30 and 36).

Once T1, S4, S5 apply, Layer 6 (Runtime/Operator — the shell reducer + Python bridge boundary named) can proceed under BOOTSTRAP.md Step 7.

---

## Cross-reference

- Layer 0 review: `REVIEW-2026-09-10-layer-0-substrate-shell-vocabulary.md`
- Layer 1 review: `REVIEW-2026-09-10-layer-1-substrate-shell-lexical.md`
- Layer 2+3 review: `REVIEW-2026-09-10-layer-2-3-substrate-shell-payload-and-sessions.md`
- Vocabulary source: `substrate-ui/signals/0.1.json` §`layer_4_temporal` (507-746) and §`layer_5_state_transitions` (747-1050).
- Substrate seam: `substrate/src/substrate/session_registry.py` (turn_sync 747-874, interrupt 912-970, typed exceptions 164-204, create 400-472, set_name 472-570, set_bundle 645-691, set_driver 694-732), `topologies/session/vocabulary.py` (ParkReason 46-53), `topologies/tool_loop/delegate.py` (max_depth 353).
- Design lock: `handoff_latest/prototypes/Substrate Prototype v7.dc.html` state class + handlers.
- Screenshots on disk: 21 Prototype v7 states + 27 sheet crops at `/private/tmp/claude-501/.../scratchpad/pw/`.
