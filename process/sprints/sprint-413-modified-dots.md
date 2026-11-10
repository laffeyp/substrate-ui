# Sprint 413 — files changed against main carry the accent dot, and follow the work

```yaml
---
id: 413
status: closed
phase: code editor, phase 1 (round 6), R5
pass_kind: functional
---
```

## scope

`web/app/editor/FileTree.tsx` reads the session's diff (sprint 412) and draws one accent dot (#82a5c8, 5 px) after each changed file's name, none on folders (frame 24a; D7). It listens to the server's watch stream (`/files/watch`): on a change it reads the diff and every folder it has read again, so new files and dots appear as the work lands (D93). `.git` is left out of the tree. The dot count goes to `state/editor.ts`, EDITOR_DRAWN.modified_dots and the pixel anchor. `harness/shakeout/lib/editor_pixels.ts` (the shared screenshot reader) counts row bands holding the accent colour. Gate `harness/shakeout/editor_dots.ts` on a real repository (main, and a branch ahead of it; then an edit and a new file written into the session's workspace) and a plain folder the kernel makes a one-commit repository.

## context_files

- `web/app/editor/FileTree.tsx`, `web/app/state/editor.ts`, `web/app/App.tsx`, `server.py` (`_session_files_watch`, `_workspace_snapshot`), `harness/shakeout/editor_tree.ts`, `harness/pixel/png.ts`
- Design: spec r6 §5.1, D7, D48, D93; `runs/design/sheet-v11/24a.png` (dots after `cart.ts` and `cart.test.ts`; none on folders)

## observation contract

At each step, four readings agree: `git` in the session's workspace (changed since main's merge-base, plus untracked not ignored); the DOM's dots; the pixels (the anchor's modified_dots, the accent bands); after close, the EDITOR_DRAWN the anchor names and the DIFF_READ counts in `server.jsonl`.

### Adversarial

- Could the dots be drawn from something other than the diff? Their files must equal what `git` itself reports, computed by the gate in a different way (`git diff --name-only` plus `git ls-files --others`).
- Could the dots stay stale after the work changes files? The gate writes to disk and requires the new set on screen and in the trace.
