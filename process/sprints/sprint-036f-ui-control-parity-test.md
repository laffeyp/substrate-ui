# Sprint 036f — `test_ui_control_parity.py`

```yaml
---
id: 036f
status: closed-2026-08-28
phase: 5
pass_kind: observation
---
```

## scope

Land the cross-cutting parity test that asserts every UI-side control
produces the same manifest state as its CLI counterpart. Runs
Playwright + subprocess CLI side-by-side against fresh sessions.

Two surfaces, one gate:
- **Five desktop-view controls (036a-e):** driver picker, bundle
  picker, workspace picker, tools restriction, isolate toggle.
- **Fourteen terminal-view slashes:** `/exit`, `/help`, `/model`,
  `/tools`, `/set`, `/context`, `/inspect`, `/list`, `/replay`,
  `/run`, `/diff`, `/studio`, `/bundle`, `/interrupt`. Each has a
  substrate CLI counterpart at `substrate/src/substrate/cli.py`
  (chain at line 1053). Amended per REVIEW-2026-08-28-piece-g-eod
  SPEC-2 — silent bifurcation between `cli.py::route` and
  `terminal.ts::_slashRoute` is exactly the class of divergence the
  parity test exists to prevent.

One file. One concept: manifest-state equality across the two
implementations, per control and per slash.

## prerequisites

- 036a-e all closed (each has its own single-control parity smoke;
  036f is the consolidated regression gate).

## context_files

- `substrate-ui/tests/` — Python test surface.
- Each 036a-e's parity smoke as the reference shape.

## artifact contract → Files created/modified

- `substrate-ui/tests/test_ui_control_parity.py` — new. Nineteen test
  functions total: five for the desktop-view controls (036a-e) + one
  per terminal-view slash (fourteen). Each: (a) drive UI via
  Playwright (desktop control or terminal slash), (b)
  `GET /api/session/<id>` for post-state, (c) drive CLI counterpart
  against a fresh session, (d) `GET /api/session/<id>` for CLI
  post-state, (e) assert equality on the affected manifest slice.

## signal contract → Emits

None (test-only).

## observation contract

- `python -m pytest substrate-ui/tests/test_ui_control_parity.py -v`
  green.
- Each of the five test functions asserts on the specific manifest
  slice its control touches; unrelated fields are ignored.

## halt conditions

- `dual_contract_fail` on any single-control divergence — points at
  a regression in the corresponding 036a-e sprint.

## definition of done

Test on disk; all five cases green; CI wired.
