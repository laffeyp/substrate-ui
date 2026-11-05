# Post-mortem: the shell still runs on dc-runtime

*2026-11-04. The plan to move the window off the design prototype's runtime was written, approved and never run. This document states what the app is, how it ships, what happened to the plan, and why.*

## What the app is

The main window is the design prototype, not a React codebase. `web/reveal.html` (563 lines) is a dc-runtime template: HTML with `{{ }}` bindings and `<sc-if>` / `<sc-for>` blocks. `web/reveal_component.ts` (2,576 lines, `@ts-nocheck`) is one `DCLogic` class whose `renderVals()` returns every value the template reads. `web/public/support.js` (1,913 lines) is dc-runtime itself: it turns the template into `React.createElement` calls and evaluates the class with `new Function`. Its first line reads "GENERATED from dc-runtime/src/*.ts — do not edit"; neither repo holds that source (lens audit F343), and its checksum (`dac4ecfc…`) differs from the handoff's copy (`951ae391…`). Only the transcript, `web/reveal/transcript/*.tsx`, is written as React components; `web/reveal.ts` mounts it into empty divs and reaches the dc-runtime component through React's private fiber fields (F334).

## How it is built and shipped

1. `npm run build` runs `tsc --noEmit`, eslint and `vite build`. Vite's `inlineDcScript` plugin compiles `reveal_component.ts` with esbuild and pastes it into `reveal.html`; `includePartials` inlines the two partials; `reveal.ts` and the transcript bundle into `web/dist/assets/reveal-*.js`; `support.js` copies from `web/public/` to `web/dist/`.
2. electron-builder packs `web/dist/**` into `Contents/Resources/app.asar.unpacked/web/dist/` (`electron-builder.config.js:44–58`).
3. At launch, Electron main starts the bundled Python, which runs `server.py`. `server.py` serves `web/dist/` when it exists (`server.py:1969–1974`) on `127.0.0.1:<port>`, and the window loads `/?atom-transcript=1&electron=1` (`electron/main.js:379`).
4. The page then fetches React 18.3.1 and ReactDOM from `cdnjs.cloudflare.com`, with no `integrity` hash, before `support.js` runs. No Content-Security-Policy exists. The installed app (`/Applications/Substrate.app`, CFBundleVersion 1793161234) carries the same four script tags and no CSP (F320).

## What happened to the plan

| Date | Event | Record |
|---|---|---|
| 2026-08-31 | The design spec says production lifts the one-file prototype "into a typed React codebase" | `DESIGN-SPEC-2026-08-31-round4.md`, line 64 |
| 2026-09-12 | The port mounts prototype v7 with its runtime and wires real data into it | commit `43e95fb`; `process/planning/2026-09-10-prototype-port/DIRECTION-2026-09-12.md` |
| 2026-09-23 | Five caret fixes fail; the audit names dc-runtime "a local optimum" and moving off it "the correct long-term posture" | `process/planning/2026-09-23-reveal-shell-hardening/AUDIT-2026-09-23-dc-runtime-local-optimum.md` |
| 2026-09-23 to 09-24 | Phase 8 moves the transcript alone to React | sprints 070–076; commit `f2cd28d` |
| 2026-10-08 | The lens audit plans the full move as sprint 112, "Retire dc-runtime", 37 findings; the Architect approves it "only if you don't break anything" | `process/planning/2026-10-08-lens-audit/ROADMAP-2026-10-08-lens-audit-remediation.md`, item 13; `process/sprints/sprint-112-retire-dc-runtime.md` |
| 2026-10-08 | Sprints 108–111 of that roadmap close; 112 and 113 stay `pending` | the six cards' `status:` lines |
| 2026-10-09 onward | Work turns to defects found in the installed app (U114–U119), then to new roadmaps: harness drivers and the model picker (10-10), before distribution (10-11), slash entry (10-12), language (10-13). Each adds UI to the dc-runtime files. | `BLACKBOARD.md`; `process/planning/README.md` |
| 2026-10-08 to 11-04 | 35 commits touch `reveal_component.ts` or `reveal.html`; the class grows from 2,407 to 2,576 lines | `git log --since=2026-10-08` |
| 2026-11-04 | Eight rounds of research on new views assume they mount inside dc-runtime | `RESEARCH-2026-11-04-editor-level-and-modes*.md` in this folder |

No entry on `BLACKBOARD.md` defers, drops or reschedules sprint 112. The planning index still lists the lens audit as "open: its roadmap has not closed".

## Why

1. **Sprint 112 sat last in its roadmap, and the roadmap stopped before it.** Items 1–12 closed on 2026-10-08. The next morning's work came from defects found in the installed app, and no step put 112 back in line.
2. **The switch went unrecorded.** The kit asks that a put-off item get a `deferred` entry with a condition for coming back to it (`sdd-kit-3/AGENTS.md`, "The BLACKBOARD protocol"). Sprint 112 got none, so no later session saw it waiting.
3. **Every later UI sprint enlarged what 112 has to move.** Its 37 findings were written against 2,407 lines; 169 lines and 35 commits have landed since. The Architect's condition, "only if you don't break anything", is measured by gates, and the Electron gate list has grown to 45.
4. **This session read past it.** The runbook names `process/planning/2026-10-08-lens-audit/` as an open folder to read in full (`RUNBOOK-2026-10-29-project-r6.md`, "The current direction"). The research rounds were written before that folder was read, so they planned new views on a runtime already scheduled for removal.

## The plan now in force

Sprint 112, under the lens-audit roadmap of 2026-10-08, is the most recent plan for the window's runtime. Its work: the shell becomes typed TSX with no `@ts-nocheck`; React is bundled; a CSP without `unsafe-eval` and without remote origins is added; `support.js` is deleted; no fiber walks remain; fixture text is removed, and controls are wired where an endpoint exists and removed where none does. Its check: the baseline gates recorded under sprint 108 pass again, the in-scope flows' DOM checks pass, and `npm run smoke:packaged` passes on a fresh bundle. Sprint 113, packaging and vocabulary (7 findings), follows it.

The new views from sheet turns 16–17 wait for sprint 112. They are built as typed React components in the window sprint 112 produces, not as islands inside dc-runtime.
