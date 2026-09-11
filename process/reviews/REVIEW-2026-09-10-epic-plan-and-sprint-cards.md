# Epic Plan and sprint cards review — substrate-ui v0.1

*2026-09-10 · reviews `process/planning/EPIC-PLAN-v0.1-2026-09-10.md` (32 lines) + all 48 cards in `process/sprints_v0.1/`. Focus per the Architect's directive: WHAT each sprint does must be correct against the design lock and the ratified vocabulary at `signals/0.1.json` v0.1; HOW and low-level impl is not the concern.*

---

## Method

Grounding carries from the layer reviews (Layer 0–10) already on file. Walk pattern:

1. **Epic Plan shape.** Fifteen epics + one harness-maturity epic against the fourteen strata in `signals/0.1.json § layer_3_sessions`. Verify epic-to-strata mapping and epic ordering.
2. **Sprint scope walk.** For each of the 48 cards, extract the `## scope` paragraph and the emitted tag list. Score three things: does the WHAT match the design lock (Prototype v7 + DESIGN-DECISIONS D1–D72 + FUNCTIONALITY.md + PANE-MECHANICS.md); does every emitted tag exist in `signals/0.1.json § layer_1_lexical` v0.1; does every substrate call cite the real `session_registry.py` method.
3. **Cross-layer drift check.** Every sprint's Emits list against Layer 1's 108 tag names. Every sprint's payload assertions against Layer 2's schemas.
4. **Ordering check.** Are prerequisites correct? Do stratum openings come before stratum contents?
5. **Tonal rule check.** The Architect flagged this specifically. Is Sprint 048 the right shape for these rules?

---

## Epic Plan shape — correct

Sixteen epics mapped to the fourteen Layer-3 strata plus one harness-maturity epic at the end. Every stratum is covered. Build order is defensible: boot → pane grid → substrate binding → turn flow → reveal → delegate → surfaces → find → header → bundles → session end → first-run → dialogs → collections → menu bar → harness maturity. Every epic's terminal sprint unblocks the next epic's first sprint.

The 48-sprint count is one card per concept. Cards inherit sprint 001's shape verbatim, and the anchor testid naming convention (`anchor-pane-<pane_id>-<slot>` for per-pane; `anchor-<slot>` for app-scoped) matches Layer 7's pixel-anchor table. Sprint sequence is strictly linear on prerequisites — every card's `prerequisites:` line names the exact prior sprint(s). No parallel sprints. The plan's discipline is right.

One design-lock question raised below (§D1) about the header shipping in sprint 030 while pane surfaces from sprint 002 onward render without one.

---

## Vocabulary drift — the load-bearing finding

**Many sprint cards emit tag names that do not exist in `signals/0.1.json § layer_1_lexical` v0.1.** Hard rule 2 ("Vocabulary is the contract; workers cannot invent tags") is being violated across roughly a dozen cards. Either Layer 1 v0.1 grows to admit these tags, or the cards rewrite against the tag names Layer 1 has ratified. Neither is a big lift; the drift needs to close before any card dispatches.

The exact drift, sprint by sprint:

| Sprint | Emits in the card | Layer 1 v0.1 has | Verdict |
|---|---|---|---|
| 004 | `PANE_DRAG_STARTED` | none — Layer 1 has DROP_HINT_* and GUTTER_DRAG_STARTED/STOPPED | invented tag |
| 006 | `WORKSPACE_PICKER_OPENED`, `WORKSPACE_PICKER_COMMITTED` | only `WORKSPACE_PICKER_WALKED` | two invented tags |
| 007 | `SESSION_CREATE_REQUESTED` payload `{request_id, pane_id, workspace, workspace_shape, driver}` | Layer 2 requires `{request_id, pane_id, session_id, name, driver, workspace_path, workspace_shape, bundle, seed}` | payload drift + field name `workspace` vs `workspace_path` |
| 010 | `SESSION_END_FAILED` | only `SESSION_ENDED_ACK` exists; no _FAILED counterpart declared | Layer 1 lacks the incident tag |
| 017 | `LENS_CHANGED` | `LENS_SWITCHED` | name drift |
| 018 | `LENS_LEVEL_CHANGED`, `LENS_DIR_CHANGED` | `STREAM_LEVEL_TOGGLED`, `STREAM_DIR_TOGGLED` | two name drifts |
| 021 | `DELEGATE_EXPANDED` | `DELEGATE_INLINE_EXPANDED` (and its `_COLLAPSED` sibling) | name drift |
| 027 | `STUDIO_TRIGGER_EDITED`, `STUDIO_VIEW_EDITED`, `STUDIO_ROUTE_EDITED`, `STUDIO_TERMINATION_EDITED` | `STUDIO_VIEW_TOGGLED`, `STUDIO_VALIDATE_REQUESTED/VALIDATED/VALIDATE_FAILED`, `STUDIO_BUILD_REQUESTED/BUILT/BUILD_REJECTED` (eight ratified per Layer 1 audit) | four invented tags; the four ratified tags don't appear in the card |
| 029 | `FIND_MATCH_STEPPED` | `FIND_OPENED/CLOSED/SCOPE_CHANGED/QUERY_CHANGED` | invented tag (the four ratified cover step-count via QUERY_CHANGED.count) |
| 030 | `PANE_HEADER_MOUNTED` | none | invented tag |
| 031 | `DRIVER_CHANGE_ACKED` | `DRIVER_CHANGED` | name drift (`_ACKED` vs no suffix) |
| 032 | `WORKSPACE_CHIP_OPENED`, `WORKSPACE_CHIP_CLOSED` | `WORKSPACE_POPOVER_OPENED`, `WORKSPACE_POPOVER_CLOSED` | two name drifts (Chip vs Popover) |
| 033 | `HEADER_POPOVER_OPENED`, `HEADER_POPOVER_CLOSED` | none — Layer 1 has per-kind `DRIVER_DROPDOWN_*` and `WORKSPACE_POPOVER_*`; no generic `HEADER_POPOVER_*` | two invented stratum-level tags |
| 034 | `BUNDLE_ATTACH_ACKED` | `BUNDLE_ATTACHED` | name drift |
| 035 | `TOOLS_RESTRICT_REQUESTED`, `TOOLS_RESTRICT_ACKED`, `TOOLS_RESTRICT_FAILED` | `TOOLS_RESTRICTED` (single tag) | three invented tags; the ratified pattern is one bridge_reply, no REQUESTED/ACKED/FAILED trio |
| 037 | `INTERRUPT_ACKED`, `INTERRUPT_FAILED` | `INTERRUPTED` (no _FAILED) | name drift + invented incident tag |
| 038 | `PROBE_DRIVER_REQUESTED` (in first-run enumeration) | Layer 1 has it | ✓ |
| 041 | `EXPORT_DIALOG_COMMITTED` | `EXPORT_COMMITTED` | name drift |
| 042 | `SESSION_RENAME_OPENED`, `SESSION_RENAME_COMMITTED`, `SESSION_RENAME_CLOSED` | `SESSION_RENAME_REQUESTED`, `SESSION_RENAMED`, `SESSION_RENAME_FAILED` (three bridge tags; no dialog tags) | three invented dialog tags — the bridge chain is ratified, the dialog chain is not |
| 044 | `COLLECTION_RESTORED` payload `{collection_name, pane_count, session_count, restored_session_count, missing_session_count}` | Layer 2 requires `{window_count, pane_count, bound_session_count}` | payload drift; also `collection_name` is new |
| 045 | `MENU_ITEM_ACTIVATED` | none | invented tag |
| 046 | `KEYBINDING_FIRED` | none | invented tag |

Roughly 30 tag names in the cards do not match Layer 1 v0.1. Most are consistent patterns (`_ACKED` suffix; `_OPENED/COMMITTED/CLOSED` dialog trios; `MENU_ITEM_ACTIVATED`/`KEYBINDING_FIRED` for the input layer) that suggest the sprint author had a mental model of the tag surface that Layer 1's actual ratification didn't match. Two clean paths:

- **Grow Layer 1 v0.1 to v0.2** (adds the ~15 missing tags: session-rename dialog trio, tools-restrict trio, interrupt _FAILED, menu/keybinding pair, header-popover stratum-level pair, workspace-picker open/committed pair, pane-drag-started, studio-edited quad, find-match-stepped, pane-header-mounted, session-end-failed). This grows the vocabulary before it locks.
- **Rewrite the cards** against the Layer 1 v0.1 tags. Fewer new tags; each dialog uses the already-ratified pattern (SETTINGS_OPENED/CLOSED + SETTING_CHANGED; EXPORT_DIALOG_OPENED/CLOSED + EXPORT_COMMITTED).

The Architect calls which path. Either resolves the drift; leaving it means sprint dispatch runs against invented vocabulary.

---

## Sprint 010 — real scope error

**Location.** `sprint-010-session-end.md` scope: "End session (menu Session ▸ End Session, or slash-router `/end`). Wraps `SessionRegistry.delete(...)` via bridge."

**Reality.** Two different substrate verbs, conflated:

- **End the session** = fire a SessionEnded envelope on the record via `turn_sync` with `END_ON_EXIT_SENTINEL`. The record finalises; the manifest status flips to `ended`. This is what D68 corollary b names ("interrupt-first on live turns, then SessionEnded"). Bridge tag pair: `SESSION_END_REQUESTED` → `SESSION_ENDED_ACK`.
- **Delete the session** = `SessionRegistry.delete(session_id)` at `session_registry.py:993`. Removes the manifest and the by-name index entry; leaves the record on disk. Different verb; different meaning. Layer 1 has no `SESSION_DELETE_*` tags (Layer 2/3 review §gap #5 documented delete as "deferred to v0.2 when a records-surface trash affordance materializes").

**Fix.** Sprint 010 should wrap `turn_sync(END_ON_EXIT_SENTINEL)` via bridge (which is exactly what session_registry.py + vocabulary.py's `END_ON_EXIT_SENTINEL` at :69 supports). The scope reference to `SessionRegistry.delete(...)` is wrong. Delete stays deferred.

---

## Sprint 007 — payload drift

**Location.** `sprint-007-session-create.md` emits `SESSION_CREATE_REQUESTED` with `{request_id, pane_id, workspace, workspace_shape, driver}`.

**Layer 2 schema.** `SESSION_CREATE_REQUESTED` requires nine fields: `{request_id, pane_id, session_id, name, driver, workspace_path, workspace_shape, bundle, seed}`.

**Effect.** Missing fields: `session_id` (shell mints it before the ask per Layer 0 review), `name`, `bundle`, `seed`. Field name drift: `workspace` in the card vs `workspace_path` in the schema. The card as written won't validate against Layer 2's payload schema; the grader flags it.

**Fix.** Update the sprint's Emits payload to match the Layer 2 schema. `seed` per Layer 7 must be empty string per substrate's deprecation (`session_registry.py:421-431`).

---

## Sprint 044 — payload drift

**Location.** `sprint-044-collection-restore.md` emits `COLLECTION_RESTORED` with `{collection_name, pane_count, session_count, restored_session_count, missing_session_count}`.

**Layer 2 schema.** `COLLECTION_RESTORED` requires `{window_count, pane_count, bound_session_count}`.

**Effect.** Field name drift on three of five fields; two extra fields not in the schema.

**Fix.** Either update the sprint or grow the Layer 2 schema. If the extra fields (`restored_session_count`, `missing_session_count`) are useful, add them to Layer 2 as optional; otherwise trim.

---

## Design-lock question (D1) — header ordering

Sprint 002 opens pane rendering with "No split, no header controls, no transcript — just the pane frame, the two anchors, and the state class that will grow." Sprint 030 mounts the PaneHeader.

D42 reads: "Every pane header is the same complete header — one pane or eight, no main header, no asymmetry." The design says every pane always has a full header. Sprints 002 through 029 render 28 sprints' worth of pane surfaces (splits, prompt, transcript, reveal, lenses, delegate, records, assay, studio, find) against panes with no header, then Sprint 030 mounts the header on top. Every earlier sprint's E2E grades a headerless pane; the ratified-headered pane arrives at 030.

Two paths, both consistent with the design:

- **Land the header earlier.** Sprint 002 mounts the pane frame WITH its identical full header (empty chip content until Sprints 031-032 fill DriverChip and WorkspaceChip). Every later sprint grades against the correct pane frame.
- **Ratify header-comes-late as a build-phase concession** in a BLACKBOARD Decision. D42 is a render-time invariant of the shipped app; if the build order runs 28 headerless sprints before the header mounts, the intermediate state is not the design lock — it's the build. Document that.

Architect's call. If the second path is chosen, Sprint 002's scope reads more honestly as "one pane frame, no header YET — header mounts at Sprint 030."

---

## Build-order note — header_popover mutex

Sprint 033 "codifies header_popover as a stratum with kind ∈ {driver, workspace, bundle, tools, name}. At most one open per pane." But Sprint 031 opens the driver popover, and Sprint 032 opens the workspace popover, both before Sprint 033 codifies the mutex.

Effect: Sprints 031 and 032 ship one-at-a-time-per-pane popovers ad-hoc, then Sprint 033 refactors them under the stratum. Not a bug — a "build then codify" pattern that adds a small refactor between 032 and 033. Cleaner would be: land the mutex framework in Sprint 030 (as part of the header shell), then chips ship into it.

Not blocking. Note only.

---

## Sprint 014 — small stratum note

Sprint 014 transcript-render: "RecordSubscriber operator batches by rAF (Layer 4 cadence)."

Layer 4's cadence entry for `TRANSCRIPT_ROW_RENDERED` reads: "event-cadence — 1:1 with envelope arrivals from the substrate record tail (recategorized from ambient to event at REVIEW-2026-09-10 Layer 1)."

Event-cadence (one emit per envelope) is not rAF-cadence (one batch per animation frame). If sprint 014 batches K envelopes into one rAF paint but fires K TRANSCRIPT_ROW_RENDERED signals (one per envelope), that's event-cadence with rAF paint batching — fine. If sprint 014 fires one TRANSCRIPT_ROW_RENDERED per rAF regardless of K, that's sample-cadence and contradicts Layer 4.

The card's phrasing ("batches by rAF") is ambiguous. Clarify: paint batches by rAF; TAG fires per envelope.

---

## Tonal rules — the Architect's specific question

Sprint 048 enforces three tonal rules:

1. **No cost / money display anywhere.** Layer 7 tonal constraint cites D45, D46, WINDOW-STRIP-EXPLORATION §7. The design decision is explicit: "no cost display anywhere, ever." Purpose is the rejection of the tech-bro "context-cost meter" pattern the shell was written to differ from. Load-bearing.
2. **No emoji in shell-generated strings.** Layer 7 cites D45 and WORKING_AGREEMENT tone canon. Consistent with the calm-terminal aesthetic D2 establishes. Load-bearing.
3. **Labels never wrap** (shrink → ellipsize → tooltip). Layer 7 cites D32 and FUNCTIONALITY row 34. D42's identical-header-per-pane invariant only holds if labels shrink cleanly instead of wrapping. Load-bearing.

The three rules are ratified design decisions. Dropping any of them contradicts a D-number. **The rules themselves are necessary.**

The question is enforcement shape. Sprint 048 as written is one batch sprint at the end of the chain that runs an `e2e_tonal_rules.js` with three assertions:

- **Batch-at-end problem:** 47 sprints of tonal drift can accumulate before Sprint 048 catches any of it. When the check fires, the reviewer has to unpick which sprint introduced which violation. Regression attribution collapses.
- **Cleaner shape:** the three tonal checks become standing assertions in the shared harness (`tests/harness/e2e_shell.js` or a helper `tests/harness/tonal-checks.js`) that run on every sprint's observation contract from Sprint 001 onward. A sprint that adds a currency glyph or an emoji or a wrapping label fails the sprint that introduced it, not Sprint 048.

Under the cleaner shape, Sprint 048 becomes an audit sprint: grep the harness's history to prove the three assertions have never been silently disabled or skipped. Same file count, same three assertions, different fire timing.

**Recommendation.** Keep the three rules (necessary per design). Reshape Sprint 048 into a standing shared-harness assertion + a final-sprint audit rather than a one-shot end-of-chain check. Or, if the batch shape is deliberate ("run the check once at the end because most sprints don't touch user-facing strings"), name the deliberate choice in Sprint 048's scope so the accumulation risk is on the record.

---

## Ratification verdict

**Epic Plan ready.** Sixteen epics, 48 sprints, clean prerequisite chain, correct strata mapping.

**Sprint cards ready pending the drift fixes.** The load-bearing finding is vocabulary drift: about 30 tag names across roughly a dozen cards do not match Layer 1 v0.1. Close either by growing Layer 1 to v0.2 (adds ~15 tags for dialog trios, tools-restrict trio, menu/keybinding pair, header_popover generic pair, session-end-failed, pane-header-mounted, studio-edited quad, find-match-stepped, pane-drag-started, workspace-picker OPENED/COMMITTED) or by rewriting the cards against v0.1.

**Sprint 010 scope error.** Change "SessionRegistry.delete" to "SessionRegistry.turn_sync with END_ON_EXIT_SENTINEL." Delete stays deferred per Layer 2/3 review §gap #5.

**Sprint 007 payload drift.** Nine required fields in Layer 2; card has five. Update the card's Emits payload to match Layer 2 (or update Layer 2 to trim the required set — but session_id / name / bundle / seed are all substrate-side required kwargs).

**Sprint 044 payload drift.** Layer 2 says `{window_count, pane_count, bound_session_count}`; card says five different fields. Reconcile.

**Design-lock question D1** on header ordering: either mount the header at Sprint 002 (matching D42) or ratify header-comes-late as a build-phase concession in BLACKBOARD.

**Build-order note** on Sprint 033 mutex codified after 031/032 use it. Refactor cost is small; note only.

**Tonal rules ARE necessary** per D45/D46/D32. Sprint 048's shape is the question — batch-at-end accumulates drift; standing-harness-assertion catches it at the sprint that introduces it. Architect's call.

Once vocabulary drift closes, Sprint 010's scope corrects, Sprints 007 and 044 realign to Layer 2, the header ordering is ratified either way, and Sprint 048's enforcement shape is decided, all 48 cards are ready to dispatch under the SDD loop.

---

## Cross-reference

- Epic Plan: `substrate-ui/process/planning/EPIC-PLAN-v0.1-2026-09-10.md`
- Sprint cards: `substrate-ui/process/sprints_v0.1/sprint-001` through `sprint-048.md`
- Ratified vocabulary: `substrate-ui/signals/0.1.json` v0.1 (108 tags in Layer 1; 14 substrate reference entities; 14 strata; 16 pixel anchors)
- Layer reviews on file:
  - `REVIEW-2026-09-10-layer-0-substrate-shell-vocabulary.md`
  - `REVIEW-2026-09-10-layer-1-substrate-shell-lexical.md`
  - `REVIEW-2026-09-10-layer-2-3-substrate-shell-payload-and-sessions.md`
  - `REVIEW-2026-09-10-layer-4-5-substrate-shell-temporal-and-state.md`
  - `REVIEW-2026-09-10-layer-6-through-10-substrate-shell-operators-through-grammar.md`
- Design lock: `handoff_latest/prototypes/Substrate Prototype v7.dc.html`, `handoff_latest/docs/DESIGN-DECISIONS -through 2026-09-01-.md`, `handoff_latest/docs/FUNCTIONALITY -2026-09-01-.md`, `handoff_latest/docs/PANE-MECHANICS -2026-09-01-.md`.
- Substrate seam: `substrate/src/substrate/session_registry.py`, `topologies/session/vocabulary.py`, `topologies/tool_loop/delegate.py`.
