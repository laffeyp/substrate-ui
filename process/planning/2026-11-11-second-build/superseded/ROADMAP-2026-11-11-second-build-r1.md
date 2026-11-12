# Roadmap — the second build: working inside Substrate (round 1)

*2026-11-11. The Architect, 2026-11-11: "there needs to be an additional final build stage … the one that we are working inside of … We can hot swap it out whenever we want"; and, on the conflicts, "They don't all have to be named substrate … if you just key the core differences off the actual name of the actual apps … that's one great way to do it." The design is `PAPER-2026-11-11-second-build-r2.md`. Items are numbered in the order they are built; one card each, sprints 487–493.*

---

## Why

The work moves inside Substrate. The app the work happens in has to keep running, keep its sessions, and keep its record clean while the next build is made, installed, tested and swapped in beside it.

## Scope

- **In:** a second install, Substrate Next, with its own name, bundle id, store, data folder, logs and link scheme, read from one identity record per install (as VS Code's `product.json` does); the runbook's build-and-install run from a session inside the working install; a check that the two builds of one commit differ only in identity; the swap of a tested build into the working slot, carried out from outside the app.
- **Later:** more than two installs; installs on other machines; signed and notarized test builds (the release chapter stays the working install's).

## How each item is verified

Each card's observation contract runs on real bundles with both installs open. A gate or a step is graded by what the running apps write (their traces, data folders, stores and logs) and by screenshots read. Each guard gets a mutant. A live session uses a capable model.

## Items

**E1 — A test server started from a session keeps to its own trace (sprint 487).** `harness/shakeout/lib/server.ts` stops passing on the parent's `SUBSTRATE_TRACE_DIR`, `SUBSTRATE_BOOT_ID` and `SUBSTRATE_PARENT_PID`. Measured before: `vm_smoke` with those set wrote 6 records into the named trace under the inherited boot id. This one is not solved by naming, so it goes first.

**E2 — One identity record per install, and the test bundle (sprint 488).** `electron/identity.json` holds the two records (name, bundle id, executable, store folder, link scheme). `electron-builder.config.js` reads the record named by `SUBSTRATE_INSTALL` (default `substrate`); `npm run pack:next` builds `Substrate Next.app` into its own output folder.

**E3 — The app takes its name, store, logs and link scheme from its record (sprint 489).** `electron/main.ts` finds its record by the bundle's name at launch, names the app from it (logs follow), passes the record's store to the server, and handles its own link scheme. `npm run electron` and the gates keep "Substrate Dev" and their `SUBSTRATE_HOME`.

**E4 — The boot record names the install (sprint 490).** `APP_BOOTED` gains `app_name` (vocabulary v0.68, `PAYLOAD_FIELD_PROPOSED`).

**E5 — Build and install the test install from inside the working install (sprint 491).** Runbook round 9: a chapter that runs steps 1–16 against `Substrate Next.app` and installs it at `/Applications/Substrate Next.app`, quitting only "Substrate Next". Run from a session in the working install.

**E6 — The two builds compared (sprint 492).** A script compares two bundles file by file with the build time normalized. Run on one commit built from a plain terminal and from a session inside the working install (anything left is a leak from the host app), and on the test and working bundles of one commit (only identity files may differ).

**E7 — The swap, carried out from outside the app (sprint 493).** `scripts/promote.sh` builds the working bundle of a tested commit, compares it with the tested Next bundle (E6), and hands launchd a job that waits for the working install to quit, moves the old bundle to the Trash by version, installs the new one and opens it. Runbook round 10 adds it. The full suites run once at this close.

## Order

E1, E2, E3, E4, E5, E6, E7. E3 comes before the test install is ever opened: until `main.ts` takes the store from the record, a Next bundle would open the working install's `~/.substrate`.
