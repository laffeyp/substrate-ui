---
id: 274
status: closed
phase: shell-to-react C4.1
pass_kind: functional
---

# Sprint 274 — the pane picker's workspace column and lines as pure functions

## scope

Plan row C4. `web/app/derive/picker.ts`: `workspaceRows` (the typed path, the default per-session sandbox, an inherited folder, the shared sandbox, two recent folders, choose folder; each open row's first five sessions; the lit and armed rows; the flat order the keys walk), `tabFill`, `lineStep` (the guidance, length and tone lines' keys), `paneShape`, `shapeLabel`, `skipInPicker`, and `SHARED_SANDBOX`. F337: the shared sandbox's string, which the server reads as the sandbox under its own state root (`_resolve_workspace_arg`), is one constant where five copies were typed out. The model column waits for plan row C6, which moves the driver labels it is built from.

## artifact contract

- Created: `web/app/derive/picker.ts`, `web/app/__tests__/picker.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. Spec 7/7.

## Rubber Duck pass

No signals.
