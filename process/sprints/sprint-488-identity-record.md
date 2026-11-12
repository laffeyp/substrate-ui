# Sprint 488 — one identity record per install, and the test bundle

```yaml
---
id: 488
status: pending
phase: second build (roadmap r1), E2
pass_kind: architecture
---
```

## scope

`electron/identity.json` holds one record per install, as VS Code's `product.json` does: `substrate` (name Substrate, bundle id `com.greenrosesystems.substrate`, store `.substrate`, link scheme `substrate`) and `next` (Substrate Next, `com.greenrosesystems.substrate.next`, `.substrate-next`, `substrate-next`), both with executable `Substrate`. `electron-builder.config.js` takes `productName`, `appId`, `mac.executableName` and the declared scheme from the record named by `SUBSTRATE_INSTALL` (default `substrate`), and writes the output for `next` to its own folder. `npm run pack:next` builds it. One verifiable property: the two bundles' Info.plists carry their own record's name, bundle id and scheme, and both run `Contents/MacOS/Substrate`.

## prerequisites

- 487.

## context_files

- `../sdd-kit-3/AGENTS.md`
- `process/planning/2026-11-11-second-build/PAPER-2026-11-11-second-build-r2.md` (section 2)
- `electron-builder.config.js`, `package.json`
- `node_modules/app-builder-lib/out/options/PlatformSpecificBuildOptions.d.ts` (`executableName`)
- `harness/shakeout/lib/electron.ts` (the gates' launch path)

## signal contract

### Emits

No new tag (the boot field is sprint 490).

### Consumes

- The identity record.

### Invariants

- `npm run pack:dev` builds a working bundle identical in name, bundle id, scheme and paths to build 1794463909's.
- The Next bundle is not opened in this sprint: until sprint 489 it would use `~/.substrate`.

## artifact contract

### Files created

- `electron/identity.json`

### Files modified

- `electron-builder.config.js`
- `package.json` (`pack:next`)

### Content assertions

- `identity.json` parses and has exactly the records `substrate` and `next`, each with `productName`, `appId`, `executableName`, `store`, `scheme`.

### Command exit codes

- `npm run build`, `npm run pack:dev`, `npm run pack:next` return 0.

## observation contract

### UI driving steps

`plutil -p` on both bundles' `Info.plist`; read both `app.asar` `package.json` files.

### Expected log substrings

- Working: `CFBundleName` Substrate, `CFBundleIdentifier` com.greenrosesystems.substrate, URL scheme `substrate`, `CFBundleExecutable` Substrate.
- Next: Substrate Next, com.greenrosesystems.substrate.next, `substrate-next`, `CFBundleExecutable` Substrate.

### Expected runtime signals

- None (no launch).

### Expected screenshot / visual state

- None.

## done criteria

Two bundles of one commit, each named and identified by its own record.

## notes

Three files, past the two-file limit: the record, the build that reads it, and the script that names it. Mutant: the config ignoring `SUBSTRATE_INSTALL` builds two bundles both named Substrate.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] context_files cover the build config, the option and the gates' path.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present (static; launching waits for 489).
- [x] Past the two-file limit, for the reason in the notes.
