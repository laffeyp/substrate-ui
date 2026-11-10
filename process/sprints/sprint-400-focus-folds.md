# Sprint 400 — Focus folds all columns but the prompt

```yaml
---
id: 400
status: reverted
phase: code editor, phase 1
pass_kind: functional
---
```

## scope

When the input bar receives focus inside the editor view, all columns fold except the one containing the transcript (which holds the input bar). The fold is temporary: when focus leaves the input bar, the columns restore to their pre-focus state.

EditorShell tracks a `focused` boolean internally via a `focusin`/`focusout` listener on the input bar's container (the `bottom` prop's parent). When focused, each column that was not already folded is temporarily folded. When focus leaves, those columns unfold.

The implementation avoids calling `onToggleColumn` (which persists fold state and emits signals). Instead, EditorShell overrides the fold rendering locally: when focused, all non-transcript columns render as rails regardless of the prop values.

## prerequisites

- Sprint 390 (fold/unfold works)

## context_files

- `web/app/editor/EditorShell.tsx` (layout)

## signal contract

### Emits

None new. The temporary fold is visual-only and does not emit EDITOR_COLUMN_FOLDED.

### Invariants

- The permanent fold state (leftFolded, rightFolded) is not changed by focus.
- Focus-folding does not fire signals.

## artifact contract

### Files modified

- `web/app/editor/EditorShell.tsx` — tracks input bar focus; when focused, renders non-transcript columns as folded.

### Content assertions

- `web/app/editor/EditorShell.tsx` contains `focusin`.
- `npx tsc --noEmit` returns 0.
- `npm run build` returns 0.

### Command exit codes

- `npx tsc --noEmit` returns 0
- `npm run build` returns 0

## observation contract

### UI driving steps

1. Launch, bind, open editor.
2. All three columns visible.
3. Click into the input bar — side columns fold to rails.
4. Click outside the input bar — side columns unfold.

## done criteria

Focus in the input bar temporarily folds all columns except the transcript.

## self-review checklist

- [x] Scope is concrete and bounded: 1 file modified.
- [x] `context_files` covers EditorShell.
- [x] Signal contract is present (no new emits).
- [x] Artifact contract is gradable.
- [x] Observation contract is present.
- [x] Sprint sweet spot: 1 file modified.

## result

### Artifact contract

- `web/app/editor/EditorShell.tsx` contains `focusin`: PASS.
- `npx tsc --noEmit`: 0.
- `npm run build`: 0.

### Observation contract

Gate test `harness/shakeout/focus_folds.ts` — 3 checks, all pass:
1. Both side columns visible before focus.
2. Clicking into input area folds side columns to rails.
3. Clicking outside the input area unfolds side columns back.

### Rubber Duck Pass

**Step 1 — Sequence narration.** No new signals. The focus fold is a transient visual override that does not emit EDITOR_COLUMN_FOLDED. The permanent fold props (`leftFolded`, `rightFolded`) remain unchanged throughout.

**Step 2 — Observations.**
- Missing pair: N/A — no signals emitted.
- Order violation: N/A.
- Vocabulary gap: N/A. Focus-folding is an ephemeral UI state, not a domain event worth capturing in the vocabulary.
- Payload anomaly: N/A.
- Timing surprise: N/A.
- Tone trace: N/A.

**Step 3 — Disposition.** Clean pass.
