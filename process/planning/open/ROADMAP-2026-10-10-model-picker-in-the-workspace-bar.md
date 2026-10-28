# ROADMAP: the model picker moves into the workspace bar

*2026-10-10.*

**Input.** The Architect's direction of 2026-10-10, given in conversation.

**Goal.** A pane with no session shows one bar at its bottom: the workspace picker on the left and the model picker on the right, with a divider between them. The workflow runs left to right. Picking an existing session resumes it on its own model, and the right half is never used. Picking a folder (per session sandbox, a recent folder, a typed path, choose folder…) ungreys the right half; picking a model there starts the session. The header's model chip stops being a dropdown and becomes an indicator of the model picked. Clicking it opens a card with more detail, as the workspace chip does today. With this done, the Architect counts the app release-ready.

## What exists today

- **The workspace picker** (`web/reveal.html:116-141`, rows built at `web/reveal_component.ts:1002`). It is a panel inside the pane, at the bottom, open whenever the pane has no session. Its rows are folders with a left chevron (▸/▾) that expand into that folder's sessions. Each row has a meta column and a key hint, and a text box below takes a typed path, with ↑↓ ↵ keys.
- **The model picker** (`web/reveal.html:53-54` in each pane header, `:28-29` in the window header; rows built by `_buildDriverOpts`, `web/reveal_component.ts:574`). It is a dropdown that floats under a chip, mouse only. It has group headers and three levels (CLI, then family, then pin), each a pick, indented 12/28/44 px, with a right chevron (◂/▾).
- **Both header dropdowns already refuse to open once the pane has a session** (`toggleDd`, `:1288`, and `fpToggleDd`, `:2062`, sprint 085). The model picker therefore only ever works before a session exists, and moving it into the bar loses no use it has today. A mid-session change stays with `/model` (U121's SessionChanged path).
- The specs still describe the header dropdown: product spec round 13 line 704, tech spec round 7 line 1257, design spec round 2 §3 ("Driver ▾ swaps mid-session").

## Decisions for this roadmap

| Decision | What it decides |
|---|---|
| The model half takes the workspace half's form | The same box and row rhythm, open without a click, and expanding in place. It keeps every function of the dropdown: group headers, three levels, every row a pick, the right chevron, the current model in bright text. |
| Greyed until a folder is picked | Picking a folder row arms it, highlights it and ungreys the right half. Picking a session sub-row attaches as today and starts nothing on the right. |
| A model pick starts the session | `openSession` with the armed workspace and the picked driver, family or pin. |
| Keys cross the divider | ↵ on a folder arms it and moves the selection into the model half, on the current model. ↑↓ move within the half. ↵ starts the session; esc returns to the left half and disarms. |
| Narrow panes | Below the header's 480 px step, the model half sits under the workspace half, with a horizontal divider. |
| The header chip becomes an indicator | No ▾ and no dropdown, in both the pane and window headers. A click opens a card: driver, version (`driverVersion`) and bundle (`bundleSlug`), styled like the workspace card. On a pane with no session it shows the model the bar holds. |
| The frozen-dropdown code goes | `ddFor`, `toggleDd`, `fpToggleDd`, `fpDdOpen`, `fpDriverOpts` and the header `driverOpts` binding are removed. `_buildDriverOpts` feeds the bar. |

## Order and checks

Each step's check runs against the installed Substrate.app.

**1. U124: the model half of the workspace bar.** Build the right half, its greyed and armed states, the keys and the narrow layout. *Check:* in the installed app, a new pane shows the right half greyed. Picking per session sandbox ungreys it, and picking a model starts a session on that driver. Picking an existing session under a folder resumes it on its own driver.

**2. U125: the header indicator.** Both chips become indicators with an info card; the dropdown code is removed. *Check:* the chip has no ▾; a click shows driver, version and bundle; on a pane with no session, the chip follows the bar's pick.

**3. U126: gates.** Update `driver_chip_on_resume.ts`, which reads the chip at `[data-dropdown-region="driver-pane"] > span`. Add `model_half_starts_session.ts` covering U124's check, so the Electron gates go from 11 to 12. Then run the UI suite once, build, install and run all 12 gates on `/Applications/Substrate.app`.

**4. U127: amend the specs.** Product spec round 14 (supersedes line 704), tech spec round 8 (supersedes line 1257's "Session-header dropdown"; the wire stays `POST /api/session {driver}` on create, and `PATCH` through `/model`), and design spec round 3 (§3: the header carries an indicator, the bar carries the picker, and `/model` is the mid-session swap). Earlier rounds stay untouched.

Tests per card cover the changed code only; the full UI suite runs once, in U126.
