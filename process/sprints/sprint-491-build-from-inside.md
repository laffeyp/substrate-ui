# Sprint 491 — build and install the test install from inside the working install

```yaml
---
id: 491
status: pending
phase: second build (roadmap r1), E5
pass_kind: observation
---
```

## scope

Runbook round 9 adds a chapter, "Build and install the test install": runbook round 8's steps 1–16 with `pack:next` and `$APP` = `dist-electron-next/mac-arm64/Substrate Next.app`, then quit "Substrate Next" by name, move `/Applications/Substrate Next.app` to the Trash by version, install, open. The chapter is run from a session in the working install, by a capable model through the session's `bash`. One verifiable property: every step exits 0, the working install's pid and sessions are unchanged, and its trace holds no record from the run.

## prerequisites

- 490.

## context_files

- `../sdd-kit-3/AGENTS.md`
- `RUNBOOK-2026-11-11-project-r8.md`
- `process/planning/2026-11-11-second-build/PAPER-2026-11-11-second-build-r2.md`
- `package.json` (`pack:next`), `electron/identity.json`

## signal contract

### Emits

No new tag.

### Consumes

- The working install's trace: `APP_BOOTED`, `SERVER_STARTED`.
- The Next install's `APP_BOOTED` (`app_name` "Substrate Next").

### Invariants

- The working install's `server.jsonl` holds one `SERVER_STARTED` for its boot.
- `~/.substrate/sessions/` unchanged apart from the session that ran the chapter.

## artifact contract

### Files created

- `RUNBOOK-2026-11-11-project-r9.md` (round 8 moves to `process/archive/`)

### Files modified

- `README.md` and `WORKING_AGREEMENT.md` pointers to the runbook

### Content assertions

- Round 9's new chapter names "Substrate Next" in its quit step and `/Applications/Substrate Next.app` in its install steps; round 8's chapters are carried over unchanged.

### Command exit codes

- Each step of the new chapter returns its listed code; logs in `runs/packaged/sprint-491-<stamp>/`.

## observation contract

### UI driving steps

In the working install, a session (Claude Code driver) is asked to run the new chapter. The run's screenshots and the two installs' traces are read after.

### Expected log substrings

- `~/Library/Logs/Substrate Next/substrate.log`: `app boot`, `server up`.

### Expected runtime signals

- Next: `APP_BOOTED` `app_name` "Substrate Next", `packaged` true, `CFBundleVersion` greater than the trashed one.
- Working: main pid unchanged; no second `SERVER_STARTED` in its boot.

### Expected screenshot / visual state

- Both installs' windows open; the session's transcript shows each step's exit code.

## done criteria

The next build is built, tested and installed from inside the build in use, which keeps running untouched.

## notes

This card also observes sprint 487's fix for real: the run's `vm_smoke` is started from the session's `bash`.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] context_files cover the runbook and the identity.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present, run inside the working install.
- [x] One new file, two pointer edits.
