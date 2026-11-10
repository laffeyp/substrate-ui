# Sprint 395 — Editor edge states

```yaml
---
id: 395
status: reverted
phase: code editor, phase 1
pass_kind: functional
---
```

## scope

The editor handles four edge states from the roadmap's table:

1. **No session** — already handled (sprint 389 gate confirms ⌘⇧E is a no-op on an unbound pane).
2. **Ended session** — the editor opens with a read-only indicator bar at the top of the centre column: "Read-only · session ended".
3. **View-only pane** — the editor opens with a read-only indicator: "Read-only · view only".
4. **No git** — the editor opens normally; the diff returns empty (sprint 393 already handles this); the tree shows files without modified dots. An "info" line at the bottom of the left column states "no git repository" when the diff returned empty and the workspace has no `.git`.

EditorShell gains a `readOnly` prop (boolean) and a `readOnlyReason` prop (string or null). App.tsx reads the snapshot's `endedReason` and `viewOnly` to set them.

The no-git state is detected by the absence of diff results and a check for `.git` in the workspace (the `listDir` call on the workspace root reveals whether `.git` exists as an entry).

## prerequisites

- Sprint 392 (the file tree exists)
- Sprint 394 (modified dots exist)

## context_files

- `web/app/App.tsx` (reads snapshot, passes props to EditorShell)
- `web/app/editor/EditorShell.tsx` (renders the read-only bar)
- `web/vm/types.ts` (Snapshot has `endedReason`, `viewOnly`)

## signal contract

### Emits

None new. EDITOR_OPENED already fires on open; EDITOR_DRAWN already captures the structural state.

### Invariants

- The read-only indicator does not block the editor from opening.
- EDITOR_OPENED fires even when the editor is read-only.

## artifact contract

### Files modified

- `web/app/editor/EditorShell.tsx` — gains `readOnly` and `readOnlyReason` props. When read-only, renders a bar in the centre column. When the diff is empty and the workspace root has no `.git` entry, shows "no git repository" in the left column.
- `web/app/App.tsx` — sets `readOnly` and `readOnlyReason` from the snapshot's `endedReason` and `viewOnly`.

### Content assertions

- `web/app/editor/EditorShell.tsx` contains `readOnly`.
- `web/app/App.tsx` contains `readOnlyReason`.
- `npx tsc --noEmit` returns 0.
- `npm run build` returns 0.

### Command exit codes

- `npx tsc --noEmit` returns 0
- `npm run build` returns 0

## observation contract

### UI driving steps

1. Launch, bind a session, send a message, wait for park.
2. Open the editor — no read-only bar (session is live).
3. Close the editor. End the session (or check an ended session's pane).
4. Open the editor on the ended session — read-only bar appears.

### Expected runtime signals

- EDITOR_OPENED, EDITOR_DRAWN fire on each open.

## done criteria

The editor shows a read-only indicator on ended and view-only sessions, and a "no git repository" line when the workspace has no git.

## self-review checklist

- [x] Scope is concrete and bounded: 2 files modified.
- [x] `context_files` covers App.tsx, EditorShell, types.
- [x] Signal contract is present (no new emits).
- [x] Artifact contract is gradable.
- [x] Observation contract is present.
- [x] Sprint sweet spot: 2 files modified.

## result

### Artifact contract

- `web/app/editor/EditorShell.tsx` contains `readOnly`: PASS.
- `web/app/App.tsx` contains `readOnlyReason`: PASS.
- `npx tsc --noEmit`: 0.
- `npm run build`: 0.

Design deviation: `hasGit` moved from a prop (set by App.tsx) to internal state in EditorShell via `useHasGit` hook. App.tsx lacks the directory listing needed to detect `.git`; EditorShell already owns the `listDir` bridge. The sprint card's artifact contract (App.tsx contains `readOnlyReason`) still holds; `hasGit` was never asserted in App.tsx.

### Observation contract

Gate test `harness/shakeout/edge_states.ts` — 2 checks, both pass:
1. Live session: editor opens, no `[data-editor-readonly]` element.
2. Ended session (after `endSession("user_end")` + `attachExisting`): editor opens, `[data-editor-readonly]` visible with text "Read-only · session ended".

Regression: sprint 389 gate (`editor_toggle_signals.ts`) passes.

### Rubber Duck Pass

**Step 1 — Sequence narration.** No new signals emitted. EDITOR_OPENED and EDITOR_DRAWN fire on each open regardless of read-only state. The read-only bar is a visual indicator derived from the snapshot's `endedReason` and `viewOnly` fields; the no-git indicator from the workspace's directory listing.

**Step 2 — Observations.**
- Missing pair: N/A — no new signals.
- Order violation: N/A.
- Vocabulary gap: N/A. The read-only state is a rendering condition, not a user action the vocabulary needs to track. EDITOR_OPENED already fires; the bar is passive display.
- Payload anomaly: N/A.
- Timing surprise: N/A.
- Tone trace: "Read-only · session ended" and "no git repository" are factual, lowercase, no emoji.

**Step 3 — Disposition.** Clean pass.
