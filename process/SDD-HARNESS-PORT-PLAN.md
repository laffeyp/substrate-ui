# SDD harness port plan — Katybird → substrate-ui

*Written 2026-08-14. Katybird already runs the SDD kit's discipline against a browser project (Phaser game in Capacitor). Its harness ships a small, coherent set of pieces that translate almost directly to substrate-ui. This document works through what to reuse, what to adapt, and where the two contexts genuinely differ — so the port doesn't drop a load-bearing piece and doesn't drag along a piece that doesn't fit.*

---

## What Katybird ships

Six pieces do the load-bearing work.

- **`signals/versions/0.1.json`** — the locked vocabulary. 58 tags, 9 categories, 4 strata, a `view_payload_universal` block (frame / visible / scene_id / layer) that every view-category tag inherits. Header carries `locked`, `locked_at`, `locked_by`, `tag_count`, `notes[]` with rationale ties into the round-1 spec.
- **`signals/versions/0.1-rationale.md`** — the rationale doc. Written at lock time, defends every tag's inclusion, retirement, and pairing choice.
- **`src/instrumentation/sdd.ts`** — 85 lines. Exports `emit(name, payload)` (validates against the vocabulary, throws on drift), `snapshot()` (returns the buffer copy), `flushToFile(path)` (Node-only via dynamic import), `loadCapture(path)` (reads JSONL back). Browser-safe via `performance.now()`.
- **`src/instrumentation/vocabulary.ts`** — 23 lines. Imports the JSON at load, builds a typed `Record<string, TagSpec>` dict, exports `VOCABULARY` and `VOCAB_VERSION`.
- **`tools/check-vocabulary-parity.ts`** — 191 lines. The standing gate. Walks `src/` and `tools/`, regex-greps `/\bemit\s*\(\s*["']([A-Z][A-Z0-9_]*)["']/g`, cross-checks against the lock. Exit 0 clean, 1 drift, 2 lock structural error.
- **`tools/capture-grade.ts`** — 398 lines. Reads a captured JSONL, asserts contains-in-order over an EXPECTED_ORDER, checks pairing invariants (behavior → view tag within N ms), checks prefix invariants over ordered payload arrays.

Plus two capture drivers: `tools/capture-headless.ts` (Node scripted-playthrough emitting the expected sequence — a simulation because Phaser can't run in Node) and `tools/capture-browser.ts` (Playwright drives real Chrome, reads `window.__signals` at run end, flushes to JSONL).

Fixtures live per sprint: `captures/sprint-N/run-1.jsonl`. Each committed JSONL is the regression baseline.

---

## What's different about substrate-ui

Four things matter for the port shape.

1. **Vanilla JS, no TypeScript build.** Katybird runs TS via `npx tsx`. Substrate-ui's `web/app.js` is plain JS served static. Port drops type annotations; nothing else changes.
2. **Playwright harness already present.** `substrate-ui/harness/` ships nine scripts (e2e_console, e2e_studio, e2e_assay, e2e_delegate, capture_*). Katybird's `capture-browser.ts` covers the same ground; substrate-ui's harnesses gain a signal-capture step (read `window.__signals` at run end, write JSONL), not a whole new driver.
3. **User-driven surface, not a game loop.** Katybird emits during autonomous gameplay (frame ticks, region entry, beat progression). Substrate-ui emits during user actions (tab switch, model pick, record select, chat turn) and reads (event stream cursor moved, pane rendered). The vocabulary shape stays the same; the trigger points are different.
4. **The Python server is orthogonal.** Substrate-ui's `server.py` serves data via `/api/*`. Signals are the browser's own story; the server keeps out of the emit path. If durable capture across page reloads matters later, a `POST /api/ui_signals` endpoint gets added — not now.

---

## File-by-file port plan

Straight ports (rename `.ts` → `.js`, drop types, keep structure):

- `src/instrumentation/sdd.ts` → `substrate-ui/web/sdd.js`. ~80 lines. Same surface.
- `src/instrumentation/vocabulary.ts` → `substrate-ui/web/vocabulary.js`. Imports `../signals/versions/0.1.json` at module load. ~20 lines.
- `tools/check-vocabulary-parity.ts` → `substrate-ui/tools/check-vocabulary-parity.js`. Scans `web/` and `tools/` for emit call sites. ~190 lines.
- `tools/capture-grade.ts` → `substrate-ui/tools/capture-grade.js`. Reads a JSONL trace, asserts invariants declared per-sprint. ~250 lines (substrate-ui likely needs fewer pairing rules than Katybird at the start).

Adapted:

- **No standalone `capture-browser.js` or `capture-headless.js`.** Substrate-ui's existing `harness/e2e_*.js` and `harness/capture_*.js` scripts already drive Chrome. Each grows a small tail step: `await page.evaluate(() => window.__signals)` → write to `substrate-ui/captures/sprint-N/e2e_console.jsonl`. Then `node tools/capture-grade.js captures/sprint-N/e2e_console.jsonl` runs as a follow-on.
- **`signals/versions/0.1.json` gets produced by the Vocabulary Session, not copied.** Katybird's tags are game-domain (BIRD_HOPPED, BEAT_REACHED). Substrate-ui's tags are UI-domain (TAB_SWITCHED, RECORD_SELECTED, TERMINAL_TURN_SUBMITTED). The template shape carries over; the content does not.
- **`signals/versions/0.1-rationale.md`** is authored during the same Vocabulary Session. Structure copies from Katybird's rationale doc; contents are substrate-ui-specific.

Not ported:

- Katybird's `tools/audio-cues.py`, `crop-grid.py`, `decode-region-markup.py`, `extract-*.py`, `test-markup-decoder.py`. Game-asset tooling. No substrate-ui equivalent.
- `tools/screenshot.ts`, `tools/cascade-asset.ts`. Katybird-specific.

---

## Integration with substrate-ui's existing harness

The current `substrate-ui/harness/*.js` scripts each end with a "PASS" line. Post-port, each adds three steps before that line:

1. `const signals = await page.evaluate(() => window.__signals || []);`
2. `fs.writeFileSync(\`../captures/\${sprint}/\${harnessName}.jsonl\`, signals.map(s => JSON.stringify(s)).join("\n"));`
3. `require("child_process").execSync("node ../tools/capture-grade.js ...");`

The grade script exits non-zero on invariant failure; the harness inherits the exit. No new npm scripts needed — the existing `npm run e2e`, `npm run e2e:studio`, etc. gain signal grading without new commands.

---

## Fixture policy

Per sprint: one committed JSONL per harness run under `substrate-ui/captures/sprint-NNN/<harness>.jsonl`. The grader diffs the CURRENT run's captured trace against the COMMITTED fixture using two channels:

1. **Contains-in-order** — every tag in the fixture appears in the current run in the same order. Extra tags in the current run are allowed (append-only additions don't fail).
2. **Pairing invariants** — declared per sprint in `substrate-ui/tools/capture-grade.js`. Example: every `RECORD_SELECTED` is followed within 100 ms by a `RUN_GRAPH_RENDERED` whose payload `record_name` matches.

Failed regression: fix the code, or if the change is intentional, refreeze the fixture with an explicit command (mirrors terminal-v1's `REFREEZE=1` pattern that worked).

---

## Open questions before dispatch

Three, each ratifiable by the Architect in `## Decisions`.

- **Vocabulary path.** `substrate-ui/signals/versions/0.1.json` (Katybird's nested path) or `substrate-ui/signals/0.1.json` (kit template's flat path)? Nested wins for readability once v0.2 lands.
- **Where the emit buffer lives at runtime.** `window.__signals` (in-memory, harness reads via `page.evaluate`) is the Katybird pattern and works cleanly with Playwright. The alternative is `console.log("[SIGNAL] ...")` with a stable prefix parsed from stdout — noisier, less structured. Recommend `window.__signals`.
- **Vocabulary Session partner.** BOOTSTRAP.md § Steps 1–11 requires Architect + agent walking the layers together. Schedule the session before Sprint 008 dispatches; it isn't agent-solo work.

The port doesn't dispatch until these three are ruled.
