---
id: 207
status: closed
phase: shell-to-react A9
pass_kind: observation
---

# Sprint 207 — a gate for first run and the footer

## scope

No gate drives first run or the footer (plan round 5, "Tests already in place"). `harness/shakeout/first_run_footer.ts` drives both against the app launched from source, and `gates:electron` runs it. Footer: before a pane is bound it reads `● live`, `unbound — pick a workspace`, `⌘M toggles meta`; after a turn, `session <name>` where the name is the top bar's crumb; on the records page the hint reads `esc back to session`, and Escape puts it back; after `/exit` and `end session` it still reads `● live`, because nothing sets the `ended` it reads (open item 34; U186's fix undone in `dd8f390`): the gate records that line and asserts nothing about it, and plan row B2 fixes the footer and adds the check, as E3 does for ⌘C. First run: the window reloaded with `?firstrun=1` shows DRIVERS ON THIS MACHINE with a row for each driver in the controller's roster; clicking `deterministic` closes it, fires `DRIVER_PICKED` with `driver: deterministic`, and sets the controller's driver.

## prerequisites

- 206 closed

## context_files

- `web/reveal.html:492` (footer), `:538–557` (first run); `web/reveal_component.ts:2470–2484`, `:2516–2560`
- `web/vm/session_controller.ts:887–905` (`pickDriver`), `:308–326` (roster)
- `web/vm/signals/versions/current.json` (`DRIVER_PICKED`)
- `harness/shakeout/dialogs.ts`, `harness/pixel/capture.ts:154–160` (first run by URL)

## signal contract

### Emits

- `DRIVER_PICKED` (`driver`) after the first-run pick, with `driver: "deterministic"`. Read from `window.__vmSignals`.

## artifact contract

- Created: `harness/shakeout/first_run_footer.ts`. Modified: `package.json` (`gates:electron`).
- `npx tsc -p harness` 0; `npx tsx harness/shakeout/first_run_footer.ts` 0, its last line `first_run_footer: ok — …`.

## observation contract

As in scope; each step's result is in the gate's ok line. A planted fault fails it: with `footRecord` fixed to `''`, the gate fails at the step after the turn.

## done criteria

First run's list and pick and the footer's three working states are gated on today's tree.

## result

Closed 2026-11-05. `harness/shakeout/first_run_footer.ts` written; `gates:electron` runs it after `dialogs.ts` (47 scripts). `npx tsc -p harness` 0; `npx tsx harness/shakeout/first_run_footer.ts` exit 0: "unbound ["● live","unbound — pick a workspace","⌘M toggles meta"]; after a turn ["● live","session pane-1","⌘M toggles meta"]; records hint, and back; after the end (not asserted; open item 34) ["● live","session pane-1","⌘M toggles meta"]; first run rows ["deterministic"] for roster []; pick closes first run; DRIVER_PICKED deterministic".

The first run of the gate failed at "● finalised": nothing in `reveal_component.ts` sets the `ended` the footer reads. That is open item 34 (`process/planning/OPEN-ITEMS-2026-10-10.md`); U186 had made the footer read the session and `dd8f390` undid it with U188 on 2026-10-14. The gate now records that line without asserting it; B2 fixes the footer and adds the check. Two selector fixes: the offline roster is empty, so the gate waits for `DRIVER_ROSTER_LOADED`, not a non-empty roster; the first-run pick is scoped to the list, since the window behind it has its own "deterministic" text, which the overlay covers.

Planted fault (`footRecord`'s condition forced false): the gate fails at its first step, "expected live · unbound · the meta hint; reads ["● live","session pane-1","⌘M toggles meta"]". Restored and rebuilt.

## Rubber Duck pass

*Sequence.* `DRIVER_ROSTER_LOADED` → the roster arrived (empty offline). `DRIVER_PICKED` (driver deterministic) → the first-run pick set the driver.

*Observations.* Payload anomaly, of the screen not the signals: the footer reads `● live` after `SESSION_ENDED_LOCAL` (open item 34). Tone trace: first run shows fixture text, `s-1a04` in its top bar and `~/Documents/substrate` as the workspace (F328's kind; B2 removes the design tool's props and fixtures).

*Dispositions.* Footer: `recorded` (agent-resolved entry: B2 fixes it with its check). Fixture text: `recorded`, B2.
