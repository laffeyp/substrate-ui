---
id: 226
status: closed
phase: shell-to-react B2 gate
pass_kind: functional
---

# Sprint 226 — the first-run and footer gate asserts the fixes

## scope

`harness/shakeout/first_run_footer.ts` reads the footer by `data-footer` and asserts: no status and "unbound — pick a workspace" before a session; "● live · session <name>" after a turn; "● finalised · session <name>" after the end, read once the controller has unbound the session; first run shows neither "s-1a04" nor "~/Documents/substrate" and names "fresh per-session sandbox".

## artifact contract

- Modified: `harness/shakeout/first_run_footer.ts` (contains `● finalised`, `data-footer`, `fresh per-session sandbox`).
- `npx tsc -p harness` 0.

## observation contract

- The gate exits 0 on the tree; with the `endedReason` branch of `footerText` disabled it exits 1.
- All 50 `gates:electron` scripts, run alone, exit 0; pixel captures equal `baseline-2026-11-05-b2`.

## result

Closed 2026-11-05. Gate 0 ("after the end ["● finalised","session pane-1","⌘M toggles meta"]; … first run shows no fixture text; pick closes first run; DRIVER_PICKED deterministic"). Planted: exit 1, "footer: expected finalised · session pane-1; reads ["","session pane-1","⌘M toggles meta"]". The first version read the footer as soon as it said finalised, which it does between `closeStreamOnEnd` and `forceClose`; once `forceClose` cleared the session id the footer went blank, so `footerText` now reads the end before the session id and the gate waits for the unbind. Full run: 50 of 50 exit 0; Axis C bugs 0; pixels 28/28 at 0.

## Rubber Duck pass

`SESSION_END_REQUESTED` (reason `user_end`) — the end was requested; `SESSION_ENDED_LOCAL` — the controller recorded the end; `DRIVER_PICKED` (driver `deterministic`) — first run's pick reached the controller. Order as stated. Observation: timing surprise (above), resolved here.
