# Sprint 035 — tools restrict

---
id: 035
epic: J — Bundles & tools
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § bridge TOOLS_RESTRICT_*; tools popover; sorted invariant
prerequisites: 034 closed
---

## scope

Tools popover shows the current tool allowlist (or "unrestricted" when None). Comma-separated text input; Apply PATCHes the session with a sorted list. Empty → clears to unrestricted (None).

## signal contract

### Emits

- `TOOLS_RESTRICTED` (`{pane_id, session_id, tools, prior_tools}`) — single ratified tag; fires after the bridge PATCH lands (bridge round-trip is silent in the trace; failure surfaces as an inline error banner in the popover without a tag emit)

Layer 1 v0.1 did not ratify a TOOLS_RESTRICT_REQUESTED/_FAILED chain — tools restrict is a synchronous PATCH from the daemon's perspective (session_registry.py set_bundle-style write), so the shell fires TOOLS_RESTRICTED only after the manifest re-read confirms the write.

### Consumes

Tools popover Apply.

## artifact contract

### Files

- `bridge/main.py` — op `tools_restrict`; sorts input; None clears
- `src/render/ToolsPopover.tsx`
- `tests/harness/e2e_tools_restrict.js`

### Content assertions

- Sort invariant: input `write_file, bash, grep` → PATCH `["bash","grep","write_file"]`

### Command exit codes

- `node tests/harness/e2e_tools_restrict.js` returns 0

## observation contract

### Driving steps

1. Restrict to `bash, grep`; assert TOOLS_RESTRICTED{tools:["bash","grep"]}
2. Add `write_file` out-of-order; assert sorted result
3. Clear to empty; assert tools=null

### Three-channel agreement

- Structural: chip label reads count "2 tools" or "all"
- Perceptual: header_popover anchor byte 128 (tools)
- Log ↔ signal: bridge.log `[bridge] tools_restrict session_id=<id> count=<n>`

## done criteria

Tools sort + clear work. Epic J closes. Sprint 036 (EndConfirm) dispatches next.
