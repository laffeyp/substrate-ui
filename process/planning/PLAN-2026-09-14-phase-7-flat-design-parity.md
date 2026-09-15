# PLAN — Phase 7 · Flat-design parity for turn 19 and turn 20 · 2026-09-14

## What this is

The reveal shell ships every feature the sprint-051 tree renders and
adds the projection to real sessions. What it does NOT ship is every
detail the ratified flat designs specify — the turn-19 and turn-20
frames in `handoff_latest/sheets/Substrate Shell Directions v3.dc.html`.
The controller and PaneRegistry are correct; the templating on top of
them has drifted below the design bar.

Phase 7 is the audit + fix pass. Every 19-series frame, then every
20-series frame, then an end-to-end test that spins a real delegate
child at the depth cap.

## Source of truth

- `handoff_latest/sheets/Substrate Shell Directions v3.dc.html` — the
  flat designs (frames 19a–19m, 20a–20f).
- `handoff_latest/docs/DESIGN-DECISIONS -through 2026-09-01-.md` — the
  written decisions the frames encode (D66f workspace picker, D68
  collections-ephemeral, D69 first run, D70 talk-to-a-delegate, D41
  depth cap, D66g rate-limited, D66h confirms-are-UI).

## The gaps by frame

Each row names the frame, the design intent (one line), and the
current implementation state. "Missing" means no code path exists;
"partial" means scaffolding present but off-design; "landed" means the
frame passes.

### Turn 19 — the round-2 gap frames

| Frame | Design intent (one line) | Current state |
|---|---|---|
| **19a** | `⌘D` splits — the fresh pane IS the workspace picker: 5 rows (`inherit` preselected, `recent` × N, `sandbox`, `choose folder…` with `⌘O`), input row `type a path — ⇥ completes · ↑↓ pick · ↵ bind + start`. | partial — rows render, but inherit tag missing, `choose folder…` row missing, `⇥` completion missing, `↑↓` nav missing, hint line off. |
| **19b** | Blank window (`⇧⌘N`) — same picker full-screen. | missing — no `⇧⌘N` binding, no full-screen empty-state picker. |
| **19c** | `⌘,` settings surface — theme, type size, bindings. Nothing else earns a row. | missing. |
| **19f** | File ▸ Export Record — `.record` directory as two shapes (replayable / events.jsonl). | missing. |
| **19g** | Session ▸ End Session — one confirm dialog (D66h); on a LIVE session interrupts the turn first (D68). | partial — `showEndConfirm` exists; live-session interrupt path not verified against the design. |
| **19h** | `⌘F` find in stream lens — matches bright, non-matches dim to .35. | partial — find bar exists; scope-based dimming not confirmed against 19h. |
| **19i** | Rate-limited from RateLimitedResponder's real backoff — quiet transcript line with retry counts, status dot hollows. | missing — no rate-limit surface wired to the controller's connection state. |
| **19j** | Delegate at the depth cap (D41) — ordinary failed ToolResult rendered in-place. | dependent on 20-series. |
| **19k** | Find in the transcript (terminal view) — same bar, transcript scope, current match on the accent, others neutral. | partial. |
| **19l** | Find in the transcript inside the revealed view — bar rides focused pane, stream stays live. | partial. |
| **19m** | First run — the picker leads with a machine driver probe: ollama·local expanded to installed models, ollama·cloud keyed by sign-in state, claude CLI on PATH, API providers grouped by env keys, deterministic as floor; found default preselected; workspace defaults to `~/Documents/substrate`. | missing. |

### Turn 20 — talking to a delegate (D70)

| Frame | Design intent (one line) | Current state |
|---|---|---|
| **20a** | Descend one level (default) — child only, no outer text; path row above the prompt is the way back. | partial — `S.descent` scaffolding present; wired to scripted `CH` map, not to a real child record. |
| **20b** | Two levels down — same rule, path row grows, esc climbs one at a time. | partial — same as 20a. |
| **20c** | Non-talkable child — its topology accepts no UserMessage: NO prompt box, stream rolls, path row says "watching". | missing — talkability gate not wired. |
| **20d** | Nested descent (setting) — parent text stays visible, dimmed, around the child. | missing — no setting. |
| **20e** | Nested view, two levels — same rule at depth 2. | missing. |
| **20f** | Depth ramp — hue interpolates blue → violet across depths 1–5 (`#82a5c8, #93a0cb, #9a9bce, #a096d0, #ac92d4, #b88fd9`), applied to `⑂` line, inset border, path chip, focused prompt. | missing. |

## The end-to-end test the user asked for

A single Playwright script:

1. Boots the reveal shell on `/`, opens a session with a real driver.
2. Sends a turn whose model reply calls `delegate` — the child runs a
   trivial topology that emits a `Draft`.
3. Waits for the delegate ToolResult to fold back into the parent.
4. Verifies the parent transcript now shows the collapsed `⑂` line.
5. Clicks the `⑂` inset — the shell descends into the child. Verifies
   the transcript shows ONLY the child, the path row reads
   `session › ⑂ <child-name>`, and the prompt-box either appears
   (talkable) or does not (non-talkable) per the child topology.
6. Sends the same delegate call twice more so depth reaches the cap
   (D41 = 2); verifies the depth-3 delegate call renders as a failed
   ToolResult (19j).
7. Presses `esc` — climbs one level. Presses `esc` again — climbs to
   root.

Ratifies: 20a, 20b, 20c, 20f (rendering), 19j (the refusal), plus
depth-cap correctness end-to-end. Named
`harness/e2e_delegate_depth.ts` and runnable as `npm run e2e:delegate-depth`.

## Order of landing

The order matches user-visible cost: fix the picker (19a/19b/19m
first), then the settings/exports/end-session (19c/19f/19g), then
find scopes (19h/19k/19l), then rate-limit (19i), then delegate
descent + depth-cap + hue ramp (20a–20f + 19j), then the e2e test.

Each frame lands as its own commit under a `phase 7/<frame>` label so
the audit trail per frame is legible.

## What "done" looks like

- Every 19- and 20-series frame renders to design in the reveal shell,
  driven by the real controller (no scripted fallbacks in the code
  paths the user actually walks).
- `npm run e2e:delegate-depth` is green and asserts descent, path row,
  talkability gating, and the depth cap.
- A fresh status doc supersedes `STATUS-2026-09-14-phase-4-closed.md`
  and lists the frames now closed.
- `handoff_latest/docs/DESIGN-DECISIONS -through 2026-09-01-.md`
  remains untouched (audit trail); this plan and its follow-on status
  are the record.

## Non-goals

- No server-side additions in this phase; every gap listed above is
  client-side. If a frame turns out to depend on a missing endpoint
  (e.g. `.record` export), that frame moves to a follow-up and the
  reason is written into the status doc.
- No settings persistence beyond the SQLite whole-state restore path
  D68 already names as the persistence mechanism.

## Sources

- `handoff_latest/sheets/Substrate Shell Directions v3.dc.html`
- `handoff_latest/docs/DESIGN-DECISIONS -through 2026-09-01-.md`
  (D41, D66f, D66g, D66h, D67, D68, D69, D70)
