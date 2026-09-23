# Plan — reveal-shell hardening (post-Phase-6, next epic)

Opened 2026-09-23. Anchors on the 2026-09-23 code review of
`web/vm/` + `web/reveal.*` (kept in `process/planning/`; the
review's specific findings are quoted below where a task cites
them).

## The reveal shell today

`web/reveal.html` is 2,632 lines. About 2,300 of those are a
`<script type="text/x-dc">` block that renders the entire
console: the transcript, the tool-card panels, the record graph,
the studio, the descent chrome, the find bar, the settings and
export dialogs. That script uses `S` for `this.state`, `KC` for
the envelope-kind colour map, `T` for the seq → time label map,
`CH` for the demo descent-children map, `EV` / `EVFULL` /
`EVLITE` for envelope arrays, `FQ` / `FTXT` for the find query
and its demo text, `G` for the graph grid, `A` / `B` for the
first and last visible seq. Envelope kinds are matched against
raw string literals in 49 places (`UserMessage`, `ModelReply`,
`ToolCall`, `ToolResult`, `Park`, and so on).

`tsconfig.json` includes `web` and `tools` but nothing carves the
inline script out for the compiler, so it takes zero
typechecks. `npm run build` passes because it only sees the
`web/vm/` + `web/reveal.ts` files that import cleanly. There is
no ESLint. There is no lint rule against magic strings or single-
letter identifiers.

Sprint 057 attempted to layer a `data-panel-key` runtime
registry on top of this script. The registry filled; the panels
rendered empty; the smoke passed the whole time; the shell
regressed in the browser. Post-mortem is at
`POSTMORTEM-2026-09-23-sprint-057-tool-panel-reverted.md`. The
root cause under the failure was that a template with 2,300
lines of untyped inline JS is a room without light: a wrong
binding cannot be caught by a compiler, cannot be located by
`grep`, and cannot be fixed without editing the whole room.

## Goal

Turn `web/reveal.html`'s inline JavaScript into TypeScript that
lives on disk, imports its dependencies, is typechecked by the
same `tsc --noEmit` that guards the rest of the codebase, and
uses names that read as what they are. Do it in slices that
keep the shakeout green after each cut, so a bad landing is a
one-slice revert instead of an emergency.

The parity gate stays green. The signal vocabulary does not
change. The rendered surface does not change. Every rename
lands with an equivalent test run.

## Phases

### Phase 1 — extract the inline script (Sprint 058)

Move the `<script type="text/x-dc">` body out of reveal.html
into a new file `web/reveal_component.ts`, imported by
reveal.html as `<script type="module" src="./reveal_component.ts">`.
Preserve the dc-runtime component export exactly; nothing in
its behaviour changes.

Deliverable: reveal.html shrinks to the template plus the
`<script>` includes. `web/reveal_component.ts` picks up every
typecheck under `include: ["web", …]`. `npm run build` builds
one more file; the reveal bundle grows by nothing because it
was already bundled.

Observation contract: `npm run smoke:vm` + one shakeout flow of
each kind (`cold_boot`, `chat_one_turn`, `tool_bash`,
`bundle_picked`) render identically to the pre-extract build.
A Playwright screenshot compare is out of scope; a passing
shakeout is the gate.

Risk: the dc-runtime template uses `this` scoping tricks
(`this.setState`, `this.state`, `this._buildStudioSpec()`) that
work only when the component class is authored inside the
`<script>` block. Verify against `web/support.js` that the
class body is compiled from the script text; if `this` scoping
requires the block to stay inline, the phase ends here with a
finding: the extraction path needs a dc-runtime API change
first.

### Phase 2 — types for the moving parts (Sprint 059)

Author `web/reveal_types.ts`:

- `enum EnvelopeKind { UserMessage, ModelReply, ToolCall, ToolResult, Park, SessionStarted, SessionEnded, ProducerFailed, PromptFragment, Tick, StepStarted, StepFinished, ... }` (name every kind the shell reads).
- `enum TranscriptRole { User, Model, Tool, Park, Ended, Warning }`.
- `enum PaneMode { Stream, Terminal, Revealed }` and `enum Surface { Transcript, Records, Assay, Studio }`.
- `enum ConnectionState { Idle, Connecting, Connected, Reconnecting, Closed }`.
- `type RecordEnvelope`, `type ToolProgressEntry`, `type Descent`, `type StudioSpec`, `type PaneShape` — mirrored from what `session_controller.ts` and the template already read.

Replace every raw-string match (`row.kind === 'UserMessage'`,
`row.role === 'model'`, `surf === 'records'`) with an enum
comparison. TypeScript will fail the build on typos.

### Phase 3 — significant renames (Sprint 060)

Do the review's rename list in reveal_component.ts:

- `S` → `state`; `St` → `state` (or `studioState` where it is
  read only in `_buildStudioSpec`).
- `T` → `seqToTimeLabel`; `tFor` → `formatElapsedTimeForSeq`.
- `KC` → `envelopeKindColor`.
- `CH` → `demoDescentChildren` (see Phase 4 — this may migrate
  out of the module entirely).
- `EV` → `envelopes`; `EVFULL` → `demoFullSessionEnvelopes`;
  `EVLITE` → `demoLiteSessionEnvelopes`.
- `FQ` → `findQuery`; `FTXT` → `demoFindTranscriptText`.
- `G` → `graphGrid`; `A` → `firstSeq`; `B` → `lastSeq`.
- `_prodFor` → `formatProducerLabel`;
  `_gistFor` → `formatEnvelopeGist`;
  `_laneOf` → `laneForProducerKind`;
  `_bareKind` → `stripSubstratePrefix`.
- Loop-scope parameters that carry meaning: `e` → `envelope`,
  `p` → `producer` / `pane`, `t` → `trigger`, `r` → `route`, `s`
  → `session` / `snapshot`, `v` → `view`, `c` → `controller`.
- Trivial `i`, `j`, `x`, `y` stay where the loop body is one
  line and their meaning is index / coordinate.

Leave `snap`, `ack`, `s in rowFrom(s, status)` in
session_controller.ts alone for now: they are project idiom and
the churn is not worth the cost. The review's naming complaint
is real about reveal.html and borderline about the controller.

### Phase 4 — excise demo data (Sprint 061)

`EVFULL`, `EVLITE`, `CH`, `FTXT`, and the hard-coded record IDs
(`01M1684`, `s_5cf30ed6…`, `rev_kimi_vs_glm`, etc.) exist so
the reveal shell renders in Omelette's editor mode without a
live substrate behind it. In the running app they are dead
weight and read as clutter. Move them to
`web/reveal_demo_data.ts`, imported only when the shell detects
Omelette (`document.body.hasAttribute("data-dc-editor-on")`).
Live boots do not touch the file.

The `_liveActivity` synthetic time math, the `_bareKind`
prefix strip, the whole "if no live data show demo data"
fallback — audit each and either delete or keep behind the same
gate.

### Phase 5 — lint + guard rails (Sprint 062)

`.eslintrc.cjs` at the repo root:

- `@typescript-eslint/no-magic-numbers` off (too noisy for a
  view layer).
- `id-length: [error, { min: 2, exceptions: ["_", "x", "y", "i", "j", "k"], properties: "never" }]`.
- A custom rule (or a simple `no-restricted-syntax`) that
  forbids `Literal[value=/^(UserMessage|ModelReply|ToolCall|ToolResult|Park|...)$/]`
  outside `reveal_types.ts`. If the enum is the only source of
  truth, every kind match goes through it.
- Prettier config — 2-space indent, single quotes, no trailing
  commas in JSX-adjacent template literals. Optional; land only
  if the diff is small.

Fold `npm run lint` into the build step so a magic-string reach
around the enum fails CI at PR time.

### Phase 6 — split into modules (Sprint 063+)

Once the file is TypeScript and its identifiers say what they
mean, break it up:

- `web/reveal/view_model.ts` — the `renderVals` builder that
  computes what the template reads.
- `web/reveal/markdown.ts` — `_mdBlocks`, `_mdInlines`,
  `_mdRenderBlock`, `_mdRenderInline`.
- `web/reveal/stream_lens.ts` — the envelope filter that
  produces the record-graph view.
- `web/reveal/graph_layout.ts` — the producer / trigger / route
  layout math.
- `web/reveal/dc_component.ts` — the dc-runtime class body,
  reduced to a thin shell that composes the modules above.

Each module gets unit tests. The `renderVals` builder is a pure
function of `state`, so a table-driven test with fake state
covers most of it. Markdown + graph layout are pure and easy.

Book each split as its own sprint; land one module at a time
with a passing shakeout between them.

## Caret pin — separate small win, do first

Independent of the rest of this plan. Cost: one afternoon. Book
as Sprint 057b (parallel to the reverted 057, distinct scope).

Bug: clicking a tool card's caret opens the card body below the
header line, but the header line's y-position in the transcript
scroller shifts. The user wants the clicked line's y to stay
where it was; the body pushes the following content downward;
overflow gets a scrollbar if needed.

Cause: the transcript containers (reveal.html:87, 254) are
`flex:1;overflow-y:auto` with Chrome's default scroll anchoring.
On a state change that toggles `sc-if value="{{ row.toolCardOpen }}"`,
React re-renders a slab of the transcript, dc-runtime patches
the DOM, and Chrome's anchor picks a different anchor node than
the click target. The line's y drifts.

Fix: on the toggle handler (reveal.html:1056 `bindToggleTool`),
before `setState`, capture the header element's
`getBoundingClientRect().top`. After the state applies (rAF),
measure again and adjust `scrollTop` by the delta. This pins
the click line to its pre-click y regardless of what dc-runtime
patched.

Two call sites: the terminal-view card (reveal.html:116) and
the reveal-view card (reveal.html:283). Both get the same fix.

Observation contract: manual — open a card near the top of a
long transcript, confirm the header does not shift; open a
card near the bottom, confirm the panel opens below and the
scrollbar grows.

## Bundle budget

None of these phases changes the runtime dependency set. The
extraction in Phase 1 shifts code between files; the total
bundle stays 50 KB gzipped or under. Phases 2–3 shrink it
slightly by dropping duplicated literals.

## Out of scope

- Rewriting the dc-runtime layer itself. dc-runtime stays.
- React idioms (hooks, functional components). The dc-runtime
  class body stays a class.
- Rewriting the substrate side.

## Observation contract summary

- Every phase runs `npm run smoke:vm` + one representative
  shakeout flow before landing.
- Sprint 057 (tool-panel formatting) can be re-attempted only
  after Phase 1 lands; the Phase-1 build gives the compiler a
  seat at the wiring.
- The parity gate at `web/vm/tools/check-vocabulary-parity.ts`
  runs after each phase; it must stay 30 tags, all locked, all
  emitted.

## Sequence

1. **Sprint 057b** — caret pin (this session, if room).
2. **Sprint 058** — extract inline script to `reveal_component.ts`.
3. **Sprint 059** — enums + kind/role/mode type safety.
4. **Sprint 060** — significant renames.
5. **Sprint 061** — excise demo data.
6. **Sprint 062** — ESLint + magic-string rule.
7. **Sprint 063+** — module split.
