# Sprint 379 — a pane switching to another session stops drawing the old one at once

```yaml
---
id: 379
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

A fault the runtime checker found on the full gate run of 2026-11-08. `view_signals` emitted three S5 breaks: after the records page opened another session in pane 1, the pane drew rows of the session it held before, such as seq 17 of `s_326f…`. `attachExisting` writes SESSION_ATTACH_STARTED and waits for the new session's manifest. Until that fetch returns, the old stream runs and the old rows stay on screen.

Now, when an attach goes to a session other than the pane's, the controller stops the old stream and clears the old rows before it fetches. The rest of the snapshot is still replaced when the manifest arrives. A reattach of the same session (after a backend restart) is untouched.

## artifact contract

### Files modified

- `web/vm/session_controller.ts` (`attachExisting`)

## observation contract

`view_signals`, `tool_output_toggle` and `both_session_shapes`, each of which switches pane 1 to another session, pass and emit no INVARIANT_BROKEN. With sprint 380's check in place, a launch that emits one fails its gate.

Plant: with the clear turned off, `view_signals` exits 1: "the app emitted 3 INVARIANT_BROKEN: S5 {"pane_id":1, "pane_session":…, "row_session":…, "seq":17}".
