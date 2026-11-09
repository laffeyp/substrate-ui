# Plan — make substrate-ui an SDD app: the whole running program speaks its vocabulary (round 4)

*2026-11-08. Supersedes `superseded/PLAN-2026-11-05-sdd-signals-r3.md`, whose eight items closed on the packaged app's trace on 2026-11-08 (BLACKBOARD, built). Round 4 adds the six gaps a review of that work against the goal found (BLACKBOARD, 2026-11-08 surfaced), which the user named failures on 2026-11-08: "all failures. all of them. this part of the project is not done. do it correctly". The goal is round 3's, unchanged.*

## The goal

The running app, in every process, emits typed signals from a locked vocabulary, validated where they are spoken, written to disk as they happen, and readable by an agent at any moment, joined to the kernel's run records. An agent reading the trace can say what the program did and find the line that did it, without a description and without a reproduction.

## Items 1–8

Round 3's items, closed: the Vocabulary Session (v0.7), the trace on disk, validation where spoken, the emits by area, invariants at runtime, the reader, gates and the Rubber Duck Pass on the trace, the trace rule in the working agreement.

## Items 9–14, the gaps

| # | What | Closes when |
|---|---|---|
| 9 | **Crashes and hangs are written.** Window: an uncaught error, a render error with no boundary, an unhandled rejection, a preload that throws. Main: an uncaught exception, an unhandled rejection, a renderer gone, a window unresponsive and back, a child process gone. Server: a background run that raises, an exception that escapes a thread, a death before the trace opens (main reads the exception class from the server's stderr). Every hook observes only: the app behaves as without it. | Each fault, planted in the running app, is in the trace with its class and place and no message text; each gate fails with its emit removed. |
| 10 | **S2 is checked.** A boot that ends without APP_QUIT_COMPLETED is reported by the next boot as INVARIANT_BROKEN S2; the reader says whether a launch closed. | A killed launch is reported by the next one; the reader's header says it. |
| 11 | **Every user action has a tag.** Meta's direction, level and lit seq; the language lens's stream, view and lane; find's open, query (its length), scope and close; the top bar's cards; a tool card's open and close; the fold toggle. | Each, driven as a user does, is in window-1.jsonl once per change, in its pane, every value of every enum reached. |
| 12 | **The reader is hardened.** A line cut short is skipped and counted; each kind of failed join says which. | Tests on fixture files. |
| 13 | **No cause is left unfound.** The packaged `dialogs` failure of 2026-11-08 (⌘, after a reload opened no settings) and the kernel's K340-Q-1. | Each has its cause or the instrument that names it on a recurrence; K340-Q-1 passes. |
| 14 | **The built app is installed and opened.** The runbook's chapter "Build and install — no Apple", every step, on a clean build. | `/Applications/Substrate.app` is the new build, open on the screen, writing its trace. |

## Rules

Round 3's: instrumentation adds emits, checks and files and changes no behaviour, text or layout; every tag goes through the proposal and version step; an item closes on the packaged app's trace, read by the agent.

## Done

The plan closes when items 1–14 close.
