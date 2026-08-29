# Sprint 036c CLOSEOUT ADDENDUM — desktop workspace picker + new-session dialog

Rule 12 addendum to `sprint-036c-workspace-picker.md`.

## The dialog now exists

036a and 036b closed with the same standing gap: workspace/tools/isolate are
create-only and the desktop view had no create surface. 036b's closeout named
this and shipped its picker mid-session only. 036c had to build the missing
surface. It did. `mountNewSessionDialog(triggerRoot, dialogRoot)` in
`web/controls/workspace_picker.ts` is a modal + button + Create/Cancel wire
with a `registerField(DialogField)` seam. Each future create-time control
(036d tools, 036e isolate) registers its field once; the dialog owns the
POST + emit + close. One `<div class="new-session-dialog-mount">` in
`web/index.html`, one button in the header.

## Deviations from the pending card

- **`One control` is now three cooperating pieces.** The card called for
  "workspace picker + `workspace_shape` badge." Landed shape:
  `mountNewSessionDialog` (the dialog + submit), `workspacePickerField`
  (a DialogField the dialog embeds), `mountWorkspaceShapeBadge` (the
  header badge). Three exports, one module, one concept: the desktop
  create-time surface for workspace.
- **File count.** The card said "two files." Landed shape touches four:
  `web/controls/workspace_picker.ts` (new, 235 lines), `web/index.html`
  (3 mount points added), `web/app.ts` (imports + wiring + globals),
  and `web/controls/index.ts` — no, not that. Three files. Card said
  two; the shared dialog seam justified the third touch. Recorded here.
- **Client-side validation** shipped as inline error text on the input,
  updated on `input`. Rejects relative paths and forbidden characters
  (`\0`, `\r`, `\n`). The submit still guards: an invalid value renders
  as empty and the POST body omits it, so an accidental submit of an
  invalid path becomes a "no workspace specified" case rather than
  garbage-in-manifest.

## Shared wire — landed

- Consumes `web/lib/fetch.ts::postJson` for the create POST.
- Consumes the `substrate:session-changed` bus for the badge; the
  dialog dispatches the event with `detail.session_id` after a
  successful create, and the driver/bundle pickers + workspace badge
  all refresh off the same listener.
- Reuses the CustomEvent-detail sid-preference pattern established at
  036a — the just-created session wins over any older one in the
  `/api/session` list.

## Signal contract — what actually fires

- `WORKSPACE_SELECTED{session_id, workspace, workspace_shape}` once
  per successful Create. Payload fields lifted from the daemon's POST
  response, not from the client's input — so the tag reflects what
  the manifest actually holds, not what the user typed.
- No emit on Cancel; no emit on validation failure.

## Observation contract — what passed

Nineteen assertions in `capture_desktop_workspace_picker.js` PASS. The
harness discipline (per "use the harness correctly" reminder):

- Drives the real user surface: button click → dialog fill → Create.
  No shortcut via `window.newSessionDialog` internals.
- Verifies substrate-side state: `GET /api/session/<id>` after Create
  reads back `workspace` + `workspace_shape` and cross-checks against
  the WORKSPACE_SELECTED payload.
- Verifies negative cases: relative-path validation error; cancel
  closes without emitting.
- Cleans up: `POST /api/session/<id>/end` fires; manifest status flips
  to `ended`. Sessions do not accumulate between runs.

Full `npm run signals` chain PASS across THIRTEEN fixtures. Gates:
check:vocab-parity 69 tags (58 live + 11 retired); check:tsc-new
clean; no uncaught page errors.

## Definition of done — satisfied

- Picker input + shape badge + dialog wired.
- POST lands; manifest carries `workspace` + `workspace_shape`.
- Badge reflects the shape.
- CLI parity check scoped to sprint 036f.
