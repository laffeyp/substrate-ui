# Sprint 461 — text in narrow columns wraps, and nothing is cut

```yaml
---
id: 461
status: closed
phase: code editor (roadmap r13), E12
pass_kind: functional
---
```

## scope

Roadmap r13 E12 (BLACKBOARD 2026-11-09 deferred: "a path with no break points runs to the docked-right terminal's edge and is cut there … the bar line is cut the same way"). Today's build shows both in the terminal docked right (`editor_layout`, `runs/packaged/sprint-416-20261111-205124-source/layout-1.png`): the session's first line loses `T/editor-` of its workspace path at the column's edge, and the bar line loses `handoff normal` after `hand`. The rule this sprint sets: text in a narrow column wraps and is never cut. A word wraps at its spaces; a run with no break point (a path) breaks anywhere, as the transcript's rows already do (`overflowWrap: "anywhere"`); the bar line wraps between its settings, each setting (its name, its value and its shift marks) kept on one line.

Causes: `web/reveal/transcript/Transcript.tsx`'s session line (`data-session-start-line`) has no `overflowWrap`; `web/app/ActivityLine.tsx` wraps the whole settings tail in one `whiteSpace: nowrap; display: inline-block` span.

## prerequisites

- 416 (the layouts and the docked-right terminal), 409 (the editor's footer).

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`; `WORKING_AGREEMENT.md` (Observation contract: the widths the user works at, 1512 points and the 504-point minimum)
- `BLACKBOARD.md`: the deferred entry of 2026-11-09 above; its tail
- `ROADMAP-2026-11-09-code-editor-r13.md` E12
- `web/reveal/transcript/Transcript.tsx` (`startLine`, the session line); `web/reveal/transcript/Row.tsx` (rows' `overflowWrap: "anywhere"`); `web/app/ActivityLine.tsx`; `web/reveal/settings_tail.ts` (`settingsTail`, the segments)
- `harness/shakeout/editor_layout.ts` (the View menu's layouts)
- MDN, `overflow-wrap`: `anywhere` breaks "an otherwise unbreakable sequence of characters … at any point if there are no otherwise-acceptable break points in the line".

## signal contract

### Emits

No new tag; vocabulary v0.60 unchanged. The change is in how two lines are laid out; the existing `TRANSCRIPT_ROW_DRAWN` and `EDITOR_DRAWN` fire as before.

### Consumes

- The pane's snapshot (the workspace path; the bar line's settings).

### Invariants

- The two lines' text is unchanged; only where they wrap changes.
- A setting's name and value never sit on different lines.

## artifact contract

### Files created

- `harness/shakeout/narrow_text.ts`

### Files modified

- `web/reveal/transcript/Transcript.tsx` (the session line: `overflowWrap: "anywhere"`)
- `web/app/ActivityLine.tsx` (the tail: one no-wrap span per setting, the separators between them breakable)

### Content assertions

- `Transcript.tsx`'s `data-session-start-line` element sets `overflowWrap: "anywhere"`.
- `ActivityLine.tsx` no longer sets `whiteSpace: "nowrap"` on `data-settings-tail`; each setting is a `data-settings-item` span with `whiteSpace: "nowrap"`.

### Command exit codes

- `npm run build` returns 0; `npm run test:unit` returns 0

## observation contract

Gate `narrow_text.ts` (new), from source and on the bundle. The deterministic driver, bound to a folder whose path is longer than the column (the gate's scratch folder under the system's temp folder, plus a long directory name written by the gate). After "hello":

1. The editor with the terminal docked right (View ▸ dock right, as `editor_layout` drives it) at 1512 points.
2. The panes view at the window's 504-point minimum.

In each: the session line and the bar line each lie inside their column (each element's right edge at most its column's right edge, and `scrollWidth` at most `clientWidth`); the session line's text holds the whole workspace path; the bar line's text holds `handoff`; each `data-settings-item` is one line high. Screenshots of both go to `runs/packaged/sprint-461-<stamp>-<source|packaged>/`.

A mutant that restores the tail's `nowrap` fails the bar line's check; one without the session line's `overflowWrap` fails its check.

## done criteria

In the narrowest columns the app draws, the session line and the bar line wrap and show all their text.

## notes

Other long lines found while doing this get the same rule if they are cut; any found is named in the close.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (the two lines lie inside their column with all their text).
- [x] context_files cover the code, the gate it builds on, the source of the rule.
- [x] Emits names no new tag; none needed.
- [x] Artifact contract is gradable: greps and exit codes.
- [x] Observation contract present, with mutants.
- [x] ≤2 files modified, one concept.

## close

A third file was touched: `web/reveal/settings_tail.ts` exports the separator (`TAIL_SEPARATOR`), so `ActivityLine.tsx` splits the tail on the same constant the tail is built with instead of a retyped " · ". The gate's first one-line test counted client rects, which are one per child span; it now counts distinct line tops. Mutants: without the session line's `overflowWrap` the gate fails ("the session line … fits: false"); with the tail's `nowrap` restored it fails (443 px of text in a 380 px box). Found while doing this and left as it is: at the 504-point minimum the header's chips are cut ("pan…", "det", "⌥ /Use"); the header stays as it is for now.

Command exit codes: build 0; unit specs 223/223. Gates on the bundle (packaged true): `narrow_text`, `editor_layout`, `language_bar_line`, `session_start_line`, `length_tone_rows`, `input_bar` 0.
