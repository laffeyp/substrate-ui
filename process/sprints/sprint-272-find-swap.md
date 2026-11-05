---
id: 272
status: closed
phase: shell-to-react C3.3b
pass_kind: functional
---

# Sprint 272 — the find bar swaps in

## scope

`reveal.html`'s two find blocks become mount divs (the meta block's hidden click span went with it). `reveal_component.ts` drops `findOpen`, `findQ`, `findScope` and the bar's fields; ⌘F, Escape and the two key guards use the store; a click on the transcript or the stream sets the scope there; the stream's rows dim by the store's query, and the component redraws when it changes; after each render it writes the stream's match count.

## artifact contract

- Modified: `web/reveal.html` (no `findOpen`, `findCount`), `web/reveal_component.ts` (no `findOpen`, `findQ`, `findScope`). `npm run build` 0; `npm run test:unit` 0.

## observation contract

`find_counts_transcript`, `escape_order`, `stream_follows_bottom`, `records_keys`, `input_bar`, `transcript_follow` exit 0; pixels equal `baseline-2026-11-05-b6`.

## result

Closed 2026-11-05. All six 0; unit 0; pixels 28/28.

## Rubber Duck pass

No signals. Observation: no gate covered find's stream scope; sprint 273 adds it.
