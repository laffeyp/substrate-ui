# Sprint 499 — Each pane's editor keeps its own tabs

```yaml
---
id: 499
status: pending
phase: editor features (roadmap 2026-11-14 r1, E1)
pass_kind: functional
---
```

## scope

Bug: one editor store per window (`web/app/state/editor.ts`), so two panes' editors share tabs, the active file, unsaved paths, recent files, find and search; a second pane shows the first pane's tab names, which do not open in its workspace. The store becomes one per pane; every reader takes its pane's store. One verifiable property: two panes on two sessions, each with its own files open, show only their own tabs.

## signal contract

No new tag. `EDITOR_DRAWN` per pane reads its own counts.

## artifact contract

- `web/app/state/editor.ts` and its readers in `web/app/editor/`; gate `harness/shakeout/editor_two_panes.ts` (new).

## observation contract

Gate on the bundle: two panes, two deterministic sessions on two real fixture folders; open two files in each; each pane's tab row and `EDITOR_DRAWN` name only its own; screenshot read. Mutant: the shared store back fails.

## done criteria

Editors in different panes never show each other's state.
