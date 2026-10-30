# Sprint 036e CLOSEOUT ADDENDUM — isolate toggle + workspace-shape select

Rule 12 addendum to `sprint-036e-isolate-toggle.md`.

## What landed alongside the toggle

The card scoped the isolate toggle alone; the observation contract
required proving the checkbox is `disabled` when `workspace_shape ==
"worktree"`. Reaching that state requires a shape-selection surface in
the dialog. Landed together: `workspaceShapeField()` (in
`web/controls/workspace_picker.ts`) is a `<select>` with `flat` and
`worktree` options; `isolateField()` (in `web/controls/isolate_toggle.ts`)
listens on the `workspace-shape-changed` CustomEvent the select
dispatches. Two fields, one wire, one dialog.

## Deviations from the pending card

- **Also grew `workspaceShapeField()`.** Recorded above. The alternative
  was to build the shape select inside `isolate_toggle.ts`, which would
  couple two concerns; the split matches how each field's `name` maps
  to a POST body key (`workspace_shape` vs `isolate`).
- **DialogField grew a `postSubmit(response)` hook.** ISOLATE_TOGGLED
  only fires when the daemon-side response comes back with
  `workspace_shape === "isolate"` — the tag reflects the manifest, not
  the checkbox alone. The hook is the natural home for per-field emit
  semantics; workspace's WORKSPACE_SELECTED stays in the dialog itself
  since it always fires on a successful create.
- **`mountIsolateToggle(root)` NOT exported.** The card named it as an
  artifact. Landed shape ships `isolateField()` only — the toggle is a
  dialog-embedded control, not a header widget. A `mountIsolateToggle`
  standalone mount would sit inside a session-header session-settings
  panel that does not exist; adding one would be scope creep.

## Accessibility discipline (G5)

- HTML `disabled` attribute, not `pointer-events: none` or opacity.
- `aria-label="isolation implicit in worktree workspace"` set on the
  input, cleared when enabled.
- Harness asserts `element.click()` on the disabled checkbox does NOT
  toggle `checked`. The click is inert at the DOM level, not just
  styled inert.
- Harness also verifies re-enable when the shape flips back to `flat`.

## Signal contract — what actually fires

- `ISOLATE_TOGGLED{session_id, isolate: true}` — fires from
  `isolateField().postSubmit()` when and only when the daemon's create
  response carries `workspace_shape === "isolate"`. Skipped when the
  user did not check the box; skipped when worktree muted the box.
- `WORKSPACE_SELECTED{session_id, workspace, workspace_shape}` — always
  fires on successful create (unchanged from 036c).

## Observation contract — what passed

Thirteen assertions in `capture_desktop_isolate_toggle.js` PASS across
three cases:

- Case A (flat + isolate checked): create lands, manifest shape is
  `isolate`, ISOLATE_TOGGLED fires with `isolate:true`.
- Case B (flat + unchecked): create lands with shape `flat`,
  ISOLATE_TOGGLED does NOT fire.
- Case C (worktree selected): checkbox `disabled` at the DOM level,
  aria-label matches, click is inert, re-enable on shape=flat, submit
  under worktree fires no ISOLATE_TOGGLED, and manifest carries
  `worktree`.

Full `npm run signals` chain PASS across FIFTEEN fixtures.

## Definition of done — satisfied

- Toggle wired via DialogField; shape select wired alongside.
- POST lands with correct payload in all three cases.
- Gray-out honored at the HTML-attribute level, not CSS alone.
- Parity check scoped to 036f.
