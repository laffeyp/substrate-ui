# Sprint 083 — Electron top-bar cooperation

```yaml
---
id: 083
status: closed
opened_at: 2026-09-24
closed_at: 2026-09-24
closed_by: agent
closed_note: |
  All four issues resolved. Behavior gate at DPR2: body[data-electron]="1",
  every [data-fake-lights="1"] has display:none, the visible top-bar
  reports padding-left:78px, min-height:38px, webkitAppRegion:"drag",
  and clientRect.height:38. Toggling reveal via the menu keeps the
  visible top-bar at 38px — no doubling. Screenshots at
  /tmp/sprint-083-terminal.png and /tmp/sprint-083-reveal.png show
  the driver and workspace chips sharing one axis in reveal-view.
  Gates: typecheck 0, lint 0, build 0 (reveal.html 193.74 kB → 42.79 kB
  gzipped, +50 B over Sprint 076), smoke:vm 11/11, parity 30/30.
  Reveal shell in plain Chrome untouched — data-electron absent,
  the electron-shell <style> node absent, the eight new data attrs
  inert.
opened_note: |
  Four Electron polish issues share one root cause. Under
  titleBarStyle:'hiddenInset' Chromium reserves the top-left inset
  for real macOS traffic-lights and gives the app the full-width
  title-bar area. The reveal shell was authored for a browser tab
  and draws four decorative dot triads over that same inset, uses
  different vertical padding on strip vs full-header (top-bar
  height changes on reveal toggle), and marks nothing draggable.
  The four issues Peter reported: traffic-lights collide with the
  fake dot sockets; workspace dropdown misaligns in reveal-view;
  top-bar height doubles when toggling reveal; top-bar not
  draggable.
phase: 9
pass_kind: polish
depends_on:
  - 077..082 (Electron wrapping — commits 42e2429, d43cae1,
    9f8738d, 51d9455 under electron/, plus the AXIS_C shakeout
    landing under harness/)
---
```

## scope

One coordinated fix. `electron/main.js` appends `&electron=1` to
loadURL. `web/reveal.ts` reads `electron=1`, sets
`data-electron="1"` on the body, and injects one scoped stylesheet
that hides the decorative dot triads, left-pads the four top-bar
containers by 78px, marks the containers `-webkit-app-region: drag`,
and marks interactive descendants `no-drag`. `web/reveal.html`
carries eight new data attributes — `data-top-bar="1"` on the four
container divs (strip, full-header, per-pane header, first-run
header) and `data-fake-lights="1"` on the four dot triads inside
them. No selector change on the interactive matches — they land on
`input`, `button`, and inline styles containing `cursor:pointer`,
which dc-runtime emits verbatim for the shell's clickable spans.

The reveal shell in a plain Chrome tab is unchanged. `data-electron`
is absent, the stylesheet does not install, and every rule scopes
under `body[data-electron="1"]`.

## prerequisites

- Phase 9 wrapping code on disk (Sprints 077–082).
- Real traffic-lights inset per `electron/main.js`:
  `titleBarStyle:'hiddenInset'`, `trafficLightPosition:{x:12,y:16}`.

## context_files

- `sdd-kit-2/AGENTS.md`
- `electron/main.js` (line 154 loadURL; line 137
  trafficLightPosition).
- `web/reveal.html` (lines 20, 23, 46, 481 — the four top-bar
  containers; the four dot triads embedded in them).
- `web/reveal.ts` (URL-parameter parsing at line ~91).
- `process/planning/PLAN-2026-09-24-phase-9-electron-wrapping.md`
  §2.3 (reveal shell untouched — this sprint touches it only via
  cooperative data attributes; the renderer contract with the
  wrapping is unchanged for non-Electron loads).

## signal contract

### Emits
None new.

### Consumes
`signals/0.1.json` at 30 tags. Every runtime signal that fired
under the reveal shell keeps firing.

### Invariants
- No vocabulary change.
- Plain-browser reveal shell renders identically to Sprint 076
  close.
- Under Electron, the reveal shell's DOM matches the plain-browser
  shell in every respect except the eight new data attributes,
  `document.body`'s `data-electron` attribute, and one `<style
  data-electron-shell="1">` node.

## artifact contract

### Files modified
- `electron/main.js` (one string change on the loadURL call).
- `web/reveal.ts` (one branch under `boot()` reading the URL param,
  setting the body attribute, appending one style node).
- `web/reveal.html` (eight data attributes on four containers and
  four triads).

### Files created
- `process/sprints/sprint-083-electron-top-bar-polish.md` (this
  card).

### Content assertions
- `grep -c 'data-fake-lights="1"' web/reveal.html` returns 4.
- `grep -c 'data-top-bar="1"' web/reveal.html` returns 4.
- `grep -c '&electron=1' electron/main.js` returns 1.
- `grep -c 'data-electron-shell' web/reveal.ts` returns 1.

### Command exit codes
- `npm run typecheck` returns 0.
- `npm run lint` returns 0.
- `npm run build` returns 0.
- `npm run smoke:vm` returns 0.
- `npx tsx web/vm/tools/check-vocabulary-parity.ts` returns 0
  (30/30, unchanged).

## observation contract

### UI driving steps
Launch `npm run electron`. Wait for the reveal shell to mount.

### Expected visible behavior
- Real macOS traffic-lights sit at `{x:12, y:16}` with no gray
  socket ring under them (the fake triad is `display:none`).
- The top-bar's leftmost usable content begins at ~78px in from the
  left edge, clear of the traffic-light column.
- Toggling reveal (Ctrl-\`) does not change the top-bar's vertical
  footprint — strip and full-header both hit `min-height: 38px`.
- Dragging the top bar moves the window. Clicking a `records` or
  `studio` link, opening the driver dropdown, opening the workspace
  dropdown, typing in the pane-rename input all behave normally —
  those descendants are `no-drag`.
- The workspace dropdown in reveal-view aligns to the same axis as
  the driver dropdown (both open below their trigger chip; neither
  is offset by the vanished decorative dots).

### Expected log substrings
- No `page error` lines in the Electron main-process stderr.
- No CSS parse warnings from Chromium DevTools console.

### Expected runtime signals
- Parity gate at 30/30. Every signal that fired before this sprint
  still fires; no new tags.

## done criteria

The four issues Peter reported all resolve. The reveal shell in
Chrome is byte-identical to Sprint 076 close except for the eight
data attributes (which are inert without `data-electron`). Electron
menu wire-up and deep-link wire-up (Sprints 080, 081) continue to
work; the URL-param addition sits on the query string alongside
`atom-transcript=1`.

## notes

Phase 9's plan §6 R5 named the `hiddenInset` + trafficLightPosition
misalignment as a Sprint 078 exit criterion (screenshot check that
the header chip row still passed with top edges aligned). That
check was not encoded in Sprint 078; Sprint 083 catches the four
issues manual launch surfaced and encodes the check as the
behavior gate above.

Scope in this sprint: the URL param, the body attribute, the
scoped stylesheet, the eight data attributes. Scope out: any
change to the Electron main-process process-group signalling,
deep-link buffering, menu wiring, transcript rendering, or the
signal vocabulary.
