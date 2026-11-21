# Sprint 534 — ⌘Q during a busy page

```yaml
---
id: 534
status: pending
phase: window productionized (roadmap 2026-11-18-window-productionizing r1, W12)
pass_kind: observation
depends_on: [525, 533]
plan: process/planning/2026-11-18-window-productionizing/ROADMAP-2026-11-19-window-productionizing-r1.md
---
```

## scope

A measurement: a real ⌘Q key event sent to the app while the W1 gate's session loads, timed from the key to `APP_QUIT_REQUESTED` in the trace, against the same measurement on an idle window. If the busy-page quit is within 2× the idle quit, W2–W3 fixed it and this sprint records the measurement and closes. If the busy-page quit is slower than 2×, the cause is diagnosed before a fix card is written. One verifiable property: the measurement is taken with a real ⌘Q (the focusable window, `GATE_ISOLATED=0`), not a simulated event, and the results are recorded on `BLACKBOARD.md`.

## prerequisites

- 525 (W3: the scroll anchor per frame; the page is no longer frozen in layout during load)
- 533 (W11: stream resumes; all prior W-items are built; this sprint runs when the screen is free)

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json`
- `BLACKBOARD.md` (decision entries, tail)
- `WORKING_AGREEMENT.md`
- `electron/main.ts` — `before-quit`, `APP_QUIT_REQUESTED`, the server shutdown path
- `electron/menu.ts` — `{ role: "quit" }` at line 54
- `harness/shakeout/long_session_open.ts` — the W1 gate, whose session provides the busy load
- `process/planning/2026-11-18-window-productionizing/RESEARCH-2026-11-20-window-productionizing-r5.md` (§ "Not known", ⌘Q)

## signal contract

### Emits (read from the trace; no new tags)

- `APP_QUIT_REQUESTED` with `cause` after the ⌘Q key.

### Invariants

- The measurement window is focusable (`GATE_ISOLATED=0` or not set) so the key reaches it.
- The measurement needs macOS Accessibility permission for the process that sends the key.
- The app quits cleanly after the measurement (server shutdown, trace closed).

## artifact contract

### Files created

- `harness/shakeout/quit_during_load.ts` — the measurement script. Not a gate (it needs focus and Accessibility permission); a manual-run script.

### Content assertions

- The script sends a real ⌘Q via `osascript` or `cliclick` or Accessibility API.
- The script reads `APP_QUIT_REQUESTED` from the trace and reports the time from key to tag.
- Two runs: one idle (no session loading), one busy (W1's session loading).

### Command exit codes

- `npx tsc -p harness --noEmit` returns 0.

## observation contract

### UI driving steps

- Idle run: launch the app, wait for the window, send ⌘Q, read the trace.
- Busy run: launch the app, start opening the W1 session, send ⌘Q during the load, read the trace.

### Expected runtime signals

- `APP_QUIT_REQUESTED` in both runs.
- The trace's closing record (`will-quit`) in both runs.

## done criteria

The ⌘Q measurement is taken; the results are recorded on `BLACKBOARD.md`; if the busy quit is within 2× idle, the sprint closes as W2–W3's fix; if not, the cause is named and a fix card is written.

## notes

- This sprint runs when the screen is free — the measurement needs focus and keyboard access, so no other gate can run at the same time.
- The 2× threshold is generous. An idle quit should be < 500 ms (menu → before-quit → server shutdown → quit); the busy quit after W2–W3 should be similar because the page is no longer frozen.
- If the ⌘Q still hangs: the likely cause is Electron's key routing. ⌘Q goes to the system menu, which calls `app.quit()`, which fires `before-quit` on main. Main is idle (the page is busy). So the key should reach main. If it doesn't, the key is going to the page first (the BrowserWindow's webContents), and the frozen page holds it. The fix: the menu's quit handler calls `app.quit()` directly, bypassing the page.

## self-review checklist

- [ ] Scope is concrete and bounded (one paragraph; one verifiable property of the artifact).
- [ ] `context_files` covers everything the Agent needs to read.
- [ ] Signal contract's `Emits` list references only tags in the vocabulary.
- [ ] Artifact contract is gradable: content assertions are concrete, command exit codes are runnable.
- [ ] If `pass_kind: observation`: observation contract is present.
- [ ] Sprint sweet spot honored: 0 files modified (measurement only), one concept.
