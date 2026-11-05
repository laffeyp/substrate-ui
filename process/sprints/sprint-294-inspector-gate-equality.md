---
id: 294
status: closed
phase: shell-to-react D2.5
pass_kind: functional
---

# Sprint 294 — the inspector gate checks equality

## scope

`harness/shakeout/meta_inspector_io_scene.ts` (plan row A10): the inspector's payload must equal the UserMessage record's payload, field for field and in order; before, the gate held each of the record's fields and listed the fields the stream added.

## artifact contract

- Modified: `harness/shakeout/meta_inspector_io_scene.ts`.

## observation contract

The gate exits 0 on the lens; with `inspectorView` planted to show the merged payload, it exits 1 naming the payload.

## result

Closed 2026-11-05. Planted: exit 1, `inspector payload { … "kind": "first_message", "instance": "…" }; the envelope's {"assembled_prompt":"","slash_source":"daemon","text":"hello","turn_index":0}`. Fault removed: exit 0.

## Rubber Duck pass

No signals.
