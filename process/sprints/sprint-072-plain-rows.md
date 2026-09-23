# Sprint 072 — plain rows

```yaml
---
id: 072
status: pending
phase: 8
pass_kind: functional
---
```

## scope

Render every non-tool, non-model transcript row through the React tree. Author `<Transcript>` as a subscriber to the pane's `SessionController` (via `useSyncExternalStore`) and `<Row>` as a memoized dispatcher on `envelope.role` for `user`, `park`, `ended`, and `warning`. Model replies render as raw text in this sprint (block parsing lands in 073); tool cards render as a plain one-line status header with the caret glyph (real ToolCard lands in 074). Pixel-diff must match the Sprint 070 baseline for the `empty`, `one_turn`, and `error` states.

## prerequisites

- 071 (mount seam).

## context_files

- `sdd-kit-2/AGENTS.md`
- `process/planning/PLAN-2026-09-23-phase-8-transcript-atom-migration.md` (§5.1, §5.3, §7 Sprint 072, Appendix B).
- `web/reveal_component.ts` (`_liveBindingsFor`, `renderVals` — the current row provider at lines 330-517).
- `web/reveal.html` (lines 90-133 — current row template).
- `web/vm/session_controller.ts` (`snapshot()`, `subscribe`, `TranscriptRow` shape).
- `web/vm/kinds.ts` (`TranscriptRole` and `EnvelopeKind`).
- `web/reveal/transcript/Transcript.tsx` (stub from Sprint 071).

## signal contract

### Emits

None new. Controller-side signals fire unchanged.

### Consumes

- Every context file above.

### Invariants

- `signals/0.1.json` unmodified.
- Each row uses `envelope.callId ?? \`seq:${envelope.seq}\`` as its React key.
- `<Row>` is wrapped in `React.memo`.
- The dc-runtime path stays live under the flag-off boot.
- No changes under `web/vm/*` (controller and vocabulary untouched).

## artifact contract

### Files created

- `web/reveal/transcript/Row.tsx` — dispatches on `envelope.role`; renders a `<div>` matching the current markup for `user`, `park`, `ended`, `warning`; renders raw-text stub for `model`; renders one-line header stub for `tool`.
- `web/reveal/transcript/useController.ts` — the `useSyncExternalStore` adapter per Plan §5.3.

### Files modified

- `web/reveal/transcript/Transcript.tsx` — replace stub. Read snapshot via `useController(paneId)`; filter transcript (fold `ToolResult` into its `ToolCall`); render one `<Row>` per row.
- `web/reveal.ts` — pass `paneId` and `view` props to `<Transcript>` at mount.

### Content assertions

- `Row.tsx` contains `React.memo(` on export and `envelope.callId ?? \`seq:${envelope.seq}\`` in key handling.
- `Transcript.tsx` imports `useSyncExternalStore` from React.
- `useController.ts` returns a `Snapshot`, wraps `controller.subscribe` and `controller.snapshot`.
- The markup produced for `user`/`park`/`ended`/`warning` rows matches the current template's inline style strings (colours, margin-top values, glyphs) verbatim.

### Command exit codes

- `npm run typecheck` returns 0.
- `npm run lint` returns 0.
- `npm run build` returns 0.
- `npm run smoke:vm` returns 0.
- `npx tsx web/vm/tools/check-vocabulary-parity.ts` returns 0.
- `npm run pixel:diff` returns 0 for the `empty`, `one_turn`, and `error` states (in both viewports) with the flag ON.

## observation contract

### UI driving steps

- Load `?atom-transcript=1`. Open a deterministic session. Send `hello`. Wait for park.
- Load `?atom-transcript=1`. Open a session, send `hello`, then call `controller.endSession()` via console.

### Expected log substrings

- No `page error`, no React warnings about missing keys.

### Expected runtime signals

- `SESSION_OPEN_REQUESTED`, `SESSION_OPEN_ACKED`, `TURN_SUBMITTED`, `TURN_ACK`, `TURN_PARKED`, `SESSION_END_REQUESTED`, `SESSION_ENDED_LOCAL` all appear in `window.__vmSignals`.
- Controller callback fires once per envelope; the React `<Row>` under `React.memo` renders only for the newly-appended row on each envelope (measured under a temporary `?trace-renders=1` counter; the counter is removed at sprint close).

### Expected screenshot / visual state

- `empty` state: matches Sprint 070 baseline (12 pixels tolerance total across the transcript region).
- `one_turn` state: user row and park row match baseline. Model row's text content matches (styling defers to Sprint 073).
- `error` state: `!` glyph and colour match baseline.

## done criteria

The React `<Transcript>` renders every user / park / ended / warning row identically to today's dc-runtime path. Under the flag ON, the pixel diff for those three states is zero.

## notes

Model-reply and tool-card rows deliberately render as stubs in this sprint. Their real components land in 073 and 074. The stubs keep the transcript readable enough to spot-check the plain-row rendering.
