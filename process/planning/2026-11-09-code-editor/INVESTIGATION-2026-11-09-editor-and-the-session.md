# Investigation: the editor and the session's life

*2026-11-09. No code changed. Source: the installed app's trace (launch 20261110-055720), the kernel at `../substrate/src/substrate`, `server.py`, and the editor's code as built through sprint 426.*

## What the Architect saw, and why

The Architect opened the editor on a file and could not type: under vim, `i` changed the mode and no text went in. The installed app's trace shows the cause. Every EDITOR_DRAWN from the moment the editor opened carries `read_only=true`. The pane had reattached session `s_d110725fc89b45d9a8a48df3` at t=380.154; at t=380.195 the window recorded SESSION_ENDED_LOCAL `reason=daemon_shutdown`. The session had ended when the previous launch quit (the install quits the app), and the editor treats an ended session as read-only.

The read-only rule is not in the design. Roadmap r8's E4 item wrote it ("An ended session and a view-only pane open read-only"), and sprint 423 built it (`Centre.tsx`, `readOnlyReason`). It followed the server: `PUT /api/session/<id>/file` refuses a write to an ended session with 409 (`server.py` `_session_file_write`, line 3822, docstring: "A record that refuses the edit (no record yet, an ended session) leaves the file as it was"). The editor copied a refusal it should have removed.

The Architect's rulings (2026-11-09):

- There is no read-only. This is an editor.
- Reopening a session restarts it automatically; no word typed to a model should be needed before a file can be edited.
- Starting to edit is a signal, like sending a message: it starts the session.
- vim and nano are options. By default the editor is a normal editor.

## How a session ends and resumes today

1. **Quitting ends every session.** On shutdown the server sends each running or parked session `SessionEndRequested(source="daemon_shutdown")` through `turn_sync` (`server.py` `_shutdown_all_sessions`, lines 626–686; sprint 215d). The session topology answers with SessionEnded and the run finalises (RunFinalised). On relaunch every pane reattaches to an ended session. Spec r6 §3 says the opposite: "relaunch restores the collection exactly — panes rebind to their sessions, which were parked runs on disk all along."
2. **A message resumes an ended session.** `SessionRegistry.turn_sync` flips an ended manifest to parked and `Runtime.resume` continues the same record (`session_registry.py` lines 867–872, the Architect's ruling of 2026-09-25: "an ended session still accepts turns ... the refusal was policy"). The window keeps the session bound when its stream closes so the next typed line resumes it (`session_controller.ts` `closeStreamOnEnd`, line 1802).
3. **A save cannot resume one.** A save writes FileWritten through `SessionRegistry.append_event`, which between turns calls `api.append_at_rest` (`session_registry.py` lines 1152–1184). `append_at_rest` accepts only a record whose last frame is a pause (`TerminationMatched`, decision `pause-await-input`) and refuses a RunFinalised tail as terminal (`kernel/runtime.py` lines 1066–1116). The turn path dropped that refusal in 2026-09; the save path kept it.

## What a restart without a message needs

`Runtime.resume` takes any application event as the resume event; it is canonical-checked and refused only for a reserved `substrate.*` kind (`kernel/runtime.py` from line 214). The pause's `resume_condition` is written onto TerminationMatched for observability (`runtime.py` line 922), not checked. So the kernel can already resume a session on an event that is not a UserMessage.

The session topology cannot yet stop after one. Its termination is `any_of(pause_await_input(when the event is Returned, resume_condition="UserMessage"), finalise_on("SessionEnded"))` (`topologies/session/__init__.py` lines 1702–1710). Only a model turn writes Returned. A resume on any other event never pauses; the run goes quiescent and the kernel finalises it as `stuck_quiescent`, recorded as a failure (`kernel/policies.py` lines 170–177).

The smallest change that gives a restart without a model turn: a session application event, here called SessionReopened (with its source: the window reattached it, or an edit began), and the topology's pause also matching it, as it matches Returned. A reopen is then one `turn_sync(resume_event=SessionReopened(...))`: the manifest flips to parked, the record gains SessionReopened and a pause, and from then on saves append at rest as they do today. The record shows the session reopened and why. One fact is unverified and needs a kernel test before it is relied on: that the termination check runs on the resume event itself, so the pause lands before the run goes quiescent.

## The two moments the Architect named

- **Reopening restarts the session.** When a pane reattaches a session whose end was `daemon_shutdown`, the window asks the server to reopen it (a new route, `POST /api/session/<id>/reopen`, through `turn_sync` as above). This is the relaunch case the trace shows, and it makes spec r6 §3 true: the pane comes back to a live, parked session. A session the person ended (/exit, ⌘W) stays ended until it is used.
- **Starting to edit starts the session.** In an ended session, the first change to a buffer sends the same reopen, with the source "edit", before the save it will need; typing is never blocked. The first save then appends at rest.

A third path is possible and is the larger change: stop ending sessions at shutdown, and leave each parked session parked (a mid-turn one interrupted to a pause instead of ended). It matches spec §3 most directly but changes sprint 215d's shutdown, the boot scan's status rules and the tests that hold them; reopen-on-reattach reaches the same state for the person with one event and one route.

## What changes, by layer

| Layer | Change |
|---|---|
| Kernel, session topology | SessionReopened (application event, with source); the pause also on SessionReopened; a kernel test that a resume on it pauses and does not finalise |
| Server | `POST /api/session/<id>/reopen`; the file PUT reopens an ended session before it appends, instead of answering 409 |
| Window | reattach of a `daemon_shutdown` session sends reopen; the first edit in an ended session sends reopen; the editor's read-only rule and `readOnlyReason` removed |
| Editor keys | a standard binding (CodeMirror's own keys) as the default; vim and nano chosen in settings |
| Vocabulary (substrate-ui) | a tag for the reopen and its source; EDITOR_DRAWN's `read_only` retired; `binding` gains `standard` |
| Plans | roadmap r8's E4 sentence on read-only is wrong; a new roadmap version replaces it |

View-only panes need the same look: the window marks a pane view-only when a topology writes its session's messages (`session_controller.ts` line 686). The editor should still edit there, and a save appends to that session's record while the topology's run is paused, or is injected while it is live (`append_event` already takes both paths).
