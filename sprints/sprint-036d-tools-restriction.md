# Sprint 036d — tools restriction drawer

```yaml
---
id: 036d
status: pending
phase: 5
pass_kind: functional
---
```

## scope

One control: session-settings drawer with a checkbox per tool the
attached bundle exposes. `PATCH /api/session/<id> {tools: [...]}` on
change. Tools list is sorted for deterministic payload serialization.

Two files. One concept.

## prerequisites

- 032a (v0.7 lock — `TOOLS_RESTRICTED`).
- 033 (two-view scaffold).

## context_files

- `substrate-ui/web/app.ts` — session-settings drawer.
- `substrate-ui/server.py::_session_patch` — PATCH accepts `tools`.
- Tech-spec §10 line 16.

## artifact contract → Files created/modified

- `substrate-ui/web/index.html` — `#tools-drawer` inside the
  session-settings panel.
- `substrate-ui/web/app.ts` — mount + wire + emit.

## signal contract → Emits

- `TOOLS_RESTRICTED{session_id, tools}` — once per PATCH.

## observation contract

- **UI driving steps**. Open a session with a bundle that exposes
  three tools; uncheck one in the drawer; assert manifest carries the
  reduced tool list; check it again; assert manifest carries the full
  list.
- **Expected stderr log substrings**. `PATCH /api/session/<id>` twice.
- **Expected grader signals**. `TOOLS_RESTRICTED` twice; `tools` array
  sorted lexicographically in both payloads.
- **Expected screenshot frames**. `screenshots/36d-tools-drawer.png`.
- Parity: CLI `/tools` slash produces the same manifest state.

## halt conditions

- `vocabulary_change_required` if `TOOLS_RESTRICTED` missing.
- `dual_contract_fail` on parity divergence.

## definition of done

Drawer wired; PATCH lands; manifest updates; sort invariant holds;
parity green.
