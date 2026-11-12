# Sprint 479 — the code's lines at 20 px, and the reply brighter than the message

```yaml
---
id: 479
status: closed
phase: code editor (roadmap r17), E18 and E19
pass_kind: functional
---
```

## scope

Two small changes in one sprint (the Architect, 2026-11-11: "479 and 480 can be done in the same sprint. Those are minor changes"). Card 480 is merged here. Both values go into `derive/look.ts`, the original beside the new, so the `original` look keeps them as they were.

- **E18, the code's line spacing.** The code editor's 13 px type on 23 px lines (1.77) goes to 20 px (1.54), the transcript's spacing (`RESEARCH-2026-11-11-colour-spacing-wrap.md`). It is applied through a compartment, so a change of look reaches the buffer shown and every kept tab.
- **E19, the reply brighter than the message.** The model's reply goes from #b9bec5 (L* 76.8) to #e2e5e9 (L* 90.8); the person's message goes from #e2e5e9 to #d7dade (L* 86.9) (`RESEARCH-2026-11-11-pane-text-emphasis.md`). The transcript does not import the app, so the three transcript containers set `--transcript-reply` and `--transcript-message` from the table, and `Row.tsx` reads them.

Verifiable properties: under `new`, the code's lines sit 20 px apart, and the reply's text decodes 2.5 to 8 L* brighter than the message's; under `original`, 23 px, and the message at least 8 L* brighter than the reply.

## prerequisites

- 478.

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/templates/SPRINT_CARD.md`, `../sdd-kit-3/ADDENDUMS.md` A2
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r17.md` E18, E19
- `process/planning/2026-11-09-code-editor/RESEARCH-2026-11-11-colour-spacing-wrap.md`, `RESEARCH-2026-11-11-pane-text-emphasis.md`
- `web/app/derive/look.ts`; `web/app/editor/Centre.tsx` (`THEME`, `CONF`, `placeView`); `web/reveal/transcript/Row.tsx` (`styleFor`); `web/app/PanesView.tsx`, `web/app/App.tsx`, `web/app/editor/EditorView.tsx`
- `harness/shakeout/transcript_spacing.ts`; `electron/invariants.ts` (S11)

## signal contract

### Emits

No new tag. EDITOR_FILE_SHOWN keeps its payload; its write moves after the render's commit (below).

### Consumes

- `settings.look`.

### Invariants

- S11: no editor record outside the pane's editor run.
- Tool, status and warning rows keep their colours; code blocks in replies keep theirs (the Later list).

## artifact contract

### Files created

- none

### Files modified

- `web/app/derive/look.ts`: `codeLineHeight`, `replyColor`, `messageColor`, `transcriptVars`
- `web/app/editor/Centre.tsx`: `CONF.look`, `lookTheme`; `.cm-scroller` has no fixed line height; EDITOR_FILE_SHOWN written in a microtask
- `web/reveal/transcript/Row.tsx`: the user and model `textColor` read the CSS variables
- `web/app/PanesView.tsx`, `web/app/App.tsx`, `web/app/editor/EditorView.tsx`: the containers set the variables
- `harness/shakeout/transcript_spacing.ts`: the code's pitch, and the reply against the message

### Content assertions

- `LOOK.original` holds `codeLineHeight: 23`, `replyColor: "#b9bec5"`, `messageColor: "#e2e5e9"`.
- `LOOK.new` holds `codeLineHeight: 20`, `replyColor: "#e2e5e9"`, `messageColor: "#d7dade"`.

### Command exit codes

- `npm run build` returns 0
- `npm run test:unit` returns 0

## observation contract

### UI driving steps

Gate `transcript_spacing.ts`, from source and on the bundle. It runs three passes: `new`, then `original` (picked in Settings), then `new` again. Each pass:

- measures the transcript's pitch in the pane, meta and the editor's terminal, as sprint 478 does;
- decodes the pane's message and reply text lightness (the brightest 1% of each row's pixels);
- opens notes.md (12 lines) in the editor and decodes the code's line pitch.

### Expected runtime signals

- No INVARIANT_BROKEN.

### Expected screenshot / visual state

- Under `new`, the reply reads brighter than the message, and the code's lines are closer together.

## done criteria

The code's lines and the reply's brightness change under `new`, and stay as they were under `original`.

## notes

Six product files, past the two-file limit: one table, its two new readers (the code and the rows), and the three containers that pass the colours to the rows. The containers were already touched in 478. Two merged cards, at the Architect's direction.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: two values, each with a verifiable property on screen.
- [x] context_files cover the research, the table, the code's theme, the rows and the containers.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Past the two-file limit, for the reason in the notes.

## close

`LOOK` gained `codeLineHeight` (original 23, new 20), `replyColor` (original #b9bec5, new #e2e5e9) and `messageColor` (original #e2e5e9, new #d7dade). The code's line height sits in a compartment (`CONF.look`), set when a buffer is created or placed and when the look changes. The three containers set `--transcript-reply` and `--transcript-message`; `Row.tsx` reads them.

**Found and fixed.** The gate's first full run broke invariant S11 twice. When the person returns to the editor with a tab already read, sprint 473's layout effect places the text and wrote EDITOR_FILE_SHOWN before App's `componentDidUpdate` wrote EDITOR_OPENED, so an editor record came before its editor run. The time is now taken at placement and the tag written in a microtask, after the commit. No gate before this one left and re-entered the editor with a file open.

**Gate `transcript_spacing.ts`,** from source and on the bundle (build 1794454569, packaged true), all three passes:

| Look | Code pitch | Message L* | Reply L* | Transcript |
|---|---|---|---|---|
| `new` | 20 px | 87.0 | 90.9 | as 478 |
| `original` | 23 px | 90.9 | 76.9 | as 478 |

No INVARIANT_BROKEN.

**Mutants:**

- The reply fixed at #b9bec5 fails: under `new` the reply decodes at 76.9 against the message's 87.0.
- The code keeping the look it was created with fails: under `original` the code still reads 20 px against 23 wanted.

**Command exit codes:** `npm run build` 0; `npm run test:unit` 231/231. Also on the bundle: `editor_open_speed`, `editor_highlight_seen`, `editor_centre`, `dialogs`, `editor_view`, `transcript_follow` 0.

**Rubber Duck Pass.** EDITOR_FILE_SHOWN now follows EDITOR_OPENED on a return to the editor (order violation, resolved here). No other observations.

Installed: CFBundleVersion 1794454569.
