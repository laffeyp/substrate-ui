# Sprint 528 — A dead or hung page is reopened

```yaml
---
id: 528
status: closed
phase: window productionized (roadmap 2026-11-18-window-productionizing r1, W6)
pass_kind: functional
depends_on: [527]
plan: process/planning/2026-11-18-window-productionizing/ROADMAP-2026-11-19-window-productionizing-r1.md
---
```

## scope

When a window's renderer dies (`render-process-gone`), the main process shows a dialog with the reason and exit code, and two buttons: Reopen and Close. Reopen loads the window again on the same panes. A second death within 60 s of a reopen does not reopen the same sessions without a confirmation dialog ("This window crashed again. Reopen without these sessions?"). When the page has not answered for its first unresponsive report, main shows Reopen, Keep Waiting and Close. New vocabulary tags for the recovery are proposed and ratified. One verifiable property: a gate kills the renderer (`process.crash()` through DevTools protocol), sees the dialog, clicks Reopen, and sees the session drawn again.

## prerequisites

- 527 (W5: error boundaries; the boundary catches soft errors, this sprint catches hard ones)

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json`
- `BLACKBOARD.md` (decision entries, tail)
- `WORKING_AGREEMENT.md`
- `electron/main.ts` — the `render-process-gone` handler (line 686), the `unresponsive` handler (line 692), the window-creation function, the pane tracking; read the full window management section
- `electron/menu.ts` — the Window menu, if the reopen adds an item
- `electron/preload.ts` — if the page needs to report its panes to main before a crash

## signal contract

### Emits

- `RENDERER_GONE` (existing; already fires)
- `WINDOW_UNRESPONSIVE` (existing; already fires)
- New tags to propose: `RENDERER_RECOVERY_OFFERED` (dialog shown), `RENDERER_RECOVERY_CHOSEN` (user picked Reopen or Close), `WINDOW_REOPENED` (window loaded again after crash). Exact names determined by the vocabulary proposal.

### Consumes

- As listed in `context_files`.

### Invariants

- The vocabulary change is proposed, ratified, version bumped, and recorded.
- Reopen defers the `webContents.reload()` by one task (`setTimeout(..., 0)`) to avoid the Electron PR #51900 crash.
- The pane ids the window was showing are known to main before the crash (main already tracks windows; verify by reading the code).
- The 60 s rapid-crash guard is a named constant.

## artifact contract

### Files created

- `harness/shakeout/renderer_crash_recovery.ts` — the gate.

### Files modified

- `electron/main.ts` — the `render-process-gone` handler shows a dialog and reopens; the `unresponsive` handler shows a dialog after a threshold; a rapid-crash guard with a 60 s window.
- Vocabulary files — the new tags and version.

### Content assertions

- `main.ts` contains `dialog.showMessageBox` (or Electron's dialog API) in the `render-process-gone` handler.
- `main.ts` contains `setTimeout` or `setImmediate` before the reload/reopen call.
- The gate file asserts the dialog appeared, the reopen succeeded, and the session's last row is drawn.

### Command exit codes

- `npx tsc -p harness --noEmit` returns 0.
- `npm run test:unit` returns 0.
- `npm run gates:electron` — the new crash-recovery gate passes; existing gates pass.

## observation contract

### UI driving steps

- The gate launches the app, opens a session, kills the renderer via CDP (`process.crash()`), waits for the dialog, clicks Reopen, and checks:
  - The window reloads.
  - The session's transcript is drawn.
  - `RENDERER_GONE` and the recovery tags appear in the trace.

### Expected runtime signals

- `RENDERER_GONE` with the crash reason.
- The proposed recovery tags in order: offered → chosen → reopened.
- No `INVARIANT_BROKEN`.

### Expected screenshot / visual state

- After reopen: the session's transcript is visible; the window is not grey.

## done criteria

A dead renderer shows a dialog and reopens on request; a hung page offers the same after a threshold; a rapid re-crash asks before reopening the same sessions; a gate proves each path; vocabulary tags record the recovery.

## notes

- VS Code's pattern in `windowImpl.ts`: "The window terminated unexpectedly (reason: '{0}', code: '{1}')" with Reopen. The dialog text follows this form.
- The gate uses Playwright's Electron helper to access the BrowserWindow. Killing the renderer: `win.webContents.debugger.sendCommand("Runtime.evaluate", { expression: "process.crash()" })` or Playwright's CDP session.
- The unresponsive dialog threshold: Electron fires `unresponsive` after the page has not answered for a while (usually 5–10 s). The sprint's dialog shows only after the first report, not on every repeated 16 s report.
- Pane tracking: main already knows each window's id. The panes' session ids are communicated to main via IPC from the page. Verify whether this IPC already exists; if not, add it.

## self-review checklist

- [ ] Scope is concrete and bounded (one paragraph; one verifiable property of the artifact).
- [ ] `context_files` covers everything the Agent needs to read.
- [ ] Signal contract's `Emits` list references only tags in the vocabulary (or the proposed bump).
- [ ] Artifact contract is gradable: content assertions are concrete, command exit codes are runnable.
- [ ] If `pass_kind: functional`: observation contract is present.
- [ ] Sprint sweet spot honored: 1 file modified + 1 created, one concept.
