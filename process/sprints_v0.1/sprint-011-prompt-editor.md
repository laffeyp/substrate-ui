# Sprint 011 — prompt editor

---
id: 011
epic: D — Turn flow
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § prompt PROMPT_CHANGED; Layer 4 (100ms debounce per pane); privacy invariant (Layer 2: text_length, not text)
prerequisites: 010 closed
---

## scope

Bound pane renders the prompt editor. Every keystroke updates local state; the shell fires PROMPT_CHANGED with `text_length` (not the text — privacy invariant) debounced 100ms. Multi-line, monospaced, autoheight per PANE-MECHANICS.

## signal contract

### Emits

- `PROMPT_CHANGED` (`{pane_id, text_length: int}`) — debounced 100ms per pane

### Consumes

None.

## artifact contract

### Files

- `src/render/Prompt.tsx`
- `src/state/PromptState.ts` — per-pane draft; not persisted (F27 warning: fresh pane = empty draft)
- `src/lib/debounce.ts`
- `tests/harness/e2e_prompt_editor.js`

### Content assertions

- Prompt payload carries `text_length` — grep for raw text in JSONL trace across a 20-char type-in returns zero
- Debounce: 20 keystrokes at 30ms intervals produce ≤3 PROMPT_CHANGED emits

### Command exit codes

- `node tests/harness/e2e_prompt_editor.js` returns 0

## observation contract

### Driving steps

1. Focus prompt; type "hello world"; assert one PROMPT_CHANGED post-debounce
2. Wait; type more; assert next PROMPT_CHANGED
3. Grep JSONL for "hello world" — zero matches (privacy)

### Three-channel agreement

- Structural: `<textarea data-testid="prompt">` present in bound pane
- Perceptual: no anchor flip for PROMPT_CHANGED (event-cadence, no state transition)
- Log ↔ signal: PROMPT_CHANGED events count ≤ debounce ratio; text absent

## done criteria

Prompt renders, debounces, respects privacy. Sprint 012 (submit round-trip) dispatches next.
