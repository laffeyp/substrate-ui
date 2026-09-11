# Sprint 030 — pane header identical across panes [SUPERSEDED 2026-09-10]

> **SUPERSEDED 2026-09-10 by REVIEW-2026-09-10-epic-plan-and-sprint-cards §D1 (header ordering) + §F1 (vocabulary drift).** The header work moved into Sprint 002 (which now mounts the full PaneHeader shell from the first frame per D42). This card also emitted `PANE_HEADER_MOUNTED`, a tag Layer 1 v0.1 never ratified — the header category holds five tags, none of them a mount observer. The active Sprint 030 is now `sprint-030-slash-router.md`, which claims the four unclaimed ratified slash tags (SLASH_ROUTER_OPENED / _WALKED / _CLOSED + SLASH_COMMAND_ROUTED). This file stays on disk as audit trail per hard rule 12 and per the "no in-place edits — new versions of the same doc" discipline. Do not dispatch this card.

---
id: 030
epic: I — Header & driver
status: SUPERSEDED
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § header PANE_HEADER_MOUNTED; D42 (identical full pane header per pane)
prerequisites: 029 closed
---

## scope

Every bound pane's header shows the identical row: DriverChip · WorkspaceChip · SessionName · reveal-toggle · surface-icons · close-x. Layout matches v7 verbatim per D42. This sprint mounts the header shell; DriverChip + WorkspaceChip content ships in Sprint 031 + 032.

## signal contract

### Emits

- `PANE_HEADER_MOUNTED` (`{pane_id, session_id}`)

### Consumes

None.

## artifact contract

### Files

- `src/render/PaneHeader.tsx` — full v7-shape header
- `tests/harness/e2e_pane_header.js`

### Content assertions

- Every bound pane renders exactly one PaneHeader; unbound panes do not

### Command exit codes

- `node tests/harness/e2e_pane_header.js` returns 0

## observation contract

### Driving steps

1. Open two bound panes
2. Assert two `[data-testid="pane-header"]` mounts
3. Assert both share the same layout (six known slots)

### Three-channel agreement

- Structural: two headers, six slots each
- Perceptual: no dedicated anchor (mount is one-off; downstream driver/workspace chips have their own)
- Log ↔ signal: MOUNTED count === bound-pane count

## done criteria

Header shell mounts on every bound pane. Sprint 031 (DriverChip + dropdown) dispatches next.
