# Plan — the running app speaks in its vocabulary, on disk, at all times (round 1)

*2026-11-05. Source: the user's direction of 2026-11-05: "the app must emit in a way that an ai can read it at all times"; "this must be sdd"; "the reason that you as a system right now are unable to immediately fix the issue is because this is not correctly instrumented according to signal-driven development. If it was, you would be able to immediately fix this issue based on the emitted signals … This is what we're re-centering to right now. And this is the only goal." Every other piece of work waits until this plan closes.*

## The goal

A person uses the packaged app. Something goes wrong. An agent reads one file and sees, in the app's locked vocabulary, which step the person took, which process acted on it, what it decided and where it failed. The tag names the vocabulary entry; the entry names the emit site; the emit site is the code. No description from the person, no reproduction by the agent, no guess.

This is foundation 01 applied to this app: "the program knows more than the human can say"; "the AI reads signals as primary data … it asks for a better signal if the current one is insufficient."

## What is wrong (2026-11-05)

Two failures the user hit today in the packaged app left nothing to read:

- In a new pane, "choose folder…" then ↵ on a model sent the picker back to the folder column. Reproductions with a stubbed dialog passed; the real run is unexplained.
- A Codex session started in a chosen folder did not open. No session record exists for it (the last Codex session on disk is from 2026-10-11), and `substrate.log` holds no line about it.

Where the app's signals go today:

| Process | What it emits | Where it goes | Readable after the fact |
|---|---|---|---|
| Window | 38 locked tags (v0.5), 54 emit sites in two files: `web/vm/session_controller.ts` and `web/app/App.tsx` | `window.__vmSignals`, an in-memory list (`web/vm/instrumentation/sdd.ts`) | No. It dies with the window |
| Window components | The 20 `.tsx` files in `web/app/` emit nothing; the picker's steps had no tag until an uncommitted draft | — | — |
| Electron main | 9 free-text lines (boot, server spawn, quit) | `substrate.log` | Yes, but not in a vocabulary and not about any user action |
| Server (`server.py`) | No vocabulary; `log_message` is silenced; 8 `print` calls; 133 error-response sites, none logged | `substrate.log` (boot and shutdown lines only) | No |
| Kernel | Each session's run record, typed (`~/.substrate/sessions/<id>/record/`) | Disk | Yes, once a session exists; nothing before it does |

The kernel record is the one surface built the SDD way. Everything before a session exists (the picker, the session open, a refused open, a CLI login) and everything in the window is invisible.

## The pattern that led here

1. **Signals were built for the tests, not the app.** The gates read `window.__vmSignals` inside Playwright runs; `npm run signals` proves that each emitted tag is declared, not that behaviour emits. Every check passed while the shipped app's trace went nowhere.
2. **Code grew without signals.** The move to React (sprints 199–345), the open-view field (346), the widget registry (347), the workspace file routes (348–349) and the kernel append (K340) each added behaviour and no tag. No card asked: if this breaks in the person's hands, what will the agent read?
3. **The kit says so, and was not applied.** `TECHNIQUES.md`, Web class: "Browser-as-runtime requires out-of-process signal capture." `AGENTS.md`, Rubber Duck Pass: the pass works on "the runtime capture if the project ships a JSONL sink … the project should consider adding a signal sink." `TECHNIQUES.md` Section 3 names the JSONL sink as the thing a project wires itself. Every Rubber Duck Pass in this project narrated a test trace, never the app's.
4. **The bug reports were answered with description and reproduction.** On 2026-11-05 the agent read code, guessed, built stub-driven reproductions (two passed and proved nothing), fixed two neighbouring bugs (F361, F362) and reported it could not find the one reported. Foundation 01 names that as the lossy step SDD removes.
5. **Code started before the plan.** On 2026-11-05 the agent began a sink and four picker tags in one move, uncommitted: `web/vm/signals/versions/0.6.json`, `0.6-rationale.md`, `current.json` → 0.6, emits in `web/app/App.tsx`, and a sink in `web/vm/instrumentation/sdd.ts`, `electron/preload.js`, `electron/main.js`. Item 1 decides what of it stays.

## Grounds

- `../sdd-kit-3/foundations/01-signal-driven-development.md` — signals as the AI's primary data; the vocabulary as architecture; categories at architectural boundaries.
- `../sdd-kit-3/foundations/02-sdd-practice.md` — the four components (vocabulary, program, buffer, consumer); speaker's-mouth validation; `format_for_ai`; the chronicle format ("JSON Lines with a vocabulary header"); the vocabulary linter; the initial-conditions problem and `SESSION_INIT`; Stage 3, continuous observation.
- `../sdd-kit-3/grammar/BOOTSTRAP.md` — the Vocabulary Session; its anti-pattern "a project that already has code … runs the session next and retrofits emit calls"; Step 7's runtime grammar ("a mock or fallback path must be able to say it is one"); Step 9's dual-contract audit.
- `../sdd-kit-3/grammar/PRINCIPLES.md` — the eleven layers; commitment 2 (validation at the speaker's mouth) and 5 (strata).
- `../sdd-kit-3/TECHNIQUES.md` — #9 SESSION_INIT; #24 observation contract; #38 fixtures from captures; #51 always-emit summary plus paired incident; Web class, out-of-process capture.
- `../sdd-kit-3/ADDENDUMS.md` — A4 (fix the observer's races, verify the verifier), B3 (assert name, value and path), B.C1 (find a run by its unique tag), C1 (scoped capture for a small read), C4 (a `BUILD_ID` boot signal so a stale build cannot pass as a wrong change).

## Rules for this plan

- This is the only work until the plan closes. The editor shared work (`2026-11-05-editor-shared-work/`) waits.
- Instrumentation adds emits; it changes no behaviour, text or layout. A bug the new signals reveal is logged and fixed as its own named change.
- Every tag goes through the vocabulary's proposal and version step (hard rule 2); none is added inline.
- An item closes when its behaviour emits in the packaged app and the agent has read it from the file on disk, not from a test's in-memory buffer.

## Items, in order

| # | What | Closes when |
|---|---|---|
| 1 | **The Vocabulary Session for the whole app**, per `grammar/BOOTSTRAP.md` Steps 0–12, run on the app as built: the window (every component and every user action in it, the picker, the key routing), Electron main (boot, server spawn, windows, dialogs, menu commands), the server (every route, every refusal with its cause, the session open, CLI driver status and login) and the hand-off into the kernel record. Categories at those boundaries. The uncommitted v0.6 draft is input to it, not a result. | A vocabulary version with its rationale doc and sign-off; the dual-contract audit table covers every user action listed from the code; open gaps are typed proposals. |
| 2 | **One trace on disk.** An append-only JSON Lines file per app boot in the logs folder (`~/Library/Logs/Substrate/`, or `Substrate Dev/` in source mode). The first line is the boot's initial conditions: build id and time, app and kernel commits, vocabulary version, `SUBSTRATE_HOME` (C4, #9). Every process writes the same record shape: the window through the preload bridge, main directly, the server directly. Size and count are bounded. | Each process's lines appear in one file, in order, while the app runs. |
| 3 | **Validation at the speaker's mouth in every process.** The window's emitter already refuses unknown tags and missing fields; main and the server get the same check against the same vocabulary file. `npm run signals` grows into the linter foundation 02 names: every emit site in `web/`, `electron/` and `server.py` is declared, and every declared tag has an emit site. | The linter fails on a planted undeclared emit in each process. |
| 4 | **The emits**, sprint by sprint, one area per sprint (≤2 files, hard rule 6): the picker and pane binding; the session open and its refusals (server and window); CLI drivers, their status and login; key routing (which action a key took); the remaining window components; main's dialogs and menus. Each sprint's observation contract drives the packaged app and reads the file. | Every row of item 1's audit table fires in a recorded run of the packaged app. |
| 5 | **A reader.** One command an agent runs at any time: the current boot's trace, filtered by category, pane or session, in foundation 02's `format_for_ai` shape. | The agent answers "what did the last session open do" from its output alone. |
| 6 | **The gates read the file.** The observation contracts of the gates that drive the app read the on-disk trace and assert tag, payload and order (B3), not `window.__vmSignals`. One planted fault per gate. | Gates pass on the trace; each planted fault fails its gate. |
| 7 | **The rule, in the working agreement.** A sprint that adds or changes behaviour does not close until that behaviour's tags fire in the packaged app's trace; its Rubber Duck Pass narrates that trace. | `WORKING_AGREEMENT.md` carries the rule; a `user` or `agent-resolved` entry records it. |
| 8 | **The two failures, read.** The user repeats "choose folder…" then ↵ on a model, and the Codex start in a chosen folder, in the packaged app. The agent reads the trace and names the step, the tag and the code path for each. | Both causes named from the trace alone; each fixed as its own change. |

## Done

The plan closes when item 8 closes: the two failures that started it are diagnosed from the trace, with no reproduction and no description, and the working agreement makes the trace a condition of every later sprint.
