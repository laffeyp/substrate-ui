# Roadmap — the code editor, SDD verification (round 5)

*2026-11-09. Supersedes `ROADMAP-2026-11-09-code-editor-r4.md` (left on disk). Round 4 planned five implementation phases. The implementation ran 14 sprints (389–402) and closed Phase 1 with 33 structural checks passing. ⌘⇧E does nothing in the installed app. No sprint ran the perceptual track, no sprint verified tags in the packaged trace through the real input path, and every Rubber Duck Pass recorded zero observations. This round applies the SDD kit's verification techniques to the existing code so the editor can be seen working — or its failures can be located and fixed.*

---

## The problem

Sprints 389–402 built the editor view shell, the file tree, modified dots, column folds, drag handles, dock positions, side swaps, focus folds, edge states, View menu entries, and an integration gate. Every structural gate passes. The build is clean (`tsc` 0, `npm run build` 0, `npm run signals` 0). Unit tests pass (170/170).

The user presses ⌘⇧E on the installed app. Nothing happens.

The gate tests drive the editor through `sendCmd("toggle-editor")` over the shell channel after calling `bindPaneAsUser`, which creates a session via the HTTP API. The real input path — the Electron menu accelerator ⌘⇧E dispatching through `menu.ts` → IPC → the renderer's command handler — was never exercised by any gate. `toggleEditor()` at `App.tsx:987` calls `showsBinding(fp, s.controllerSnapshots)` and returns silently when the pane has no bound session. The gate masks this by binding first.

Addendum A names this failure mode exactly: "a green structural test is the most seductive possible cover for skipping the real check, because it is genuinely rigorous and still only half the job."

---

## What the kit requires and what was missing

Each technique below names its source, states what the editor sprints did, and states what the technique requires instead.

### 1. The observation contract's Track 2 — perceptual (WORKING_AGREEMENT, Addendum A §A1–A2)

**Did:** Track 1 only. Every gate checks DOM elements and signal payloads through Playwright queries. No gate takes a screenshot. No gate reads the rendered window at working widths.

**Requires:** Screenshots of the running editor at two widths — 1512 points (a 14-inch MacBook full screen) and 504 points (a third of the screen, the window's minimum). The agent reads each screenshot and confirms: three columns visible, file tree populated, modified dots present, fold rails replacing columns when folded, the transcript and input bar in the bottom panel. A screenshot too large to view is a screenshot not looked at (A6) — element-screenshot the editor shell, not the full page.

### 2. The trace rule (WORKING_AGREEMENT, sprint 381)

**Did:** The gates launch Electron via Playwright, drive through the shell channel, and check `__vmSignals` in the window's JavaScript. The tags fire in the Playwright-launched process. The packaged app's on-disk trace (`main.jsonl`, `window.jsonl`, `server.jsonl`) was never read by any gate or any Rubber Duck Pass.

**Requires:** Tags fire in the packaged app's trace, read after the app closes by `scripts/read_trace.py`. The gate builds the package, launches `Substrate.app`, drives the editor through its real input path (the ⌘⇧E menu accelerator, not `sendCmd`), waits for the editor to appear, closes the app, and reads the trace. EDITOR_OPENED, EDITOR_DRAWN, PANE_DRAWN(state=editor), EDITOR_CLOSED, and PANE_DRAWN(state=session) appear in the trace with correct payloads. An INVARIANT_BROKEN in `main.jsonl` fails the gate.

### 3. The real input path, not the shell channel (Addendum A §A4, Addendum B §H1)

**Did:** Every gate calls `sendCmd("toggle-editor")`, which pushes a command string directly into the shell channel's listener set. The Electron menu item at `menu.ts:111–134` registers ⌘⇧E as an accelerator. The gate never presses ⌘⇧E and never triggers the menu item.

**Requires:** The gate exercises the menu accelerator. Playwright's Electron API provides `electronApplication.evaluate()` to call `Menu.getApplicationMenu()` and click the item, or the gate dispatches the accelerator through Electron's `globalShortcut` or `webContents.sendInputEvent`. The shell channel path remains as a secondary check; the menu path is the primary because it is the path the user walks.

### 4. The unbound-to-bound transition (Addendum A §A4 — verify the observer)

**Did:** The gate calls `bindPaneAsUser` before testing the toggle. This creates a session via HTTP, which populates `controllerSnapshots` so that `showsBinding` returns true. The gate also tests the unbound case (correctly expects a no-op). But it never tests the transition: launch the app, observe a pane at the picker, bind a session through the real UI, then press ⌘⇧E.

**Requires:** A gate that follows the user's path. The app launches. The pane is at the picker. The gate binds a session the way the app does (through the picker or `attach_existing`). The gate then triggers ⌘⇧E through the menu. The editor appears. This exercises the state transition that `showsBinding` guards.

### 5. The Rubber Duck Pass with real traces (AGENTS.md, sprint close procedure)

**Did:** Every editor sprint's Rubber Duck Pass says "no observations." The pass ran against the gate's in-memory signal array (`__vmSignals`), not the packaged trace. A trace with tags flowing through the real app's emitter → main process → disk writer → `read_trace.py` → narration would surface payload anomalies, missing pairs, and ordering violations that the in-memory array cannot show because the in-memory array bypasses the main process and the invariant checker.

**Requires:** After the trace-rule gate runs, `read_trace.py --category editor` produces the editor's signal sequence. The Rubber Duck Pass narrates that sequence tag by tag. Checks: every EDITOR_OPENED pairs with an EDITOR_CLOSED or PANE_CLOSED. Every EDITOR_COLUMN_FOLDED pairs with an EDITOR_DRAWN. EDITOR_OPENED is first in each editor_run stratum (S11). The EDITOR_FOLLOW_MARKED chain (S10) orders correctly. E1 holds — no path or text in any payload. PANE_DRAWN.state transitions from session to editor and back. Observations go into the six closed categories.

### 6. The three verification lenses applied together (Addendum A §A1)

**Did:** Structural only. No perceptual. No adversarial.

**Requires:** All three on the same sprint close:

- **Structural:** the existing Electron gates, plus the trace-rule assertion on the on-disk trace.
- **Perceptual:** screenshots at working widths, read by the agent, confirming the editor is visible with its columns, tree, and transcript.
- **Adversarial:** after the structural and perceptual pass, ask: could this lie? Specifically — could the gate pass while the installed app's ⌘⇧E still does nothing? The gate masks this if it uses `sendCmd` instead of the menu, or `bindPaneAsUser` instead of the real picker flow. Each shortcut that could let a broken app produce a green gate is named and tested separately.

### 7. View-tag duality (BOOTSTRAP step 9)

**Did:** EDITOR_OPENED fires when the shell channel receives `toggle-editor`. PANE_DRAWN(state=editor) fires when `setPane` changes `editorOpen` to true. The DOM shows `[data-editor-shell]`. The pairing was asserted structurally (the DOM query) but never perceptually (a screenshot showing the editor).

**Requires:** The signal fires AND the corresponding visible state appears in the screenshot. EDITOR_OPENED in the trace pairs with a screenshot showing the editor shell. EDITOR_CLOSED pairs with a screenshot showing the pane view (the transcript). EDITOR_COLUMN_FOLDED(left, true) pairs with a screenshot where the left column is a rail. The structural assertion (DOM query) and the perceptual assertion (screenshot read) both confirm the same state.

### 8. Addendum D — discovery (the stochastic driver)

**Did:** Nothing. Every gate follows a scripted path.

**Requires (deferred to after Phase 1 verification closes):** A gate that opens the editor, then exercises it through unscripted interaction — opening files, folding columns, toggling the dock, swapping sides, pressing ⌘⇧E repeatedly. The driver checks for crashes, console errors, and INVARIANT_BROKEN in the trace. This is Addendum D's shape applied to the Electron app instead of a Docker container: the packaged app is the arena, and the Playwright driver is the stochastic agent.

---

## Order of work

Each item produces a verifiable result. The existing code (sprints 389–402) is the starting point; nothing is rebuilt from scratch. The work fixes the verification, which will surface the code defects, which are then fixed under the corrected verification.

**1. Fix the real input path.** Write a gate that triggers ⌘⇧E through the Electron menu (not `sendCmd`), on a pane that has a session bound through the real flow (not `bindPaneAsUser`). Run it against the installed app. If the editor does not appear, the gate fails — and now the failure is visible instead of masked. Diagnose and fix the code path from the menu accelerator through to `toggleEditor()`. The gate stays as the primary editor toggle gate, replacing the shell-channel-only version.

**2. Add the trace-rule assertion.** After the gate closes the app, read the packaged trace with `read_trace.py --category editor`. Assert EDITOR_OPENED, EDITOR_DRAWN, PANE_DRAWN(state=editor), EDITOR_CLOSED, PANE_DRAWN(state=session) appear with correct payloads. Assert no INVARIANT_BROKEN. This is the trace rule applied to the editor for the first time.

**3. Add Track 2 screenshots.** At each state transition in the gate — editor opened, column folded, column unfolded, editor closed — take an element screenshot of `[data-editor-shell]` (or the full pane area when the editor is closed). Read each screenshot. Confirm the visible state matches the structural assertion. Cap screenshot dimensions per A6.

**4. Run the Rubber Duck Pass on the real trace.** `read_trace.py --category editor` on the gate's launch. Narrate every tag. Check S10, S11, E1, E9, the session stratum, the entity, the operator. Record observations. A trace that crossed the main process, the invariant checker, and the disk writer will have something to say — if the pass still finds zero observations, the pass is broken.

**5. Run every Phase 1 gate through the corrected verification.** The eight existing gates (editor_toggle_signals, editor_columns_signals, edge_states, column_widths, view_menu_columns, terminal_dock, sides_swap, focus_folds) each gain the trace-rule assertion and a screenshot at the key state. existing_keys_in_editor (sprint 401) keeps its current form since it tests non-editor keys.

**6. Write the adversarial check.** After items 1–5, ask: what shortcut in the gates could still let a broken app pass? Name each one. Write a gate that exercises the adversarial case — the path the shortcut would mask. This is Addendum A's third lens.

**7. Close Phase 1 under the corrected verification.** All gates pass with the trace rule, Track 2 screenshots, and the Rubber Duck Pass producing real observations. The BLACKBOARD's Phase 1 close entry is corrected to reflect the verification that actually ran.

---

## What this does not change

The implementation plan in round 4 (the five phases, the keyboard table, the technical decisions, the tool parity table, the edge states) stands. The Phase 1 hard stop stands — the design team completes the Claude Design SDD Process before Phase 2. This roadmap adds the verification discipline that Phase 1 lacked. The code built in sprints 389–402 is the starting material; the verification will surface whatever is broken in it, and the fixes follow from the failures.
