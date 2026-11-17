# Sprint 517 — Tool output as plain text, the Claude Code shape

```yaml
---
id: 517
status: pending
phase: daily-driver fixes (roadmap 2026-11-17-daily-driver-fixes r1, E3)
pass_kind: functional
---
```

## scope

A tool call in the transcript gains a plain-text presentation: its summary line (the name and command, sprints 506/509), then its text below on the dark ground — no args box, no output inset, no separate streaming block, no `call_id · step · bytes` footer (the Architect, 2026-11-17: "just all text … it just goes bash and then it doesn't show what the args are or whatever … and then that text just goes below … if there's a streaming output there shouldn't be a regular because they're always the same"). A streaming output and its result are one block, drawn once: while the tool runs the block holds the stream's text; when the result lands the block takes it, keeping any streamed text the result's cap cut (the kernel facts in `notes`). All the formatting of sprints 505–512 stays — the palettes, the per-language parsers, the diff and grep layouts, the ANSI terminal model; this change reframes how the transcript frames the output, not what it parses. The presentation is an option in Settings beside the boxed card, which stays the default until the Architect judges the new shape in the installed build (the Architect, 2026-11-17: "if it looks good, then it will become the default. If it doesn't, it will just become another option that we'll work off of again"). One verifiable property: under the `text` option, a deterministic turn's calls draw with no `[data-tool-card-body]` element, the output text in one `[data-tool-plain]` block per call, its background decoding `#1a1c20`; under the default `cards`, every element draws as today.

## prerequisites

- none

## context_files

- `web/reveal/transcript/ToolCard.tsx` (the card: summary, args section, output inset, `ProgressStream`, footer)
- `web/reveal/transcript/ProgressStream.tsx` (the streaming inset this card folds into the one block)
- `web/reveal/tool_format.ts` (`argFormat`, `outputFormat`, `shellResult`, `summaryOf` — pure, unchanged)
- `web/vm/tool_output_mode.ts` (the fold: auto/expanded/collapsed; unchanged — collapsed still shows the summary line alone in either presentation)
- `web/app/state/settings.ts` (`look`, `scheme`; the persisted viewer settings)
- `web/app/Dialogs.tsx` (the settings chips)
- `harness/shakeout/tool_output_formatted.ts` (the deterministic four-call script this card's gate reuses)
- `harness/shakeout/transcript_spacing.ts` (`pick()`, lines 106–114: how a gate sets a look — it clicks the chip in the live window; no gate sets localStorage before load)
- `../substrate/src/substrate/topologies/tool_loop/tools.py` (`_pump`, `_BASH_STDOUT_BYTES`: what the stream and the result each carry)
- `process/BACKLOG.md` ("Daily-driver fixes (2026-11-17)")

## signal contract

### Emits

- No new tags. The setting pick emits nothing, as the look and scheme picks do (`state/settings.ts` holds no emit; confirmed by grep at build). `TOOL_CARD_TOGGLED` and `TOOL_OUTPUT_MODE_SET` fire as they do today; the fold works in both presentations.

### Consumes

- Mirrors `context_files`.

### Invariants

- `web/reveal/tool_format.ts` is not modified: the parsing and formatting the sprints built is the same in both presentations.
- The default presentation is drawn exactly as today: the existing output gates pass unmodified, and the transcript's pixel baseline is unchanged.
- No out-of-vocabulary tags; the change adds none.
- D7 holds: no new hues; the one background is the existing inset colour.

## artifact contract

### Files created

- `harness/shakeout/tool_output_text.ts` — the gate below.

### Files modified

- `web/reveal/transcript/ToolCard.tsx` — the text presentation: the summary line as today; below it one block, `data-tool-plain="1"`, full width, background `#1a1c20`, holding the call's text through `ToolText` with the existing formats. The block's text is the stream's while the tool runs and the result's when it lands — one element across the boundary. The kernel's facts bound the identity (verified in `../substrate/src/substrate/topologies/tool_loop/tools.py` on 2026-11-17): the stream carries stdout only (`_pump` reads the stdout file), the result's stdout is capped at 8,000 bytes (`_BASH_STDOUT_BYTES`, with K295's truncation note), and stderr and a non-zero exit arrive only with the result. So at the boundary the block takes the result's stdout, stderr and exit as today, except when the streamed text is longer than the result's stdout (the cap): then the block keeps the streamed text and appends the result's stderr, exit and truncation note. Nothing the stream showed is lost. A write or edit call's body text (old before new, sprint 511's order) draws in the block ahead of the output, formatted as code as today, without the `args` label and `[n]` indices. The footer and the boxed body draw only in `cards`.
- `web/app/state/settings.ts` — `toolView: "cards" | "text"` (default `"cards"`), `pickToolView`, persisted in `substrate-ui.settings` beside `look` and `scheme`.
- `web/app/Dialogs.tsx` — a `tool output` row of chips beside `look` and `code colours`.
- `package.json` — `tool_output_text` joins `gates:electron`.

### Content assertions

- `grep -n 'data-tool-plain' web/reveal/transcript/ToolCard.tsx` finds the block; `grep -n 'toolView' web/app/state/settings.ts web/app/Dialogs.tsx` finds the setting, its default `"cards"` and its chip row.
- `git diff --exit-code -- web/reveal/tool_format.ts harness/shakeout/tool_output_formatted.ts harness/shakeout/tool_output_claude.ts harness/shakeout/tool_summary_lines.ts` after the sprint's edits: the format layer and the existing gates are untouched.
- `grep -n '_BASH_STDOUT_BYTES' ../substrate/src/substrate/topologies/tool_loop/tools.py` shows the 8,000-byte cap the boundary rule cites.

### Command exit codes

- `npm run build` returns 0
- `npm run test:unit` returns 0
- `npx tsx harness/shakeout/tool_output_text.ts` from source returns 0
- `npx tsx harness/shakeout/tool_output_formatted.ts`, `tool_summary_lines.ts` and `tool_output_claude.ts` from source return 0, unmodified
- `npm run pack:dev` returns 0; the four gates against the bundle return 0
- `npm run pixel:capture && npm run pixel:diff` against the existing baseline returns 0 (the default's pixels are unchanged)

## observation contract

### UI driving steps

- The gate posts a deterministic session on a real fixture repository and runs the four-call script of `tool_output_formatted.ts` (a read, a write, a `bash` whose output is a file's code, a streaming `bash`); then it opens Settings and clicks the `text` chip, and later the `cards` chip (the path `transcript_spacing.ts`'s `pick()` uses).

### Expected log substrings

- None beyond the gates' own.

### Expected runtime signals

- The turn's tags in the packaged app's trace; no `INVARIANT_BROKEN` in the launch's `main.jsonl`.

### Expected screenshot / visual state

- `text` clicked: no `[data-tool-card-body]` element; each call is its summary line with one `[data-tool-plain]` block below; the block's decoded background is `#1a1c20`; a `cat` output's keyword ink decodes at the palette's colour (the formatting is alive without the box).
- The streaming call's block is one element whose text grows while running; at the result boundary it gains only what the result adds (stderr, exit, the truncation note); a stream longer than 8,000 bytes keeps its text. At no snapshot do two output blocks exist for one call.
- `cards` clicked: the boxes of today return.
- Screenshots of both presentations, captured and read.
- Mutants fail: drawing the args section under `text`; drawing the stream and the result as two elements; a block background other than `#1a1c20`; the streamed text dropped at the boundary.

## done criteria

The plain-text presentation exists as a Settings option, proven by the gate on the bundle; the boxed card stays the default; the Architect's look at the installed build decides whether `text` becomes the default.

## notes

- More than two files, one concept; the hand-author log carries the breadth at close, as sprint 472's did.
- The default stays `cards` by the Architect's ruling of 2026-11-17, which supersedes the agent-resolved default of the same day; flipping it after the look is a one-line change in `settings.ts`.
- Claude Code's own cards (sprint 511) draw in the text shape too — the presentation is the transcript's, not the driver's.
- Installed into Substrate at close, by runbook r10 chapter 5.

## self-review checklist

- [x] Scope is concrete and bounded (one presentation, one verifiable decode).
- [x] `context_files` covers the card, the stream, the format layer, the settings, the gates and the kernel's stream/result source; D7 is named in the invariants.
- [x] The signal contract names no tags outside the locked vocabulary.
- [x] The artifact contract is gradable: greps, a `git diff` over the untouched files, decodes, named commands with exit codes.
- [x] Observation contract present (behaviour-touching).
- [x] One concept; the file breadth is the settings row, the gate and `package.json`, and is logged at close.
