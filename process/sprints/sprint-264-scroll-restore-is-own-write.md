---
id: 264
status: closed
phase: shell-to-react C1 fix
pass_kind: functional
---

# Sprint 264 — the transcript's scroll restore is the hook's own write

## scope

`useScrollAnchor`'s `attachTo` restored the saved place, or the bottom, by assigning `scrollTop` directly, and the ResizeObserver's shown-again branch did the same. Their scroll events then read as the user's (`onScroll` skips only values `write` recorded). A probe on 2026-11-05 logged the switch back to the terminal view: the restore wrote 1160 (the bottom of a 454px scroller); the input bar, now a React root, mounted under the transcript and the scroller became 414px; the restore's scroll event measured 40px from the bottom, past `STICK_PX`, and following stopped, so the next turn was not followed. The template had drawn the bar in the same commit as the transcript's host, so no layout moved between the write and its event. Both assignments go through `write`.

## artifact contract

- Modified: `web/reveal/transcript/useScrollAnchor.ts` (no `scroller.scrollTop = saved.scrollTop`, `scroller.scrollTop = scroller.scrollHeight`, `scroller.scrollTop = back.scrollTop`). `npm run build` 0.

## observation contract

`transcript_follow` exits 0, three runs in a row; `tool_output_toggle`, `both_session_shapes`, `stream_follows_bottom`, `session_start_line`, `input_bar` 0; pixels equal `baseline-2026-11-05-b6`.

## result

Closed 2026-11-05. `transcript_follow` 0 ×3 (7 of 7 checks each); the five gates 0; unit 105/105; pixels 28/28.

## Rubber Duck pass

No signals. Observation: timing surprise (above), resolved here.
