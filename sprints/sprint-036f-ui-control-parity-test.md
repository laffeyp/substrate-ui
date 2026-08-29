# Sprint 036f — `test_ui_control_parity.py`

```yaml
---
id: 036f
status: pending
phase: 5
pass_kind: observation
---
```

## scope

Land the cross-cutting parity test that asserts every UI control
(036a-e) produces the same manifest state as its CLI counterpart.
Runs Playwright + subprocess CLI side-by-side against fresh sessions.

One file. One concept: parity assertion for the five controls, run
together after each lands its own parity smoke.

## prerequisites

- 036a-e all closed (each has its own single-control parity smoke;
  036f is the consolidated regression gate).

## context_files

- `substrate-ui/tests/` — Python test surface.
- Each 036a-e's parity smoke as the reference shape.

## artifact contract → Files created/modified

- `substrate-ui/tests/test_ui_control_parity.py` — new. Five test
  functions, one per control. Each: (a) drive UI via Playwright, (b)
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
