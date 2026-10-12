# Sprint 141 — One input bar, and text entry that works

```yaml
---
id: 141
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 8)
asked: 2026-10-11 (Architect)
---
```

## scope

**Found.** The input bar a user sees as one thing is two. The panes view draws an `<input>` per pane (`web/reveal.html:99`, handler `onPromptKey` at `web/reveal_component.ts:1403`). The meta view draws a separate `<textarea>` (`web/reveal.html:224`, a second `onPromptKey` at `:2486`). Both edit the pane's draft (`pv`), so text carries across views, but the keys differ: ⇧↵ makes a new line in meta and does nothing in panes.

**One bar.** The meta view uses the panes view's input bar, the most tested of the two: the same markup, bound to the focused pane's own handlers. The meta view's textarea and its handlers go.

**Text entry**, in that one bar:

| Behaviour | Panes `<input>` | Meta `<textarea>` | After |
|---|---|---|---|
| ⇧↵ makes a new line | no | yes | yes |
| A pasted multi-line text keeps its lines | no (flattened) | yes | yes |
| The bar grows with the text | no | yes, without limit | yes, to a limit, then scrolls |
| ↵ while an input method is composing (Japanese, Chinese) | sends half-typed text | sends half-typed text | finishes the composition |
| ↑ / ↓ recall earlier messages of this pane | no | no | ↑ on the first line, ↓ on the last |
| ↵ sends; an empty bar sends nothing; the bar clears and shrinks after a send | yes | yes | yes |

The hint is the panes view's, with one word changed (Architect): "type to input · / for commands · ↵ to send". Nothing of the meta view's bar remains, its hint included.

## checks

- A gate in both views: ⇧↵ makes a new line; ↵ sends the two-line message whole; a pasted three-line text keeps three lines; the bar grows and stops growing; ↑ recalls the last message; ↓ returns to the draft; in meta and in panes the bar is the same element with the same hint, "type to input · / for commands · ↵ to send".
- `tsc` clean; unit specs; the Electron gates.

## result

- **One bar.** `web/reveal.html`: the panes view's bar is the only bar. The meta view draws the same markup bound to the focused pane's row (`fpRow`), slash menu included; the meta view had none. The meta `<textarea>`, `promptRef`, its `onPrompt` and `onPromptKey`, and its own router rows are gone from `reveal_component.ts`. Both sites carry `data-input-bar`.
- **Text entry.** The bar is a `<textarea>` sized by CSS `field-sizing: content`, up to 40% of the window, then scrolling. One handler, `_barKey`: ↵ sends; ⇧↵ (and ⌥↵) make a new line; ↵ during input-method composition does nothing (React's event keeps `isComposing` on `nativeEvent`, which the first try missed); ↑ on the first line and ↓ on the last walk the pane's sent messages and return to the draft. Typing leaves the recall.
- **Hint.** "type to input · / for commands · ↵ to send" (Architect: the panes view's, with "talk" changed to "input").
- **Gate** `input_bar.ts` (in `gates:electron`): in both views, ⇧↵, the two-line send, a three-line paste, the height limit, ↑/↓ recall and the composition guard; both views draw the same element with that hint. On the old code it fails at ⇧↵ in the panes view. Five gates find the bar by `data-input-bar`, not by its hint.
- **Found.** `resume_ended_session.ts` runs the packaged app (`dist-electron/…/Substrate.app`), not the source, unless told otherwise; "gates pass on the source build" has meant the latest package for this one gate. The package was rebuilt before the final run. The third input at `reveal.html:157` ("type to talk · ↵ to send") sits in a branch no gate reached; left as it is.
- **Checks.** `tsc` clean; unit specs 37/37; Electron gates 15/15, on a package built from this source.
