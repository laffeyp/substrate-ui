# Epic plan v0.2 — prototype port

*Ratified 2026-09-12 by Architect directive "That's the new project, get a plan to do that." Supersedes `EPIC-PLAN-v0.1-2026-09-10.md`, which built a signal spine on placeholder visuals while `handoff_latest/prototypes/Substrate Prototype v7.dc.html` sat unread. The prototype is 1132 lines of complete markup + interaction; the reimplementation ignored it. This plan reverses that.*

---

## What went wrong on v0.1

Sprints 002 through 033 built state, reducer, emit contract, Layer-5 mutex, Layer-7 anchor bytes, three-channel harness. Every sprint's card names a signal invariant. No card names a paint. `src/render/*.tsx` invented a placeholder visual — grey chips on a slate grid, no logo, no bottom bar, no records/studio/reveal buttons in the header, no swim-lane graph, no records surface, no assay surface, no settings dialog. The design lock at `handoff_latest/prototypes/Substrate Prototype v7.dc.html` sits vendored a second time in `app/prototype-v7.html` and has never been imported.

The prototype was the correct starting file on day one. It carries:

- Palette (`#212327` ground · `#26292e` chrome · `#1a1c20` inputs · `#82a5c8` accent · `#b9bec5` text · kind-specific transcript colors).
- Type ladder (`ui-monospace, 'SF Mono', Menlo, Consolas` at 13 / 12 / 11.5 / 11 / 10.5 / 10 / 9.5).
- The header shell with traffic lights, wordmark + status dot (`logoDot`), crumb, driver dropdown, workspace popover, records / studio buttons, reveal toggle.
- The bottom bar with status dot, record id, esc hint.
- The pane grid with equal-fraction cols × rows, drop-hints on N/S/E/W/C zones, drag-swap, gutters.
- The bound-pane transcript body with delegate child card, fan-out list, slash router, prompt with `›` caret.
- The unbound workspace picker with four seeded rows plus typed override.
- The revealed view with left transcript + right machinery panel (mode chips / level toggle / direction toggle / swim-lane graph / event rows / inspect drawer).
- Records surface (workspace groupings, session rows, assays).
- Assay surface with finding banner + underpowered banner + 4-arm × 5-column grid.
- Studio with form (topology name + producers + views + triggers + routes + termination) and node-graph canvas.
- Settings, Export, End-session dialogs.
- First-run driver picker.
- Every interaction — split, drag-swap, rename via double-click, driver picker per pane, delegate descent to depth 2, fan-out ArrowDown/Up/Enter, find with transcript/stream scope, slash router with nine ratified commands.

Every one of the above is complete markup with real state transitions. Fake data lives in `state = {...}` and in `EVFULL` (a 244-event hard-coded transcript). Wiring each fake port to a bridge call is the only work.

## What survives from Sprints 001–033

The signal spine. Every emit shape, every Layer-5 rule, every Layer-7 anchor byte assignment, every mouth-side Emitter check, every harness assertion, every codegen'd `Tag` / `PaneSlot` / `BridgeOp` const, every bridge op, every `signals/0.1.json` / `bridge-reasons.json` line. These files carry forward untouched:

- `signals/0.1.json`, `signals/bridge-reasons.json`, `signals/0.1-rationale.md`.
- `src/observability/{Emitter, tags, anchors, reasons, envelope-kinds, bridge-ops, BridgeClient, Emitter}.ts`.
- `src/state/{ShellState, SplitTree, Sessions, RecentWorkspaces, Assays, SlashCommands, ids}.ts` — with a state-shape reconcile called out below.
- `src/reducer/ShellReducer.ts` — the reducer stays; the actions and emissions are the contract.
- `bridge/{main, vocab}.py`.
- `tests/harness/{lib/*, tonal-checks.js, payload-check.js}` — the standing library.
- `scripts/{gen-tags, gen-anchors}.mjs` — the codegen.
- `BLACKBOARD.md`, `KIT_DIARY.md`, `process/reviews/*`, `process/sprints_v0.1/*` — the audit trail.

## What dies from Sprints 001–033

The React visual layer, at `src/render/`. Every `.tsx` component under that directory carries a placeholder paint and gets replaced by the port. The files:

`App.tsx` · `WindowFrame.tsx` · `Pane.tsx` · `PaneHeader.tsx` · `DriverChip.tsx` · `WorkspaceChip.tsx` · `RevealShell.tsx` · `Prompt.tsx` · `SlashRouter.tsx` · `FindBar.tsx` · `RecordsSurface.tsx` · `AssaySurface.tsx` · `StudioSurface.tsx` · `Inspector.tsx` · `TranscriptDelegateRow.tsx` · `TranscriptDelegateExpanded.tsx` · `TranscriptDelegateRefused.tsx` · `TranscriptFanOutList.tsx` · `UnboundPanePicker.tsx` · `DragLayer.tsx` · `Gutter.tsx` · `Anchor.tsx`.

`Anchor.tsx` stays as-is — it paints the Layer-7 canvases, which are pane-agnostic and do not touch visual chrome. `WindowFrame.tsx` gets rewritten because its split-tree layout diverges from the prototype's cols × rows grid.

The 36 harnesses grade the DOM by `data-testid`. Every testid the current harnesses use is added back to the ported markup at the equivalent element. That is mechanical work per sprint, called out in the harness re-fit sprint below.

## State reconcile — v7 flat state vs our reducer state

The prototype's `state = {}` object at line 516 holds a flat model. Our reducer holds an equivalent shape with three differences:

**Difference 1: layout model.** V7 uses `cols`, `rows`, `colW`, `rowW` — an equal-fraction grid capped at 4×2 = 8 panes. We use `state.splits` — a binary split tree. Both express the same set of layouts *for the prototype's cap*; the split tree also expresses layouts the prototype refuses. The port collapses to v7's model. Reason: v7 is the design lock; the split-tree generality was not asked for. Cost: `SplitTree.ts` shrinks to a cols/rows model with `newPane` / `splitAtFocused` / `movePane` / `closePane` retaining their action shapes; the reducer's split-tree cases become grid-slot ops. All emit signatures hold (`PANE_CREATED`, `WINDOW_LAYOUT_CHANGED`, `DROP_HINT_SHOWN/HIDDEN`, `PANE_MOVED` — every payload field survives).

**Difference 2: reveal split ratio.** V7 has `revealL` — a fractional split between transcript and machinery panels when revealed. We have `pane.reveal ∈ {terminal, reveal}` only. Add `state.revealL: number` (default 1.15 per v7).

**Difference 3: settings.** V7 carries `theme` (dark|light|system), `fontOverride` (px), `nestedDescent` (bool). Our state has none of these. Add them; wire to the settings dialog when Sprint 040 lands.

Fields matched already, keep their reducer shape:

| v7 field | our field |
|---|---|
| `panes[]` | `state.panes` |
| `focused` | `state.focusedPaneId` |
| `panes[i].driver` | `pane.driver` |
| `ddFor` | `pane.driverPopover.open` (per-pane) |
| `wsFor` | `pane.workspacePopover.open` (per-pane) |
| `revealed` | `pane.reveal` (per-pane) |
| `mode` | `pane.lens` (per-pane) |
| `level` | `pane.streamLevel` |
| `dir` | `pane.streamDir` |
| `sel` | `pane.inspectorSeq` |
| `surface` | `pane.surface.kind` |
| `studioView` / `topoName` / `prods` / `sviews` / `trigs` / `sroutes` | `pane.studioView` / `pane.studioDraft.*` (draft grows fields) |
| `childOpen` | `pane.delegateExpansions` |
| `descent` | `pane.descentStack` |
| `fanOpen` / `fanSel` | `pane.fanoutExpansions` |
| `findOpen` / `findQ` / `findScope` | `pane.find` |
| `promptVal` | `pane.promptDraft` |
| `driverOpen` (per-pane menu) | `pane.driverPopover.open` |

New Layer-1 tags are needed for:

- **Layout resize** — v7 has col-gutter and row-gutter drag. We already have `GUTTER_DRAG_START` / `_STOP` in Layer 1 v0.1. Match.
- **Reveal split resize** — new. Propose `REVEAL_SPLIT_DRAG_START` / `_STOP` for v0.2 rationale. Not needed for the first port pass — the reveal split can start at v7's `revealL = 1.15` and stay there until Sprint QR adds the emit.
- **Theme + font settings** — Sprint 040 (settings dialog) covers `SETTING_CHANGED`. Layer 2 accepts `key` = `theme` or `font`.
- **Records / assay / studio surface open** — already ratified as `SURFACE_OPENED / _CLOSED`.

## Halt items requiring Architect ruling

Answer each before dispatch of the port begins. Each is a load-bearing scope call; guessing wastes work.

- **H1. Delete the current `src/render/*.tsx` files up front, or replace them file-by-file in sprint order?** Deleting up front leaves the build broken until Q1 lands; replacing keeps the build green throughout but risks visual drift where the old and ported paints coexist. Reversibility: git holds every deleted file. Recommendation: delete up front + write a stub `Shell.tsx` that renders nothing but the outer flex column; expand it sprint by sprint. Regression stays red for ~two sprints, then greens.
- **H2. Cap regression at Q0 or hold 36/36 across every sprint?** Every current harness asserts `data-testid`s on the placeholder tree. The port moves those elements. Two options: (a) mark all 36 harnesses skipped at Q0 and re-enable one sprint at a time as its section of the port lands; (b) update testid selectors in each harness as its section ports. Recommendation: (a). Green regression will read as false comfort while the visual is inverting. Skipped-count is a truer number.
- **H3. Collapse the split-tree to v7's cols/rows model, or keep the tree and render the grid from it?** See Difference 1. Recommendation: collapse. The tree bought us nothing the prototype uses; carrying it as dead generality invites drift.
- **H4. Handle fake data in the port strictly or leniently?** The prototype writes fake data in `_bindPane` (`fix-race-in-metering`, `worktree substrate/<name>`), in `EVFULL` (a 244-event fixture), in the assay grid (`kimi + reviewer-glm`, `.17 delta`), in the records list (`~/code/substrate` groupings). Every one of those is prototype-only. Two options: (a) hardcode the same fixtures in the initial port so the visual is faithful, then rip them out sprint-by-sprint when the bridge call lands; (b) render empty states for every unbound port site until its bridge hookup sprint lands. Recommendation: (b). Fake data lives on if any sprint's harness relies on it. The empty-state renders in v7's palette + typography — the shell still looks right; it is just not preloaded.
- **H5. Include Studio canvas node-graph in the port, or defer?** V7's studio canvas is a drag-positioned SVG graph with `cardPos` state. It is significant work and the topology builder against substrate is deferred to a widening sprint anyway. Recommendation: port the form; render the canvas as a placeholder that says "canvas — later widening pass" (same message as Sprint 027 shipped).
- **H6. First-run driver picker — port in Q or defer?** V7's `showFirstRun` is a modal that reads a driver roster and picks. Substrate does not yet enumerate installed drivers (bridge has `probe_driver` for one at a time). Two options: (a) port the modal, hardcode the six-row roster from v7 (`ollama · llama3.2`, `ollama · qwen3:8b`, `ollama · cloud`, `claude (cli)`, `claude (api) · openai (api)`, `deterministic`); (b) defer until bridge grows a `list_drivers` op. Recommendation: (a) for the port pass, (b)-ify later. Users deserve a working first-run.
- **H7. Nested descent parent-ghost feature — port or defer?** V7's `nestedDescent` boolean toggles whether the parent transcript stays visible above the descended child. Layer 1 v0.1 has no signal for it (it's a UI-only toggle). Recommendation: port; it costs nothing and matches the design lock.

Send an "H* — yes/no/adjust" line per item and the port dispatches.

## Sprint list

Sprint numbering restarts at Q1. The old `sprint-NNN` cards for 002–033 stay on disk as closed; every Q sprint carries a `supersedes: [002..033]` line pointing back at whichever prior sprint covered the same signal contract.

Each Q sprint's card carries a three-channel observation contract identical in shape to the v0.1 cards: signal contract (emits/consumes), artifact contract (files touched), observation contract (driving steps + DOM / perceptual / log-signal channels). The signals never change; the DOM does.

**Q0 — Rip out.** Delete the current `src/render/*.tsx` (except `Anchor.tsx`). Land a stub `Shell.tsx` that mounts the outer div, the app-scoped anchors, and nothing else. Mark all 36 harnesses skipped in `tests/harness/lib/harness.js` behind a `PORT_PASS_SKIP` env var. Commit as `port-Q0: rip out the placeholder visual`.

**Q1 — Skeleton + palette.** Port lines 8–30 (outer flex column · `showStrip` variant · `showFullHeader` variant) and line 446 (bottom bar). Port the palette variables to a top-level style block; kill inline styles by extracting classnames the port will reuse. Header carries: traffic lights, `substrate` wordmark + `logoDot`, crumb, driver dropdown, workspace popover, records button, studio button, reveal toggle button. Bottom bar carries: status text, record text, hint text. Wire crumb, `logoDot`, records/studio active color, reveal button label to `state.focusedPaneId`'s pane state.

**Q2 — Pane grid + per-pane header.** Port lines 33–52 (pane container, per-pane header). Cols × rows layout; drop-hint zones; drag-swap; rename via double-click. Per-pane driver chip, workspace popover chip, records / studio / reveal handles. Collapse the split tree (H3). Regression re-enables `e2e_boot`, `e2e_first_pane`, `e2e_pane_splits`, `e2e_pane_rearrange`, `e2e_pane_close`, `e2e_driver_change`, `e2e_workspace_chip`, `e2e_header_popover_mutex`.

**Q3 — Bound-pane transcript body.** Port lines 78–121 (transcript body with fake data emptied · find bar in place · slash router in place · prompt at the bottom). The transcript renders `pane.transcriptRows`. Delegate row · delegate expanded child · fan-out list · descent-with-crumbs · descent talkable/not-talkable branch. Regression re-enables `e2e_transcript_render`, `e2e_park_render`, `e2e_prompt_editor`, `e2e_delegate_render`, `e2e_delegate_expand`, `e2e_descent`, `e2e_delegate_cap_fanout`, `e2e_slash_router`, `e2e_find_open`, `e2e_find_step`.

**Q4 — Unbound-pane workspace picker.** Port lines 124–137 (typed picker with four seeded rows). Wire `_bindPane` calls to `BridgeOp.session_create`. Regression re-enables `e2e_workspace_picker`, `e2e_session_create`, `e2e_probe_driver`.

**Q5 — Revealed view.** Port lines 156–329 (transcript left, machinery panel right, reveal gutter). Mode chips (stream / i/o / structure / scene). Level toggle (all / app). Direction toggle (down / side). Swim-lane graph with per-producer-kind lanes and span-of-track sub-lane packing. Event rows with lane cells + seq + time + kind color + producer + gist. Click-to-inspect drawer with SCHEMA / TIME / PRODUCER / content / PAYLOAD. Regression re-enables `e2e_reveal_toggle`, `e2e_reveal_focus`, `e2e_lens_level_dir`, `e2e_lenses`, `e2e_inspector`.

**Q6 — Revealed extras.** Port lines 288–323 (i/o docs · structure listing · scene grid). The scene lens reads the record's Generation-kind events if any exist; else the tab hides itself (v7's behavior).

**Q7 — Records surface.** Port lines 331–355 (workspace groupings · session rows · assay list). Wire session rows to `list_sessions`. Regression re-enables `e2e_records_surface`, `e2e_session_end`, `e2e_session_resume`.

**Q8 — Assay surface.** Port lines 358–374 (finding banner · underpowered banner · 4-arm × 5-column grid). Wire to `list_assays` (which currently returns []). Regression re-enables `e2e_assay_surface`.

**Q9 — Studio.** Port lines 377–443 (form · toolbar · output line). Canvas is a placeholder per H5. Wire validate + build to `topology_validate` / `topology_build`. Regression re-enables `e2e_studio_surface`.

**Q10 — Dialogs.** Port lines 449–490 (settings · export · end-session-confirm). Theme, font-override, nested-descent, key bindings display. Regression re-enables `e2e_turn_submit`, `e2e_turn_fail` (they exercise the end-session confirm path indirectly).

**Q11 — First-run picker.** Port lines 493–511 per H6.

**Q12 — Turn round-trip.** Wire the prompt's Enter to `BridgeOp.turn_submit`. The parked transcript grows a UserMessage row followed by whatever the substrate driver returns. `e2e_turn_submit` + `e2e_turn_fail` re-verify.

**Q13 — Delegate descent bridge.** Wire the descent stack to `BridgeOp.record_read` on child_record_root. `e2e_descent` + `e2e_delegate_cap_fanout` re-verify.

**Q14 — Harness re-fit + regression sweep.** Every `data-testid` the harness reads must exist at its equivalent element in the ported markup. Update selectors, re-enable the last skipped harnesses, target 36/36.

**Q15 — Real-model roundtrip.** `e2e_real_model` and `e2e_fixture_real_record` re-verify against the ported shell.

**Q16 — Reference-compact + heartbeat.** `e2e_reference_compact` re-verifies.

Total: 17 sprints. Estimated agent-time: single-digit hours per sprint for Q1–Q14, half a day for Q0. The visual is complete markup — no interaction design decisions land in the port pass. Every design decision is v7's.

## The 108-tag vocabulary is unchanged

Every emit shape stays. Every Layer-5 rule stays. Every Layer-7 anchor byte stays. Every mouth-side Emitter check stays. The port changes what the user sees; the signal ledger records the same events the same way. Every harness that verifies signals will verify them against the ported DOM.

## Superseded but retained

`EPIC-PLAN-v0.1-2026-09-10.md` stays on disk as a `superseded` file — the audit trail per KIT_DIARY hard rule 12. Sprint cards 002–033 are closed and remain closed; the Q sprint cards cite them as `signal_contract_inherited_from: 002..033` where applicable.
