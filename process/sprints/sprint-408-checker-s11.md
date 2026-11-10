# Sprint 408 — the runtime checker enforces S11 (an editor run opens before anything in it)

```yaml
---
id: 408
status: closed
phase: code editor, phase 1 (round 6), R1
pass_kind: functional
---
```

## scope

`electron/invariants.ts` checks rule S11 (v0.28, kept in v0.29): in a pane, EDITOR_OPENED opens an editor run, and no other editor record of that pane comes outside an open run. A second EDITOR_OPENED with a run open, an EDITOR_CLOSED with none open, or any other editor tag outside a run is an INVARIANT_BROKEN `S11`. EDITOR_KEY_REFUSED is exempt: the refusal at a picker comes when no run can open (reason `no_session`). PANE_CLOSED ends the pane's run, as the session rule allows; a window's WINDOW_BOOTED (a reload) ends every run of that window. The spec `web/app/__tests__/invariants.spec.ts` gains S11's clean run and its three planted breaks.

## prerequisites

- 407

## context_files

- `electron/invariants.ts`, `web/app/__tests__/invariants.spec.ts`
- `web/vm/signals/versions/0.29.json` (S11; editor_run; EDITOR_KEY_REFUSED), `0.29-rationale.md` Layer 5
- `harness/shakeout/editor_view.ts` (sprint 407's gate; its launches must stay free of S11 breaks)

## signal contract

### Emits

- `INVARIANT_BROKEN` (rule `S11`) only when the rule breaks; none on the editor's normal runs.

### Invariants

- S1–S9, T1–T6 and E8 results unchanged: the existing spec tests pass unchanged.

## artifact contract

### Files modified

- `electron/invariants.ts`, `web/app/__tests__/invariants.spec.ts`

### Content assertions

- `invariants.ts` names `"S11"` in a `broke(` call and in its header's rule list.

### Command exit codes

- `npx tsx --test web/app/__tests__/invariants.spec.ts` returns 0.
- `npm run build` returns 0.
- `npx tsx harness/shakeout/editor_view.ts` returns 0 (its cleanup fails on any INVARIANT_BROKEN).
- The same gate with `SHAKEOUT_APP` on a bundle built after this change returns 0.

## observation contract

### Expected runtime signals

- Sprint 407's gate, from source and packaged: no INVARIANT_BROKEN in `main.jsonl` across its three editor runs, the refusal at the picker and the page over the editor.

### Adversarial

- Could S11 pass because it never runs? The spec plants each break and requires `S11` once; the gate shows the real runs break nothing.

## done criteria

A broken editor run order is an INVARIANT_BROKEN in the packaged app's trace, and the editor's real runs write none.

## self-review checklist

- [x] One verifiable property.
- [x] No UI file changes; no design canon needed.
- [x] Emits only INVARIANT_BROKEN, an existing tag.
- [x] Gradable.
- [x] Observation contract present.
- [x] Two files, one concept.
