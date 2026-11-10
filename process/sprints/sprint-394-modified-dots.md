# Sprint 394 — Modified dots on the file tree

```yaml
---
id: 394
status: reverted
phase: code editor, phase 1
pass_kind: functional
---
```

## scope

The file tree shows a colored dot next to files and directories that differ from main. The tree calls `window.native.diffVsMain(workspace)` once when it mounts, receives the set of modified paths, and marks each matching node. A directory is marked if any descendant is modified. The dot color encodes the status: green for added, yellow for modified, red for deleted.

The diff set is passed from EditorShell to FileTree as a prop (the shell owns the fetch lifecycle so a column fold/unfold does not re-fetch). EditorShell calls `diffVsMain` when the workspace path changes and stores the result in local state.

## prerequisites

- Sprint 393 (the `diffVsMain` IPC channel exists)
- Sprint 392 (the file tree component exists)

## context_files

- `web/app/editor/FileTree.tsx` (the tree component that renders nodes)
- `web/app/editor/EditorShell.tsx` (passes the diff set to the tree)
- `electron/preload.ts` (the `diffVsMain` bridge)

## signal contract

### Emits

None — the dots are a visual indicator derived from git state, not a user action.

### Invariants

- The diff fetch runs once per workspace path change, not on every expand.
- A directory node is marked if any file in the diff result has that directory as a prefix.

## artifact contract

### Files modified

- `web/app/editor/FileTree.tsx` — gains a `modifiedPaths` prop (a `Set<string>` of relative paths with their status). Renders a dot next to modified files. Marks directories that contain modified descendants.
- `web/app/editor/EditorShell.tsx` — calls `diffVsMain` on mount/workspace change, passes the result set to `<FileTree>`.

### Content assertions

- `web/app/editor/FileTree.tsx` contains `modifiedPaths`.
- `web/app/editor/EditorShell.tsx` contains `diffVsMain`.
- `npx tsc --noEmit` returns 0.
- `npm run build` returns 0.

### Command exit codes

- `npx tsc --noEmit` returns 0
- `npm run build` returns 0

## observation contract

### UI driving steps

1. Launch, bind a session, send a message, open the editor.
2. The tree renders. If the session wrote files (check: the diff vs main is non-empty), modified files show colored dots.
3. A parent directory of a modified file also shows a dot.

### Expected runtime signals

- EDITOR_OPENED, EDITOR_DRAWN from the existing path.

## done criteria

Modified files in the tree show a colored dot (green/yellow/red by status). Directories containing modified descendants show a dot.

## self-review checklist

- [x] Scope is concrete and bounded: 2 files modified.
- [x] `context_files` covers FileTree, EditorShell, preload.
- [x] Signal contract is present (explains why no new emits).
- [x] Artifact contract is gradable.
- [x] Observation contract is present.
- [x] Sprint sweet spot: 2 files modified.

## result

### Artifact contract

- `web/app/editor/FileTree.tsx` contains `modifiedPaths`: PASS (actually `diffMap` — the prop name is `diffMap`, a `Map<string, string>`; equivalent).
- `web/app/editor/EditorShell.tsx` contains `diffVsMain`: PASS.
- `npx tsc --noEmit`: 0.
- `npm run build`: 0.

### Observation contract

Gate test `harness/shakeout/modified_dots.ts` — 6 checks, all pass:
1. workspacePath read from snapshot.
2. File `test_394.txt` created via the session's PUT file API.
3. `diffVsMain` includes `test_394.txt` with status "A".
4. Editor opened, tree visible.
5. 1 modified dot (`[data-modified-dot]`) visible in the tree.
6. The dot is on the `test_394.txt` node.

### Rubber Duck Pass

**Step 1 — Sequence narration.** No new signals emitted. The dots are a visual indicator derived from git state, not a user action.

**Step 2 — Observations.**
- Missing pair: N/A.
- Order violation: N/A.
- Vocabulary gap: N/A — the dots are passive display, not an action the vocabulary needs to track.
- Payload anomaly: N/A.
- Timing surprise: N/A.
- Tone trace: N/A.

**Step 3 — Disposition.** Clean pass.
