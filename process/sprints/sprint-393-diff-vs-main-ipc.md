# Sprint 393 — IPC channel for diff vs main

```yaml
---
id: 393
status: reverted
phase: code editor, phase 1
pass_kind: functional
---
```

## scope

The renderer can request the list of files modified relative to the merge-base of main (or the default branch) via `window.native.diffVsMain(workspace)`. The main process runs `git merge-base main HEAD` and `git diff --name-status <base>` in the workspace, including untracked files via a scratch index. Returns an array of `{ path, status }` entries where status is one of "A" (added), "M" (modified), "D" (deleted). For workspaces with no git or no main branch, returns an empty array.

This is the plumbing sprint — the modified dots on the file tree come in the next sprint.

## prerequisites

- Sprint 391 (the `listDir` IPC pattern is established)

## context_files

- `electron/main.ts` (IPC handlers)
- `electron/preload.ts` (the native bridge)

## signal contract

### Emits

None — plumbing sprint.

### Invariants

- The IPC call validates that the workspace path is real and contains a `.git` directory before running git commands.
- The scratch index is a temporary file; the workspace's own index is never modified.

## artifact contract

### Files modified

- `electron/main.ts` — gains `ipcMain.handle("native:diff-vs-main", ...)` that runs the git commands and returns `{ path, status }[]`.
- `electron/preload.ts` — gains `diffVsMain: (workspace) => ipcRenderer.invoke("native:diff-vs-main", workspace)` on the native bridge.

### Content assertions

- `electron/main.ts` contains `native:diff-vs-main`.
- `electron/preload.ts` contains `diffVsMain`.
- `npx tsc --noEmit` returns 0.
- `npm run build` returns 0.

### Command exit codes

- `npx tsc --noEmit` returns 0
- `npm run build` returns 0

## observation contract

### UI driving steps

1. Launch, bind a session with a workspace.
2. Send a message that writes a file (the session creates files in the workspace).
3. Call `window.native.diffVsMain(workspacePath)` in DevTools.
4. The call returns entries with modified files.

### Expected runtime signals

None (plumbing sprint).

## done criteria

`window.native.diffVsMain(workspace)` returns the list of files changed relative to the merge-base of main, with their git status codes.

## self-review checklist

- [x] Scope is concrete and bounded: one IPC channel, two files.
- [x] `context_files` covers main.ts, preload.ts.
- [x] No signal contract (plumbing sprint).
- [x] Artifact contract is gradable.
- [x] Observation contract is present.
- [x] Sprint sweet spot: 2 files modified.

## result

### Artifact contract

- `electron/main.ts` contains `native:diff-vs-main`: PASS.
- `electron/preload.ts` contains `diffVsMain`: PASS.
- `npx tsc --noEmit`: 0.
- `npm run build`: 0.

### Observation contract

Gate test `harness/shakeout/diff_vs_main_ipc.ts` — 4 checks, all pass:
1. workspacePath read from pane 1 snapshot.
2. `diffVsMain(ws)` returns a valid `{ files }` object (0 files — correct for a fresh repo where HEAD is main).
3. Entry shape validated (path, status strings).
4. Nonexistent workspace returns empty array.

### Rubber Duck Pass

**Step 1 — Sequence narration.** No signals emitted (plumbing sprint).

**Step 2 — Observations.**
- Missing pair: N/A.
- Order violation: N/A.
- Vocabulary gap: N/A.
- Payload anomaly: N/A.
- Timing surprise: N/A.
- Tone trace: N/A.

**Step 3 — Disposition.** Clean pass.
