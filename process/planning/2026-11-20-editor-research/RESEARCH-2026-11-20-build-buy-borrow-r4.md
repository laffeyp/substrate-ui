# Build, buy, borrow — seven engineering dilemmas, worked against this project (round 4)

*2026-11-20. This began as "install, lift, or build" for the ⌘⇧E editor and kept hitting the same family of choice. Round 4 widens it into one paper: seven software-engineering dilemmas of that family — five classic, two particular to a cockpit that renders a stochastic agent run — each stated as the general trade, then run against this codebase with file evidence and a call. The editor findings from the earlier rounds survive here as worked instances (superseded drafts in `superseded/`). All CodeMirror and VS Code sources are MIT; lifts are from the repositories, not the shipped Microsoft product. Written during the 2026-11-18 freeze: findings, not a build order. Package versions and the two installed language servers were read from the registry and this machine on 2026-11-20.*

---

## Why these seven

Every choice in the editor research reduced to one question in different clothes: when a thing is already solved outside your codebase, how much of the outside thing do you take, and where do you draw the line. That question has at least five named forms in the field. Two more forms are particular to this project, because Substrate is not an ordinary app: it renders a stochastic agent run from an append-only record of typed events, and that nature forces two trades an ordinary codebase never meets. Each of the seven has a real instance here, so each can be judged, not just recited.

## 1. Build vs. buy — and the under-use trap

**The trade.** Writing a capability yourself buys control and exact fit and adds no transitive weight; adopting a library buys correctness worked out over years and hands maintenance to someone else, at the cost of learning the whole tool and carrying what it drags in. The failure mode specific to "buy" is quieter than bloat: you adopt a rich library for one narrow job, never learn the rest of it, and hand-roll or skip features it already ships. You end up using ten percent of a tool and rebuilding the other ninety beside it.

**In this project.** The editor adopted CodeMirror and used it as if it were a text box. The engine and the grammars were bought correctly — writing either cold is wasted months. But folding, line wrapping, bracket matching, and auto-close brackets ship in packages already installed (`@codemirror/language`, `@codemirror/view`) and are wired nowhere in `web/app/editor`. Completion, diagnostics, and a compare view are three more small MIT packages (`@codemirror/autocomplete`, `lint`, `lsp-client`, `merge`) built on the core already running. The largest miss is language intelligence: an editor that understands the code is those packages plus a language server, and `pyright` and `typescript-language-server` are already installed on this machine. The capability was treated as expensive and left off; it is cheap and was sitting in `node_modules`-adjacent reach the whole time.

**The call.** When you do adopt a rich library, read its whole surface before hand-rolling next to it. The editor's unused CodeMirror capability is the concrete debt; switching it on is the cheapest work in this paper.

## 2. Not-Invented-Here vs. dependency-maximalism

**The trade.** NIH — rebuilding what exists out of distrust or habit — gives control and no supply-chain exposure, and risks reinventing something slower and buggier than the commodity version. Its opposite, pulling a package for every triviality, gives speed and risks bloat, under-use, and a dependency you don't understand failing in a way you can't fix. The judgment is not "more deps" or "fewer"; it is *which* problems are yours to own.

**In this project.** This codebase leans hard to NIH, and mostly earns it. `server.py` (333 KB) runs on the Python standard library — `http.server.BaseHTTPRequestHandler`, not a framework — plus one package (`msgspec`) and the local kernel; the renderer's entire runtime is CodeMirror and React. The pane model, the typed-signal vocabulary, and the agent-following are genuinely novel and rightly hand-built — no library knows about them. But NIH over-reached on commodity problems: the workspace text search is a Python `re` walk re-implementing `.gitignore`, which loses on speed and fidelity to `ripgrep` the moment a workspace is large, and `ripgrep` is exactly what VS Code shells out to.

**The call.** Own the novel core; buy the solved commodity. Text search, grammars, and a diff algorithm are commodities; the agent-following is not.

## 3. Depend vs. vendor

**The trade.** Depending on a package means automatic upstream fixes and upgrades, at the cost of inheriting its API, its release cadence, and the difficulty of patching it. Vendoring — copying the source into your tree — or forking means control and the freedom to freeze or patch, at the cost of owning maintenance and drifting from upstream. The deciding question is whether the unit is self-contained and whether upstream is alive.

**In this project.** The CodeMirror packages are depended on, which is right: upstream is active and the packages are well-scoped. The research also found one place where vendoring beats depending: if live-as-you-type diff is ever wanted, VS Code's `src/vs/base/common/diff/diff.ts` is a self-contained MIT file (plus four small helpers) worth copying, rather than depending on all of Monaco to get it. The MIT license also leaves a cheap fallback for a depended package: vendor-to-patch `@codemirror/commands` if one undo behavior ever needs a local tweak, a far smaller commitment than owning history.

**The call.** Depend on living, well-scoped packages; vendor only a self-contained unit you would otherwise have to adopt a giant to get.

## 4. In-process vs. out-of-process

**The trade.** Doing work in your own process is low-latency, simple to deploy, and shares memory, but ties the work to one runtime and couples lifecycles. Pushing it to a separate process buys isolation, crash containment, and language-agnostic reuse, at the cost of inter-process latency and the complexity of spawning, transport, and lifecycle.

**In this project.** The outline is derived in-process by walking CodeMirror's Lezer tree (`web/app/editor/Centre.tsx`, `outlineOf`) — correct, because it needs no server and runs where the document already lives. Language intelligence is the opposite case and is inherently out-of-process: a language server is a separate program spoken to over stdio. That is not a reason to avoid it. The server runs locally and never contacts anyone, which is exactly what the design allows — the design bars reaching a third-party or external server, not a local one. The strict Content-Security-Policy (`script-src 'self'`, no worker `blob:`) blocks only the in-browser-worker alternative, not a spawned local server over the existing channel.

**The call.** Keep syntactic work in-process where the document lives; reach out-of-process for semantic, cross-file work, and keep that process local.

## 5. Client vs. server — where the computation lives

**The trade.** Running work on the server centralizes it, lets it use native binaries, and keeps it authoritative; running it on the client removes a round-trip, offloads the server, and operates on data already in memory in front of the user. The rule that resolves most cases: put the computation where the data already is, and where the right tool lives.

**In this project.** Three instances, three answers. Quick-open fuzzy matching is on the Python backend today; it belongs on the client, because the workspace file list is a few thousand strings already in memory and a round-trip buys nothing — port VS Code's `fuzzyScorer` weight table into the renderer. Workspace text search belongs on the server, because the right tool is a native binary (`ripgrep`) run over the whole tree. Large files split the work correctly already: the server streams 1,000-line blocks and the client virtualizes the drawing (`web/app/editor/LinesView.tsx`), which is the only one of the three large-file strategies that avoids holding a giant file in RAM.

**The call.** Push computation to the side that already holds the data and the right tool — the client for the in-memory file list, the server for the native search binary.

## 6. The event-sourced typed record vs. the raw stream

**The trade.** A system can hold what it does as an append-only log of typed events and derive every view from that log, or it can pass the raw byte stream through and show it as it arrives. The typed log — event sourcing — lets you present one run many ways, replay it, audit it, and check each event against a schema; the price is that every event must be modeled up front, and anything the schema has no tag for is invisible (the vocabulary gap). The raw stream models nothing and loses nothing, but you can only replay bytes, never reason over them.

**In this project.** This is Substrate's defining bet. The session record is an append-only stream of typed envelopes — `ToolCall`, `ToolResult`, model text, progress — not a PTY byte stream, and every view (the transcript, the editor's follow marks, the meta lens) is a projection of it; the append-only BLACKBOARD is the same shape for the project's own decisions. The payoff is concrete: the tool-output research found that command, output, and control codes arrive already separated as typed fields (`summaryOf`, `shellResult`, `progressByCallId`), which is why showing them as a plain terminal column is a container change, not a data problem — cleaner than a real terminal precisely because the stream was typed first. The cost is equally concrete: the vocabulary must be materialized before the work, and a real event the vocabulary has no tag for is a gap to be proposed and versioned, not silently logged. The `msgspec` under-use — a typed decoder used mostly as an untyped `json.decode` — is a small echo of the same tension inside `server.py`.

**The call.** The typed record is the foundational correct bet for a cockpit that must present one run many ways and replay it. Guard it where it is weakest: the vocabulary gap, closed by proposing and versioning a tag rather than letting an untyped event slip through.

## 7. Deterministic replay vs. the live stochastic run

**The trade.** A system whose essence is a nondeterministic model cannot be tested by running it and reading the result — the result changes every time. The answer is to make the nondeterminism a boundary: record real runs, replay the fixed record to test everything downstream deterministically, and test the stochastic part itself separately and statistically. The trade is reproducibility and a fast, stable check against drift, at the cost of fixtures that can age out of sync with the real thing they stand for.

**In this project.** Substrate renders a stochastic agent run and tests the rendering by replaying fixed records. The shakeout gates drive the window against a deterministic driver and a recorded script; the editor's behavior is checked against records copied from real Claude, Codex, and Cursor sessions as fixtures; the pixel anchor decodes a screenshot back to the record it should be painting and checks the drawn frame against the truth on disk and in `git`. The making of records stays stochastic — a real local model, or the live kernel — while the verification of what the UI does with a record is deterministic. Separating the two is the project's answer to testing a nondeterministic system, and it is the right one.

**The call.** Keep the determinism boundary where it is — stochastic in the making of records, deterministic in the rendering of them — and keep the fixtures honest by refreshing them from real sessions when the record shape changes, so the replay does not drift from the thing it stands for.

## The concrete work these dilemmas name

Ordered by payoff over cost. All wait on the freeze lifting; all are "read their code, write our own" except where a package is named.

1. **Language intelligence** (dilemmas 1, 4) — install `@codemirror/autocomplete`, `lint`, `lsp-client`; run the already-installed `pyright` and `typescript-language-server` locally over stdio. The biggest capability, mostly paid for, and in scope.
2. **The free switches** (dilemma 1) — folding, line wrapping, bracket matching, auto-close brackets; already installed, unwired, near-zero cost.
3. **Workspace search → bundled `ripgrep`** (dilemmas 2, 5) — replace the Python `re` + hand-rolled `.gitignore` walk.
4. **Compare view → `@codemirror/merge`** (dilemma 1) — a real install-and-mount for a feature the roadmap lists as not-drawn-yet.
5. **Breadcrumbs from the outline; quick-open fuzzy match in the renderer; the outline widened** (dilemmas 1, 5) — all from data the editor already computes.
6. **Optional, product-gated** — live-as-you-type diff by vendoring `diff.ts` (dilemma 3); Markdown live preview on decorations; indentation guides and a minimap (third-party `@replit/*`, MIT, maintenance risk); case-preserving replace (exists in no library, build if wanted).

## What was judged correct and stays

The engine (`@codemirror/state` + `view`) and grammars bought; the find match engine (`@codemirror/search`), undo and keymap (`@codemirror/commands`), and vim (`@replit/codemirror-vim`) kept; the diff-vs-main rendering, the large-file pager, the file tree and tabs, nano bindings, the agent-following, save and the stale-write guard, encodings, the selection-to-message chip — all ours, correctly. The file tree and tabs were checked against VS Code's own: both its subsystems are welded to its service layer, and the one liftable widget drags the whole non-React `vs/base` engine, so building them was right.

---

## Sources

- Registry (2026-11-20): `@codemirror/autocomplete` 6.20.4, `lint` 6.9.8, `lsp-client` 6.3.1 (deps include `vscode-languageserver-protocol`), `merge` 6.12.3, `language` 6.13.1, `view` 6.43.15, `commands` 6.11.1 — MIT; `@replit/codemirror-indentation-markers` 6.5.3, `@replit/codemirror-minimap` 0.5.2 — MIT, third-party.
- This machine (2026-11-20): `pyright` 1.1.414, `typescript-language-server` 6.1.0 on PATH; `pylsp` absent.
- CodeMirror reference: codemirror.net/docs/ref/.
- VS Code (`microsoft/vscode`): `src/vs/base/common/diff/diff.ts` and `src/vs/base/common/fuzzyScorer.ts` (the two liftable files); the search, outline, explorer, tabs, and undo sources (read for contrast); `src/vs/workbench/services/search/node/ripgrepTextSearchEngine.ts` (glue around `rg`).
- In-repo: `server.py` (stdlib `http.server` + `msgspec` + local kernel; 16 of 24 `msgspec` uses are untyped `json.decode`/`encode`); `web/app/editor/*` (none of folding, wrapping, bracket matching, close brackets, autocomplete, indentation markers, minimap wired); `web/app/FindBar.tsx`, `web/app/state/find.ts`, `web/reveal/transcript/Transcript.tsx` (hand-rolled find, justified by windowing); `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r20.md` (capability enumeration; the "later / not drawn yet" list). On D53: the roadmap renders it as "language servers out of scope," but the design intent bars third-party/external servers, not local language intelligence — a local server over stdio contacts no third party and is in scope.
