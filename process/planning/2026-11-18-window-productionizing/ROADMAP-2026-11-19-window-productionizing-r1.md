# Roadmap — the window layer, productionized (round 1)

*2026-11-19. Research: `RESEARCH-2026-11-19-window-productionizing.md`. The Architect, 2026-11-18: the grey screen and the ⌘Q that sometimes does not quit are cases of one finding, that the window layer is still partly prototype; the work is to productionize it. New development stays stopped until this closes (BLACKBOARD, 2026-11-18). The cause, measured: every stage of the window's data path re-derives from everything a pane holds, and nothing is let go; on a 28,513-envelope session the page spent 94.7 % of its time in forced layout and died at 8.67 GB, and nothing restarted it.*

Every item's check runs end to end in the app on a hand-written record (W1), never a record from this machine.

## Items

**W1 — The gate: a long session opens and draws (harness).** A generator writes a session folder by hand: tens of thousands of envelopes across many turns, long replies, many tool calls, and one call that streams several megabytes in tens of thousands of `ToolProgress` chunks. A gate copies it into the launch's scratch state, opens it from a `substrate://session/<id>` link, and checks four things: the window draws the session's last row; the page's working set stays under the budget of W2; no `RENDERER_GONE` is written; the time from link to last row is under a bound set from the 1.9 s the fold takes alone. Check: the gate fails on today's tree, on the working set or the crash, and names which.

**W2 — Envelopes are folded in batches, once per frame (app, controller).** The stream's envelopes go into a queue; the controller folds the queue and publishes one snapshot per animation frame, and folds a backlog in slices that yield between frames. Per batch: one copy of the envelope list, one notification; `noteSkipped` reads the seqs a row was made for from a set, not by scanning the transcript. The budget for W1 is set here from the measurement: the page's working set after the gate's record, batched. Check: a client spec feeds 30,000 envelopes and counts one listener call per batch; W1's time and working set fall.

**W3 — The scroll anchor lays out once per frame (app, transcript).** `place` runs once per animation frame after commits, its reads before its writes, not in a `useLayoutEffect` after every commit; follow, reading and pinned behave as before. Check: `transcript_follow` and the caret-pin gates pass unchanged; a CPU profile of W1's replay shows `place` under 5 % of the page's time.

**W4 — A call's stream is bounded (app, controller and tool card).** A pane keeps the last 1,000 lines of each call's stream (the default of xterm.js and VS Code's terminal), and the count of lines before them; the card says how many lines are not shown. The full output stays on the record. Check: W1's long call holds 1,000 lines in the pane; `tool_output_text` and `tool_output_formatted` pass.

**W5 — A render error does not empty the window (app).** Error boundaries around the transcript, the meta view, the editor and the pages draw a fallback that names what failed and offers to draw it again, and write `WINDOW_FAULTED` with the component's name (a payload change, proposed as one). Check: a gate that makes one row throw sees the rest of the window drawn and the fault recorded.

**W6 — A dead or hung page is reopened (app, main).** On `render-process-gone`, main shows VS Code's form: the reason and code, with Reopen and Close; Reopen loads the window again on the same panes. A second death within 60 s of a reopen does not reopen the same sessions without asking. On `unresponsive`, after the page has not answered for its first report, main offers Reopen, Close and Keep Waiting. New tags for the reopen are proposed and ratified. Check: a gate kills the page's process (`process.crash()` through DevTools) and sees the dialog, the reopen, the session drawn again, and the records.

**W7 — The transcript draws only what is near the view (app).** The transcript is windowed: rows near the viewport are in the DOM, the rest are measured placeholders; the scroll anchor's three behaviours hold. The dependency choice (a library or our own) is decided in the card and recorded. Check: W1's DOM node count stays bounded as the session grows; the scroll gates pass.

**W8 — Views read indexes, not the whole log (app).** The controller keeps the indexes its views ask for — the files a session touched, one file's history, the last message and the last end of a turn — updated per batch; `Centre`, `LeftTabs`, `Inspector`, `Follow`, `scanActivity` and meta's lenses read them. `rawEnvelopes` as a whole-session array goes, or is bounded. Check: the editor gates and the meta lens gates pass; W1's heap after a full collection is under the budget.

**W9 — The root renders when its own inputs change (app).** `App` takes from the shell store only the fields it draws; a pane's envelope that changes no field `App` uses does not render it; `publish` writes a store only when that store's view changed. Check: a count of `App` renders through W1's replay is near the count of batches that changed its fields, not of envelopes.

**W10 — The signal path batches (app, main; vocabulary).** The page sends its records to main once per frame, not once per record; main writes them asynchronously; the checker reads `server.jsonl` on its timer, not per record; the window's ring buffer appends in constant time. The per-envelope tags (`STREAM_ENVELOPE_APPENDED`, `TRANSCRIPT_ROW_SKIPPED`) become a per-batch summary, proposed and ratified as a vocabulary change, with the gates that count them moved. Check: W1's trace holds one summary per batch and no `TRACE_LOST`; `sdd_signals` gates pass.

**W11 — The stream resumes by event id (app, server).** The server writes `id: <seq>` on each frame and starts from `Last-Event-ID` when the browser sends it. Check: a gate that drops the connection mid-backlog sees the stream resume past the last seq with no duplicate skipped.

**W12 — ⌘Q during a busy page (measurement, then fix if needed).** A real ⌘Q key event sent to a focusable window while W1's replay runs, timed to `APP_QUIT_REQUESTED`, against an idle control. Runs when the screen is free. If the key waits on the page, the quit is fixed by W2–W3 and checked here; if not, its cause is found before a card is written.

## Order

W1 first: it fails today and is the check every later item runs. Then W2 and W3, which remove the measured 95 % and the per-envelope fold; W4, which bounds the one call that carried most of the bytes; W5 and W6, so a failure that remains is survivable and said. Then W7, W8 and W9, which make the cost of a long session independent of its length. Then W10 and W11. W12 runs after W3, when the screen is free.

When W1 passes on the packaged build with every item above built, this roadmap closes and Substrate Next takes the build.
