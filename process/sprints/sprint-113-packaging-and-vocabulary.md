# Sprint 113 — Packaging and vocabulary

```yaml
---
id: 113
status: open
opened_at: 2026-10-08
pass_kind: remediation
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-08-lens-audit-remediation.md
ledger_rows: 7
---
```

## why

The app's package is named for its test harness; the bundle records no identity; the locked vocabulary 0.1 was edited in place three times (findings §2, §5).

## sources

- Humble and Farley, *Continuous Delivery*, ch. 5: promote the artifact that passed the gates.
- SDD hard rule 12: a locked vocabulary changes by a new version.

## scope (ledger rows)

Each row closes as named; a row the sprint cannot close halts the sprint.

| id | close | finding |
|---|---|---|
| F323 | fix | electron/main.js:263-267 — `webContents.send("server:dead", …)`; preload.js subscribes only menu:* and deep-link; the comment at l.266 says nothing listens. Dead message. |
| F324 | fix | electron/main.js:2-11 — header: "polls http://127.0.0.1:8765/ … SIGKILL after 3s"; the code uses --port 0 readback and KILL_GRACE_MS 45 s. |
| F325 | fix | package.json:2 `"name": "substrate-ui-e2e"`; main.js:20-27 forces `app.setName` because the package name is "the ORM registry name for the test harness". The product's package identity is the test harness's name; elec… |
| F326 | fix | main.js:27 — app name, log root and profile root switch on the presence of SUBSTRATE_HOME (an env var used as the dev/prod mode flag). |
| F362 | fix | web/vm/signals/versions/0.1.json — locked 2026-09-21 (ddc67a3, `locked: true`), then edited in place in 305b328 (2026-09-23), 52971f7 (2026-09-27), c2e0fd6 (2026-10-02): tag_count 30 -> 31, version still "0.1", `locke… |
| F363 | fix | 0.1-rationale.md — "Bundle. A published topology template the user can launch a session against"; in the code a bundle is a prompt-methodology package (methodology/personality/per_turn, substrate/bundles.py). Also cit… |
| F406 | fix | package.json:2,5 — the app's own package (main electron/main.js, version 1.1.0, built and shipped by electron-builder) is named "substrate-ui-e2e" and described as a Chrome-driven e2e harness whose only entry is the r… |

## checks

- package.json names the app; main.js needs no name override.
- The bundle records the kernel commit and an input hash; the packaged smoke compares them.
- signals/versions/0.2.json is issued; 0.1.json is restored to its locked content.

## result

(filled at close)
