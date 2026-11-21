# The grey screen and the quit — research (round 4)

*2026-11-20. The task (BLACKBOARD, 2026-11-18): Substrate Next's screen goes grey and ⌘Q sometimes does not quit; find why, judge it as design, and say what production-ready looks like. Round 4 states the findings plainly. Rounds 1–3, in `superseded/`, hold the code reading, the sources and the measurements in full.*

## What happened

Substrate Next's screen went grey three times on 2026-11-18 (11:39, 14:40, 19:10). Each time the page Electron loads — the window, built from `web/` — died. macOS kept a crash report for each; with Electron's published symbols all three read the same: V8 ran out of memory while copying a joined-up string into one piece (`Runtime_FlattenString` → `V8::FatalProcessOutOfMemory`).

The session open at the time holds 28,513 events. One of them is a Bash call whose output was 2.65 MB, arriving as 20,796 progress events. Replaying that session in the source build kills the page at the same event, seq 14,137, every time (three runs).

## Why

For every progress event, the window:

- makes a new string of the call's whole output so far (`web/vm/session_controller.ts`, `prior.text + chunk`);
- puts that whole text into the page (`web/reveal/transcript/ToolCard.tsx`, `ProgressStream.tsx`) inside a box 220 px high, which hides most of it but lays all of it out;
- lays out the whole page again (`web/reveal/transcript/useScrollAnchor.ts`, `place`, after every update).

So the 2.65 MB output is copied and laid out once per line: about 20,000 times. The measurements agree:

- 94.7 % of the page's time goes to that layout (a CPU profile of the replay).
- The page's memory is garbage, not data it keeps: at 13,000 events the heap is 1,728 MB before a forced collection and 114 MB after. The garbage is made faster than it is cleared, the process peaks at 8.5 GB, and the heap's limit is 4 GB.
- The same happens live. A turn whose command prints 20,000 lines finishes in 2.0 s; the page is then frozen for 158.6 s, the longest stretch 117.7 s.

When the page dies, nothing brings it back. Electron's main process (`electron/main.ts`) writes `RENDERER_GONE` to its trace and does nothing else, so the screen stays grey until the app is quit.

## What is wrong in the design

1. **The window rebuilds and redraws the whole of every output on every line.** What a tool call shows is already designed and stays as it is (the cards, text and raw presentations, the Architect, 2026-11-17: "Nothing gets truncated"). What is wrong is how the window holds it: it makes a new string of the whole output for each line, puts all of it into the page each time, and lays out the whole page after every update. The fix keeps what is shown and changes only that: output appended without rebuilding it, events taken in batches rather than one at a time, and only what is on screen laid out.
2. **A dead or frozen window is never restarted.** It should be reopened, with a message saying why, as VS Code does ("The window terminated unexpectedly", Reopen / Close).
3. **Every printed line travels as its own event, the whole way.** The kernel's Bash tool sends one event per line onto the run's single queue (`substrate/.../tool_loop/tools.py`), the record keeps one entry per line, the backend (`server.py`) sends each to the window, and the window handles each. The kernel's own cost is small — 14,482 events in about a second — but the window pays for every one. Output should travel in larger pieces.
4. **A failure while drawing blanks the whole window.** No part of the window catches an error, and React removes everything on an uncaught one. Each area should catch its own.

## Found on the way

- Electron's main process writes each of the window's trace records with a blocking file write, one at a time, which Electron's guidance says not to do. Main was idle in the measurements, so it is not a cause today.
- The backend sends a reopened session's whole history to the window at once, and a dropped connection starts again from the beginning; the standard event-id resume is unused.
- The window never lets go of a conversation's rows: 89 page elements per turn, for good.
- A plain turn gets slower as a session grows — 0.13 s to 0.65 s in the kernel, and 0.03 s to 1.4 s between turns, over 200 turns — because the kernel reads the whole record again for every turn (`2026-11-18-core-stalls/RESEARCH-2026-11-18-bootstrap-time.md`). That is the kernel's work, not this one's.

## Not known

- **⌘Q.** Electron's main process is idle while the window is frozen, so main is not what holds it. The likely holder is the frozen window, if the key goes to it first. The test that settles it needs macOS Accessibility permission for Visual Studio Code, so that it can send a real ⌘Q.
- **One plain turn that stalled.** In one run, turn 44 of a series of plain turns did not finish within 120 s. It did not happen again in 280 more turns. Cause not found.
