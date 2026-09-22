# WORKING_AGREEMENT.md — terminal-v1

*Per-project overrides on top of `../../sdd-kit-2/AGENTS.md`. The Agent reads AGENTS.md first (methodology) and then this file (project specifics). When the two conflict, AGENTS.md wins.*

---

## Project identity

- **Project name:** terminal-v1
- **Project type:** browser-served UI (a reader/projector over the substrate runtime; no server of its own — reuses parent substrate-ui's `server.py`)
- **Primary language(s):** JavaScript (vanilla, no build step); Python (only for the harness scripts that invoke Playwright)
- **Primary build commands:** none — no build step. The parent substrate-ui's `server.py` serves `terminal-v1/web/` alongside `web/`.
- **Adopted SDD kit version:** `sdd-kit-2` at `../../sdd-kit-2/`

## Project scope (verbatim from BLACKBOARD ## Decisions)

> **2026-08-14** — Project scope: terminal-v1 is a rearrangement of the running substrate-ui into a tabs-across-the-top layout with the Agent Terminal as the front door. Eight peer tabs (Agent Terminal, Run Records, Assays, Run-as-graph, Topology structure, Bus event stream + Inspector, I/O, Studio). Same JS as parent, same visuals, new arrangement, new folder alongside `substrate-ui/web/`. Destination spec: `../../design/terminal-v1/visual-redesign.md`. Sprint plan: `../../design/terminal-v1/sprint-plan.md`. No skin change, no new tech, no substrate-side changes in this arc.

## Canonical home registry

Per AGENTS.md hard rule 7. Updated at each sprint close as components land. Empty rows are the future targets — filled when the corresponding Wave 2 pane-port sprint closes.

| Type / module | Canonical home | Landed |
|---|---|---|
| `activate(testid)` (tab switch — toggles aria-selected + `.pane-active` + `.anchor.active` + `STATE.activeTab`) | `web/app.js` | 004, extended 005 |
| Anchor strip DOM + `.anchor.active` class contract | `web/index.html` (`.anchor-strip`) + `web/app.js` (`activate`) | 003 |
| Tab bar DOM (eight `<button role="tab">` per `visual-redesign.md`) | `web/index.html` (`.tabbar`) | 003 |
| Pane region + `.pane[data-pane-for=<testid>]` sections | `web/index.html` (`.pane-region`) | 005 |
| `STATE` (project-wide app state, exposed on `window.__TERMINAL_V1_STATE`) | `web/app.js` | 006, extended for testability |
| `STATE.activeTab` | `web/app.js` (mutated by `activate()`) | 004 |
| `STATE.term` (lines / history / hi cursor) | `web/app.js` | 006 |
| `renderTerm()` + `termPush()` + `escapeHtml()` (agent-terminal echo) | `web/app.js` (ported from parent `substrate-ui/web/app.js:776,792`) | 006 |
| Agent Terminal DOM (`#termbody`, `#termprompt`, `#terminput`, `.term-*` CSS) | `web/index.html` (in the agent-terminal pane) + inline `<style>` | 006 |
| `loadModels()` + picker `change` handler + `updatePromptForModel()` | `web/app.js` | 007 |
| Model picker DOM (`.term-head`, `#modelpicker`, `.term-model` CSS) | `web/index.html` + inline `<style>` | 007 |
| `STATE.term.model` + `STATE.modelsLoaded` | `web/app.js` | 007 |
| `LAST_MODEL_KEY = "terminal-v1.lastModel"` (localStorage key) | `web/app.js` | 007 |
| `_agentLine(e)`, `sendChat(task)`, `pollRun(name)` | `web/app.js` (ported from parent `substrate-ui/web/app.js:246,281`) | 008 |
| `STATE.term.runName`, `STATE.term.agentSeq`, `STATE.term.polling` | `web/app.js` | 008 |
| `dotColorFor(r)`, `loadRecords()`, `selectRecord(name)` | `web/app.js` (ported from parent `substrate-ui/web/app.js:48–102,389`) | 009 |
| `STATE.records`, `STATE._currentRecord`, `STATE.recordsLoaded` | `web/app.js` | 009 |
| Records DOM (`.records-layout`, `#recordsrail`, `#recordstopbar`, `#recordsbottombar`, `.rec`, `.rail-group`, `.dot`, `.nm`, `.meta`) | `web/index.html` (in the records pane) | 009 |
| `_shortKind(k)`, `_gist(ev)`, `renderStream()`, `inspectEvent(seq)`, `renderInspector()`, `renderEventTransport()` | `web/app.js` (ported from parent `web/app.js:654,692`) | 010 |
| Event stream + Inspector DOM (`.es-layout`, `#eventstream`, `#inspector`, `#eventtransport`, `.stream-line`, `.inspector`) | `web/index.html` | 010 |
| `STATE.events`, `STATE.selectedEvent` | `web/app.js` | 010 |
| `renderIO()`, `ARTIFACT_KINDS` | `web/app.js` (ported from parent `web/app.js:480`) | 011 |
| I/O DOM (`#iopane`, `#io-input`, `#io-artifacts`, `.io-artifact`) | `web/index.html` | 011 |
| `loadTopology()`, `renderTopology()` | `web/app.js` (ported from parent `web/app.js:579`) | 012 |
| `STATE.topology`, Topology DOM (`#topopane`, `.topo`, `.grp`, `.pr`, `.tg`, `.vw`, `.rt`, `.tm`) | `web/app.js` + `web/index.html` | 012 |
| `loadRunGraph()`, `renderGraph()`, `STATE.runGraph` | `web/app.js` (ported from parent `web/app.js:524`, text-only summary — SVG lanes deferred) | 013 |
| Run-as-graph DOM (`#graphpane`, `.graph`, `.row`, `.idx`, `.k`, `.rng`, `.st`) | `web/index.html` | 013 |
| `loadAssays()`, `selectAssay(name)`, `STATE.assays`, `STATE.selectedAssay`, `STATE.assayReport`, `STATE.assaysLoaded` | `web/app.js` (own picker per Architect ruling — Assays are cross-record) | 014 |
| Assays DOM (`.assays-layout`, `#assayspicker`, `#assaysbody`, `.assay-item`, `.field`) | `web/index.html` | 014 |
| Studio placeholder (`#studiopane` text `studio — port pending`) | `web/index.html` — **iframe rewritten out per ruling 8 (no iframes ever); real port is out of the current arc** | 015 |
| `renderRecords` (Records rail + top+bottom bars, records-tab-only visibility) | `web/app.js` | pending |
| `renderAssays` (Assays board + its own subject picker) | `web/app.js` | pending |
| `renderRunAsGraph` (dynamic run-as-graph, ported from parent `renderGraph`) | `web/app.js` | pending |
| `renderTopologyStructure` (static structure view, ported from parent `renderTopology`) | `web/app.js` | pending |
| `renderEventStreamInspector` (stream + inspector + transport bar) | `web/app.js` | pending |
| `renderIO` (seed / baseline / artifacts) | `web/app.js` | pending |
| `renderStudio` (folded from parent `web/studio.js`) | `web/app.js` | pending |
| `_currentRecord` (subject-rule state: whatever record is selected in Records) | `web/app.js` (STATE) | pending |

If a sprint surfaces a "where does this live" question, surface to BLACKBOARD; the Architect's answer goes here.

## External SDK bridge mappings

None. terminal-v1 has no external SDK dependencies. The parent substrate-ui's `harness/` inherits its pinned Playwright devDep (`../package.json` — `playwright ^1.49.0`); terminal-v1's harness reuses that install, not a fresh one.

## Vocabulary discipline overrides

**Per Addendum A9 (`../../sdd-kit-2/ADDENDUMS.md`) — terminal-v1 is a reader/projector UI over substrate's locked vocabulary and needs no `signals/` lock of its own.** No `signals/0.1.json`, no Vocabulary Session, no schema-at-the-mouth for terminal-v1 tags because there are no terminal-v1 tags. Signals the app captures for observation-contract purposes ride the parent substrate-ui's DOM-event conventions (existing test hooks in `substrate-ui/harness/`).

The reader/projector's founding contract is the **tone canon** below, not a vocabulary lock.

## Build and verification commands

- **Serve the app:** `cd substrate && uv run python ../substrate-ui/server.py` — same command as parent substrate-ui. terminal-v1 is served at `http://127.0.0.1:8765/terminal-v1/` (path to be added to server.py in Sprint 1.1 as a static route).
- **Structural E2E:** `cd substrate-ui && npm run e2e:terminal-v1` (script added in Sprint 0.2).
- **Perceptual capture:** `cd substrate-ui && npm run capture:terminal-v1` (script added in Sprint 0.2).
- **Regenerate demo fixtures if needed:** `cd substrate && uv run python ../substrate-ui/gen_demo_records.py` (same as parent).

## Observation contract environment

- **Simulator / runtime environment:** headless Chrome via Playwright (`playwright` devDep of the parent substrate-ui, pinned in `../package-lock.json`).
- **Boot command:** the harness `page.goto('http://127.0.0.1:8765/terminal-v1/')` after the parent server is up.
- **Screenshot command:** `page.locator(selector).screenshot({ path: 'screenshots/<state>.png' })` — element-shots of bounded surfaces (Addendum A2, A6); no fullPage captures.
- **UI driving tools available:** Playwright `page.click`, `page.type`, `page.waitForSelector`, `page.evaluate`. Never `sleep` — always wait on a real condition (Addendum A4).

## Hand-author authorization log

*(empty until first authorization)*

## Tone canon

**Reader/projector's founding contract (per Addendum A9).** Every string a user reads in terminal-v1 honors:

- **Register:** plain. E.B. White + Orwell. No marketing language, no cutesy chat-UI copy, no adjectives that lean.
- **Case:** lowercase for status text, prompts, hints, empty-state messages. Sentence case for record titles and user-typed input.
- **Forbidden:** exclamation marks; emoji; second-person address in narration; any word that describes a state instead of naming it ("loading fast" → drop the adjective, or state the ms).
- **Emphasis:** the load-bearing element per surface is the substrate STATUS (verdict, live dot, health), not any chrome. Navigation is a quiet door, never a focal point (Architect ruling, `../process/BLACKBOARD.md` 2026-06-14).
- **Reference:** `../../design/terminal-v1/visual-redesign.md` § tabs — the copy for tab labels, cold-state text, picker prompts lives there as it stabilizes.

## Drift surface log

*(empty on project start)*

## Sprint cadence policy

- **Wave 0 (founding artifacts):** plan-mode-per-sprint (Architect drives interactively).
- **Wave 1 (shell):** plan-mode-per-sprint.
- **Wave 2 (pane ports, eight sprints):** auto-within-phase after the first sprint (2.1) closes clean and the pattern is verified. The Agent dispatches 2.2 … 2.8 card-to-execution; surfaces only on halt or wave close.
- **Wave 3 (subject rule + integration):** plan-mode-per-sprint.

## Project-specific halt conditions

- `subject_rule_ambiguous` — fires when a sprint touches a tab whose read-from-Records behaviour is unclear against the subject rule in `visual-redesign.md`. Resume: Architect ratifies the rule in BLACKBOARD `## Decisions`.
- `mock_reference_drift` — fires when a sprint's authored surface diverges from the July mocks (`../../design/mocks-index.html` + numbered pages) in a way that changes the tab's identity, not just its skin. Resume: Architect ratifies the divergence or restores the reference.
- `discipline_gap` — fires when a sprint card is proposed without one of the six items in § "The six discipline items every terminal-v1 sprint carries". Resume: rewrite the card to include the missing item.
- `ruling_violation` — fires when a sprint card would need to violate any entry in the standing rulings register (see `../../design/terminal-v1/postmortem-iframe.md § The rulings register`). Resume: rewrite the card so the ruling holds, or Architect rescinds the ruling in BLACKBOARD `## Decisions`. **Added 2026-08-14 after Sprint 015 wrote an iframe despite the "no iframes ever" ruling.**

## Custom techniques

None yet. The kit's Addendum A entries A1–A10 are the primary reference — cite by letter+number in sprint cards.

## The six discipline items every terminal-v1 sprint carries

Non-negotiable per Architect ruling 2026-08-14 — an LLM cannot land a complex software project without these. Every sprint card and every sprint close, from Sprint 007 onward, addresses all six:

1. **Diary discipline (technique #34).** One KIT_DIARY entry per sprint close: what happened / what worked / what got in the way / what this says about the next kit version. Update the hypothesis table if the sprint moved the needle on H1–H4.

2. **Three-lens observation (Addendum A1).** Structural (Playwright DOM assertions in `harness/e2e_terminal_v1.js`), perceptual (pixel-anchor decode + fixture-hash regression in `harness/capture_terminal_v1.js`), adversarial-review (an explicit paragraph in the Sprint tail entry answering *"could this sprint have passed while misrepresenting state? name the specific ways."*). The third lens is a documented pass, not a script.

3. **Per-surface pixel anchors + asymmetric fixtures (A2 + A3).** Every ported pane adds at least one pixel-anchor check that encodes the pane's content state. The fixture must be asymmetric — a mirror bug, a transpose bug, or a color-drop bug would fail at least one anchor. Card names the specific bug class the anchor catches.

4. **Canonical home registry maintained per port (rule 7 + technique #22).** Every sprint that adds a new render function / helper / state slice updates the row in `WORKING_AGREEMENT.md § Canonical home registry` in the same sprint.

5. **NAME + VALUE + PATH assertions (Addendum B3).** Every harness assertion names the element (NAME — element exists at its selector), asserts the exact expected content (VALUE — exact text, exact class, exact attribute), and (where a user action was supposed to run a handler) asserts the STATE mutation the handler was supposed to make (PATH — inspect `window.__TERMINAL_V1_STATE`).

6. **Confirmed-good screenshots as fixtures (technique #38).** Every new screenshot the capture script writes is registered in `fixtures/<name>.sha256` on first run. Subsequent runs diff; drift fails the harness. Deliberate visual changes bump the fixture with `REFREEZE=1 npm run capture:terminal-v1` in the same sprint that introduces the change.

If a card is proposed without any of these six, halt with `discipline_gap`; do not dispatch.

---

*WORKING_AGREEMENT.md — terminal-v1. Reader/projector UI; no vocabulary lock per Addendum A9; tone canon is the founding contract. Reuses parent substrate-ui's server + harness toolchain. Augments AGENTS.md; never overrides its hard rules.*
