# Sprint 392 — File tree component in the left column

```yaml
---
id: 392
status: reverted
phase: code editor, phase 1
pass_kind: functional
---
```

## scope

The left column of the editor shell renders a collapsible file tree rooted at the session's workspace. Expanding a folder calls `window.native.listDir` and draws its children. Files and directories are sorted: directories first, then files, alphabetical within each group. The tree starts with the workspace root expanded one level.

The tree component lives in `web/app/editor/FileTree.tsx`. EditorShell passes the workspace path as a prop. App.tsx reads the workspace path from the focused pane's snapshot and passes it to EditorShell.

Clicking a file does nothing yet (file opening comes in Phase 2). Clicking a folder toggles it open/closed.

## prerequisites

- Sprint 391 (the `listDir` IPC channel exists)
- Sprint 390 (the left column exists and folds)

## context_files

- `web/app/editor/EditorShell.tsx` (the left column where the tree renders)
- `web/app/App.tsx` (passes EditorShell its props, reads the snapshot)
- `electron/preload.ts` (the `listDir` bridge)
- `web/vm/signals.gen.ts` (Signal enum, payload types)
- `web/vm/instrumentation/sdd.ts` (emitSignal)

## signal contract

### Emits

None new — FILES_LISTED already fires from the server-side file API. The tree calls the IPC channel directly. A FILES_LISTED emit from the renderer would double-count with the server's. The tree is read-only display wiring; the signal for "a directory was listed" is owned by the file API.

### Invariants

- The tree calls `listDir` only with paths under the workspace root.
- EditorShell does not import Transcript or any lens module (sprint 390 invariant preserved).
- FileTree.tsx does not import any component outside `web/app/editor/`.

## artifact contract

### Files created

- `web/app/editor/FileTree.tsx` — the file tree component. Props: `workspacePath: string`. Calls `window.native.listDir` on expand. Renders a nested list of files and directories.

### Files modified

- `web/app/editor/EditorShell.tsx` — the left column renders `<FileTree>` when not folded. Gains a `workspacePath` prop.
- `web/app/App.tsx` — reads `workspacePath` from the focused pane's snapshot and passes it to EditorShell.

### Content assertions

- `web/app/editor/FileTree.tsx` exists and contains `listDir`.
- `web/app/editor/EditorShell.tsx` contains `FileTree`.
- `web/app/App.tsx` contains `workspacePath` in the EditorShell render.
- `npx tsc --noEmit` returns 0.
- `npm run build` returns 0.

### Command exit codes

- `npx tsc --noEmit` returns 0
- `npm run build` returns 0

## observation contract

### UI driving steps

1. Launch, bind a session with a workspace.
2. Send a message and wait for park (the session creates workspace files).
3. Open the editor (⌘⇧E).
4. The left column renders the workspace root's contents as a tree.
5. A directory entry in the tree is clickable; clicking it expands it to show children.
6. Clicking an expanded directory collapses it.

### Expected runtime signals

- EDITOR_OPENED fires when ⌘⇧E is pressed.
- EDITOR_DRAWN fires with the editor's structural state.

## done criteria

The left column renders a file tree of the session's workspace. Directories expand and collapse on click. Files are listed with their names. The tree starts with the root expanded.

## self-review checklist

- [x] Scope is concrete and bounded: one new file, two modified.
- [x] `context_files` covers EditorShell, App.tsx, preload, signals.gen, instrumentation.
- [x] Signal contract is present (explains why no new emits).
- [x] Artifact contract is gradable.
- [x] Observation contract is present.
- [x] Sprint sweet spot: 3 files (1 created, 2 modified).

## result

### Artifact contract

- `web/app/editor/FileTree.tsx` exists and contains `listDir`: PASS.
- `web/app/editor/EditorShell.tsx` contains `FileTree`: PASS.
- `web/app/App.tsx` contains `workspacePath` in the EditorShell render: PASS.
- `npx tsc --noEmit`: 0.
- `npm run build`: 0.

### Observation contract

Gate test `harness/shakeout/file_tree_render.ts` — 7 checks, all pass:
1. Editor shell visible after toggle-editor command.
2. File tree (`[data-file-tree]`) visible in the left column.
3. Tree renders 1 node for the workspace root (a `.git` directory in the fresh sandbox).
4. Expanding the directory: tree grows from 1 to 11 nodes (the `.git` folder's 10 children).
5. Collapsing the directory: tree returns to 1 node.
6. Left column folds to rail (⌥⌘L) — tree hidden, rail visible.
7. Unfolding restores the tree.

Sprint 389 gate: no regression.

### Rubber Duck Pass

**Step 1 — Sequence narration.** No new signals emitted by the tree component. EDITOR_OPENED and EDITOR_DRAWN fire from the existing toggle path (sprint 389). The tree calls `window.native.listDir` directly; FILES_LISTED is owned by the server-side file API and is not duplicated here.

**Step 2 — Observations.**
- Missing pair: N/A — no new signals.
- Order violation: N/A.
- Vocabulary gap: the tree's expand/collapse action has no signal. A directory expand is a UI-only event that doesn't map to a vocabulary entity — the session's file API has FILES_LISTED for its own list calls; the tree's IPC call is a renderer read, not a session action. No gap.
- Payload anomaly: N/A.
- Timing surprise: N/A.
- Tone trace: N/A.

**Step 3 — Disposition.** Clean pass.
