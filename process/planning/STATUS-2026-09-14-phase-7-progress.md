# STATUS · Phase 7 progress · 2026-09-14

Ratified plan: `PLAN-2026-09-14-r2-flat-design-parity.md`.

## Landed this session

### Transcript prose formatting (industry-standard Markdown)

`_mdBlocks` parses each model reply into paragraph / code-block / ul /
ol / heading blocks. `_mdInlines` tokenizes each block into text /
code / bold / italic segments. `_mdRenderBlock` and `_mdRenderInline`
precompute the CSS variants a `dc-runtime` template can flow. Reveal
shell renders paragraphs that breathe, fenced code in a `#1a1c20`
panel with its language tag, real bullets, numbered lists, and h1-h3
headings. User turns render verbatim.

### 19a workspace picker

Server `/api/workspaces` collapses per-session sandbox paths under
`.substrate/sessions/`, temp dirs under `/var/folders/` and `/tmp/`,
`substrate-walkthrough-*`, `substrate-harness-*`, and the root path.
206 rows drop to 2. Reveal shell adds an inherit-from-split row,
a `choose folder…` row keyed `⌘O`, and a keyboard model on the input:
`↑↓` picks, `⇥` completes against the first recent, `↵` binds. Hint
line matches the frame: `type a path — ⇥ completes · ↑↓ pick · ↵
bind + start`.

### 19b blank-window picker

`?blank=1` boots pane 1 unbound. `isMain` flips off for an unbound
pane so it falls into the picker branch and renders full-screen. The
picker STATE is the frame; the `⇧⌘N` shortcut is browser-reserved
for incognito and cannot be intercepted from JS.

### 19c settings persistence

`componentDidMount` loads `substrate-ui.settings` from localStorage.
Theme picker, font ± buttons, and the nested-descent toggle all pass
`this._persistSettings` as their `setState` callback. Whole-state
restore per D68 stays SQLite; localStorage carries per-viewer prefs.

### 19g live-session interrupt-first

`doEndSession` reads the pane's snapshot; when the session is
connected with no `parkReason` and no `endedReason`, it awaits
`interruptTurn()` before `endSession()`. Verified end-to-end: the
tape shows `TURN_INTERRUPTED → SESSION_END_REQUESTED → STREAM_CLOSED`
in order.

### 19h / 19k / 19l find dims non-matches

`_liveBindingsFor` reads `S.findOpen`, `S.findScope`, `S.findQ`; each
transcript row gets `opacity: 1` on match / `.35` on miss. Pane-loop
and reveal-view templates read `opacity:{{ row.opacity }}` on the row
div. `⌘F` binding was already there; the dim was the missing piece.

### 19i status-dot hollows on rate-limit

Controller already appends `RateLimitedWaiting` rows with the exact
frame text (`session_controller.ts:727`). Pane header dot now reads
its own pane's snapshot from `controllerSnapshots[p.id]` (not the
pane-1-only mirror), and `pn.dotBg` goes `transparent` when the last
transcript row is `RateLimitedWaiting`. The dot bumps from 4x4
filled to 6x6 border+bg so "hollow" reads as a ring.

### 19m first-run driver probe

Gate: `this.props.firstRun` OR `?firstrun=1` in the URL, plus
`!S.frDone`. `frRows` groups the real `/api/models` roster by
provider: local ollama (installed on `localhost:11434`),
ollama·cloud (`:cloud` suffix), CLIs (`claude`, `gemini` — the
roster's `cli` array), deterministic floor. Server's default is
preselected. Picking a row calls `vm.pickDriver(driver)`.

### 20f depth ramp

`DEPTHC = ['#82a5c8', '#93a0cb', '#9a9bce', '#a096d0', '#ac92d4',
'#b88fd9']` replaces the two-tone violet. ⑂ line, inset border, path
chip, focused prompt read from `DEPTHC[depth]`.

## Remaining Phase 7 work

- **20a–20e in-place descent onto real child records.** Needs
  controller-side detection of `ToolCall(tool='delegate')`, extraction
  of the child record id from the paired `ToolResult`, and a
  child-record attach path that swaps in place on the current pane
  per D70 (no new pane). Talkability gate reads the child topology.
- **19j depth-cap refusal render.** Falls out of the descent wiring;
  a `delegate` ToolCall at depth 2 renders as a failed ToolResult in
  its inset per D41.
- **19f Export Record.** Blocked on a missing server endpoint
  (`/api/records/<name>/export?shape=record|jsonl`). Non-goals in
  the r2 plan hold no-server-work; moves to a follow-up phase.
- **`harness/e2e_delegate_depth.ts`.** The end-to-end test asserts
  descent, path row, talkability gating, and the depth cap. Runs
  the substrate delegate machinery under a controlled real session.
  Ships alongside the 20a–20e wiring.

## What "done" looks like

The remaining items close when a scripted delegate call in a real
session descends into the child record, the ⑂ line renders with
the depth-appropriate accent, the path row above the prompt reads
`session › ⑂ <child-name>`, `esc` climbs one level, a depth-3
delegate call renders as a plain failed ToolResult, and the e2e
test is green.
