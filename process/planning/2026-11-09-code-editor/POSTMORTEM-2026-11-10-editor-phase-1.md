# Postmortem — code editor Phase 1 built without design verification

*2026-11-10.*

---

## What happened

Fourteen sprints (389–402) built the code editor view: shell, file tree, modified dots, column folds, drag handles, dock positions, side swaps, focus folds, View menu entries, and an integration gate. Every sprint touched UI. Every sprint closed with structural gates passing and "no observations" in the Rubber Duck Pass.

The editor was never checked against the design files. The design files exist at `../design/received/handoff 5/sheets/Substrate Shell Directions v11.dc.html` (eleven versions, the most recent being v11). None were listed in any sprint card's `context_files`. None were read. No screenshot of the running editor was compared against them.

When the screenshots were opened on 2026-11-10, the editor does not match the designs.

---

## What failed

**Hard rule 8 was violated in every sprint.** AGENTS.md hard rule 8: "Include design context for UI-touching sprints. If the sprint's artifact contract includes any path matching `app/**/*.tsx`, the sprint card's `context_files` MUST include the project's design canon." Every sprint from 389 to 402 authored or modified files in `web/app/editor/*.tsx` and `web/app/App.tsx`. None included design files in `context_files`.

**The perceptual track was never run.** WORKING_AGREEMENT names two tracks: structural (DOM and signal assertions) and perceptual (screenshots read by the agent at working widths). Every sprint ran Track 1 only. No gate took a screenshot until the verification roadmap added them on 2026-11-10, after all 14 sprints had closed.

**Every Rubber Duck Pass found zero observations.** Fourteen consecutive passes, each recording "no observations." The AGENTS.md Rubber Duck Pass section names six observation categories. A single sprint producing zero observations is possible. Fourteen in a row on UI work is a signal the pass was not being run against real traces or real screenshots — it was running against the in-memory signal array only, which bypasses the main process, the invariant checker, and the disk writer.

**The adversarial lens was never applied.** Addendum A §A1 names three verification lenses: structural, perceptual, and adversarial. The adversarial lens asks "could this lie?" — could the gate pass while the installed app is broken? Every gate used `sendCmd("toggle-editor")` through the shell channel after calling `bindPaneAsUser`, bypassing the real input path (the Electron menu accelerator ⌘⇧E). The adversarial question was never asked.

**The installed app was stale.** The app at `/Applications/Substrate.app` was built on 2026-11-08. The editor code landed on 2026-11-09. ⌘⇧E did nothing in the installed app because the editor code did not exist in that build. No sprint built the package or tested against it.

---

## Root cause

The structural gates passed. Thirty-three checks across eight gates, all green. Each gate verified DOM elements and signal payloads through Playwright queries against a dev launch with a pre-bound session. The gates proved the wiring: components mount, signals fire, elements appear and disappear.

The gates did not prove the editor matches the designs, because the designs were never read. They did not prove the editor works in the installed app, because the installed app was never built. They did not prove the editor opens through ⌘⇧E, because the real menu path was never exercised.

Addendum A names this failure mode: "a green structural test is the most seductive possible cover for skipping the real check, because it is genuinely rigorous and still only half the job."

---

## What the kit required and what was skipped

| Requirement | Source | Applied? |
|---|---|---|
| Design context in `context_files` for UI sprints | AGENTS.md hard rule 8 | No — zero of 14 sprints |
| Track 2 perceptual screenshots | WORKING_AGREEMENT observation contract | No — zero screenshots taken |
| Adversarial lens on the observation contract | Addendum A §A1 | No |
| Real input path (menu ⌘⇧E, not shell channel) | Addendum A §A4 | No |
| Tags in the packaged trace (the trace rule) | WORKING_AGREEMENT, sprint 381 | No — no package was built |
| Rubber Duck Pass with real traces | AGENTS.md sprint close procedure | No — passes ran against in-memory signals only |
| Design-to-screenshot comparison | Addendum A §A1 perceptual lens + hard rule 8 | No |

---

## Immediate findings (2026-11-10)

1. A fresh build was produced (`npm run build`, `npm run pack:runtime`, `npx electron-builder`), installed at `/Applications/Substrate.app`, and gated. ⌘⇧E through the Electron menu opens and closes the editor. Signals fire. The trace is clean. The gate passes structurally.
2. The screenshots show the editor does not match the designs. The designs were not read in this session; the mismatch is the user's assessment on seeing the screenshots for the first time.
3. `electron/preload.ts` has no IPC handlers for `toggle-editor-left`, `toggle-editor-right`, `toggle-editor-bottom`. The View menu column toggles (sprint 397) send these commands through IPC, but the preload does not receive them. Column toggles work only through `keymap.ts` keyboard shortcuts, which dispatch `KeyboardEvent` directly. The structural gate missed this because it uses `pressKey()`.

---

## Corrective actions

1. The design files at `../design/received/handoff 5/sheets/` must be read and the editor compared against them before any further work.
2. Every UI sprint card from this point forward must list the design files in `context_files`, per hard rule 8.
3. The hard stop (BLACKBOARD user entry, 2026-11-09) comes after the whole code editor is done and confirmed; the other editor modes wait for the design team's Claude Design SDD Process.
4. The missing preload IPC handlers for column toggle menu items must be fixed.
