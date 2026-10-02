---
id: 095
status: closed (095a–c); 095d (kernel release) awaits the Architect
repos: substrate (kernel) + substrate-ui
class: F (Hohpe & Woolf, Claim Check + Content Enricher; Fowler, Event Sourcing "Complete Rebuild")
supersedes: 092a, 092b
---

# Sprint 095 — one blob resolver for every reader

## scope

A payload over BLOB_THRESHOLD_BYTES is stored in the record as a claim check (`{"$blob", "bytes"}`). One kernel function redeems it, and every reader that consumes payload contents goes through it. Live views, resumed views, replayed views, SSE frames, the session transcript, and record-reading tools see the same payload for the same event. The record's bytes do not change.

Chain:

- **095a (kernel)** `record/record.py`: `resolve_blob_payload(payload, root)`; `read_record(root, *, resolve_blobs=False)`. `projections/attach.py`: `LiveRecord(..., resolve_blobs=False)`. `api.py` exports `resolve_blob_payload`. `kernel/runtime.py` resume fold reads with `resolve_blobs=True`. Sprint 092a's live split kept.
- **095b (kernel)** semantic readers switch to `resolve_blobs=True`: `projections/inspect.py` (view_at, events), `topologies/session/transcript.py`, `topologies/session/parent_context_producer.py`, `topologies/tool_loop/delegate.py`, `topologies/tool_loop/substrate_tools.py`. Integrity readers (replay, conformance, record tests) stay raw.
- **095c (substrate-ui)** `server.py` SSE uses `LiveRecord(resolve_blobs=True)` through `substrate.api`; `_deref_blob_payload` and the `blobstore`/`types` imports removed.
- **095d** kernel release (version bump, tag, PyPI). Publishing is outward-facing: asked of the Architect, not assumed.

## checks

- Kernel test: a View folds an oversized payload live; the run pauses; `resume` folds the record; the resumed View value equals the live one. Before the change it holds a stub.
- Kernel test: `read_record(resolve_blobs=True)` returns the inline payload; default `read_record` returns the stub byte-for-byte as stored.
- Bundled-record currency and replay tests pass unchanged.
- `server.py` imports only F-API-6 surfaces for blobs; SSE frame for an oversized event carries the real payload.

## result (2026-10-01)

- **095a.** `record/record.py`: `resolve_blob_payload`, `read_record(resolve_blobs=)`. `projections/attach.py`: `attach`/`LiveRecord(resolve_blobs=)`. `api.py` exports the resolver. Resume fold reads resolved. Test `substrate/tests/test_blob_claim_check_095.py` (3 tests): failed before the change with `substrate.PredicateQuarantined` on resume; passes after.
- **Sprint 092a defect found and fixed.** `_maybe_offload` returned `(disk, memory)` but `runtime.py`'s finalisation path stored the pair itself, so every `RunFinalised.finalisation_payload` and `RunResult.finalisation_payload` became a 2-tuple. Caught by `test_robustness::test_finalisation_payload_flows_to_record_and_result`. Now split like every other event. No pair-shaped payload in the four record segments written in the last two days.
- **095b.** Resolved reads in `view_at`, the session transcript, parent context, delegate answers and context, `inspect_record`, and the kernel turn-index scan. Test fakes in `test_delegate_per_call_context.py` widened to accept `**kwargs`.
- **095c.** `server.py` drops `_deref_blob_payload` and its `substrate.record.blobstore` / `substrate.types` imports; both SSE handlers, `GET /api/records/<name>` and the topology-run output use the kernel resolver. UI `session_registry.py` turn-index scan resolved.
- **Checks.** Kernel, 33 targeted test files: 258 passed; the 3 failures predate this sprint (`test_session_end_by_name` reads `SessionStatus.ENDED` from a `Literal`; two `delegate_schema_six_fields` tests fail on HEAD). substrate-ui: 193 passed, failure set identical to baseline. Over HTTP: a 30,000-char payload is a stub on disk and arrives whole from `/api/records/<name>` and the by-path SSE stream.
- **Open.** 095d: kernel version bump, tag and PyPI release; until then the bundling drift guard blocks a packaged build. Boundary test still red for `substrate.bundles` and `substrate.kernel.runtime` (sprint 097).
