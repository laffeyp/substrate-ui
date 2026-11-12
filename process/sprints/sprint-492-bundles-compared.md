# Sprint 492 — the two builds compared

```yaml
---
id: 492
status: pending
phase: second build (roadmap r1), E6
pass_kind: observation
---
```

## scope

`scripts/compare_bundles.ts` compares two `.app` bundles file by file: the files only one has, and the files whose bytes differ, with `app.asar` compared by its entries and the build time normalized (`CFBundleVersion`, `buildVersion` in `electron-builder.config.js` line 122). Two runs. (1) One commit built with `pack:next` from a plain terminal and from a session inside the working install: any difference is a leak from the host app into the build (Wheeler's diverse double-compiling, with the terminal as the second path). (2) The working and Next bundles of one commit: only identity files may differ. One verifiable property: run (2) lists only `Info.plist` and the asar's `package.json`; run (1) lists nothing, or each difference is traced to its cause.

## prerequisites

- 491.

## context_files

- `../sdd-kit-3/AGENTS.md`
- `process/planning/2026-11-11-second-build/PAPER-2026-11-11-second-build-r2.md` (section 5)
- `electron-builder.config.js`, `scripts/fetch-python-runtime.sh` (what the runtime build reads from its environment)

## signal contract

### Emits

No new tag.

### Consumes

- Two bundles.

### Invariants

- The script reads; it writes nothing into either bundle.

## artifact contract

### Files created

- `scripts/compare_bundles.ts`
- `process/planning/2026-11-11-second-build/RESULT-2026-11-11-bundles-compared.md` (both runs: counts, each difference and its cause)

### Files modified

- none

### Content assertions

- The result names the commit, both bundles' `CFBundleVersion`, and every differing path.

### Command exit codes

- `npx tsx scripts/compare_bundles.ts <a> <b>` returns 0 when the only differences are the allowed ones, 1 otherwise.

## observation contract

### UI driving steps

The terminal build and the in-session build of one commit; the working and Next builds of that commit.

### Expected log substrings

- Run (2): `Info.plist`, `Resources/app.asar:package.json`, and nothing else.

### Expected runtime signals

- None (no launch).

### Expected screenshot / visual state

- None.

## done criteria

The build made inside the working install is shown to equal the one made outside it, and the promoted build is shown to differ from the tested one only in its name.

## notes

A mutant for the script: a bundle with one changed byte in a JavaScript file inside the asar must be reported.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] context_files cover what varies between builds.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Two files.
