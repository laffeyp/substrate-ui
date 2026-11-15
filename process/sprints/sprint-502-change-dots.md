# Sprint 502 — Changed files marked, and every folder on the way to them

```yaml
---
id: 502
status: closed
phase: editor features (roadmap 2026-11-14 r4, E4)
pass_kind: functional
---
```

## scope

The Architect, 2026-11-14: "I'm also not seeing in the editor any blue dots … There should be the blue dot by the folder and then all the folders and all the way down to the file." Two causes. (1) A workspace that is not a git repository gets no marks: `_diff_base` (`server.py` line 2038) returns `none` and the diff route sends no files, though repositories may sit inside it (Agent Orchestration holds `substrate/` and `substrate-ui/`). The diff then reads each repository found under the workspace, each against its own HEAD, paths given relative to the workspace. (2) Folders carry no dot (sprint 413, `FileTree.tsx`): every folder that holds a changed file, at any depth, carries the dot too. A workspace that is itself a repository is read as today. Change recognition starts at the repository, always (the Architect, 2026-11-14): a folder outside every repository gets no marks; inside a repository, the dots run from the repository's own folder down to the changed file; folders of the plain workspace above the repository carry none. One verifiable property: in a plain folder holding two repositories and loose files, an uncommitted edit three folders deep in one repository dots the file, each folder above it up to the repository's folder, and that folder; nothing in the other repository, and no loose file or folder outside both.

## signal contract

Vocabulary proposal at build time: `DIFF_READ.base` gains a value for a plain folder read through the repositories inside it, and a count of them; `EDITOR_DRAWN.modified_dots` counts files, a new field counts folders.

## observation contract

Gate on the bundle on a large real fixture: a plain folder holding two repositories, each many files deep; edits and new files at several depths; the tree opened down to each; DOM, pixel anchor and trace agree; screenshot read. Mutants: the plain folder read as `none`; folders undotted.

## done criteria

What changed shows from the top folder down to the file, in a repository or in a folder of repositories.

## close

`server.py`: `_repositories_under` finds the repositories inside a plain workspace (a folder holding `.git`, not entered; hidden folders, `node_modules`, `.venv`, `dist`, `build`, `target` skipped; four folders deep). `_workspace_diff` reads each against its own HEAD and returns workspace paths with `repos`; a workspace inside a repository returns `repos: [""]`. `_workspace_hunks` reads a file through the nearest repository above it. `FileTree.tsx` dots every folder above a changed or deleted file, from its repository's folder down, and nothing above. Vocabulary 0.71 (P-0.71-DIFF-REPOSITORIES): `DIFF_READ.base` `repositories`, `DIFF_READ.repositories`.

On Agent Orchestration itself the scan found `substrate`, `substrate-ui` and the two folders under `substrate-ui-old-versions/`, in 858 ms; a loose file at the top reads `none`.

Found and fixed by the gate's screenshot: a long file name took the row's ellipsis and clipped its own dot. The name now takes the ellipsis; the dot and the find badge sit outside it.

`EDITOR_DRAWN.modified_dots` still counts files. The card proposed a field for folders; it is not added, as the folder dots follow from the files and the gate counts them on screen.

- Gate `editor_dots_repositories` (new; in `gates:electron`), source and bundle 1794707995: two file dots, folder dots `projects/alpha` down to `…/d/e`, six accent bands; `projects/`, `projects/beta`, `notes/`, `loose.txt` undotted; the edited file reads `+1 −0 vs head`; `DIFF_READ` repositories:2 files 2, one-file head; no `.git` made. Mutants: no repositories found (no dots at all); folders above the repository dotted (`projects` dotted). Both fail.
- `editor_dots`, `editor_base_colours`, `editor_follow` select file dots as `[data-tree-dot="1"]`; `editor_dots` now counts folder dots too.
- `tests/test_diff_repositories_502.py` (new) and the diff tests: 72 passed; the four pins of the exact response gained `repos`. 231 unit specs 0. On the bundle: editor_dots, editor_base_colours, editor_tree, editor_tree_find, editor_centre, editor_status, editor_follow, editor_inspector, editor_two_panes, editor_focus_switches 0.
- Installed into Substrate: 1794707995 replaced 1794706163; `APP_BOOTED` vocabulary 0.71, home_kind default. Substrate Next ran throughout (pid 89496).

Rubber Duck Pass: one observation, recorded: the gate's pane, attached through the API, reads "unbound — pick a workspace" in the footer; the gate path, not a person's.
