# Sprint 410 — the files tree, proved on real folders

```yaml
---
id: 410
status: closed
phase: code editor, phase 1 (round 6), R4
pass_kind: functional
---
```

## scope

The editor's left column draws the session workspace's files from the server (`GET /api/session/<id>/files?dir=<rel>`, which writes FILES_LISTED with the folder's entry count): the top folder's entries first, folders before files as the server sorts them; a click on a folder reads and opens it, a second click folds it. Rows follow frame 24a: 16 px each, 12 px mono, ink starting 12 + 14 × depth px from the column's left edge, a folder written `▸ name/` or `▾ name/`. The column's foot names the workspace and its shape (`~/… · flat`, as 24a's `~/code/crumb · worktree`). EDITOR_DRAWN.tree_rows carries the number of rows drawn. A folder the server refuses draws one row naming the status.

Files: `web/app/editor/FileTree.tsx` (new), `web/app/state/editor.ts` (new: the row count the tree reports), `web/app/editor/EditorView.tsx` (mounts the tree and the foot), `web/app/App.tsx` (passes the session and workspace; tree_rows from the store). Four files, logged under hard rule 10.

Gate `harness/shakeout/editor_tree.ts`, end to end on real files: it writes two real folders, a small one of known shape (three levels, folders and files mixed, names that sort differently by case) and a large one (40 folders × 25 files plus 600 files in one folder), binds a session to each through the picker, opens the editor with ⌘⇧E, opens folders by clicking them, and checks four ways that agree:
1. **The filesystem**: the expected rows, computed from the folder on disk with the server's sort.
2. **The DOM**: the rows drawn, by name, kind and depth.
3. **The trace** (after close): each FILES_LISTED in `server.jsonl` has the entry count of the folder on disk, in the order the folders were opened; each EDITOR_DRAWN's tree_rows in `window-1.jsonl` equals the rows on screen at that step.
4. **The pixels** (Addendum A2; sprint 411): a screenshot of the running window, decoded with `harness/pixel/png.ts`: the view's pixel anchor (the proc_seq and fields of the EDITOR_DRAWN the screen shows) and, per 16 px row band inside the tree's visible box, whether it holds ink. (The card first planned to read depth from the x of each row's first ink; that reads text rendering, not state the app encodes, and was replaced by the anchor.)

## prerequisites

- 407, 408, 409

## context_files

- `server.py` (`_session_files`, `_workspace_list`: entries `{name, kind, size, modified}`, folders first, case-insensitive), `web/app/App.tsx`, `web/app/editor/EditorView.tsx`, `web/app/state/chrome.ts` (a store's form), `harness/pixel/png.ts`, `harness/shakeout/lib/electron.ts` (`bindPaneAsUser` with `{ folder }`)
- `web/vm/signals/versions/0.29.json` (FILES_LISTED, EDITOR_DRAWN.tree_rows)
- Design (hard rule 8): spec r6 §5.1 ("files — today's explorer"); D7, D9, D32, D51; `runs/design/sheet-v11/24a.png` (measured: rows 16 px; first ink at x 13, 26, 40 for depths 0, 1, 2; foot line at y 736 of 783)
- `../sdd-kit-3/ADDENDUMS.md` A2 (pixel decode), A3 (a fixture sensitive to the bug: names whose case changes their order, a deep folder, a large folder), A4 (wait on a condition, never a sleep)

## signal contract

### Emits

- `FILES_LISTED` (server; session_id, entries) per folder read.
- `EDITOR_DRAWN` (tree_rows: the rows drawn) after each change of the tree.

### Invariants

- No path in any trace payload (E1): the tree's paths live in the DOM only.
- No INVARIANT_BROKEN.

## artifact contract

### Files created

- `web/app/editor/FileTree.tsx`, `web/app/state/editor.ts`, `harness/shakeout/editor_tree.ts`

### Files modified

- `web/app/editor/EditorView.tsx`, `web/app/App.tsx`, `WORKING_AGREEMENT.md` (hand-author log)

### Command exit codes

- `npx tsc --noEmit` 0; `npm run build` 0; `npm run test:unit` 0.
- `npx tsx harness/shakeout/editor_tree.ts` 0 from source; with `SHAKEOUT_APP` on a fresh bundle, 0 and APP_BOOTED `packaged: true`.
- `npx tsx harness/shakeout/editor_view.ts` still 0.

## observation contract

As the four checks above, on both folders, from source and packaged. Screenshots at 1512×945 to `runs/packaged/sprint-410-<stamp>-<source|packaged>/`, read beside 24a.

### Adversarial

- Could the tree draw rows that do not come from the folder? The rows must equal the filesystem by name and depth, and the server's counts must equal the disk's.
- Could the DOM hold rows the screen does not show? The pixel decode reads the drawn rows from the screenshot.
- Could a large folder silently truncate? The 600-file folder's row count is checked in the DOM, the trace and the server count.

## done criteria

A session's real folder shows its files and folders in the editor, and four independent readings agree on what is shown.

## self-review checklist

- [x] One verifiable property.
- [x] Design canon listed.
- [x] Emits existing tags only.
- [x] Gradable.
- [x] Observation contract: real files, trace, screenshot, pixel decode.
- [ ] Two files: no, four; logged (hard rule 10).
