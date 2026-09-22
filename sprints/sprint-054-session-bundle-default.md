# Sprint 054 — daily-driver sessions default to the `session` bundle

```yaml
---
id: 054
status: closed
phase: 5
pass_kind: functional
---
```

## scope

Every reveal-shell session today opens with `bundle=None`. The
server accepts None, the manifest stores None, and
`substrate/src/substrate/topologies/session/__init__.py` line 896
skips the `bundle_methodology_producer_factory` +
`bundle_personality_producer_factory` when bundle is None. The
system-prompt fragments the design intended never fire. Fix by
defaulting the reveal shell's `bundleSlug` to `"session"` at boot,
so every `POST /api/session` carries `bundle: "session"`.

Optional belt on the server side: treat `bundle=None` as
`bundle="session"` in `server.py` around line 1274. Belt-and-braces
catches any caller that forgets.

## context_files

- `substrate/src/substrate/bundles.py` line 72 (the shipped
  `session` bundle)
- `substrate/src/substrate/topologies/session/__init__.py` line
  890-909 (the bundle producers that gate on `bundle is not None`)
- `web/vm/session_controller.ts` line 268 (`bundle = request.bundle
  ?? this.snap.bundleSlug`) and line 95 (initial `bundleSlug: null`)
- `server.py` line 1274 (bundle handling at session create)

## signal contract

### Emits

No new tags. Existing `SESSION_OPEN_REQUESTED` will carry
`bundle: "session"` in its payload for every reveal-shell session.

## artifact contract

### Files modified

- `web/vm/session_controller.ts` — change the initial snapshot's
  `bundleSlug` from `null` to `"session"` (line 95). Verify the
  effect: `openSession()` with no `request.bundle` now falls through
  to `this.snap.bundleSlug === "session"` and posts
  `body.bundle = "session"`.
- `server.py` (optional belt) — in the session-create path, if the
  incoming `bundle` is None, set it to `"session"` before calling
  `_SESSION_REGISTRY.create`.

### Content assertions

- `curl -sS -X POST http://127.0.0.1:8765/api/session -H 'Content-Type:
  application/json' -d '{"driver":"deterministic"}'` returns an ack
  whose `bundle` field is `"session"`, not `null`.
- The session's manifest on disk under
  `~/.substrate/sessions/<id>/manifest.json` records
  `"bundle": "session"`.

### Command exit codes

- `SHAKEOUT_AXIS=A SHAKEOUT_RUNS=1 npx tsx harness/shakeout/run.ts`
  returns 0 with every existing 5/5 tag still 5/5.

## observation contract

Open `/` in Chrome. Open a session. Read the SessionStarted envelope
in the transcript (or via `curl /api/records/<name>/events`). The
`bundle` field is `"session"`, not `null`. The system prompt
composition includes the bundle methodology + personality fragments.

## done criteria

- Reveal-shell sessions open with `bundle: "session"` end-to-end.
- The two bundle producers fire on every daily-driver session.
- No regression on any Axis A flow.
