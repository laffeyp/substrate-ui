# Sprint 526 — A call's stream keeps its last 1,000 lines

```yaml
---
id: 526
status: closed
phase: window productionized (roadmap 2026-11-18-window-productionizing r1, W4)
pass_kind: functional
depends_on: [525]
plan: process/planning/2026-11-18-window-productionizing/ROADMAP-2026-11-19-window-productionizing-r1.md
---
```

## scope

The session controller's `ToolProgress` handler keeps only the last 1,000 lines of each call's streaming output. When a chunk arrives, the controller appends it to the call's accumulated text, then trims to the trailing 1,000 lines. A `droppedLines` count on each progress entry records how many lines were trimmed. `ProgressStream` and the plain-text tool block show the trimmed text; a line above the output reads "N earlier lines not shown" when `droppedLines > 0`. The full output stays on the record, unchanged. One verifiable property: in the W1 gate's long call (20,000+ progress chunks, megabytes of text), `progressByCallId[key].text` holds at most 1,000 newlines and the card shows the dropped-line count.

## prerequisites

- 525 (W3: the scroll anchor per frame; combined with W2's batch fold, the per-frame cost is low enough that W4's bounded text is the next layer)

## context_files

- `../sdd-kit-3/AGENTS.md`
- `web/vm/signals/versions/current.json` (v0.73)
- `BLACKBOARD.md` (decision entries, tail)
- `WORKING_AGREEMENT.md`
- `web/vm/session_controller.ts` — the `ToolProgress` handler (in `envelopeToRows`, the `ToolProgress` case); also `flushBatch` (which joins buffered chunks after a batch drain) and `drainBatch`. The ToolProgress handler has two paths after sprint 524: a drain path that pushes chunks into `this.batchChunks` (a `Map<string, string[]>`, joined at `flushBatch`), and a non-drain path that concatenates directly via `prior.text + chunk`. The trim to 1,000 lines must work in both: in the non-drain path, trim the concatenated string; in the drain path, trim at flush time after `chunks.join("")` in `flushBatch`.
- `web/vm/types.ts` — the `ProgressEntry` type (or inline shape) that holds `text` and `eof`; this sprint adds `droppedLines`
- `web/reveal/transcript/ProgressStream.tsx` — renders the stream text; must show the dropped-line count
- `web/reveal/transcript/ToolCard.tsx` — passes `progressText` to `ProgressStream`; must pass `droppedLines`
- `process/planning/2026-11-18-window-productionizing/RESEARCH-2026-11-20-window-productionizing-r5.md` (§ "Why": the 2.65 MB output redrawn 20,000 times)

## signal contract

### Emits

No new tags.

### Consumes

- As listed in `context_files`.

### Invariants

- The vocabulary file is not modified.
- The record is not modified; the kernel's one-event-per-line output is unchanged.
- When a call's stream has ≤1,000 lines, `droppedLines` is 0 and the text is complete.
- `eof` still propagates correctly.

## artifact contract

### Files created

None.

### Files modified

- `web/vm/session_controller.ts` — the `ToolProgress` case (non-drain path) trims `prior.text + chunk` to its last 1,000 lines and maintains `droppedLines`; `flushBatch` trims each call's joined text to 1,000 lines after `chunks.join("")` and updates `droppedLines` on the entry.
- `web/vm/types.ts` — the progress entry shape gains `droppedLines: number`.
- `web/reveal/transcript/ProgressStream.tsx` — accepts `droppedLines` and renders the count when > 0.
- `web/reveal/transcript/ToolCard.tsx` — passes `droppedLines` from the snapshot to `ProgressStream`.

### Content assertions

- `session_controller.ts`'s `ToolProgress` case (non-drain path) contains a line-count check and a trim (split + slice + join, or equivalent); `flushBatch` also trims after `chunks.join("")`.
- `ProgressStream.tsx` renders a line count when `droppedLines > 0`.
- The constant 1,000 is named and in one place.

### Command exit codes

- `npx tsc -p harness --noEmit` returns 0.
- `npm run test:unit` returns 0.
- `npm run gates:electron` — `tool_output_text`, `tool_output_formatted` pass.

## observation contract

### UI driving steps

- Run `tool_output_text` gate: its streaming call and 38 KB `seq` output both draw; the streaming call's block holds its last lines.
- Run the W1 gate: the long call's stream is bounded.

### Expected runtime signals

- No `RENDERER_GONE` in W1's trace.

### Expected screenshot / visual state

- The W1 gate's long-call card shows "N earlier lines not shown" above its output.

## done criteria

A pane keeps at most 1,000 lines of each call's stream, with a count of lines dropped; the full output stays on the record; the tool-output gates pass; W1's long call does not carry megabytes in the page.

## notes

- 1,000 lines matches xterm.js's default scrollback and VS Code's `terminal.integrated.scrollback` default.
- The trim operates on the concatenated string, not on individual chunks, because the line boundary may fall across two chunks. Split on `\n`, take the last 1,001 entries (the last may be partial), join.
- 4 files modified, which exceeds hard rule 6's sweet spot of ≤2. The alternative split: one sprint for the controller + types (the data layer), one for the components (the view layer). The Architect's judgment: the four changes are one concept (bounded stream) and no pair of them is independently useful; a split would leave an intermediate state where the controller trims but the view shows no count. Log this in the hand-author table if the sprint proceeds as one.

## self-review checklist

- [ ] Scope is concrete and bounded (one paragraph; one verifiable property of the artifact).
- [ ] `context_files` covers everything the Agent needs to read.
- [ ] Signal contract's `Emits` list references only tags in `signals/0.73.json`.
- [ ] Artifact contract is gradable: content assertions are concrete, command exit codes are runnable.
- [ ] If `pass_kind: functional`: observation contract is present.
- [ ] Sprint sweet spot honored: 4 files modified, one concept; logged bypass per hard rule 10.
