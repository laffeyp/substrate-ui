# The window layer, productionized — research

*2026-11-19. Asked 2026-11-18 (BLACKBOARD, two `user` entries): the grey screen and the ⌘Q that sometimes does not quit are cases of one finding, that the window layer is still partly prototype. This note names the patterns the window's code actually follows, read from the code; the standard parts of each that are missing; the design questions that raises; and, in its second part, the architecture against the published practice for an Electron app of this type. The roadmap and cards follow from it. Written while reading; each part says which files it was read from.*

---

## 1. What was measured

All numbers are from `harness/replay_memory.ts`: the source-mode app on a scratch state root holding a copy of one session folder, the session opened the way a `substrate://session/<id>` link opens it, the renderer's working set from `app.getAppMetrics()` and its JavaScript heap from DevTools `Runtime.getHeapUsage`. The session is a long one on this machine (28,513 envelopes, 10.8 MB of record); its contents stay on the machine.

- **The page dies holding the session.** 351 s after the link, at 14,137 of the 28,513 envelopes, the page crashed (`RENDERER_GONE`, reason `crashed`, exit 5): the same event the installed Substrate Next wrote twice on 2026-11-18. The working set rose from 0.55 GB at 4,163 envelopes to a peak of 8.67 GB. A second run, stopped at 7,000 envelopes for a profile, crashed at 14,058.
- **The heap holds gigabytes.** 81 MB after a full collection at 4,859 envelopes; 3,183 MB at 11,911 (no collection forced). Whether the 3 GB is held or not yet collected is not measured: forcing a collection at that size did not return.
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
- *A quit that does not wait on the page.* A ⌘Q that never reaches `before-quit` leaves no `APP_QUIT_REQUESTED` (the report: "sometimes refuses to quit"). Main's thread is not what holds it: through 75 s of the replay, including its fastest stretch (about 2,000 envelopes and 4,000 window records a second), the longest round trip of an empty `app.evaluate` was 4 ms (`harness/replay_memory.ts`, `REPLAY_LAG=1`). The remaining candidate is the page: Chromium on macOS offers most ⌘-keys to the page before the menus ("Websites can override most hotkeys"; `keyEvent:wasKeyEquivalent:` forwards them to the renderer, and the menus get only those it did not consume), and exempts the ones "that can't be overridden such as File->New and Chrome->Quit" (Chromium, `docs/mac/about_hotkeys_and_keycodes.md`). Whether Electron's Quit item is exempt the same way was not established from any source; if it is not, a page 95 % busy with layout holds ⌘Q until it answers. § 6 names the test.

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

Each is settled here on the grounds where the grounds settle it (AGENTS.md, "Resolve-and-record"); the roadmap records the decisions.

1. **What does a pane hold?** The record is the system of record and stays whole on disk and on the server. A pane holds what it draws: the transcript's rows (small, one per message, reply and call) and, per call, a bounded tail of its stream — the published default is 1,000 lines (xterm.js, VS Code) — with the full output fetched from the record when the user opens it. `rawEnvelopes` as a whole-session array goes; the views that read it (§ 2.7, and meta's lenses through the `stream` store) read indexes the projection keeps, or a bounded window. Open within it: how meta's lenses, which today draw the whole stream, page through 28,513 envelopes.
2. **Where are envelopes batched?** At the controller: envelopes from the stream go into a queue; the queue is folded and the snapshot published once per animation frame, and a backlog is folded in slices that yield between frames. Grounds: Redux's one-update-per-transaction rule; React's caveat that store updates are synchronous; Electron's guidance on not blocking the renderer; and the measurement that the fold alone takes 1.9 s for 28,513 envelopes, so a batched client-side fold is enough and the server need not serve a projection.
3. **How is the transcript drawn?** Windowed: only rows near the viewport are in the DOM. The scroll anchor's three behaviours (follow, hold the reading row, hold a clicked header) carry over, and its layout reads happen once per frame. Whether to adopt a library (`react-window`, `react-virtuoso`) or write the windowing is a dependency decision, recorded as such (AGENTS.md: a new dependency is an agent-resolved decision).
4. **What happens when the page dies or hangs?** Main restarts the page, as a supervisor would, and says so: VS Code's form — a dialog naming the reason with Reopen and Close — is the comparable app's answer. A page that dies again soon after a reopen needs a guard against a crash loop. Whether the reopen is automatic or asked is a product choice; the recommendation is VS Code's (asked), since a crash on the same session would otherwise repeat.
5. **What do the per-envelope signals become?** `STREAM_ENVELOPE_APPENDED` and `TRANSCRIPT_ROW_SKIPPED` fire per envelope, which makes the trace as large as the record. A batch is a natural boundary for a summary-stratum record (the kit's strata, `grammar/PRINCIPLES.md` commitment 5); that is a vocabulary change, proposed and ratified as one, and the gates that count the per-envelope tags move with it.
6. **How does main take records?** Batched from the page (one IPC message per frame, not per record) and written asynchronously, with the invariant checker fed from the batch and `server.jsonl` read on the timer alone, not per record.
7. **What is the memory budget?** A number per pane, set from the published defaults above and checked by a gate: the hand-written record of § 6 replays with the page's heap and working set under it.

---

## 6. Measurements still to take

- **⌘Q during a backlog.** Taken for main (2026-11-19): main answers within 4 ms throughout, so main's thread does not hold the quit, though § 2.5's per-record writes still break Electron's guidance. Still to take, for the page: a real ⌘Q key event (System Events, `keystroke "q" using command down`) sent to a focusable window while the page is busy with a backlog, and the time from the key to `APP_QUIT_REQUESTED`; the same with the page idle as the control. It needs a focused window on the screen, so it runs when the screen is free. If ⌘Q waits on the page, a windowed, batched page (design questions 2 and 3) is also the fix for the quit.
- **Held or garbage at 3 GB.** A full collection at 11,911 envelopes did not return. Once the fold is batched the question may not survive; if it does, a heap snapshot at a size that returns answers it.
- **The gate.** A hand-written record — never the machine's — sized like the one that killed the page: tens of thousands of envelopes, one call streaming megabytes in tens of thousands of chunks, many calls, long replies. The gate opens it from a deep link in the packaged app and checks that the window draws the last row, that the page's working set stays under the budget, that no `RENDERER_GONE` is written, and that ⌘Q quits within its clocks.

---

## Sources

Checked 2026-11-19.

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
- Chromium, `docs/mac/about_hotkeys_and_keycodes.md`: https://chromium.googlesource.com/chromium/src/+/ca82da4b11/docs/mac/about_hotkeys_and_keycodes.md
- Named as pattern definitions, not quoted: Fowler, "Presentation Model" (2004) and "Event Sourcing" (2005); Gamma, Helm, Johnson, Vlissides, *Design Patterns* (1994), Observer; Cockburn, "Hexagonal Architecture" (2005); Erlang/OTP Design Principles, "Supervisor Behaviour".
