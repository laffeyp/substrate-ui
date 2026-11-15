# Sprint 499 — Each pane's editor keeps its own tabs

```yaml
---
id: 499
status: closed
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

## close

`web/app/state/editor.ts`: one store per pane, `editorFor(paneId)`; `editor` is the shown pane's store (set by `EditorView` through `showEditorFor`), also published as `globalThis.__substrateEditor` for the nine gates that read it; `dropEditor` on `PANE_CLOSED`. Every editor function holding `paneId` binds a local `editor = editorFor(paneId)`; App's pane-named reads use `editorFor(s.focused | prev.focused)`. Gate `harness/shakeout/editor_two_panes.ts` (new).

- From source and on the bundle (1794703199): pane 1 opens models.py and tools.py; pane 2's editor opens with no tabs, then bytes.ts; pane 1 again shows its two; `EDITOR_DRAWN` tab counts per pane match. Screenshot read: pane 2 shows only bytes.ts.
- Mutant (one store for every pane): the gate fails, at pane 2's tree, which never draws `bytes.ts`.
- tsc, build, 231 unit specs 0. On the bundle: editor_two_panes, editor_quick_open, editor_left_tabs, editor_search, editor_tree_find, editor_chips, editor_editing, editor_save, editor_save_on_send, editor_tree, editor_centre, lifecycle_gates all 0.
- Installed into Substrate: 1794703199 replaced 1794463909 (logs `runs/packaged/sprint-499-*`).

Incident at install: step 20's `open`, run from this Substrate Next session's shell, passed `SUBSTRATE_HOME=~/.substrate-next` to Substrate, which booted on Substrate Next's store; its boot scan wrote two live Substrate Next sessions (`s_52bd6e73…`, this one, and `s_6f6974a8…`) as interrupted. Stopped by SIGKILL on its own backend and main (no shutdown sweep ran); both manifests restored to `running` from Substrate Next's in-memory status; Substrate relaunched with `env -i`, `APP_BOOTED` app_name Substrate, home_kind default. Runbook r10 steps 20 now launch with launchd's environment. The cause, a session's shell inheriting its server's `SUBSTRATE_HOME`, is open.

Rubber Duck Pass: one order observation, resolved here: `showEditorFor` notifies after the render that called it (microtask), so no store notifies mid-render.
