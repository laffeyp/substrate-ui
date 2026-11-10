# Sprint 433 — ACTIVITY's arrow shows the call's payload

```yaml
---
id: 433
status: closed
phase: code editor (roadmap r10), the inspector's ACTIVITY (E3)
pass_kind: functional
---
```

*Card written after the work, which was committed in f8a19e4 without one.*

## scope

The Architect, 2026-11-10: the arrow on an ACTIVITY row in the inspector showed the meta pane, which has no way back. Now the arrow opens the call's payload under its row (the record's envelope payload as JSON), and a "meta ›" link under it opens that seq in the meta pane. The showing stays the inspector until the link is clicked.

Files: `editor/Inspector.tsx`; `harness/shakeout/editor_meta_pane.ts`.

## signal contract

No vocabulary change; the link writes what sprint 430's ◂ wrote (SEQ_SELECTED, EDITOR_INSPECTOR_SWAPPED).

## artifact contract

Build 0.

## observation contract

`editor_meta_pane` from source and on the bundle: the payload under the row equals the record's ToolCall payload; showing stays the inspector; "meta ›" opens the meta pane with the seq inspected and in view.
