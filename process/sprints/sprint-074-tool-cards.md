# Sprint 074 — tool cards

```yaml
---
id: 074
status: pending
phase: 8
pass_kind: functional
---
```

## scope

Author `<ToolCard>` as a memoized React component with its own `useState({ open })` for the collapse state. Author `<ProgressStream>` for the streaming pane so streaming updates re-render only the affected card, not siblings. Wire both into `<Row>` for `TranscriptRole.Tool` rows keyed on `callId`. Auto-open lives on `toolRunning` alone; `streamingShow` no longer drives it. Preserve the descend affordance, the streaming pane, the output pane, the error line, and the `call_id · step · status · bytes` footer.

## prerequisites

- 073 (markdown extraction and `<ModelReply>`).

## context_files

- `sdd-kit-2/AGENTS.md`
- `process/planning/PLAN-2026-09-23-phase-8-transcript-atom-migration.md` (§5.1, §5.3, §7 Sprint 074).
- `web/reveal_component.ts` (`_liveBindingsFor`'s tool-card branch, around lines 380-455; `_liveActivity`).
- `web/reveal.html` (lines 112-133 — current tool-card template).
- `web/vm/session_controller.ts` (`ToolProgress` handler at line 762, `ToolCall`/`ToolResult` handlers at 744, 777).
- `web/reveal/transcript/Row.tsx` and `ModelReply.tsx` (for pattern).

## signal contract

### Emits

None new.

### Consumes

- Every context file above.

### Invariants

- `signals/0.1.json` unmodified.
- Auto-open computed from `toolRunning` alone; `streamingShow` may drive the streaming pane's *visibility* inside the card but does not drive the card's open/closed state.
- Explicit click writes `true` or `false` (not `delete`); the click flips the visibly-open state.
- `<ToolCard>` wrapped in `React.memo`; its click handler comes from `useCallback` with a dependency on the current `open` value.
- Streaming re-renders touch `<ProgressStream>` and no sibling `<ToolCard>`. Verified under a temporary `?trace-renders=1` counter (removed at sprint close).

## artifact contract

### Files created

- `web/reveal/transcript/ToolCard.tsx`
- `web/reveal/transcript/ProgressStream.tsx`

### Files modified

- `web/reveal/transcript/Row.tsx` — dispatch `TranscriptRole.Tool` rows to `<ToolCard>` (replacing the one-line header stub from Sprint 072).

### Content assertions

- `ToolCard.tsx` exports `React.memo(function ToolCard(...))`.
- `ToolCard.tsx` declares `const [openLocal, setOpenLocal] = React.useState<boolean | undefined>(undefined)` and resolves visible open as `openLocal ?? toolRunning`.
- `ToolCard.tsx`'s click handler is bound via `React.useCallback` and writes `!visiblyOpen` (never `undefined`).
- `ProgressStream.tsx` reads `snapshot.progressByCallId[callId]` and renders a `<div>` with `background:#1a1c20;border-radius:5px;padding:8px 12px;max-height:220px;overflow:auto;color:#7fb3b8;white-space:pre-wrap`.
- The card body div carries `data-tool-card-body="1"` for the caret-pin harness in Sprint 075.

### Command exit codes

- `npm run typecheck` returns 0.
- `npm run lint` returns 0.
- `npm run build` returns 0.
- `npm run smoke:vm` returns 0.
- `npx tsx web/vm/tools/check-vocabulary-parity.ts` returns 0.
- `npm run pixel:diff` returns 0 for the `multi_tool`, `error`, and `descended` states, both viewports, with the flag ON.

## observation contract

### UI driving steps

- Load `?atom-transcript=1`. Open a real-driver session.
- Prompt: "Call bash with `echo hi`, then wait for the result."
- Prompt: "Delegate a child to compute 2+2."

### Expected log substrings

- No `[React] Warning` lines.
- No re-render count for a sibling `<ToolCard>` during another card's streaming (`?trace-renders=1` counter reports zero sibling renders per progress envelope).

### Expected runtime signals

- `SESSION_OPEN_ACKED`, `TURN_SUBMITTED`, `TURN_ACK`, `STREAM_ENVELOPE_APPENDED` (many, for `ToolProgress`), `TURN_PARKED`. No new tags.

### Expected screenshot / visual state

- `multi_tool` state: three tool cards each showing the caret (▸ closed by default post-`ToolResult`), tool name in `#9aa0a8`, preview in `#b9bec5`, status in the appropriate colour. Pixel diff clean.
- `descended` state: the delegate row shows the `· descend ⏎` affordance in `#a08fc9`. Pixel diff clean.
- Clicking the first card's caret opens its body (data-tool-card-body div renders); scrolling and header y are outside this sprint's assertions (Sprint 075 owns them).

## done criteria

Tool cards render through the React tree. Click a caret, the card opens; click again, the card closes; explicit state overrides auto-open. Streaming a bash tool re-renders only its own `<ProgressStream>`.

## notes

Auto-open on `toolRunning` alone is a behaviour change from today's dc-runtime path (which uses `toolRunning || streamingShow`). Verified fine tonight through the `TOOL_CARD_TOGGLED` probe and reverted along with the rest of the caret work; the fix ships here as part of Phase 8 with pixel-baseline coverage rather than as a standalone patch.

The `data-tool-card-body` attribute is added here so Sprint 075's caret-pin harness can select it without adding a second migration.
