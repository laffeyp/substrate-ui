# Working inside Substrate: a second build beside the one in use (round 2)

*2026-11-11. Supersedes `superseded/PAPER-2026-11-11-second-build.md`. Round 2 follows the Architect's pressure test of round 1 (2026-11-11: "They don't all have to be named substrate right … I hope we know those are all solved, right?"). Round 1 listed four conflicts without saying which ones a separate identity removes; three of the four go once the test install has its own name. Round 2 says so, adds what checking that claim found, and takes VS Code's `product.json` as the model: one identity record per install, keyed by the app's name. The prior work is round 1's section 1, unchanged and not repeated here.*

## 1. The question

Substrate is to be built from inside Substrate, with "an additional final build stage … the one that we are working inside of … We can hot swap it out whenever we want" (the Architect, 2026-11-11). Two installs on one machine: the working install, where the work happens, and the test install, the build under test.

## 2. The model: one identity per install, keyed by its name

VS Code's source has one identity file, `product.json`. The open-source build's copy reads `nameShort` "Code - OSS", `dataFolderName` ".vscode-oss", `darwinBundleIdentifier` "com.visualstudio.code.oss", `urlProtocol` "code-oss", `win32MutexName` "vscodeoss" (microsoft/vscode, `product.json`). Stable and Insiders are the same code built with different copies of that file, which is why they "install side by side" with "isolated settings, configurations, and extensions" (VS Code FAQ). Every per-install value is read from the one record, so no second copy of a name can drift.

Substrate does the same with a table of two records:

| | Working install | Test install |
|---|---|---|
| Name (`productName`) | Substrate | Substrate Next |
| Bundle id (`appId`) | com.greenrosesystems.substrate | com.greenrosesystems.substrate.next |
| Executable (`executableName`) | Substrate | Substrate |
| Store | `~/.substrate` | `~/.substrate-next` |
| Data folder and lock | `~/Library/Application Support/Substrate` | `~/Library/Application Support/Substrate Next` |
| Logs | `~/Library/Logs/Substrate` | `~/Library/Logs/Substrate Next` |
| Link scheme | `substrate://` | `substrate-next://` |
| Installed at | `/Applications/Substrate.app` | `/Applications/Substrate Next.app` |

electron-builder reads the record at build time (`pack:dev` for the working install, `pack:next` for the test install). At launch, `main.ts` finds its own record by the bundle's name and takes the store, logs and link scheme from it. The executable keeps the name `Substrate` in both, so the gates' launch path (`Contents/MacOS/Substrate`, `harness/shakeout/lib/electron.ts` line 48) works on either bundle. electron-builder's `executableName` is a platform option (`app-builder-lib` `PlatformSpecificBuildOptions`), so it applies on macOS. `npm run electron` and the gates keep "Substrate Dev" and their own `SUBSTRATE_HOME`, as today.

## 3. The conflicts, and what the identity solves

| Conflict (round 1) | Solved by the identity alone? | What checking it found |
|---|---|---|
| 3.1 Same-named installs share one single-instance lock | Yes | Measured: an Electron app whose `package.json` says `productName` "Substrate Next" gets `userData` `~/Library/Application Support/Substrate Next`. A later `app.setName("Substrate")` changes the name and leaves the folder, so the lock follows the bundle's name |
| 3.2 The install step quits the app doing the installing | Yes, for installing the test install | Steps 17–20 name "Substrate Next" and its path. Promoting into the working slot still quits the working install; that is the swap, done from outside the app (section 4) |
| 3.3 A shared store: each backend ends the other's sessions | Yes, once `main.ts` passes the record's store | Not solved by the name alone: the kernel's store is `SUBSTRATE_HOME` or `~/.substrate` (`../substrate/src/substrate/home.py`), and nothing in the bundle's name reaches it |
| Logs (round 1, 3.3) | Yes, once `main.ts` names the app from the record | Not solved by the name alone: measured, `app.getPath("logs")` after `setName("Substrate")` is `~/Library/Logs/Substrate`. Logs follow the name set in code, and `main.ts` line 290 sets "Substrate" |
| 3.4 A test server run from a session writes into the working install's trace | No | It comes from the environment a session's `bash` inherits (`SUBSTRATE_TRACE_DIR`, `SUBSTRATE_BOOT_ID`, `SUBSTRATE_PARENT_PID`), whatever the apps are called. `harness/shakeout/lib/server.ts` passes them on; the gates that start the app itself (`packaged_app_smoke`, `resume_ended_session`) do not leak, because the app's main process sets its own |
| New: both installs register `substrate://` | Yes, with `substrate-next://` in the test record | electron-builder declares the scheme in Info.plist; with two apps claiming it, macOS picks one to open a link. VS Code gives each build its own `urlProtocol` |

One wrong comment found on the way: the kernel's `session_registry.py` named a process lock at `~/.substrate/daemon.pid` that no code takes. The comment is corrected in place (uncommitted in `../substrate`); it now says one store per daemon is the caller's job. With one store per install, no second backend shares a store, so no lock is needed for this work.

## 4. The swap

Promotion installs a build that passed as the test install into the working slot. It quits the working install, which ends its sessions with `daemon_shutdown` (`server.py` `_shutdown_all_sessions`) and stops every task a session started (`TABLE.stop_all`, `background.py` line 224). A session can start the swap, but it cannot be the process that carries it out. A job handed to launchd does it: wait for the working app's pid to exit, move the old bundle to the Trash by version, copy the new one in, open it. Sessions come back through resume.

The tested bundle and the promoted bundle are two builds of one commit with different identity records. Rust ships the compiler it tested (stage 2). Substrate cannot ship the same bytes under two names. It can show the two bundles differ only in the identity: the bundle comparison of section 5 does that before promotion.

The promoted build's kernel reads records the old kernel wrote. Before promotion, the test install opens a copy of the working store's records and resumes one session (blue-green's shared-data check).

## 5. Experiments

**Diverse double-compiling, in Substrate's terms.** One commit built from a plain terminal and from a session inside the working install, the bundles compared file by file with the build time normalized (`buildVersion`, `electron-builder.config.js` line 122). A remaining difference is something the host app leaked into the build. The same tool compares the test bundle with the promoted bundle, where only identity files should differ.

**Gates against real use.** The working install's trace of each day's work (`EDITOR_FILE_SHOWN` with its milliseconds, for example) beside the same tags from the test install's gates. Numbers only; records from the machine stay out of the repo.

GCC's stage-2-against-stage-3 compare is dropped: Substrate does not compile Substrate, so that compare would test the same environment leak as the double build, with timestamps guaranteeing a difference.

## 6. SDD

The second install adds no event the vocabulary lacks. It adds a second writer of the same vocabulary. `APP_BOOTED` carries `app_version`, `app_commit`, `kernel_commit`, `vocab_version`, `packaged`, `home_kind` and `gate_isolated`; two packaged installs agree on all but the version fields. A `PAYLOAD_FIELD_PROPOSED`, `app_name`, lets a reader and the Rubber Duck Pass tell which install spoke. The leak in 3.4 breaks the stated merge rule "by boot_id, proc_seq"; its gate checks that a test server's records land only in its own trace. Every card carries the observation contract: real bundles, both installs running, screenshots read, mutants on each guard, a capable model for any live session.

## 7. Pressure test of round 1

| Round 1 said | Finding |
|---|---|
| Four conflicts between the installs | Three go with a separate identity; the trace leak does not |
| Two installs on one store end each other's sessions | True only on a shared store, which the design never has |
| The lock follows the name | Measured: it follows the bundle's `productName`, not the code's `setName` |
| A second name separates everything | Data folder and lock, yes; logs and store only once `main.ts` takes them from the record; link scheme only once the record names its own |
| The registry's `daemon.pid` lock is a defect to fix | It is a wrong comment; corrected |
| The promoted build is the tested build | Not byte for byte: the identity differs, and the bundle comparison bounds the difference |

## References

Round 1's references, and:

- microsoft/vscode, `product.json`. https://raw.githubusercontent.com/microsoft/vscode/main/product.json
- electron-builder, `PlatformSpecificBuildOptions.executableName` (`node_modules/app-builder-lib/out/options/PlatformSpecificBuildOptions.d.ts` line 109).
