---
id: 333
status: closed
phase: shell-to-react E6.2
pass_kind: functional
---

# Sprint 333 — gate: the policy holds across the window

## scope

`harness/shakeout/csp_holds.ts`: the page carries the policy; a `securitypolicyviolation` listener installed before the page's first script (an init script, then a reload) and the console's "Refused to" lines count every violation while the window runs a turn, meta's five lenses, the side graph, find, the records page and the settings dialog; none appears, nor Electron's insecure-policy warning. `package.json` runs it in `gates:electron` (59 scripts).

## artifact contract

- Created: `harness/shakeout/csp_holds.ts`. Modified: `package.json`.

## observation contract

The gate exits 0; with an inline `<style>` written at boot it exits 1 naming `style-src-elem`.

## result

Closed 2026-11-05. 0. The first draft attached its listener after boot, and the planted boot-time style passed it (exit 0); with the listener installed before the page loads, the planted style fails it: `violations: ["style-src-elem inline"]`.

## Rubber Duck pass

No signals.
