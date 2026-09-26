# Sprint 081 — `substrate://` deep-link handler + buffered dispatch

```yaml
---
id: 081
status: closed
opened_at: 2026-09-24
closed_at: 2026-09-24
closed_by: agent
commit: 51d9455
phase: 9
pass_kind: implementation
---
```

## scope

Second of the two OS-integration wire-up sites. `substrate://record/<id>` from anywhere on the OS opens (or focuses) the app and attaches the focused pane to that record. Cold-launch deep-links buffer until the renderer is ready.

## deliverables (from the commit)

- `electron/main.js`
  - `app.setAsDefaultProtocolClient('substrate')` registers the handler at runtime; a shipping installer's Info.plist entry (Phase 10) completes the system-registered handshake.
  - `app.on('open-url', ...)` — macOS delivery path. `preventDefault` then `forwardDeepLink(url)`.
  - `requestSingleInstanceLock` + `app.on('second-instance', ...)` — Windows/Linux delivery path. Extracts `substrate://` from argv, focuses the existing window, forwards. Second launches quit.
  - `forwardDeepLink` queues into `pendingDeepLinks` until `rendererReady` flips true on `did-finish-load`, then flushes in order. Reuses the pattern the 2026-09-12 `electron/main.js` used (see `_deprecated/electron-bridge-2026-09-12/main.js:51-72`).
  - Logs `flushing <N> buffered deep-link(s)` when the flush fires so the cold-launch exit test can observe the buffered dispatch.

- `electron/preload.js` — `ipcRenderer.on("deep-link")` added; a `deepLinkListeners` `Set` dispatches to callbacks registered via `window.native.onDeepLink(cb)`. The `contextBridge` wrapper still delivers only `url`; no raw `IpcRendererEvent` leaks.

- `web/reveal.ts` — second OS-integration wire-up. On deep-link `substrate://record/<id>`, `decodeURIComponent` the id and call `controller.attachRecordRoot(...)` on the focused pane's controller (same code path the descend affordance uses). Non-Electron browsers no-op.

- `harness/_electron_sprint081_exit.ts` — two paths asserted:
  - **Warm.** After `firstWindow`, emit `open-url` from main; recorder installed via `window.native.onDeepLink` sees the URL.
  - **Cold.** Emit `open-url` before `firstWindow` returns; assert the main-side `flushing 1 buffered deep-link` log line appears in stderr, verifying the buffered dispatch fired on `did-finish-load`. The renderer-side `__deepLinks` recorder cannot be installed early enough to catch the buffered flush, so the assertion moves to the main-side log line the flush emits.

## exit gates (verified by the commit)

- typecheck ✓
- lint ✓
- 14/14 unit ✓
- `[vm-vocab-parity] OK — vocabulary 0.1 (30 tags: 30 live + 0 retired, locked=true); code emits 30 distinct live tag(s), all locked.`
- smoke:vm 11/11 ✓

## follow-up

Sprint 082: Electron smoke harness under Playwright's `_electron.launch`, joined as AXIS_C in the shakeout.

## artifact

Commit `51d9455` (2026-09-24 17:18:02 -0700). Card is the retro-summary Peter asked for on 2026-09-25.
