---
id: 102
status: closed
class: H (agent work modelled as a short request: states with no exit, cancels that cannot reach the work); the scroll regression's own classes (postmortem 2026-10-02)
---

# Sprint 102 — transcript scroll, and the class H sweep

## why

The Architect, 2026-10-02: "you need to fix the scrolling … it hasn't been done yet", and do the sweep of this session for errors of class H. The scroll postmortem (`process/planning/POSTMORTEM-2026-10-02-transcript-follow-bottom-regression.md`) found that nothing had followed the bottom since Sprint 076 (2026-09-24).

## done

**Transcript scroll.** `useScrollAnchor(key)` is the one owner:
- **following:** at the bottom (within 24 px), new content scrolls into view;
- **reading:** scrolled up, the row at the top of the view stays put;
- **resume:** back at the bottom, following resumes;
- **saved per pane per view:** survives terminal ↔ reveal and the root remounts dc-runtime causes;
- **outside React:** a ResizeObserver settles content that grows outside a React commit.

The stale comments that sent the job to deleted code are gone.

**Class H sweep.** Each item is a state with no exit after a failure, or a cancel that cannot reach the work:

| where | before | now |
|---|---|---|
| CLI drivers (`CliResponder.arespond`) | an interrupt cancelled the call but not the process; the CLI agent kept running and editing files | own process group, killed on cancel and on timeout |
| delegate | interrupting the parent did not stop its children, whether ad-hoc runs, fan-out sessions or a standing session | each child registers a stop on the call's cancel hooks (`_TOOL_CANCEL_HOOKS`, which replaced bash-only `_BASH_PROCS`) |
| stream reconnect | EventSource reconnects to the same URL and the server replays from the start; `rawEnvelopes` was deduped but the transcript rows were appended again | a seen seq is skipped whole |
| background topology runs | a run that raised left no `RunFinalised`; status read "running" forever | a dead worker reports `failed` with its error, or its own result status if it returned |
| backend death | `main.js` sent `server:dead` to a window that never listened; the app sat with dead streams | a dialog names how it stopped and offers Relaunch or Quit |

Checked and correct: the turn-queue slot is released in a `finally`; CLI login PTYs have no timer, rightly, since login waits on the user.

**Gates.**
- `harness/shakeout/transcript_follow.ts` (`npm run gates:scroll`) drives the Electron app: following, reading, resume, view switch. It runs in `release.sh` stage 6.
- `lifecycle_gates.ts` gained F8: kill the backend; the dialog appears, says how, and Quit leaves no backend.

## checks (2026-10-02)

- Scroll gate, source mode: 7/7 (overflow, following with 0 px gap, reading row unmoved, resume, two view switches). Against the old hook: 3 FAILED (a 973 px gap below the newest turn; no following after scrolling back down).
- F8: 4/4 in source mode.
- New tests, each run against the old code first, where it failed:
  - kernel `test_cli_responder_cancel_102`;
  - kernel `test_delegate_cancel_reaches_child_102` (without the hook, the call registered no stop);
  - client spec "a replayed envelope … does not append its row again";
  - UI `test_a_run_whose_worker_died_reports_failed_not_running`.
- Tiers: kernel 1,212 passed, 3 skipped; UI 216; client specs 21/21; realmodel 41/41. Committed: kernel `9dfa71d9`; substrate-ui in the commit carrying this card.
