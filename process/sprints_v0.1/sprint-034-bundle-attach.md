# Sprint 034 — bundle attach

---
id: 034
epic: J — Bundles & tools
status: pending
phase: 3
pass_kind: architecture
spec_reference: signals/0.1.json § bridge BUNDLE_ATTACH_*; substrate.reference bundle registry; session_registry.py set_bundle at 645
prerequisites: 033 closed
---

## scope

Bundle popover shows the five shipped bundles + `(none)`. Selection attaches via bridge round-trip. Manifest.bundle updates; TRANSCRIPT does NOT compact (D45 note — only the next turn's seed shape changes).

## signal contract

### Emits

- `BUNDLE_ATTACH_REQUESTED` (`{request_id, session_id, bundle}`) — bundle may be `""` to clear
- `BUNDLE_ATTACHED` (`{request_id, session_id, bundle, prior_bundle}`) — the success reply (Layer 1 v0.1 name; no `_ACKED` suffix)
- `BUNDLE_ATTACH_FAILED` (`{request_id, reason: "bundle_not_found"|"registry_error"|"timeout"}`)

### Consumes

Bundle popover selection (Sprint 033 mutex).

## artifact contract

### Files

- `bridge/main.py` — op `bundle_attach`; wraps SessionRegistry.set_bundle at :645
- `src/render/BundlePopover.tsx`
- `tests/harness/e2e_bundle_attach.js`

### Content assertions

- prior_bundle carried on ACK for audit; `""` on first attach
- No TranscriptCompacted envelope produced at attach (verified by reading record after attach)

### Command exit codes

- `node tests/harness/e2e_bundle_attach.js` returns 0

## observation contract

### Driving steps

1. Bind session; attach bundle "session"; assert BUNDLE_ATTACH_REQUESTED → BUNDLE_ATTACHED
2. Clear to (none); assert bundle `""` in BUNDLE_ATTACHED
3. Verify record has no TranscriptCompacted after attach

### Three-channel agreement

- Structural: chip label reads current bundle
- Perceptual: header_popover anchor byte 96 (bundle) during popover phase
- Log ↔ signal: bridge.log `[bridge] bundle_attach session_id=<id> bundle=<b>`

## done criteria

Bundle attach works clean. Sprint 035 (tools restrict) dispatches next.
