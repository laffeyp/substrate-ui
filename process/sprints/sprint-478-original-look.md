# Sprint 478 — the original look, kept as a setting

```yaml
---
id: 478
status: closed
phase: code editor (roadmap r16), E17
pass_kind: functional
---
```

## scope

The Architect, 2026-11-11: the look as it was before these changes "should be snapshot it and that should be like Something we can always go back to so we can judge these things against each other … That's probably on the … menu somewhere." This sprint adds:

- **The setting.** `look` in `state/settings.ts`, `new` (the default) or `original`, saved per viewer like the theme and the key binding.
- **Where it is picked.** Chips in the Settings dialog (the app menu's Settings…, ⌘,).
- **The table.** `derive/look.ts` holds every appearance value E16 onward changes, for both looks. Its first values are the transcript's line heights: original 2 (the pane), 1.95 (meta), 1.7 (the editor's terminal); new 1.54 in all three, sprint 477's spacing.
- **The readers.** The three transcript containers read the table in place of `TRANSCRIPT_LINE_HEIGHT`.

One verifiable property: with `original` picked, the transcript's lines sit where they did before sprint 477 (26, 25.35 and 22.1 px at 13 px type); with `new`, 20 px.

## prerequisites

- 477.

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/templates/SPRINT_CARD.md`
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r16.md` E17
- `BLACKBOARD.md`: the user entry of 2026-11-11 on keeping the original look
- `web/app/state/settings.ts` (the theme and binding settings), `web/app/Dialogs.tsx` (`SettingsDialog`)
- `web/reveal/transcript/Row.tsx` (`TRANSCRIPT_LINE_HEIGHT`), `web/app/PanesView.tsx`, `web/app/App.tsx`, `web/app/editor/EditorView.tsx`
- `harness/shakeout/transcript_spacing.ts`; `harness/shakeout/dialogs.ts` (⌘, opens Settings)
- `git show e804ee3^` for the values before sprint 477

## signal contract

### Emits

No new tag. The theme and the key binding carry no settings tag either; the look is proven by what it draws.

### Consumes

- `settings` (the store).

### Invariants

- `new` is the default; a viewer who never opens Settings sees sprint 477's spacing.
- `original` draws exactly the values before sprint 477.

## artifact contract

### Files created

- `web/app/derive/look.ts`

### Files modified

- `web/app/state/settings.ts`: `Look`, `look` in the state, `readSaved`, `save`, `pickLook`
- `web/app/Dialogs.tsx`: a `look` row of chips, `data-setting-look`
- `web/reveal/transcript/Row.tsx`: `TRANSCRIPT_LINE_HEIGHT` removed (its value moves to the table)
- `web/app/PanesView.tsx`, `web/app/App.tsx`, `web/app/editor/EditorView.tsx`: the line height from `LOOK[look]`
- `harness/shakeout/transcript_spacing.ts`: both looks measured

### Content assertions

- `derive/look.ts` exports `LOOK` with `original` and `new`, and `original` holds 2, 1.95 and 1.7.
- No transcript container has a literal line height.

### Command exit codes

- `npm run build` returns 0
- `npm run test:unit` returns 0

## observation contract

### UI driving steps

Gate `transcript_spacing.ts`, from source and on the bundle:

1. Measure the pane, meta and the editor's terminal as sprint 477 does: 20 px.
2. Open Settings (⌘,) and click `[data-setting-look="original"]`.
3. Measure again: 26 px (pane), 25.35 px (meta), 22.1 px (terminal), each ± 1.
4. Pick `new`: 20 px again.

### Expected screenshot / visual state

- The Settings dialog with a `look` row: `new · original`.
- The pane at 26 px under `original`.

## done criteria

A person can switch between the look before these changes and the new one in Settings, and see each as it was drawn.

## notes

The files touched go past the two-file limit for one concept: one setting, one table, and the three containers that must all read it. A container left reading its own value would draw a mix of the two looks. Each later appearance card (479 onward) adds its values to `derive/look.ts`, the original beside the new.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (each look's spacing on screen).
- [x] context_files cover the settings store, the dialog, the containers and the old values.
- [x] No tag needed; settings carry none.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Past the two-file limit, for the reason in the notes.

## close

`derive/look.ts` holds `LOOK.original` (the transcript at 2, 1.95 and 1.7, as before sprint 477) and `LOOK.new` (1.54 in all three). `settings.look` is `new` by default and is saved per viewer. The Settings dialog has a `look` row, `new · original`. The pane, meta and the editor's terminal read their line height from `LOOK[look]`, and `TRANSCRIPT_LINE_HEIGHT` is gone from `Row.tsx`.

Gate `transcript_spacing.ts`, from source and on the bundle (build 1794453506, packaged true):

| Pass | Pane | Meta | Editor's terminal |
|---|---|---|---|
| `new` | 20, 20 | 20, 20, 20.5 | 20, 20 |
| `original`, picked in Settings | 26, 26 | 25.5, 25.5, 25.5 | 22.5, 22 |
| `new` again | 20, 20 | 20, 20, 20.5 | 20, 20 |

All values are pitch in px.

Mutant: the pane reading `LOOK.new` whatever the setting fails the gate (original pane 20 px against 26 wanted).

Command exit codes: `npm run build` 0; `npm run test:unit` 231/231. Also on the bundle: `dialogs`, `editor_view`, `input_bar`, `transcript_follow` 0.

Rubber Duck Pass. No tag changed: settings carry none, and the look is proven by the pixels it draws. No observations.

Installed: CFBundleVersion 1794453506.
