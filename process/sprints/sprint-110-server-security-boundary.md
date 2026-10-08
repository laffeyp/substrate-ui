# Sprint 110 — Server security boundary

```yaml
---
id: 110
status: open
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

(filled at close)
