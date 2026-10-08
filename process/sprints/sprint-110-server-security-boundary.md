# Sprint 110 — Server security boundary

```yaml
---
id: 110
status: closed
closed_at: 2026-10-08
opened_at: 2026-10-08
pass_kind: remediation
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-08-lens-audit-remediation.md
ledger_rows: 8
---
```

## why

A DNS-rebinding-shaped POST created a bash-capable session (probe, pid 39418), and a GET mutated an arbitrary repository's git index (findings §8).

## sources

- Jackson, Barth, Bortz et al., *Protecting Browsers from DNS Rebinding Attacks*: "reject incoming HTTP requests with unexpected Host headers."
- RFC 9110 §9.2.1: GET is a safe method.

## scope (ledger rows)

Each row closes as named; a row the sprint cannot close halts the sprint.

| id | close | finding |
|---|---|---|
| F074 | fix | bundles.py:152 — the bundle name becomes a path component unchecked (`root / name`); PATCH /api/session {bundle:"../x"} reaches any directory holding a bundle.toml. |
| F110 | fix | roles.py:50-51 — role name used as a path component unchecked (same class as bundles.py:152). |
| F299 | delete | server.py:3522-3539 — `/api/agent?legacy=true&model=cli&command=<anything>` runs an arbitrary argv (`CliResponder(q["command"].split())`) from a POST with no authentication (Origin check only). |
| F300 | fix | server.py:1995-2002 — `_origin_ok` compares Origin's netloc to Host. The comment claims it rejects "a DNS-rebound page"; under DNS rebinding both Origin and Host carry the attacker's hostname and match. No Host allowl… |
| F301 | fix | server.py:1690-1703,4035-4041 — `GET /api/worktree_diff?path=<any>` runs `git add -A --intent-to-add` and `git diff` in any directory: a GET that mutates the index of an arbitrary repository and returns its diff. (PRO… |
| F302 | fix | server.py:2926-2931 — `/api/records/by-path/events` allows any record directory under `/tmp` and `/var/folders` ("macOS temp parents that hold delegate-runs in tests"): a test accommodation in the production allowlist. |
| F314 | fix | server.py:3628-3630 `_body()` and 2211-2220 `_read_json_body()` — two JSON body readers with different failure behaviour; neither caps Content-Length. |
| F317 | fix | server.py:1092-1260 — `_CLI_PTY_SESSIONS` entries are never removed after close; GET `/api/cli/<n>/pty/stream/<sid>` (no origin check) streams the login transcript (OAuth URL/code) to any reader holding the sid. |

## checks

- Host `evil.test:<port>` → 403 on every route; Host `127.0.0.1:<port>` and `localhost:<port>` pass.
- Every POST/PATCH/DELETE without a same-origin Origin → 403.
- `GET /api/worktree_diff` leaves `git status --porcelain` unchanged (the probe becomes a test).
- A bundle or role name containing `/` or `..` → 400.
- The PTY stream refuses a foreign Origin; closed PTY sessions are removed.
- A body over the cap → 413; one JSON body reader remains.
- The /tmp and /var/folders allowlist is gone from by-path records.

## result

Every check runs as a test in `tests/test_server_security_boundary_110.py` (11 tests).

**Host allowlist (F300).**
- Every method (GET, POST, PATCH, DELETE) first runs `_refuse_foreign_host()`.
- Over TCP, the Host must be `127.0.0.1`, `localhost` or `[::1]` on the bound port; anything else gets 403. The Unix socket has no Host to forge, and file permissions guard it.
- The audit's DNS-rebinding probe (Host `evil.test`, Origin `http://evil.test`) now gets 403 and creates no session.

**Origin (F300).**
- A request that carries an Origin must name this server. This now applies on every method, GET included, which covers a cross-origin read of the login-PTY stream (F317).
- A request without an Origin still passes, because the CLI, curl and the tests send none. The Host allowlist is the rebinding defence.
- The card's check said "every mutating request without a same-origin Origin → 403". It was implemented as "a request with a foreign Origin → 403" to keep non-browser clients working.
- The three per-method origin checks became one.

**GET is safe (F301).**
- `/api/worktree_diff` marks new files intent-to-add in a scratch copy of the index (`GIT_INDEX_FILE`). The worktree's own index is never written.
- It serves only the session worktrees under `<sessions>/wt/`.
- The audit's probe repo now keeps `?? untracked.txt` and gets "not a session worktree".

**No request-chosen argv (F299).**
- `model=cli&command=…` no longer runs anything; the test checks that the touched file does not exist.
- That request still answers 200, because unknown models fall through to the deterministic calculator. That is F298, closed in U111 when the legacy endpoint is deleted.

**Names (F074, F110).**
- `substrate.naming.check_path_component` (kernel) is the one rule. A bundle or role name must be a single plain component: letters, digits, `.`, `_`, `-`, and never `..`.
- `PATCH {bundle: "../../etc"}` and `POST {role: "../escape"}` both return 400.
- The PATCH handler maps `api.BundleNotFoundError` and `ValueError` by type. It used to compare `type(exc).__name__` against a retyped string. `api` now exports `BundleError` and `BundleNotFoundError`.

**By-path records (F302).** The `/tmp` and `/var/folders` allowance is gone. Records are served from the runs and sessions roots only.

**Body cap (F314).** One reader, `_read_json_body`; `_body()` is gone. A Content-Length over 4 MiB gets 413 before any byte is read.

**PTY table (F317).**
- A closed login PTY leaves the table at once.
- One that exits on its own stays 60 s, so a late stream still gets the backlog and the exit code, then leaves.

**Gates.**

| Gate | Result |
|---|---|
| UI suite | 236 passed (225 + 11) |
| Axis C | 0 defects |
| lifecycle_gates | all passed |
| kernel suite | 1,272 passed, 5 skipped (kernel commit carries `substrate.naming`) |
