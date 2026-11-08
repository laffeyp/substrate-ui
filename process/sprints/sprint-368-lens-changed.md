# Sprint 368 — meta's lens changes are written (LENS_CHANGED, vocabulary v0.18)

```yaml
---
id: 368
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan r3 item 4, meta's lenses. Every lens change goes through `setMode` in `web/app/state/meta.ts`. It now takes the pane and its session, and writes `LENS_CHANGED` when the lens differs from the one shown. A `Record<MetaMode, LensChangedLens>` names each lens in the vocabulary's values.

`setMode` has three callers:
- the lens chips, in `MetaView.pickLens`;
- `/language`, in App's shell subscription;
- ↵ on the language lens, which returns to the stream.

**v0.18** (`P-0.18-LENS-SET`) drops `graph` from `LENS_CHANGED.lens`. The meta view has five lenses, and the stream lens draws the stream and its graph together under one chip.

## context_files

- `../sdd-kit-3/AGENTS.md`; `web/vm/signals/versions/0.17.json` (`LENS_CHANGED`)
- `web/app/state/meta.ts`, `web/app/MetaView.tsx` (`LENSES`, `pickLens`), `web/app/App.tsx` (the two `setMode` calls), `web/app/derive/language_keys.ts`, `web/vm/kinds.ts` (`GraphMode`)

## signal contract

### Emits

- `LENS_CHANGED` (`lens`: `LensChangedLens`; `session_id` when the pane has one), in the pane's context

### Invariants

- One record per change of lens; picking the lens already shown writes none.

## artifact contract

### Files created

- `web/vm/signals/versions/0.18.json`, `0.18-rationale.md`; `harness/shakeout/lens_signals.ts`

### Files modified

- `web/app/state/meta.ts`, `web/app/MetaView.tsx`, `web/app/App.tsx` (two calls), `web/app/__tests__/meta.spec.ts` (the new arguments)
- `current.json` (now pointing at `0.18.json`), `proposals.json`, `unemitted.json`, the generated files, `package.json` (`gates:electron`)

### Command exit codes

`npx tsc --noEmit` 0; `npm run build` 0; `npm run test:unit` 0; `npm run signals` 0; `gen_signals.py --check` 0.

## observation contract

`harness/shakeout/lens_signals.ts`, from source and packaged. After one turn in pane 1 it drives:
1. `/language`;
2. ↵ on the language lens;
3. the chips i/o, structure, language, scene and stream;
4. stream once more.

`window-1.jsonl` must hold exactly seven records, in this order: language, stream, io, structure, language, scene, stream. Each must carry pane 1's context and pane 1's session.

Plant: writing on every `setMode` call fails the gate.

## done criteria

Each lens the meta view changes to is in the trace with its pane and session.

## result

- **Commands:** `tsc` 0; `npm run build` 0; unit 147.
- **Gate:** `lens_signals` 0 from source.
- **Plant:** with the change check removed, the gate fails on an eighth record.
- **Rubber Duck Pass**, on that trace:
  - `/language` opened the language lens;
  - ↵ returned to the stream;
  - the chips walked i/o, structure, language, scene and stream;
  - the lit chip wrote nothing.

  All seven records are in pane 1 with its session. Observations: none.
