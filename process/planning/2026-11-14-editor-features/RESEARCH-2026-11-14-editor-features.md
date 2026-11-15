# Research — the editor's missing features (round 1)

*2026-11-14. The Architect, 2026-11-14: "it's just not fully featured. We need to go through and say, like, what don't we have?" Read from the code; each item names where it lives today.*

## Found in use: two panes share one editor's tabs (a bug)

`web/app/state/editor.ts` keeps one store per window (`KEY = "__substrateEditor"`, "One instance per window"). Every pane's `EditorView` (`App.tsx` line 1276, keyed by pane) reads and writes the same `tabs`, `active`, `unsaved`, `recent`, `find` and `search`. Buffers are already per session (`Centre.tsx` `bufferKey(sessionId, rel)`), tabs are not. So a second pane's editor shows the first pane's tab names, and their files do not open: they are paths in the other session's workspace. Fix: the store keyed by pane.

## Missing

| Item | Today | Source of the ask |
|---|---|---|
| ⌘-click a link in Markdown opens it | No link handling in `editor/` | Architect 2026-11-14 |
| Markdown rendered view | Markdown shows as source only. The transcript already renders Markdown (`web/reveal/markdown.ts`, `ModelReply.tsx`). D49 (a) asks for rendered by default; the Architect asks for it from the tab's menu "just for now" | Architect 2026-11-14; D49 (a) |
| A tab's menu | Right-click on a tab offers only "add to message" (`Centre.tsx` line 343) | Architect 2026-11-14 |
| Splitting the editor | ⌘D and ⌘⇧D are refused, `EDITOR_KEY_REFUSED` `no_split` (code-editor roadmap E1, from D49 (c), "no splitting inside the editor level") | Architect 2026-11-14 supersedes D49 (c): ⌘D split right, ⌘⇧D split down, from the tab's menu too; a new split opens empty; tabs drag across; up to 3 × 3 groups |
| Tool output formatted | `ToolCard.tsx`: output is one grey `pre-wrap` block | Architect 2026-11-14 |
| Tool summary longer | `ToolCard.tsx` summary is one line, `nowrap`, cut with an ellipsis | Architect 2026-11-14: two or three lines |

## Prior art for splits

VS Code: ⌘\ splits the editor right; each group has its own tabs; a tab dragged to another group moves there; groups form a grid. Ghostty and iTerm2 use ⌘D right and ⌘⇧D down, the keys asked for. Substrate's panes already use ⌘D/⌘⇧D outside the editor, so inside the editor the keys split the editor, as the editor's other keys shadow the app's.

## Formatting tool output

A tool result is a whole string when it lands, not a stream, so the editor's parsers (`@codemirror/language-data`) can highlight it: by the file a read or write names (its extension), as shell output for `bash`, with ANSI colours kept (`ansi.ts`). This is not the "code colours in replies" research program on the Later list, which concerns streamed Markdown in replies.

## Stays on the backlog

Change marks as a mode, the tree's dot, the search's long-line hang, the frames' parts not built, the retired large-file views, images to models: none is in this ask.
