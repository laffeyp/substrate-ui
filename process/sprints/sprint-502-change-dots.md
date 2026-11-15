# Sprint 502 — Changed files marked, and every folder on the way to them

```yaml
---
id: 502
status: pending
phase: editor features (roadmap 2026-11-14 r4, E4)
pass_kind: functional
---
```

## scope

The Architect, 2026-11-14: "I'm also not seeing in the editor any blue dots … There should be the blue dot by the folder and then all the folders and all the way down to the file." Two causes. (1) A workspace that is not a git repository gets no marks: `_diff_base` (`server.py` line 2038) returns `none` and the diff route sends no files, though repositories may sit inside it (Agent Orchestration holds `substrate/` and `substrate-ui/`). The diff then reads each repository found under the workspace, each against its own HEAD, paths given relative to the workspace. (2) Folders carry no dot (sprint 413, `FileTree.tsx`): every folder that holds a changed file, at any depth, carries the dot too. A workspace that is itself a repository is read as today. One verifiable property: in a plain folder holding two repositories, an uncommitted edit three folders deep in one of them dots the file and each folder above it, and nothing in the other repository.

## signal contract

Vocabulary proposal at build time: `DIFF_READ.base` gains a value for a plain folder read through the repositories inside it, and a count of them; `EDITOR_DRAWN.modified_dots` counts files, a new field counts folders.

## observation contract

Gate on the bundle on a large real fixture: a plain folder holding two repositories, each many files deep; edits and new files at several depths; the tree opened down to each; DOM, pixel anchor and trace agree; screenshot read. Mutants: the plain folder read as `none`; folders undotted.

## done criteria

What changed shows from the top folder down to the file, in a repository or in a folder of repositories.
