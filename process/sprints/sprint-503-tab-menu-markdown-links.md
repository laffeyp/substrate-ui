# Sprint 503 — A tab's menu; Markdown rendered; ⌘-click opens a link

```yaml
---
id: 503
status: closed
phase: editor features (roadmap 2026-11-14 r4, E5)
pass_kind: functional
---
```

## scope

Right-click on a tab opens its menu: add to message (as now), close, close others (split right and split down join the menu with sprint 504, which builds the splits), and for a Markdown file "show rendered" / "show source". The rendered view draws the file with the transcript's renderer (`web/reveal/markdown.ts`). ⌘-click on a link, in the source or the rendered view: an `http(s)` link opens in the browser (`shell.openExternal` through main, as external links do now), a relative path opens that file in the editor, a `#heading` scrolls to it. One verifiable property: a fixture README's link ⌘-clicked opens the file it names.

## signal contract

Vocabulary proposal at build time: the menu's items through the existing `CONTEXT_MENU_OPENED` (source `tab`); a tag or field for the rendered/source switch and for a link followed (kind only: external, file, heading; E1, no address).

## observation contract

Gate on the bundle with a real Markdown fixture: the menu's items; rendered view screenshot read; each link kind followed. Mutants per path.

## close

**Built.**
- `web/app/derive/md_links.ts`: which link a column falls in, its kind, the workspace path, GitHub heading anchors; 4 unit specs.
- `web/reveal/markdown.ts`: links and images read only with `{ links: true }`; the transcript passes nothing and parses as before (spec).
- `web/app/editor/MarkdownView.tsx`: the rendered view, in the transcript's styles; headings carry anchors, a click follows a link, an image draws as marked alt text.
- `web/app/editor/links.ts`: follows a link. External goes to the browser through main; a file opens at its heading; a heading moves within the file.
- `web/app/editor/Centre.tsx`: the tab menu (add to message, show rendered / show source for Markdown, close, close others); ⌘-click on a link in the code; the rendered view drawn over the code, which keeps the buffer.
- Vocabulary 0.72: `EDITOR_MARKDOWN_SHOWN`, `EDITOR_LINK_FOLLOWED`, `EDITOR_FILE_OPENED.how` link.

**Decided on the grounds.** A Markdown file still opens as source; the menu switches it, as asked "just for now". D49 (a)'s rendered-by-default waits. A link follows on ⌘-click in the code and on a click in the rendered view, as VS Code's editor and preview do. Only `http(s)` addresses go to the browser.

**Found and fixed.**
- **A tab's scroll.** A tab came back with the last file's scroll: the guide reopened 3,198 px down after the runbook. Each tab now keeps its `scrollSnapshot()`, and a new file starts at its top. Mutant fails.
- **Images.** A Markdown image drew as a stray `!` and a link.
- **The split.** `split` took its new pane inside a React state updater, so a replayed updater turned one ⌘D into `PANE_CLOSED 2`, `PANE_OPENED 3`. Seen as `editor_follow_per_pane` failing 4 times in 9 on the old code; fixed, 8 runs of 8 pass. A gate that forces the replay was written and deleted: it passed the old code three times. The exact interleaving is not known; the fix follows React's rule that updaters are pure.

**Gate `editor_markdown_links`** (new; in `gates:electron`). Large real fixtures: the README twice and the runbook round 10, over the multipane workspace. From source and on bundle 1794713162:
- six links followed from each view;
- runbook heading at line 128, licensing at 103, `#install-1` at 161;
- two addresses caught at `openExternal`; the missing file opens nothing;
- 20 headings and 12 links drawn; 943 accent pixels in a link, none in prose;
- trace: `EDITOR_LINK_FOLLOWED` 11 with kinds and outcomes, `EDITOR_MARKDOWN_SHOWN` rendered then source, `EDITOR_FILE_OPENED` how link 2, `NAVIGATION_BLOCKED` external 2; no address or link path in any trace.

Screenshots read: the rendered guide, before the image fix and after.

**Mutants**, each failing with its own message: no ⌘-click handler; links resolved without their folder; the view without links; the tab scroll fix removed. A first ⌘-click mutant "passed" only because it broke the build and the gate ran the old `web/dist`; build exits are now checked.

**Other gates.** `editor_context_menu`'s pin moves to the tab menu's two items. 21 editor and pane gates pass on the bundle; 231 + 1 unit specs and 21 Markdown specs pass.

**Installed** into Substrate: 1794713162 replaced 1794707995; vocabulary 0.72, home_kind default. Substrate Next ran throughout (pid 89496).

**Rubber Duck Pass.** One observation, recorded: no gate yet forces the updater replay that turned one ⌘D into two panes.
