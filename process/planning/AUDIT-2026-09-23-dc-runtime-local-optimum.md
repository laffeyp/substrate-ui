# Audit — dc-runtime is a local optimum for the reveal shell

Written 2026-09-23 after five failed attempts to hold a tool-card's
caret line in place across a click. Every attempt was reverted. This
file names why every attempt failed at the level of the substrate the
shell runs on, not at the level of individual scroll math.

## What we tried to do

One thing. Click the caret on a tool card. The caret's line does not
move. The card body opens below the line. Click again. The body
retracts. The line still does not move. The scrollbar grows if the
body pushes content past the viewport; content above the line is
undisturbed.

Every native web UI in the last twenty years does this by default.
GitHub's file tree, Slack's message threads, VS Code's Outline pane,
Chrome DevTools' Sources gutter. It is a solved layout: growth
propagates downward from the header; the viewport does not shift.

## What we found

Five attempts. Each attempted a different remedy. Each was reverted:

1. **Three-state toggle.** Explicit `false` to override auto-open.
   Reverted because the auto-open rule kept overriding it.
2. **`data-tool-row` + `getBoundingClientRect` pin.** Read the
   header's viewport y before setState, restore scrollTop by the
   delta on rAF. Reverted because it flashed and mis-targeted rows.
3. **`overflow-anchor: none` + `scrollTop` freeze.** Turn off
   Chromium's default anchor and forcibly rewrite `scrollTop` back to
   its pre-click value on rAF. Reverted because the header still
   drifted; ref callbacks fighting scrollTop on the same tick.
4. **Memoized ref callbacks.** Attach `_termScrollRef` etc. once on
   `this`. Reverted because the drift persisted anyway.
5. **Signal-driven headless probe.** TOOL_CARD_TOGGLED emits with
   body-count and header-top; Playwright asserts. The probe reported
   PASS. The user opened Chrome and reported the drift is still
   there. The probe passed a case the user was not testing.

Each attempt fixed a plausible cause. None fixed the thing.

## The fundamental constraint

dc-runtime's execution model:

- One class body with one `renderVals()` method. Every state change
  triggers a full re-invocation.
- `renderVals()` returns a flat object of prop values. Every
  attribute, every event handler, every ref is a value in this
  object.
- On every setState, React sees new prop values for every attribute
  in the whole tree. Reference-equality checks between renders fail
  by default — every function is fresh.

Consequences that make the caret pin impossible without leaving
dc-runtime:

1. **Ref callbacks fire per render.** `termScrollRef` is a value in
   the flat return object. Every render produces a new function
   identity. React's ref semantic is "if the callback identity
   changed, unbind the old and bind the new." So the ref callback
   runs after every setState. Each firing schedules an rAF that
   writes `scrollTop`. Any manual scroll math races that write.
2. **`sc-for` uses index keys** (`web/dist/support.js:walkFor`
   returns `h(Fragment, { key: i }, ...)`). When a filtered list
   changes shape — e.g. a `ToolResult` folds into its `ToolCall` and
   the row disappears — React reuses the DOM at index N with the
   row that was at N+1. Any DOM reference held across the setState is
   now attached to a different row's data.
3. **No component boundaries.** The whole reveal shell is one
   `DCLogic` subclass. There is no `React.memo`, no subtree
   isolation. A caret click that flips `state.toolOpen[cid]` re-runs
   `renderVals()` for every row, every producer node, every studio
   input, every dialog. The subtree that changed is not privileged.
4. **No layout-effect ordering.** React exposes `useLayoutEffect`
   for code that must read DOM measurements before paint.
   `DCLogic.setState` uses `React.setState` under the hood; the
   post-render callback fires after commit but before paint, but
   dc-runtime does not expose a hook to a template consumer. Any
   measurement lives inside a ref callback or a rAF, both of which
   race Chromium's own layout pass.
5. **Chromium's default `overflow-anchor: auto`** picks an anchor
   node inside a scroll container and adjusts `scrollTop` on content
   growth. `overflow-anchor: none` disables this, but only removes
   one of the several actors above.

Standard web UI achieves the caret pin with none of these mechanisms
in play. The path most codebases take:

- **`contain: layout`** on the row's outer div. Growth inside the
  row does not propagate to the scroll container's layout pass. The
  header's page-y is a pure function of its own row's position; the
  card body's height doesn't feed back.
- **`position: absolute` overlay** for the body. It renders over the
  content below the row without displacing it. The row's height
  never changes on toggle. No scroll math needed.
- **Stable component identity.** A `React.memo`'d row component with
  a keyed callback (`useCallback`, `useRef`) means clicking one card
  re-renders only that card. Other rows keep their DOM references
  and event bindings. No index-key reparenting.

None of these are hard techniques. They are the CSS + React idioms
every production app uses. dc-runtime does not host them.

## Why the reveal shell hit the local optimum

The reveal shell started life as a prototype in Omelette (dc-runtime
+ template-in-HTML editor). Its whole visible surface was demo data
rendered by `renderVals()` from state; it existed to preview the UI
without a running substrate behind it. The state model was flat, the
template was single-file, and every attribute could be a `{{ vals.x
}}` expression.

The shell then grew into a real client for the SessionController.
Sprints 043–056 added live envelope streaming, per-pane sessions, a
real tool-card grammar, descent, fan-out, studio, records, find, a
settings dialog, an export dialog. Every one of those went into the
same one `renderVals()` — because dc-runtime has no other place to
put them. The class body is now 2,000 lines. Every setState re-runs
it wholesale.

The caret pin is the first requirement that DIRECTLY conflicts with
the "re-run everything on every state change" model. Not because
scroll math is hard, but because the shell has no way to keep an
element's identity stable, its handler identity stable, or its scroll
container's scrollTop untouched between the click and the paint.

Every scroll fix would work in a plain React app. None of them can
work here without inventing a memoization / layout-effect layer on
top of dc-runtime.

## What this means for future work

Three paths.

**Path A — Migrate the transcript subtree off dc-runtime.** Author
`web/reveal_transcript.tsx` as a real React component with hooks:
`useState` for the local `toolOpen` map, `useCallback` for the
click handler, `useRef` for the scroll container, `React.memo` on
each row. Mount it inside dc-runtime's tree via a portal or a
`<div>` the class body renders as a leaf. Keep dc-runtime for
settings, dialogs, the static header. Cost: real work, but scoped —
the surface that has the caret bug is one component.

**Path B — Reshape the layout so the pin is not needed.** Render
the card body with `position: absolute` overlay so its appearance
does not change any parent's height. `contain: layout` on each row
so the transcript scroller's scrollTop never feels the toggle. No
JavaScript scroll math. This works inside dc-runtime because it is
CSS-only. Cost: a rewrite of the card body markup, but no runtime
changes. Risk: the overlay hides content below the card until
dismissed, which changes the reading model users are used to.

**Path C — Accept the constraint.** Tell users tool cards may shift
the transcript. Focus on the sprints that don't require component-
level identity: the shell direction round-2, the Electron port, the
substrate benchmarking work. Return to the reveal shell after Path A
is scoped as its own epic.

The recommendation implied by the audit is **Path B first, then
Path A**. B is one CSS change and answers the user's specific
symptom without a substrate migration. A is the correct long-term
posture but is a real refactor.

## What was kept and what was reverted

**Kept from tonight's work** (not caret-related):
- Sprint 058 — inline dc-runtime script moved to
  `web/reveal_component.ts`, injected at HTML transform time by
  `vite.config.ts:inlineDcScript`. reveal.html: 2,632 → 655 lines.
- Sprint 059 — `web/vm/kinds.ts` with `EnvelopeKind`,
  `TranscriptRole`, `Surface`, `GraphMode`, `RevealLevel`,
  `GraphDirection`. 118 raw-string references converted.
- Sprint 060 — significant renames (`S`→`state`, `T`→
  `seqToTimeLabel`, and the review's list). Two regex character-
  class collateral bugs found and fixed.
- Sprint 062 — `eslint.config.mjs` with `id-length` and
  `no-restricted-syntax` (blocks raw envelope-kind literals outside
  `kinds.ts`). Wired into `npm run build`.
- Harness port guard — `ServerHandle.start()` refuses to launch if
  port 8765 is already bound.
- Parity gate expansion — `check-vocabulary-parity.ts` now scans
  `web/reveal_component.ts`.

**Reverted tonight** (all caret work):
- `overflow-anchor: none` CSS.
- `data-scroller` and `data-tool-card-body` attributes.
- Memoized ref callbacks.
- Auto-open on `toolRunning` alone; back to `toolRunning || streamingShow`.
- `bindToggleTool` explicit-false toggle; back to the original
  `delete`-or-`true`.
- `TOOL_CARD_TOGGLED` signal tag.
- `window.__sddEmit` shim.
- `harness/caret_probe.ts`.

`process/sprints/sprint-063a-caret-in-place-toggle.md`,
`process/planning/POSTMORTEM-2026-09-23-caret-in-place-toggle.md`,
and this file remain as the paper trail.
