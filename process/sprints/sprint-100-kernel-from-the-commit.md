---
id: 100
status: closed
class: C (Humble & Farley, Continuous Delivery, 2010, ch. 5: the deployment pipeline starts from version control; "only build your binaries once")
---

# Sprint 100 — the app's kernel comes from the commit, not from PyPI

## why

The Architect, 2026-10-01: "Testing the app should not depend on a release."

Sprint 089 made `scripts/fetch-python-runtime.sh` install `substrate-kernel==$SUBSTRATE_VERSION` from PyPI and refuse to run once `../substrate/src` moved past the `v$SUBSTRATE_VERSION` tag. Every kernel commit therefore blocked every app build until someone published a release and bumped the pin. Publishing to PyPI is outward-facing and irreversible, and it had become the first step of testing. On 2026-10-01 that forced a workaround all day: verification builds from a hand-built wheel (`SUBSTRATE_WHEEL`), which `release.sh` had to be taught to refuse.

The practice: a deployment pipeline takes its input from version control, builds the binaries once, and promotes those binaries through every stage; release to the outside world is the last stage (Humble & Farley, ch. 5). Our pipeline took one of its inputs from the last stage of a different pipeline, the kernel's PyPI release. PyPI is how other people get the kernel library. The app is built in the same workspace as the kernel and has no reason to wait for it.

## done

- `fetch-python-runtime.sh` builds the kernel wheel itself. If `../substrate` has no uncommitted changes in `src/` or `pyproject.toml`, the wheel is built from `git archive HEAD`, which is exactly the committed kernel, and the runtime is releasable. If it has uncommitted changes, the wheel is built from the working tree and the runtime is marked `VERIFICATION_BUILD`. `SUBSTRATE_VERSION`, the PyPI install, the tag-drift guard and `SUBSTRATE_WHEEL` are gone.
- `build/python/KERNEL_SOURCE` (`{"commit", "version", "releasable"}`) ships inside the bundle; `electron-builder.config.js` copies it into Info.plist as `SubstrateKernelCommit`, `SubstrateKernelVersion` and `SubstrateKernelReleasable`, for `pack:dev` builds as well as releases.
- `release.sh` records the kernel commit, refuses a runtime whose `KERNEL_SOURCE` names a different commit, checks `SubstrateKernelCommit` in Info.plist after signing, and treats a dirty kernel `pyproject.toml` as a dirty tree.

## checks (2026-10-01)

- `scripts/release.sh` (no `--notarize`, no `--install`) from substrate-ui `0645c1d` and kernel `0e2b7176`, with kernel 1.1.1 still the newest on PyPI: all six stages passed. UI pytest 214 passed; signature verified before and after the gates; Info.plist records both commits and `SubstrateKernelReleasable=true`; packaged smoke ok; lifecycle gates all passed; Axis-A shakeout 81 tags green, 0 bugs.
- Dirty path: one comment appended to `substrate/src/substrate/topologies/conversation.py`, then `fetch-python-runtime.sh`. The comment appeared in the bundled `site-packages`; `KERNEL_SOURCE` read `"releasable": false`; `VERIFICATION_BUILD` named the base commit. The comment was reverted; the kernel tree is clean.

## what this leaves

Publishing kernel 1.1.2 to PyPI is now a question about the library's other users only; no app build, test or install waits on it. `npm run release --install` can replace `/Applications/Substrate.app` from the commits today.
