# Sprint 016 — terminal dock-head polish + driver-picker theming

---

```yaml
---
id: 016
status: closed
phase: terminal
pass_kind: content
---
```

---

> RETROACTIVE CARD (2026-07-31, review F-27): commits `e3f9175`, `81c8f2d`, `49af067` shipped with no
> card, no Built entry, and no diary line — and `49af067` reverses `81c8f2d`. This card records what
> landed and why the reversal, so the ledger matches the work (the repo's own 2026-06-23 diary title:
> "code-first is a trap even for 'small' items").

## why

Follow-on polish to sprint 015 (call parameters in the agent terminal). Two visual defects the user
flagged on the running console: the driver picker did not match the console theme, and the dock head
(driver picker + params strip + mode hint) misbehaved under width pressure.

## what shipped

- `e3f9175` — the driver `<select>` styled to the console theme (`.term-model`): dark surface, the
  console's border/foreground, no default-OS chrome.
- `81c8f2d` — first attempt at the width behaviour: `flex-shrink:1/2`, `min-width:0`, ellipsis so the
  head degrades gracefully as the window narrows (a responsive head that never wraps to a second line).
- `49af067` — REVERSED that. The user, watching the running console, saw the head shrink a little and
  then "boom, jump over to the right" — the graceful-degradation shrink read as a layout glitch, not as
  intended behaviour. Replaced with `.term-head > * { flex-shrink:0; white-space:nowrap; }` — the head
  is RIGID: nothing shrinks, it clips at the container edge instead. Plus a workflow-parity backlog note
  in `process/BACKLOG.md`.

## the reversal, stated

`81c8f2d` (responsive, shrink-to-fit) and `49af067` (rigid, never-shrink) are opposite designs. The
responsive one is the textbook choice and it was wrong HERE: on a fixed terminal dock the shrink is
read as instability, not adaptation. The decision was made against the running console, not in the
abstract — the rigid head is calmer and the clip is predictable. Recorded so the flip is not a silent
"why does the ledger show two contradicting commits."

## observation contract

`pass_kind: content` (a visual sprint; behaviour unchanged). Perceptual track (the agent VIEWS the
screenshots), the right fixture for a "never wraps / never shrinks" claim — four widths:

- `screenshots/driver-styled.png` — the themed picker.
- `screenshots/head-{560,760,1000,1400}.png` — the rigid head at four widths; it clips, never wraps,
  never shrinks. (`screenshots/` is gitignored; the harness that regenerates them is in-repo, so the
  evidence reproduces — that is the half that matters.)

Structural track: `node --check web/index.html` is not meaningful for inline HTML/CSS; the console e2e
(`npm run e2e`) still passes with the restyled head.

## done criteria

The driver picker matches the theme; the dock head is rigid (no shrink, no wrap, clips at the edge);
the console e2e stays green; the ledger records all three commits and the reversal. Met.
