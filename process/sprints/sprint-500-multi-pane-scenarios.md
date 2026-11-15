# Sprint 500 — The editor's multi-pane scenarios, tested end to end

```yaml
---
id: 500
status: pending
phase: editor features (roadmap 2026-11-14 r3, E2)
pass_kind: observation
---
```

## scope

Sprint 499 found two panes' editors sharing one store, a bug no gate had caught: of the 43 editor gates only `editor_two_panes` (499) opens editors in two panes, and none of the 43 runs in `npm run gates:electron`, so an editor gate runs only when a sprint names it. This card writes the scenarios down as a matrix and gives each a gate on real fixtures, then adds the editor gates to the chained suite. Scenarios: two panes on one session and on two sessions, each with its own tabs, shown file, unsaved buffer, find and workspace search; switching focus between them; closing a pane with unsaved edits; save-before-send from each pane saving only its own session's buffers; the session's live edits marked in the pane that shows the file and nowhere else; a pane rebound to another session; and the symptom the Architect saw on 2026-11-14 in Substrate Next (build 1794525294, app `f16210f`, before sprint 499): with two sessions' editors open, each shows "less and less" until both are empty. Fixtures are large and real: many files, long files, every language in `harness/fixtures/code/`, deep folders; never a few lines or one function. One verifiable property: every scenario in the matrix has a gate that passes on the bundle, and each scenario's mutant fails its gate.

## signal contract

No new tag. Each gate reads, per pane, `EDITOR_DRAWN`, `EDITOR_FILE_SHOWN`, `EDITOR_FILE_SAVED` and the pixel anchor, and fails when a record names the wrong pane or another pane's counts.

## artifact contract

- `process/planning/2026-11-14-editor-features/SCENARIOS-2026-11-14-multi-pane.md`: the matrix, each row the scenario, its gate, and its mutant.
- Gates under `harness/shakeout/`, at most two scenarios each.
- `package.json` `gates:electron` runs the editor gates.

## observation contract

Each gate prints, per pane and step, what the DOM, the pixels and the trace each say, side by side, and a screenshot per step that is read. On the bundle; every mutant fails its gate.

## done criteria

The editor's multi-pane behaviour is tested by gates that run with every chained suite run, and their output says which pane showed what.
