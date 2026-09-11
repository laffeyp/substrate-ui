# Layer 6 through Layer 10 review — substrate-shell operators, evidence, report binding, version, grammar growth

*2026-09-10 · reviews the remaining layers of `substrate-ui/signals/0.1.json`: §`layer_6_operators` (lines 1122-1280), §`layer_7_evidence` (1281-1428), §`step_9_dual_contract_audit` (1429-1439), §`layer_8_report_binding` (1441-1451), §`layer_9_version` (1453-1461), §`layer_10_grammar_growth` (1463-1473). Layers 6–7 name the runtime operators and the evidence constraints per Layer 7; Layer 8 binds the tag set to the Signal Report template; Layers 9–10 carry version metadata and grammar-growth overrides. No design change is proposed.*

---

## Method

Same reproducible shape as the four prior reviews.

1. **Read the draft.** Layers 6, 7, step_9_dual_contract_audit, 8, 9, 10 in order.
2. **Verify counts.** 17 operators; 15 evidence constraints; 16 pixel anchors; 108 behavior tags in the dual-contract audit; 95 event tags in OBSERVED binding.
3. **Verify substrate line citations.** `session_registry.py` methods (`:96-149` SessionManifest, `:281` turn_queue_cap, `:400` create, `:472` set_name, `:645` set_bundle, `:693` set_driver, `:747` turn_sync, `:779` factory-missing RuntimeError, `:912` interrupt, `:993` delete); `topologies/session/vocabulary.py:73-100` (session kinds); `topologies/tool_loop/delegate.py:353` (max_depth), `:436` (refusal), `:59` (SESSION_ENDED_MID_DELEGATE).
4. **Verify every Layer 1 tag has an emitting operator.** BOOTSTRAP §Step 7 halt.
5. **Verify every incident-stratum tag carries a diagnostic-required Evidence.** BOOTSTRAP §Step 8 halt.
6. **Verify every load-bearing shell state has a pixel-anchor testid.** Architect 2026-09-08 non-negotiable.
7. **Verify the dual-contract audit's 108 = 87 anchor-paired + 21 DOM-paired + 0 unpaired arithmetic.**
8. **Cross-check the grammar-growth overrides against the ratified project rules.**

---

## Layer 6 — Operators

### Count arithmetic

17 operators. By boundary: 5 renderer + 1 renderer(preload) + 3 main + 5 bridge + 3 substrate = 17 ✓. Substrate operators are read-only reference (grader reads their emissions off the record; they are not shell-owned).

### Boundary correctness

Four boundaries declared (renderer, main, bridge, substrate). Every operator lives in exactly one. Renderer has ShellReducer, Emitter, AnchorPainter, RecordSubscriber, BridgeClient — the five surfaces the JS event loop owns. Main has BridgeSupervisor, IPCRouter, HarnessLogWriter — the three surfaces Node owns. Bridge has HelloEmitter, DispatchLoop, RegistryProxy, DriverResolver, ManifestWatcher — the five surfaces the Python subprocess owns. Substrate reference has SessionRegistry, SessionTopology, DelegateTool — grader-side reads only.

### Substrate citations verified

- `RegistryProxy` cites `session_registry.py:779` (RuntimeError if factory missing) ✓ — matches the `raise RuntimeError(...)` at that line.
- `RegistryProxy` cites `session_registry.py:281` (turn_queue_cap=4) ✓.
- `SessionRegistry` reference cites nine line ranges for the methods the shell touches; every one matches the file.
- `SessionTopology` reference cites `vocabulary.py:73-100` (ten session kinds); matches.
- `DelegateTool` reference cites `delegate.py:353` (max_depth), `:436` (refusal), `:59` (SESSION_ENDED_MID_DELEGATE). The refusal is actually at line 437-439 (`raise ValueError(f"delegate: max delegation depth ({max_depth}) reached — solve it directly")`); the line-436 check (`if depth >= max_depth:`) is the guard. Small line-number drift, not a factual gap.

### Emitter coverage of the 108 tags

`halts_check.tags_with_no_emitting_operator` claim: every tag has an emitter. Walking the operator emits lists forward against Layer 1's 108:

- **ShellReducer:** the user-gesture tag families (PANE_*, PROMPT_*, SLASH_*, WORKSPACE_PICKER_WALKED, REVEAL_*, LENS_*, STREAM_*, INSPECTOR_*, SURFACE_*, STUDIO_*, FIND_*, SETTINGS_*, SETTING_CHANGED, EXPORT_*, END_CONFIRM_*, FIRST_RUN_*, DELEGATE_INLINE_*, FAN_OUT_INLINE_*, DESCENT_*, DROP_HINT_*, GUTTER_DRAG_*, WINDOW_OPENED / _CLOSED, COLLECTION_OPENED, *_REQUESTED). ✓
- **Emitter:** funnel, not source ✓.
- **AnchorPainter:** ANCHOR_PAINTED, HARNESS_HEARTBEAT ✓.
- **RecordSubscriber:** the transcript-render tags (TRANSCRIPT_ROW_RENDERED, TRANSCRIPT_DELEGATE_LINE_RENDERED, TRANSCRIPT_FANOUT_LINE_RENDERED, TRANSCRIPT_PARK_RENDERED, TRANSCRIPT_SESSION_ENDED_RENDERED, TRANSCRIPT_RATE_LIMITED_RENDERED, TRANSCRIPT_COMPACTED_RENDERED, TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED, DELEGATE_CALL_RENDERED, DELEGATE_CALL_FOLDED, DELEGATE_DEPTH_CAP_REFUSED).
- **BridgeClient:** BRIDGE_HELLO_RECEIVED, BRIDGE_DEAD_SURFACED, plus the eleven bridge_reply tags.
- **BridgeSupervisor:** BRIDGE_DEAD_SURFACED (via IPC).
- **DriverResolver:** PROBE_DRIVER_PROBED / _FAILED (via reply through DispatchLoop).

Coverage holds. Four small notes:

### Finding O1 — COLLECTION_PERSISTED and COLLECTION_RESTORED lack a named emitter

**Location.** `layer_6_operators.operators[]`. Every operator's emits list omits COLLECTION_PERSISTED and COLLECTION_RESTORED.

**Reality.** COLLECTION_PERSISTED is the throttled 5s snapshot write to SQLite (Layer 4 cadence entry). COLLECTION_RESTORED is the boot-time rehydration. Both are shell-side; both belong to some operator. ShellReducer is the natural home for both — the reducer commits the persist and reads back the restored state.

**Fix.** Add COLLECTION_PERSISTED and COLLECTION_RESTORED to `ShellReducer.emits`. Alternative: name a `CollectionPersister` operator (renderer or main boundary depending on where the SQLite handle lives).

### Finding O2 — TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED misassigned

**Location.** `RecordSubscriber.emits` includes TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED.

**Reality.** Layer 2's payload schema note for this tag reads: "Not a Park envelope render — a shell-emitted transcript row shown after PANE_UNBOUND_BOUND and before the first PROMPT_SUBMITTED." Layer 5's pairing_ordering wires it as `PANE_UNBOUND_BOUND → TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED`. It fires from the shell reducer at bind time, not from a substrate envelope arriving on the record. RecordSubscriber only reads envelopes; it shouldn't emit shell-owned pseudo-Park lines.

**Fix.** Move TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED from `RecordSubscriber.emits` into `ShellReducer.emits`. Consistent with Layer 2 P1 fix.

### Finding O3 — BRIDGE_DEAD_SURFACED double-listed

**Location.** Both BridgeSupervisor and BridgeClient carry BRIDGE_DEAD_SURFACED in their emits lists.

**Reality.** BridgeSupervisor detects the second crash (main-process); it dispatches an IPC message; the renderer receives it and BridgeClient forwards it into ShellReducer, which calls Emitter, which writes one JSONL line. The tag lands once; two operators list it because they participate in the pathway.

**Fix.** Convention: one operator is the "source" (the one that first emits it), others are observers. Pick BridgeSupervisor as the source (it detects the fact) and note BridgeClient as the observer (it forwards to Emitter). Same shape applies to O4 below.

### Finding O4 — PROBE_DRIVER_PROBED / _FAILED double-listed

**Location.** DriverResolver and BridgeClient both list PROBE_DRIVER_PROBED / _FAILED.

**Reality.** DriverResolver runs the probe (bridge-side); DispatchLoop wraps the result in a reply; BridgeClient (renderer-side) receives the reply and calls Emitter. Same two-hop pattern as O3.

**Fix.** Same convention: name DriverResolver as source, BridgeClient as observer.

### Layer 6 verdict

17 operators cover 108 tags with correct boundary assignments. O1 (COLLECTION_* missing), O2 (TRANSCRIPT_AWAITING_ misassigned) are real assignments to fix. O3/O4 (double-listings) are cosmetic. One line-number drift on the delegate refusal cite (:436 vs :437). Otherwise ready.

---

## Layer 7 — Evidence

### Count arithmetic

15 constraints, 16 pixel anchors. By kind: 8 cross_reference + 3 tonal + 3 numeric_range + 1 pixel_anchor (with a table of 16 anchors) = 15 ✓.

### Foreign-key resolution

`cross_reference` on every `_id` field ties to a live Layer 0 entity or a live Layer 3 stratum instance. Grader post-processing the JSONL flags orphan ids. ✓

### Substrate wire kind reference

`envelope_kind` on TRANSCRIPT_ROW_RENDERED / STREAM_ROW_CLICKED cross-references bridge.log for the same session_id + seq to match the kind string. Handles the open-string decision from Layer 2 correctly — grader validates against the bridge log rather than a closed schema enum.

### Seed deprecation applied

`SESSION_CREATE_REQUESTED.seed` MUST equal empty string per `session_registry.py:421-431`. Schema addendum names the fix: `properties.seed = {type: string, const: ""}`. Correct application of the Layer 2/3 seed deprecation note.

### SETTING_CHANGED oneOf applied

The Draft-07 `oneOf` schema per key value lands here as a schema addendum. The Layer 2 payload schema for SETTING_CHANGED carries a `layer_7_constraint` field naming this; Layer 7 lands the concrete oneOf. Chain is clean.

### driver_params secret-stripping applied

Emitter strips any key at any depth whose name matches `/key|token|secret|password/i` — replaces value with `"[redacted]"` before write. Ollama's four documented params (think, max_tokens, num_ctx, timeout) never match; API-key-carrying param names always match. Runtime discipline; the emit-site test is prescribed. Correct application of Layer 2/3 P2.

### Tonal constraints

Three tonal rules, all with cited targets and enforceability. No cost/money display (D45/D46 + WINDOW-STRIP-EXPLORATION §7). No emoji in shell-generated strings (D45 + WORKING_AGREEMENT). Labels never wrap (D32 + FUNCTIONALITY row 34). Enforceability split correctly between mechanical (grep/regex/DOM assertion) and llm_check (prose tone).

### Numeric ranges

- delegate depth [1,2] per D41 + delegate.py:353 ✓
- turn queue depth ≤ 4 per session_registry.py:281 ✓
- pane grid ≤ 8 per window per D35 ✓

Every bound cites a real substrate constant or design decision.

### Incident diagnostic coverage (BOOTSTRAP §Step 8 halt)

Ten incident-stratum tags. Every one carries a required diagnostic field per Layer 2's schemas:

| Incident | Diagnostic field |
|---|---|
| STUDIO_VALIDATE_FAILED | `errors` (array, minItems 1) |
| STUDIO_BUILD_REJECTED | `errors` (array, minItems 1) |
| SESSION_CREATE_FAILED | `reason` (string) |
| SESSION_RENAME_FAILED | `reason` + `existing_session_id` |
| TURN_SUBMIT_FAILED | `reason` (enumerated: 5 values) |
| DRIVER_CHANGE_FAILED | `reason` |
| BUNDLE_ATTACH_FAILED | `reason` |
| PROBE_DRIVER_FAILED | `reason` |
| BRIDGE_DEAD_SURFACED | `crash_count` (minimum 2) |
| DELEGATE_DEPTH_CAP_REFUSED | `depth` (const 2) |

All ten. Halt correctly disposed.

### Pixel anchor coverage (Architect non-negotiable)

16 anchors. Per-pane anchors template `{pane_id}` — the harness discovers pane_ids via DOM query on `[data-testid^="anchor-pane-"]`. The eleven per-pane anchor kinds cover focus, status, reveal, lens, level, dir, descent, surface, find, inspect, header-popover. Five global anchors cover dialog, window-strip, bridge, last-tag, heartbeat.

**Cross-check against v7's state slots.** Every ShellState slot the Layer 4/5 review enumerated has a pixel anchor:

- `revealed` → anchor-pane-{pane_id}-reveal ✓
- `mode` → anchor-pane-{pane_id}-lens ✓
- `level` (all/app) → anchor-pane-{pane_id}-level ✓
- `dir` (down/side) → anchor-pane-{pane_id}-dir ✓
- `sel` (selected seq) → anchor-pane-{pane_id}-inspect ✓ (low-byte of seq; byte 0 when closed)
- `descent` → anchor-pane-{pane_id}-descent ✓ (0/1/2)
- `surface` → anchor-pane-{pane_id}-surface ✓ (0/1/2/3)
- `findOpen`/`findScope` → anchor-pane-{pane_id}-find ✓ (0/128/255)
- `showSettings`/`showExport`/`showEndConfirm`/`frDone` → anchor-dialog ✓ (0/64/128/192/255)
- `ended` → covered by anchor-pane-{pane_id}-status (255 = ended) ✓
- `ddFor`/`wsFor` → anchor-pane-{pane_id}-header-popover ✓ (0/128/255)
- `panes.length` → anchor-window-strip ✓ (0 single / 255 multi)
- bridge state → anchor-bridge ✓
- last emitted tag → anchor-last-tag ✓ (FNV-1a low byte)

**Small note E1.** Per-pane anchor testid template `anchor-pane-{pane_id}-*` requires the harness to know pane_ids. Documented via "DOM query on `[data-testid^="anchor-pane-"]`" (implicit in the layer 6 AnchorPainter operator; not explicit in the anchor table's note). Small: add one line to the pixel_anchor entry naming the discovery pattern.

**Small note E2.** No anchor for delegate_flow or bridge_request stratum instance state. Multiple concurrent bridge_requests (create + set_driver + turn_submit racing on different session_ids) can't be told apart in the anchor set. Grader falls back to the JSONL trace and bridge.log for these — not a bug, but a note that anchor coverage stops at pane-scoped and dialog-scoped state.

**Small note E3.** COLLECTION_PERSISTED has no anchor (documented in step_9 as "invisible by design per D68 — persistence is invisible; grader reads the SQLite file post-hoc"). Correct.

### PANE_MOVED zone consistency

`cross_reference` PANE_MOVED.zone matches the last DROP_HINT_ZONE_CHANGED.to_zone for the same source_pane_id → target_pane_id pair. Grader arithmetic over trace pairs. ✓ — cite PANE-MECHANICS §Drop zones.

### workspace_path canonicalization

Runtime discipline (Sprint 011): `Path(x).expanduser().resolve(strict=False)`. Mechanical regex on the field (no tilde, no `..`, no double-slash). ✓ — addresses the Layer 4/5 REVIEW-2026-09-08 note.

### Halts_check

- **incident_without_diagnostic:** none — every incident has a required reason/errors field. ✓
- **tonal_rule_unbound:** none — every tonal rule names its target set. ✓
- **cross_reference_unresolved:** none — every foreign-key constraint names its Layer 0 entity or Layer 3 stratum. ✓
- **load_bearing_state_without_anchor:** none — every ShellState slot has a pixel-anchor testid. ✓

All four disposed correctly.

### Layer 7 verdict

15 constraints + 16 anchors cover the full evidence surface. E1 (per-pane discovery) and E2 (delegate_flow / bridge_request stratum instance not anchored) are documentation refinements. E3 (COLLECTION_PERSISTED file evidence) is correctly noted as accepted. Every incident carries a diagnostic. Every load-bearing state has an anchor. Every tonal rule cites its D-number. driver_params secret-stripping, SETTING_CHANGED oneOf, and seed deprecation all applied per Layer 2/3 review findings.

---

## step_9 — Dual-contract audit

### Count arithmetic

108 behavior tags = 87 pixel_anchor-paired + 21 DOM element-paired + 0 unpaired ✓.

### Gap surfaced

One: COLLECTION_PERSISTED. Written to SQLite at `~/Library/Application Support/substrate-ui/state.sqlite`. No visual witness (persistence is invisible by design per D68). Grader reads the file post-hoc. Disposition: accepted as file-evidence only.

`audit_complete: true`.

### Audit verdict

Clean. Zero unpaired behavior tags. Every one has either a pixel-anchor pair or a DOM-element pair; the one exception (COLLECTION_PERSISTED) is design-invisible and covered by file evidence.

---

## Layer 8 — Report binding

### Section coverage

- **OBSERVED** = 95 event-stratum shell tags. Check: 108 total − 10 incident − 2 ambient − 1 summary = 95 ✓.
- **EXPECTED** = the sprint card's `## signal contract → Emits` list per SPRINT_CARD.md.
- **RENDERED** = 16 pixel-anchor testids + DOM element assertions (Playwright).
- **NOTES** = 10 incident-stratum tags with diagnostic reason strings.
- **AMBIENT** = TRANSCRIPT_ROW_RENDERED + ANCHOR_PAINTED + HARNESS_HEARTBEAT. Note: TRANSCRIPT_ROW_RENDERED was recategorized from ambient to event at the Layer 1 review (Foundation 01 stratum question). The AMBIENT binding still lists it as a cadence-verified emission — that's a reporting bucket (things graded by cadence), not a stratum reassignment. Slight naming tension but not a drift.
- **GRAMMAR_DRIFT** = eight NEW_TAG_PROPOSED / PAYLOAD_FIELD_PROPOSED / SEQUENCE_RULE_PROPOSED / INVARIANT_PROPOSED / TAG_SPLIT_PROPOSED / TAG_MERGE_PROPOSED / TAG_DEPRECATION_PROPOSED / ENTITY_MERGE_PROPOSED entry kinds.

### Layer 8 verdict

Bindings match the tag classifications from Layer 1 (updated to 108). One naming tension: AMBIENT bucket carries TRANSCRIPT_ROW_RENDERED which is now event-stratum but cadence-verified. Fine as a reporting bucket that groups cadence-invariants. Ready.

---

## Layer 9 — Version

`version_id: "0.1"`, `locked: false`, `prior_version: null`.

**Small consistency note V1.** The top-of-file `version_id` (line 2) reads `"0.1-draft"`. Layer 9's inner `version_id` reads `"0.1"`. Two strings for the same field. Either (a) drop the `-draft` suffix in the top field to match Layer 9, or (b) add `-draft` to Layer 9 until the Architect signs. Cosmetic.

`locked_at: null` and `locked_by: null` pending Architect signature on `signals/0.1-rationale.md`.

### Layer 9 verdict

Ready. Lock lands when the Architect signs the rationale doc; the two version strings should agree at that moment.

---

## Layer 10 — Grammar growth

Five project overrides declared. Each carries a stated topic + rule:

1. **validator-extras STRICT** — `additionalProperties: false` everywhere. Correct per the envelope-level convention Layer 2 sets. ✓
2. **view-payload convention** — pixel-anchor testid OR DOM element (not `SCENE_RENDERED.visible_paths`-style). Architect non-negotiable. Matches step_9 audit's 87 anchor + 21 DOM breakdown. ✓
3. **reader-only carve-out DOES NOT apply** — Addendum A9 covers pure readers; the shell is reader-AND-controller (POST create_session / turn_sync / interrupt). Confirmed against substrate-ui KIT_DIARY H10. ✓ — correct disposition.
4. **tonal** — no cost/money, no emoji, no wrap, no narration. Matches Layer 7 constraints. ✓
5. **privacy** — prompt/find text length-only; secret-key stripping at emit-site. Matches Layer 2 length-only fields + Layer 7 driver_params redaction. ✓

Taxonomy version `0.1`, references `sdd-kit-2/grammar/PRINCIPLES.md § supervised-grammar-evolution taxonomy — eight proposal kinds`.

### Layer 10 verdict

Ready. Five project overrides consistent with the layers above. Every override cites its source or its ratification.

---

## Cross-layer consistency

- **Tag count 108** in Layer 1 (`shell_tag_count`) matches Layer 2 payload_schemas keys, matches Layer 6 halt (`108 tags`), matches step_9 (`behavior_tag_count: 108`), matches Layer 8 OBSERVED arithmetic (95 + 10 + 2 + 1 = 108).
- **Anchor count 16** in Layer 7 pixel_anchor entry matches step_9 (87 anchor-paired × 1 anchor may cover multiple tags per instance), matches Layer 8 RENDERED binding.
- **Substrate line citations** across Layers 6/7 all match the file (except the trivial `:436` vs `:437` note in Layer 6).
- **P1 fix propagation** verified through Layer 1 (TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED added at line 116), Layer 2 (park_reason enum trimmed to three; new payload schema added), Layer 5 (pairing_ordering wired), Layer 6 (mis-assigned to RecordSubscriber — see O2). One residual: the P1 fix landed cleanly in vocabulary + payload + ordering but Layer 6 still routes it to the wrong operator.
- **P2 fix propagation** (driver_params secret-strip): landed at Layer 7 cross_reference entry with mechanical test-site prescription. ✓
- **Seed deprecation:** landed at Layer 7 with `const: ""` schema addendum. ✓
- **SETTING_CHANGED oneOf:** landed at Layer 7 with concrete schema addendum. ✓
- **S3 ratification** (reveal stratum instance-per-toggle) matched across Layer 3 note, Layer 5 pairing_ordering + exclusive, Layer 7 anchor (pane-reveal 0/255). ✓
- **S4** (window_session terminal) still open — Layer 5 review named it; no Layer-5 rule added yet.
- **S5** (unreachable_tags claim precision) still open — Layer 5 graph_checks note not tightened yet.

---

## Ratification verdict

**Layer 6 ready pending fixes.** O1 (add COLLECTION_PERSISTED and COLLECTION_RESTORED to ShellReducer or a new CollectionPersister operator). O2 (move TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED from RecordSubscriber to ShellReducer — the last thread of the P1 fix). O3/O4 cosmetic double-listings. One trivial cite drift (delegate refusal line 436 vs 437).

**Layer 7 ready.** E1 / E2 documentation refinements. Every incident carries diagnostic; every load-bearing state has an anchor; every tonal rule cites design; seed / driver_params / SETTING_CHANGED oneOf all applied. Non-negotiable pixel-anchor coverage complete.

**step_9 dual-contract audit clean.** 108 = 87 + 21 + 0.

**Layer 8 ready.** Report binding sections cover the tag set.

**Layer 9 ready pending V1** (top-of-file `0.1-draft` vs Layer 9 inner `0.1`). Lock at Architect signature.

**Layer 10 ready.** Five project overrides consistent with all lower layers.

**Cross-layer:** P1 fix landed cleanly at Layers 1/2/5/7; residual mis-assignment at Layer 6 (O2). Every other fix from the four prior reviews propagated correctly. S4 and S5 from the Layer 4/5 review still open.

**Once O1, O2, V1, S4, S5 apply and the Architect signs `signals/0.1-rationale.md`, `signals/0.1.json` locks at v0.1.** The vocabulary is then the contract; every subsequent build sprint grades against it.

---

## Cross-reference

- Layer 0: `REVIEW-2026-09-10-layer-0-substrate-shell-vocabulary.md`
- Layer 1: `REVIEW-2026-09-10-layer-1-substrate-shell-lexical.md`
- Layer 2+3: `REVIEW-2026-09-10-layer-2-3-substrate-shell-payload-and-sessions.md`
- Layer 4+5: `REVIEW-2026-09-10-layer-4-5-substrate-shell-temporal-and-state.md`
- Vocabulary source: `substrate-ui/signals/0.1.json` §`layer_6_operators` (1122-1280), §`layer_7_evidence` (1281-1428), §`step_9_dual_contract_audit` (1429-1439), §`layer_8_report_binding` (1441-1451), §`layer_9_version` (1453-1461), §`layer_10_grammar_growth` (1463-1473).
- Substrate seam: `session_registry.py`, `topologies/session/vocabulary.py`, `topologies/tool_loop/delegate.py`, `substrate.reference` Responders, `constants.py`.
- Design lock: `handoff_latest/prototypes/Substrate Prototype v7.dc.html` state class + handlers.
- SDD kit: `sdd-kit-2/grammar/PRINCIPLES.md § supervised-grammar-evolution taxonomy` for Layer 10.
- Screenshots on disk: 21 Prototype v7 states + 27 sheet crops at `/private/tmp/claude-501/.../scratchpad/pw/`.
