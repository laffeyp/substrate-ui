# Sprint 391 — IPC channel for workspace directory listing

```yaml
---
id: 391
status: reverted
phase: code editor, phase 1
pass_kind: functional
---
```

## scope

The renderer can list the contents of a directory on the filesystem via `window.native.listDir(path)`. The main process reads the directory with `fs.readdir` and returns an array of entries, each with `name`, `type` ("file" or "directory"), and `size`. The preload exposes it. The call rejects on a path outside the session's workspace (the workspace path is passed to main on each call; main validates the listed path is under it). A missing or unreadable directory returns an empty array, not an error.

This is the plumbing sprint — the file tree component that calls `listDir` comes in the next sprint.

## prerequisites

- Sprint 389 (the editor shell exists)

## context_files

- `electron/main.ts` (IPC handlers, line 898+)
- `electron/preload.ts` (the native bridge exposed to the renderer)
- `web/vm/types.ts` (Snapshot has `workspacePath`)

## signal contract

### Emits

None — this is a plumbing sprint. The file tree's signals come when the tree component uses the API.

### Invariants

- The IPC call rejects or returns an empty array for a path outside the workspace root (no directory traversal).
- The renderer's sandbox stays intact: `contextBridge.exposeInMainWorld` is the only bridge.

## artifact contract

### Files modified

- `electron/main.ts` — gains `ipcMain.handle("native:list-dir", ...)` that reads a directory and returns `{ name, type, size }[]`.
- `electron/preload.ts` — gains `listDir: (workspace, path) => ipcRenderer.invoke("native:list-dir", workspace, path)` on the native bridge.

### Content assertions

- `electron/main.ts` contains `native:list-dir`.
- `electron/preload.ts` contains `listDir`.
- `npx tsc --noEmit` returns 0.
- `npm run build` returns 0.

### Command exit codes

- `npx tsc --noEmit` returns 0
- `npm run build` returns 0

## observation contract

### UI driving steps

1. Launch, bind a session with a workspace.
2. In DevTools console, call `window.native.listDir("/path/to/workspace", "/path/to/workspace")`.
3. The call returns an array of entries with `name`, `type`, and `size`.

### Expected runtime signals

None (plumbing sprint).

## done criteria

`window.native.listDir(workspace, path)` returns directory entries from the Electron main process, with path validation.

## notes

The `listDir` takes two arguments: `workspace` (the session's workspace root, for validation) and `path` (the directory to list). Main checks that `path` starts with `workspace` after `path.resolve`. This prevents the renderer from listing arbitrary directories.

The 20,000-file cap from the roadmap's failure list applies here: if a directory has more than 20,000 entries, the result is truncated and a `truncated: true` flag is set.

## self-review checklist

- [x] Scope is concrete and bounded: one IPC channel, two files.
- [x] `context_files` covers main.ts, preload.ts.
- [x] No signal contract (plumbing sprint).
- [x] Artifact contract is gradable.
- [x] Observation contract is present.
- [x] Sprint sweet spot: 2 files modified.

## result

### Artifact contract

- `electron/main.ts` contains `native:list-dir`: PASS (`grep -c "native:list-dir" electron/main.ts` → 1).
- `electron/preload.ts` contains `listDir`: PASS (`grep -c "listDir" electron/preload.ts` → 1).
- `npx tsc --noEmit`: 0.
- `npm run build`: 0.

### Observation contract

Gate test `harness/shakeout/list_dir_ipc.ts` — 5 checks, all pass:
1. workspacePath read from pane 1 snapshot after bind + first message round-trip.
2. `listDir(ws, ws)` returns entries (1 dir, 0 files for the fresh sandbox workspace).
3. Entry shape validated: `name` (string), `type` ("file"|"directory"), `size` (number).
4. Path outside workspace (`/tmp`) returns empty array — sandbox enforced.
5. Nonexistent subdirectory returns empty array, no throw.

### Rubber Duck Pass

**Step 1 — Sequence narration.** No signals emitted (plumbing sprint). The IPC channel is infrastructure; signal-emitting code comes with the file tree component.

**Step 2 — Observations.**
- Missing pair: N/A — no signals.
- Order violation: N/A.
- Vocabulary gap: N/A — no new behavior exposed to the user yet.
- Payload anomaly: N/A.
- Timing surprise: N/A.
- Tone trace: N/A.

**Step 3 — Disposition.** Clean pass. No observations to dispose.
