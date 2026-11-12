# Sprint 488 — one identity record per install, and the test bundle

```yaml
---
id: 488
status: closed
phase: second build (roadmap r1), E2
pass_kind: architecture
---
```

## scope

`electron/identity.json` holds one record per install, as VS Code's `product.json` does: `substrate` (name Substrate, bundle id `com.greenrosesystems.substrate`, store `.substrate`, link scheme `substrate`) and `next` (Substrate Next, `com.greenrosesystems.substrate.next`, `.substrate-next`, `substrate-next`), both with executable `Substrate`. `electron-builder.config.js` takes `productName`, `appId`, `mac.executableName` and the declared scheme from the record named by `SUBSTRATE_INSTALL` (default `substrate`), writes the record's name into the packaged `package.json` (`extraMetadata.productName`; today the packaged `package.json` has none), and writes the output for `next` to its own folder. `npm run pack:next` builds it. One verifiable property: the two bundles' Info.plists carry their own record's name, bundle id and scheme, their packaged `package.json` files their own `productName`, and both run `Contents/MacOS/Substrate`.

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

## close

`electron/identity.json` holds the two records. `electron-builder.config.js` takes `appId`, `productName`, `extraMetadata.productName`, `mac.executableName`, the declared scheme and the output folder from the record `SUBSTRATE_INSTALL` names, and packs `identity.json` into the asar for sprint 489. `pack:next` builds the Next bundle and renames its folder: electron-builder names the `.app` after the executable (`app-builder-lib` `macPackager.js` line 357), so it wrote `Substrate.app`, now `Substrate Next.app`. `.gitignore` gains `dist-electron-*/` (a fourth file, one line).

Read from the two bundles (logs `runs/packaged/sprint-488-20261111-230835/`; `pack:dev` 0, `pack:next` 0):

| | `dist-electron/mac-arm64/Substrate.app` | `dist-electron-next/mac-arm64/Substrate Next.app` |
|---|---|---|
| CFBundleName, CFBundleDisplayName | Substrate | Substrate Next |
| CFBundleIdentifier | com.greenrosesystems.substrate | com.greenrosesystems.substrate.next |
| CFBundleExecutable | Substrate | Substrate |
| URL scheme | substrate | substrate-next |
| asar `package.json` productName | Substrate | Substrate Next |
| CFBundleVersion | 1794467502 | 1794467705 |

The working bundle keeps every identity field build 1794463909 had; its packaged `package.json` gains `productName` "Substrate", the name `main.ts` already sets. Both bundles read `SubstrateKernelReleasable` false: `../substrate` holds the uncommitted registry comment (sprint 487's close).

Mutant: the config ignoring `SUBSTRATE_INSTALL` resolves a Next build to Substrate, `com.greenrosesystems.substrate`, `substrate`, `dist-electron`, which would build over the working bundle. Checked on the resolved config, not by a third pack.

Not opened: until sprint 489 the Next bundle would name itself Substrate at launch and use `~/.substrate`.

Rubber Duck Pass: no runtime trace (nothing launched). No tag changed. No observations.
