# PLAN — Phase 7 · Flat-design parity + generated-text formatting · 2026-09-14 · r2

Supersedes `PLAN-2026-09-14-phase-7-flat-design-parity.md`. That
plan overstated the surface work and understated the wiring work.
This one carries the corrected verdicts from the sanity check, plus
one new bullet: transcript prose formatting to industry standard.

## What is actually true about each frame

The reveal shell was ported wholesale from `prototype-v7.dc.html`,
which itself was drawn from the flat designs. Every 19- and 20-frame
lives as HTML template + component state already. What differs from
the design is what feeds the template. Phase 7 is about *wiring*, not
rebuilding.

### Turn 19 — the round-2 gap frames

| Frame | Template state today | What is missing |
|---|---|---|
| **19a** | `wsRows` + input + row highlights render | `⌘O` "choose folder…" row, `⇥` tab completion, `↑↓` keyboard nav, inherit-from-split preselection tag, corrected hint line |
| **19b** | full-window picker not present | `⇧⌘N` shortcut + a blank-window state that shows the same picker full-screen |
| **19c** | template + `showSettings` state landed at line 493 | wire `⌘,` shortcut; persist theme + type-size in `localStorage` (whole-state restore stays SQLite per D68) |
| **19f** | template + `showExport` state landed at line 513 | file-write path — server endpoint or a download of the record dir + `events.jsonl` |
| **19g** | `showEndConfirm` template + `/exit` routing | live-session interrupt-first path per D68 |
| **19h** | `findQ` / `findScope` state + bar at lines 62 + 188 | `⌘F` binding + the "matches bright, rest dims to .35" rule per 19h |
| **19i** | scripted `simRL` line at 124; controller emits `RateLimitedWaiting` (envelope kind seen at 1155) | replace `simRL` with a read of the real `RateLimitedWaiting` envelope in the transcript row builder |
| **19k** | same find bar in the terminal-view transcript | scope-based dimming for transcript rows |
| **19l** | same find bar in the revealed-view transcript | verify the bar rides the focused pane while the stream stays live |
| **19m** | scripted-only behind `this.props.firstRun` | real machine driver probe: ollama·local models, ollama·cloud sign-in, claude CLI on PATH, API providers keyed by env, deterministic floor |

### Turn 20 — talking to a delegate

| Frame | Template state today | What is missing |
|---|---|---|
| **20a** | `S.descent` + `nestedDescent` setting toggle at line 500 + esc-climb | wire click on real delegate `ToolCall` → sets `descent` to the child record id (not the scripted `CH` map) |
| **20b** | descent handles multi-level via array | verify path row grows and esc climbs one at a time on real records |
| **20c** | descent renders prompt box unconditionally | talkability gate: read the child topology; if it does not accept `UserMessage`, hide the prompt box and show "watching" in the path row |
| **20d** | `nestedDescent` setting exists | when true, render the parent transcript dimmed around the child |
| **20e** | same setting | works at depth 2 |
| **20f** | `DEPTHC = ['#a08fc9', '#b88fd9']` — two-tone violet, not the D70 ramp | replace with the six-step blue→violet ramp: `#82a5c8 · #93a0cb · #9a9bce · #a096d0 · #ac92d4 · #b88fd9`; apply to ⑂ line, inset border, path chip, focused prompt at the depth level |
| **19j** | (depth-cap refusal, lives with 20-series) | render depth-cap refusal as a plain failed `ToolResult` in-place |

### Cross-cutting bug found in the sanity pass

`/api/workspaces` falls back to per-session sandbox paths when
`~/.substrate/recent-workspaces.json` is missing. That pollutes both
the records surface (fixed by a client-side sandbox filter) and 19a's
picker (still shows 200+ near-identical rows). Fix at the server:
collapse per-session sandbox paths into the sandbox row, keep only
user-level workspaces in the list. Track under 19a.

## The new item: transcript prose formatting

Right now each `TranscriptRow` renders as a single line of text with
CSS word-wrap. Users see model output as a wall of unstyled prose.
Industry-standard chat surfaces (ChatGPT, Claude web, Cursor, Zed's
AI panel) render model output as Markdown: paragraphs, fenced code
blocks, inline code, bold, italic, lists, headings, links.

Scope for this plan:

- Parse each `TranscriptRow.text` (role=model) into a block list:
  paragraph, code-block (with language), unordered list, ordered
  list, heading.
- Render blocks with distinct styling: paragraphs breathe with margin;
  code blocks live inside a `#1a1c20` container with monospace + a
  language tag; lists indent + carry bullets/numbers; headings scale.
- Inline styling inside every block: `` `code` `` gets a mono span with
  a subtle background, `**bold**` gets `font-weight:600`, `*italic*`
  gets `font-style:italic`.
- Leave the user's own turns (role=user) unformatted — they are what
  the user typed and should render verbatim.
- Every block renders via `dc-runtime` templates (nested `sc-for` /
  `sc-if` over structured segments produced by a Component method).
  No `dangerouslySetInnerHTML`; escape defense stays with the runtime.

Non-goals for this pass: tables, math (`$…$`), footnotes, syntax
highlighting inside code blocks. Those queue for a later plan.

## The end-to-end delegate test

Same shape as r1: spin a real delegate, verify descent, path row,
talkability, depth cap at D41=2, refusal render at 19j. Named
`harness/e2e_delegate_depth.ts`. Runnable as
`npm run e2e:delegate-depth`.

## Order of landing

1. **Transcript formatting.** Highest visible payoff. Every other
   frame benefits when the model's output stops looking like a paste
   from the terminal.
2. **19a picker polish** (choose-folder, ⇥, ↑↓, inherit tag) and the
   server-side workspaces cleanup.
3. **19c persistence** (localStorage for theme + type-size).
4. **19g live-session interrupt-first path**.
5. **19h/19k/19l find scope dimming rule + `⌘F` binding**.
6. **19i rate-limited surface reads the real envelope**.
7. **19f export record + file-write path**.
8. **19b `⇧⌘N` blank window**.
9. **19m first run driver probe**.
10. **20a–20f descent wired to real delegate ToolCalls + depth ramp**.
11. **19j refusal render** falls out of 10.
12. **`harness/e2e_delegate_depth.ts`** — closes the phase.

## What "done" looks like

- Every 19- and 20-series frame reads real controller data.
- Transcript prose renders as Markdown blocks with distinct styling.
- `npm run e2e:delegate-depth` is green.
- Fresh status doc supersedes `STATUS-2026-09-14-phase-4-closed.md`
  and lists which frames landed.

## Sources

- `handoff_latest/sheets/Substrate Shell Directions v3.dc.html`
- `handoff_latest/docs/DESIGN-DECISIONS -through 2026-09-01-.md`
  (D41, D66f–h, D67, D68, D69, D70)
- The sanity-check output that named the true code state per frame.
