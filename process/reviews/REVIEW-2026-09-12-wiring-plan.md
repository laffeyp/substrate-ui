# Review — SUBSTRATE-WIRING-2026-09-12

Scope: verify the wiring plan against the prototype, the bridge, and the substrate library.
Method: grep + read of the four load-bearing files plus the substrate library the doc claims to wrap.

## (a) Inventory — what actually exists, cross-checked

### Prototype file location

The doc's citation `handoff_latest/prototypes/Substrate Prototype v7.dc.html` DOES NOT EXIST. `handoff_latest/` is not in the repo. The only prototype file present is `/Users/peterlaffey/Documents/Claude/Projects/Agent Orchestration/substrate-ui/app/prototype-v7.html` (1133 lines). Every subsequent citation in the doc points into this file. Confirmed by `find … -name '*.html'`.

### Prototype fake-data sites — verified against the actual file

- panes state — /Users/peterlaffey/Documents/Claude/Projects/Agent Orchestration/substrate-ui/app/prototype-v7.html:527. Match.
- `_bindPane` — :536. Match.
- `driverOpts` — :761. Match. Second occurrence in fp roster at :923 (doc cited 923). Match.
- `nameKey` — :798. Match.
- `descendReviewer` — :933. Match.
- `EVFULL` — :809. Match.
- `spansByKind` — :841. Match.
- `sideLanes` — :888 (doc said 887; off by one).
- `CMDS` — :902. Match.
- `openAssay` — :918. Match.
- `sceneCells` — :973. Match.
- `canvasCards` — :1004. Match.
- `_validate` — :630. Match.
- `doBuild` — :1046. Match.
- `onPromptKey` — :1049. Match.
- `frRows` — DOM iterator at :501, state row-array at :1118 (doc said 1119; off by one).
- `themeChips` — :1103. Match.
- `fontOverride` — :1107 (as state field). Match.
- `simRL` (`simulateRateLimit`) — prop declared at :514 (in `data-props`), consumed at :105, :750, :1079, :1080.
- `backToSession` — DOM at :337, handler at :919. Match.
- `extraSessions` — DOM at :341, handler at :920. Match.
- `openAssay`/rev_kimi_vs_glm hardcoded string — :350. Match.
- `arms` — :907 in renderVals (doc pointed at :907 for the arm data; the DOM iterator lives at :365 in the ASSAY surface).
- Structure listing — :296–:313 (`sc-if isStructure`). Match.

Fake-data sites the doc missed:
- `allSessions` — the ambient "other sessions" list piped through `extraSessions`; created client-side in setState calls at :798, :1030 (rename cascades). Not in the doc's inventory but is the actual seed for records-surface rows once panes rename themselves.
- `fpDriverOpts` at :923 — a second copy of the driver list under the full-header (first-run + always-visible) driver picker. The doc lists `driverOpts` at 761 and 1062 but reads 923 as `frRows` context; actually 923 is the FP-copy of the driver picker.
- `ioDocs` — the "i/o" mode surface iterates a `d.title / d.seq / d.text` list; grep shows the DOM at :290 and it is populated in renderVals. The doc does not mention `ioDocs` at all.
- `laneLegend`, `laneDefs`, `laneW` — the swim-lane legend is client-derived but is a fake-data site (color palette hardcoded). Doc lumps this under #15 without naming it.
- `descAncestors` — nested-descent breadcrumb array populated from `CH`; doc treats it as free-with-#14 but does not enumerate.
- `routerRows`/`CMDS` slash router — enumerated in doc's #32 but not called out as a fake-data site in the top inventory.

The inventory is roughly right in structure but line numbers drift by ±1 in a few places and the list is not exhaustive. Every real cite the doc names is findable in the actual file.

### SessionRegistry method table — verified line by line

Every claimed line matches `session_registry.py` exactly: `create` 400, `set_name` 472, `set_tools` 502, `set_per_turn` 528, `set_driver_params` 550, `set_bundle` 645, `set_driver` 693, `by_name` 729, `get` 732, `list_all` 735, `list_children` 738, `turn_sync` 747, `try_enqueue_turn` 878, `next_turn_index` 903, `advance_turn_index` 908, `interrupt` 912, `update_status` 984, `delete` 993, `boot_scan` 344. Table is clean.

Signatures also match what bridge/main.py already wraps. Not noted in the doc: `SessionRegistry` also has `dequeue_turn` (called at bridge/main.py:489), which the wiring for `turn_interrupt` will need to reason about.

### assay symbols — verified

- `assay/report.py:37 exact_mcnemar_p` — match.
- `assay/report.py:49 ArmReport` — match.
- `assay/report.py:172 Report` — match.
- `assay/report.py:331 build_report` — match.
- `assay/stats.py:97 bootstrap_delta_pass_k` — match.
- `assay/stats.py:249 equivalence_verdict_score_tost` — match.
- `assay/stats.py:325 benjamini_hochberg` — match.
- `assay/preregistration.py:69 Preregistration` — match.

`ArmReport` (report.py:49–144) has every field the prototype's `arms` row renders (overall pass, easy/med/hard/adv bin — actually `by_bin` is NOT a field on `ArmReport`; the doc names a `by_bin` easy/med/hard/adv shape that doesn't exist. See omissions below.)

### Bridge op inventory — 14 ops, verified

All at claimed line numbers:
- `op_session_create` bridge/main.py:147
- `op_probe_driver` :174
- `op_driver_change` :227
- `op_list_sessions` :258
- `op_session_resume` :294
- `op_record_read` :318
- `op_turn_submit` :443
- `op_session_end` :495
- `op_list_assays` :549
- `op_topology_validate` :566
- `op_topology_build` :599
- `op_read_recent_workspaces` :628

Plus `ping`/`pong` (inline at 654–656) and `hello` (fired at main() :748). Fourteen. Matches.

### TopologyBuilder

`substrate.api.TopologyBuilder` is a re-export from `substrate.kernel.topology` at api.py:94. Match. The factory-injection pattern the doc names is already exercised at bridge/main.py:102 (`_build_session_topology_from_manifest`) and bridge/main.py:140–143 (`SessionRegistry(session_topology_factory=_build_session_topology_from_manifest)`). Real, working.

## (b) Errors in the doc

**E1. Prototype path is dead.** `handoff_latest/prototypes/Substrate Prototype v7.dc.html` is not on disk. The real file is `app/prototype-v7.html`. Rename this citation everywhere or every subsequent line number goes into the void.

**E2. `runtime.py` file path is imprecise.** The doc says "runtime.py's envelope-append site" and lists `substrate/src/substrate/session_registry.py` in the same breath as if runtime.py were sibling. It is not — the actual file is `substrate/src/substrate/kernel/runtime.py`. Fixable, but the imprecision suggests the writer did not open the file.

**E3. `api.append_envelope` does not exist.** The doc says "substrate's runtime.py emits envelopes into the record via `api.append_envelope`". No such symbol. The real append site is `substrate/src/substrate/record/record.py:129` — the `_Writer.append(envelope)` method, called from `kernel/runtime.py:641 _writer_loop`. Adding a subscriber is doable but it is a change on the writer, not a "one method on the runtime". Verify with:
`grep -rln "append_envelope" substrate/src/substrate/` — zero matches.

**E4. `record_read` return shape is not what the doc claims.** Doc line 124: "The renderer's shape holds — `EV.map(e => {seq, kind, prod, gist, payload, content})` is the same shape `record_read` returns; the field names are identical (seq, kind, producer_kind, summary, payload, content)." Read the code: bridge/main.py:418–437 returns `{seq, kind, producer_kind, summary, turn_index, park_reason, end_reason, tokens_before, tokens_after, compact_strategy, retry_index, retry_max, retry_after_seconds, tool_name, tool_call_id, tool_ok, tool_error, child_record_root}`. No `payload`. No `content`. The prototype's inspect drawer at :280 renders `selPayload = JSON.stringify(selE.payload, null, 1)` and `selContent` at :277 iterates `{k, v}` blocks. Neither is available from `record_read` today. Either extend `record_read` to include raw `payload` (small) and to compute `content` blocks per-kind (medium), or accept that the shell will not render the inspect drawer as designed under Round 1. This is the largest concrete gap the doc misses.

**E5. Round 1 claim is false on two items.**
- Item #8 (driver picker options per pane) is placed in Round 1 with "uses only existing bridge ops". Doc's own item #8 body: "Same fix as #1 — call `list_drivers`". `list_drivers` is enumerated as new in Round 2. Round 1 cannot land #8 without shipping the new op first, or without accepting the same hardcoded roster the prototype has.
- Item #15 (swim-lane graph) is placed in Round 1 as "wire only". Doc's own item #15 body: `record_read` filters framework brackets (`TriggerFired`, `ProducerStarted`, `ProducerCompleted`) via `VISIBLE_KINDS` at bridge/main.py:360. The graph needs the brackets. The doc labels the fix "Small bridge change" (new mode flag or new op). Round 1 cannot land the graph without that change.

The salvageable Round 1 set is {2, 4, 5, 6, 9, 10, 12, 16, 17} — nine items, all backed by existing ops. #8 and #15 belong in Rounds 2 and 3 respectively.

**E6. Studio build-and-launch understated.** Doc says `topology_build_and_launch` is a wrap of `TopologyBuilder + reg.create + a factory closure`, no new substrate library code. `TopologyBuilder` (kernel/topology.py, re-exported at api.py:94) accepts registered Producer, View, Trigger CALLABLES — Python objects. A studio spec that ships as JSON of {producers, views, triggers, routes, termination} has to resolve each name back to a callable via `substrate.api.get_topology` or a producer registry. That resolution layer does not exist as a bridge concern today; it is a real design question the doc waves away. The prototype's `doBuild` at :1046 writes a status string; the existing `op_topology_build` at :599 writes a stub .py file that raises `NotImplementedError`. A JSON-form → registered-Producer resolver is new work, not a wrap.

**E7. `by_bin` is not on `ArmReport`.** The prototype's assay grid renders columns easy·8, med·12, hard·8, adv·4 (:364). The doc says `Report.arms[i]` "carries every field the prototype renders: overall_pass_hat_k, `by_bin` (easy/med/hard/adv), delta, p_value, verdict". `ArmReport` at report.py:49 has `pass_rate`, `pass_at_1`, `delta_vs_control`, `delta_pass_k`, `ci_low`, `ci_high`, `p_value`, `bootstrap_p`, `equivalence`, `fdr_significant`, `verdict_counts`, `reason_counts` — NO `by_bin`, no easy/med/hard/adv breakdown. Difficulty binning is a `Suite` concept (assay/suite.py; the case is tagged with a difficulty and the report doesn't project by bin). Either extend `build_report` to emit per-bin subtotals or the shell will render the four bin columns off the raw trial records. This is a real substrate-library addition, not a wrap.

**E8. `list_assays` is not wired-only.** Doc frames the extension as "walks `~/.substrate/assays/` for preregistered runs". The code at op_list_assays :549–560 returns `[]` deliberately — the Sprint-026 defer note in the docstring says "signals/0.1.json § Layer 1 review §6 explicitly defers the assay drill-in path (ASSAY_ARM_INSPECTED / ASSAY_CELL_OPENED to v0.2)". There is a design deferral live on the code that the doc doesn't cite. The extension isn't wrong, but it opens a signals-vocabulary question the doc treats as inert.

**E9. Off-by-one line numbers.** `sideLanes` cited at 887, actual 888. `frRows` cited at 1119, actual 1118. Cosmetic; noted as a signal the doc was hand-typed against a slightly different revision of the same file.

**E10. `verdict` is not a single string on ArmReport.** Prototype column reads `a.verdict` as one word (superior/inconclusive/etc.). `ArmReport.equivalence` (report.py:98) is the closest field — "superior | equivalent | inferior | inconclusive". `fdr_significant` (bool) is separate. The mapping to the prototype's single verdict string is a client projection; not a substrate gap but not a wrap either. Doc glosses it.

## (c) Omissions

**O1. `substrate.api.attach` / `LiveRecord`.** The doc's Path B ("push transcript") describes a hand-built append-hook on the runtime as if none exists. `substrate.api.attach` at projections/attach.py (re-exported at api.py:38) returns a `LiveRecord` — a subscribable live view over the append stream. This is the ratified mechanism for a UI to receive envelopes as they land. Ignoring it and proposing a new writer-tap is invention where an existing primitive fits.

**O2. `substrate.api.topology_graph` and `run_graph`.** Doc's #18 proposes a new `topology_introspect` op. `substrate.api.topology_graph` (projections/graph.py, exported at api.py:70) already returns `TopologyGraph` with `ProducerNode[]`, `TriggerEdge[]`, `RouteEdge[]`, and `run_graph` returns the run-time graph. Wave 12 built this specifically for the machinery lens. The doc reinvents.

**O3. `substrate.api.narrate` / `narration_summary`.** Doc's #32 `/inspect` says "client-side lightweight beat-narrator". `substrate.api.narrate` at projections/narrate.py (api.py:72) already produces `NarrationLine[]` — the causal-beat prose over a record. Reuse instead of reimplement.

**O4. `substrate.api.explain_producer` and provenance projections.** api.py:53–61 exports `explain_producer`, `trace_ancestry`, `view_at`, `decisions_between`, `first_divergence`. The inspect drawer's PROVENANCE section (prototype at :275 renders SCHEMA/TIME/PRODUCER) has room for these but the doc doesn't cite them.

**O5. `substrate.api.replay` / `assert_replayable`.** For assay reproducibility and record_export's "flat_events_jsonl" round-trip, replay is the guarantee. Not cited.

**O6. Prototype expects raw `payload` and per-kind `content` blocks on every envelope.** Not covered by the doc's shape claim (see E4).

**O7. `RATE_LIMITED_WAITING` typed reason vocabulary.** signals/bridge-reasons.json + bridge/vocab.py already carry `ParkReason`, `SessionEndReason`, and the failure-reason enums. The prototype's `simRL` chip at :105 renders "kimi-k2 (api) rate-limited retry 3/6 in 14s"; the bridge already surfaces `retry_index/retry_max/retry_after_seconds` per envelope (main.py:394–398). Doc's #33 says "Wire only" but doesn't note the field mapping is already done.

**O8. The current `src/` shell.** The doc says "reimplementation under src/ is being abandoned in favor of using the prototype as the actual page" (from the review request; doc itself is silent on it). `src/render/App.tsx` (469 lines), `Pane.tsx` (270), `Anchor.tsx` (96), and `electron/preload.js` (47 lines) already implement a `window.bridge.request(op, payload)` shape. The "one specific move" section at the end of the doc treats preload as future work; it exists. Verify at electron/preload.js.

**O9. Interrupt UX.** Doc's #34 (`turn_interrupt`) admits "The prototype does not sketch a UI for this". The bridge would need an in-flight cancellation of a `turn_sync` call — non-trivial because `turn_sync` is a synchronous drain (session_registry.py:747–877). `reg.interrupt` sets a flag; the pending `turn_sync` still has to return. The doc calls this "new op that wraps it" and stops. This is a real question about how the bridge's `_long_op` thread coexists with an interrupt from the same process.

## (d) Verdict on the six-round plan

The direction is right — the prototype is a working UI, most surfaces map to substrate primitives that already exist, and the majority of new bridge ops are genuinely wraps.

The plan gets from A to B on the seams the doc counts correctly. It does NOT get from A to B as written, for four reasons:

1. **The `record_read` output shape gap (E4)** is fatal to Round 1's transcript rendering as the prototype currently expects it. Fix: extend `op_record_read` to return raw `payload` (and, optionally, pre-cooked `content` blocks) before landing any of Round 1. This is a small change but must move to Round 0 / the "one specific move" section.
2. **Round 1's zero-bridge-changes claim is false** for #8 (needs `list_drivers`) and #15 (needs the framework-brackets flag). Move #8 to Round 2, #15 to Round 3. Round 1 remains nine solid items.
3. **Studio build-and-launch (Round 3, #21) has an unaddressed design layer** — the JSON-form-to-callable resolver. Not a blocker for Rounds 1–2, but it will bite Round 3 unless a producer registry lookup is added first.
4. **The push-transcript design (Round 6) fabricates a mechanism** where a ratified one (`api.attach`/`LiveRecord`) already exists. Rewrite Path B against `attach` and drop the runtime writer-tap proposal. This shortens Round 6 from "small substrate touch + medium bridge change" to "medium bridge change against an existing public API".

Adjust the four items above and the plan is executable. Item counts are otherwise honest: the substrate side does carry the capability behind almost every new bridge op the doc enumerates, the SessionRegistry method table is exact, the assay statistics all exist at the cited lines, and the bridge already has fourteen working ops matching what the doc says it has. The bones are correct; the flesh needs the four corrections above.
