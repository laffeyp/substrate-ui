# Drift-extension review — 2026-09-12

*Extends `REVIEW-2026-09-11-checkpoint-sprints-001-024.md`. Re-hunts the codebase for drift the standing review did not catch, in the twelve days of sprints 025–030 that landed after it. Rule: drift that a scheduled future sprint will inherently address is OK; drift with no scheduled fix is NOT OK and lands this pass.*

---

## What holds — the six standing findings from 2026-09-11 are closed

| Finding | Status | Where the fix lives |
|---|---|---|
| F-1 payload-check skips schema-less tags | closed | `tests/harness/payload-check.js:22-32` fails loud at module load if any Layer 1 tag has no Layer 2 schema |
| F-2 tonal-check selector too narrow | closed | `tests/harness/tonal-checks.js:39` widened to `.label, [data-tonal-label]` |
| F-3 double-emit `DELEGATE_DEPTH_CAP_REFUSED` | closed | `ShellReducer.ts:444-448` + `ShellReducer.ts:875-880` both dedupe via `refusedToolCallIds` |
| F-4 `TURN_SUBMIT_ERR` clobbers pane to PARKED on `session_ended` | closed | `ShellReducer.ts:933-934` routes to `PaneStatus.ENDED` for the SESSION_ENDED reason |
| F-5 inspector harness `Math.abs ≤ 1` tolerance | closed | `tests/harness/e2e_inspector.js:107-110` asserts exact equality after teardown close |
| F-6 `bridge-reasons.json` as second source | closed | Both `bridge/vocab.py:169-177` and `src/observability/reasons.ts:14` read the same JSON |
| halt: `SESSION_END_FAILED` | closed | typed proposal in `signals/0.1-rationale.md § v0.2 open proposals` (2026-09-11 entry) |
| halt: `SESSION_RESUME_FAILED` | closed | same rationale doc, same date |
| H18 recurrence on 018–024 | closed | seven cards flipped, seven paragraphs added, `KIT_DIARY.md` H19–H23 |

---

## What this pass found

**D1 — `TranscriptRow.park_reason` shadowed Layer 2's `ParkReason` enum.** `src/state/ShellState.ts:28` typed the field as `"final_answer" | "model_error" | "interrupt" | null` — a hand-written union of the three enum values `reasons.ts` already derives from `Tag.TRANSCRIPT_PARK_RENDERED.park_reason`. The H20 class exactly (Layer-N identifier in two places). Fixed same-turn: `park_reason?: ParkReason | null`, imported from `@/observability/reasons`.

**D2 — `FindBar` scope label shadowed the `FindScope` enum values.** `src/render/FindBar.tsx:41` computed `const scopeLabel = pane.find.scope === FindScope.STREAM ? "stream" : "transcript"`. The two raw strings on the display side and the two enum values on the compare side are the same characters — the FindScope enum values `{"transcript","stream"}` double as the display copy. Fixed same-turn: `const scopeLabel = pane.find.scope` reads the reducer state and displays it.

**D3 — anchor-testid format string duplicated across `Anchor.tsx` and `Pane.tsx`.** Layer 7 § pixel_anchor pins `anchor-pane-{pane_id}-<slot>` and `anchor-<slot>`. The literal template `` `anchor-pane-${paneId}-${slot}` `` lived on `Anchor.tsx:64` (mounting the canvas) and `Pane.tsx:331` (mounting the id). Two hand-maintained copies of the Layer 7 format. `App.tsx:399-404` further wrote `` `anchor-${AppSlot.X}` `` five times for the app-scoped anchors. Fixed same-turn: exported `paneAnchorId(paneId, slot)` and `appAnchorId(slot)` from `Anchor.tsx`; all six sites now call the helpers.

**D4 — bridge op names as hand-maintained shadow copies.** `bridge/vocab.py:136-154` defines the `BridgeOp` StrEnum with 15 members. `src/render/App.tsx` and `src/state/{Assays,RecentWorkspaces,Sessions}.ts` called `bridgeRequest("session_create", ...)` etc. with 11 raw op strings on the TS side. A rename on the Python side would fail live (bridge replies with `unknown_op`) but silently in the TS build — the H23 class extended to bridge ops. Fixed same-turn: added `bridge_ops` to `signals/bridge-reasons.json` as the single JSON source; created `src/observability/bridge-ops.ts` that reads the JSON, exports a typed `BridgeOp` const, and fails loud at load time if key count or key-value mapping drifts; added `_assert_bridge_ops_match_json()` in `bridge/vocab.py` that runs at import time and raises if `BridgeOp` members disagree with the JSON. Every `bridgeRequest` call site now uses `BridgeOp.X`; the sweep replaced 11 raw op strings across 4 files.

---

## What this pass did NOT fix — scheduled for a later sprint

**S1 — Harness bodies hand-copy Layer 1 tag names.** Every `tests/harness/e2e_*.js` filters emit arrays with raw string literals like `s.kind === "FIND_QUERY_CHANGED"`. The shared library (`tests/harness/lib/{harness,layer5,payload-check}.js`) reads Layer 1 from `signals/0.1.json`; the per-sprint bodies do not. A rename would fail loudly in the reducer's `Tag.OLD_NAME` compile step and again in the harness's assertion (0 emits found for the renamed tag), so it is not silent drift — but the harness bodies are hand-copied projections. Scope fits Epic P (harness maturity) — Sprint 047 (anchor audit) and Sprint 048 (tonal audit) are the two harness-maturity sprints on the plan. Neither card explicitly names this class; leaving it as an open watch item for either sprint's scope-negotiation is honest. No fix this pass.

**S2 — Sprint cards 031–048 are still Layer 2 shadows.** H23 already named the class; each future close will read Layer 2 as authoritative and land the emit shape from vocabulary rather than the card's F1 draft. This is what the H23 lesson prescribes — the close protocol handles it. No fix this pass.

**S3 — `bridge-reasons.json` § `substrate_envelope_kinds` is a Python-side mirror without a runtime equality check.** `bridge/main.py:47-48` imports substrate's `USER_MESSAGE` etc. directly; the JSON mirror serves the TS side but is not checked at Python import against substrate's own constants. A substrate rename could drift the JSON mirror silently. Small — the TS side would then still work against a renamed value while Python uses the substrate-imported one. Scope for a substrate-integration hygiene sprint, or as a load-time check to add alongside `_assert_bridge_ops_match_json`. Not fixed this pass; not scheduled explicitly.

**S4 — Sprint 048's tonal audit covers D45/D46/D32 but not D42 (label ellipsis chain), D66 (workspace picker walk), or the other design-lock D-decisions.** The card names three, the design lock names many more. Not drift per se — the tonal-checks apparatus covers a subset by design — but a full audit sprint could widen it. Scope for Sprint 048 or a widening pass.

---

## Verdict

Four live-code drift items landed this pass (D1–D4). Three items go on the watch list without a fix (S1, S3, S4); one class (S2) is already handled by the H23 discipline running at every close. Nothing surfaced that a scheduled sprint won't reach.

The bridge-ops closure (D4) is the largest addition: op names now live in one JSON, with a runtime membership check on both sides. That extends the single-source contract from tag names (Sprint 024's `tags.ts` codegen), anchor slots (Sprint 024's `anchors.ts` codegen), and bridge reasons (bridge-reasons.json existing entries) to bridge ops, closing the last hand-maintained side of the shell↔bridge boundary.

Regression: 33/33 PASS after the four fixes landed.
