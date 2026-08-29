# Sprint 037c CLOSEOUT ADDENDUM — legacy dock retired

Rule 12 (append-only) addendum to `sprint-037c-legacy-dock-removal.md`.
The card as pending named a smaller job than the retirement actually
was; this addendum records what actually landed.

## Card-vs-close deviations

The pending card scoped the work as "delete legacy dock DOM +
handlers." That was under-scoped. Grep after the fact identified eleven
signal tags — TERMINAL_OPENED, TERMINAL_CLOSED, CHAT_ENTERED,
CHAT_EXITED, MODEL_SELECTED, PARAMS_CHANGED, TURN_SUBMITTED,
AGENT_LAUNCH_REQUESTED, AGENT_LAUNCHED, AGENT_TURN_STREAMED,
FINAL_ANSWER_RENDERED — whose sole emit sites lived inside the dock
code the card would delete. Deleting the dock without addressing the
tags drops vocab-parity from 69/69 to 58/69 and breaks
`capture_signals.js` + `capture-grade.ts` invariants that referenced
the tags. The pending card also named `037a + 037b` as prereqs; the
FOLD-2026-08-28 fold superseded that with "every dock control has a
terminal-view home," which 035s/t/u/v/w satisfy.

The card's grep-clean check and full-e2e green survive; the observation
contract as-written held after the true scope was addressed.

## What actually landed

**Vocab.** New `signals/versions/0.7.3.json` (58 tags, locked; superseded
0.7.2). Retires the eleven dock-tied tags listed above. `current.json`
symlink repointed to `0.7.3.json`. Rationale at
`signals/versions/0.7.3-rationale.md` — supersedes-line, per-tag
retirement table, replacement pointers.

**Code.** `web/app.ts` shed 347 lines: the interactive-agent section
(`_agentLine`, `streamAgentTurns`, `renderConvo`, `sendChatMessage`,
`loadModels`) at lines 269-370, and the integrated-terminal section
(`_narrateLine`, `renderTerm`, `termPush`, `termSetOpen`, `_selectModel`,
`_setParam`, `runTerm`, `termSubmit` + click handlers) at lines 919-1163.
`followLive` shed its two dock hooks — the `STATE.term.agent` polling
branch to `streamAgentTurns`, and the `STATE.term.params.timeout` knob
(replaced with a fixed 300s ceiling). Boot-side `loadModels()` call and
`window.loadModels` shim dropped.

`web/state.ts` shed `TerminalParams`, `TerminalState`, the `term` field
on `AppState`, and its default `term: { open, lines, ... }` initializer.

**DOM.** `web/index.html` shed `<div class="term-row">` (containing
`#termOpen`, `#termdock`, `#agentmodel`, `#termparams`, `#termhint`,
`#termClose`, `#termbody`, `#termprompt`, `#terminput`) at lines 275-291,
the `#termToggle` head-button at line 242, and the orphan
`#termToggle.on` CSS rule at line 66.

**Grader.** `tools/capture-grade.ts` dropped eleven tags from
`EXPECTED_ORDER` and dropped three console-only invariant checks whose
premise vanished (`checkTurnInsideChatWindow`,
`checkAgentLaunchTerminate`, `checkChatTurnCount`). Session-flow
bookends via `checkDriverSessionBookends` unchanged.

**Legacy harnesses.** `harness/capture_signals.js` shed the 38-line
dock section (open dock → change model → three params → chat → turn →
exit → close). `harness/e2e_console.js` shed the 73-line dock section
(§15 `cat`/`narrate` + §15b interactive-agent multi-turn). Non-dock
coverage in both harnesses is intact — records, transport, graph,
provenance, diff, incidents, launch, prune, cohorts, content views.

The captures/sprint-021/console.jsonl fixture regenerated on the next
`capture:signals` run — the file changed by 11 tag entries, matching the
retirement.

## Signal contract — what fires now

Same set as v0.7.2 minus the eleven retired tags. Session lifecycle,
driver mutation, session-control tags, records, graph, transport,
launch, incidents, inspector all fire from the same sites they did
yesterday.

## Observation contract — what passed

- `grep -rn '#termdock\|termOpen\|runTerm' web/ harness/ tests/ tools/`
  returns only descriptive comments; no live selectors.
- `check:vocab-parity` clean at 58/58 (58 tags in lock, 56 distinct
  emit sites, all locked).
- `check:tsc-new` clean.
- Full `npm run signals` chain PASS across TEN fixtures on a fresh
  daemon.

## Definition of done — satisfied

Legacy dock is gone from the DOM, from `web/app.ts`, from `state.ts`,
from `index.html`'s CSS, from the vocab lock, from the console grader,
and from the two legacy harnesses. Full e2e + signals green.
