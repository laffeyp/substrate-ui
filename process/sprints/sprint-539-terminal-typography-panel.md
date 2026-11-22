# Sprint 539 — The terminal typography panel

```yaml
---
id: 539
status: pending
phase: daily-driver-fixes (roadmap 2026-11-17-daily-driver-fixes)
pass_kind: functional
depends_on: []
plan: process/planning/2026-11-21-terminal-typography/DESIGN-2026-11-21-terminal-typography-r1.md
---
```

## scope

Make the substrate terminal window's text tunable, per `DESIGN-2026-11-21-terminal-typography-r1.md`. Add a "Terminal type" section to the Settings dialog (⌘,) with a control per parameter, each writing a CSS variable the transcript reads, persisted and mirrored like the look/scheme/tool-view picks, landing as an option beside the default (the standing appearance rule) — the default values stay and the controls move off them and back. This sprint ships the nine CSS-variable parameters whose behaviour is settled; it defers the two with open questions to a round 2: a bundled **typeface** picker (a new font asset and a licence check) and **measure** centring (a design call in the note). One verifiable property: setting each control changes the matching CSS variable on the transcript container and the rendered text follows (size, leading, paragraph spacing, tracking, word spacing, alignment, weight, brightness, emphasis), and clearing a control falls back to today's value with the transcript unchanged.

## prerequisites

- none (extends the existing look/CSS-variable system and the Settings panel)

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json`
- `BLACKBOARD.md` (decision entries — the 2026-11-17 standing appearance rule; and the tail)
- `WORKING_AGREEMENT.md`
- `process/planning/2026-11-21-terminal-typography/DESIGN-2026-11-21-terminal-typography-r1.md` — the parameters, their CSS, ranges and defaults, and the vocabulary
- `web/app/derive/look.ts` — `transcriptVars` sets the transcript's CSS variables; add the typography variables here
- `web/app/state/settings.ts` — the persisted settings store and the Settings panel wiring
- `web/reveal/transcript/Row.tsx`, `web/reveal/transcript/ModelReply.tsx`, `web/reveal/transcript/ToolCard.tsx` — the text that reads the variables (body, headings/bold emphasis, tool output)

## signal contract

### Emits

No new tags. Like the look, scheme and tool-view picks, a typography pick emits no signal (see `web/vm/tool_view.ts`, `tool_output_mode.ts`).

### Invariants

- The vocabulary file is not modified (no signal change).
- Each parameter is a CSS variable with a documented default; an unset variable falls back to today's value (`var(--term-…, <default>)`), so the default appearance is byte-identical when nothing is set.
- The controls apply to the transcript (the terminal window), not the code editor (its `codeLineHeight` is out of scope for round 1).
- Terminology in code comments and the panel's labels uses the field terms the design note's vocabulary check settled (leading, tracking, word spacing, measure/line length, alignment, weight, brightness/value, emphasis, paragraph spacing).

## artifact contract

### Files created

- `web/app/derive/terminal_type.ts` (or similar) — the parameter list, each with its CSS variable name, range and default; a function turning a settings value into the variable map. (Author decides the exact home; record it.)

### Files modified

- `web/app/derive/look.ts` — `transcriptVars` merges in the typography variables.
- `web/app/state/settings.ts` — a `terminalType` object in the store, persisted, mirrored into the transcript variables on load and on change; the Settings panel gains the "Terminal type" section (slider per numeric parameter, segmented control for alignment, a "reset to default" and a "dense" preset).
- `web/reveal/transcript/Row.tsx`, `ModelReply.tsx`, `ToolCard.tsx` — the text styles read the variables (`var(--term-size, …)`, etc.); the heading/bold emphasis reads `--term-emphasis-*`.

### Content assertions

- `transcriptVars` output includes the typography variables.
- The Settings panel renders a labelled control for each of the nine parameters.
- Each transcript text style reads its variable with a fallback to the current hard-coded value.

### Command exit codes

- `uv run --project ../substrate ruff check .` and `ruff format --check .` return 0.
- `npx tsc -p harness --noEmit` returns 0.
- `npm run build` returns 0.
- `npm run test:unit` returns 0.
- `npm run gates:electron` — a new `terminal_type` gate passes; every existing gate passes (the default appearance is unchanged, so the appearance gates — `editor_ground`, `tool_output_*`, `length_tone_rows` — keep passing).

## observation contract

### UI driving steps

- Open Settings (⌘,), the "Terminal type" section. Set each control (size, leading, paragraph spacing, tracking, word spacing, alignment, weight, brightness, emphasis) and read the transcript.
- Use "reset to default" and "dense".

### Expected screenshot / visual state

- With defaults, the transcript decodes byte-identical to today (the appearance gates pass unchanged).
- Setting size/leading/tracking/word-spacing/weight visibly changes the matching CSS variable and the text metrics; alignment moves the lines; brightness changes the body text's value; emphasis changes how far headings/bold sit above the body.
- "dense" sets tight leading and negative tracking at once; "reset" returns every variable to its default.

## done criteria

The terminal text is tunable on nine parameters from a Settings section, each a CSS variable with a default fallback, persisted, landing as an option beside the default; the default appearance is unchanged and its gates pass; a new gate drives the controls and reads the variables. Typeface bundling and measure centring are deferred to round 2 with their open questions.

## notes

- Build straight from the design note's parameter table and vocabulary check. Keep the default-fallback discipline so nothing changes until the viewer moves a control.
- The 2026-11-21 bold-brightness fix (heading/bold pulled to `#cdd1d7`) is the emphasis parameter's current default; wire it as `--term-emphasis-value` so the control tunes it rather than a hard-coded colour.
- This touches several files (derive, settings, three transcript components, a gate): log the hard-rule-6 bypass in `WORKING_AGREEMENT.md`.

## self-review checklist

- [ ] Scope concrete and bounded; one verifiable property.
- [ ] `context_files` covers the design note and the files that read/write the variables.
- [ ] Artifact contract gradable; command exit codes runnable.
- [ ] Observation contract present (a visual, configurable change).
- [ ] Default appearance unchanged (fallbacks); existing appearance gates pass.
