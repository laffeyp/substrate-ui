# REVIEW — substrate-ui vocab v0.1 + SDD harness port plan (2026-08-14)

*Reviewer role. Targets: `signals/versions/0.1.json` (102L), `signals/versions/0.1-rationale.md` (85L), `process/SDD-HARNESS-PORT-PLAN.md` (88L). Read against `process/WORKING_AGREEMENT.md`, `process/BLACKBOARD.md`, `process/KIT_DIARY.md`, `process/ROADMAP.md`, and current substrate-ui state on disk (`web/app.ts` + `web/studio.ts` present, `tsconfig.json` + `vite.config.ts` present, harness/ has twelve scripts). Axes: consistency, SDD adherence, correctness. New dated file per no-in-place-edits.*

---

## Findings

### F1 — The port plan's stated premise is stale on disk

`SDD-HARNESS-PORT-PLAN.md:28`: "Vanilla JS, no TypeScript build. Katybird runs TS via `npx tsx`. Substrate-ui's `web/app.js` is plain JS served static. **Port drops type annotations; nothing else changes.**"

Actual state: `web/app.ts` and `web/studio.ts` exist (not `.js`). `tsconfig.json` declares `"strict": true`, `"include": ["web", "harness", "tools"]`. `vite.config.ts` declares two entry points (index.html, studio.html) with a `build` target. The TypeScript pivot has already landed.

Consequence: the plan's file-by-file "rename `.ts` → `.js`, drop types" step (line 37) points in the wrong direction — the direction the Architect named this turn is preserve types, not drop them. Every "Straight ports" line 39–42 needs to become `.js → .ts` (or "keep `.ts`, add typing"), not the reverse.

### F2 — WORKING_AGREEMENT directly contradicts the new vocab file

`WORKING_AGREEMENT.md:25`: "The UI EMITS no signals of its own — it is a reader/projector of substrate's locked v0.2 vocabulary. **So there is no `signals/*.json` here** (a second vocabulary would be ceremony)."

`signals/versions/0.1.json` exists (drafted 2026-08-14, `"locked": false`, 44 tag entries, `"tag_count": 42` in the header — see F5).

Two docs contradict on whether substrate-ui has a vocabulary at all. WORKING_AGREEMENT says no. The tree says yes. The port plan's § "Open questions before dispatch" flags this as one of three items awaiting the Architect (line 84 "Vocabulary path"), which is a smaller framing of the underlying contradiction — the question isn't the path, it's whether a vocabulary exists at all under the reader-UI carve-out named in WORKING_AGREEMENT.

`KIT_DIARY.md:12` H2: "A UI that only READS a locked vocabulary needs no vocabulary of its own ... tentative-confirmed. Review #39 ruled a second `signals/*.json` would be ceremony." H2 is being reversed by the vocab-v0.1 draft with no diary entry explaining the reversal. A confirmed hypothesis flips silently.

### F3 — WORKING_AGREEMENT's "no build step" clause is stale

`WORKING_AGREEMENT.md:61`: "**Frontend:** vanilla JavaScript. NO build step, NO bundler, NO npm runtime deps, NO CDN `<script>`s."

`vite.config.ts` on disk configures a build (Rollup input, `outDir: "dist"`, port 5173 dev proxy). `web/dist/` exists. The stated dependency policy no longer describes the tree.

### F4 — The vocab is solo-drafted ahead of the Vocabulary Session it requires

`signals/versions/0.1.json:5`: `"locked_by": "Agent-drafted (Claude Opus 4.7, 2026-08-14); awaiting Architect ratification."`

`SDD-HARNESS-PORT-PLAN.md:86`: "Vocabulary Session partner. BOOTSTRAP.md § Steps 1–11 requires Architect + agent walking the layers together. Schedule the session before Sprint 008 dispatches; it isn't agent-solo work."

`sdd-kit-2/grammar/BOOTSTRAP.md` § "Anti-patterns to watch for" names two by name: "Fabricating to avoid halting" (when docs underspecify a layer, the temptation is to invent rather than halt) and "Architect ratifying without reading" (the rationale doc is for the Architect's defense in the future). The v0.1 draft was authored solo across all eleven layers before the session it says will produce it. Steps 1–11 are collaborative by BOOTSTRAP.md's definition — an agent proposes per step, the Architect ratifies per step, per step. A pre-authored artifact converts the session from paired authoring to Architect stamp.

### F5 — Vocab header `tag_count` is 42; the tags array has 44

Counted from `signals/versions/0.1.json` tags array: session 2 + records 3 + record 2 + assay 3 + view 10 + stream 3 + terminal 6 + agent 5 + topology 5 + diff 2 + incident 3 = 44.

Header at line 6: `"tag_count": 42`. Rationale doc line 17: "42 tags." Rationale doc `## Categories and why` sums to 43 (view is called "9 tags" there but the JSON view category has 10: VIEW_SWITCHED, CURSOR_MOVED, PLAY_STARTED, PLAY_STOPPED, SPEED_CHANGED, GRAPH_RENDERED, TOPOLOGY_RENDERED, SCENE_RENDERED, IO_RENDERED, HEALTH_RENDERED). Three claims, three numbers, none of them the actual 44. If the vocab locks with `tag_count: 42` and any downstream tooling relies on it, the header lies to every subsequent reader.

### F6 — Vocab notes[] cites "Sprint 008 (TS conversion)"; Sprint 008 on disk is scene-panel

`signals/versions/0.1.json:32` (notes[4]): "Sprint 008 (TS conversion) has 'topology' as the tag."

`sprints/sprint-008-scene-panel.md` on disk, dated Jun 22, is not the TS conversion sprint. Either the number belongs to a future sprint (renumbering collision — Sprint 008 is taken) or the note refers to a different scheme. As written, the note points readers to the wrong file.

### F7 — Hard rule 12 makes v0.1's `"locked": false` a dispatch gate the plan doesn't respect

`sdd-kit-2/AGENTS.md` hard rule 12: "Sprint-0 vocabulary materialization. The Vocabulary Session per grammar/BOOTSTRAP.md is the first work in any new project. Implementation sprints do not dispatch until `signals/0.1.json` exists and the Architect has signed off."

`signals/versions/0.1.json:3`: `"locked": false`.

`SDD-HARNESS-PORT-PLAN.md` § "File-by-file port plan" schedules the port of `sdd.ts`, `vocabulary.ts`, `check-vocabulary-parity.ts`, `capture-grade.ts` — all implementation sprints, all reading `signals/versions/0.1.json` as their locked reference. Any of these that dispatches before Architect sign-off runs against an unlocked contract; hard rule 12 breach.

### F8 — Signal-emission authoring is not scoped anywhere

`SDD-HARNESS-PORT-PLAN.md:29`: "substrate-ui's harnesses gain a signal-capture step (read `window.__signals` at run end, write JSONL), not a whole new driver."

Grep of `substrate-ui/web/app.js` (the prior JS version) found no `__signals`, `CustomEvent`, or `dispatchEvent`. `web/app.ts` inherits the same shape (renamed, no emission code added). For each of the 44 tags to be capturable at `window.__signals`, some function has to call `emit(...)` at each call site. The plan schedules the vocabulary lock and the harness port; no sprint scopes the emission-site authoring across `web/app.ts` + `web/studio.ts`. Katybird ships an app already emitting to a vocabulary; substrate-ui does not, and the plan reads as if it does.

### F9 — Port plan cites Katybird artifacts and line counts that this workspace cannot check

`SDD-HARNESS-PORT-PLAN.md` § "What Katybird ships" cites six files with specific line counts: `sdd.ts` (85), `vocabulary.ts` (23), `check-vocabulary-parity.ts` (191), `capture-grade.ts` (398), plus `capture-headless.ts` and `capture-browser.ts`. Local `find` for `katy*` returns nothing; the Katybird repo is not on this filesystem. The line counts read as verified; a reader here cannot verify them. If the port dispatches, the sprint card should either check the Katybird source in or cite the URL + commit hash for each file it copies.

### F10 — Port plan under-counts substrate-ui's harness inventory

`SDD-HARNESS-PORT-PLAN.md:29`: "`substrate-ui/harness/` ships nine scripts (e2e_console, e2e_studio, e2e_assay, e2e_delegate, capture_*)."

Actual: twelve scripts on disk — `capture_assay.js`, `capture_console.js`, `capture_delegate.js`, `capture_scene.js`, `capture_states.js`, `capture_studio.js`, `capture_toolchain.js`, `e2e_assay.js`, `e2e_console.js`, `e2e_delegate.js`, `e2e_studio.js`, `open_assay.js`. Small factual error; the "each grows a small tail step" plan needs to name twelve targets, not nine.

### F11 — view_payload_universal deviates from the kit template; the port plan doesn't flag it

`signals/versions/0.1.json:22-26`: `frame`, `visible`, `pane_id`, `subject_record`.

`sdd-kit-2/templates/VOCABULARY.json:93-96` (view_payload_universal): `frame`, `visible`, `scene_id`, `layer`.

The rationale doc names the deviation and defends it (line 21: "scene_id and layer don't fit a reader UI's rendering model"). The port plan describes Katybird's block as `frame / visible / scene_id / layer` (line 11) and doesn't mention the substrate-ui deviation. Two docs describe two shapes for the same structure; the reader has to cross-check to know which is authoritative.

### F12 — Port plan's "port doesn't dispatch until these three are ruled" is understated

`SDD-HARNESS-PORT-PLAN.md:88`: "The port doesn't dispatch until these three are ruled." The three: vocabulary path (nested vs flat), emit buffer location (`window.__signals` vs stdout prefix), Vocabulary Session partner.

Work already in flight ahead of those rulings: `signals/versions/0.1.json` drafted (assumes nested path); `web/app.ts`/`studio.ts` TS pivot done; `vite.config.ts` build config in tree. The plan's gate reads as "await three answers"; the state reads as "the answers are being decided in the tree." Either the gate has already fallen or the plan's gate list is incomplete.

### F13 — Copy-verbatim of the parity gate script re-appears; single source of truth is available

Same pattern as the terminal-v1 pixel-anchor decoder finding. `SDD-HARNESS-PORT-PLAN.md:41` schedules `check-vocabulary-parity.ts` copied over as `check-vocabulary-parity.js` (or `.ts` per F1). Substrate ships an equivalent gate in `src/substrate/adapters/models.py` and `assay/swebench.py:verify_constants()` (though for different targets). If the substrate-ui vocab-parity gate can share ANY code with the substrate-side vocab-parity discipline — even the regex `/\bemit\s*\(\s*["']([A-Z][A-Z0-9_]*)["']/g` — do it once and import; otherwise the two grep patterns drift the first time either evolves.

### F14 — The rationale doc's Layer 6 stance is short of BOOTSTRAP's shape

`signals/versions/0.1-rationale.md:29`: "**Layer 6 — Runtime / Operator.** Not populated. Substrate-ui is a browser UI, not an operator chain. The kit's Layer 6 is optional per-project."

`sdd-kit-2/grammar/PRINCIPLES.md` names Layer 6 as "How the program computed each event — model routes, fallbacks, operator boundaries." Substrate-ui does have operators in this sense: the fetch loop that polls `/api/records/<name>` at ~500 ms is a runtime operator (poll cadence, timeout classification); the replay engine at STATE.speed frames/sec is a runtime operator; the agent-turn accumulator (`AGENT_TURN_STREAMED` observing new events) is a runtime operator. The rationale reads Layer 6 as absent; the actual UI's runtime layer has three named operators the vocabulary already touches via `POLL_TIMEOUT`, `PLAY_STARTED`/`PLAY_STOPPED`/`SPEED_CHANGED`, and `AGENT_TURN_STREAMED`. Skipping Layer 6 leaves those operators un-declared in the layer that is meant to hold them.

---

## Consistency checks that pass

- Vocab categories in `signals/versions/0.1.json` (eleven: session, records, record, assay, view, stream, terminal, agent, topology, diff, incident) match the rationale doc's `## Categories and why` list one-to-one.
- Vocab strata (`event, ambient, summary, incident`) match the kit template's stratum set.
- Invariants array (`signals/versions/0.1.json:91-100`) matches the rationale doc's Layer-5 description (SESSION_INIT first; RECORD_SELECTED followed by matching RECORD_LOADED; AGENT_LAUNCHED terminated by FINAL_ANSWER_RENDERED or POLL_TIMEOUT).
- The rationale doc's `## Dual-contract audit table` reads clean against the tags array — every behaviour tag either has a paired view tag with matching `subject_record`, or is named as a gap surfaced for future consideration (EVENT_INSPECTED / PRODUCER_INSPECTED).
- Port plan correctly identifies substrate-ui/harness/ as existing prior art with a pinned Playwright devDep (verified: `package.json` line 20, `"playwright": "^1.49.0"`).
- The subject rule ("every read-tab render for this record cites this record") reads clean across the vocab notes[3], the rationale doc's Layer-2 discussion, and WORKING_AGREEMENT's Q-A2 ruling that the UI presents "substrate's domain."

---

## One-line summary

The vocab v0.1 draft, the rationale doc, the port plan, and WORKING_AGREEMENT.md describe four overlapping but non-identical realities: WORKING_AGREEMENT says there is no vocabulary, the vocab file says there is one, the plan says a TS drop is coming, the tree says TS has landed, KIT_DIARY H2 is being reversed with no diary entry — the port cannot dispatch cleanly against contradictory upstream docs, and hard rule 12 makes `"locked": false` a hard gate against every implementation sprint in the plan.

---

*Reviewer: Claude, this session. Findings for the build side. Additive to `substrate-ui/process/` alongside SDD-HARNESS-PORT-PLAN.md, WORKING_AGREEMENT.md, BLACKBOARD.md, KIT_DIARY.md, ROADMAP.md, BACKLOG.md.*
