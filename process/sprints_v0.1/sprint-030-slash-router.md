# Sprint 030 — slash router

---
id: 030
epic: I — Header & driver
status: closed
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § prompt SLASH_ROUTER_OPENED / _WALKED / _CLOSED + SLASH_COMMAND_ROUTED
prerequisites: 029 closed
---

## scope

Repurposed after the D42 fix moved the PaneHeader shell into Sprint 002 (see BLACKBOARD Decision 2026-09-10 REVIEW-epic-plan). Wires the slash router: typing `/` at the start of the prompt line opens an in-place router listing slash commands; ↑↓ walks; Enter routes to the command's handler. Command bodies come from Epic K + Epic M (end / rename / export / bundle / tools already covered; this sprint mounts the router surface, walks + routes).

## signal contract

### Emits

- `SLASH_ROUTER_OPENED` (`{pane_id, session_id}`) — fires when `/` starts a fresh prompt
- `SLASH_ROUTER_WALKED` (`{pane_id, index, command_name}`)
- `SLASH_COMMAND_ROUTED` (`{pane_id, session_id, command_name}`) — fires the moment Enter binds; the underlying command tag (e.g. SESSION_END_REQUESTED) fires same-step or one step later
- `SLASH_ROUTER_CLOSED` (`{pane_id, committed: boolean}`)

### Consumes

Prompt keyboard input (Sprint 011).

## artifact contract

### Files

- `src/render/SlashRouter.tsx`
- `src/state/SlashCommands.ts` — command registry keyed by name
- `tests/harness/e2e_slash_router.js`

### Content assertions

- Ratified commands from Epics K + M appear in the registry (end, rename, export, bundle, tools, exit, help)
- Layer 5 pairing: SLASH_ROUTER_OPENED → SLASH_ROUTER_CLOSED per instance

### Command exit codes

- `node tests/harness/e2e_slash_router.js` returns 0

## observation contract

### Driving steps

1. Focus prompt; type `/`; assert SLASH_ROUTER_OPENED
2. ↑↓ three times; assert three SLASH_ROUTER_WALKED with distinct command_names
3. Enter on `end`; assert SLASH_COMMAND_ROUTED{command_name:"end"} → SLASH_ROUTER_CLOSED{committed:true} → END_CONFIRM_OPENED (Sprint 036)

### Three-channel agreement

- Structural: router DOM subtree present when open; disappears on close
- Perceptual: no dedicated anchor (walk aid; the routed action's anchor covers the next state)
- Log ↔ signal: exactly one OPENED per `/` keypress; router closes cleanly on commit or Esc

## done criteria

Slash router walks + routes; every ratified slash reaches its command. Sprint 031 (DriverChip + change round-trip) dispatches next.
