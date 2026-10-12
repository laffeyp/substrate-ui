# Sprint 135 — Harness tool calls count in the session bar

```yaml
---
id: 135
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 3)
asked: 2026-10-11 (Architect)
---
```

## scope

- The session bar's turn line (`web/reveal/activity.ts:61`, `:83`, `:117`) counts only `ToolCall`, so a harness driver's turn reads "no tools" however many tools it ran. `HarnessToolCall` counts as a tool, and `HarnessToolResult` closes it, as `ToolResult` does.

## checks

- Unit specs: a turn with harness calls reports their count, open and finished; the installed app shows it on a claude, codex or cursor-agent turn.

## result

- **Built** (`web/reveal/activity.ts`). `isCall` (ToolCall or HarnessToolCall) and `isResult` (ToolResult or HarnessToolResult) replace the ToolCall-only tests at the three counting sites: the failed turn's count, the live turn's count and running tool, and the recap.
- **Spec** (`activity_harness_tools.spec.ts`), 2 of 2: a live harness turn reads "2 tools · Read" with `Read` still running; a finished one reads "2 tools". Both fail on the old code.
- **Checks.** `tsc` clean; the 11 Electron gates pass. Not yet seen in the installed app: it picks this up at the next build and install.

