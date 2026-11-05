---
id: 279
status: closed
phase: shell-to-react C4 pixel gate
pass_kind: functional
---

# Sprint 279 — no hover in a pixel capture

## scope

One capture run after sprint 277 differed in `meta-structure@1440x900` by 34 pixels: the first producer row's "i" lost its dot over a short underline, its hover style. The next run matched. The capture clicks the lens chip at 900×380, then widens the window; the row that comes under the resting mouse takes its hover style only when Chromium's delayed mouse move arrives before the shot. `harness/pixel/capture.ts` moves the mouse to the window's corner before every shot. Its comment that the app redraws every 500 ms (true until sprint 268) is corrected.

## artifact contract

- Modified: `harness/pixel/capture.ts` (contains `win.mouse.move(0, 0)`). `npx tsc -p harness` 0.

## observation contract

Two captures in a row equal each other and `baseline-2026-11-05-b6`, 28 of 28.

## result

Closed 2026-11-05. `sprint-277-a` vs `sprint-277-b` 28/28; baseline vs `sprint-277-a` 28/28, so no baseline capture held a hover.

## Rubber Duck pass

No signals. Observation: timing surprise in the capture, resolved here.
