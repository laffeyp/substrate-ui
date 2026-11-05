---
id: 197
status: closed
phase: shell-to-react A3
pass_kind: functional
---

# Sprint 197 — React 18.3.1 in package.json

## scope

Add `react` and `react-dom` 18.3.1 to `dependencies` (exact), and move `@types/react` and `@types/react-dom` from `^19.3.0` to 18 (`^18.3.27`, `^18.3.7`). The window still loads React from cdnjs; that changes in the next sprint. Nothing the window runs changes.

## artifact contract

- Modified: `package.json`; `package-lock.json` follows from `npm install`.
- `node_modules/react/umd/react.production.min.js` and `node_modules/react-dom/umd/react-dom.production.min.js` exist (the next sprint loads them).
- `npm run build` 0; `npm run test:unit` 0.

## signal contract

None changed: the window's code is the same build (`reveal-COEa9GEn.js`, same hash before and after).

## observation contract

- The pixel captures compare equal to the baseline.
- Gates `transcript_follow`, `input_bar`, `tool_output_toggle`, `delegate_pane` (the React transcript's) pass.

## result

Closed 2026-11-04. `npm run build` 0, the bundle hash unchanged (`reveal-COEa9GEn.js`, 79.99 kB); unit specs 62/62; the four transcript gates exit 0. `tsc` under `@types/react` 18 passes for the transcript's `.tsx`.

The first pixel comparison failed 22 of 28 although the build was byte-for-byte the same. The cause was not this sprint: the deterministic driver's reply digest changes with time, and two more mask faults showed under repetition. Fixed in sprint 198; after it, three fresh captures compare equal to the recaptured baseline.

## Rubber Duck pass

No signals changed. Observation: a check that failed for a reason outside the sprint (the baseline's masks); resolved in sprint 198 before this card closed.
