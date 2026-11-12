# Sprint 485 — the ghost scheme

```yaml
---
id: 485
status: closed
phase: code editor (roadmap r20), E24
pass_kind: functional
---
```

## scope

The Architect, 2026-11-11: a second scheme, "ghost", "all whites and grays". `RESEARCH-2026-11-11-colour-spacing-wrap-r2.md` defines it as the key with the colour taken out: the same notes in tinted greys, told apart by lightness.

The colour palette's type (L* 75.7) and string (74.7) sit too close to be told apart by lightness alone, so ghost spaces the classes 5 L* apart in the notes' order:

- name 92.7 and text 86.9, as now
- property 82
- type 77
- string 72
- number 67
- keyword 62
- meta 57
- punctuation 52
- comments 43.4, italic, as now

Each grey is tinted to the palette's blue (LCh hue 263–272°, chroma 2.4–2.9), as the existing greys are (2.2–2.3).

`settings.scheme` is `colour` (the default) or `ghost`, saved per viewer, picked in Settings › Appearance › code colours. Ghost applies under either look.

One verifiable property: under ghost, every token decodes to a grey, and the classes keep their lightness order.

## prerequisites

- 484.

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/ADDENDUMS.md` A2
- `process/planning/2026-11-09-code-editor/RESEARCH-2026-11-11-colour-spacing-wrap-r2.md` (ghost, takeaway 3)
- `web/app/derive/look.ts` (`Syntax`, `SYNTAX_481`), `web/app/state/settings.ts`, `web/app/Dialogs.tsx`, `web/app/editor/Centre.tsx` (`highlightFor`, `lookTheme`)
- `harness/shakeout/editor_highlight_seen.ts`, `harness/pixel/ciede2000.ts` (`lab`)

## signal contract

### Emits

No new tag; settings carry none.

### Consumes

- `settings.scheme`.

### Invariants

- The colour scheme, under both looks, is unchanged.

## artifact contract

### Files created

- none

### Files modified

- `web/app/derive/look.ts` (`Scheme`, `SCHEMES`, `SYNTAX_GHOST`)
- `web/app/state/settings.ts` (`scheme`, `pickScheme`)
- `web/app/Dialogs.tsx` (the `code colours` row)
- `web/app/editor/Centre.tsx` (`lookTheme(look, scheme)`)
- `harness/shakeout/editor_highlight_seen.ts` (the ghost pass)

### Content assertions

- `SYNTAX_GHOST`'s coloured classes are greys of chroma under 3 (computed with `colour-science`).

### Command exit codes

- `npm run build`, `npm run test:unit` return 0

## observation contract

### UI driving steps

Gate `editor_highlight_seen`, from source and on the bundle. After the colour passes, Settings › code colours › ghost. main.rs and main.c are opened, and each token decodes within 40 of its ghost grey. Every decoded class has chroma under 6, and type, string, number, keyword and meta each sit more than 2 L* above the next.

### Expected screenshot / visual state

- main.rs in greys, its keywords, strings and numbers at different lightness.

## done criteria

A person can switch the code to whites and greys and still tell its parts apart.

## notes

Five files, past the two-file limit: the scheme's table, the setting, its row, the editor that reads it, and the gate.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded.
- [x] context_files cover the research, the palette's home, the settings and the gate.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Past the two-file limit, for the reason in the notes.

## close

The ghost greys and their lightness:

| Class | Grey | L* |
|---|---|---|
| property | #c9ccd0 | 81.9 |
| type | #bbbec3 | 76.9 |
| string | #aeb1b5 | 72.1 |
| number | #a0a3a7 | 66.9 |
| keyword | #93969a | 62.0 |
| meta | #86898d | 57.0 |
| punctuation | #7a7c80 | 52.0 |

Name, text and comments keep #e8eaee, #d7dade and #62676f.

Gate `editor_highlight_seen` under ghost, from source and on the bundle: tokens decode at chroma at most 2.4. Decoded L*: type 75.8, string 69.9, number 66.9, keyword 61.3, meta 57.0. The colour passes are unchanged.

Mutant: the editor ignoring the scheme fails; main.rs stays in colour under ghost.

Unit specs 231/231.

Rubber Duck Pass: no tag changed. No observations.
