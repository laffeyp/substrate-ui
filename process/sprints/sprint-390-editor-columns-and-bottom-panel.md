# Sprint 390 — foldable columns, bottom panel, and column-toggle keys

```yaml
---
id: 390
status: reverted
phase: code editor, phase 1
pass_kind: functional
---
```

## scope

EditorShell gains three foldable columns (left, right, bottom) and the bottom panel holding the transcript and input bar. Each side column folds to a labelled rail (a narrow strip with a vertical label and a ◂ button); the bottom panel collapses to a sill that keeps the input bar visible. Three renderer-owned keys toggle them: ⌥⌘L (left), ⌥⌘R (right), ⌘J (bottom). `keymap.ts` gains `editorOpen` on `KeyContext` and three new `KeyAction` kinds. EDITOR_COLUMN_FOLDED fires on each toggle. EDITOR_DRAWN's `left_folded`, `right_folded`, `bottom_folded` bools track the state.

The transcript and input bar are passed to EditorShell from App.tsx as React children (the import check: `web/app/editor/` does not import Transcript or any lens). The bottom panel renders the same transcript and input bar the pane view shows.

## prerequisites

- Sprint 389

## context_files

- `web/app/editor/EditorShell.tsx` (the shell to modify)
- `web/app/App.tsx` (the render branch that mounts EditorShell, the key handler, EDITOR_DRAWN emit)
- `web/app/keymap.ts` (KeyContext, KeyAction, windowKey)
- `web/vm/signals.gen.ts` (EDITOR_COLUMN_FOLDED payload types)
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r4.md`

## signal contract

### Emits

- `EDITOR_COLUMN_FOLDED` (column: "left" | "right" | "bottom", folded: bool)
- `EDITOR_DRAWN` (left_folded, right_folded, bottom_folded updated)

### Invariants

- The import check: `web/app/editor/EditorShell.tsx` does not import `Transcript`, `InputBar`, or any lens module.
- Existing keys (⌘M, ⌘E, ⌘D, ⌘⇧D, ⌘3, ⌘,) keep their behaviour.
- The column keys fire only while the editor is open.

## artifact contract

### Files modified

- `web/app/editor/EditorShell.tsx` — gains `leftFolded`, `rightFolded`, `bottomFolded` state; renders fold/unfold rails; accepts `bottom` children for the transcript/input bar.
- `web/app/keymap.ts` — `KeyContext` gains `editorOpen: boolean`; `KeyAction` gains `toggle-editor-left`, `toggle-editor-right`, `toggle-editor-bottom`; `windowKey` routes ⌥⌘L, ⌥⌘R, ⌘J to these when `editorOpen`.
- `web/app/App.tsx` — passes `editorOpen` into keymap context; handles the three new key actions by calling EditorShell's toggle callbacks; passes transcript + input bar children to EditorShell; updates `noteEditorDrawn` to read folded state from EditorShell.

### Content assertions

- `EditorShell.tsx` contains `leftFolded` and `data-editor-column="left"`.
- `keymap.ts` contains `editorOpen` and `toggle-editor-left`.
- `App.tsx` contains `toggle-editor-left`.
- `npm run build` returns 0.

### Command exit codes

- `npx tsc --noEmit` returns 0
- `npm run build` returns 0

## observation contract

### UI driving steps

1. Launch, bind a session, open the editor (toggle-editor).
2. The bottom panel shows the transcript and input bar.
3. Toggle left column (⌥⌘L): left column folds to a rail.
4. Toggle left column again: left column unfolds.
5. Toggle right column (⌥⌘R): right column folds.
6. Toggle bottom panel (⌘J): bottom collapses to a sill with the input bar visible.

### Expected runtime signals

- EDITOR_COLUMN_FOLDED (column=left, folded=true)
- EDITOR_COLUMN_FOLDED (column=left, folded=false)
- EDITOR_COLUMN_FOLDED (column=right, folded=true)
- EDITOR_COLUMN_FOLDED (column=bottom, folded=true)
- EDITOR_DRAWN with updated folded bools after each toggle.

## done criteria

The three columns fold and unfold via their keys, the bottom panel shows the transcript and input bar with a collapsible sill, and EDITOR_COLUMN_FOLDED fires on each toggle.

## notes

Column widths are not stored in localStorage yet — that comes in a later sprint. The rail shows a vertical label: "FILES" for left (the default tab), "INSPECTOR" for right, "TRANSCRIPT" for bottom. The labels are the design spec's names. The fold rail is narrow (28px) with the label rotated 90°.

The ⌘J key currently has no binding in keymap.ts (it's not in the existing actions). ⌥⌘L and ⌥⌘R are also new. All three are renderer-owned per the roadmap's keyboard table.

EditorShell needs to expose its fold state so App.tsx can read it for EDITOR_DRAWN. Two approaches: (a) EditorShell calls an `onFoldChange` callback prop, or (b) the fold state lives on AppPane. Option (b) is simpler — the fold bools are on AppPane and passed as props to EditorShell, like `editorOpen`. This keeps the state in App.tsx where EDITOR_DRAWN already reads it.

## self-review checklist

- [x] Scope is concrete and bounded: foldable columns, three keys, one signal.
- [x] `context_files` covers EditorShell.tsx, App.tsx, keymap.ts, signals.gen.ts.
- [x] Signal contract references EDITOR_COLUMN_FOLDED from v0.28.
- [x] Artifact contract is gradable.
- [x] Observation contract is present (functional sprint).
- [x] Sprint sweet spot: 3 files modified. The column fold state, the key routing, and the component are one concept — "columns fold."

## result

- **Checks:**
  - `npx tsc --noEmit` returns 0.
  - `npm run build` returns 0 (TypeScript, eslint, Vite all clean).
  - `npm run signals` returns 0 (vocabulary 0.28, 117 emitted, 12 awaiting — EDITOR_COLUMN_FOLDED moved from unemitted to emitted).
  - `npx tsx --test web/app/__tests__/keymap.spec.ts` passes all 4 tests (existing keys unaffected).
  - Sprint 389 gate (`editor_toggle_signals.ts`) still passes all 6 checks (no regression).
- **Gate:** `editor_columns_signals.ts` passes all 8 checks:
  - Editor shell opens with bottom panel showing transcript mount.
  - ⌥⌘L folds the left column: rail visible, column gone, EDITOR_COLUMN_FOLDED(left, true) and EDITOR_DRAWN(left_folded=true) fired.
  - ⌥⌘L again unfolds: column visible, EDITOR_COLUMN_FOLDED(left, false) fired.
  - ⌥⌘R folds the right column: EDITOR_COLUMN_FOLDED(right, true) fired.
  - ⌘J folds the bottom panel: sill visible, transcript mount gone, EDITOR_COLUMN_FOLDED(bottom, true) fired.
  - ⌘J again unfolds: transcript mount restored.
  - E1: no path or text in any editor signal.
- **Implementation note:** The `__vmSignals` buffer is a module-scoped array assigned to `window.__vmSignals` on every emit. Clearing it between gate steps requires `splice(0)` (in-place), not assignment to a new array — assignment gets overwritten on the next emit.
- **Files modified beyond the card's list:** `web/app/__tests__/keymap.spec.ts` (added `editorOpen: false` to the test's KeyContext), `web/vm/signals/unemitted.json` (removed EDITOR_COLUMN_FOLDED).
- **Design choice (option b from notes):** Fold state lives on `AppPane` (`leftFolded`, `rightFolded`, `bottomFolded`), passed as props to EditorShell. The bottom panel's content (transcript, activity line, task rows, input bar) is passed as the `bottom` prop from App.tsx — EditorShell does not import those components.
- **Rubber Duck Pass** on the gate's signal trace, for one session on pane 1:
  - PANE_BOUND binding=session: the pane bound a session.
  - EDITOR_OPENED binding=vim: the editor opened.
  - EDITOR_DRAWN tab_count=0, left_folded=false, right_folded=false, bottom_folded=false: initial state, all columns unfolded.
  - PANE_DRAWN state=editor: the pane shows the editor.
  - KEY_ROUTED key=Meta+Alt+l action=toggle-editor-left target=window: the keymap routed ⌥⌘L.
  - EDITOR_COLUMN_FOLDED column=left, folded=true: the left column folded.
  - EDITOR_DRAWN left_folded=true: EDITOR_DRAWN updated to reflect the fold.
  - KEY_ROUTED key=Meta+Alt+l action=toggle-editor-left: the same key again.
  - EDITOR_COLUMN_FOLDED column=left, folded=false: the left column unfolded.
  - EDITOR_DRAWN left_folded=false: EDITOR_DRAWN restored.
  - KEY_ROUTED key=Meta+Alt+r action=toggle-editor-right: ⌥⌘R routed.
  - EDITOR_COLUMN_FOLDED column=right, folded=true: the right column folded.
  - KEY_ROUTED key=Meta+j action=toggle-editor-bottom: ⌘J routed.
  - EDITOR_COLUMN_FOLDED column=bottom, folded=true: the bottom panel folded.
  - KEY_ROUTED key=Meta+j action=toggle-editor-bottom: ⌘J again.
  - EDITOR_COLUMN_FOLDED column=bottom, folded=false: the bottom panel unfolded.
  No observations. No path or text in the trace. Every KEY_ROUTED matches a COLUMN_FOLDED. EDITOR_DRAWN fires after each fold state change with the correct booleans.
