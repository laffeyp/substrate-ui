# Research — integrating VS Code into the editor (round 1)

*2026-11-20. One question: can VS Code's open-source internals be put inside the editor you open with ⌘⇧E — skinned to the Substrate design, opening as a view of a pane, watching the agent edit a file — and does that buy more editing power for free, or does it drag in the whole IDE. Judged on its own terms. Written during the 2026-11-18 freeze; research, not a build.*

---

## The answer

No, not on the terms you set. "Get the functionality literally for free" is the bar, and nothing here clears it.

"VS Code" names three things, and only two are yours to take. The one that embeds — Monaco, the editing surface — gives you a better editor and real language intelligence, but it hands you no file tree, no agent-following, no pane wiring, and it fights this app's security policy on the way in. The one that would give you the tree and the panels — the VS Code workbench — is the whole IDE shell; it comes as VS Code's layout, not yours, and it is a second application, not a view of a Substrate pane. The thing you would reach into VS Code *for* — the editor that understands the code — can be added to the editor you already have without taking on either.

## What "VS Code" is: three layers, three licenses

The question "it's open source, can we skin it" has to split the word first, because the three layers carry three different licenses and three different footprints.

- **Monaco** — the text-editing surface, generated from VS Code's own sources and published as a browser library. MIT. This is the part that embeds in a web app. It is an editor widget: text, selections, syntax colour, a diff view, and — its real prize — the TypeScript, JSON, CSS and HTML language services VS Code ships, the ones that give IntelliSense. It has no file tree, no activity bar, no panels, no command palette, and it runs no VS Code extensions. ([monaco-editor FAQ](https://github.com/microsoft/monaco-editor); [techinterview tradeoffs](https://www.techinterview.org/post/3233475355/build-code-editor-codemirror-monaco-tradeoffs/))
- **Code-OSS** — the workbench: the IDE shell around the editor, the activity bar and side bar and panels and editor groups. MIT, in the `microsoft/vscode` repository. ([Code-OSS differences](https://github.com/microsoft/vscode/wiki/Differences-between-the-repository-and-Visual-Studio-Code))
- **The shipped product and its Marketplace** — the thing a person downloads from Microsoft, and the extension store behind it. A Microsoft proprietary license, not MIT, and the Marketplace Terms of Use restrict it to Microsoft's own products. A reskin cannot pull extensions from it; forks use Open VSX instead, a smaller registry. ([VS Code license](https://code.visualstudio.com/license); [Marketplace restriction summary](https://github.com/microsoft/vscode/issues/31168))

So "skin VS Code, the app" is not on offer at all. What is on offer is Monaco the widget, or the Code-OSS workbench, assembled yourself. The two are very different bargains, so take them one at a time.

## Path one — Monaco the widget

Drop Monaco into the centre of the editor in place of the present editing surface. This is the lightest reading of "use VS Code."

What it gives that the current surface does not: VS Code's editing behaviour at full strength — the multi-cursor model, the side-by-side diff editor — and, the one thing no other editor core ships in the box, VS Code's language services, so TypeScript and JSON and CSS get completion, hovers, and go-to-definition without a language server of your own.

What it does not give, and this is the crux: everything the ⌘⇧E editor exists to do. Monaco is a text box. The file tree, the quick-open, the inspector, the save-before-send, the per-pane buffers that outlive a view switch, the line-pager that opens a million-line file a thousand rows at a time — none of that is in Monaco. Most of all, the agent-following is not: the lines an edit-in-flight will replace, edged in the accent and scrolled into view, confirmed or withdrawn when the tool result lands, the view never leaving the file the person is reading. That machinery — the reason someone sits back and watches the model work — is built on the editor core's decoration API. You would rebuild every line of it on Monaco's decoration API. Monaco gives you the surface; the Substrate integration is yours to write either way.

Three costs come attached, and they are the opposite of free:

- **The security policy.** The window runs under a strict Content-Security-Policy — `default-src 'self'; script-src 'self'; style-src 'self'`, set in `web/reveal.html` and enforced by `webSecurity: true` in `electron/main.ts` — with no `unsafe-inline`, no `blob:`. The present editor mounts in a shadow root for exactly this reason: its style loader writes `<style>` tags the policy refuses, and constructable stylesheets inside a shadow root slip under it. Monaco injects its styles dynamically too, and runs its language services in web workers; the workers want `worker-src blob:` and the styles want a nonce or `unsafe-inline`. Monaco's heavier service layer is harder to seal inside a shadow root than a single editor widget is — the workbench bridge for it carries documented shadow-DOM limits. Letting Monaco in means loosening the policy that currently holds, or fighting to isolate it. ([monaco-languageclient v10](https://www.typefox.io/blog/monaco-languageclient-v10/))
- **Weight.** Monaco is about 5 MB gzipped — the figure Replit measured and most sources repeat — against a surface that ships only the modules it imports. ([Replit on CodeMirror](https://replit.com/blog/codemirror); [Sourcegraph migration](https://sourcegraph.com/blog/migrating-monaco-codemirror))
- **Version-lock.** The maintained way to get Monaco with VS Code's services, `@codingame/monaco-vscode-api`, pins you to an exact Monaco version, is strict about import order, and has had multi-editor bugs — several editor panes in one window is the shape here. That is standing maintenance, paid every upgrade. ([monaco-vscode-api](https://github.com/CodinGame/monaco-vscode-api); [monaco-languageclient v10](https://www.typefox.io/blog/monaco-languageclient-v10/))

## Path two — the workbench ("skin VS Code")

Take the Code-OSS workbench, through `monaco-vscode-api`'s workbench override or a Theia/openvscode-server build, and you get the file tree, the panels, the command palette, the settings UI — the IDE, for real.

This is the "too much shit." Two reasons, both structural.

First, the design does not sit on top for free. The workbench is VS Code's layout: activity bar, side bar, panels, editor groups, in VS Code's arrangement. You can map its parts onto your own DOM nodes and hide some — a user wired the title bar, side bar, activity bar, editor and status bar into a React layout and commented the panel part out — and you can recolour it with a VS Code theme. But the bones are VS Code's. A genuinely minimal Substrate design, four areas on sheet frame 24a with a terminal docked under the centre, is not a theme over the workbench; it is a different shell. Reaching it means dropping the workbench — back to path one plus a shell of your own. The activity-bar reskins people do with CSS overrides against VS Code's own class names are fragile across versions, which is the maintenance tax again. ([monaco-vscode-api layout demo](https://github.com/CodinGame/monaco-vscode-api/blob/main/demo/src/setup.views.ts))

Second, it is not a view of a Substrate pane. The workbench is an application shell with its own window and layout model. The ⌘⇧E editor opens over the focused pane's session, carries that pane's transcript and activity line and input bar as the bottom panel, and puts the meta machinery in the right column — it is one view of one session, and the prompt is in it. Bending the VS Code workbench to be that fights its model the whole way; the editor you have already is that, because it was built as that.

And the agent-following still is not free. Marking the lines a tool call will hit, confirming or withdrawing at the result, keeping the person's focus where it is — that is not a VS Code feature you inherit by adopting the workbench. You build it on the workbench's decoration and extension API, the same build as on any core. The workbench gives you a tree and a palette; it gives you nothing of the one thing that makes this editor Substrate's.

## What VS Code actually gives for free, and the one real gap

Strip it down. What does VS Code hand you that a plain editor core does not? Two things: a slightly richer editing surface, and language intelligence — IntelliSense, from its bundled services. Everything else the editor does — the pane integration, the agent-follow, the confined file API with its stale-write guard, the huge-file pager, the minimal design — VS Code gives you none of. You build those on whichever core sits underneath. So "features for free" shrinks, on inspection, to one feature: the editor that understands the code.

That one is real, and it is the single thing worth wanting from VS Code. But it does not require the VS Code shell, or Monaco, or the CSP fight. Language intelligence rides on the Language Server Protocol, and LSP attaches to an editor core directly — a language-server client wires the same completions and hovers and diagnostics onto the editor that is already in the window, over a web worker or a socket, with no workbench and no 5 MB. The capability you would take on all of VS Code to get is addable without any of it.

## The verdict

Integrating VS Code is not free on any path. The widget costs a policy you now hold intact, 5 MB, and a version-lock, and still leaves every Substrate-specific part — the tree, the following, the pane wiring — for you to build. The workbench is the maximal-footprint outcome: VS Code's layout where a minimal design should be, a second application where a pane-view should be, and the agent-following still unbuilt. The one capability that would justify the reach, an editor that understands the code, can be added to the editor you have through LSP without taking on VS Code at all. By your own rule — free, or don't do it — don't do it.

---

## Sources

- Monaco: [FAQ / no-extensions](https://github.com/microsoft/monaco-editor); [bundle and tradeoffs](https://www.techinterview.org/post/3233475355/build-code-editor-codemirror-monaco-tradeoffs/); [~5 MB, Replit](https://replit.com/blog/codemirror); [Sourcegraph migration](https://sourcegraph.com/blog/migrating-monaco-codemirror).
- Workbench / services: [monaco-vscode-api](https://github.com/CodinGame/monaco-vscode-api); [parts-to-DOM layout demo](https://github.com/CodinGame/monaco-vscode-api/blob/main/demo/src/setup.views.ts); [monaco-languageclient v10 — version-lock, no extension host, shadow-DOM limits](https://www.typefox.io/blog/monaco-languageclient-v10/).
- Licenses: [VS Code product license](https://code.visualstudio.com/license); [Code-OSS vs product](https://github.com/microsoft/vscode/wiki/Differences-between-the-repository-and-Visual-Studio-Code); [Marketplace restricted to Microsoft products](https://github.com/microsoft/vscode/issues/31168).
- In-repo CSP: `web/reveal.html` (the policy), `electron/main.ts` (`webSecurity: true`), `web/app/editor/Centre.tsx` (the shadow-root reason).
