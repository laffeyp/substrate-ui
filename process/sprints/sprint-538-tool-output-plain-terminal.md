# Sprint 538 — Tool output as a plain terminal column (a new Settings option)

```yaml
---
id: 538
status: pending
phase: daily-driver-fixes (roadmap 2026-11-17-daily-driver-fixes)
pass_kind: functional
depends_on: []
plan: process/planning/2026-11-17-daily-driver-fixes/RESEARCH-2026-11-20-tool-output-text-presentation-r2.md
---
```

## scope

Add a new tool-output presentation, built exactly to `RESEARCH-2026-11-20-tool-output-text-presentation-r2.md`: one monospace column — the command line, then its output on the lines below — flowed onto the pane's ground, no box, no inset, no `args`/`output` label, no `call_id … · N bytes` footer, keeping the ANSI terminal model and the sprints-505–512 language/diff/grep formatting. It is a new option in the tool-output setting (`web/vm/tool_view.ts`), chosen in the Settings panel beside the existing boxed presentation. The boxed presentation is not touched, not replaced, not renamed; both stay in the app so the viewer cycles between them in Settings. One verifiable property: with the new option chosen, a bash tool call draws its command and output as rows in the pane's scrolling column with no box element, ANSI colour kept; with the boxed option chosen, the card draws exactly as it does today.

## prerequisites

- none (the record already carries the command, the output and the control codes — research r2 "What the data already carries")

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json`
- `BLACKBOARD.md` (decision entries, tail)
- `WORKING_AGREEMENT.md`
- `process/planning/2026-11-17-daily-driver-fixes/RESEARCH-2026-11-20-tool-output-text-presentation-r2.md` — the shape to build, exactly
- `web/reveal/transcript/ToolCard.tsx` — adds the plain-column render for the new option; the boxed render stays
- `web/reveal/transcript/ToolText.tsx`, `web/reveal/transcript/ansi.ts` — the terminal/ANSI render to reuse
- `web/reveal/tool_format.ts` — `summaryOf` (the command), `shellResult`, `outputFormat`, `commandFormat`, `needsTerminal`
- `web/vm/tool_view.ts`, `web/reveal/transcript/useToolView.ts` — the tool-output setting the new option joins
- `web/app/state/settings.ts` and the Settings panel — where the option is picked

## signal contract

### Emits

No new tags. (Presentation only; `TRANSCRIPT_ROW_DRAWN`/`TRANSCRIPT_ROWS_SKIPPED` still fire per row.)

### Invariants

- The vocabulary file is not modified.
- The boxed presentation renders exactly as it does today when it is the chosen option.
- The command text comes from the `ToolCall` envelope (`summaryOf`), the output from the paired `ToolResult`/the live stream; no new data is read.
- The ANSI model, `needsTerminal`, and the sprints-505–512 language/diff/grep formatting are reused unchanged in the new render.

## artifact contract

### Files modified

- `web/vm/tool_view.ts` (and `useToolView.ts`, `web/app/state/settings.ts`, the Settings panel) — the tool-output setting gains the plain-terminal option.
- `web/reveal/transcript/ToolCard.tsx` — when the plain option is chosen, render the command line and output as the terminal column; otherwise the existing boxed card.

### Content assertions

- `tool_view.ts` lists the new option alongside the boxed one.
- With the plain option, a bash call renders no `maxHeight: 220` inset box and no `call_id … · N bytes` footer; the command line (from `summaryOf`) sits above the output.
- With the boxed option, `data-tool-card-body` and the footer still render.

### Command exit codes

- `npx tsc -p harness --noEmit` returns 0.
- `npm run build` returns 0.
- `npm run test:unit` returns 0.
- `npm run gates:electron` — a new gate checks the plain column; the existing tool-output gates (which assert the boxed markup) still pass unchanged.

## observation contract

### UI driving steps

- Run a scripted deterministic turn with a `read_file`, a `bash` with coloured output, a short multi-line `bash` stream, and a `write_file`.
- Pick the plain-terminal option in Settings; read the pane. Pick the boxed option; read the pane.

### Expected screenshot / visual state

- Plain option: each tool call draws as a command line and its output in one monospace column on the pane ground — no `#1a1c20` box, no inner scrollbar, no label, no footer; ANSI colour, Python syntax colour and `git diff` marks all kept; the three-line bash preview reads as three plain terminal lines.
- Boxed option: the card draws exactly as it does today.

## done criteria

The plain terminal presentation from research r2 is a new option in the tool-output setting; the boxed presentation is unchanged; the viewer cycles between them in Settings; the new gate and every existing gate pass.

## notes

- Build the shape straight from research r2: command line, then output, on the pane ground; everything below the command/output split (ANSI, language parse, diff, grep) is reused as-is.
- A new gate covers the plain option; the existing `tool_output_formatted`/`tool_output_text`/`tool_summary_lines` gates assert the boxed option and keep passing — do not change them.

## self-review checklist

- [ ] Scope is concrete and bounded (one paragraph; one verifiable property).
- [ ] `context_files` covers what the worker reads, including the research doc.
- [ ] Artifact contract is gradable; command exit codes runnable.
- [ ] Observation contract present (a visual change).
- [ ] Sprint sweet spot: one concept (a new presentation option); log the bypass if it exceeds two files.
