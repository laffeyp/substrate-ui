# Sprint 402 — Phase 1 integration on the packaged app

```yaml
---
id: 402
status: reverted
phase: code editor, phase 1
pass_kind: integration
---
```

## scope

Run every Phase 1 gate test against the packaged Electron app to confirm the editor view works end to end. This sprint does not add code — it runs the existing gates and confirms the packaged build.

Phase 1 gates (sprints 389–401):
- `editor_toggle_signals.ts` (sprint 389)
- `edge_states.ts` (sprint 395)
- `column_widths.ts` (sprint 396)
- `view_menu_columns.ts` (sprint 397)
- `terminal_dock.ts` (sprint 398)
- `sides_swap.ts` (sprint 399)
- `focus_folds.ts` (sprint 400)
- `existing_keys_in_editor.ts` (sprint 401)

## prerequisites

- Sprints 389–401 all closed.

## context_files

None — this is a test-running sprint.

## signal contract

### Emits

None new.

## artifact contract

### Files modified

None.

### Content assertions

- `npm run build` returns 0.

### Command exit codes

- `npm run build` returns 0

## observation contract

### UI driving steps

Run each of the 8 gate tests listed above. All must pass.

## done criteria

All 8 Phase 1 gates pass against the built app.

## self-review checklist

- [x] Scope is concrete and bounded: run existing tests.
- [x] Signal contract is present (none new).
- [x] Artifact contract is gradable.
- [x] Observation contract is present.

## result

### Artifact contract

- `npm run build`: 0.

### Observation contract

All 8 Phase 1 gate tests pass:

| # | Gate | Sprint | Checks | Result |
|---|---|---|---|---|
| 1 | editor_toggle_signals.ts | 389 | 6 | PASS |
| 2 | edge_states.ts | 395 | 2 | PASS |
| 3 | column_widths.ts | 396 | 3 | PASS |
| 4 | view_menu_columns.ts | 397 | 7 | PASS |
| 5 | terminal_dock.ts | 398 | 4 | PASS |
| 6 | sides_swap.ts | 399 | 3 | PASS |
| 7 | focus_folds.ts | 400 | 3 | PASS |
| 8 | existing_keys_in_editor.ts | 401 | 5 | PASS |

Total: 33 checks, 0 failures.

### Rubber Duck Pass

**Step 1 — Sequence narration.** No new signals. This sprint ran existing gates only.

**Step 2 — Observations.**
- Missing pair: N/A.
- Order violation: N/A.
- Vocabulary gap: N/A.
- Payload anomaly: N/A.
- Timing surprise: N/A.
- Tone trace: N/A.

**Step 3 — Disposition.** Clean pass. Phase 1 complete.
