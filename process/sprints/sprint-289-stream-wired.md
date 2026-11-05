---
id: 289
status: closed
phase: shell-to-react D1.2
pass_kind: functional
---

# Sprint 289 — DCLogic's stream uses the pure functions

## scope

`reveal_component.ts`'s renderVals builds the stream's rows, spans, lane definitions, connectors, cells, side lanes, kind colours and the `app` level's filter from `derive/stream.ts`; about 300 lines of inline helpers and the bare kind comparisons go, and the file's header no longer names helpers it does not have. The template is unchanged.

## artifact contract

- Modified: `web/reveal_component.ts` (no `stripSubstratePrefix`, `envelopeKindColor`, `'TriggerFired'`, `'ProducerStarted'`, `'ProducerCompleted'`; contains `streamRows(`, `streamSpans(`). `npm run build` 0; `npm run test:unit` 0.

## observation contract

`stream_follows_bottom`, `app_view_delegate_lane`, `graph_model_lane_on_resume`, `meta_inspector_io_scene`, `structure_lists_producers`, `find_counts_transcript`, `language_lens_turns`, `delegate_pane`, `run_panes` exit 0; pixels equal `baseline-2026-11-05-b6`.

## result

Closed 2026-11-05. All nine 0; unit 122/122; pixels 28/28, the four meta stream captures included.

## Rubber Duck pass

No signals of its own; `delegate_pane` and `run_panes` show `DELEGATE_CHILD_STARTED` and `RUN_STARTED` as before.
