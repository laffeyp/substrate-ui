---
id: 192
status: closed
phase: shell-to-react A1
pass_kind: observation
---

# Sprint 192 — pixel capture for the move off dc-runtime

## scope

Author `harness/pixel/capture.ts` and `harness/pixel/masks.ts`. `capture.ts` launches the app from source on an offline roster (the gates' `launchArgs`), binds pane 1 on the deterministic driver in the repo-local folder `harness/shakeout/.scratch/pixel/`, drives the 14 screens below at two window sizes (1440×900 and 900×380), and writes 28 PNGs to `captures/pixel/<label>/<screen>@<w>x<h>.png`. Before each screenshot it tags every element whose own text matches a pattern in `masks.ts` and passes those elements to Playwright's `mask` option. `npx tsx harness/pixel/capture.ts <label>` exits 0 with 28 files written. The comparison script is the next sprint.

Screens: panes view (unbound picker; one pane after one turn; two panes); meta (stream down; stream side; inspector open; i/o; structure; language; scene); records page with its first workspace open; settings dialog; end-session dialog; first run. The assay page is left out: no control in the window opens it (`openAssay`, `reveal_component.ts:2240`, is bound to nothing).

## prerequisites

- none

## context_files

- `../sdd-kit-3/AGENTS.md`
- `process/planning/2026-11-04-shell-to-react/PLAN-2026-11-04-shell-to-react-r3.md` (Gates; text that changes between runs)
- `harness/shakeout/lib/electron.ts`, `harness/shakeout/lib/scratch.ts`
- `harness/shakeout/split_returns_to_panes.ts` (launch and drive pattern)
- `web/reveal.html`, `web/reveal_component.ts` (the screens and how each opens)

## signal contract

### Emits

- No new tags. The capture drives the app as the gates do; the run's `window.__vmSignals` holds `DRIVER_ROSTER_LOADED`, `SESSION_OPEN_REQUESTED`, `SESSION_OPEN_ACKED`, `TURN_SUBMITTED`, `TURN_ACK`, `STREAM_ATTACHED`, `STREAM_ENVELOPE_APPENDED`, `TURN_PARKED`. `SESSION_END_REQUESTED` does not fire: the end dialog is opened, not confirmed.

### Invariants

- No file under `web/` changes. Masks are overlay boxes the harness appends to `<body>` at capture time and removes after the screenshot; the source carries none.
- The UI vocabulary is untouched.

## artifact contract

### Files created

- `harness/pixel/capture.ts`
- `harness/pixel/masks.ts`

### Content assertions

- `capture.ts` names all 14 screens and both sizes.
- `masks.ts` exports the volatile-text patterns: `t+` times, "N ago" relative times, ticking seconds in the activity line, `s_` session ids, scratch paths.

### Command exit codes

- `npx tsc -p harness` returns 0.
- `npx tsx harness/pixel/capture.ts sprint-192-check` returns 0.

## observation contract

### Driving steps

- Run `npx tsx harness/pixel/capture.ts sprint-192-check`.

### Expected results

- 28 PNG files under `captures/pixel/sprint-192-check/`.
- Each 1440×900 capture is 2880×1800 pixels and each 900×380 capture is 1800×760 (device scale 2), read from the PNG header.
- Each capture is not a single colour (the screen drew).
- A second run writes the same 28 names.

### Expected visual state

- The captures are opened and looked at: each shows the screen its name says.

## done criteria

The capture script draws every reachable screen at both sizes, with volatile text masked, from a clean launch, and does it again on a second run.

## notes

- The capture runs Electron from source, the shipped renderer. Phase 8 captured in Playwright's Chromium.
- `captures/` is where Phase 8 kept its baseline; check `.gitignore` before writing.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] `context_files` covers the gate library, the plan and the template.
- [x] Signal contract names only tags in vocabulary 0.3.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Two files, one concept.

## result

Closed 2026-11-04.

- `harness/pixel/capture.ts` and `harness/pixel/masks.ts` written. `npx tsc -p harness` exit 0. `npx tsx harness/pixel/capture.ts <label>` exit 0, in about 7 s, four runs.
- 28 PNGs per run: 1440×900 captures at 2880×1800, 900×380 at 1800×760; each has hundreds of distinct colours. Two clean launches (`sprint-192-check`, `sprint-192-check-2`) are pixel-identical in all 28 files.
- Looked at: panes after one turn, meta with the inspector open, the records page, the end dialog at 900×380. Each shows the screen its name says.
- Fired, through the end dialog: `SESSIONS_LOADED WORKSPACES_LOADED BUNDLE_ROSTER_LOADED DRIVER_ROSTER_LOADED DRIVER_PICKED DRIVER_VERSION_PICKED BUNDLE_PICKED SESSION_OPEN_REQUESTED SESSION_OPEN_ACKED TURN_SUBMITTED STREAM_ATTACHED TURN_ACK STREAM_ENVELOPE_APPENDED TURN_PARKED TOPOLOGY_LOADED`. After the first-run reload: `SESSION_ATTACH_STARTED` and the loads again; the reload reattaches the session in the URL.

Fixed during the sprint, from looking at the captures:

1. Playwright's `mask` paints an element's whole box, ignoring scroll clipping: the time column of rows scrolled above the stream covered meta's lens chips. Masks are now fixed overlay boxes clipped by every scrolling ancestor and the window.
2. Masking a whole element hid a whole payload for one id inside it. Masks now cover only the matched characters, from a text Range's client rects.
3. The inspector capture clicked the first stream row, which sits above the visible area because the stream sticks to the bottom. It now clicks the `UserMessage` row and scrolls the inspector into view.
4. Record instance ids (26-character ULIDs) changed between runs; a pattern was added.

## Rubber Duck pass

*Sequence.* The roster, workspace and bundle loads fire at boot. Binding the pane fires the three picks, then `SESSION_OPEN_REQUESTED` and `SESSION_OPEN_ACKED`. The turn fires `TURN_SUBMITTED`, `STREAM_ATTACHED`, `TURN_ACK`, one `STREAM_ENVELOPE_APPENDED` per envelope, and `TURN_PARKED`. Opening meta's structure lens fires `TOPOLOGY_LOADED`.

*Observations.*
- Missing pair: none.
- Order violation: none; each request precedes its acknowledgement.
- Vocabulary gap: none for this sprint. The vocabulary has no view tags (known; the plan's vocabulary table).
- Payload anomaly: not checked; the capture reads tag names only.
- Timing surprise: about 7 s for 28 captures from a cold launch.
- Tone trace: the end dialog reads "End session fix-race-in-metering?", prototype fixture text (lens finding F328, placed in plan sprint B1).

*Dispositions.* The tone trace is `recorded`: F328 is open and placed. The rest need none.

## notes added at close

- `captures/pixel/` is not in `.gitignore`. The baseline sprint (plan A2) decides what is kept: the baseline is committed, check runs are not.
- The scratch folder's absolute path appears in the workspace chip; it is the same on every run on this machine, and masked only where it contains `.scratch/`.
