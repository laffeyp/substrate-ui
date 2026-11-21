# How the window works, where it breaks, and what production-ready means (round 5)

*2026-11-20. Replaces round 4, which listed defects without explaining the system they live in. This document builds up from purpose and mechanism so that each finding arrives with its ground already laid.*

## The app and its job

Substrate UI is an Electron app. It is the cockpit for agent orchestration sessions: a person opens a session, watches the agent's transcript fill in real time, reads and edits files the agent touches, inspects tool calls, and steers the conversation. The app must stay responsive while a session streams thousands of events over minutes or hours, because the person using it is working alongside the agent and needs to intervene at any moment — interrupt a tool call, scroll back to read an earlier reply, type the next instruction.

The app runs as three OS processes. The **main process** (Electron's Node.js runtime, `electron/main.ts`) owns the native window, the application menu, the quit flow, and the Python backend's lifecycle. The **renderer process** (Chromium, loading the React page built from `web/`) draws everything the person sees — the transcript, the editor, the meta views, the pickers. The **backend** (`server.py`, a Python process spawned by main) holds the session state on disk, talks to the kernel that drives the model, and serves an HTTP + SSE API the renderer consumes. Main and the renderer talk over Electron's IPC; the renderer and the backend talk over localhost HTTP and a Server-Sent Events stream.

## How a session's events reach the screen

A session is a sequence of **envelopes** — typed records (UserMessage, ModelReply, ToolCall, ToolProgress, ToolResult, SessionEnded, and others) written to a JSONL file on disk by the kernel as the agent works. The backend reads that file and serves it as an SSE stream at `/api/session/{id}/events`. The renderer opens that stream through `BrowserSubstrateClient._openSse` (`web/vm/client.ts:98`), which wraps a browser `EventSource`.

Each SSE frame carries one envelope as JSON. The `EventSource`'s `onmessage` handler parses it and calls `SessionController.handleEnvelope` (`web/vm/session_controller.ts:1472`).

The envelope rate during a streaming tool call is set by the kernel, not the UI. The kernel's Bash tool writes one ToolProgress envelope per line of terminal output to the session's record (`substrate/.../tool_loop/tools.py`). Each line gets its own sequence number and timestamp on the record. This is correct for the record — the record is the source of truth, and per-line granularity means any consumer (the UI, a replay, an audit) can see exactly when each line appeared. The kernel writes 14,482 envelopes in about a second; that cost is small at the kernel. The cost lands in the UI, which processes each one through the full snapshot-and-render path.

**SessionController** is the Presentation Model — the single object that holds all of a pane's session state: the transcript rows, the streaming tool output, the connection status, the driver name, the workspace path. It follows the MVVM pattern: the controller owns the data, React reads it, and the two are connected by `useSyncExternalStore` through the `useController` hook (`web/reveal/transcript/useController.ts:61`). One controller per pane; a `PaneRegistry` (`web/vm/pane_registry.ts`) maps pane ids to controllers. Up to eight panes can be open at once (`MAX_PANES` in `web/app/derive/panes.ts`).

Substrate's topology model makes multiple simultaneous streams the normal case, not an edge case. A session that starts a delegate opens a child pane beside its caller (`App.openSessionPane`). A run that starts sessions opens one pane per session (`App.openRunPanes`). Each pane has its own controller, its own SSE stream, and its own envelope-processing path. When several panes stream at once, the per-envelope costs described below multiply — and the App re-render problem (W9) fires on every envelope from every pane, because `App` subscribes to the shell store that aggregates all panes' snapshots.

When `handleEnvelope` receives an envelope, it does three things in sequence:

1. **Appends to `rawEnvelopes`.** Line 1494: `this.patch({ rawEnvelopes: [...existing, env] })`. This spreads the entire existing array into a new array with the new envelope at the end.

2. **Converts the envelope to transcript rows** via `envelopeToRows`. A UserMessage becomes a user row. A ToolCall becomes a tool row. A ToolProgress appends its chunk to the running text for that call. A ToolResult becomes a result row paired with its call.

3. **Notifies listeners.** The `patch` method (line 1922) replaces the snapshot object: `this.snap = { ...this.snap, ...delta }`, then calls every registered listener. React's `useSyncExternalStore` picks up the new snapshot reference and schedules a render.

This happens once per envelope — but `patch` is called more than once per envelope. The `rawEnvelopes` append (line 1494) is one `patch`. Then `envelopeToRows` calls `patch` again for whatever the envelope produces: a transcript row via `appendTranscript` (which calls `patch`), or a `progressByCallId` update (which calls `patch`), or a state change like `driver` or `endedReason`. Each `patch` creates a new snapshot object and fires all listeners synchronously. A single ToolProgress envelope triggers at least two patches (rawEnvelopes + progressByCallId), two snapshot allocations, and two rounds of listener notification — each of which schedules a React render.

## The transcript and the scroll anchor

`Transcript.tsx` renders the session's rows. It filters out ToolResult rows (those fold into their matching ToolCall's card) and maps the rest to `<Row>` components keyed by call id or sequence number. Each ToolCall row receives `progressText` from `snapshot.progressByCallId[id]` — the full accumulated text of that call's streaming output — and passes it through `ToolCard` to `ProgressStream`.

**ProgressStream** (`web/reveal/transcript/ProgressStream.tsx`) renders the streaming text in a 220px-high overflow box. The box has `maxHeight: 220` and `overflow: auto`, so the person sees a scrollable window into the output. But the browser lays out all the text to compute the scroll dimensions, regardless of how much is visible.

After every React commit — every render, not just renders that add rows — `useScrollAnchor` runs `settle` via a bare `useLayoutEffect` with no dependency array (line 260: `useLayoutEffect(() => { settle(TranscriptScrolledCause.ROW_ARRIVED); })`). `settle` calls `place`, which calls `getBoundingClientRect()` on the scroller and on anchored elements (lines 157–185). That `getBoundingClientRect` call forces the browser to complete any pending layout synchronously before returning. The scroll anchor serves three modes — following (pinned to the bottom, the default while streaming), reading (the person scrolled up, the viewed row holds its position), and pinned (a card header clicked, the header holds its position). All three modes work correctly. The cost is that `place` runs after every commit, and every commit during streaming is triggered by a single ToolProgress chunk.

## What breaks under load, and why

### The 2.65 MB bash output

The session that killed the page on 2026-11-18 contained a Bash tool call whose output was 2.65 MB, delivered as 20,796 ToolProgress envelopes — one per line of terminal output. For each of those 20,796 envelopes, the controller:

- Built a new string of the call's entire output so far by concatenating `prior.text + chunk` (session_controller.ts:1661). At envelope 20,000, `prior.text` is roughly 2.6 MB. The concatenation allocates a new string of that size, copies the old text, appends the chunk, and discards the old string.

- Spread the entire `progressByCallId` map into a new object (line 1663: `{ ...this.snap.progressByCallId, [key]: nextEntry }`).

- Spread the entire `rawEnvelopes` array into a new array (line 1494). At envelope 20,000, the array has 20,000 entries.

- Created a new snapshot object (line 1923: `this.snap = { ...this.snap, ...delta }`).

- Triggered a React render, which passed the full 2.6 MB `progressText` string to `ToolCard`, which passed it to `ProgressStream`, which put it in a 220px box. The browser laid out all 2.6 MB of text to compute scroll metrics.

- Ran `useScrollAnchor`'s `place` after the render, forcing a synchronous reflow (`getBoundingClientRect`).

That sequence ran 20,796 times. The string concatenation alone produces O(n²) total bytes copied — roughly 2.6 MB × 20,000 / 2 = 26 GB of string data allocated and immediately discarded. The CPU profile of a replay confirmed: 94.7% of the page's time went to layout forced by `place`. The heap before a forced garbage collection reached 1,728 MB at 13,000 envelopes; after collection it was 114 MB. The garbage — transient strings and snapshot objects — was produced faster than V8's garbage collector could reclaim it. The process peaked at 8.5 GB and hit V8's 4 GB heap limit, which killed the renderer with an out-of-memory crash.

The same pattern appears live. A turn whose command prints 20,000 lines finishes in 2.0 seconds at the kernel; the page then freezes for 158.6 seconds processing the queued events, with the longest unbroken freeze at 117.7 seconds.

### The grey screen

When the renderer process dies, Electron's main process receives a `render-process-gone` event. The handler (main.ts:686–688) writes a `RENDERER_GONE` signal to the trace log and does nothing else. No dialog appears. No recovery runs. The window stays on screen with a grey (or white) Chromium surface — the page is gone but the native frame remains.

By contrast, when the backend dies, `onBackendDied` (main.ts:798–819) shows a dialog with "Relaunch" and "Quit" buttons. The renderer death has no equivalent path.

### ⌘Q during a frozen page

The ⌘Q key is handled by the system menu's `{ role: "quit" }` entry (menu.ts:54). Electron routes ⌘Q through the menu to the main process's `before-quit` handler (main.ts:891–900), which prevents the default quit, sends SIGTERM to the backend's process group, waits for the backend to exit, then calls `app.quit()` again. This flow runs entirely in the main process and does not depend on the renderer.

During normal operation, main is idle and handles ⌘Q immediately. During a page freeze, the main process is still idle — the CPU profile confirmed this. The likely cause of occasional ⌘Q failures is Chromium's input routing: before a keyboard event reaches the menu system, Chromium may first offer it to the focused renderer. If the renderer is hung, the event can stall in Chromium's IPC layer. Settling this needs a test that sends a real ⌘Q keystroke (not a simulated one) to a window whose renderer is frozen, which requires macOS Accessibility permission.

## What the design got right, and what production-ready changes

The architecture is correct. The Presentation Model pattern keeps session state out of React components, which means the state survives view switches (panes to meta to editor and back) without losing the transcript or scroll position. The scroll anchor's three modes serve real needs: following the bottom during streaming is the default because that is what a person watching an agent work wants; holding position when scrolled up is what a person reading earlier output needs; pinning a card header is what a person expanding a tool call to read its details expects. The SSE stream is the right transport for a one-directional event sequence. The trace system writes vocabulary-typed signals to JSONL, which means the app instruments itself in a way the project's tests can read.

What breaks is not the architecture but the per-envelope cost. Each of the patterns below is a correct first implementation — it does the right thing — that becomes expensive when multiplied by the event rate of a real session.

**Per-envelope: the snapshot copy.** `patch` creates a new snapshot and notifies all listeners on every envelope. During a streaming tool call, envelopes arrive at the rate the kernel writes terminal output — potentially thousands per second. Each patch triggers a React render cycle. The fix (roadmap item W2) is to queue envelopes and fold a batch into one snapshot per animation frame. The snapshot-per-frame model preserves the MVVM contract — React still sees an immutable snapshot reference change — but the change happens 60 times per second instead of 20,000.

**Per-envelope: the string concatenation.** `progressByCallId` builds the full output text by concatenating `prior.text + chunk` on every ToolProgress event. At 2.6 MB of output delivered in 20,796 chunks, this allocates roughly 26 GB of transient strings. The fix (roadmap item W4) is to keep the last 1,000 lines (the default of xterm.js and VS Code's terminal), appending chunks to a ring buffer instead of rebuilding the full string. The card says how many lines preceded the visible window. The full output stays on the record for anyone who needs it.

**Per-envelope: the array spread.** `rawEnvelopes` grows by `[...existing, env]` on every envelope, copying the entire array each time. With 28,513 envelopes, the last append copies 28,512 entries to add one. The same pattern appears in `appendTranscript` (line 1919: `[...this.snap.transcript, row]`). The fix (roadmap item W8) is to stop keeping `rawEnvelopes` as a whole-session array — the views that read it (the meta lenses, the editor) need indexes (which files were touched, one file's history), not the raw sequence. The controller builds those indexes incrementally per batch.

**Per-commit: the forced layout.** `useScrollAnchor`'s `useLayoutEffect` with no dependency array runs `place` after every React commit. `place` calls `getBoundingClientRect`, which forces the browser to finish layout synchronously. During streaming, every ToolProgress chunk triggers a commit, so `place` runs thousands of times per second. The fix (roadmap item W3) is to run `place` once per animation frame, with reads batched before writes (the standard read-then-write pattern for avoiding layout thrashing). The scroll anchor's three modes are unchanged.

**Per-render: the full-text layout.** ProgressStream puts the entire accumulated output text into a 220px overflow box. The browser lays out all of it to compute the scrollable area, even though only a few lines are visible. At 2.6 MB, that layout is the dominant cost — 94.7% of the page's time in the replay profile. The fix is a consequence of W4's bounded stream: with only 1,000 lines in the box, the layout cost is constant.

**Per-envelope: App re-renders on every pane's every envelope.** `App` (a React class component in `web/app/App.tsx`) subscribes to the shell store in `componentDidMount`. The shell store's `applyShell` callback calls `this.setState({ controllerSnapshots: { ...snapshots } })` on every snapshot change from any pane. That `setState` re-renders `App` and everything it draws — the top bar, the panes view, the footer, the picker state — even when no field `App` itself uses has changed. During a streaming tool call with 20,000 ToolProgress envelopes, `App` re-renders at least 20,000 times, and each render recomputes the picker views, the stream view, the panes view, and the top bar state in `publish()`. The fix (roadmap item W9) is to have `App` take from the shell store only the fields it draws, so a pane's envelope that changes no field `App` uses does not render it.

**Missing: renderer crash recovery.** `render-process-gone` logs the event and does nothing. The grey screen persists until the person force-quits the app. The fix (roadmap item W6) is to show a dialog ("The window terminated unexpectedly" with Reopen and Close), reload the page on Reopen, and reconnect to the same sessions. A second crash within 60 seconds of a reopen does not reopen without asking.

**Missing: render error boundary.** React removes the entire component tree on an uncaught error. A bug in one tool card, one editor pane, or one meta lens blanks the whole window. The fix (roadmap item W5) is error boundaries around the transcript, the meta view, the editor, and the pages. Each boundary draws a fallback that names what failed and offers to retry, and writes `WINDOW_FAULTED` to the trace.

## Fixes checked against Substrate's architecture

The proposed fixes live in the UI layer — the controller, the React components, the scroll anchor, the main process. None changes what the kernel writes to the record, how the backend serves it, or how the SSE stream delivers envelopes. The record remains one envelope per terminal line, with per-line sequence numbers and timestamps. The backend still serves the full record over SSE. The session topology still opens panes for delegates and runs. Each fix is checked below against what it does and does not change.

**W2 (batch per frame)** queues envelopes in the controller and folds a batch into one snapshot per animation frame. The SSE stream still delivers each envelope individually. The controller still processes every envelope in seq order. The snapshot published at the end of a batch reflects all envelopes in that batch. No envelope is dropped or reordered. The record is untouched. This is the same decoupling xterm.js uses between its write loop and its renderer — the parse runs at input rate, the render runs at frame rate — applied to the controller-to-React boundary.

**W4 (bounded stream)** keeps the last 1,000 lines of a tool call's streaming output in `progressByCallId`. The full output stays on the record. The card shows how many lines preceded the visible window. The controller still processes every ToolProgress envelope; it appends to a ring buffer instead of concatenating a string. No envelope is dropped. The record is untouched.

**W8 (indexes instead of rawEnvelopes)** replaces the whole-session `rawEnvelopes` array with incremental indexes built per batch. The views that read `rawEnvelopes` (the stream view in `web/app/derive/stream.ts`, the meta lenses) need specific projections — which files were touched, one file's history, the topology graph — not the raw array. The controller builds those projections from each batch's envelopes and updates the indexes. The record on disk still holds every envelope. The session's SSE stream still delivers all of them on replay or reconnect.

**W3 (scroll anchor once per frame)** changes when `place` runs — once per frame instead of after every React commit. The scroll anchor's three modes (following, reading, pinned) are unchanged. No Substrate data path is involved.

**W9 (App renders only on own inputs)** changes which snapshot fields trigger an `App` re-render. The controller still publishes every snapshot change. `App` stops re-rendering when the change is in a field (like `progressByCallId`) that only the pane's own `Transcript` reads. No Substrate data path is involved.

**W5, W6 (error boundaries, crash recovery)** are Electron/React infrastructure. No Substrate data path is involved. The crash recovery dialog's "Reopen" reloads the page and reconnects the panes to their sessions — the SSE stream replays the record, as it does on any reconnect.

**W11 (stream resumes by event id)** adds `Last-Event-ID` to the SSE reconnect. The backend starts the stream from the last-seen seq instead of from the beginning. This changes the backend's `/api/session/{id}/events` endpoint (server.py) to honor the `Last-Event-ID` header. The record is untouched. The envelope sequence is the same — the client just skips what it already has.

None of these fixes changes the kernel, the record format, the session topology, or the envelope vocabulary. The envelope stream is consumed as Substrate produces it. The fixes change how fast and how much the UI processes per frame, not what it processes.

## Found on the way

The backend sends a reopened session's entire history from seq 0. A dropped SSE connection reconnects from the beginning, replaying every envelope. The standard `Last-Event-ID` resume mechanism is unused (roadmap item W11).

The transcript renders every row in the DOM. A 200-turn session produces roughly 89 DOM elements per turn — about 17,800 elements. The DOM size grows without bound as the session grows. Roadmap item W7 addresses this with a windowed transcript that keeps only the rows near the viewport in the DOM.

Electron's main process writes each trace record with a synchronous file write. Electron's own guidance advises against blocking the main thread with file I/O. Main was idle in the measurements taken so far, so this is not a cause of the grey screen, but it is a production risk under higher trace volume (roadmap item W10).

## Not known

**⌘Q's exact failure path.** The main process is idle during a page freeze, so the quit handler itself is not blocked. The likely cause is Chromium's input routing holding the keystroke at the renderer's IPC channel. The test that settles this needs macOS Accessibility permission to send a real keystroke to a frozen window (roadmap item W12).

**One unexplained stall.** In one measurement run, turn 44 of a 200-turn series did not finish within 120 seconds. It did not recur in 280 subsequent turns. Cause not found.
