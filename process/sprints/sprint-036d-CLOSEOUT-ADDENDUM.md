# Sprint 036d CLOSEOUT ADDENDUM — desktop tools drawer

Rule 12 addendum to `sprint-036d-tools-restriction.md`.

## Deviations from the pending card

- **Text input, not checkboxes.** The card called for "checkbox per
  tool the attached bundle exposes." Every shipped bundle
  (best_of_n_verified, code_review, pair_coding, research_sweep,
  session) ships with `tools_enabled: []` at review open — verified
  via `GET /api/bundles`. Without a candidate list there is nothing
  to render checkboxes against. Landed shape: a comma-separated text
  input plus an Apply button. Matches the CLI `/tools` slash from
  sprint 035s verbatim; sprint 036f parity stays trivial. If a future
  bundle declares `tools_enabled`, the drawer can grow a checkbox
  mode as an additive UI layer.

- **Also ships a `toolsField()` for the create-time dialog.** SPEC-3
  wanted the desktop create-time surface to reach parity with the
  terminal's `/tools` slash. The 036c dialog's `registerField` seam
  is the right home; landed alongside the drawer in the same module.
  Same CSV shape as the drawer.

- **`registerField` seam ratified in a second consumer.** 036c
  introduced the seam and shipped one field (workspace). 036d ships
  the second (tools). Two fields prove the seam holds under real
  reuse: `app.ts` registers both in a `if (_newSessionHandle) { ... }`
  block; the dialog concatenates their values into one POST body;
  order-of-registration matches DOM order.

## Sort invariant

The drawer sorts the CSV lexicographically before both the DOM echo
and the PATCH payload:

- Input `write_file, bash, grep` → PATCH `{tools: ["bash", "grep", "write_file"]}`.
- Manifest read-back returns the same sorted list.
- TOOLS_RESTRICTED payload carries the sorted list.

Harness asserts all three at the same flip. Byte-identity holds regardless
of user input order.

## Empty clear semantics

- Input `""` → parsed to `[]` → PATCH `{tools: []}`.
- Daemon stores `None` (unrestricted); manifest reads back `tools: null`.
- Emit fires `TOOLS_RESTRICTED{tools: []}` — the empty array carries the
  "cleared" semantic. Matches sprint 035s's `/tools` slash behavior.

Harness accepts either `null` or `[]` on manifest read-back to be robust
against the daemon's None-vs-empty-list serialization.

## Daemon-side edit

`server.py::_session_get` grew a `tools` field in the response body so
the drawer can read the current restriction without a second endpoint.
Same shape as `manifest.tools`: `list[str] | None`. One line added; no
call-site breakage.

## Observation contract — what passed

Thirteen assertions in `capture_desktop_tools_drawer.js` PASS end-to-end.
Real POST (via 036c dialog), real PATCH ×3 (shrink/expand/clear), real
GET /api/session/<id> for each read-back, real POST /end for cleanup.
Full signals chain PASS across FOURTEEN fixtures.

## Definition of done — satisfied

- Drawer wired; three PATCH flips proven.
- Manifest updates on each flip; sort invariant holds; clear returns to
  unrestricted.
- Parity check with CLI `/tools` scoped to sprint 036f.
