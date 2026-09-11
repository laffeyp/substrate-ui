# Sprint 001 — the observability spine

---
id: 001
status: closed
phase: 1
pass_kind: architecture
spec_reference: signals/0.1.json (Layers 6/7/8), Addendum A2, Architect 2026-09-08 non-negotiable
---

## scope

Land the smallest end-to-end slice that proves the three-channel observability contract for one live tag pair. Electron main spawns the Python bridge; Python imports substrate; bridge emits `{op:"hello", substrate:<version>, protocol:1}` on stdout; renderer receives the hello via preload; renderer paints the `anchor-bridge` testid (byte 0 → 128); renderer emits `BRIDGE_HELLO_RECEIVED` through the Emitter stub which writes one JSONL line to `<userData>/harness/last.jsonl` when `SUBSTRATE_HARNESS=1`; Playwright harness screenshots the anchor, decodes the byte, reads the JSONL trace, reads the bridge log, asserts the three channels agree.

Zero UI beyond a `[data-testid="anchor-bridge"]` canvas and a single status text node. No PaneHeader, no reveal, no transcript, no lens. The next sprint (002) lands the first real UI element (the pane grid).

## prerequisites

- Sprint 0 (Vocabulary Session) closed. `signals/0.1.json` locked at v0.1. `signals/0.1-rationale.md` signed. (Done — see BLACKBOARD § Built.)

## context_files

- `sdd-kit-2/AGENTS.md`
- `sdd-kit-2/foundations/01-signal-driven-development.md`
- `sdd-kit-2/ADDENDUMS.md § Addendum A2` (deterministic pixel-anchor decode)
- `signals/0.1.json § layer_1_lexical.tags[BRIDGE_HELLO_RECEIVED]`
- `signals/0.1.json § layer_2_payload.payload_schemas.BRIDGE_HELLO_RECEIVED`
- `signals/0.1.json § layer_4_temporal.temporal_invariants[BRIDGE_HELLO within 3s of spawn]`
- `signals/0.1.json § layer_6_operators.operators` (BridgeSupervisor, HelloEmitter, BridgeClient, AnchorPainter, Emitter, HarnessSink, HarnessLogWriter)
- `signals/0.1.json § layer_7_evidence.evidence_constraints[pixel_anchor].anchors[anchor-bridge]`
- `handoff_latest/docs/APP-ARCHITECTURE -2026-09-01-.md` (D62 — substrate imports as a package)
- `substrate/src/substrate/session_registry.py` (import surface only)
- Existing on-disk scaffold from prior unauthorized work: `electron/main.js`, `electron/preload.js`, `bridge/main.py`, `package.json`. Sprint 001 brings these under discipline for the first time.

## signal contract

### Emits

- `BRIDGE_HELLO_RECEIVED` (payload: `{substrate_version: string, protocol: 1}` — Layer 2 schema)
- `ANCHOR_PAINTED` (payload: `{anchor_id: "anchor-bridge", byte: 128}`) — Emitter fires this the first frame the anchor's byte changes from 0 to 128

### Consumes

None. This is a boot sprint.

## artifact contract

### Files created / modified

- `electron/main.js` — brought under discipline; spawns Python bridge, forwards stdout JSON lines to renderer via `bridge:message` IPC, dies clean on window-all-closed
- `electron/preload.js` — exposes `window.substrate.onHello(cb)` and (when `SUBSTRATE_HARNESS=1`) `window.__substrateHarness.append(sig)`
- `bridge/main.py` — imports substrate, emits `{op:hello, substrate:__version__, protocol:1}` on start
- `app/index.html` — one `<canvas data-testid="anchor-bridge" width="1" height="1">` and one `<div id="status">` text node; inline JS mounts an AnchorPainter that repaints anchor-bridge from state and an Emitter stub that writes `{t, kind:"BRIDGE_HELLO_RECEIVED", payload:{substrate_version, protocol}}` on hello
- `tests/harness/e2e_boot.js` — Playwright: launches Electron, waits for the anchor byte to transition 0 → 128 (rAF-timed), screenshots, decodes via zero-dep PNG un-filter per Addendum A2, reads `<userData>/harness/last.jsonl` for the BRIDGE_HELLO_RECEIVED line, reads `<logs>/bridge.log` for the "hello" bytes, asserts three-channel agreement

### Content assertions

- `signals/0.1.json.layer_9_version.locked === true` (vocabulary locked before implementation)
- `signals/0.1.json.layer_9_version.version_id === "0.1"`
- `bridge/main.py` contains the literal `substrate.__version__` and the literal `{"op": "hello"`
- `electron/main.js` contains the literal `SUBSTRATE_HARNESS` env var passthrough
- `app/index.html` contains `data-testid="anchor-bridge"`
- `tests/harness/e2e_boot.js` contains all three channel assertions: the decoded anchor byte equals 128, the JSONL contains BRIDGE_HELLO_RECEIVED, `bridge.log` contains substrate's version string

### Command exit codes

- `python3 -c "import substrate; print(substrate.__version__)"` returns 0 (from within the venv the Architect uses)
- `pip install -e .` inside the shell's Python bridge venv returns 0
- `node tests/harness/e2e_boot.js` returns 0 (Playwright three-channel assert)
- `python3 -m json.tool signals/0.1.json > /dev/null` returns 0

## observation contract

### Driving steps

1. Architect starts the Electron app with `SUBSTRATE_HARNESS=1 npm run dev`.
2. Playwright harness (`tests/harness/e2e_boot.js`) launches Electron, waits ≤3s for anchor-bridge to paint byte 128.
3. Harness screenshots the window's top-left 4×4 pixel region.
4. Harness decodes the anchor-bridge byte per Addendum A2 (zero-dep PNG un-filter).
5. Harness reads `<userData>/harness/last.jsonl` line by line.
6. Harness reads `<logs>/bridge.log` byte by byte.
7. Harness asserts three-channel agreement (see below).
8. Harness exits 0 on all three agreeing; exits 1 with a typed reason string otherwise.

### Expected log substrings

- `<logs>/bridge.log` contains the line `[bridge] hello substrate=<version>` (exact literal from bridge/main.py stderr) OR equivalent version identification.

### Expected runtime signals

- `<userData>/harness/last.jsonl` contains exactly one line matching pattern `{"t":<int>,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"<semver>","protocol":1}}` within 3000ms of app start.

### Expected screenshot / visible behavior

- Pixel at `(0,0)` of the anchor-bridge canvas is `rgb(128,128,128)` (byte 128, alive-bridge state).
- The `#status` text node reads `substrate <version> alive`.

### Three-channel agreement (harness verdict)

Harness passes only when all three channels agree on `alive`:
1. Structural: DOM has `[data-testid="anchor-bridge"]`.
2. Perceptual (paint decode): anchor byte === 128.
3. Log ↔ signal: JSONL trace contains one BRIDGE_HELLO_RECEIVED with a `substrate_version` field whose value appears verbatim in `bridge.log`.

Disagreement between any two channels fails the sprint (Addendum A B1). The harness prints the disagreeing channels and exits 1.

## done criteria

Electron launches on a clean install; the bridge spawns and imports substrate; the renderer receives the hello and paints the anchor; the harness reads three channels and prints `PASS three channels agree`. Every prior review's non-negotiable observability contract is proven for one tag pair (BRIDGE_HELLO_RECEIVED + anchor-bridge). Sprint 002 (pane grid + PANE_CREATED / PANE_FOCUSED) dispatches on close.

## notes

- The `electron/main.js`, `electron/preload.js`, `bridge/main.py`, and `package.json` on disk are from the earlier unauthorized restart (see BLACKBOARD § Built [WITHDRAWN 2026-09-08] entry). This sprint brings them under discipline for the first time — nothing new is invented; every existing file is either kept, extended, or read; the sprint's dual contract makes them auditable retroactively.
- No React. No pane state. No transcript. The observability spine is what this sprint proves; everything else waits.
- Non-negotiable per Architect 2026-09-08: every implementation sprint from here forward uses this same three-channel harness pattern.

## plan-mode review checklist

- [ ] Scope is concrete and bounded: one tag pair, one anchor, one round-trip.
- [ ] `context_files` covers Layer 1/2/4/6/7 references for BRIDGE_HELLO_RECEIVED + anchor-bridge; Addendum A2 for the PNG-decode discipline; the on-disk scaffold files that this sprint adopts.
- [ ] Signal contract Emits list references only tags in `signals/0.1.json` at v0.1 (BRIDGE_HELLO_RECEIVED, ANCHOR_PAINTED — both present).
- [ ] Artifact contract is gradable: five content assertions, four command exit codes.
- [ ] Observation contract present: driving steps, expected log substrings, expected runtime signals, expected screenshot, three-channel verdict.
- [ ] Sprint sweet spot honored: five files, one concept (the observability spine).
- [ ] Product-spec conformance (KIT_DIARY F26): cites Layer 6/7 of signals/0.1.json + Architect 2026-09-08 non-negotiable + Addendum A2. Non-invented.

---

*Sprint 001. First implementation sprint under v0.1 lock. Awaiting Architect "go" or edits.*
