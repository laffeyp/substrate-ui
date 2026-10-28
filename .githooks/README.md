# .githooks/

Repo-local git hooks. Git ignores this directory by default; a fresh clone points at it once:

```
git config core.hooksPath .githooks
```

Per-clone (git tracks the setting in `.git/config`, not in the tree).

## What runs

`pre-commit`, in order:

1. `npm run typecheck` (`tsc --noEmit`).
2. `npm run signals` — every `emit(...)` names a tag in `web/vm/signals/versions/0.1.json`.
3. `../substrate/scripts/check_status_literals.sh` on `*.py`, `scripts/`, `web/` — fails on a status compared against a bare string literal.

Any step fails, the commit aborts.

## Bypass

`git commit --no-verify` skips every hook. Reserve for when you have already run `npm run typecheck` and `npm run signals` and know the failure sits in code you are not committing.
