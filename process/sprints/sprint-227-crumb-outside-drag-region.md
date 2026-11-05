---
id: 227
status: closed
phase: shell-to-react B3 prerequisite
pass_kind: functional
---

# Sprint 227 — the crumb leaves the window's drag region

## scope

In Electron the top bar is the window's drag region (`-webkit-app-region: drag`, `web/reveal.ts`), and its controls are taken out of it by attribute selectors on their inline style: `[style*="cursor:pointer"]`, `[style*="cursor: pointer"]`, `[style*="cursor:text"]`. React writes inline styles with a space after the colon. The pointer rule has both spellings; the text rule had only the unspaced one, so the crumb (`cursor: text`, double-click to rename, UI sprint 145) sat inside the drag region, where Electron hands the mouse to the window. A probe on 2026-11-05 read the crumb's computed region as `drag`. Gates drive the page through Playwright's synthetic events and never saw it. The rule gains the spaced spelling, and `one_top_bar.ts` checks every control in the bar.

## artifact contract

- Modified: `web/reveal.ts` (contains `[style*="cursor: text"]`), `harness/shakeout/one_top_bar.ts` (contains `controls inside the drag region`).
- `npm run build` 0; `npx tsc -p harness` 0.

## observation contract

`one_top_bar.ts` exits 0; with the spaced rule planted out it exits 1 naming the crumb; `naming_sessions.ts` exits 0.

## result

Closed 2026-11-05. Probe after the fix: crumb `no-drag`. `one_top_bar.ts` 0 ("… controls outside the drag region"); planted: exit 1, "top-bar controls inside the drag region: ["pane-1"]"; `naming_sessions.ts` 0. Restored and rebuilt.

## Rubber Duck pass

No signals. Observation: a defect in today's app, found while moving the bar (the React bar draws the same style); fixed here.
