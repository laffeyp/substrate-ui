# Sprint 445 — the tab's unsaved dot

```yaml
---
id: 445
status: closed
phase: code editor (roadmap r13), the tab row (E3)
pass_kind: functional
---
```

## scope

A tab whose file has unsaved changes draws a dot after its name. On hover the dot gives way to the tab's ×. The dot goes when the file is saved, by hand or with a message. This is the agent-resolved decision of 2026-11-09 on the tab row ("the tab's dot means unsaved changes"; × on hover), which no sprint built. Sprint 444's screenshot showed the gap: tax.ts was unsaved and its tab plain. The dot is 5 px in the accent #82a5c8, as the left column's open tab draws it (`data-open-unsaved`). It sits in the ×'s place, as VS Code and Xcode draw it.

Files: `web/app/editor/Centre.tsx` (`Tab`), gate `harness/shakeout/editor_save_on_send.ts`.

## context_files

- BLACKBOARD 2026-11-09 agent-resolved, the tab row; 2026-11-10 deferred, the tab row's dot.
- Frame 24a (`runs/design/sheet-v11/24a.png`); `web/app/editor/LeftTabs.tsx` (the open tab's dot).
- `web/app/editor/Centre.tsx` `Tab`; the editor store's `unsaved`.

## signal contract

No new tag. EDITOR_DRAWN.unsaved already counts the unsaved files, and the dot is its view-side pair.

## artifact contract

- `Tab` draws `[data-editor-tab-unsaved=<path>]` when the file is unsaved and the pointer is not over the tab.
- `npm run build` 0; `editor_save_on_send` and `editor_editing` from source and on the bundle 0.

## observation contract

`editor_save_on_send`:
- Before the message, all three tabs carry the dot.
- After it, only tax.ts carries the dot (refused).
- Hovering tax.ts's tab shows × and hides the dot.
- A screenshot shows the tab row.

## done criteria

The tab row shows which files are unsaved, and the dot follows the save.
