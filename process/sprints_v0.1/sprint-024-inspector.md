# Sprint 024 — inspector

---
id: 024
epic: G — Surfaces
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § surface INSPECTOR_OPENED/CLOSED; D22 (same-click-closes)
prerequisites: 023 closed
---

## scope

Click any envelope row (transcript, stream, or graph node) to open the inspector as a pane-scoped surface. Renders envelope's full JSON. Same-click on the source row closes it (D22).

## signal contract

### Emits

- `INSPECTOR_OPENED` (`{pane_id, session_id, envelope_seq, envelope_kind}`)
- `INSPECTOR_CLOSED` (`{pane_id}`)
- `STREAM_ROW_CLICKED` (`{pane_id, session_id, envelope_seq, envelope_kind}`) — fires same-step as INSPECTOR_OPENED when the click source is a stream row (per Layer 1); other click sources (graph node, scene cell) don't emit STREAM_ROW_CLICKED but do emit INSPECTOR_OPENED

### Consumes

Pane click events on envelope-carrying rows.

## artifact contract

### Files

- `src/render/Inspector.tsx` — surface renderer; pretty-print JSON
- `src/reducer/ShellReducer.ts` — INSPECTOR_TOGGLE; Layer 5 mutex (at most one surface open per pane)
- `tests/harness/e2e_inspector.js`

### Content assertions

- Layer 4 pairing: INSPECTOR_OPENED → INSPECTOR_CLOSED (Sprint 013 review S8 fix)

### Command exit codes

- `node tests/harness/e2e_inspector.js` returns 0

## observation contract

### Driving steps

1. Bind + turn + reveal
2. Click an envelope row; assert INSPECTOR_OPENED
3. Same-click; assert INSPECTOR_CLOSED (D22)

### Three-channel agreement

- Structural: `[data-testid="inspector"]` present when open; absent when closed
- Perceptual: `anchor-pane-<id>-inspect` byte 0 (closed) / 128 (open)
- Log ↔ signal: OPEN count === CLOSE count

## done criteria

Inspector open/close semantics correct. Sprint 025 (Records surface) dispatches next.
