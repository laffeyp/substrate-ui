# Sprint 036a — driver picker

```yaml
---
id: 036a
status: pending
phase: 5
pass_kind: functional
---
```

## scope

One control: the session-header driver picker. Dropdown listing the
drivers substrate exposes; `PATCH /api/session/<id> {driver}` on change;
manifest updates on disk; `DRIVER_PATCHED` fires.

Two files. One concept.

## prerequisites

- 032a (v0.7 vocab lock — carries `DRIVER_PATCHED`).
- 033 (two-view scaffold — the desktop view is where the header mounts).

## context_files

- `substrate-ui/web/app.ts` — desktop view session-header mount point.
- `substrate-ui/server.py::_session_patch` — existing PATCH endpoint.
- `signals/versions/0.7.json` — `DRIVER_PATCHED` payload spec.
- Tech-spec §10 line 12.
- **Shared wire (REVIEW-2026-08-28-piece-g-eod SPEC-3):** reuse the
  terminal-side helpers from sprint 035t (`_populateDriverPicker`,
  `_fetch<T>`, the DRIVER_PATCHED emit-after-ack pattern).
  `web/terminal.ts` around line 555 is the reference implementation;
  the desktop-view picker sits on the same PATCH endpoint and should
  share the same `_fetch<T>` wire helper rather than reimplement.

## artifact contract → Files created/modified

- `substrate-ui/web/controls/driver_picker.ts` — new. Exports
  `mountDriverPicker(root: HTMLElement, opts?)` following the shape
  `terminal.ts::mountTerminal` set (ARCH-5 from
  REVIEW-2026-08-28-piece-g-full). One export, root-element parameter,
  internal helpers `_`-prefixed. The PATCH round-trip + emit live here.
- `substrate-ui/web/index.html` — DOM container `#driver-picker` inside
  the session-header of `#view-desktop`.
- `substrate-ui/web/app.ts` — import + `mountDriverPicker($("driver-picker"))`
  only. No inline handler code.

## signal contract → Emits

- `DRIVER_PATCHED{session_id, driver, prior_driver}` — on successful
  PATCH round-trip.

## observation contract

- **UI driving steps**. Create a session with driver `deterministic`;
  change dropdown to `ollama:llama3.2:1b`; wait for round-trip; assert
  session manifest on disk carries the new driver.
- **Expected stderr log substrings**. `PATCH /api/session/<id>` once.
- **Expected grader signals**. `DRIVER_PATCHED` once, `prior_driver`
  equals the create-time driver.
- **Expected screenshot frames**. `screenshots/36a-driver-picker.png`
  viewed and clean.
- Parity check: CLI `/model` slash produces the same manifest
  state as the UI dropdown (assert via `GET /api/session/<id>` after
  each path).

## halt conditions

- `vocabulary_change_required` if `DRIVER_PATCHED` missing from lock.
- `dual_contract_fail` on UI/CLI manifest divergence.

## definition of done

Dropdown wired; PATCH lands; manifest updates; tag fires; parity
green; screenshot clean.
