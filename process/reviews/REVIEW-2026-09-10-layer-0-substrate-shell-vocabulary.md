# Layer 0 review — substrate-shell vocabulary (grounded pass)

*2026-09-10 · a Layer 0 ratification check of the 34 shell + 10 substrate reference entity list against Prototype v7 as it renders, plus the sheet v3 turns 15/19/20 (core daily-driver lock), against sdd-kit-2/grammar/BOOTSTRAP.md Step 1, and against substrate source. Layer 0 is a transcription of what the design carries; no design change is proposed anywhere below.*

---

## Method

Reproducible steps. Run in this order to arrive at the same grounding.

1. **Read the kit in full.** `sdd-kit-2/AGENTS.md` (243 lines, twelve hard rules + procedures), `foundations/01-signal-driven-development.md` through `04-sdd-claude-design.md`, `grammar/PRINCIPLES.md` (eleven-layer stack), `grammar/BOOTSTRAP.md` (twelve-step Vocabulary Session procedure), `TECHNIQUES.md`, `ADDENDUMS.md` (Addenda A/B/C/D), `handoffs/README.md`, `lib/sdd.py`, `templates/*`. No `offset`/`limit`.

2. **Read substrate source that Layer 0's reference entities cite.** `substrate/src/substrate/session_registry.py` (1,462 lines) in full — every class, every enum, every method signature. `substrate/src/substrate/constants.py` (the twelve kernel lifecycle kinds and `VOCAB_VERSION="0.3"`). `substrate/src/substrate/topologies/session/vocabulary.py` (`SESSION_KINDS` frozenset, `SESSION_PRODUCER_KINDS`, `TRIGGER_IDS`, `SessionEndReason`, `ParkReason`, `SessionWarningKind`, `PromptSource`, `END_ON_EXIT_SENTINEL`). `substrate/src/substrate/topologies/tool_loop/delegate.py` (the `delegate` Tool, `SESSION_ENDED_MID_DELEGATE` wire tag at line 59). `substrate/src/substrate/kernel/runtime.py:483-512` (the `producer_kinds` write into `RunStarted.payload.topology`).

3. **Read the design docs in full.** `handoff_latest/docs/DESIGN-DECISIONS -through 2026-09-01-.md` (D1 through D72), `DESIGN-SPEC -2026-08-31-.md`, `APP-ARCHITECTURE -2026-09-01-.md`, `FUNCTIONALITY -2026-09-01-.md`, `MENU-BAR -2026-09-01-.md`, `P-DATA-AUDIT -2026-09-03-.md`, `PANE-MECHANICS -2026-09-01-.md`, `SLOT-IN-REVIEW -2026-09-08-.md`, `WINDOW-STRIP-EXPLORATION -2026-08-31-.md`. Every BUILD-ROADMAP revision r1 through r7 (for the arc, not for the design lock).

4. **Read Prototype v7 in full.** `handoff_latest/prototypes/Substrate Prototype v7.dc.html` (1,132 lines) — the `<x-dc>` template, `sc-if` / `sc-for` markup for every rendered surface, plus the `class Component extends DCLogic` state class with its `Scenario` tweaks (`firstRun`, `simulateRateLimit`, `columns`, `rows`, `view`, `transcriptFontSize`) and its keyboard handlers (`⌃`, ⌘D, ⌘F, ⌘,, Escape).

5. **Enumerate the sheet's turn structure.** `grep -nE 'id="t[0-9]+"' 'Substrate Shell Directions v3.dc.html'` produces the twenty section anchors. `grep -nE 'id="(15|16|17|18|19|20)[a-z0-9]?"'` produces every option id (15a-15i, 16a-16c, 17a-17g, 18d-18h, 19a-19m, 20a-20g). Turn 15 is the design lock (`data-screen-label="Turn 15 — the locked design, authored"`); turns 16, 17, 18 carry the `SPECULATIVE` badge in their headers; turns 19 and 20 are core additions past the lock (workspace binding + delegate descent).

6. **Read sheet v3 core turns in full.** Turn 15 (lock) options 15a-15i, turn 19 options 19a-19m, turn 20 options 20a-20g, plus turns 12-14 (audit trail leading to the lock) and 16/17/18 (extensions, out of core). File is 3,287 lines; the reads are targeted by anchor.

7. **Install a headless renderer.** `mkdir -p scratchpad/pw && npm init -y && npm i playwright && npx playwright install chromium`. Chromium lands under `~/Library/Caches/ms-playwright/chromium_headless_shell-1243`.

8. **Serve the design bundle over HTTP.** `python3 -m http.server 8788 --bind 127.0.0.1` inside `handoff_latest/`. Verify with `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8788/prototypes/Substrate%20Prototype%20v7.dc.html` → `200`.

9. **Drive Prototype v7 through every user-reachable state.** Playwright script (`scratchpad/pw/shoot.js`) launches Chromium at 1400×900, navigates to the served URL, and captures 21 shots: single-pane terminal, ⌘D split (which is D66f's workspace picker), ⌘D again (three panes), reveal, inspector open on a stream row, `i/o` lens, `structure` lens, `scene` lens, side graph, records surface, assay surface, studio form, studio canvas, find bar, settings dialog, delegate inline expanded, descent one level, descent two levels, fan-out expanded, fan-out child descent, prompt with `/exit`. PNGs saved to disk.

10. **Drive sheet v3 through each turn.** A second Playwright script (`shoot_sheet.js`) scrolls each turn's anchor into view and captures three viewport crops per turn (turns 15, 19, 20 for core; 16, 17, 18 for extensions; 12, 13, 14 as audit trail sample). 27 crops total.

11. **Read every screenshot.** Each PNG is opened and interpreted; every rendered element is named against the 34-shell + 10-substrate entity list.

12. **Cross-check.** For each entity, name the design line (D-number, FUNCTIONALITY row, PANE-MECHANICS invariant, or sheet option id) and the rendered element (shot number, prototype line, or sheet section) that carries it. For each rendered element, name the entity in the list that covers it. Any element without an entity, or entity without an element, is a transcription miss; report it.

13. **Verify substrate reference entities against source.** `SessionManifest` fields at `session_registry.py:96-149`, `SessionStatus` StrEnum at 65-77, `WorkspaceShape` StrEnum at 80-90, the twelve public methods, `TurnHandle` at 207-217, `SESSION_ENDED_MID_DELEGATE` at `delegate.py:59`, the ten session vocabulary kind strings at `vocabulary.py:73-100`, the twelve kernel lifecycle kind strings at `constants.py:41-52`.

Total time from a cold repo: the reads dominate. The renders run in seconds once Playwright is installed. The check itself is a walk of two lists — the entity list once forward, the design surface once — and takes minutes.

---

## Grounding at a glance

- **Design lock:** Prototype v7 + DESIGN-DECISIONS D1-D72 + FUNCTIONALITY.md thirty-seven rows + PANE-MECHANICS.md.
- **Core daily-driver = turns 15 + 19 + 20.** Turn 15 is the lock (options 15a-15i cover terminal + delegate inset, revealed with lenses, other lenses, records, assay, studio form, studio canvas, split-once, split-2×2). Turn 19 is the round-2 gap close (workspace binding on ⌘D, blank new window ⇧⌘N, first-run picker, settings ⌘,, export dialog, end-session confirm, find in three scopes, rate-limited, depth-cap refusal). Turn 20 is delegate descent (descend one level, two levels, non-talkable, nested-descent setting, nested two levels, depth-hue ramp, fan-out).
- **Extensions = turns 16, 17, 18.** Editor level (16), contextual modes: markdown / plain shell / images / video / audio / translation / design mode (17), mobile (18). Speculative per D47 / D48-D53 / D61. Out of core.
- **Substrate reference: ten entities.** Session, Record, Envelope, Producer, Driver, Workspace, Bundle, Tools, Turn, DelegateCall.

---

## Turn 15 — DESIGN LOCK: what actually renders

**15a — terminal + delegate inset.** One full header carries wordmark + status dot + name (`fix-race-in-metering`) + driver chip (`kimi-k2 ▾`) + workspace chip (`⌥ substrate/fix-race`) + `records` · `studio` · `⌃` reveal`. Transcript prints session-resume line, a user turn, tool cycles (`grep "meter_lock" src/`, `read_file src/substrate/metering.py`, `edit_file`), a user turn, the delegate ⑂ line, a bash cycle, the final answer, and `◐ parked`. The DelegateInline expands into a child inset with header `⑂ child · reviewer-a · standing · record delegate_child_3e366fe6_c0 · depth 1/2 · done` and body (child tool reads plus folded-back answer). Prompt at bottom. Footer: `● live · clean · record 01M1684 · 244 events · ⌃` toggles the reveal`.

Entities carried: **Window, PaneHeader, DriverChip, WorkspaceChip, Prompt, Transcript, DelegateInline, Footer.**

**15b — session revealed.** Left half holds the transcript. Right half opens with Lens chips (`stream+graph · i/o · structure · scene`) plus `all / app` and `⇅ down / → side` toggles. Stream rows carry `seq · t · kind · producer · gist` per D26; every row has a per-kind lane cell strip on the left in Down mode. Row 240 (`ToolResult`) is selected; the Inspector attaches directly under it — `INSPECT · ToolResult · seq 240 · click the row again to close` — with `SCHEMA tool_loop.ToolResult`, `TIME t+47s into turn 9`, `PRODUCER tool · bash`, `OUTPUT.STDOUT` block (`24 passed in 4.12s`), `PAYLOAD` JSON. Below the inspector the stream continues with `242 FinalAnswer`, `243 TriggerFired park-on-final-answer → park`, `244 Park park · await UserMessage`.

Entities carried: **Reveal, Lens, Stream, SideGraph** (the lane cell strip is SideGraph rendered as an inline column in Down mode), **Inspector.** Substrate reference entities visible in the render: Envelope (schema · time · producer · payload), Producer (per-kind lanes), Trigger (`park-on-final-answer` row), Turn (`turn 9` in the INSPECT block).

**15c — the other lenses.** Four crops side by side: `GRAPH · → SIDE` (SideGraph in side-gantt mode with per-producer horizontal bars — model · grep · read_file · edit_file · ⑂ reviewer-a · bash · park), `LENS · I/O` (UserMessage input at seq 214, ToolResult · delegate output at 235, FinalAnswer · output at 242), `LENS · STRUCTURE` (Producers `model ▸ initial` / `tool` / `park` / `session_end` with what each emits; Triggers `fire-tool on ToolCall → tool`, `refire-model on ToolResult → model`, `park-on-final-answer on FinalAnswer → park`, `end-on-request on SessionEndRequested → session_end`; Termination policy `any_of(pause_await_input(on Park, resume="UserMessage"), threshold_count(SessionEnded, 1))`), `LENS · SCENE` (`Generation.grid` at seq 38, a 12×12 cell grid).

Entities carried: **Lens** with a `kind` field covers all four modes. Substrate reference: Producer, Trigger, Envelope schemas visible.

**15d — records.** WORKSPACES groups (`~/code/substrate git · sessions get worktrees`, `~/notes/substrate-docs flat`, `~/.substrate sandbox`); under each group, sessions with nested delegate children (`fix-race-in-metering ◐ parked · turn 9`, `⑂ reviewer-a standing · 3 calls · ⑂ 2 one-shot children · folded under their turns`, `swebench-repro finalised tue · ✓ clean`, `docs-pass ◐ parked 41m · claude-cli`, `scratch ● running · deepseek-r1:8b · ~/.substrate/sessions/s_9b2…/workspace`). ASSAYS section (`rev_kimi_vs_glm 4 arms × 32 cases × 3 trials · 384 cells · finding ready · open ▸`, `coding_cells 4 arms · 2840 cells`). Raw records `debug pile, collapsed ▸`.

Entities carried: **Records, Collection** (Workspaces is the collection's default grouping), **Session** (substrate ref), **Assay** referenced.

**15e — assay board.** `rev_kimi_vs_glm` header (`4 arms × 32 cases × 3 trials · 384 cells · preregistered · arms_hash ✓`), FINDING banner (`kimi + reviewer-glm beats control kimi_solo · Δ-pass¹ +.17 · paired bootstrap p=.008 · BH-FDR significant`), UNDERPOWERED banner in red for adversarial cases, grid with columns ARM · OVERALL PASS¹ · EASY/MED/HARD/ADV · Δ vs control · verdict, plus a narrative note.

Entities carried: **Assay.**

**15f — studio form.** TOPOLOGY NAME `adversarial_pair_review`, PRODUCERS rows (`builder · initial · emits Draft`, `attacker · emits Critique`, `judge · emits Verdict`), VIEWS (`draft_count = KindCount(of Draft)`, `critique_buf = KindBuffer(of Critique)`), TRIGGERS (`attack · when draft_count ≥ 1 · → starts attacker`, `adjudicate · when critique_buf ≥ 2 · → starts judge`), ROUTES (`seed-judge · stages Draft → slot judge.draft`), TERMINATION POLICY chips (`quiescence_with_watchdog · all_completed · threshold_count · cancel_all_others · any_of · all_of`), responder deterministic/ollama, seed, model, validate, build & launch ▸.

Entities carried: **Studio.** The Producers/Views/Triggers/Routes/TerminationPolicy inside are Studio's payload structure per D27, not separate entities.

**15g — studio canvas.** Node graph: `builder emits Draft ▸ initial` card, `attacker emits Critique` card, `judge emits Verdict` card, solid trigger edge labels (`attack · draft_count ≥ 1`, `adjudicate · critique_buf ≥ 2`), dashed route edge `seed-judge · Draft → judge.draft` into `slot: draft` node. Same responder/build strip below.

Entities carried: **Studio** (form ⇄ canvas per D27 — one entity, two rendering modes).

**15h/i — split once, split 2×2.** Identical full pane headers per pane per D42 (`substrate · <name> · <driver> ▾ · ⌥ <workspace> · records · studio · ⌃` reveal` on each). WindowStrip present.

Entities carried: **Pane, PaneHeader, WindowStrip, Gutter, DropHint** (drop-zone highlight during drag per PANE-MECHANICS).

---

## Turn 19 — Round-2 gap close: what actually renders

**19a — ⌘D fresh pane workspace picker.** Two panes. Second pane header (`substrate · s-7f2c · kimi-k2 ▾ · ⌥ —`), empty body, a **WORKSPACE** panel at the bottom (`~/code/substrate inherit ↵`, `~/notes/substrate-docs recent`, `~/code/swebench-repro recent`, `~/.substrate/sandbox sandbox`, `choose folder… ⌘O`) plus a prompt line (`> type a path — ⇥ completes · ↑↓ pick · ↵ bind + start`). The unbound pane's Prompt IS the picker (D66f).

Entities carried: **Pane** (unbound state) + **Prompt** (as picker). No WorkspacePicker entity is needed; Prompt covers the picker rendering per Layer 5 state-transition rule.

**19b — blank new window ⇧⌘N.** Same picker rendering, full-screen, no session lines above.

Entities carried: **Window + Pane + Prompt.**

**19m — first run.** The same prompt-line picker leads with `DRIVERS ON THIS MACHINE`: `ollama · local ▾` expands to `localhost:11434 · 3 models` — `llama3.2 3.2 GB last used never`, `qwen3:8b 5.2 GB`, `gemma3:4b 3.3 GB`; `ollama · cloud ▸ not signed in`; `claude (cli) found on PATH`; `claude (api) · openai (api) no keys in env — add in settings ⌘,`; `deterministic built in · replay-stable · no network`. Then `WORKSPACE ~/Documents/substrate default · created on bind`.

Entities carried: **FirstRun.** The Driver reference entity is verified here at the enumeration.

**19c — settings ⌘,.** `appearance dark/light/system`, `type size 13px` with −/+ steppers and slider, `bindings` list: `reveal cycle ⌃``, `split right / down ⌘D · ⌘⇧D`, `full-line divider drag ⌥ drag`, `plain terminal pane ⌘⇧T`.

Entities carried: **Settings.** The `plain terminal pane` binding row appears in the core settings dialog; the pane feature itself (D59) ships with extension 17 — a build-sequencing note, not a Layer 0 question.

**19f — export record dialog.** `EXPORT RECORD · 01M1684 · fix-race-in-metering · 244 ev`. Two choices: `.record directory · segments + manifest + blobs + sidecar — replayable ↵` (highlighted) or `events.jsonl · flat, single file — read-only`. Destination `to ~/exports/fix-race-in-metering.record`. `cancel esc / export ↵`.

Entities carried: **ExportDialog.**

**19g** end-session confirm, **19h/19k/19l** find in stream / transcript / revealed-transcript scopes, **19i** rate-limited (as a Transcript row derived from `SessionWarning`), **19j** delegate depth-cap refusal at depth 2 (as a failed `ToolResult` in the DelegateInline): all present in the sheet at their option ids and mapped to the entities **EndConfirm, Find, Transcript+SessionWarning, DelegateInline+Descent** respectively.

---

## Turn 20 — Talking to a delegate: what actually renders

**20a — descend one level (default).** Transcript shows ONLY the child (D70). `⑂ delegate → reviewer-a "check the stripe-count derivation" · running · depth 1/2 · you are here ▾`. `reviewer-a · glm-4.6 · child record delegate_child_3e36 · 12 events`. Tool reads. `The derivation holds for N≥4 stripes; below that CAS retry cost dominates. Checking the boundary case now.` `◐ parked — awaiting your message`. Path row `fix-race-in-metering › ⑂ reviewer-a · esc back to session`. Prompt (violet caret + border) `> message reviewer-a · / commands`. Footer `● live · clean · record delegate_child_3e36 · 12 events · ⑂ depth 1/2`.

Entities carried: **Descent, DelegateInline, Prompt, Footer.**

**20b — two levels down.** `⑂ delegate → verifier "re-derive independently" · running · depth 2/2 · you are here ▾`. Path row grows: `fix-race-in-metering › ⑂ reviewer-a › ⑂ verifier · esc back to reviewer-a`. Prompt (deeper violet) `> message verifier — delivers at its next park · / commands`.

Entities carried: **Descent** stack depth = 2 renders correctly.

**20c — non-talkable child.** New session (`swebench-repro-2 · claude (api)`). `⑂ delegate → test_runner "run the full suite, report failures" · running · you are here ▾`. `test_runner · tool-only topology · child record delegate_child_c771 · 31 events`. Tool reads. `running — this topology takes no messages`. Path row `swebench-repro-2 › ⑂ test_runner · watching · esc back to session`. **No prompt box.**

Entities carried: **Descent** with talkability = false. Prompt correctly absent (topology property, not Descent state).

**20d — nested descent (setting on).** Turn 8 · seq 198 dimmed above (`the metering test flakes under load — find and fix the race`, `grep "meter_lock" src/ · 14 matches`, `read_file src/substrate/metering.py · 312 lines`, `The race is in _emit_log — an unlocked deque shared by two producers…`), then turn 9 · seq 214 active section with the same descent as 20a but parent text visible around it.

Entities carried: **Settings** (nested_descent toggle) + **Descent** (nested render).

**20e** nested two levels, **20f** depth-hue ramp five levels (the D70 universal rule of depth accent interpolating blue → violet), **20g** fan-out with the child list expanding under the ⑂ line: all rendered in the sheet at option ids, and covered by **Descent, DelegateInline, FanOutInline.**

---

## Coverage — the walk both directions

**Forward: every entity in the 34 shell + 10 substrate list maps to a design line.**

| Entity | Design line |
|---|---|
| Window | D57 (collection carries every window), D63 (⌘⇧N New Window) |
| WindowStrip | D43 + D46 (blank strip on split), WINDOW-STRIP-EXPLORATION.md |
| Pane | D35 (session = splitting), D44 (no tabs), FUNCTIONALITY rows 5-15 |
| PaneHeader | D42 (identical header per pane), 15a-15i, FUNCTIONALITY row 8 |
| DriverChip | D33, D42 header, FUNCTIONALITY row 9, rendered in 15a and 19a |
| DriverDropdown | D33 (picking PATCHes the live session), v7's `pn.ddOpen` popover |
| WorkspaceChip | D33, D42 header, FUNCTIONALITY row 10 |
| WorkspacePopover | D33 (popover: path · shape · branch · frozen at seq 1) |
| Prompt | D3 (prompt-line router), D66f (unbound pane's prompt IS picker), rows 16-17 |
| SlashRouter | D3 (grows upward from prompt, real slash inventory) |
| SlashCommand | D3 explicit list (/list /run /inspect /narrate /diff /replay /studio /context /model /tools) |
| Transcript | D2 (whole app is one session transcript + prompt at rest), D40 |
| DelegateInline | D38 (⑂ line + attached inset + fold-back), D41 (depth), 15a inset |
| FanOutInline | D72 ("⑂ delegate → 3 children · 2 running · 1 parked" expands), 20g |
| Descent | D70 (descend focus into child; path row; esc climbs one level) |
| Reveal | D4 (⌃`, Ableton mixer style) |
| Lens | D10 (stream+graph one view), D20 (four lenses), 15b/15c |
| Stream | D10, D26 (whole record, seq · t · kind · producer · gist) |
| SideGraph | D21 (⇅/→ toggle), D22 (lane tracks through inset), D29 (per-producer-kind lanes), D30 |
| Inspector | D11 (attaches to click), D22 (same click closes), D24 (anatomy) |
| Surface | D5 (summoned surfaces — the class) |
| Records | D5, D28 (workspace-grouped), 15d, FUNCTIONALITY row 28 |
| Assay | D5, D13, D18 (own surface), 15e, FUNCTIONALITY row 29 |
| Studio | D5, D24, D27 (form ⇄ canvas), 15f/15g, FUNCTIONALITY rows 30-32 |
| Find | D19h/k/l (⌘F transcript AND stream), v7 parity note |
| Settings | D19c (appearance/type/nested/bindings), D66 (SQLite app-state) |
| ExportDialog | D19f (.record dir or events.jsonl) |
| EndConfirm | D19g (/exit → confirm), D66h (confirm dialogs are UI, not narration) |
| FirstRun | D69 (first-run driver picker with drivers section) |
| Footer | D40 (session info in header), Sprint 040 SessionEnded footer, per-pane bottom |
| DropHint | PANE-MECHANICS ("highlighted half-region IS the contract") |
| Gutter | PANE-MECHANICS ("basic drag resizes only the two panes adjacent"), row 12 |
| Collection | D57 (gathered things + layout), D68 (ephemeral) |
| Anchor | Architect 2026-09-08 non-negotiable ruling |
| Session (ref) | `session_registry.py:96-149` SessionManifest |
| Record (ref) | `session_registry.py` record_root + P-DATA-AUDIT |
| Envelope (ref) | P-DATA-AUDIT § "The real envelope" — {crc, kind, payload, producer, schema, seq, t} |
| Producer (ref) | `kernel/runtime.py:483-512` producer_kinds, D29 |
| Driver (ref) | `substrate.reference` Ollama/Cli/Deterministic Responder, D33/D37/D69 |
| Workspace (ref) | `session_registry.py` workspace + workspace_shape, D14 |
| Bundle (ref) | `session_registry.py:113` SessionManifest.bundle |
| Tools (ref) | `session_registry.py:117-120` SessionManifest.tools |
| Turn (ref) | `session_registry.py` turn_index / next_turn_index / turn_sync, session vocab UserMessage + Park |
| DelegateCall (ref) | `substrate/topologies/tool_loop/delegate.py` Tool "delegate", D38 |

**Backward: every load-bearing rendered element in turns 15/19/20 maps to an entity.**

- Row 1 ⌃` — Reveal ✓
- Row 3 ⌘D/⌘⇧D split — Pane ✓
- Row 5 split creates session — Pane + Session ✓
- Row 6 focus by brightness — Pane field ✓
- Row 7 rename — PaneHeader action ✓
- Row 8 identical header — PaneHeader ✓
- Row 9 driver ▾ — DriverChip / DriverDropdown ✓
- Row 10 ⌥ workspace popover — WorkspaceChip / WorkspacePopover ✓
- Row 11 records / studio / ⌃` per-pane — Records / Studio / Reveal ✓
- Row 12 drag pane boundaries — Gutter ✓
- Row 13 ⌠ grip swap — action on PaneHeader (PANE-MECHANICS grab surface) ✓
- Row 14 sessions persist — Session ✓
- Row 15 lights strip — WindowStrip ✓
- Row 16 prompt-line router — Prompt + SlashRouter ✓
- Row 18 delegate line — DelegateInline ✓
- Row 19 lens chips — Lens ✓
- Row 20 all/app toggle — Stream field ✓
- Row 21 ⇅/→ graph toggle — SideGraph field ✓
- Row 22 click stream row → inspector — Inspector ✓
- Row 23 side-graph bars clickable — SideGraph ✓
- Row 24 reveal follows focused pane — Reveal + Pane ✓
- Row 25 revealed header live — PaneHeader ✓
- Row 26 drag transcript/machinery boundary — Gutter ✓
- Row 26b scroll sync between Stream and SideGraph — interaction rule ✓
- Row 27 delegate click-through in revealed — DelegateInline ✓
- Rows 28-32 records/assay/studio surfaces — Records / Assay / Studio ✓
- Row 33 surfaces toggle back — Surface / esc action ✓
- Rows 34-37 chrome rules (labels never wrap, no narration, one status dot, logo dot = session status) — D31/D32/D40/D45 chrome rules, not entities ✓

Nothing rendered has no entity. Nothing on the entity list has no design line.

---

## Extensions (turns 16, 17, 18) — correctly out of core

**Turn 16 (editor level, SPECULATIVE).** Options 16a full editor (explorer + editor + substrate terminal below + machinery right), 16b the ⌃` cycle (terminal → reveal → editor), 16c everything-collapses (explorer to rail, machinery to rail, terminal to sill). Speculative per D47 lock + D48-D53 speculative block.

**Turn 17 (contextual modes, SPECULATIVE).** Options 17a documents in WRITE mode, 17b plain shell as a tab (⌘⇧T; D59), 17c image editor (crop/resize/annotate/convert/analyze), 17d video editor (session cuts + hand edits), 17e audio editor (waveform), 17f translation long shot (translate_in/translate_out producers; D65), 17g design mode (chat + canvas, HTML/CSS sheets; D71).

**Turn 18 (mobile, SPECULATIVE).** Options 18d home (session stack + tab bar), 18e level 2 typing (system keyboard + accessory row), 18f swipe-up reveal, 18g records (desktop canon), 18h level 1 voice-first (Speech framework, on-device). Speculative per D61 sync-only.

These twelve entities that WOULD show up under extensions — Editor, ExplorerRail, MachineryRail, TerminalSill, EditorTab, DocumentSurface, ImageEditor, VideoEditor, AudioEditor, TranslationChip, DesignMode, MobileSessionStack — are correctly absent from the current Layer 0. They belong to v0.2 when the extensions ratify.

---

## The five surfaced items — grounded rulings

1. **DelegateInline ↔ DelegateCall keep separate.** Concur. v7 renders the ⑂ line + inset in 15a as a shell surface; `topologies/tool_loop/delegate.py` owns the wire call. Two layers, two entities.
2. **FanOutInline ↔ multi-child DelegateCall keep separate.** Concur. v7's `fanRows` + `⑂ delegate → 3 children` line (grep `fanOpen` in v7:96-104) is a shell rendering with walk-and-descend interactions; the underlying substrate call is one delegate.
3. **SplitTree — defer.** Confirmed by FUNCTIONALITY.md "Known-not-implemented" naming drop-on-half re-split behind FD-2. v7 renders the flat grid via `paneCols`/`paneRows`. Defer.
4. **Editor level modes — defer to v0.2.** Confirmed by the D47 lock at turn 15 and by turn 16-17-18's SPECULATIVE badges.
5. **Native macOS menu bar — not in Layer 0.** Confirmed by MENU-BAR.md Rule 4 ("the menu bar is a build-phase artifact of the real app shell"). Menu items map to shell verbs; not an entity.
6. **RateLimitedWaiting — no separate entity.** Confirmed by D66g ("no new chrome") and by rationale doc; renders from `SessionWarning` (substrate wire) as a Transcript row.

---

## Fine-grain observations (not proposed changes)

- **Anchor obligations are already satisfied by paint the design carries.** The pane status dot color per D31 (`pn.dot`, blue running / dim parked / red failed / teal rate-limited) is a live pixel witness — the harness reads the color at (0,0)-of-pane-header. The reveal-button background (`revealBtnBg`) is a live pixel witness for Reveal state. The delegate depth-hue accent per D70 (blue → violet interpolation on the ⑂ line + prompt border + path chip) is a live pixel witness for Descent depth. Purpose-built 1×1 micro-anchors are needed only for state that has no paint (last-emitted-tag byte, harness heartbeat).
- **Non-talkable child renders without a Prompt (20c).** Talkability is a topology property, not a Prompt state. Descent carries a talkable boolean; Prompt is absent when false.
- **Footer carries Descent-derived fields.** `⑂ depth 1/2` in the descended footer (20a) is Footer rendering a Descent-derived field. Footer has fields sourced from multiple entities (Session status, Descent depth, Record id, event count) — not a decomposition problem.
- **The workspace picker IS the Prompt in unbound state (19a).** No separate WorkspacePicker entity is needed. Layer 5 will express this as a Pane state-transition rule: `unbound Pane's Prompt renders as the workspace list plus type-a-path input`.

---

## Two administrative corrections

- **Count.** Header reads `Shell-owned entities (33)`; list contains 34 (Anchor is the 34th). Correct to 34.
- **Substrate reference count.** 10 as listed. If Bridge / Role / Trigger / PromptFragment / SessionWarning are added on the substrate-side per the earlier note, becomes 15. The Architect's call, not a Layer 0 correctness question.

---

## Ratification verdict

**Layer 0 transcription is faithful.** The 34 shell + 10 substrate reference entity list carries every load-bearing rendered element in the core daily-driver design lock (turns 15 + 19 + 20) and every design surface in DESIGN-DECISIONS D1-D72 / FUNCTIONALITY.md / PANE-MECHANICS.md. Extensions (turns 16, 17, 18) are correctly deferred to v0.2. The five surfaced items are ruled as the design ratified them.

**Layer 0 ready.** Proceed to Layer 1 (per-entity tag names) under BOOTSTRAP.md Step 2.

---

## Artifacts on disk (this session's grounding)

- 21 prototype v7 state screenshots at `/private/tmp/claude-501/-Users-peterlaffey-Documents-Claude-Projects-Agent-Orchestration/c36d9740-2a4a-4416-8a0c-425a74b50540/scratchpad/pw/shots/`.
- 27 sheet v3 turn crops (turns 12-20) at `/private/tmp/claude-501/-Users-peterlaffey-Documents-Claude-Projects-Agent-Orchestration/c36d9740-2a4a-4416-8a0c-425a74b50540/scratchpad/pw/sheet_shots/`.
- Playwright drivers at `/private/tmp/claude-501/-Users-peterlaffey-Documents-Claude-Projects-Agent-Orchestration/c36d9740-2a4a-4416-8a0c-425a74b50540/scratchpad/pw/shoot.js` and `shoot_sheet.js`.
- Chromium at `~/Library/Caches/ms-playwright/chromium_headless_shell-1243`.
- HTTP server on `http://127.0.0.1:8788` (background; kill when done).
