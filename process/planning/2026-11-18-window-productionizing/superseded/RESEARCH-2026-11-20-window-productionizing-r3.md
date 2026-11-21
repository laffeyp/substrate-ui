# The window layer, productionized — research (round 3)

*2026-11-20. Asked 2026-11-18 (BLACKBOARD, two `user` entries): the grey screen and the ⌘Q that sometimes does not quit are cases of one finding, that the window layer is still partly prototype; the task is the research to productionize it. Round 1 named the patterns the window's code follows and their missing parts; round 2 added the tests the project lacks (§ 7) and the window measured (§ 8). Round 3 judges the findings as design against what the window is for (the Architect, 2026-11-20: "this is a DESIGN flaw … This is software engineering"): § 0 is new and comes first; §§ 1–8 are round 2's, corrected where § 0 or the measurements correct them. Rounds 1 and 2 are kept beside it.*
---

## 0. What the window is for, and the design flaws judged against it

### 0.1 The purpose

substrate-ui is "a desktop cockpit for driving LLMs through structured runs" (`README.md`). Its premise is that an LLM is a stochastic process to be controlled and understood: "every event in a session — tool calls, replies, prompts, setting changes — lands on a log; you can replay it, diff it, and read any point", and "information is treated as primary". The window's job is to make that process "visible, legible, and interpretable": "the window shows what it is doing, what it has read, how it is answering, and how the conversation is shifting".

Four requirements follow, and every finding below is judged against them:

1. **The record is whole.** Every event lands on the log, kept and replayable. That a session's record holds 28,513 envelopes, or one call's 20,796 lines of output, is the record doing its job.
2. **The window makes the run legible.** It shows the person what the model is doing. A wall of output is not legible; the command, its time, its size, its rate, whether it succeeded and its last lines are.
3. **The window never loses the person's view of the run.** Whatever the record holds, the window stays up, answers input, and if it fails, says so and comes back.
4. **Showing the work never slows the work.** The model's turn runs at the speed of the model and its tools; the display follows it and never holds it.

### 0.2 The design flaws

**F1 — A command's output is on the work's path (requirement 4).** The kernel's `bash` tool runs the command in a worker thread and, for every line of stdout, posts a `ToolProgress` event onto the run's inbox (`substrate/src/substrate/topologies/tool_loop/tools.py`, `_bash`'s `_pump`; `emit_tool_progress` in `tool_loop/__init__.py`, through `Runtime.inject_event`). The run has one writer, which takes everything on that inbox in order and gives each item a full cycle: append the frame to the record, update every subscribed view, evaluate every trigger, consult the termination policy (`kernel/runtime.py`, the writer loop: `self._cyc.cycle(item)`, `_flush_scheduled()`, `_consult_termination(...)`). The tool's result, and with it the model's next step, waits in that queue behind every line printed before it. The server then streams each line's frame to the window as its own message (§ 2.1), and the window folds and redraws on each (§§ 2.2–2.4). By construction, then, the time a turn takes grows with how much its commands print, and display data — which only the window needs line by line — travels the same ordered path as the events that drive the run. Measured (§ 8), from one such turn's record: the whole turn took 1.99 s, its 14,482 progress events crossing the run in 0.96 s. The kernel's part of the cost is therefore seconds; the flaw's cost lands downstream — one command becomes 14,534 frames on the record, each streamed to the window as its own message and folded and redrawn there (F2), where the window then spent two long tasks totalling 158.6 s, the longer 117.7 s, after a turn that had ended in two. *The correct design:* the command returns at its own speed and the model gets its capped result at once (the kernel already caps the model's copy at 8,000 bytes, `_BASH_STDOUT_BYTES`); the record keeps the output whole, written in large pieces rather than one event per line, without holding the run's control events behind it; the window is sent what a person uses — the command, its running time, its size, its rate, its last lines — and never every line.

**F2 — The window holds and redraws everything (requirements 2 and 3; the grey screen).** Each envelope is folded by copying the whole envelope list and scanning the whole transcript (§ 2.2); each change runs a synchronous chain that re-renders the root and rebuilds every view (§ 2.3); the transcript keeps every row and every stream's whole text in the DOM and lays the document out after every commit (§ 2.4). A long stream is therefore redrawn whole on every chunk: 20,796 times for one 2.65 MB call. Measured (§ 1, § 8): 94.7 % of the page's time in forced layout; the heap filling with garbage faster than it is collected (154 → 110 MB after a collection at 7,000 envelopes, 1,728 → 114 MB at 13,000); a peak working set of 8.53 GB; and death. The three crash reports of Substrate Next's page on 2026-11-18 are V8 out of memory while flattening a concatenated string (§ 8) — the stream's text, `prior.text + chunk`. *The correct design:* envelopes folded in batches, one notification per batch; per call, a bounded tail and its counts in the pane, the whole output on the record; the transcript drawing only what is near the view, its layout read once per frame. This is the standard practice of § 4 (React's windowing, Redux's batching, xterm.js and VS Code's 1,000-line buffers).

**F3 — A failed page stays failed (requirement 3).** Main records a dead or hung page (`RENDERER_GONE`, `WINDOW_UNRESPONSIVE`) and does nothing else; the window stays grey until the app is quit (§ 2.6). No component catches a render error, so any throw during render removes the whole window (§ 2.3). *The correct design:* main reopens the page and says why, as VS Code does (§ 4); error boundaries keep a failing part from taking the rest with it.

**F4 — The window's trace is written on main's thread, one record at a time, as large as the record (requirement 4, in the trace).** Each window record is one IPC message and one synchronous write and file check on main (§ 2.5), against Electron's guidance not to block the main process with I/O (§ 4); two records per envelope make the trace as large as the session. Main stayed responsive: within 4 ms during a replay (§ 2.6), and idle during a live 20,000-line stream, 99 % of its main thread's samples waiting for the next event (§ 8). So this is not the cause of the grey screen or of the quit; it is the same flaw as F1 in the trace — per-item work that grows with what the session prints — and a breach of Electron's guidance that costs nothing yet. *The correct design:* records batched per frame and written asynchronously; per-envelope tags replaced by a summary per batch.

**F5 — The stream from server to window has neither pacing nor resume (requirements 3 and 4).** A reattach sends the whole backlog as fast as the socket takes it, with nothing to say "slower" (§ 2.1; about 7,000 envelopes measured in flight); the server sends no event ids, so a dropped connection starts again from the beginning. *The correct design:* the window asks for what it draws — the backlog in batches, the live tail as it comes — and resumes from its last seq.

**Not yet judged — ⌘Q that does not quit.** Main is not what holds it: idle during a live stream, responsive during a replay (§ 2.6, § 8). The remaining candidate is the page — frozen for 117.7 s in one task after a 20,000-line stream (§ 8) — if Electron hands ⌘Q to it before the menu, as Chromium does for most keys. Unverified (§ 6); F2's fix removes the frozen page either way.

---

## 1. What was measured

All numbers are from `harness/replay_memory.ts`: the source-mode app on a scratch state root holding a copy of one session folder, the session opened the way a `substrate://session/<id>` link opens it, the renderer's working set from `app.getAppMetrics()` and its JavaScript heap from DevTools `Runtime.getHeapUsage`. The session is a long one on this machine (28,513 envelopes, 10.8 MB of record); its contents stay on the machine.

- **The page dies holding the session.** 351 s after the link, at 14,137 of the 28,513 envelopes, the page crashed (`RENDERER_GONE`, reason `crashed`, exit 5): the same event the installed Substrate Next wrote twice on 2026-11-18. The working set rose from 0.55 GB at 4,163 envelopes to a peak of 8.67 GB. A second run, stopped at 7,000 envelopes for a profile, crashed at 14,058.
- **The heap holds gigabytes, and they are garbage.** 81 MB after a full collection at 4,859 envelopes; 3,183 MB at 11,911 with no collection forced. With the record cut short so the page could go idle (§ 8), a full collection left 110–114 MB at 7,000, 10,000 and 13,000 envelopes: the gigabytes are garbage made faster than the collector clears it.
- **The session's logic alone is cheap.** The same 28,513 envelopes through the session controller in Node, with no page: 1.9 s, 24 MB.
- **The window takes in envelopes ever more slowly.** 4,163 in the first 5 s; at 300 s, 12 per second. The record's envelopes arrive faster than the page draws them: when the run's backend was stopped at 7,000 envelopes taken in, the page went on to take in 7,058 more that were already on their way, held between the server and the page.
- **Where the page's time goes.** A CPU profile from the link to 7,000 envelopes (340.6 s sampled): 94.7 % (322.0 s) is self time of one function, the scroll anchor's `place` (`web/reveal/transcript/useScrollAnchor.ts` line 157). `place` reads `clientHeight`, `scrollTop`, `scrollHeight` and `getBoundingClientRect()` and writes `scrollTop`; the sampler bills the layout those reads force to the script that forced it. It runs in a `useLayoutEffect` with no dependency list (line 260), so after every commit, and the transcript commits once per envelope. Everything else on the page — the controller's `handleEnvelope` (1.37 s inclusive), the ANSI test `[\x1b\r\b]` (1.75 s), garbage collection (1.22 s), `sessionStorage.setItem` (0.30 s) — is under 5 %.
- **One call carries most of the bytes.** In the record, seq 6519 is one Bash call that streamed 2.65 MB as 20,796 `ToolProgress` chunks. Each chunk makes a new string of the call's whole output so far (`progressByCallId`, `web/vm/session_controller.ts`), and the transcript redraws that call's output block whole.
- **Nothing brings the page back.** `electron/main.ts` answers `render-process-gone` by writing `RENDERER_GONE` to the trace; the window stays grey until the app is quit.

The first, specific cause is therefore one call's long stream in one session. The class it belongs to is the subject of the rest of this note.

---

## 2. The patterns the window follows, read from the code

Each part names the pattern the code follows (by its established name, with the source that defines it), what the code does with it, and the standard parts of that pattern that are absent.

### 2.1 The stream: Server-Sent Events, one message per envelope

*Read: `web/vm/client.ts` (whole); `server.py` `_session_events` (lines 5940–6006).*

**The pattern.** A port and an adapter (Cockburn's hexagonal architecture): `SubstrateClient` is the port, `BrowserSubstrateClient` the adapter over `fetch` and `EventSource`. The record reaches the window as Server-Sent Events (WHATWG HTML, "Server-sent events"): the server writes each envelope as one `data:` frame, polling the record every 200 ms, with a `: ping` comment every 15 s and an `end` event when the record ends.

**What the code does.** `EventSource.onmessage` parses each frame and calls the controller's `onEnvelope` at once. A reattach sends the backlog first, every envelope past `since_seq`, as fast as the socket takes it.

**Missing.**
- *Flow control.* The server writes the backlog without regard to how fast the page consumes it, and `EventSource` has no way to say "slower": every frame the socket delivers becomes a message task queued on the page's main thread. Measured: about 7,000 envelopes queued ahead of the page when its backend was stopped.
- *Batching at the boundary.* One message, one parse, one controller call, one chain of synchronous redraws (below). A backlog of 28,513 envelopes is 28,513 separate trips through the whole window.
- *Resume by event id.* The server writes no `id:` field, so the browser's own reconnect asks again from the `since_seq` the stream was opened with and the backlog is sent again. The controller compensates (it drops seqs it holds, and reopens after 1 s from its own `lastSeq`); the standard mechanism, `id:` with `Last-Event-ID` (WHATWG HTML, "Server-sent events", the event stream's last event ID), is unused.

### 2.2 The session controller: a Presentation Model folding an event log

*Read: `web/vm/session_controller.ts` lines 1–700, 843–970, 1435–1926 (the stream path, `envelopeToRows`, `patch`); lines 700–842 and 972–1434 (turn sending, slash commands, interrupts) not read for this note.*

**The pattern.** The file names its own: Fowler's Presentation Model ("one class holds the state and behavior every shell needs; views subscribe to snapshot updates and call actions"). The data it holds is a projection of an event log: the record is append-only and ordered by `seq`, and `envelopeToRows` folds each envelope into the snapshot — event sourcing's read model (Fowler, "Event Sourcing", 2005). Views learn of changes through the Observer pattern (Gamma et al., *Design Patterns*): `subscribe` adds a listener, `patch` calls every listener.

**What the code does.** `patch(delta)` makes a new snapshot object, `{...snap, ...delta}`, and calls every listener with it, synchronously. Per envelope, `handleEnvelope`:
- copies the whole envelope list, `rawEnvelopes: [...existing, env]` — n copies of a growing array, about n²/2 element copies over a backlog (406 million for 28,513);
- calls `patch` two or three times (the list; the transcript or the stream text; sometimes the turn index), so the views hear of one envelope two or three times;
- scans the whole transcript in `noteSkipped` (`transcript.some(row => row.seq === env.seq)`), another n²/2;
- for a `ToolProgress` chunk, makes the call's text `prior.text + chunk` and a new `progressByCallId` object. 20,796 chunks of one call, each a string of the whole output so far; any reader that needs the flat string (a regular expression, the DOM) copies it: about 27 GB of text over the call.

Everything is kept for the life of the pane: every envelope in `rawEnvelopes`, every row in `transcript`, every call's whole stream in `progressByCallId`.

**Missing.**
- *An incremental projection.* A projection updates its read model as each event is applied, so the work per event is that event's, not the history's. Here three of the per-envelope steps are linear in the history, so a backlog costs quadratic time.
- *Copying once per batch, not once per event.* Immutable snapshots are the right shape for `useSyncExternalStore` (react.dev: "The store snapshot returned by `getSnapshot` must be immutable") and for Redux ("Do Not Mutate State", redux.js.org style guide). A copy of a growing array is linear; made once per envelope across a backlog, it is quadratic. The copy belongs at the batch: apply many envelopes, copy once — or hold the list in chunks so an append copies a chunk, not the list.
- *One notification per batch.* Redux's style guide, "Avoid Dispatching Many Actions Sequentially": each dispatch "triggers store subscribers and UI updates", so a larger change is one event, or batched so that many dispatches cause one UI update. React 18 does the same for its own state ("Batching is when React groups multiple state updates into a single re-render", react.dev, "React v18.0"), but not for an external store, which it reads synchronously. Here one envelope is two or three notifications, and a backlog is never one batch.
- *Bounds.* Nothing caps what a pane holds. A long stream is held whole twice (the chunks in `rawEnvelopes`, the joined text in `progressByCallId`).

### 2.3 From controller to React: external stores in a chain, each change synchronous

*Read: `web/vm/pane_registry.ts`, `web/reveal.ts`, `web/app/store.ts`, `web/app/state/shell.ts`, `web/reveal/transcript/useController.ts` (whole); `web/app/App.tsx` lines 640–710, 890–1020, 1190–1340.*

**The pattern.** External stores read through React's `useSyncExternalStore` (React 18; react.dev, "useSyncExternalStore"): `createStore` gives each area of the window a `getSnapshot`/`subscribe`/`set` store, and the transcript reads its pane's controller through the registry the same way. `App` is a class component that mirrors every pane's snapshot into its own state and, after each commit, derives the other areas' views and writes them into their stores (a mediator).

**What the code does.** One controller `patch` runs, synchronously and in this order: the registry's listener; `mirrorSnapshot`, which writes a new `snapshots` map into the shell store; the shell store's listeners, among them `App.applyShell`, which calls `setState({controllerSnapshots: {...snapshots}})`; and every `useController` hook on that pane, each of which schedules a render. `App` has no `shouldComponentUpdate`, so it renders again on each one; its `componentDidUpdate` runs `publish`, which rebuilds the picker views, the stream view, the panes view and the top bar's values and writes seven stores (`picker`, `find`, `stream`, `panesStore`, `chrome`, `firstRun`, `topBar`). The stream view is a new object every time, so the `stream` store notifies every lens that reads it. `notePaneDrawn` serialises each pane's drawn state with `JSON.stringify` to see whether it changed. With a find query set, `computeViews` filters every envelope (`streamRows(envelopes).filter(...)`) on every commit.

**Missing.**
- *Selectors.* A store read by many components is cheap when each reader selects the slice it draws and re-renders only when that slice changes: React Redux's `useSelector` "will do a reference comparison of the previous selector result value and the current result value … If they are the same, the component will not re-render" (redux.js.org, "Hooks"). Here readers take the whole snapshot, and the root component takes every pane's snapshot, so every change anywhere re-renders the root and re-derives everything below it.
- *A render that skips unchanged inputs.* The root re-renders on every change with no `shouldComponentUpdate` or memoised derivation; `publish` rebuilds every view whether its inputs changed or not.
- *Scheduling.* All of this runs synchronously per change. React's way to keep urgent work responsive under heavy updates is to mark the heavy ones non-blocking (`useTransition`), but "mutations to the external store cannot be marked as non-blocking Transition updates" (react.dev, "useSyncExternalStore", caveats). So the coalescing has to happen before the store: the controller applies a batch of envelopes and notifies once.
- *An error boundary.* No component in the window defines `getDerivedStateFromError` or `componentDidCatch`. React 18 removes the whole tree when a render error reaches the root (react.dev, "Catching rendering errors with an error boundary"), so any throw during render empties the window. This is a second route to an empty window, distinct from the page dying.

### 2.4 The transcript: every row in the DOM, laid out after every commit

*Read: `web/reveal/transcript/Transcript.tsx`, `Row.tsx`, `ToolCard.tsx`, `ProgressStream.tsx`, `useScrollAnchor.ts` (whole).*

**The pattern.** A list rendered in full, each row a memoised component keyed by call or seq (`React.memo` on `Row`, `ToolCard`, `ProgressStream`), with a scroll anchor that keeps the reader's place: follow the bottom, hold the top row while reading, hold a clicked card header. The anchor sets `overflow-anchor: none` on the scroller and does the anchoring itself.

**What the code does.**
- `Transcript` filters and maps every row on each commit; `buildResultByCallId` walks the whole transcript whenever it changes (every envelope that adds a row).
- `useScrollAnchor` runs `place` in a `useLayoutEffect` with no dependencies, so after every commit, before paint. `place` reads `clientHeight`, `scrollTop`, `scrollHeight` and `getBoundingClientRect()`; each read after a DOM change forces the browser to lay out the document there and then. Over 340 s of replay this was 94.7 % of the page's time (§ 1).
- A running call's card is open (`defaultOpen(mode, toolRunning)`), and a call being replayed counts as running until its result arrives. Its stream is in the DOM whole — one text node, or `TerminalText`'s spans up to `TERMINAL_MAX` (200,000 characters) — inside a box of `maxHeight: 220`. The box crops what is painted, not what is laid out: every chunk changes the text, and the next forced layout lays out all of it again. For seq 6519, 2.65 MB.

**Missing.**
- *Windowing.* A long list draws only the rows near the viewport: React's "Optimizing Performance" guide, "Virtualize Long Lists", recommends windowing, which renders "a small subset of your rows at any given time" and cuts the DOM nodes created (legacy.reactjs.org; libraries `react-window`, `react-virtualized`). Here the DOM holds every row of the session, and "larger DOMs will generally incur higher layout costs" (web.dev, "Avoid large, complex layouts and layout thrashing").
- *Reading layout once per frame.* The same web.dev guide: "you should always batch your style reads and do them first", then the writes; a read after a write forces a synchronous layout, and repeated, it thrashes. Here each commit reads and writes layout, once per envelope.
- *A bounded output view.* A terminal or output panel keeps a bounded buffer and draws what fits (xterm.js `scrollback`, default 1,000 lines; VS Code's terminal scrollback setting); the full text, if kept, lives outside the DOM. Here the whole stream is the DOM's text.

### 2.5 The signal path: one record, one IPC message, one synchronous write and check

*Read: `web/vm/instrumentation/sdd.ts` (whole); `electron/preload.ts` line 76; `electron/main.ts` lines 50–135, 268–284.*

**The pattern.** Structured, typed event logging to an append-only file per process (SDD foundation 02's signal buffer, with a runtime checker over the stream, `electron/invariants.ts`). The window keeps a ring buffer of the latest `SIGNAL_CAP` (10,000) records and sends each record to main, which stamps it and appends it to `window-<id>.jsonl`.

**What the code does.** Per `emit` in the page: a `sessionStorage.setItem` of the record counter; at the cap, `buffer.splice(0, 1)`, which moves 10,000 entries; one `ipcRenderer.send`. Per record in main: `fs.writeSync` to the window file; then `checkRecord`, which first calls `readServerRecords` — `openSync`, `fstatSync`, a read when the file grew, `closeSync` of `server.jsonl` — then runs the checker. During the replay the page wrote about two records per envelope (28,137 records at 14,058 envelopes; `STREAM_ENVELOPE_APPENDED` and `TRANSCRIPT_ROW_SKIPPED` for each), so main did at least four file system calls on its own thread per record while the backlog streamed.

**Missing.**
- *Batching and an asynchronous sink.* Log pipelines buffer records and write them off the hot path (Node's own guidance against synchronous file APIs on a server's event loop, nodejs.org "Don't Block the Event Loop"; Electron's "Performance" guide on not blocking the main process). Here each record is its own IPC message and its own synchronous write, on the thread Electron's guide calls the UI thread. At the replay's rate main still answered within 4 ms (§ 2.6), so this is a breach of the guidance whose cost grows with the record rate, not the cause of the grey screen or of the quit.
- *A ring buffer.* `splice(0, 1)` on a full array is linear; a ring buffer's append is constant time.
- *Sampling or aggregation for per-envelope tags.* Two records per envelope make the trace's volume the record's volume. The kit's own strata name the alternative: event-stratum tags per occurrence, summary-stratum tags per boundary (`grammar/PRINCIPLES.md` commitment 5). A backlog of 28,513 envelopes is one attach; its per-envelope records are a summary's worth of information written 57,000 times.

### 2.6 The processes: main supervises the server, nothing supervises the page

*Read: `electron/main.ts` lines 660–705 (the window), 860–905 (the quit); lines 345, 476–491 (the server's kill); the rest of `main.ts` was read before this note (941 lines) and is not restated.*

**The pattern.** Electron's multi-process model (electronjs.org, "Process Model"): main owns the windows and the native menu; each window's page runs in its own renderer process; the backend is a child process main starts. The page is configured to Electron's security checklist: `contextIsolation`, `sandbox`, `nodeIntegration: false`, `webSecurity` (electronjs.org, "Security"). Main supervises the backend in the manner of a one-for-one supervisor (Erlang/OTP design principles, "Supervisor Behaviour"): it starts it, notices its death (`onBackendDied`), and on quit stops it with SIGTERM and, after `KILL_GRACE_MS` (45 s), SIGKILL.

**What the code does.** For the page, main listens and records: `render-process-gone` writes `RENDERER_GONE`; `unresponsive` and `responsive` write `WINDOW_UNRESPONSIVE` and `WINDOW_RESPONSIVE`; `preload-error` writes `WINDOW_FAULTED`. It does nothing else: a dead page stays dead, a hung page stays hung. On quit, `before-quit` holds the quit until the server exits (sprint 519's clocks: sweep 30 s, server exit 40 s, SIGKILL 45 s), then quits.

**Missing.**
- *A restart for the page.* A supervisor's part is the restart, not the notice. The page's state is a projection of records the server holds, so a new page can rebuild it: the reload costs a replay, which § 2.2–2.4 make expensive, and which a bounded window makes cheap.
- *A user-facing account of the death.* The window shows grey and says nothing; the user learns of it by trying to type.
- *A quit that does not wait on the page.* A ⌘Q that never reaches `before-quit` leaves no `APP_QUIT_REQUESTED` (the report: "sometimes refuses to quit"). During a replay main's thread is not what holds it: through 75 s of the replay, including its fastest stretch (about 2,000 envelopes and 4,000 window records a second), the longest round trip of an empty `app.evaluate` was 4 ms (`harness/replay_memory.ts`, `REPLAY_LAG=1`). During a live stream main is idle too (§ 8). The remaining candidate is the page: Chromium on macOS offers most ⌘-keys to the page before the menus ("Websites can override most hotkeys"; `keyEvent:wasKeyEquivalent:` forwards them to the renderer, and the menus get only those it did not consume), and exempts the ones "that can't be overridden such as File->New and Chrome->Quit" (Chromium, `docs/mac/about_hotkeys_and_keycodes.md`). Whether Electron's Quit item is exempt the same way was not established from any source; if it is not, a page 95 % busy with layout holds ⌘Q until it answers. § 6 names the test.

### 2.7 The other views over the log: derived again from the whole list on each change

*Read: `web/app/editor/Centre.tsx` lines 722–727, `LeftTabs.tsx` 50–55, `Inspector.tsx` 118–130, `EditorView.tsx` 95–110 (`Follow`), `web/reveal/activity.ts` 60–110 (`scanActivity`).*

**The pattern.** Derived data computed at render from the snapshot, memoised on the input's identity (`React.useMemo`).

**What the code does.** Each reader takes the whole `rawEnvelopes` and walks it: `Centre` filters it for tool results and hand writes on every render; `LeftTabs` (`activityFiles`), `Inspector` (`fileActivity`, `fileHistoryState`) and `Follow` (`followItems`) memoise on the array, which is a new array after every envelope (§ 2.2), so the memo recomputes over the whole log once per envelope; `scanActivity`, the activity line under each pane, scans backwards for the last message and stops early, but on a failed turn walks every envelope twice.

**Missing.** *Indexes kept by the projection.* What these views ask — the files a session touched, one file's history, the last message and the last end — are questions a read model answers from indexes it updates as each event is applied (the CQRS read-model shape of § 2.2), not by re-reading the log. With the array copied per envelope, `useMemo` on it memoises nothing.

---

## 3. What the patterns add up to

Every part of the window is a recognisable pattern, and every part has the same omission: it was built so that each change re-derives the state from everything held, and nothing it holds is ever let go. That is the shape of a prototype — correct, legible, easy to change, and sized for the records it was tried on, tens to hundreds of envelopes. At the size Substrate Next now holds (28,513 envelopes, a 2.65 MB stream in one call), each re-derivation is linear in the session, a backlog is quadratic, and the page runs out of memory.

The standard parts that make each pattern production-sized are well known and absent:

| Part | Pattern | Missing standard part |
|---|---|---|
| The stream (§ 2.1) | Server-Sent Events | flow control and batching at the boundary; resume by event id |
| The controller (§ 2.2) | Presentation Model over an event-sourced log | incremental projection; one copy and one notification per batch; bounds on what a pane holds |
| The stores (§ 2.3) | external stores through `useSyncExternalStore` | selectors; skipping unchanged inputs; coalescing before the store; an error boundary |
| The transcript (§ 2.4) | memoised list with a scroll anchor | windowing; layout read once per frame; a bounded output view |
| The signal path (§ 2.5) | typed event log to a file | batched, asynchronous writes off main's thread; a ring buffer; summary records for per-envelope events |
| The processes (§ 2.6) | Electron's process model; one-for-one supervision of the server | a restart for the page; telling the user; a quit that does not wait on the page (unverified, § 6) |
| The views (§ 2.7) | memoised derivation | indexes kept by the projection |

The grey screen of 2026-11-18 is § 2.2–2.4 together, with § 2.6's missing restart: one long stream, folded and redrawn whole per chunk, laid out whole per commit, until the page died and nothing brought it back.

---

## 4. Against the established practice for this kind of app

The window is an Electron desktop app that streams a long, growing event log and command output into React views. Each claim below was checked on 2026-11-19 against the source named: the framework's own documentation, a browser standard, or the source code of an app solving the same problem. Vendor documentation is the vendor describing its own tool, which is the right authority for how that tool behaves; it is not evidence that the tool is a good choice, and no such claim is made here.

**Electron, process model and security: followed.** The window's `webPreferences` meet the security checklist's items on Node integration, context isolation, process sandboxing and `webSecurity` (electronjs.org, "Security", items 2, 3, 4, 6), and `web/reveal.html`'s policy is `default-src 'self'; script-src 'self'` (item 7). Electron is `^44.4.5` (item 16 asks for a current version). The `native:signal` handler does not check `event.senderFrame` (item 17, "Validate the sender of all IPC messages"); it looks up the window by `event.sender` only to name the file. That is the one open item, and a small one for an app that loads only its own page.

**Electron, performance: not followed in the main process.** The guide's third item, "Blocking the main process": "Under no circumstances should you block this process and the UI thread with long-running operations", and "Avoid using blocking I/O operations in the main process", preferring the asynchronous `fs` calls; input reaches the window through main ("When the operating system tells your app about a mouse click, it'll go through the main process before it reaches your window"). Main runs `fs.writeSync` and an open-stat-read-close of `server.jsonl` per window record (§ 2.5). Node's guide says the same for any server loop: "Do not use the synchronous file system APIs" (nodejs.org, "Don't Block the Event Loop").

**Electron, the renderer: not followed.** The guide's fourth item, "Blocking the renderer process": run work "as quickly as possible without taking away resources needed to keep scrolling smooth", with small work in `requestIdleCallback` and heavy work in Web Workers. The window folds and redraws on the main thread, per envelope, with no yield (§ 2.2–2.4).

**React: partly followed.** External stores through `useSyncExternalStore` with immutable snapshots are what react.dev describes ("The store snapshot returned by `getSnapshot` must be immutable"). Missing against React's own guidance: windowing for long lists (legacy.reactjs.org, "Optimizing Performance", "Virtualize Long Lists"); error boundaries ("By default, if your application throws an error during rendering, React will remove its UI from the screen", react.dev, `Component`, "Catching rendering errors with an error boundary"); and, because store mutations "cannot be marked as non-blocking Transition updates" (react.dev, `useSyncExternalStore`, caveats), batching before the store, which Redux's style guide names directly ("Avoid Dispatching Many Actions Sequentially": each dispatch "triggers store subscribers and UI updates").

**The browser: not followed.** Server-Sent Events define an `id` field and send it back as `Last-Event-ID` on reconnection (WHATWG HTML, "Server-sent events"); the server sends none. The standard defines no flow control, so pacing a backlog is the application's job, and the window does not do it. Layout: "you should always batch your style reads and do them first" and "larger DOMs will generally incur higher layout costs" (web.dev, "Avoid large, complex layouts and layout thrashing"); the transcript reads and writes layout once per envelope over a DOM holding the whole session.

**Apps that solve the same problems: not followed.**
- *Command output is bounded.* xterm.js keeps `scrollback` rows, "Defaults to 1000" (xtermjs.org, `ITerminalOptions`). VS Code's terminal setting "Controls the maximum number of lines the terminal keeps in its buffer … as the value increases, so will the amount of memory", default `1000` (VS Code source, `terminalConfiguration.ts`). The window keeps every byte of every stream in the DOM.
- *A dead or hung window is handled.* VS Code's main process (`windowImpl.ts`) listens for `render-process-gone` and shows "The window terminated unexpectedly (reason: '{0}', code: '{1}')" with "Reopen" and "Close"; Reopen opens a new window on the same workspace, optionally without restoring editors. For `unresponsive` it samples the page's call stacks and offers "Reopen", "Close" and "Keep Waiting". The window records both events and does nothing.

**Verdict.** The process model and the security posture are production-shaped. The data path is not: it scales with the session's length at every stage, holds everything without bound, and has no recovery when it fails. "Truly productionized" fails on memory, on the page's thread budget, on the main process's synchronous I/O, and on supervision of the page.

---

## 5. Design questions this raises

Each is settled here on the grounds where the grounds settle it (AGENTS.md, "Resolve-and-record"); the roadmap records the decisions. Questions 1 and 2 are F1's; the rest are F2–F5's.

1. **Where is a command's output cut free of the run's work?** At its source. The `bash` tool already writes the whole output to a file (`TABLE.new_files`) and gives the model a capped copy; what it adds is one `ToolProgress` event per line onto the run's inbox. The tool posts its progress in pieces bounded by time and size instead of by line, so a command that prints 20,000 lines adds tens of events to the run, not 20,000, and the record still holds every byte. `ToolProgress` is defined as "a chunk of a running tool's output" with a running byte `offset` (`tool_loop/__init__.py`): a larger chunk keeps that contract. The bounds, and whether progress should travel on the run's ordered inbox at all, are the kernel's decision, recorded as one.
2. **What does the window receive for a running command?** What a person uses: the command, its running time, its bytes and lines so far, its rate, and its last lines, updated at a pace the eye can follow; the whole output on request from the record. The window never takes every line of a large output.
3. **What does a pane hold?** The record is the system of record and stays whole on disk and on the server. A pane holds what it draws: the transcript's rows (small, one per message, reply and call) and, per call, a bounded tail of its stream — the published default is 1,000 lines (xterm.js, VS Code) — with the full output fetched from the record when the user opens it. `rawEnvelopes` as a whole-session array goes; the views that read it (§ 2.7, and meta's lenses through the `stream` store) read indexes the projection keeps, or a bounded window. Open within it: how meta's lenses, which today draw the whole stream, page through 28,513 envelopes.
4. **Where are envelopes batched?** At the controller: envelopes from the stream go into a queue; the queue is folded and the snapshot published once per animation frame, and a backlog is folded in slices that yield between frames. Grounds: Redux's one-update-per-transaction rule; React's caveat that store updates are synchronous; Electron's guidance on not blocking the renderer; and the measurement that the fold alone takes 1.9 s for 28,513 envelopes, so a batched client-side fold is enough and the server need not serve a projection.
5. **How is the transcript drawn?** Windowed: only rows near the viewport are in the DOM. The scroll anchor's three behaviours (follow, hold the reading row, hold a clicked header) carry over, and its layout reads happen once per frame. Whether to adopt a library (`react-window`, `react-virtuoso`) or write the windowing is a dependency decision, recorded as such (AGENTS.md: a new dependency is an agent-resolved decision).
6. **What happens when the page dies or hangs?** Main restarts the page, as a supervisor would, and says so: VS Code's form — a dialog naming the reason with Reopen and Close — is the comparable app's answer. A page that dies again soon after a reopen needs a guard against a crash loop. Whether the reopen is automatic or asked is a product choice; the recommendation is VS Code's (asked), since a crash on the same session would otherwise repeat.
7. **What do the per-envelope signals become?** `STREAM_ENVELOPE_APPENDED` and `TRANSCRIPT_ROW_SKIPPED` fire per envelope, which makes the trace as large as the record. A batch is a natural boundary for a summary-stratum record (the kit's strata, `grammar/PRINCIPLES.md` commitment 5); that is a vocabulary change, proposed and ratified as one, and the gates that count the per-envelope tags move with it.
8. **How does main take records?** Batched from the page (one IPC message per frame, not per record) and written asynchronously, with the invariant checker fed from the batch and `server.jsonl` read on the timer alone, not per record.
9. **What does the window promise, as numbers?** Each requirement of § 0.1 as a budget a gate checks (§ 7's gate shape): the window stays up and under a working-set ceiling on any record; a running command's card updates and input answers within the 200 ms the INP bands call good; memory after a collection stays flat across many turns; a turn's time does not grow with how much its commands print.

---

## 6. What the research still needs

- **⌘Q while the page is busy.** Main's thread does not hold the quit (§ 2.6). To judge it: a real ⌘Q key event (System Events, `keystroke "q" using command down`) sent to a focusable window while the page is busy, timed to `APP_QUIT_REQUESTED`, against an idle control. It needs a focused window on the screen, so it runs when the screen is free. If ⌘Q waits on the page, F2's fix is the quit's fix.
- **Main during a live stream: answered.** macOS `sample` of main's process for 5 s at 10 s and at 40 s into a live 20,000-line stream: 4,224 of 4,277 and 4,271 of 4,327 samples of its main thread wait in `mach_msg` for the next event. Main is idle; the harness's calls that did not return in the earlier runs were held between the harness and main, not by main's work (§ 8).
- **The turn that did not return.** In a session of short turns (one `echo` each), turn 44 did not come back within 120 s, with the page at 194 MB and 3,676 DOM nodes (§ 8). That run came straight after six 20,000-line stream runs, and its scratch state was not kept. Run again on 2026-11-20 with the state kept, 80 and then 200 short turns completed with no stall. It stays recorded as seen once, cause not found.

The gates themselves are the roadmap's first items, not research (§ 7 gives their shape, § 5 question 9 their budgets).

---

## 7. The tests the project lacks

The project's checks are behavioural: 443 Python tests, 255 client specs, 166 gate scripts. Each asks whether the window did the right thing; none asks how long it took or how much it held, and every one runs on a record of tens to hundreds of envelopes. The class missing is performance and resource tests, on sessions the size the app is used at, held to budgets. What follows is the established practice for that class, from the sources.

**Responsiveness.** The browser defines three measures, each readable in the page:
- *Long tasks*: "tasks that occupy the main thread for 50 milliseconds or longer" (Chrome, "Long Animation Frames API").
- *Long animation frames*: "when a rendering update is delayed beyond 50 milliseconds". Each `long-animation-frame` entry gives its `duration`, its `blockingDuration` ("the total duration … for which the animation frame would block processing of input"), and per script its `sourceURL`, `invoker` and `forcedStyleAndLayoutDuration` ("the total time spent processing forced layout and style inside this function") — the measure that names § 1's 94.7 % directly. Chrome keeps the Long Tasks API beside it ("no plans to deprecate").
- *Input delay*: Event Timing records each input's `startTime`, `processingStart`, `processingEnd` and `duration`; "an Event's delay can be computed as processingStart - startTime"; entries are buffered from 104 ms by default, and a `durationThreshold` down to 16 ms can be asked for (W3C, "Event Timing API"). Interaction to Next Paint, which covers clicks, taps and key presses, splits an interaction into input delay, processing and presentation, and calls 200 ms or less good and over 500 ms poor (web.dev, "Interaction to Next Paint"). Those bands are set for web pages in the field; they are the nearest published figure for a desktop window's keystroke.

**Memory.** Chrome DevTools separates three problems by what the user sees: a leak ("progressively use more and more memory over time"), bloat ("more memory than is necessary"), and frequent garbage collection ("all script execution is paused"). Its tools: the task manager's two columns, "Memory footprint" (the OS's) and "JavaScript Memory" (the heap); the Performance panel's memory track, to be started and ended "with a forced garbage collection"; heap snapshots, with "Detached DOM nodes" as "a common cause of memory leaks"; and the allocation timeline (Chrome, "Fix memory problems"). `performance.measureUserAgentSpecificMemory()` estimates "JavaScript and DOM memory" where `performance.memory` gives the heap alone, but needs cross-origin isolation (web.dev, "Monitor your web page's total memory usage").

**The heap limit under Electron.** Electron enabled V8 pointer compression in Electron 14, under which "the V8 heap is limited to a maximum size of 4GB"; no setting raises it short of a custom build (electronjs.org blog, "Electron and the V8 Memory Cage"). § 1's page held 3,183–3,204 MB of heap before it died: within reach of that limit. Electron reports a page that ran out of memory as `render-process-gone` reason `oom` ("Process ran out of memory"), apart from `crashed` ("Process crashed") (electronjs.org, `RenderProcessGoneDetails`). Ours was `crashed`, exit 5; why an exhausted heap reports as `crashed` here is for § 8 to settle from the crash report.

**How a comparable app tests this.** VS Code's repository carries both kinds:
- `perf:chat` (`scripts/chat-simulation/test-chat-perf-regression.js`) drives the chat against a mock model and measures, per run: time to first token and to complete; layout count, forced style recalculations and layout duration (from DevTools `Performance.getMetrics` and a trace's `Layout` events); long tasks (`RunTask` over 50 ms) and long animation frames; heap before and after a forced collection; garbage-collection pause time. Five runs per scenario, medians, compared with a baseline build; a gating metric (time to first token, time to complete, layout duration, forced reflows, long tasks) fails when it is more than 20 % worse and Welch's t-test calls the difference significant; too few runs is reported as inconclusive, with the runs needed. It measures no input delay.
- `perf:chat-leak` (`test-chat-mem-leaks.js`) runs every chat scenario three times, forcing two collections before each heap reading (`HeapProfiler.collectGarbage`), counts DOM nodes, drops the first iteration as warm-up, and fails when the heap after the rest has grown more than 5 MB. Its own skill note describes a regression slope ("A slope above 2 MB/msg indicates a leak"); the script as written uses the residual, not a slope.
- Unit suites call `ensureNoDisposablesAreLeakedInTestSuite()`, and the leak note's rule is that object counts "stabilize (don't grow linearly with usage)".
Meta's MemLab does the same with heap snapshots around a scripted interaction (Puppeteer).

**Budgets.** "A performance budget is a set of limits imposed on metrics that affect site performance" (web.dev, "Performance budgets 101"). VS Code's practice adds what web.dev leaves out: repeated runs, medians, a significance test before a regression fails a build.

**What this gives the project.** One gate shape, VS Code's, applied to the window: a scripted scenario on a hand-written record sized like real use; per run, long animation frames with their forced-layout time, long tasks, input delay from Event Timing, layout and reflow counts, heap after a forced collection, DOM nodes, every process's working set; five runs, medians, a budget per metric, a significance test before a fail. The growth check is the same repeated action measured after a forced collection each time, its verdict the growth after warm-up.

---

## 8. Measured as used

*Taken 2026-11-19 with `harness/replay_memory.ts`. Numbers only; the session's contents stay on the machine.*

**A fault in the probe, found and fixed.** A session's `manifest.json` names its record by absolute path (`record_root`). The probe copied the session folder into its scratch state but left that path, so the server streamed the original record in `~/.substrate-next` — read only; its size, line count and modification time are unchanged (10,584,803 bytes, 28,513 lines, Nov 18 14:34). Every replay in § 1 is therefore a replay of the whole record, which is what § 1 describes; only the runs that meant to cut the record short were wrong, and they are not used. Since 10:20 the copy's manifest points at the copy.

**The page's death is at one place in the record.** Three replays of the whole record died with `RENDERER_GONE` `crashed`, exit 5, the last envelope taken in seq 14,137 each time (§ 1's two, and one at 18:03 on 2026-11-19). The installed Substrate Next died the same way three times on 2026-11-18.

**Held or garbage: garbage.** With the record cut to n envelopes, the page takes them all in, goes idle (CPU under 1 % for 30 s), answers DevTools within 2 ms, and a full collection (`HeapProfiler.collectGarbage`) returns at once:

| Envelopes | Took in (s) | Heap before collection | Heap after | Peak working set | Working set idle | Longest stream held | DOM text |
|---|---|---|---|---|---|---|---|
| 7,000 | 10 | 154 MB | 110 MB | 0.96 GB | 0.56 GB | 48,427 chars | 1.07 M chars |
| 10,000 | 82 | 1,002 MB | 112 MB | 4.99 GB | 1.60 GB | 438,622 chars | 1.46 M chars |
| 13,000 | 257 | 1,728 MB | 114 MB | 8.53 GB | 1.80 GB | 822,632 chars | 1.84 M chars |

What the page holds stays near 110 MB from 7,000 to 13,000 envelopes: 341 transcript rows, 100 streams, 44,767 elements and 76,273 DOM nodes, 287 listeners, at each size (the transcript gains no rows between them; the envelopes are the long call's chunks). The heap's growth is garbage made faster than it is collected while the page is pegged — Chrome's "frequent garbage collections" and "memory bloat", not a leak (§ 7). The heap of 3.2 GB in § 1 was the page still working.

**Outside the heap.** At 13,000 envelopes, idle, macOS `footprint` gives the page 443 MB dirty: 307 MB under what it calls "app-specific tag 16" and 124 MB under "app-specific tag 14", with 1,204 MB more of tag 14 reclaimable. XNU numbers those tags from `VM_MEMORY_APPLICATION_SPECIFIC_1` (240) to `_16` (255) (`osfmk/mach/vm_statistics.h`), so they are tags 255 and 253; Chromium tags its pages `kPartitionAlloc = 253` (Blink's DOM, strings and layout objects) and `kV8 = 255` (V8 heap pages) (`base/allocator/partition_allocator/page_allocator.h`). The working set of 1.8 GB is therefore mostly PartitionAlloc pages freed but not yet returned to the system, left by the churn; the peak of 8.53 GB during the work is the danger, not what remains after it.

**The crash reports.** macOS wrote three for the installed Substrate Next on 2026-11-18 — 11:39, 14:40 and 19:10, the last a third death not counted before — and none for the source-mode runs. Each is `EXC_BREAKPOINT` / `SIGTRAP` ("Trace/BPT trap: 5"), the deliberate trap Chromium raises on a fatal check, out of memory included; the faulting instruction is the same in all three (offset `0x5b27184` in `Electron Framework` 44.4.5). The release binary carries no symbols; Electron's published symbols for 44.4.5 (`electron-v44.4.5-darwin-arm64-dsym.tar.xz`, `Electron Framework.dSYM`, UUID `4C4C44ED-5555-3144-A1CB-427AA45E6F33`, the reports' own) name every frame with `atos`. All three deaths are the same:

```
partition_alloc::internal::OnNoMemoryInternal            oom.cc:85
v8::internal::V8::FatalProcessOutOfMemory                api.cc:289
v8::internal::FactoryBase::NewRawTwoByteString           factory-base.cc:905
v8::internal::Runtime_FlattenString                      runtime-strings.cc:525
  (12 frames of JIT-compiled JavaScript)
blink::scheduler::EventLoop::RunPendingMicrotask         event_loop.cc:172
blink::JSEventHandler::InvokeInternal                    js_event_handler.cc:135
```

The page died of V8 out of memory while flattening a string: script running in a microtask, after a DOM event handler, needed a string built by concatenation as one flat run of characters, and the copy could not be allocated. That is the stream's text as § 2.2 describes it — `prior.text + chunk` per chunk, a rope that any reader needing the characters (a regular expression, the DOM) copies whole — inside the microtask in which React 18 flushes a synchronous render (the external store's update), after the stream's message event. The JavaScript frames cannot be named from a crash report; the native frames on either side fix the path. Electron reported it `crashed`, not `oom`; the process ended by Chromium's deliberate trap (`EXC_BREAKPOINT`), and why Electron's `render-process-gone` does not call that `oom` on macOS was not established. The last heap readings before a death were 3,183–3,204 MB, under V8's 4 GB limit under pointer compression (§ 7) by less than the size of the copies being made.

**Live use, 2026-11-19 (`harness/measure_window.ts`, source build, sessions made through the server on scratch state).** The page's JavaScript heap limit is 4,192 MB (`performance.memory.jsHeapSizeLimit`), the 4 GB cap of § 7. Two scenarios gave usable numbers:
- *One turn whose `bash` command prints 20,000 lines* (six runs; three of them also meant to type into the input bar). Five turns returned within the harness's 600 s limit and one did not; their exact durations were not recorded (below). After each, the page was still at 5.7–5.8 % CPU, its working set 2.56–3.53 GB and its macOS footprint 2.07–3.10 GB, from 118 MB at the start; DevTools counted 1,167–1,466 layouts taking 8.5–11.3 s and 0.36–0.56 s of script. The page survived all six.
- *Short turns, one `echo` each.* After a full collection the heap was 5, 9 and 11 MB at turns 1, 20 and 40; the DOM grew from 205 to 3,676 nodes (89 per turn, the transcript's rows, never let go); the page's working set from 128 to 194 MB. Turn 44 did not return within 120 s (§ 6).

What these runs did not measure, and why: the harness's per-sample read of the processes' memory (`app.evaluate` in main, with no time limit) did not return while a 20,000-line stream ran, so the samples stopped after the first and the turns' durations were lost — main itself was idle (below), so the call was held between the harness and main; and the typing never started, because the harness waited for the page to report a stream and the busy page did not answer in time. Input delay during a stream is therefore still unmeasured. The harness now bounds every call (`harness/measure_window.ts`).

**Short turns, 2026-11-20 (200 turns, one `echo` each, scratch state kept).** Every turn completed. Growth per turn by least squares: the heap after a full collection 0.14 MB, the DOM 89 nodes, the page's working set 1.5 MB (128 → 431 MB at turn 200, 17,916 DOM nodes); the backend's resident memory from 118 to 287 MB. The turns themselves slow as the session grows, though each writes the same 30 envelopes: from the record's own timestamps, the kernel's part of a turn (its `UserMessage` to its `Returned`) took 0.13 s at turn 0, 0.42 s at turn 95 and 0.65 s at turn 199, and the gap from one turn's end to the next turn's start (the request's round trip and the session's resumption on the server) 0.03 s early and 1.25–1.49 s at the end. That is backend time growing with the session's length — the class of flaw F1 and F2 belong to, per-turn work over everything held — in the kernel and the server, outside the window. The kernel's research on a turn's bootstrap (`2026-11-18-core-stalls/RESEARCH-2026-11-18-bootstrap-time.md`) found that each resumed turn reads, decodes and folds the whole record — about 2 s of an 8.84 s bootstrap on an 11,882-envelope record, the other 5.35 s a token count kernel 357 since removed — so a turn's cost still grows with the record. That belongs to the kernel's roadmap, not this one; it is recorded here because the window's measurements found it.

**One live stream with its record kept, 2026-11-20.** One turn whose `bash` command prints 20,000 lines, every harness call bounded, the scratch state kept. From the record: message to tool call 0.02 s; call to first progress 0.06 s; 14,482 `ToolProgress` events between the first and the last in 0.96 s (the kernel's reader posts one per line of each read, the remainder in its last chunk); result to `Returned` 0.95 s; the turn 1.99 s in all, 14,534 envelopes. The server reported the session `parked` at the first sample, 4 s in. The page then ran two long tasks totalling 158.6 s, the longer 117.7 s, and did 1,682 layouts taking 9.4 s; the harness's summary, which waits on the page, came at 153 s. macOS `sample` of main at 10 s and 40 s: its main thread idle, 98.8 % and 98.7 % of samples waiting in `mach_msg`.

---

## Sources

Checked 2026-11-19 (§ 7's sources, round 2).

- Electron, "Performance": https://www.electronjs.org/docs/latest/tutorial/performance
- Electron, "Security": https://www.electronjs.org/docs/latest/tutorial/security
- Electron, "Process Model": https://www.electronjs.org/docs/latest/tutorial/process-model (named, not quoted)
- React, `useSyncExternalStore`: https://react.dev/reference/react/useSyncExternalStore
- React, `Component`, error boundaries: https://react.dev/reference/react/Component
- React, "React v18.0" (automatic batching): https://react.dev/blog/2022/03/29/react-v18
- React (legacy), "Optimizing Performance": https://legacy.reactjs.org/docs/optimizing-performance.html
- Redux, style guide: https://redux.js.org/style-guide/
- React Redux, hooks: https://redux.js.org/react-redux/api/hooks
- WHATWG HTML, "Server-sent events": https://html.spec.whatwg.org/multipage/server-sent-events.html
- web.dev, "Avoid large, complex layouts and layout thrashing": https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing
- Node.js, "Don't Block the Event Loop": https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop
- xterm.js, `ITerminalOptions.scrollback`: https://xtermjs.org/docs/api/terminal/interfaces/iterminaloptions/
- VS Code source, `src/vs/workbench/contrib/terminal/common/terminalConfiguration.ts` and `src/vs/platform/windows/electron-main/windowImpl.ts`: https://github.com/microsoft/vscode (main branch)
- Chrome, "Long Animation Frames API": https://developer.chrome.com/docs/web-platform/long-animation-frames
- W3C, "Event Timing API": https://w3c.github.io/event-timing/
- web.dev, "Interaction to Next Paint": https://web.dev/articles/inp
- Chrome DevTools, "Fix memory problems": https://developer.chrome.com/docs/devtools/memory-problems
- web.dev, "Monitor your web page's total memory usage": https://web.dev/articles/monitor-total-page-memory-usage
- Electron blog, "Electron and the V8 Memory Cage": https://www.electronjs.org/blog/v8-memory-cage
- Electron, `RenderProcessGoneDetails`: https://www.electronjs.org/docs/latest/api/structures/render-process-gone-details
- VS Code source: `package.json` scripts; `scripts/chat-simulation/test-chat-perf-regression.js`; `scripts/chat-simulation/test-chat-mem-leaks.js`; `.github/skills/memory-leak-audit/SKILL.md` (https://github.com/microsoft/vscode, main branch)
- MemLab: https://meta.github.io/memlab/docs/intro
- web.dev, "Performance budgets 101": https://web.dev/articles/performance-budgets-101
- XNU, `osfmk/mach/vm_statistics.h`: https://github.com/apple-oss-distributions/xnu
- Chromium, `base/allocator/partition_allocator/page_allocator.h` (`PageTag`): https://chromium.googlesource.com/chromium/src/+/409171a15c94de09732e92e5ea04590647945b4a/base/allocator/partition_allocator/page_allocator.h
- Chromium, `docs/mac/about_hotkeys_and_keycodes.md`: https://chromium.googlesource.com/chromium/src/+/ca82da4b11/docs/mac/about_hotkeys_and_keycodes.md
- Named as pattern definitions, not quoted: Fowler, "Presentation Model" (2004) and "Event Sourcing" (2005); Gamma, Helm, Johnson, Vlissides, *Design Patterns* (1994), Observer; Cockburn, "Hexagonal Architecture" (2005); Erlang/OTP Design Principles, "Supervisor Behaviour".
