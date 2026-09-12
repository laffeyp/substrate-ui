# Sprint 027 — studio surface

---
id: 027
epic: G — Surfaces
status: closed
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § surface kind=studio; substrate reference entities Trigger/View/Route/TerminationPolicy; v7:394-411 studio form
prerequisites: 026 closed
---

## scope

Studio authors a topology — Trigger, View, Route, TerminationPolicy — as a form. Save writes to `~/.substrate/topologies/<name>.py`. Validate calls bridge `topology_validate`. Build calls `topology_build`. Ships eight Studio-scoped tags per Layer 1's decomposition audit.

## signal contract

### Emits

- `SURFACE_OPENED` (`{pane_id, kind: "studio"}`)
- `SURFACE_CLOSED` (`{pane_id, kind: "studio"}`)
- `STUDIO_VIEW_TOGGLED` (`{pane_id, view: "trigger"|"view"|"route"|"termination"}`) — swaps between the four form sections; edits within a section are silent
- `STUDIO_VALIDATE_REQUESTED` / `STUDIO_VALIDATED` / `STUDIO_VALIDATE_FAILED`
- `STUDIO_BUILD_REQUESTED` / `STUDIO_BUILT` / `STUDIO_BUILD_REJECTED`

### Consumes

Bridge ops `topology_validate` + `topology_build`.

## artifact contract

### Files

- `bridge/main.py` — new ops
- `src/render/StudioSurface.tsx` — form
- `tests/harness/e2e_studio_surface.js`

### Content assertions

- Layer 1 review §Studio-decomposition ratification: eight distinct tags per v0.1 — one view toggle plus two three-state chains (validate + build). Edits within a section are silent by design (drift-in-a-form is not observation-worthy; the observation is the validate/build round-trip that ratifies the draft).

### Command exit codes

- `node tests/harness/e2e_studio_surface.js` returns 0

## observation contract

### Driving steps

1. Cmd-S; SURFACE_OPENED{kind:"studio"}
2. Switch between the four sections; assert STUDIO_VIEW_TOGGLED fires per switch (silent within a section)
3. Validate; assert STUDIO_VALIDATE_REQUESTED → STUDIO_VALIDATED (deterministic no-op topology); failure path fires STUDIO_VALIDATE_FAILED with a typed reason
4. Build; assert STUDIO_BUILD_REQUESTED → STUDIO_BUILT; file lands on disk; failure path fires STUDIO_BUILD_REJECTED

### Three-channel agreement

- Structural: `[data-testid="surface-studio"]` present; four form sections mount
- Perceptual: surface anchor byte encodes studio ordinal (studio=192)
- Log ↔ signal: validate/build pairings symmetric

## done criteria

Studio authors a topology end-to-end. Epic G closes. Sprint 028 (find open) dispatches next.
