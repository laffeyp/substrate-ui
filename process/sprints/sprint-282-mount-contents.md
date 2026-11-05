---
id: 282
status: closed
phase: shell-to-react C5 prerequisite
pass_kind: functional
---

# Sprint 282 — a mount kind can ask for a root that takes no box

## scope

The picker places itself at its pane's bottom with a `flex:1` spacer in the pane's flex column; inside the registry's root element, a block, the spacer would have no height. `MountKind.contents` gives the root element `display: contents`, so the component's elements lay out as the host's children; the picker's host is `display: contents` too.

## artifact contract

- Modified: `web/app/mount.ts` (contains `contents?: boolean`, `inner.style.display = "contents"`). `npm run build` 0.

## result

Closed 2026-11-05; checked by the picker's pixel captures (sprint 286).

## Rubber Duck pass

No signals.
