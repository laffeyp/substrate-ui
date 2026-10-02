---
id: 096
status: closed
class: E (Hunt & Thomas, DRY; TypeScript Handbook, exhaustiveness checking)
---

# Sprint 096 — envelope kinds generated from the kernel

## scope

The client's envelope-kind list comes from the kernel, not a hand copy. A kernel kind the client does not classify fails `tsc`; a stale generated file fails a test; a kind the generator missed is logged at runtime.

## done

- `scripts/gen_kinds.py` builds the session topology through the kernel's `TopologyBuilder` and collects producer schemas, trigger and View subscription kinds, `tool_loop.INJECTED_EVENT_KINDS`, and the `substrate.*` constants; writes `web/vm/envelope_kinds.gen.ts`; `--check` exits 1 when stale.
- Kernel: `tool_loop.INJECTED_EVENT_KINDS = (ToolProgress,)`. `ToolProgress` reaches the record through `inject_event` with no schema or subscription, so the registration could not see it.
- `web/vm/kinds.ts` re-exports the generated `EnvelopeKind`.
- `session_controller.ts`: `KIND_DISPOSITION: Record<EnvelopeKindValue, "rendered" | "ignored">` classifies all 28 kinds; raw `case "…"` labels replaced; new warning rows for `PredicateQuarantined` and `ProducerEmittedInvalidEvent` (previously invisible faults); unknown kinds `console.warn`.
- Dead code removed: the `RateLimitedWaiting` case and status-dot logic. No kernel commit ever emitted that kind.
- `eslint.config.mjs`: the banned-literal list is read from the generated file (it was a third hand copy). The wider list found 13 raw kind literals in `reveal_component.ts`, including sample events with `kind: 'TriggerFired'` where the kernel writes `substrate.TriggerFired`, and `schema:` strings missing the `@1` version.
- `tests/test_envelope_kinds_generated_096.py` (2 tests).

## checks run (2026-10-01)

- Coverage against real data: 21 distinct kinds across 2,859 real session record segments; every one is in the generated list.
- Guard proof: adding a fake kind to the generated file made `tsc` fail with `Property 'BrandNewKind' is missing`, and `gen_kinds.py --check` exit 1.
- `tsc`, `eslint web/` (0 errors), `vite build` clean. UI suite 195 passed, failures identical to the 18-test baseline. Real-use smoke (source, clone of real state): real-model turn parked, Structure populated, quit 0.37 s. Kernel tool-loop tests pass.
