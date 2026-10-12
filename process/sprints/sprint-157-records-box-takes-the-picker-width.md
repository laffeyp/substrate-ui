# Sprint 157 — The records page's box is the picker box's width

```yaml
---
id: 157
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
asked: 2026-10-12 (Architect: "let's make it have the same visual width as the workspace picker in the pane view as on the records page … a little bit wider")
context_files:
  - web/reveal.html
---
```

## scope

Card 153 put the records page's workspaces in a 760px centred column. The picker box in an unbound pane spans the pane less 22px a side. After: the records column drops its 760px cap and pads 22px a side, so with one pane its box is the picker box's width, at the same left and right edges.

## signal contract

No controller tags change.

## observation contract

Electron gate `records_box_width.ts` at 1512 × 945: the picker box's left and width in the panes view; the records box's left and width; each within 1px.

## checks

- The gate red on the current code, green after; `records_workspace_box` updated for the new column (centred still holds).

## result

- **Built** (`reveal.html`): the records surface pads 22px a side and the column has no cap.
- **Gate** `records_box_width.ts` (in `gates:electron`): red on the old code (records 760px at 376px; picker 1468px at 22px), green after (both 1468px at 22px). `records_workspace_box` passes (gaps 22 / 22).
- **Rubber Duck Pass.** No controller tag moved; the gate reads two bounding boxes.
