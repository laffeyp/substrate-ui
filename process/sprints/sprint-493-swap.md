# Sprint 493 — the swap, carried out from outside the app

```yaml
---
id: 493
status: pending
phase: second build (roadmap r1), E7
pass_kind: functional
---
```

## scope

`scripts/promote.sh <commit>` builds the working bundle of a commit that passed as the test install, compares it with the installed Next bundle (`compare_bundles.ts`, only identity files may differ), and hands launchd a job (outside the app's task table and process group: quitting the app stops every running session task, `TABLE.stop_all`). The job quits "Substrate", waits for its pid to exit, moves `/Applications/Substrate.app` to the Trash by version, installs the new bundle, removes quarantine and opens it. Before the swap, the Next install opens a copy of the working store's records and resumes one session, so the promoted kernel can read what the old one wrote. Runbook round 10 adds the chapter, with rollback (round 8's section 5.2). One verifiable property: started from a session in the working install, the swap leaves the new build running at a greater `CFBundleVersion`, and that session resumes in it.

## prerequisites

- 492.

## context_files

- `../sdd-kit-3/AGENTS.md`
- `process/planning/2026-11-11-second-build/PAPER-2026-11-11-second-build-r2.md` (section 4)
- `RUNBOOK-2026-11-11-project-r9.md`
- `server.py` (`_shutdown_all_sessions`), `../substrate/src/substrate/topologies/tool_loop/background.py` (`stop_all`)
- `harness/shakeout/resume_ended_session.ts`

## signal contract

### Emits

No new tag.

### Consumes

- The old install's last `SessionEnded` (`daemon_shutdown`) for the session that started the swap; the new install's `APP_BOOTED`; the resumed session's record.

### Invariants

- The working store is never written by two backends at once.
- Rollback restores the trashed bundle by its version.

## artifact contract

### Files created

- `scripts/promote.sh`
- `RUNBOOK-2026-11-11-project-r10.md` (round 9 to `process/archive/`, pointers updated)

### Files modified

- none beyond the pointers

### Content assertions

- `promote.sh` refuses when `compare_bundles.ts` reports a difference outside the identity files.

### Command exit codes

- The runbook's full no-Apple chapter, then the full suites once (`test:py`, `test:unit`, `vm_smoke`, the bundle gates), all 0.

## observation contract

### UI driving steps

From a session in the working install (Claude Code driver), run `promote.sh` on the commit 491 installed as Next. After the swap, resume that session in the new build and send one message.

### Expected log substrings

- The new `substrate.log`: `app boot`, `server up`; the launchd job's log: quit, trash, install, open, each with its exit.

### Expected runtime signals

- Old boot: `SessionEnded` reason `daemon_shutdown` for the session. New boot: `APP_BOOTED` `app_name` "Substrate", `app_commit` the promoted commit; the session's record continues after resume.

### Expected screenshot / visual state

- The resumed session's transcript, before and after the swap, in the new build's window.

## done criteria

The Architect can swap a tested build into the app in use from inside it, and roll it back.

## notes

This is the roadmap's close: the full suites run once here. Mutant: a job left inside the session's task table is stopped by the quit and the swap never completes.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] context_files cover the quit sweep, task stopping and resume.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present, run from inside the working install.
- [x] Two files.
