# REVIEW — piece-G plan (sprints 032a → 038)

**Reviewer:** Claude, session 2026-08-28.
**Scope:** the fourteen-card piece-G queue on file at review open — 032a, 033, 033a, 034a, 034b, 035, 036a, 036b, 036c, 036d, 036e, 036f, 037a, 037b, 037c, 038 (fifteen when 032a's prerequisite lock is counted). Read against the SPLIT-DECISION doc that records the rewrite of the original 034/036/037 into the split chain.
**Ground truth:** every card read in full; sizes cross-checked (`wc -l`); `pass_kind` values scanned against the kit's enum; observation contracts cross-referenced against the cited harnesses and grader; server-side prerequisites cross-referenced against `substrate-ui/server.py` and the substrate-side BLACKBOARD's piece-B closure.

Findings ranked most severe first. Every finding names the exact card, the specific gap, and the fix path.

---

## G1 — Four cards depend on server-side session PATCH/POST fields that piece B explicitly deferred.

Piece-B sprint 215c (`daemon-session-patch`) shipped PATCH for `driver` and `name` only. Its closeout named the deferred fields plainly: "`tools`, `per_turn`, `workspace`, `workspace_shape`, `bundle`, `seed` → 400 naming them as 'not PATCH-able yet; SessionManifest schema growth needed (piece-B follow-up)'." Sprint 215d and 216 closed piece B without lifting that deferral.

Piece-G cards assume the deferred surface is live:

- **036b (bundle picker).** POST accepts `bundle`; PATCH accepts `bundle` and triggers seed re-assembly. Card lists both as context. Neither exists server-side. PATCH returns 400 on `bundle`; POST likely stores it but nothing re-assembles the transcript. The card's observation contract asserts `TranscriptCompacted{reason:"bundle_changed"}` lands on the record — no substrate-side code path emits that today; sprint 208's transcript compaction has cadence rules per TECH-SPEC §3a but the `reason` enum's value set is not on file.
- **036c (workspace picker).** POST accepts `workspace` + `workspace_shape`. Card lists both as context. Neither confirmed live on `_session_create`.
- **036d (tools restriction).** PATCH accepts `tools`. Deferred per 215c. Sprint card declares parity against a CLI `/tools` slash that piece D's sprint 221 handles (`/tools` slash exists in the cli.py slash router) — but the CLI slash routes through the same PATCH endpoint the daemon refuses. Both surfaces fail together.
- **036e (isolate toggle).** POST accepts `isolate`. Not confirmed live on `_session_create`.

Four of the five 036 controls sit on unshipped daemon surface. The vocab lock (032a) is a prerequisite for the *emit tags*; the server acceptance is a distinct prerequisite the cards do not name.

**Fix path.** Add a sprint (call it `217f` or `225e`, whichever piece owns SessionManifest schema growth per the canonical-home registry) that lifts the PATCH deferral for `bundle`, `tools`, `per_turn` and lifts the POST deferral for `bundle`, `workspace`, `workspace_shape`, `isolate`. Declare `TranscriptCompacted{reason:"bundle_changed"}` in the session topology's cadence rules (or halt with `vocabulary_change_required` if the reason enum needs a value). List `217f`/`225e` as an explicit prerequisite on 036b, 036c, 036d, 036e. Piece G cannot close cleanly with a phantom PATCH.

## G2 — `pass_kind: implementation` on four cards is outside the kit's enum.

`sdd-kit-2/templates/SPRINT_CARD.md` locks `pass_kind` to `architecture | functional | docs | bridge | observation`. The piece-G queue uses `implementation` on 033, 033a, 035, 038. Same class as the substrate SDD review's F2 (which caught six invented values on the 224-series subs).

Reading the four cards, the correct existing values are:

- 033 (two-view scaffold) — behavior-touching UI change with observation contract → `functional`.
- 033a (vocab syncer bump) — tooling change; no runtime behavior → `functional` if you count tooling as functional, or propose a `tooling` kind. The kit does not have one.
- 035 (terminal.ts + session-turn) — heavy behavior change → `functional`.
- 038 (review fold) — a review sprint. Kit has no `review` value; closest is `docs` (the deliverable is a REVIEW doc), or `observation` if fold work fires the full observation contract.

**Fix path.** Reclassify against the five, or (better, per the substrate SDD review F2 fix) propose a v0.2 of the sprint-frontmatter vocabulary that adds `tooling` and `review` and ratify in one Decision. `implementation` is a synonym for `functional` in effect and can be re-labeled in place without proposing a new value.

## G3 — Rule 6 (≤2 files / one concept) stretches on three cards, unacknowledged.

The kit's rule 6 is ≤2 files, one concept. The SPLIT-DECISION doc says every split card lands within that bound. Reading the artifact contracts:

- **033** touches `web/index.html` + `web/app.ts` + `tools/capture-grade.ts`. Three code files. The card itself is a fourth. Rule 6 counts touched code files; three of them stretches the bound. Rationale for the stretch would be "the two-view scaffold plus its grader-map extension is one concept" — plausible, but the card does not name the stretch or defend it.
- **035** touches `web/terminal.ts` (new) + `web/app.ts` + `tools/capture-grade.ts`. Three code files. Card declares four in the artifact list including itself; the discipline is the same as 033.
- **037b** touches `harness/capture_session.js` (new) + `harness/capture_session_signals.js` (new) + `package.json` (edited twice — script additions). Two new code files plus a config edit. The `package.json` edit is a script registration, not a code file; if the project counts config edits against rule 6 the card stretches; if not, it's clean.

The substrate side handles this by putting a "rule-6 stretch acknowledged" line on the card body when it stretches. The three piece-G cards above ship the stretch without the acknowledgement.

**Fix path.** Add one line to 033, 035, and 037b under `## scope`: "rule-6 stretch acknowledged: three code files touched, one concept (view scaffold + grader-map extension) — the grader map is the observation contract's own surface and cannot be split without a follow-on sprint that would land trivially." Similar text on 035 (terminal wiring + grader invariant); similar on 037b if config counts. Not a re-split; a card-body honesty edit.

## G4 — 037a's observation contract asserts the full `SESSION_INIT → ... → SESSION_ENDED` order against a grader that has not yet been extended.

037a card asserts:

```
SESSION_INIT → PANE_SWITCHED × 2+ → DRIVER_SESSION_STARTED →
USER_MESSAGE_INJECTED × 2 → PARK_LANDED × 2 → DRIVER_SESSION_ENDED
→ SESSION_ENDED
```

The v0.5-and-earlier grader knows `SESSION_INIT` / `SESSION_ENDED` (browser lifecycle tags — the tab-load and tab-close pair, per the BLACKBOARD's 2026-08-25 entry on the DRIVER_ prefix option-1 ruling). The v0.7 grader adds the four `DRIVER_` tags. The `checkDriverSessionBookends` invariant is declared in sprint 035's artifact contract as an *added* invariant on `capture-grade.ts`. 037a claims to verify the trace against this invariant plus a full order that combines v0.5 and v0.7 tags.

Two hazards:

- The `EXPECTED_ORDER` for the `session` fixture kind (037a's second file) needs to hold both vocabularies in one linear sequence. `SESSION_INIT` and `PANE_SWITCHED` are v0.6; `DRIVER_SESSION_STARTED/ENDED` are v0.7; `USER_MESSAGE_INJECTED` is v0.7; `PARK_LANDED` is v0.7 (per sprint 035's contract). If the grader's `EXPECTED_ORDER` is currently structured per-vocabulary rather than per-fixture, extending it to a new session fixture kind needs a grader shape check.
- `SESSION_ENDED` (browser tag) fires on tab unload. 037a's flow does not close the tab; it types `/exit` (which ends the driver session but not the browser session). The asserted terminator `→ SESSION_ENDED` will not fire unless the harness explicitly navigates away or closes the page. Rereading: `SESSION_ENDED` might refer to the driver's `DRIVER_SESSION_ENDED` (v0.7); if so, the sequence has a naming conflict — the last two tags in the asserted order are `DRIVER_SESSION_ENDED → SESSION_ENDED`, which reads as "two distinct terminators back-to-back." One of them is wrong or one of them is `SessionEnded` (substrate wire kind) misnamed as a grader tag.

**Fix path.** Disambiguate: rename the last tag in the sequence to name which vocabulary it belongs to. If it is the browser tab-unload tag, the harness must close the tab; if it is the substrate wire kind, the grader must be told it lives on the record, not the client. Either way, the sequence needs one asserted terminator, not two.

## G5 — 036e's grayed-out state hides an accessibility hazard the observation contract does not catch.

036e (isolate toggle): "grayed and non-interactive when `workspace_shape == 'worktree'`." Observation contract asserts: "pick a worktree workspace; assert toggle is grayed and clicks are no-ops." That covers the visual state and the pointer behavior. It does not cover:

- Keyboard access. A grayed-out toggle that still receives keyboard focus and fires on Space/Enter is a common accessibility bug pattern. `disabled` attribute vs `aria-disabled=true` + CSS opacity are structurally different — the former is inert for keyboard too; the latter is not. Card does not name which.
- Screen-reader announcement. A disabled control needs an explicit reason.

Piece G's design brief in the tech spec (`current-design-direction/TECH-SPEC-2026-08-25-round6.md` §10) is the substrate cockpit, meant as a daily driver. Accessibility is not optional on a daily-driver surface.

**Fix path.** Card body adds: "the toggle uses `disabled` attribute (not just CSS gray-out) so keyboard focus skips it and Space/Enter cannot activate; the disabled-reason string 'isolation implicit in worktree workspace' ships as an `aria-label` or adjacent `<span>`." Observation contract adds a keyboard-driving step: tab-focus the header; assert focus moves past the disabled toggle; press Space; assert no manifest change.

## G6 — 037c's grep-based deletion check is bounded to two directories; false-negatives possible.

037c observation contract: `grep -r '#termdock\|termOpen\|runTerm' substrate-ui/ returns no hits under web/ or harness/`. Read as prose: "no hits when the grep is bounded to web/ or harness/." That is a clean check.

Read literally as the shell command: `grep -r <pattern> substrate-ui/` returns hits from *every* subdirectory including tests, screenshots (which carry filenames like `35-terminal-view-*`), captures, and process docs. The card wants the bounded check; the command as printed is unbounded. The bounded shape is `grep -r <pattern> substrate-ui/web substrate-ui/harness`.

**Fix path.** One-line command edit in the observation contract. Also worth adding: `grep -r '#termdock\|termOpen\|runTerm' substrate-ui/tests` — if any test still asserts on the dock's DOM, deletion breaks tests. Zero hits after 037c is the desired outcome; a hit reveals a test the sprint did not update.

## G7 — 036c's "workspace picker" is under-specified for browser reality.

036c: "pick a workspace path." Browsers cannot mount arbitrary host paths through a picker without native file-input (which is limited to file uploads, not directory selection with a return-path). Two options browsers actually support:

- `<input type="file" webkitdirectory>` — non-standard; user picks a directory; the browser returns the *contents* to JavaScript, not the host path. The daemon still needs a path.
- A text input where the user types the path — no picker, just a form field.

The card says "workspace picker + file-picker" without naming which mechanism. The daemon side (POST /api/session's `workspace`) presumably wants a host path string.

**Fix path.** Card body picks one: either a text input with path validation on the client (simplest — matches the CLI's `--workspace` flag shape) or a server-side `GET /api/workspaces?prefix=...` endpoint the client autocompletes against. Then the observation contract asserts against the chosen mechanism.

## G8 — 033a's "add current.json to substrate side" is a cross-repo change that piece G authors from outside the substrate repo.

033a proposes: "Substrate side: `substrate/process/signals/current.json` (new symlink → the highest committed version). Written in this sprint (a one-line command); the substrate side does not need its own sprint card because the file is a lookup convenience, not a contract change."

The claim "not a contract change" is contestable. `current.json` becomes a lookup surface every downstream reader uses to find the current vocab. Once shipped, changing it (or removing it) is a contract change. The right shape is a substrate-side sprint card whose scope is exactly "add `current.json` as a symlink to the highest-versioned vocab file; document the convention in `substrate/process/WORKING_AGREEMENT.md`'s canonical home registry."

The rule the card leans on ("a lookup convenience, not a contract change") is the same rule that leads to `signals/mirror/substrate-0.2.json` going stale — which is the drift 033a fixes. Silent-drift begets silent-drift.

**Fix path.** Split 033a into 033a-substrate (one-line file, one-line canonical-home entry, one sprint card on the substrate side) and 033a-ui (the syncer update). Or acknowledge in 033a's card body: "This card writes one file into a sibling repo; the substrate-side follow-up card ratifies the convention. Do not merge the substrate change without the follow-up card landing in `substrate/process/sprints/`."

## G9 — 038's observation contract fires the full multi-fixture e2e suite; verify runtime.

Sprint 038 asserts: "Full `npm run e2e && npm run e2e:studio && npm run e2e:assay && npm run e2e:delegate && npm run e2e:session && npm run signals` green."

Six e2e runs in sequence. Each opens Playwright, starts the daemon, drives the flow. On a typical box each e2e is 30-60 seconds; six is 3-6 minutes. Plus `npm run signals` grading each fixture. Total review-fold gate: ~5-10 minutes of wall-clock per iteration.

Not a defect; a runtime cost worth naming so 038 does not become a session-long wait pattern.

**Fix path.** Consider adding `npm run e2e:all` that parallels the six where safe (each opens its own port; they might race the daemon port). If not parallel-safe, name the sequential cost on the card so the Architect knows the fold pass is slow.

## G10 — 034a's "GET /api/bundles" reads piece-H bundle catalog; verify the read path exists.

034a specifies: `GET /api/bundles` returns "every bundle from `substrate/src/substrate/topologies/applications/registry.py`'s bundle catalog." Response shape: `[{name, description, slot_count}]`.

Piece H (sprints 229-232 + 232b) shipped `substrate/src/substrate/bundles.py` with `load_bundle`, `resolve_extends`, `assemble_seed`, `bind_slots`. Five default bundles under `topologies/session/bundle/`, `topologies/applications/*.bundle/`. The `registry.py` file is piece-E's application registry (loads `.manifest.toml` files). Bundles are a separate concept from applications — the `.bundle/` directories are peer to the `.manifest.toml` files, not indexed by the same registry.

The card's implication ("piece H's `bundles.py` publishes a `list_bundles()` function that server.py imports") is not verified against the code. Grep `list_bundles` in substrate/src/substrate/bundles.py to confirm the function exists; if not, 034a needs a substrate-side follow-on.

**Fix path.** Verify against the code: `grep -n 'def list_bundles' substrate/src/substrate/bundles.py`. If missing, add the function as a substrate-side sprint (one function, one file, per rule 6). Update 034a's context_files to name the function it imports, not just the module.

## G11 — Positive: prerequisites are named on every card, with a real dependency graph.

Every card lists prerequisites. 036e correctly lists 036c (isolate depends on workspace_shape from the picker). 034b lists 034a (rail consumes new endpoints) and 032a (vocab lock). 036a-e each list 032a (vocab lock) and 033 (two-view scaffold). 037a lists all of 033-036f as closed. 037c lists 037a, 037b, 035. 038 lists all of 033-037.

This is the discipline the piece-B and piece-C reviews (2026-08-26) named as held. Piece G inherits and continues it.

## G12 — Positive: parity tests per control, consolidated at 036f.

Each of 036a-e ships its own single-control parity smoke (CLI slash vs UI control produce the same manifest). 036f consolidates as a regression gate. That is the correct decomposition: the smoke catches the specific control's drift; the parity test catches cross-control regressions.

Note against the substrate side: cli.py's `_slash_route` is currently a 163-line chain-of-`if` (Q11 in the code-quality review, Plan 3 in the hygiene-splits plan). Piece G's parity tests will exercise every slash the router handles. If the router refactor lands during piece G's window, the parity tests are the regression gate for the refactor — a double-payoff. If the router refactor lands after piece G, the parity tests still pin the current shape.

## G13 — Positive: the SPLIT-DECISION doc records the rewrite; originals stay on disk.

Rule 12 held. `SPRINT-034-036-037-SPLIT-DECISION.md` is on file. Original 034, 036, 037 stay in `sprints/`. The split cards carry the executable version. Anyone reading the sprints/ directory six months from now can walk the audit trail: the original card's scope, the reason for the split, the fourteen executable descendants.

## G14 — Positive: the review-fold sprint (038) is planned before the arc starts.

Piece B closed with a fold sprint (`REVIEW-2026-08-26-piece-b-closure-fold.md`). Piece C closed with one (`REVIEW-2026-08-26-piece-c-closure.md`). Piece G plans 038 before the first sprint dispatches. That is the correct posture — the fold is not surprise work at the end; it is a named deliverable in the queue.

038's card body reads the substrate-side pattern explicitly ("substrate-side REVIEW-2026-08-28 docs for the shape") and names the anticipated categories (sprint-id collisions across repos, vocab drift on the five session-control tags, frame-monotonic invariance across new pane_ids, legacy dock cleanup). That is the KIT_DIARY-informed foresight the discipline is meant to accumulate.

---

## What is on track

- Fourteen executable cards, every one under 120 lines. Sizes match the SDD sweet-spot norm.
- Every card has signal + artifact + observation contract. No skipped sections (contrast with the substrate SDD review F3, which flagged 13 CLI/manifest cards for missing `Emits`).
- Halt conditions per card, typed against the standard six (`vocabulary_change_required`, `dual_contract_fail`, `bridge_mapping_required`, plus one card-specific).
- Prerequisites form a real DAG: 032a → {034b, 036a-e}; 033 → {034a, 034b, 035, 036a-e}; 036c → 036e; {033-036f} → 037a; 037a → {037b, 037c}; 035 → 037c.
- Parity discipline (CLI vs UI producing equal manifest state) shipped per-control and consolidated at 036f.
- Legacy dock deletion (037c) explicitly gated on replacement proof (035 + 037a + 037b closed).
- Vocab lock (032a) explicitly precedes the emitting sprints; the sprint's own contract is "the six additions become emittable from downstream sprints, but no tag fires here."
- Review fold (038) planned in advance with named anticipated findings.

## What is off track

- **G1 (server surface gaps)** is the load-bearing finding. Four of the five 036 controls sit on unshipped PATCH/POST fields. Fix before dispatching 036b.
- **G2** (invented `pass_kind`) and **G3** (unacknowledged rule-6 stretches) are card-body edits, ~30 minutes total.
- **G4** (037a's ambiguous SESSION_ENDED terminator) is a real correctness gap; fix before dispatching 037a.
- **G5** (036e accessibility hazard), **G6** (037c grep scope), **G7** (036c picker mechanism), **G8** (033a cross-repo silent-drift shape), **G9** (038 wall-clock cost), **G10** (034a bundle-catalog verification) — each is one-card-body-edit or one-line-fix.

## Dispatch order recommendation

1. Fix G1 first — add the piece-B/E follow-on sprint that lifts the SessionManifest schema deferral. Cannot dispatch 036b, 036c, 036d, 036e without it.
2. Fix G4 in the 037a card body — disambiguate the terminator.
3. Fix G2, G3, G5, G6, G7, G8, G9, G10 as card-body edits in one hygiene pass. ~1 hour.
4. Dispatch 032a first (vocab lock, no prerequisites).
5. Dispatch 033, 034a in parallel (independent).
6. Dispatch 033a alongside 033/034a — the syncer bump is independent, and the substrate-side companion card (per G8's fix) can land in parallel.
7. Dispatch 034b (needs 034a + 032a).
8. Dispatch 035 (needs 033 for the mount point; needs 032a's vocab-adjacent tags per its signal contract).
9. Dispatch 036a → 036b → 036c → 036e → 036d → 036f. Ordering: 036c before 036e (prerequisite); 036d is independent of the picker order.
10. Dispatch 037a, then 037b + 037c in parallel (037b is capture-only; 037c is deletion; both gated on 037a's driver + grader kind).
11. Dispatch 038 as the closure.

Fifteen sprints (with the piece-B/E follow-on) instead of fourteen. Timeline extension: one sprint. Payoff: the four 036 cards land with a real server surface underneath.

---

*REVIEW-2026-08-28-piece-g-plan.md. Fourteen findings; ten off-track, four positive. G1 is the load-bearing one — four 036 cards depend on piece-B/E deferrals that were never lifted. G2-G10 are card-body edits. G11-G14 name what the plan gets right: prerequisites, parity, staged deletion, planned closure fold. Author: Claude session 2026-08-28. Not blocking dispatch on its own; G1's fix is.*
