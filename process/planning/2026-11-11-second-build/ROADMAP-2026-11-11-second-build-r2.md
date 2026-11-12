# Roadmap — the second build (round 2)

*2026-11-11. Supersedes `superseded/ROADMAP-2026-11-11-second-build-r1.md`. The Architect, 2026-11-11: "This is way more than we needed. We just needed like another build that you could work in … Can we remove all the insane shit?" Round 1's E5–E7 are dropped: a session in the working install running the runbook, the bundle comparison, and the launchd swap. Their cards are in `process/sprints/dropped/`, not deleted.*

## What this is

One more build on the machine, beside the one in use: Substrate Next, its own name, store, data folder, logs and link scheme from its record in `electron/identity.json`, so the next version can be built, installed and used without touching the app the work happens in.

## Items

**E1 — A test server started from a session keeps to its own trace (sprint 487).** Built.

**E2 — One identity record per install, and the test bundle (sprint 488).** Built: `npm run pack:next`.

**E3 — The app takes its name, store and link scheme from its record (sprint 489).** Built; gate `two_installs`.

**E4 — The boot record names the install (sprint 490).** Built: vocabulary 0.68, `APP_BOOTED.app_name`.

**E5 — Substrate Next installed.** Done 2026-11-11: build 1794469212 at `/Applications/Substrate Next.app`, beside the working install. Runbook round 9's chapter "Build and install the test install" builds and installs the next one.

## Swapping

Making a tested build the working one is runbook round 9's "Build and install — no Apple", run from a terminal: it quits Substrate, keeps the old bundle in the Trash by version, installs the new one. Rollback is that chapter's rollback.
