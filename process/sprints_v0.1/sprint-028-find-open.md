# Sprint 028 — find open + query

---
id: 028
epic: H — Find
status: closed
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § find FIND_OPENED/CLOSED + FIND_QUERY_CHANGED; Layer 4 100ms debounce
prerequisites: 027 closed
---

## scope

⌘F opens the find bar scoped to the pane's focused side (transcript OR stream per Sprint 019). Typing fires FIND_QUERY_CHANGED debounced 100ms with `q_length` (privacy — no raw q). Esc closes.

## signal contract

### Emits

- `FIND_OPENED` (`{pane_id, scope: "transcript"|"stream"}`)
- `FIND_SCOPE_CHANGED` (`{pane_id, from_scope, to_scope}`) — fires when the user re-scopes the open find bar (Tab flips the reveal focus AND the find bar's scope inherits it)
- `FIND_QUERY_CHANGED` (`{pane_id, q_length: int, match_count: int}`) — debounced 100ms; `match_count` carries the current hit count for the query (folds Sprint 029's step-tag into this cadence)
- `FIND_CLOSED` (`{pane_id, scope}`)

### Consumes

None.

## artifact contract

### Files

- `src/render/FindBar.tsx`
- `src/state/FindState.ts` — per-pane
- `tests/harness/e2e_find_open.js`

### Content assertions

- Raw q string never appears in JSONL (grep proof)

### Command exit codes

- `node tests/harness/e2e_find_open.js` returns 0

## observation contract

### Driving steps

1. Open reveal (Tab to stream); ⌘F; assert FIND_OPENED{scope:"stream"}
2. Type "hello"; assert one FIND_QUERY_CHANGED{q_length:5} post-debounce
3. Esc; FIND_CLOSED

### Three-channel agreement

- Structural: `[data-testid="find-bar"]` present when open
- Perceptual: `anchor-pane-<id>-find` byte encodes scope + open (0 closed, 128 transcript, 255 stream)
- Log ↔ signal: OPEN/CLOSE symmetric; q absent

## done criteria

Find opens, queries, closes; privacy holds. Sprint 029 (step matches) dispatches next.
