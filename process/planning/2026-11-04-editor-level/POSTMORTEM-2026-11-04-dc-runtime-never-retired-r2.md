# Post-mortem: the shell still runs on dc-runtime (round 2)

*2026-11-04, round 2. Round 1 is beside this file, unchanged. Round 1 called sprint 112 "the plan now in force". It is not a plan. It is a checklist card in a remediation roadmap, and no document designs the port of the shell. This round adds the chain of documents behind the card, what the card lacks, and the state of its findings today.*

## What the app is

The main window is the design prototype, not a React codebase. `web/reveal.html` (563 lines) is a dc-runtime template: HTML with `{{ }}` bindings and `<sc-if>` / `<sc-for>` blocks. `web/reveal_component.ts` (2,576 lines, `@ts-nocheck`) is one `DCLogic` class whose `renderVals()` returns every value the template reads. `web/public/support.js` (1,913 lines) is dc-runtime itself: it turns the template into `React.createElement` calls and evaluates the class with `new Function`. Its third line reads "GENERATED from dc-runtime/src/*.ts — do not edit"; neither repo holds that source (lens audit F343), and its checksum (`dac4ecfc…`) differs from the handoff's copy (`951ae391…`). Only the transcript, `web/reveal/transcript/*.tsx`, is written as React components; `web/reveal.ts` mounts it into empty divs and reaches the dc-runtime component through React's private fiber fields (F334).

## How it is built and shipped

1. `npm run build` runs `tsc --noEmit`, eslint and `vite build`. Vite's `inlineDcScript` plugin compiles `reveal_component.ts` with esbuild and pastes it into `reveal.html`; `includePartials` inlines the two partials; `reveal.ts` and the transcript bundle into `web/dist/assets/reveal-*.js`; `support.js` copies from `web/public/` to `web/dist/`.
2. electron-builder packs `web/dist/**` into `Contents/Resources/app.asar.unpacked/web/dist/` (`electron-builder.config.js:44–58`).
3. At launch, Electron main starts the bundled Python, which runs `server.py`. `server.py` serves `web/dist/` when it exists (`server.py:1969–1974`) on `127.0.0.1:<port>`, and the window loads `/?atom-transcript=1&electron=1` (`electron/main.js:379`).
4. The page fetches React 18.3.1 and ReactDOM from `cdnjs.cloudflare.com`, with no `integrity` hash, before `support.js` runs. No Content-Security-Policy exists. React is not installed in `node_modules`; `package.json` carries only `@types/react ^19.3.0`, a major version ahead of the React that runs. The installed app (`/Applications/Substrate.app`, CFBundleVersion 1793161234) carries the same four script tags and no CSP (F320).

## The documents behind the move off dc-runtime

| Date | Document | What it holds | What it lacks |
|---|---|---|---|
| 2026-08-31 | `design/received/handoff_latest/docs/DESIGN-SPEC-2026-08-31-round4.md`, line 64 | "production lifts it into a typed React codebase" | Any plan for the lift |
| 2026-09-12 | `process/planning/2026-09-10-prototype-port/DIRECTION-2026-09-12.md`; commit `43e95fb` | The decision to point Electron at the prototype and wire real data into it, after a React rewrite (sprints 001–033) and a component-by-component port (Q0–Q2) were abandoned | Any date or condition for leaving dc-runtime |
| 2026-09-23 | `process/planning/2026-09-23-reveal-shell-hardening/AUDIT-2026-09-23-dc-runtime-local-optimum.md` | The diagnosis: one `renderVals()` re-runs on every state change; `sc-for` keys rows by index; there are no component boundaries. Its Path A, moving off dc-runtime, is "the correct long-term posture … a real refactor", to be "scoped as its own epic". | The epic it asks for |
| 2026-09-23 | `process/planning/2026-09-23-reveal-shell-hardening/PLAN-2026-09-23-phase-8-transcript-atom-migration.md` | The method, for the transcript only: pixel baseline (sprint 070), a mount behind a flag (071), the subtree moved piece by piece (072–075), the dc-runtime path retired (076). It lists the surfaces dc-runtime keeps. | Everything outside the transcript |
| 2026-10-08 | `docs/review/REVIEW-2026-10-08-whole-project-findings.md` | The findings: section 5, `support.js` cannot be rebuilt; section 1, fabricated content in the shipped UI | — |
| 2026-10-08 | `process/planning/2026-10-08-lens-audit/ROADMAP-2026-10-08-lens-audit-remediation.md` and its ledger | The decision row "dc-runtime retired" (the Architect: "only if you don't break anything"); item 13 gives the port nine lines; the ledger gives 37 findings, F320–F361 and F471, each cut off at about 200 characters | A design, an order of work, a component layout |
| 2026-10-08 | `process/sprints/sprint-112-retire-dc-runtime.md` | A checklist: the 37 findings and six end checks (baseline gates green, no `@ts-nocheck`, React bundled with a CSP and no `unsafe-eval`, `support.js` gone, no fiber walks, no fixture text, `smoke:packaged` passing) | A plan. It puts the whole shell into one card, against the kit's rule of at most two files and one concept per sprint (`sdd-kit-3/AGENTS.md`, hard rule 6). |

The audit asked for an epic. The roadmap answered with one card. No one wrote the epic.

## What happened

| Date | Event | Record |
|---|---|---|
| 2026-10-08 | Sprints 108–111 of the lens-audit roadmap close; 112 and 113 stay `pending` | the six cards' `status:` lines |
| 2026-10-09 onward | Work turns to defects found in the installed app (U114–U119), then to new roadmaps: harness drivers and the model picker (10-10), before distribution (10-11), slash entry (10-12), language (10-13). Each adds UI to the dc-runtime files. | `BLACKBOARD.md`; `process/planning/README.md` |
| 2026-10-08 to 11-04 | 35 commits touch `reveal_component.ts` or `reveal.html`; the class grows from 2,407 to 2,576 lines | `git log --since=2026-10-08` |
| Between 10-08 and 11-04 | `harness/pixel_baseline.ts` and `harness/pixel_diff.ts`, Phase 8's visual gate, leave the tree | `ls harness/` |
| 2026-11-04 | Eight rounds of research on new views assume they mount inside dc-runtime | `RESEARCH-2026-11-04-editor-level-and-modes*.md` in this folder |

No entry on `BLACKBOARD.md` defers, drops or reschedules sprint 112. The planning index still lists the lens audit as "open: its roadmap has not closed".

## Why

1. **No one wrote the epic.** The audit of 2026-09-23 named the move off dc-runtime a refactor to scope as its own epic. Phase 8 did the transcript. The lens-audit roadmap of 2026-10-08 then folded the rest of the shell into one card of 37 findings, with no design, no order of work, and more than two files.
2. **The card sat last in its roadmap, and the roadmap stopped before it.** Items 1–12 closed on 2026-10-08. The next day's work came from defects found in the installed app, and no step put the card back in line.
3. **The switch went unrecorded.** The kit asks that a put-off item get a `deferred` entry with a condition for coming back to it (`sdd-kit-3/AGENTS.md`, "The BLACKBOARD protocol"). The card got none, so no later session saw it waiting.
4. **Every later UI sprint enlarged what the port has to move.** 169 lines and 35 commits have landed since the findings were written. The Architect's condition, "only if you don't break anything", is measured by gates; the Electron gate list has grown to 45, and the pixel gate Phase 8 used is gone.
5. **This session read past it.** The runbook names `process/planning/2026-10-08-lens-audit/` as an open folder to read in full (`RUNBOOK-2026-10-29-project-r6.md`, "The current direction"). The research rounds were written before that folder was read, so they planned new views on a runtime already scheduled for removal.

## The card's findings today

Checked against the tree on 2026-11-04:

| State | Findings |
|---|---|
| Fixed by later sprints | F332 (`openSession` no longer falls back to `deterministic`), F354 (the "needs a rename endpoint" note is gone; naming shipped in U145) |
| Partly fixed | F328 (fixture text: six hits remain in `reveal.html` and `reveal_component.ts`, among them the export dialog's "01M1684 · fix-race-in-metering · 244 ev") |
| Closes with the finding it resolves | F471 |
| Open | F320, F321, F322, F327, F329, F330, F331, F333, F334, F335, F336, F337, F338, F339, F340, F343, F344, F345, F346, F347, F348, F349, F350, F351, F352, F353, F355, F356, F357, F358, F359, F360, F361 (33 findings) |

## What is missing

The refactor plan the audit asked for: the design of the shell as typed React components, the order of work in sprints of at most two files and one concept, the gates that prove nothing breaks (the 45 Electron gates and a pixel gate to replace Phase 8's), and the 33 open findings placed in that order. The new views from sheet turns 16–17 wait for it, and are built as React components in the window it produces.
