# Sprint 464 — a gate's window takes no keyboard either

```yaml
---
id: 464
status: closed
phase: code editor (roadmap r13), found while closing sprint 463
pass_kind: functional
---
```

## scope

Sprint 449 made a gate's windows unfocusable and mouse-transparent (`SUBSTRATE_GATE_ISOLATE=1`, `electron/main.ts`: `win.setFocusable(false); win.setIgnoreMouseEvents(true)` after the window is made), so the Architect can use the machine while gates run. On 2026-11-11 `editor_save` failed on the bundle because the Architect's dictation, meant for another app, landed in the gate's code and was saved to its file. Electron's docs give the cause: `setFocusable` "On macOS it does not remove the focus from the window" (`electron.d.ts`). The window is made shown and focused, then set unfocusable, and keeps the focus. This sprint makes a gate's window with `focusable: false` and `show: false` and shows it with `showInactive()` ("Shows the window but doesn't focus on it"), and skips the second-instance handler's `win.focus()` in a gate launch. Outside a gate nothing changes.

## prerequisites

- 449 (gate isolation).

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`; `WORKING_AGREEMENT.md` (the gates' row: isolation)
- `electron/main.ts` (`GATE_ISOLATED`, the window's creation, `second-instance`); `node_modules/electron/electron.d.ts` (`setFocusable`, `focusable`, `show`, `showInactive`)
- BLACKBOARD 2026-11-10: the gate isolation entries (sprint 449)

## signal contract

### Emits

No new tag. `APP_BOOTED.gate_isolated` true in a gate launch, as before.

### Consumes

- `SUBSTRATE_GATE_ISOLATE`.

### Invariants

- Outside a gate the window is made, shown and focused as before.
- A gate drives its window through the DevTools protocol, which needs no OS focus.

## artifact contract

### Files created

- none

### Files modified

- `electron/main.ts`

### Content assertions

- In a gate launch the BrowserWindow is made with `focusable: false` and `show: false` and shown with `showInactive()`; `setFocusable(false)` after the fact is gone.
- The second-instance handler does not call `win.focus()` in a gate launch.

### Command exit codes

- `npm run build` returns 0

## observation contract

1. `editor_save` from source and on the bundle passes.
2. A launch with `SUBSTRATE_GATE_ISOLATE=1`: the window, once shown, is not the focused window (`BrowserWindow.getFocusedWindow()` is null, `win.isFocused()` false), read in the main process by a new step in `editor_save`'s neighbour gate, `editor_resize`, which already reads isolation (sprint 449).
3. The gates that read focus or blur pass on the bundle: `editor_resize`, `editor_context_menu`, `editor_selection_chips`, `editor_save`, `editor_encodings`, `editor_bytes`.

## done criteria

A gate's window never holds the keyboard, so nothing typed or dictated on the machine reaches it.

## notes

Found while closing sprint 463; fixed before the roadmap moves on. The failed run's text is the Architect's dictation and is not copied into any record.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (a gate's window is never focused).
- [x] context_files cover main, Electron's docs, the earlier isolation sprint.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] ≤2 files: `electron/main.ts`, and one gate step.

## close

A mutant with the old isolation (`setFocusable(false)` after the window is made) fails `editor_resize`'s new step: the window reports `focused: true`. With the window made `focusable: false, show: false` and shown by `showInactive()`, it is visible and not focused. Gates on the bundle (packaged true): `editor_resize`, `editor_save`, `editor_context_menu`, `editor_selection_chips`, `editor_encodings`, `editor_bytes`, `editor_centre`, `editor_status` 0; `lifecycle_gates` all passed (the second-instance handler).
