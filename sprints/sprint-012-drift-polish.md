---
sprint: 012
slug: drift-polish
status: in-progress
pass_kind: web-frontend + backend
cadence: auto-within-phase
context_files:
  - web/app.js
  - web/index.html
  - server.py
  - harness/e2e_console.js
  - process/BLACKBOARD.md
---

# Sprint 012 — drift-watchlist polish

## Why

The `## Drift watchlist` accumulated LOW-priority items deferred from sprints 008–010 + review #50.
The Architect greenlit clearing them. Each fold gets the two-track observation contract (structural
+ perceptual) — front-end changes run BOTH tracks (the standing WORKING_AGREEMENT rule).

Honesty note: the first two items (B, C) were built code-first before this card existed — a discipline
miss the Architect flagged ("make sure we're following SDD style"). This card documents them and
declares the contract BEFORE code for the remaining two (C2, A).

## Items + contract

### B — replay top speed was render-bound → requestAnimationFrame  [DONE · d636cf2]
- **Artifact:** `web/app.js` play loop is now a rAF loop (advance N seqs/frame, render ONCE/frame);
  honest speeds restored (4/30/120/480 seq/s).
- **Observation:** structural — `e2e_console.js` §14 plays a 200-seq tail at 480/s and reaches max
  (the old ~60/s loop couldn't in the window); perceptual — `screenshots/replay_raf.png` VIEWED.

### C — runs/ rail grouping (demos vs your-runs, newest-first)  [DONE · this commit]
- **Artifact:** `server.py` tags each record `source=demo|run`; `web/app.js` groups "your runs"
  (newest-first by ULID `run_id`) above "demos"; `web/index.html` `.rail-group` CSS.
- **Observation:** structural — `e2e_console.js` asserts the rail shows a "your runs · N" + a "demos"
  group; 24 server tests pass; perceptual — `screenshots/rail_grouped.png` VIEWED.

### C2 — prune affordance (clear your runs) + clean detritus  [NEXT — contract declared here]
- **Why:** 239 session runs accumulated; grouping corrals them but buries the demos. A prune clears them.
- **Artifact:** `server.py` POST `/api/runs/clear` — deletes ONLY `runs/*.record`, never a bundled
  demo, CSRF-guarded exactly like `/api/launch`; a "clear" control in the your-runs group header that
  confirms then POSTs + reloads the rail. Plus a one-time clean of the current detritus.
- **Observation:** structural — a server test: clear removes the runs and KEEPS the demos, and a fresh
  launch still records (the path isn't broken); perceptual — the rail after clear shows demos at top.

### A — glider fixture for the mirror-blind pixel decode  [NEXT — contract declared here]
- **Why:** the blinker is mirror-symmetric, so `capture_scene`'s pixel decode can't catch a pure
  L-R / U-D mirror render bug (review #50). An asymmetric, moving glider can.
- **Artifact:** a `game_of_life` glider config + committed record (asymmetric, moving); `capture_scene`
  (or a sibling) decodes the glider across generations.
- **Observation:** structural+perceptual — the decoded glider cells match the record across generations
  and are asymmetric, so a mirror render would now diverge (closing the decode's blind spot).

## Close

Per item: Rubber Duck Pass in BLACKBOARD `## Sprint tail`; `## Built` entry; mark each Drift item
`[FOLDED]`; KIT_DIARY. Duplex-pipe review of the cluster at the end.
