# Plan: move the shell from dc-runtime to typed React (round 5)

*2026-11-05, round 5. Rounds 1–4 are beside this file, unchanged. Round 5 brings the plan to what sprints 192–203 found and to the new design handoff (`design/received/handoff 5/`, sheet turn 24): the pixel gate fails on any differing pixel and writes fixed stand-ins in place of changing text; it covers 14 screens, because no control opens the assay page; the store is its own sprint (A5) and the settings fields move after the dialogs gate (A5b after A8); three component interfaces take the shape the editor view needs, with no change to the order or the count of sprints. Round 4's note follows.*

*2026-11-04, round 4. Rounds 1–3 are beside this file, unchanged. Round 4 adds the tests already in place: what each kind covers, which window areas have no gate, and five sprints (A8–A12) that write gates for those areas on today's tree before any area moves. Round 3's note follows.*

*2026-11-04, round 3. Rounds 1 and 2 are beside this file, unchanged. Round 3 adds the red-team results: each area moves in three sprints of at most two files; area state lives in its own store file; hover rules and the template's `<style>` block go to stylesheets; the pixel gate masks text that changes between runs; the menu's commands leave the fiber; React joins `package.json`; the CSP is spelled out. Round 2's note follows.*

*2026-11-04, round 2. Round 1 is beside this file, unchanged. Round 2 adds the audit of the UI vocabulary: what the move leaves as it is, the two faults it fixes, and where the move touches signal payloads or the signal buffer. One sprint is added (B7). Round 1's note follows.*

*2026-11-04. The epic the dc-runtime audit of 2026-09-23 asked for and no one wrote (post-mortem: `process/planning/2026-11-04-editor-level/POSTMORTEM-2026-11-04-dc-runtime-never-retired-r2.md`). It replaces sprint 112's checklist card with a design, an order of work, and the gates that hold the Architect's condition of 2026-10-08, "only if you don't break anything". The new views researched in `process/planning/2026-11-04-editor-level/` start after this plan closes.*

## The goal

When this plan closes:

- The window is a typed React app. Every file under `web/` type-checks; no `@ts-nocheck` remains.
- React 18.3.1 and ReactDOM are bundled from `node_modules`. No script loads from another origin, and a Content-Security-Policy without `unsafe-eval` forbids it.
- `web/public/support.js`, `web/reveal_component.ts`, the `inlineDcScript` and `includePartials` plugins, and the files in `web/shims/` are retired to `_deprecated/dc-runtime/`, as the classic tree went to `_deprecated/classic-tree/` on 2026-09-22.
- Nothing reads React's private fiber fields.
- Every screen looks as it does today, pixel for pixel, except where this plan removes fabricated text or dead controls.
- All 45 Electron gates, the unit specs, the Python suite, `vm_smoke` and `smoke:packaged` pass, as they pass on today's tree.
- The 33 open findings from the lens audit's sprint 112 rows are closed.
- The UI vocabulary's 36 tags fire as they fire today, with two exceptions this plan makes on purpose: five tags for deleted endpoints are retired, and three notes are corrected, in vocabulary 0.4.

## What stays fixed

**Behaviour and pixels.** Each step moves code without changing what the user sees. A pixel gate, rebuilt for this plan, compares every screen to a baseline taken before the first step.

**The gates' hooks.** The Electron gates find elements by `data-*` attributes and read `window.__vm`, `window.__vmTape` and `window.__vmSignals`. The React components carry the same attributes on the same elements. The most used: `data-pane` (42 uses in the gates), `data-input-bar` (35), `data-top-bar` (18), `data-ws-input` and `data-model-half` (12 each), `data-vm-transcript-mount` (11), `data-ws-lit` and `data-lit` (10 each), and 32 more down to one use each. `window.__vm` appears 206 times.

**The UI vocabulary.** `web/vm/signals/versions/current.json` is vocabulary 0.3: 36 tags, locked 2026-10-13, identical to `0.3.json`. `npm run signals` passes today: 36 declared, 36 emitted. Every emit sits in `web/vm/session_controller.ts`; `reveal_component.ts`, `reveal.ts` and the transcript's `.tsx` files emit none. The move changes no emit site, so the vocabulary stays as it is, except for the faults below.

| Check | Finding | What the plan does |
|---|---|---|
| Gate coverage | The parity gate scans `web/vm`, `web/reveal.ts` and `web/reveal_component.ts` (`check-vocabulary-parity.ts:49–57`); it skips `web/reveal/**`, so the transcript tree is unscanned (F359) | A4 adds `web/reveal/**` and `web/app/**` before any component moves |
| Fault: tags for deleted endpoints | `SPEC_VALIDATE_REQUESTED`, `SPEC_VALIDATED`, `SPEC_BUILD_REQUESTED`, `SPEC_BUILD_REJECTED` and `SPEC_BUILT` fire around POSTs to `/api/validate` and `/api/build` (`session_controller.ts:959–1000`). The server has neither route; the lens-audit roadmap deleted them ("Studio backend and legacy endpoints deleted"). The Studio form that calls them is inert. | B6 removes Studio and the controller's `validateSpec` and `buildSpec`; B7 retires the five tags by `TAG_DEPRECATION_PROPOSED`, marked `retired: true`, which the parity gate already reads (`check-vocabulary-parity.ts:157–166`) |
| Fault: notes that misstate the code | `SESSION_END_REQUESTED` names reasons "user_ended, parity_harness_done"; the code sends `user_end` and `user_close` (`reveal_component.ts:350`, `:2528`; `session_controller.ts:1052`). `SESSIONS_LOADED` names `/api/sessions`; the code reads `/api/session` (`session_controller.ts:345`). `CHILD_RECORD_ATTACH_REQUESTED` names `attachChildRecord(recordRoot)`; the method is `attachRecordRoot` (`:753`). | B7 corrects the three notes in 0.4; tag names, categories and payload fields stay |
| Payload values that change | F1 makes the client read the server's error shape. `SESSION_OPEN_REFUSED` and `TURN_REFUSED` keep their fields; `failure_class` starts carrying the server's reason instead of always `http_error`, which is what the tags' notes already say it carries | F1's card lists both tags in its signal contract and checks one refusal of each |
| The signal buffer | F5 bounds `window.__vmSignals` (F347). The gates read it: `bindPaneAsUser` waits for `DRIVER_ROSTER_LOADED` (`harness/shakeout/lib/electron.ts`), and three more gates read it | F5 keeps the latest record of every tag however old, and bounds only repeats, so no gate loses a tag it waits for |
| Gap left as it is | The vocabulary has no `view`-category tags, the pairs the kit's step 9 asks for (`grammar/BOOTSTRAP.md`) | Out of scope. The move draws the same screens and adds no tags; the new views add their own view tags after this plan |

Vocabulary 0.4 is issued as a new file, `0.4.json` with `0.4-rationale.md`; `0.3.json` stays as written and locked, and `current.json` points to 0.4, as the lens-audit roadmap issued 0.2 beside 0.1.

**The controller.** `web/vm/` (the `SessionController`, `PaneRegistry`, client and types) stays as it is, apart from the findings placed in its files. The React components read it as the transcript does today, through `useSyncExternalStore` (`web/reveal/transcript/useController.ts`).

**React's version.** 18.3.1, the version that runs today and that the transcript was written against. `@types/react` and `@types/react-dom` move from `^19.3.0` to 18 to match. An upgrade to React 19 is separate work after this plan.

## The design

**One store pattern, one store file per area.** `web/app/store.ts` is a small typed `createStore<T>()` with `getSnapshot`, `set`, `subscribe` (sprint 201); each area keeps its state in its own file, `web/app/state/<area>.ts`, so moving one area never edits a shared file. Together they hold everything `reveal_component.ts` keeps in `this.state` today: the pane grid and focus, the open view (one field naming panes, meta or a surface, so a later view such as the editor adds a value, not a flag beside `revealed`), meta's lens settings, each pane's picker state, the records page's expansions, the dialogs, the find bar, and the settings. It exposes `subscribe` and `getSnapshot`, the same shape as `SessionController`, so components read it with `useSyncExternalStore`; it adds no dependency. While dc-runtime still draws part of the window, `DCLogic` reads and writes the moved fields through the same store, so both sides see one value.

**Pure modules for the logic.** The derivations in `renderVals()` move into typed modules under `web/app/derive/`, with unit specs: the stream graph's rows, lanes, spans and connectors (`reveal_component.ts:1493–1900`); the structure lens's rows (`:2169–2228`); the records page's groups (`:1964–2139`); the picker's rows and key handling (`:547–791`); the slash menu and hint (`:1220–1274`); the driver label (`:404–436`); the pane-grid split and close (`:340–402`, `:838–887`). The language lens and the time column are already pure modules (`web/reveal/language_lens.ts`, `web/reveal/timeline.ts`).

**Components.** Under `web/app/`, in `.tsx`, strict mode, one component per area:

| Area | Components | Today's template |
|---|---|---|
| Window | `App` | `reveal.html` root |
| Top bar | `TopBar`, `ModelCard`, `WorkspaceCard` | lines 31–46 |
| Panes view | `PanesView`, `Pane`, `PaneSession`, gutters | 49–128 |
| Pane picker | `PanePicker`, `WorkspaceColumn`, `ModelColumn`, `ChoiceLine` | 77–121, `partials/choice-line.html` |
| Input bar | `InputBar`, `SlashMenu`, `SlashHint` | `partials/input-bar.html` |
| Session lines | `ActivityLine`, `TaskRows`, `FindBar` | 55–72, 136–155 |
| Meta | `MetaView`, `LensChips`, split gutter | 130–347 |
| Lenses | `StreamLens`, `Inspector`, `SideGraph`, `IoLens`, `StructureLens`, `LanguageLens`, `SceneLens` | 160–342 |
| Pages | `RecordsPage`, `AssayPage` | 349–413 |
| Dialogs | `SettingsDialog`, `EndSessionDialog` | 492–534 |
| First run | `FirstRun` | 536–555 |
| Footer | `Footer` | 490 |
| Keys | `web/app/keymap.ts` | `reveal_component.ts:939–1016`, `reveal.ts:179–190` |

Styles move verbatim as inline styles, as Phase 8 moved the transcript's, so the pixel gate holds. Three things in the template are not inline styles and move to stylesheets instead: the 16 `style-hover` attributes become hover rules in `web/app/hover.css`, one class per element; the `<style>` block at the top of `reveal.html` (scrollbars, the `act-pulse` keyframes, the structure lens's container queries) becomes `web/app/base.css`; the Electron rules `reveal.ts:111–125` injects as a `<style>` element become rules under `body[data-electron="1"]` in the same file. The 2 `ref=` bindings become React refs; the 2 `sc-camel-d` attributes become the SVG `d` prop. A shared palette module comes after this plan.

**How each area moves.** Phase 8's method, applied area by area, in three sprints so that no sprint touches more than two files (kit hard rule 6):

- *Logic:* the pure module under `web/app/derive/` and its spec. Skipped where the area has no logic of its own.
- *Component:* the `.tsx` component and its state file under `web/app/state/`, mounted nowhere yet.
- *Swap:* the area's block in `reveal.html` becomes a mount div, and its fields and logic leave `reveal_component.ts`; the pixel gate and the area's Electron gates pass.

The four steps below are what the three sprints do between them:

1. The area's state moves into the store and its logic into a pure module, with specs.
2. A React component renders the area into a mount div that replaces the area's block in `reveal.html`, attached by a typed mount registry that generalizes `reveal.ts:192–240`.
3. The pixel gate and the area's Electron gates pass against the baseline.
4. The dc-runtime block and the fields it read are removed in the same step.

When every area is a component, `App` renders the whole window, `reveal.html` becomes a plain page that loads one module, and dc-runtime retires.

## Gates

| Gate | Today | For this plan |
|---|---|---|
| Pixel | Phase 8's `harness/pixel_baseline.ts` and `pixel_diff.ts` have left the tree | Rebuilt as `harness/pixel/capture.ts` and `harness/pixel/diff.ts`: Electron from source, deterministic driver, offline roster, `deviceScaleFactor: 2`, dark scheme, each screen below at 1440×900 and 900×380, compared with `pixelmatch` (8.0.0, ISC; a new devDependency, recorded in `WORKING_AGREEMENT.md`); any differing pixel fails (threshold 0.1, anti-aliased pixels ignored), since two clean launches differ by 0 pixels and a 60×60 block passed at 0.1% (sprint 194) |
| Electron | 45 scripts in `npm run gates:electron` | Run on today's tree first; that run is the baseline every step is held to |
| Unit specs | `npm run test:unit` | Plus a spec per pure module under `web/app/derive/` |
| Python | `npm run test:py` | Unchanged |
| Controller | `npx tsx harness/vm_smoke.ts` | Unchanged; its open `/help` failure (runbook, "Known failures") is recorded in the baseline, not fixed here |
| Type and lint | `npm run build` | Gains `web/app/**`; ends with no `@ts-nocheck` |
| Packaged | `npm run smoke:packaged` | Last step only, on a fresh bundle |

## Tests already in place

| Kind | Where | Count | What it covers | How the move bears on it |
|---|---|---|---|---|
| Python | `tests/test_*.py`, `npm run test:py`; in CI | 61 files | `server.py`: sessions, turns, SSE, routes, the security boundary, shutdown | None reads `web/`. Unchanged; F1 and F2 change server-facing client code and keep these green |
| Unit specs | `web/reveal/__tests__/*.spec.ts`, `npm run test:unit`; in CI | 9 files, 62 tests, all passing | `web/vm/` (controller, client, kinds, types) and the pure `web/reveal/` modules: activity, language lens, markdown, settings tail, timeline, tool output mode, turn state | None imports `reveal_component.ts`. Unchanged; `turn_state.spec.ts:62` pins the old error shape and changes in F1 (F360). Each new `web/app/derive/` module adds a spec |
| Vocabulary parity | `npm run signals`; in CI | 36 tags | Every emit is declared and every declared tag fires | Unchanged until 0.4; scan widened in A4 |
| Controller smoke | `harness/vm_smoke.ts` | 12 steps | The controller against the harness's own server | Unchanged; its `/help` step fails on today's tree (runbook, "Known failures") |
| Shakeout, controller flows | `harness/shakeout/run.ts`, Axis A | 10 flows | cold boot, one turn, slash router, bundle pick, attach, refused open and turn, stream reconnect, CLI discovery and versions | Run the controller, not the window. Unchanged |
| Shakeout, Electron flows | `run.ts`, Axis C | 3 flows | `electron_smoke`, `electron_menu` (View ▸ Meta through the menu), `electron_deeplink` | `electron_menu` drives the fiber path A7 replaces; it must stay green across A7 |
| Electron gates | `npm run gates:electron` | 45 scripts | The window, by `data-*` hooks (table below) | The move's main guard. Not in CI: run locally at each swap sprint and in full at G1 |
| Live flows | `handoff_live.ts`, `tool_delegate_many.ts`, `topologies_live.ts` | 3 scripts | Panes opened by runs and delegates, on a real model | In no script. G1 runs them once on a cloud model |
| Packaged smoke | `harness/shakeout/packaged_app_smoke.ts` | 1 | A built bundle opens, binds, takes a turn | G1, on a fresh bundle |

CI (`.github/workflows/ci.yml`) runs ruff, the Python suite, `gen_kinds.py --check`, `npm run build`, the unit specs and the parity gate. No Electron test runs in CI, so the window's guard is local.

**What the Electron gates cover, by area.** Read from each gate's selectors and key presses.

| Area | Gates | Gap |
|---|---|---|
| Top bar | `one_top_bar`, `naming_sessions`, `model_chip_indicator`, `driver_chip_on_resume`, `git_workspace_label`, `no_default_model` | — |
| Pane picker | `ws_column_opens_down`, `left_folds_parent`, `left_folds_workspace`, `model_down_drills`, `model_half_starts_session`, `length_tone_rows`, `no_default_model` | — |
| Input bar and slash menu | `input_bar`, `slash_menu`, `slash_inline_hint`, `slash_choice_keys`, `slash_tab_complete` | — |
| Session lines | `session_start_line`, `language_bar_line`, `controls_mid_session`, `tasks_gate` | — |
| Find | `find_counts_transcript` | — |
| Panes and splits | `split_returns_to_panes`, `one_top_bar`, `new_window`, `run_panes`, `delegate_pane` | — |
| Meta: stream, down and side | `stream_follows_bottom`, `app_view_delegate_lane`, `graph_model_lane_on_resume` | — |
| Meta: inspector | none | No gate opens a row's inspector |
| Meta: i/o, scene | none | No gate opens either lens |
| Meta: structure | `structure_lists_producers` | — |
| Meta: language | `language_lens_bars`, `language_lens_turns`, `language_lens_views`, `language_rule_ellipsis` | — |
| Records page | `records_keys`, `records_box_width`, `records_workspace_box`, `git_workspace_label` | — |
| Settings dialog | none | No gate opens it or checks that theme and type size persist |
| End-session dialog | none | No gate opens it from the slash menu, cancels it, or confirms it |
| First run | none | No gate loads `?firstrun=1` |
| Footer | none | No gate reads it |
| Window keys | ⌘M, ⌘D, ⌘E, ⌘F through the gates above | No gate presses Escape (close order, then interrupt), ⌘W (close pane) or ⌘C |
| Menu commands | `electron_menu` (Meta), `new_window` | No gate drives Settings… or Close Pane from the menu |
| Transcript (React today) | `transcript_follow`, `tool_output_toggle`, `both_session_shapes`, `session_start_line`, `packaged_app_smoke` | — |

The pixel captures cover how every gap area looks. They do not cover what its controls do, so each gap gets a behaviour gate, written and passing on today's tree before its area moves (A8–A12). The ⌘C case is the exception: today ⌘C with no selection interrupts the turn (F336), so its gate is written in E3, red on the old code and green on the fix.

**Text that changes between runs.** Relative times ("12s ago" on the records page), the activity line's seconds counter (it ticks every 500 ms), session ids (random `s_` hex in the crumb, footer and records rows), the scratch folder in the workspace chip, the `t+` time column, record ids (ULIDs) in the inspector's payload, and the deterministic driver's reply digest (a SHA-256 over the whole prompt) all differ from one run to the next. Before each shot the capture writes a fixed stand-in in place of each such value in the page's text, by the patterns in `harness/pixel/masks.ts`, and retakes the shot if a value changed during it; the screen then draws the same characters in the same place on every run, and the layout around them is compared as drawn. Masks drawn over the text were tried first and dropped (sprints 192, 198, 199): a mask changed width with its value and drew over text under overlays and backdrops. The app runs on a fixed repo-local workspace (`harness/shakeout/.scratch/pixel/`) so paths do not vary.

**Which gates guard which area.** A2 writes the table that maps each area to the Electron gates that exercise it (for example the input bar to `input_bar`, `slash_menu`, `slash_inline_hint`, `slash_choice_keys`, `slash_tab_complete`). A swap sprint runs its area's gates and the pixel captures of its screens; every tenth sprint and G1 run all 45.

**Screens in the pixel baseline.** Panes view: an unbound pane at its picker; one pane after one deterministic turn; two panes side by side. Meta: stream down, stream side, an open inspector, i/o, structure, language, scene's empty state. Records page with one workspace open. Settings dialog. End-session dialog. First run. That is 14 screens, 28 captures. The assay page is not among them: `openAssay` (`reveal_component.ts:2240`) is bound to no control, so no step can open it on today's tree. B5 wires an opener for it (the design's ⌘3 and a View menu item, D86) and gates it by behaviour against `/api/assays`, since it has no old picture to be held to.

## Order of work

Each sprint touches at most two files and one concept (kit hard rule 6), carries the pixel gate and the Electron gates for its area, and closes before the next opens. A finding listed beside a sprint closes in it. In groups B to E each row is an area, and moves in its logic, component and swap sprints (numbered `.1`, `.2`, `.3`, for example C1.1, C1.2, C1.3); a row with no logic of its own has no `.1`. The sprint cards are written one at a time, each before its sprint runs.

**A. Foundations**

| # | Sprint | Files | Findings |
|---|---|---|---|
| A1 | Pixel gate | `harness/pixel/capture.ts`, `harness/pixel/diff.ts` | — |
| A2 | Baseline: run every gate on today's tree; capture the 28 pixel baselines | `captures/pixel/baseline-2026-11-04/`, the card | — |
| A3 | React 18.3.1 and ReactDOM 18.3.1 added to `dependencies`, `@types/react` and `@types/react-dom` to 18; the lockfile follows (CI runs `npm ci`) | `package.json`, `package-lock.json` | — |
| A3b | The window loads the UMD files from `node_modules`, copied at build, with `integrity` hashes, in place of cdnjs; bundle size measured and recorded | `vite.config.ts`, `reveal.html` | F320 (remote load), F345 |
| A4 | The parity gate scans `web/app/**` and `.tsx` | `web/vm/tools/check-vocabulary-parity.ts` | F359 |
| A5 | The store pattern, `createStore<T>()`, and its spec | `web/app/store.ts`, `web/app/__tests__/store.spec.ts` | — |
| A6 | The mount registry | `web/app/mount.ts`, its spec | — |
| A8 | Gate: the settings dialog opens with ⌘,, changes type size, closes with Escape, and keeps the size after a reload; the end-session dialog opens from the slash menu, cancels, and on confirm ends the session | `harness/shakeout/dialogs.ts`, `package.json` (`gates:electron`) | — |
| A9 | Gate: first run lists the machine's drivers and closes on a pick; the footer shows live or finalised and the session's name | `harness/shakeout/first_run_footer.ts`, `package.json` | — |
| A10 | Gate: meta's inspector opens and closes on a row and shows the row's kind, seq and payload; the i/o lens lists the turn's texts; the scene lens shows its empty state | `harness/shakeout/meta_inspector_io_scene.ts`, `package.json` | — |
| A11 | Gate: Escape closes find, then dialogs, then a surface, and with none open interrupts a running turn; ⌘W closes the focused pane and keeps the last one | `harness/shakeout/window_keys.ts`, `package.json` | — |
| A12 | Gate: the menu's Settings… opens the settings dialog and Close Pane closes the focused pane | `harness/shakeout/menu_commands.ts`, `package.json` | — |
| A5b | The settings fields (`theme`, `fontOverride`, `settingsNote`, the `substrate-ui.settings` load and save) move into `web/app/state/settings.ts`; `DCLogic` reads and writes them there. Runs after A8, whose gate checks it | `web/app/state/settings.ts`, `reveal_component.ts` | — |
| A7 | `reveal.ts` stops reaching the component's fiber: the snapshot mirror (`:153`) and the menu's toggle-meta, settings and close-pane commands (`:264–275`) become store actions, which `DCLogic` subscribes to in `componentDidMount` | `reveal.ts`, `reveal_component.ts` | F334 |

**B. Pages, dialogs and chrome**

| # | Sprint | Findings |
|---|---|---|
| B1 | `SettingsDialog`, `EndSessionDialog`; the export dialog is removed, because no export endpoint exists | F351 |
| B2 | `FirstRun`, `Footer`; the design tool's tweak props and the fake rate-limit line go | F356, F328 (footer text) |
| B3 | `TopBar`, `ModelCard`, `WorkspaceCard` | F328 (top-bar text) |
| B4 | `RecordsPage` with `derive/records.ts` | — |
| B5 | `AssayPage`, read from `/api/assays` and `/api/assay/<name>`, which exist; an opener wired for it (no control opens it today) and a behaviour gate | F352 |
| B6 | Studio removed, with the controller's `validateSpec` and `buildSpec`; their endpoints were deleted by the lens-audit roadmap | F353, F338, F355 |
| B7 | Vocabulary 0.4 as a new file: the five `SPEC_*` tags retired, three notes corrected; 0.3 stays locked | — |

**C. The session pane**

| # | Sprint | Findings |
|---|---|---|
| C1 | `InputBar`, `SlashMenu`, `SlashHint` with `derive/slash.ts`; `InputBar` takes the pane it serves as a prop, not its place in the template, so the editor view and the surfaces can mount it (D90) | — |
| C2 | `ActivityLine`, `TaskRows`; the activity scan computed once per snapshot | F350 |
| C3 | `FindBar` | — |
| C4 | Picker rows and keys in `derive/picker.ts` | F337, F339 |
| C5 | `PanePicker`, `WorkspaceColumn` | — |
| C6 | `ModelColumn`, `ChoiceLine` with `derive/driver_label.ts` | — |

**D. Meta**

| # | Sprint | Findings |
|---|---|---|
| D1 | `derive/stream.ts`: rows, lanes, spans, connectors, compared to `EnvelopeKind` values | F333 |
| D2 | `StreamLens` rows and `Inspector` | F328 (inspector) |
| D3 | `SideGraph` | — |
| D4 | `StructureLens` with `derive/structure.ts` | — |
| D5 | `IoLens`, `SceneLens` | — |
| D6 | `LanguageLens` over `web/reveal/language_lens.ts` | — |
| D7 | `MetaView`, `LensChips`, the split gutter; each lens takes its width from its container, so it draws in meta's right half and in the editor view's 400px right column (D81) | — |

**E. The window**

| # | Sprint | Findings |
|---|---|---|
| E1 | `derive/panes.ts`: split, close, grid weights | — |
| E2 | `PanesView`, `Pane`, `PaneSession`, gutters | F361 |
| E3 | `keymap.ts`: the window's keys, with ⌘C left to copying | F336 |
| E4 | `App` renders the whole window; `reveal.html` loads one module; `support.js`, `reveal_component.ts`, the two Vite plugins and `web/shims/` move to `_deprecated/dc-runtime/` | F327, F343, F344, F346, F321, F322 |
| E5 | React imported from `node_modules` as modules; the UMD copies go | F321 |
| E6 | A Content-Security-Policy in `reveal.html`: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'`. React's `style` props set styles through the DOM and fall outside `style-src`; the stylesheets load from `'self'`; no inline `<style>` element is left after A3–E4 | F320 (CSP), F344 |

**F. Findings outside the rendering**

| # | Sprint | Findings |
|---|---|---|
| F1 | The client and server agree on the error shape; the UI stops stripping `{"error":`; the spec stops pinning the old shape | F331, F349, F360 |
| F2 | `endSession` sends what the server reads | F330 |
| F3 | Envelopes append in constant time per envelope | F335 |
| F4 | The timeout message names the configured retry count | F340 |
| F5 | The signal buffer is bounded | F347 |
| F6 | Comments that name the classic shell are corrected | F348 |
| F7 | The login card's colours: 256-colour and truecolor SGR | F357 |
| F8 | Code fences accept `c++`, `objective-c`, `shell-session` | F358 |
| F9 | The delegate result's "descend" control focuses the child's pane, which UI sprint 183 already opens | F329 |

The F sprints touch `web/vm/` and `web/reveal/`, not the template, so they can run between any two sprints of A to E.

**G. Close**

| # | Sprint |
|---|---|
| G1 | Every gate on a fresh bundle: every script in `gates:electron` run alone, unit specs, Python, `vm_smoke`, all 28 pixel captures, `smoke:packaged`. The lens-audit rows for sprint 112 are marked closed in the ledger; sprints 112 and 113 are marked superseded by this plan and by its successor for packaging. |

## Decisions this plan records

| Decision | Grounds |
|---|---|
| Move area by area, not in one rewrite | The Architect's condition of 2026-10-08; Phase 8 moved the transcript this way and closed with the gates green (sprints 070–076); kit hard rule 6 |
| React 18.3.1, not 19, during the move | It is the version running today and the one the transcript was written against; a version change and a structure change in one step would hide each other's faults |
| One store module, no state library | `SessionController` already uses the `subscribe` / `getSnapshot` shape with `useSyncExternalStore`; a second pattern would be information leakage between two state models (*A Philosophy of Software Design*, chapter 5) |
| Styles move verbatim | The pixel gate holds only if they do; Phase 8 did the same |
| Retired files move to `_deprecated/dc-runtime/` | Kit: no deletions; the classic tree's retirement of 2026-09-22 is the precedent |
| Controls with no endpoint are removed; controls with one are wired | Sprint 112's card states the rule; `/api/assays` exists, no export endpoint does |
| Vocabulary changes only where it is faulty: five retirements and three note corrections, in a new 0.4 file | Kit hard rule 2 and `grammar/PRINCIPLES.md` (proposal types, version bump); the Architect, 2026-11-04: unchanged "unless it is faulty" |
| Each area moves in three sprints of at most two files | Kit hard rule 6; the red team counted four to five files per move as round 2 wrote them |
| One store file per area | A shared store file would be edited by every move sprint, breaking the two-file rule and putting every area's state in one place (*A Philosophy of Software Design*, information hiding) |
| The pixel gate writes fixed stand-ins in place of changing text | Relative times, the seconds counter, session ids, record ids, the reply digest and scratch paths differ on every run; masks over them changed width with the value (sprints 192, 198, 199) |
| Any differing pixel fails the pixel gate | Two clean launches differ by 0 pixels; at 0.1% a planted 60×60 block passed (sprint 194) |
| Three interfaces take the editor view's shape: `InputBar` takes its pane; each lens takes its width from its container; the store's open-view field names one view | Sheet turn 24 and spec r6 (`design/received/handoff 5/`): the prompt in every view (D90), the lenses in the editor's right column (D81), a key per view (D86); none changes what the move draws |
| `pixelmatch` added as a devDependency | Phase 8's gate used it; nothing in the tree compares images now |

## Open

- Electron 44 and the pixel baseline: Phase 8 captured in Playwright's Chromium; this plan captures in Electron, the shipped renderer. A2 records the Electron and Chromium versions with the baseline.
- `vm_smoke`'s `/help` failure is open on today's tree (runbook, "Known failures on the current tree"). The baseline records it; this plan neither fixes nor hides it.
