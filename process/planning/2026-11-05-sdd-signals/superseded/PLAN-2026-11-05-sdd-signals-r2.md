# Plan — make substrate-ui an SDD app: the whole running program speaks its vocabulary (round 2)

*2026-11-05. Supersedes `superseded/PLAN-2026-11-05-sdd-signals.md` (round 1), which put particular failures at its centre. Source: the user's direction of 2026-11-05: "It must be fully instrumented. The vocabulary must be correct. It must be SDD." "Doing the actual work fixes every other specific error. We start with the general complete fix by making this thing actually SDD." "That is the only way that you will be able to understand what this running program is doing and then linking it back to the code." This is the only work until the plan closes.*

## The goal

The running app, in every process, emits typed signals from a locked vocabulary, validated where they are spoken, written to disk as they happen, and readable by an agent at any moment. Each tag names an event the vocabulary defines; each emit site is the code that decided it. An agent reading the trace can say what the program did and find the line that did it, without a description from the person and without a reproduction.

The particular failures of 2026-11-05 (the picker returning to the folder column, a Codex start that opened nothing, a message answered but not shown, three sessions opened in five seconds) are not items in this plan. They are what the finished plan makes obvious.

## Where the app stands (2026-11-05)

| Process | Signals today | Where they go |
|---|---|---|
| Window | 38 locked tags (v0.5), 54 emit sites in `web/vm/session_controller.ts` and `web/app/App.tsx`; the 20 components in `web/app/` emit nothing | `window.__vmSignals`, in memory, lost when the window closes |
| Electron main | 9 free-text lines | `substrate.log` |
| Server (`server.py`) | none; its request log is silenced; 133 error-response sites, none emitted | — |
| Kernel | each session's typed run record | `~/.substrate/sessions/<id>/record/` |

Uncommitted in the tree, started before any plan: a v0.6 draft (four picker tags), picker emits in `App.tsx`, a disk sink across `sdd.ts`, `preload.js`, `main.js`. Item 1 decides what of it stays.

## Red team of round 1 against the kit

| Kit rule | Round 1 | Round 2 |
|---|---|---|
| The goal is the discipline (foundations 01–03; hard rule 12) | Centred on two failures; its last item was "the two failures, read" | The goal is the instrumented app; failures are examples only |
| Vocabulary Session inputs (BOOTSTRAP Inputs, Step 0) | Named none | Product spec, technical spec (the code), design canon (`../design/received/handoff 5/`), postmortems in `process/planning/*/` |
| Layer 3, sessions (BOOTSTRAP Step 4; #9) | A "first line" outside the vocabulary | The app boot, the window and the pane are sessions with open and close tags in the vocabulary |
| Layers 4–5, invariants (Steps 5–6) | None | Ordering and pairing rules stated, so a trace that breaks one is mechanically visible |
| View-tag duality (Step 9; Visual/UI class; foundation 04) | No view tags | Every behaviour tag the screen should show pairs with a view tag naming what was drawn, so screen and record can be compared |
| Payload foreign keys (Step 3) | Not required | Every tag carries the keys that join it to the rest: `window_id`, `pane_id`, `session_id`, and the kernel `seq` where one exists |
| Layer 6, runtime grammar (Step 7) | Not named | Which driver, which route, which fallback, which session a pane is bound to and which stream it reads |
| Layer 7, evidence (Step 8; #51) | Not named | Incident tags carry their diagnostic; summary tags carry their outcome |
| Strata (PRINCIPLES commitment 5) | Not named | Every tag has a stratum; ambient tags have a cadence |
| Signal is not log (foundation 02) | "Every request" risked a request log | Server tags are domain events (a session opened, a turn refused and why), not HTTP lines |
| Assertions with context (foundation 01, signal type 4) | None | A broken vocabulary invariant at runtime emits an incident with the recent trace and the state involved |
| Speaker's-mouth validation (commitment 2) | Window only | Every process validates against the same vocabulary file |
| Sprint size (hard rule 6) | Items spanning three processes | Each item is a chain of ≤2-file sprints |
| Canonical home (hard rule 7) | Not named | The sink, the validators and the reader get registry rows before they land |
| Observation contract (hard rule 9) | Gates read the window buffer | Every contract reads the trace file of the packaged app |

## Items, in order

| # | What | Closes when |
|---|---|---|
| 1 | **Vocabulary Session for the whole app** (`grammar/BOOTSTRAP.md` Steps 0–12), run on the app as built, all four processes and every user action. Layers 0–7 populated, the dual-contract audit table complete, the rationale doc signed off. One vocabulary file read by the window, main and the server. | The locked version, its rationale and sign-off exist; every user action and every process decision found in the code has a tag, a view pair or a typed proposal. |
| 2 | **The trace on disk.** An append-only JSON Lines file per app boot in the logs folder, opened by the boot's session tag (build, commits, vocabulary version, store path). Window, main and server write the same record shape. Size and count bounded. | All three processes' tags land in one file, in order, while the app runs. |
| 3 | **Validation where the signal is spoken**, in the window, main and the server, against the one vocabulary; `npm run signals` checks every emit site in all three and every declared tag for an emit site. | A planted undeclared emit fails in each process. |
| 4 | **The emits**, area by area, ≤2 files per sprint, each with the audit table rows it fills: pane and picker; session open, refusal and binding; turns and stream; transcript and view tags; drivers and CLI login; key routing; pages (records, assays, studio, settings); main's windows, dialogs and menus; server routes as domain events. | Every audit-table row fires in a recorded run of the packaged app. |
| 5 | **Invariants at runtime.** The vocabulary's Layer 4–5 rules (for example: a turn submitted pairs with its user row drawn; a pane is bound to one session) are checked as the trace is written; a broken rule emits an incident with its context. | A planted violation of each rule emits its incident. |
| 6 | **The reader.** One command prints the current trace in foundation 02's `format_for_ai` shape, filtered by category, window, pane or session. | An agent answers "what did this pane do" from its output alone. |
| 7 | **Gates and Rubber Duck read the trace.** Observation contracts assert tag, payload and order on the trace file; the Rubber Duck Pass narrates the packaged app's trace. | Each gate fails on a planted fault in its tags. |
| 8 | **The rule in the working agreement.** No sprint that adds or changes behaviour closes until that behaviour's tags fire in the packaged app's trace. | `WORKING_AGREEMENT.md` carries it; a decision entry records it. |

## Rules

- Instrumentation adds emits and checks; it changes no behaviour, text or layout. A fault the trace reveals is logged and fixed as its own named change after the item that revealed it.
- Every tag goes through the proposal and version step (hard rule 2).
- An item closes on the packaged app's trace file, read by the agent.

## Done

The plan closes when items 1–8 close: every process emits its vocabulary to disk, validated and checked, and the working agreement holds every later sprint to it.
