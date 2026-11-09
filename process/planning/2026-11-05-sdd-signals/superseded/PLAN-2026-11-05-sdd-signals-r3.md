# Plan — make substrate-ui an SDD app: the whole running program speaks its vocabulary (round 3)

*2026-11-05. Supersedes `superseded/PLAN-2026-11-05-sdd-signals-r2.md`. Round 3 applies a review of round 2 (2026-11-05, ten points, each checked against the files): the state table is corrected; v0.6 is settled before the session; the session's output version, its carry-over of the locked tags and its join to the kernel's vocabularies are stated; the trace gets an ordering mechanism, a loss count and a size bound; each area's sprint names the fixtures that drive its failure rows; payload content and validation posture are fixed; the registry is corrected before code. Source: the user's direction of 2026-11-05: "It must be fully instrumented. The vocabulary must be correct. It must be SDD." This is the only work until the plan closes.*

## The goal

The running app, in every process, emits typed signals from a locked vocabulary, validated where they are spoken, written to disk as they happen, and readable by an agent at any moment, joined to the kernel's run records. Each tag names an event the vocabulary defines; each emit site is the code that decided it. An agent reading the trace can say what the program did and find the line that did it, without a description and without a reproduction. The failures of 2026-11-05 are examples of what this makes obvious, not items.

## Where the app stands (2026-11-05)

At HEAD (`d9456f1`):

| Process | Signals | Where they go |
|---|---|---|
| Window | 38 locked tags (v0.5); 45 emit sites, all in `web/vm/session_controller.ts`; none in the 20 `.tsx` files of `web/app/` | `window.__vmSignals`, in memory, lost when the window closes |
| Electron main | 10 `log(...)` call sites, free text | stderr, which `setupLogFile` copies to `substrate.log` |
| Server (`server.py`) | none; `log_message` is silenced; 133 error-response sites, none emitted | — |
| Kernel | kernel vocabulary 0.4 and session vocabulary 0.17; each session's typed run record | `~/.substrate/sessions/<id>/record/` |

In the working tree, uncommitted: v0.6 (`0.6.json`, `locked: true`, 42 tags: v0.5 plus four `picker` tags), `current.json` → `0.6.json`, 8 emit sites in `web/app/App.tsx`, and a sink in `web/vm/instrumentation/sdd.ts`, `electron/preload.js`, `electron/main.js` that appends to one `signals.jsonl` across boots with no bound and swallows its own failures.

## Before item 1

- **v0.6.** It was locked without a decision entry: a silent version bump. A locked version is superseded only through proposals, so it is ratified now with its grounds (BLACKBOARD, agent-resolved, 2026-11-05) and item 1 starts from it.
- **The registry.** `WORKING_AGREEMENT.md`'s vocabulary row ("`0.1.json` (31 tags)") and its footer ("v0.1, 31 tags") have been wrong since v0.2. Both are corrected to v0.6, 42 tags, before any code, and the sink, the validators and the reader get their rows as their items begin (hard rule 7).

## Items, in order

| # | What | Closes when |
|---|---|---|
| 1 | **Vocabulary Session for the whole app** (`grammar/BOOTSTRAP.md` Steps 0–12) on the app as built: window, main, server, every user action. Inputs: the code (technical spec), the design canon (`../design/received/handoff 5/`), the postmortems in `process/planning/*/`, the BLACKBOARD decisions. **Output: v0.7.** The 42 locked v0.6 tags are Layer-1 input; every rename, split, merge or retirement of one is a typed proposal (`TAG_SPLIT_PROPOSED`, `TAG_MERGE_PROPOSED`, `TAG_DEPRECATION_PROPOSED` with a deprecation entry, technique #45). **The kernel join:** entities the kernel already defines (Session, Turn, Envelope and the session vocabulary's kinds) are not redeclared; each gets an `ENTITY_MERGE_PROPOSED` decision that names the kernel as its home and the key that joins to it (`session_id`, kernel `seq`). **Layer 7 payload rule:** tags carry ids, counts, kinds, reasons and durations; message text, file contents and credentials stay in the kernel record or nowhere, reached by `seq` (technique #6). **Validator posture:** strict extras; an unknown tag or missing field raises in source and test builds, and in the packaged app emits an incident carrying the tag and its call site instead (no request fails because of instrumentation). | v0.7 locked with rationale and sign-off; the dual-contract audit covers every user action and every process decision found in the code, each row with its tag, its view pair or a typed proposal; every v0.6 change and every kernel join recorded as a proposal. |
| 2 | **The trace on disk.** Owns the uncommitted sink. **Ordering:** each process writes its own file per boot (`window`, `main`, `server`), every line stamped with the boot id and a per-process sequence number; main's boot tag records the server's pid and the boot id it passed down; the reader merges on boot id, then causal keys (`session_id`, kernel `seq`), then per-process order. Wall-clock time is recorded but never used to order. **Loss:** a write that fails is counted; the count rides on the next line and on the boot's closing summary tag; a failed append never stays silent. **Bounds:** one set of files per boot; the last N boots kept; a per-file size cap whose reaching emits an incident. | Each process's tags land in its file in order while the app runs; a planted write failure shows in the count; the cap emits its incident. |
| 3 | **Validation where the signal is spoken**, in window, main and server, against the one v0.7 file, with item 1's per-build posture; `npm run signals` grows into a linter over `web/`, `electron/` and `server.py`: every emit site declared, every declared tag emitted somewhere. | A planted undeclared emit fails the linter and raises in a source build; in a packaged build it emits the incident. |
| 4 | **The emits**, area by area, ≤2 files per sprint (hard rule 6). Areas: pane and picker; session open, refusal and binding; turns and stream; transcript and view tags; drivers and CLI login; key routing; pages (records, assays, studio, settings); main's windows, dialogs, menus; server routes as domain events. **Each area's card names the fixtures and planted faults that drive its refusal and failure rows** (a missing workspace, a refused open, a CLI not logged in, a server error, a dropped stream), an asymmetric fixture per failure class (Addendum A3); rows only a real fault reaches are driven by a planted fault, never left out. | Every audit row of the area fires in the packaged app's trace, the normal rows on a normal run and the failure rows under their named fixtures. |
| 5 | **Invariants at runtime.** v0.7's Layer 4–5 rules (for example: a turn submitted pairs with its user row drawn; a pane is bound to one session; a window boot opens before any pane tag) are checked as the trace is written; a broken rule emits an incident with the recent trace and the state involved (foundation 01, assertions with context). | A planted violation of each rule emits its incident. |
| 6 | **The reader.** One command prints a boot's merged trace in foundation 02's `format_for_ai` shape, filtered by category, window, pane or session, and **joins each session's lines to its kernel record** at `~/.substrate/sessions/<id>/record/` on `session_id` and `seq`, so one listing shows what the window, main, the server and the kernel did. | An agent answers "what did this pane do, from pick to reply" from its output alone. |
| 7 | **Gates and Rubber Duck read the trace.** Observation contracts assert tag, payload and order on the trace files (Addendum B3); the Rubber Duck Pass narrates the packaged app's trace. | Each gate fails on a planted fault in its tags. |
| 8 | **The rule in the working agreement.** No sprint that adds or changes behaviour closes until its tags fire in the packaged app's trace, failure rows under their fixtures. | `WORKING_AGREEMENT.md` carries it; a decision entry records it. |

## Rules

- Instrumentation adds emits, checks and files; it changes no behaviour, text or layout. A fault the trace reveals is logged and fixed as its own named change after the item that revealed it.
- Every tag goes through the proposal and version step (hard rule 2); nothing locks without a decision entry.
- An item closes on the packaged app's trace, read by the agent.

## Done

The plan closes when items 1–8 close: every process emits v0.7 to disk, ordered, counted and bounded, validated where spoken, checked at runtime, joined to the kernel record, and the working agreement holds every later sprint to it.
