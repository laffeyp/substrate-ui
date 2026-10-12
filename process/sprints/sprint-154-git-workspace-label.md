# Sprint 154 — A git workspace's label reads "git"

```yaml
---
id: 154
status: closed
closed_at: 2026-10-12
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 18; OPEN-ITEMS 27)
asked: 2026-10-12 (Architect, choosing among three answers: the label reads "git")
context_files:
  - web/reveal_component.ts
---
```

## scope

The records page labels a workspace holding `.git` "git · sessions get worktrees" (`reveal_component.ts`, `shapeLabel`). Card 153 found the claim false: `_session_worktree` has no caller, none of 86 sessions has the `worktree` shape, and `~/.substrate/sessions/wt` does not exist. After: the label reads "git". The other strings that name worktrees (the session line for a `worktree` shape, the meta view's branch name) are untouched.

## signal contract

No controller tags change.

## observation contract

Electron gate `git_workspace_label.ts`: a session opened over the API in a repo-local folder that holds a git repository; on the records page its row reads "git" beside the path and does not contain "worktree".

## checks

- The gate red on the current code, green after; `records_workspace_box` passes.

## result

- **Built** (`reveal_component.ts` `shapeLabel`): a `worktree`-shaped workspace reads "git". No other string changed.
- **Gate** `git_workspace_label.ts` (in `gates:electron`): red on the old code (the row read "git · sessions get worktrees"), green after (the row reads "git"). `records_workspace_box` passes.
- Roadmap step 18 is done with cards 153 and 154.
- **Rubber Duck Pass.** No controller tag moved; the gate reads the row's cells.
