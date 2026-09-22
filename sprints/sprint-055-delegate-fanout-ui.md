# Sprint 055 — delegate fan-out UI + shakeout

```yaml
---
id: 055
status: pending
phase: 5
pass_kind: functional
---
```

## scope

Reveal-shell side of the delegate fan-out subphase. Depends on
substrate sprint 245. Renders D72's aggregation shape and adds
the Axis B shakeout flow. Per
`process/planning/delegation-research-r5.md`.

## files

- `web/reveal.html` — new tool-card variant for delegate fan-out.
- `web/vm/session_controller.ts` — auto-attach to child streams
  when a fan-out delegate ToolCall lands.
- `web/vm/signals/versions/0.1.json` — optional new tag
  `DELEGATE_FANOUT_CHILD_ATTACHED`.
- `harness/shakeout/tool_delegate_many.ts` — new Axis B flow.
- `harness/shakeout/tools_index.ts` — register the new flow.

## D72 card shape

When a `ToolCall(tool="delegate")` payload's args contain
`children`, render:

- One `⑂ delegate → N children · X running · Y parked` line.
- Expandable to N rows: name, driver, record id, event count,
  live status, latest headline.
- `↑↓` walks rows; `↵` descends via
  `controller.attachRecordRoot(children[selected].child_root)`.
- Per-row end affordance calls the child's session-end path.
- Depth-hue accent per D70's rule.

## shakeout flow

`tool_delegate_many` prompts the model to fan out to three
children under real driver. Asserts:

- Parent record carries ONE `ToolCall(tool="delegate")` with
  `children.length === 3`.
- Parent record carries ONE `ToolResult(tool="delegate")` after
  all Park.
- ToolResult payload carries `answers`, `child_roots`, `steps`,
  optionally `failed`.
- Three child records exist on disk.

Three variants (same-task-N-models, different-tasks-N-children,
nested) can share the harness template or split into three flows.

## done criteria

- The reveal shell renders the D72 card when a fan-out delegate
  lands. Cmd-R after a fresh build shows the shape.
- `npm run shakeout` includes `tool_delegate_many`; it passes
  5/5 under the standing rules.
- Every existing shakeout flow still passes.
