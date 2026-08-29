# .githooks/

Repo-local git hooks. Git does not honor these by default — each clone
has to point at this directory once:

```
git config core.hooksPath .githooks
```

Run that command inside a fresh clone. It's per-clone (git tracks the
setting in `.git/config`, not in the tree).

## What runs

- `pre-commit` — runs `npm run typecheck` (`tsc --noEmit`). Any tsc
  error aborts the commit. Ratified 2026-08-29: zero tsc errors is
  the baseline.

## Bypassing

`git commit --no-verify` skips every hook. Reserve this for cases where
you've already run `npm run typecheck` and know the failure is in code
you're not committing. Any other use erases the baseline.
