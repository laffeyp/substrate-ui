# Sprint 073 — model-reply blocks

```yaml
---
id: 073
status: pending
phase: 8
pass_kind: functional
---
```

## scope

Extract the reveal shell's markdown parser out of `reveal_component.ts` into `web/reveal/markdown.ts`. Author `<ModelReply>` as a React component that consumes the parser and renders paragraph / fenced-code / unordered-list / ordered-list / heading blocks with markup identical to the current template. Wire the component into `<Row>` for `TranscriptRole.Model` rows. Unit-test the parser on fixtures drawn from real captured sessions.

## prerequisites

- 072 (plain rows).

## context_files

- `sdd-kit-2/AGENTS.md`
- `process/planning/PLAN-2026-09-23-phase-8-transcript-atom-migration.md` (§7 Sprint 073).
- `web/reveal_component.ts` (`_mdBlocks`, `_mdInlines`, `_mdRenderBlock`, `_mdRenderInline` — around lines 771-812).
- `web/reveal.html` (lines 96-108 — current model-reply markup).
- Two or three saved sessions under `captures/shakeout-2026-09-23/` for fixture material.
- `web/reveal/transcript/Row.tsx` (from Sprint 072).

## signal contract

### Emits

None new.

### Consumes

- Every context file above.

### Invariants

- `signals/0.1.json` unmodified.
- The parser's output shape (`{ kind: "p" | "code_block" | "ul" | "ol" | "heading", ... }`) matches the current implementation byte-for-byte on the fixture set.
- `<ModelReply>` is wrapped in `React.memo`.
- `<Row>` for role `model` swaps its stub for `<ModelReply>`.

## artifact contract

### Files created

- `web/reveal/markdown.ts` — exports `mdBlocks(text)`, `mdInlines(text)`, `renderBlock(block)`, `renderInline(inline)`; each function is pure, no `this`.
- `web/reveal/transcript/ModelReply.tsx` — consumes `mdBlocks` and emits the block markup.
- `web/reveal/__tests__/markdown.spec.ts` — table-driven test covering: paragraph, fenced code with lang, fenced code without lang, unordered list nesting, ordered list, heading levels 1-4, inline code, bold, italic.

### Files modified

- `web/reveal_component.ts` — replace the inline parser implementations with imports from `web/reveal/markdown.ts`. dc-runtime path still uses the parser (extraction is behaviour-preserving).
- `web/reveal/transcript/Row.tsx` — dispatch `TranscriptRole.Model` rows to `<ModelReply>`.
- `package.json` — if a test runner isn't already wired, add `"test:unit": "npx tsx --test web/reveal/__tests__/*.spec.ts"`.

### Content assertions

- `web/reveal/markdown.ts` exports four named functions; each is a plain `function` or `const`, none references `this`.
- `web/reveal_component.ts` imports the four functions from `./reveal/markdown`.
- `ModelReply.tsx` produces one `<div style="margin:0 0 12px;background:#1a1c20;…">` per code block matching the current template's inline style verbatim.
- `markdown.spec.ts` contains at least eight test cases.

### Command exit codes

- `npm run typecheck` returns 0.
- `npm run lint` returns 0.
- `npm run build` returns 0.
- `npm run test:unit` returns 0.
- `npm run smoke:vm` returns 0.
- `npx tsx web/vm/tools/check-vocabulary-parity.ts` returns 0.
- `npm run pixel:diff` returns 0 for the `one_turn` state and (with a session that emits a model reply featuring every block kind) a new `model_reply_all_blocks` state, both viewports, with the flag ON.

## observation contract

### UI driving steps

- Load `?atom-transcript=1`. Open a real-driver session. Prompt: "Write me a short reply that includes: one paragraph, one bullet list of three items, one fenced `` typescript `` code block with a two-line example, and one `##` heading."
- Wait for park.

### Expected log substrings

- No React warnings about invalid children.
- No `[reveal] markdown` warnings in the console.

### Expected runtime signals

- `TURN_SUBMITTED`, `TURN_ACK`, `STREAM_ENVELOPE_APPENDED` (× N), `TURN_PARKED` all fire. No new tags.

### Expected screenshot / visual state

- Model-reply row: paragraph text at `#b9bec5`, list at `padding-left:20px`, code block on `#1a1c20` background, heading at `#e2e5e9`, all matching Sprint 070 baseline for the model rows.

## done criteria

The markdown parser lives on its own in `web/reveal/markdown.ts`; the React `<ModelReply>` component renders block-level content identically to the current dc-runtime template. Unit tests cover every block kind. Pixel diff clean for model-reply states.

## notes

Behaviour-preserving extraction (hard rule 7: preserve accreted detail). Every branch in `_mdBlocks` is carried over verbatim; edge cases (fenced-block-inside-list, nested emphasis) are pinned in the unit tests before code moves.
