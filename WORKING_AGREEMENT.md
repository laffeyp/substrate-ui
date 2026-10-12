# WORKING_AGREEMENT.md — substrate-ui

*Project-specific overrides and additions on top of `../sdd-kit-2/AGENTS.md`. The Agent reads AGENTS.md first (the methodology) then this file (the project specifics). This file augments; it never overrides AGENTS.md hard rules. When the two conflict, AGENTS.md wins.*

*Current as of 2026-10-11. The version it replaces (2026-06-17, revised through 2026-09) is kept at `process/archive/WORKING_AGREEMENT-2026-06-17-to-2026-10-11.md`; it described the browser console, its Chrome harnesses and a root `signals/` folder, all retired since.*

---

## Project identity

- **Project name:** substrate-ui (the app ships as Substrate).
- **Project type:** a macOS desktop app (Electron) over the Substrate runtime. A Python HTTP daemon, `server.py`, runs sessions and serves records; the window is the reveal shell, TypeScript built by Vite.
- **Primary languages:** Python 3.12+ (`server.py`, stdlib `http.server`); TypeScript 5 (`web/`); JavaScript (`electron/`).
- **Relationship to substrate:** a separate repo that depends on the kernel as a library: `substrate.api`, the bundled topologies, and the session topology's public modules (`substrate.topologies.session`, its `vocabulary`). The kernel is bundled into the app by `npm run pack:runtime`.
- **Adopted SDD kit version:** `sdd-kit-2` (read-only canon at `../sdd-kit-2/`).

---

## Project class

**Desktop app / frontend** + **Backend** (per `../sdd-kit-2/TECHNIQUES.md` Section 2). Behaviour is checked in the running app, not the DOM alone: the Electron gates drive the real window (Playwright's `_electron`), and screenshots are read.

---

## Project scope (verbatim from BLACKBOARD ## Decisions)

> substrate-ui is the read + thin-control console over the Substrate runtime. It reads run records and live runs through `substrate.api` ONLY (no kernel imports), and presents: the record rail, the run-as-graph (firing-anchored Producer-instance lifespans + spawn-cohort bands), the event stream, the provenance inspector, the health verdict, record diff (first-divergence by seq), the I/O pane, and thin control (launch a bundled topology; resume a paused run; the Studio: author a Topology and build-and-launch it for real). Single-operator, dozens-of-Producers scale. Control is LAUNCH + RESUME-only (no mid-run mutation). The runtime is the source of truth; the UI is a lens, never a controller of run semantics.

*The scope above is the Decision as recorded. Since the daily-driver work (2026-08) the app also opens and drives sessions, panes and their workspaces; the release roadmap (`process/planning/ROADMAP-2026-10-11-before-distribution.md`) is the current plan.*

---

## Canonical home registry

*Per AGENTS.md hard rule 7. Consult before authoring; a new module gets its row before it lands.*

| Surface / type | Canonical home | Notes |
|---|---|---|
| HTTP daemon: sessions, turns, records, applications, models roster, `topology_graph` and other read projections | `server.py` | Sole backend. |
| Electron main process, native menu, preload bridge | `electron/main.js`, `electron/menu.js`, `electron/preload.js` | The window, the Window and Edit menus, the server child process. |
| The window's layout (dc-runtime template) | `web/reveal.html` | One top bar; panes; meta view; records, studio, structure lenses. |
| Repeated layout blocks | `web/partials/*.html` (`input-bar.html`, `choice-line.html`) | Inlined at build time by `vite.config.ts` (`includePartials`) with `%key%` parameters; the template language has no include. |
| The window's logic and bindings | `web/reveal_component.ts` | Compiled by esbuild as its own bundle and inlined into `reveal.html` (`vite.config.ts`, `inlineDcScript`). State that must be shared with the rest lives on `globalThis` (see `web/vm/tool_output_mode.ts`). |
| Bootstrap: controller registry, transcript mounts, Electron title-bar CSS | `web/reveal.ts` | |
| The transcript (React) | `web/reveal/transcript/` (`Transcript.tsx`, `Row.tsx`, `ToolCard.tsx`, `ModelReply.tsx`, `useToolOutputMode.ts`, …) | React from the CDN UMD globals, through `web/shims/`. |
| Session bar line, markdown, timeline helpers | `web/reveal/activity.ts`, `web/reveal/markdown.ts`, `web/reveal/timeline.ts` | |
| Per-pane session controller (open, turns, slash commands, stream) | `web/vm/session_controller.ts` | One controller per pane (`web/vm/pane_registry.ts`). |
| Snapshot and row types | `web/vm/types.ts` | |
| Fold / unfold all tool output | `web/vm/tool_output_mode.ts` | ⌘E, `/fold`, `/unfold` (UI sprint 140). |
| Kernel names the UI reads, generated | `web/vm/envelope_kinds.gen.ts`, `web/vm/statuses.gen.ts`, `web/vm/controls.gen.ts` | Written by `scripts/gen_kinds.py` from the kernel; `tests/test_envelope_kinds_generated_096.py` fails when one is stale. Never hand-copy a kernel name. |
| substrate-ui's own signal vocabulary | `web/vm/signals/versions/current.json` → `0.1.json` (31 tags) + `0.1-rationale.md` | Every `emit(...)` validates against it; `npm run signals` checks the call sites. |
| Unit specs | `web/reveal/__tests__/*.spec.ts` | `npm run test:unit`. |
| Python tests (real server over HTTP) | `tests/*.py` | `npm run test:py`. |
| Electron gates (the observation contract) | `harness/shakeout/*.ts`, shared helpers in `harness/shakeout/lib/` (`electron.ts`: `launchArgs`, `bindPaneAsUser`) | `npm run gates:electron`. |
| Packaging | `electron-builder.config.js`, `scripts/fetch-python-runtime.sh` | |

---

## Dependency policy

*No additions without surfacing per AGENTS.md.*

- **Backend:** Python standard library + `msgspec` + `substrate`. No web framework.
- **Frontend:** TypeScript built by Vite; React 18 from the CDN as UMD globals (dc-runtime reads `window.React`), imported through `web/shims/`. Dev dependencies are pinned in `package.json`: electron, electron-builder, @electron/notarize, typescript, vite, tsx, eslint with typescript-eslint, playwright, @types/node, @types/react, @types/react-dom.

---

## Tone canon — the eight-word vocabulary contract (load-bearing)

- **The eight words and nothing else for the primitives:** Producer, Bus, View, Predicate, Trigger, Route, TerminationPolicy, Topology.
- **No anthropomorphism:** never "agent", "actor", "speaker", "worker" for a Producer. (`cursor-agent` is a product's name, not a reframe.)
- **No marketing reframes:** never "workflow", "step", "task", "pipeline-stage" for the runtime concepts.
- **Sequence numbers where identification happens:** "at seq 14".
- **No emoji** in committed files.

**Standing check (before any UI close):**

```bash
grep -rEn '\bagent\b|workflow|orchestrat|\bactor\b|\bspeaker\b' server.py web/reveal.html web/partials web/reveal_component.ts web/reveal web/vm \
  | grep -viE 'cursor-agent|//|#|demo_topolog|__tests__'   # expect: zero hits in primitive-naming positions
```

Read each hit: on 2026-10-11 the eight hits were docstrings where "agent" names a CLI model (claude, codex) and the legacy `/api/agent` route, none naming a primitive.

---

## Build and verification commands

*From `substrate-ui/`. Report exit codes; do not silently retry.*

- **Build:** `npm run build` — tsc, the harness tsc, eslint, then Vite into `web/dist/` (the server serves `web/dist/`). Expected exit 0.
- **Generated kernel names:** `uv run --project ../substrate python scripts/gen_kinds.py` after any kernel vocabulary change; `--check` exits 1 when a file is stale.
- **Unit specs, with the signal-vocabulary check:** `npm run test:unit` — runs `npm run signals` (every `emit` names a locked tag) and then the specs. Expected exit 0.
- **Python tests:** `npm run test:py`. Expected exit 0.
- **Electron gates (the observation contract):** `npm run gates:electron`. One gate, `resume_ended_session.ts`, runs the package at `dist-electron/mac-arm64/Substrate.app`, so build the package first (below). `SHAKEOUT_APP=/Applications/Substrate.app` runs a gate against the installed app.
- **Package (signed, not notarized):** `npm run build && npm run pack:runtime && npx electron-builder --mac --config electron-builder.config.js -c.mac.notarize=false`. `pack:runtime` bundles the kernel from `../substrate`.
- **Install:** quit the running app (`osascript -e 'tell application "Substrate" to quit'`), move `/Applications/Substrate.app` to the Trash, copy `dist-electron/mac-arm64/Substrate.app` with `ditto`, clear quarantine, verify with `codesign --verify --deep --strict`. Never `pkill` by pattern: the installed app runs the same server command line.
- **Lint:** `uv run --project ../substrate ruff check server.py`; eslint runs in `npm run build`.
- **Commit hook** (`.githooks/pre-commit`, via `core.hooksPath`): tsc, the signal-vocabulary check, and the kernel's status-literal gate.

---

## Observation contract environment — two tracks

A behaviour-touching change is done when both pass:

- **Track 1 — structural:** the Electron gates assert the running window: elements, the record behind them, behaviour across panes and views. A new behaviour gets a gate, and the gate is seen to fail on the old code where the old code can run.
- **Track 2 — perceptual:** screenshots of the running window, read by the agent, at the widths the user works at (a 14-inch MacBook at full screen is 1512 points; the window's minimum is a third of the screen, about 504 points) and in a split pane.

---

## External SDK bridge mappings

### Apple App Store Connect API — notarization credentials

The three non-secret identifiers Sprint 089's Section D + `electron-builder.config.js`'s `mac.notarize: true` block read from the environment. This file is the canonical home so a compact summary can never rewrite them from a plausible-looking hallucination (2026-09-28 issuer-UUID drift, filed on drift watchlist).

- **Team ID (Developer ID Application identity):** `ZVL8XB9XGU` — Green Rose Systems, LLC. The `identity` field in `electron-builder.config.js` mac block. Not a secret.
- **App Store Connect API key ID:** `C3977SD347`. Passed to `notarytool` / `electron-builder` as `APPLE_API_KEY_ID`. The value equals the substring between `AuthKey_` and `.p8` in the key filename. Not a secret.
- **App Store Connect issuer UUID:** `ce7e5b05-566f-4024-bdfc-e7de968b3218`. Passed as `APPLE_API_ISSUER`. One UUID per Apple developer organization; visible at App Store Connect → Users and Access → Integrations → App Store Connect API (top of the page). Not a secret.
- **Private key file (the ONLY secret):** `~/.appstoreconnect/private_keys/AuthKey_C3977SD347.p8`. Passed as `APPLE_API_KEY`. `chmod 600`. Never commits.
- **Invocation shape:** `APPLE_API_KEY=~/.appstoreconnect/private_keys/AuthKey_C3977SD347.p8 APPLE_API_KEY_ID=C3977SD347 APPLE_API_ISSUER=ce7e5b05-566f-4024-bdfc-e7de968b3218 npm run dist`.
- **Verification (auth alone, no submission):** `xcrun notarytool history --key <p8> --key-id <id> --issuer <uuid>` returns a list rather than HTTP 401.

If the C3977SD347 key ever rotates: the new `.p8` lands at `~/.appstoreconnect/private_keys/AuthKey_<NEW_ID>.p8`, this section gets an amended entry (never overwritten — rule 12), and `electron-builder`'s environment picks up the new `APPLE_API_KEY_ID` at the next dist run. The issuer UUID and team ID do not rotate on key rotation.

### The kernel's session vocabulary

Kinds, statuses and the Length and Tone positions come from `../substrate/process/signals/session-vocabulary.md` and its code (`substrate.topologies.session.vocabulary`), through the generated files above. substrate-ui never redeclares them.

---

## Working with the Architect

- Each ask is written into the roadmap and `process/planning/OPEN-ITEMS-2026-10-10.md` before work on it starts.
- When the Architect is trying the installed app and calling out items one at a time, finish the one item, report, and stop; do not roll into the next.
- A narrow ask changes only what it names.

---

## Post-close addenda (rule-12 shape for fold work)

When a fold-pass edit touches surfaces the closed card did not enumerate, it lands as `sprints/sprint-NNN-CLOSEOUT-ADDENDUM.md` — not as an edit to the closed card. Precedent: `sprints/sprint-033-CLOSEOUT-ADDENDUM.md` (2026-08-28).

---

*WORKING_AGREEMENT.md for substrate-ui, current 2026-10-11. An Electron app over the Substrate kernel. Own signal vocabulary at `web/vm/signals/versions/current.json` (v0.1, 31 tags); kernel names reach the UI only through generated files. The eight-word tone canon binds user-facing strings.*
