# Sprint 036a CLOSEOUT ADDENDUM — desktop-view driver picker

Rule 12 (append-only) addendum to `sprint-036a-driver-picker.md`.

## Deviations from the pending card

- **Shared-wire extraction landed first.** SPEC-3 said "reuse the
  terminal-side `_fetch<T>` wire helper rather than reimplement." The
  disciplined move was to lift the three helpers into a shared module
  first. New file `web/lib/fetch.ts` exports `postJson`, `fetchJson`,
  `fetchGet` — same discriminated `FetchResult<T>` shape as before.
  `web/terminal.ts` shed its three private helper bodies (~70 lines)
  and imports the shared ones under the same local names. Zero behavior
  change; the emit-after-ack pattern, the failure_class discrimination,
  and every call site read the same result shape.

- **Session-binding via CustomEvent, not polling.** The card left the
  binding mechanism unspecified. Chose `substrate:session-changed` on
  `window` — the terminal dispatches it (with `detail.session_id`) at
  every DRIVER_SESSION_STARTED / DRIVER_SESSION_ENDED emit site. The
  picker listens; on each event it re-reads `/api/session` and prefers
  the caller-nominated sid over the first-in-list fallback. No polling
  loop, no substrate-side wire change.

- **`window.driverPicker` global for harness reach.** The harness
  cannot import the module in Playwright's page context; the boot code
  exposes the handle so tests can call `refresh(sid)` when the browser
  event surface is inconvenient. Same shape as `window.STATE` and
  `window.api`.

## Signal contract — what actually fires

- `DRIVER_PATCHED{session_id, driver, prior_driver}` on successful
  PATCH round-trip. `prior_driver` is the picker's last-known driver
  for the currently-bound session (blank string on first bind if the
  session-list read returned no earlier value).

## Observation contract — what passed

- Nine assertions in `capture_desktop_driver_picker.js` PASS end-to-end:
  picker mounts; twenty models populate (Ollama + CLI + deterministic);
  initial status well-formed on a daemon with pre-existing parked
  sessions OR a fresh daemon; picker binds to the newly-opened session
  by sid; DRIVER_PATCHED payload correct on flip; manifest slice on
  disk carries the new driver; status hint reflects flip;
  DRIVER_SESSION_ENDED de-binds the picker.
- Full `npm run signals` chain PASS across ELEVEN fixtures.
- `check:tsc-new` clean with `controls/` + `lib/` in the whitelist.
- `check:vocab-parity` OK (69 tags: 58 live + 11 retired).

## Definition of done — satisfied

- `web/controls/driver_picker.ts` exists (135 lines).
- `web/lib/fetch.ts` extracted (100 lines); `terminal.ts` shed its
  three private helpers.
- `web/index.html` `#driver-picker` mount point sits in the desktop
  header between `#modeToggle` and `#studiolink`.
- Dropdown flip → PATCH → emit → manifest update path proven.
- Parity check with CLI `/model` scoped to sprint 036f per the card
  amendment (SPEC-2). Deferred there, not here.
