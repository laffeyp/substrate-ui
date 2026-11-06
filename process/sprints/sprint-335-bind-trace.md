---
id: 335
status: closed
phase: shell-to-react E6, diagnosis
pass_kind: functional
---

# Sprint 335 — the gates bypass the page's policy; the bind helper traces a missed model pick

## scope

`harness/shakeout/lib/electron.ts`: `launchArgs` launches with Playwright's `bypassCSP` unless a gate asks for `csp: "enforce"` (only `csp_holds` does): the policy forbids evaluating strings as script, which is how Playwright runs a gate's string predicates, and 13 gates failed on it with "EvalError … 'unsafe-eval' is not an allowed source of script". `bindPaneAsUser` now, on a miss after the model row's click, names the picker's state (the path box's placeholder, the armed flag, the model and guidance rows, the driver, the signals) and a trace: a mark set on the page before the click, each mousedown, mouseup and click with its target, and each change of the armed flag.

## artifact contract

- Modified: `harness/shakeout/lib/electron.ts`, `harness/shakeout/csp_holds.ts`. `tsc -p harness` 0.

## observation contract

Every `gates:electron` script run alone exits 0.

## result

Closed 2026-11-05 with an open item. Runs: 60 of 60 exit 0 on the last full run. Open: in runs with plan rows E5 and E6 in the tree, bindPaneAsUser missed four times in about 300 binds (slash_choice_keys, new_window, input_bar, each once; not repeated in 56 runs of the two gates, 36 of them three at a time). The one miss with the state dump read: armed "0", the path box on the folder column, driver null, signals SESSIONS_LOADED WORKSPACES_LOADED BUNDLE_ROSTER_LOADED DRIVER_ROSTER_LOADED: the model's pick did not run and the folder was no longer armed. The model column is not inside the folder list whose click disarms, and electron/main.js loads the page once. Not seen on the pushed tree in two full runs, which does not show it is absent there. The trace stays in the helper until a miss names the cause.

## Rubber Duck pass

DRIVER_PICKED did not fire in the miss, which agrees with the driver being null: the pick never ran.
