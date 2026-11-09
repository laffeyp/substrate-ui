# Sprint 385 — every user action has a tag (thirteen tags, vocabulary v0.24, P-0.24-ACTIONS)

```yaml
---
id: 385
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan r4 item 11. These actions changed what the window shows, and wrote nothing:

- meta's direction, level and lit seq;
- the language lens's stream, view and lane;
- find's open, query, scope and close;
- the top bar's model and workspace cards;
- a tool card's open and close;
- the fold toggle.

Each setter now writes its tag when its value changes: `web/app/state/meta.ts`, `language.ts`, `find.ts`, App's `noteCards`, `ToolCard.onDetailsToggle`, `tool_output_mode.ts`.

- **Pane:** the lenses take their pane from MetaView (`paneId` prop).
- **Find query:** written as its length (E1).
- **Tool card:** a card is written only when a click makes the element differ from its state, so the fold toggle's own opens write nothing.
- **Fold toggle:** written each time it is applied.

## context_files

- `web/app/state/meta.ts`, `language.ts`, `find.ts`
- `web/app/MetaView.tsx`, `StreamLens.tsx`, `SideGraph.tsx`, `LanguageLens.tsx`, `App.tsx`
- `web/reveal/transcript/ToolCard.tsx`, `Row.tsx`; `web/vm/tool_output_mode.ts`, `session_controller.ts` (`/fold`, `/unfold`)
- `web/app/keymap.ts`, `web/app/derive/language_keys.ts`

## signal contract

### Emits

STREAM_DIRECTION_SET, STREAM_LEVEL_SET, SEQ_SELECTED, LANGUAGE_STREAM_SET, LANGUAGE_VIEW_SET, LANGUAGE_LANE_SET, FIND_OPENED, FIND_CLOSED, FIND_QUERY_CHANGED, FIND_SCOPE_SET, TOP_BAR_CARD_SET, TOOL_CARD_TOGGLED, TOOL_OUTPUT_MODE_SET.

### Invariants

- **Once per change:** each tag is written once per change of its value; a set to the value shown writes none.
- **Pane context:** every pane tag carries its pane's context.
- **No query text:** the find query's text is never written.

## artifact contract

- **Files created:** `harness/shakeout/action_signals.ts`.
- **Files modified:**
  - the files in `context_files`;
  - `harness/shakeout/language_bar_line.ts` (`language_open`);
  - `web/app/__tests__/meta.spec.ts`, `web/reveal/__tests__/tool_output_mode.spec.ts`;
  - `package.json`.
- **Command exit codes:** `tsc` 0; build 0; unit 0; signals 0.

## observation contract

`harness/shakeout/action_signals.ts`, run from source and packaged. It reads window-1.jsonl after the close, step by step by record number.

After two deterministic turns, the gate drives:

1. **Find:** ⌘F, "ab", Escape, ⌘F, ⌘F.
2. **Cards:** the model chip, the workspace chip, Escape, the model chip, a click outside.
3. **Meta's stream lens:** → side, a side-graph segment twice, ⇅ down, app, all, all, a stream row.
4. **The language lens:** `/language`, each stream tab, a view, a row, then ↓ ↑ → ←.
5. **A recorded session's tool card** (`write_session_shapes.py`): its summary twice, then ⌘E, `/fold`, `/unfold`.
6. **Picked:** the model chip, then ⌘D and ↵ ↵ in pane 2's picker.

Each step's records must equal the expected sequence. `language_bar_line.ts` checks SEQ_SELECTED `language_open` at the planted shift's turn.

**Plants:**
- with FIND_QUERY_CHANGED's emit removed, the gate fails;
- writing a tool card on every toggle event also fails it.

## done criteria

Every value of every new enum is reached by a user's action in the running app and written once.

## result

- **Gates:** `action_signals` 0 from source; `language_bar_line` 0, with SEQ_SELECTED `language_open` at seq 22.
- **Plants:** each fails its check (find; TOOL_CARD_TOGGLED for the clicks only).
- **Rubber Duck Pass**, on window-1.jsonl:

  | Step | Records, in order |
  |---|---|
  | Find | FIND_OPENED transcript; FIND_QUERY_CHANGED 1, 2; FIND_CLOSED escape; FIND_OPENED; FIND_CLOSED toggle |
  | Cards | model open click; model closed other_card; workspace open click; workspace closed escape; model open; model closed outside |
  | Stream lens | side; seq 0 side_graph; null; down; app; all; seq 0 stream_row; FIND_SCOPE_SET stream |
  | Language lens | user, relation, model; ribbons; seq 22 language_row; 40 and 22 language_key; lanes 1, 0 |
  | Tool card | open false, then true, at seq 6 |
  | Fold toggle | expanded key; collapsed slash; expanded slash |
  | Picked | model open click; model closed picked |

  Observations:
  - **Recorded:** a card hidden because focus moved to another pane is still open in its pane's state and writes nothing. The tag's note says so.
  - **Resolved-here:** my first note for `picked` named the wrong path; it was rewritten from the trace.
