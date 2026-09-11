# Sprint 047 — full anchor audit

---
id: 047
epic: P — Harness maturity
status: pending
phase: 4
pass_kind: widening
spec_reference: signals/0.1.json § layer_7_evidence.evidence_constraints[pixel_anchor].anchors (16 testids)
prerequisites: 046 closed
---

## scope

Sweep the codebase for every anchor: prove each of the 16 testids is present in the DOM at the state it names, and every state transition in Layer 7 flips its named anchor's byte. Harness reads every anchor in one screenshot pass.

## signal contract

### Emits

None (this is a harness-only sprint).

### Consumes

The full JSONL trace + a whole-window screenshot.

## artifact contract

### Files

- `tests/harness/e2e_anchor_audit.js` — walks all 16 anchors; decodes; asserts against Layer 7 encoding table
- `tests/harness/anchor-table.js` — the 16 anchors as a lookup table (id, encoding, witness_tags)

### Content assertions

- 16 anchors × N states each = M assertions; count matches Layer 7

### Command exit codes

- `node tests/harness/e2e_anchor_audit.js` returns 0

## observation contract

### Driving steps

1. Drive the app through a scripted 30-step tour that hits every anchor in every state
2. Screenshot after each step
3. Decode all 16 anchors per screenshot; compare against expected byte per state

### Three-channel agreement

- Structural: every anchor's DOM element present
- Perceptual: every anchor's byte matches Layer 7 expected byte per state
- Log ↔ signal: every anchor flip correlates to the witness tag(s) declared in Layer 7

## done criteria

Full 16-anchor sweep passes. Sprint 048 (tonal rules) dispatches next.
