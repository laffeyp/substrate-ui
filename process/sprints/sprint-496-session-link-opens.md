# Sprint 496 — A session link opens the session in the window

```yaml
---
id: 496
status: closed
phase: continuing a session (roadmap 2026-11-12-continue-a-session r1, E6, found in sprint 495)
pass_kind: functional
---
```

## scope

Found in sprint 495: `open substrate-next://session/<id>` reached Substrate Next (`DEEP_LINK_RECEIVED` `link_kind` `session`), but the window's handler (`web/reveal.ts`) acts on `substrate://record/…` only and dropped it, so the session did not open. A `substrate://session/<id>` link now attaches that session in the window's first pane, by the call the Records page and `?session=<id>` already make (`attachExisting`). One verifiable property: a session link delivered to the running app attaches that session.

## prerequisites

- 494.

## context_files

- `web/reveal.ts` (the deep-link handler; `?session=` at load), `web/vm/session_controller.ts` (`attachExisting`)
- `electron/main.ts` (`forwardDeepLink`: the scheme rewritten to `substrate://`, `DEEP_LINK_RECEIVED`)
- `harness/shakeout/lifecycle_gates.ts` (F5)

## signal contract

### Emits

- `SESSION_ATTACH_STARTED` and `SESSION_ATTACHED` (existing window tags), on a session link.

### Invariants

- A record link attaches its record as before.

## artifact contract

### Files modified

- `web/reveal.ts`, `harness/shakeout/lifecycle_gates.ts`

### Command exit codes

- `npm run build`, `npm run test:unit` return 0; `lifecycle_gates` from source and on the Next bundle return 0.

## observation contract

### UI driving steps

Gate F5: a deterministic session created through the app's server, then `open-url` with `substrate://session/<id>`; the first pane's snapshot holds that session id. Then on the installed Substrate Next: `open substrate-next://session/s_515635cc7350436bae2364a4`, and its window trace shows `SESSION_ATTACH_STARTED` for it.

### Expected screenshot / visual state

- The Substrate Next window showing the continued session.

## done criteria

A session link opens its session.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] Two files.
- [x] Existing tags only.
- [x] Observation contract present.

## close

`web/reveal.ts`: a `substrate://session/<id>` link calls `attachExisting(id)` on the window's controller; a record link attaches as before. Lifecycle gate F5 creates a deterministic session and sends its link.

- `lifecycle_gates` from source: all passed, F5 record link and session link. Mutant (no session handler): F5's session check fails. Build 0, `test:unit` 0.
- Substrate Next rebuilt (`pack:next` 0) and `lifecycle_gates` on the bundle: all passed. Installed as build 1794477910 (logs `runs/packaged/sprint-496-*`), the old one to the Trash by version; the working install, pid 8228, untouched.
- `open substrate-next://session/s_515635cc7350436bae2364a4`: the window trace reads `SESSION_ATTACH_STARTED`, `STREAM_ATTACHED`, then `PANE_DRAWN` pane 1, state `session`, connection `connected`, driver `claude`.

Rubber Duck Pass: `DEEP_LINK_RECEIVED` (`session`) in main, then the window's attach in order; no new tag. Sprint 495's report that the session was open rested on `DEEP_LINK_RECEIVED` alone, which records the link's arrival, not the window's act; that misread is why this card exists.
