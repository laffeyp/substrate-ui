# Sprint 158 — The stream and graph lens follows the bottom until scrolled up

```yaml
---
id: 158
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
asked: 2026-10-12 (Architect: "the stream and graph view should have the same behavior as the terminal view or the pane view with regard to text. So it should stick to the bottom unless you scroll up")
context_files:
  - web/reveal.html
  - web/reveal_component.ts
  - web/reveal/transcript/ (useScrollAnchor, U102)
---
```

## scope

The panes view's transcript follows the bottom while the user is there, holds the row being read once they scroll up, and resumes at the bottom when they return (`useScrollAnchor`, sprint 102, gate `transcript_follow.ts`). The meta view's stream and graph lens is a dc-runtime list with no such rule. After: it follows the same rule.

## observation contract

Electron gate `stream_follows_bottom.ts` that grows the stream while at the bottom (stays at the bottom), scrolls up and grows it (holds), and returns to the bottom (follows again).

## result

- **Built.** `web/reveal/follow_bottom.ts`: a scroll listener sets following when the view is within `STICK_PX` of the bottom; a MutationObserver and a ResizeObserver put a following view at the bottom. `streamRef` attaches it to the stream's scroller (`data-stream-scroll`). `STICK_PX` moved to `web/reveal/scroll_stick.ts`, React-free, because the `reveal_component` bundle cannot resolve React; `useScrollAnchor` imports and re-exports it.
- **Gate** `stream_follows_bottom.ts` (in `gates:electron`): red on the old code (the stream sat at the top, 219px above the bottom), green after (followed at the bottom; held at 312px when scrolled up; followed again; 1941px of stream in an 844px view). `transcript_follow` passes.
- **Rubber Duck Pass.** No controller tag moved; the gate reads the scroller's geometry.
