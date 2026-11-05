---
id: 256
status: closed
phase: shell-to-react B5 fixture
pass_kind: functional
---

# Sprint 256 — an assay fixture for the gate

## scope

`harness/shakeout/fixtures/assays/coding-fixture.jsonl` and `.meta.json`: a coding assay of eight cells on the first four problems of substrate's coding bank (`strong_ref` passes 3 of 4, `full` 2 of 4, one trial each) and its fingerprinted config (strong-model, weak-model, margin 0.1). Written with substrate's own field names, as `tests/test_assay_cells.py` writes its coding fixture, and read back through `report_from_cells`: provenance `verified`, control check `fail` (no committed records), four arms.

## artifact contract

- Created: the two files (8 and 10 lines).

## result

Closed 2026-11-05.

## Rubber Duck pass

No signals.
