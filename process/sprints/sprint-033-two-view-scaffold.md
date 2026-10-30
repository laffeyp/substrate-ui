# Sprint 033 — two-view scaffold + header toggle

```yaml
---
id: 033
status: closed
phase: 5
pass_kind: functional
---
```

## scope

TECH-SPEC-2026-08-25-round6 §10 line 8 opens piece G. Today `web/index.html`
is one page: a header, a rail, a graph, a stream, an inspector, a docked
terminal (opened via `Ctrl+\``). Piece G reshapes it into two views:
`#view-terminal` (the daily-driver terminal as a full-column surface) and
`#view-desktop` (the current console — rail + graph + stream + inspector).
A header toggle icon flips between them; `Ctrl+\`` becomes the view-swap
shortcut. Scroll position + cursor selection preserved across flips.

The terminal dock moves to `#view-terminal` in sprint 035. This sprint
lands the container structure + the toggle wiring so 034 (rail rewrite)
and 035 (terminal promotion) have a home.

**Rule-6 stretch acknowledged (per REVIEW-2026-08-28 G3):** three code
files touched (`web/index.html`, `web/app.ts`, `tools/capture-grade.ts`).
One concept — the two-view scaffold plus the grader map that observes it.
The grader map is the observation contract's own surface; splitting it
into a follow-on sprint would land trivially and add a review-cycle for
no gain.

## context_files

- `web/index.html` — current single-page layout.
- `web/app.ts:1184` — current `Ctrl+\`` binding (opens the dock).
- `web/instrumentation/vocabulary.ts` — `PANE_SWITCHED` tag already in v0.6.
- `tools/capture-grade.ts:360-372` — `VIEW_TO_PANE_TAG` + `VIEW_TO_PANE_ID` maps.
- `process/HARNESS-CATALOG.md` — every harness in one place; do not reinvent.
- `current-design-direction/TECH-SPEC-2026-08-25-round6.md` §10 lines 5-8.

## artifact contract → Files created/modified

- `substrate-ui/web/index.html` — two view containers `#view-terminal`
  + `#view-desktop`; header toggle icon `#view-toggle`. Everything the
  current file has ends up inside `#view-desktop` unchanged.
- `substrate-ui/web/app.ts` — view toggle state (`STATE.view: "terminal"
  | "desktop"`, default `"desktop"`); flip handler; scroll-position +
  cursor-selection snapshot on flip-out, restore on flip-in;
  `Ctrl+\`` rebound to `_toggleView()` (removes the terminal-dock
  binding — the dock still opens via `#termOpen` for one sprint until
  035 promotes the terminal into `#view-terminal`).
- `substrate-ui/tools/capture-grade.ts` — `VIEW_TO_PANE_ID` gains
  `terminal: "terminal"` and `desktop: "desktop"`; `VIEW_TO_PANE_TAG`
  gains matching entries (either the existing pane-render tags rebound
  or a new `VIEW_RENDERED` if the graders need to distinguish).
- `substrate-ui/sprints/sprint-033-two-view-scaffold.md` — this file.

## signal contract → Emits

`PANE_SWITCHED{to_pane: "terminal" | "desktop", prior_pane,
subject_record}` on every flip. `subject_record` may be null when no
record is selected (the desktop view's default state). The existing
five values (`run`, `topology`, `scene`, `io`, `graph_run`) continue to
fire from within `#view-desktop`. Parity gate exit 0.

## observation contract

- **UI driving steps** (Playwright). Open `http://127.0.0.1:8765/`.
  Assert `#view-desktop` visible, `#view-terminal` hidden. Click the
  `#view-toggle` icon. Assert the two flip. Press `Ctrl+\``. Assert
  back. Type into a hypothetical desktop input (or select a record
  from the rail), flip out, flip back. Assert selection + scroll
  position restored.
- **Expected stderr log substrings**. None new (server unchanged).
- **Expected runtime signals on the record**. None (no session opened
  yet).
- **Expected grader signals**. `PANE_SWITCHED{to_pane:"terminal"}` and
  `PANE_SWITCHED{to_pane:"desktop"}` at least once each; the frame
  counter stays monotonic across the toggle.
- **Expected screenshot frames**. Two viewed: `screenshots/33-terminal-view-empty.png`
  and `screenshots/33-desktop-view-console.png`.

## halt conditions

- `bridge_mapping_required` if the terminal-dock binding on `Ctrl+\``
  cannot be cleanly rebound (a shared code path forces a bigger
  refactor); halt and surface.
- `dual_contract_fail` if scroll/cursor preservation drifts on any
  round trip.

## definition of done

Two view containers on disk. Toggle wired (mouse + keyboard). Scroll
+ cursor preserved. `PANE_SWITCHED` fires with the two new `to_pane`
values. Grader accepts them. Parity gate + `npm run e2e` + captured
screenshots viewed and clean.
