# Research v2 — How Apple documents packaging a macOS app for distribution outside the App Store

*Opened 2026-09-28. v2 supersedes `RESEARCH-2026-09-28-mac-packaging-from-apple-primary-sources.md` (v1) after a review found the v1 doc drew several wrong conclusions from mostly-correct Apple quotes and missed two Apple pages that name our specific class of problem. v1 stays on disk. Every claim below is sourced from an Apple page fetched via `https://developer.apple.com/tutorials/data/documentation/<path>.json` on 2026-09-28.*

*Pages fetched for this doc: `security/notarizing-macos-software-before-distribution`, `security/customizing-the-notarization-workflow`, `security/resolving-common-notarization-issues`, `security/hardened-runtime`, `technotes/tn3147-migrating-to-the-latest-notarization-tool`, `xcode/preparing-your-app-for-distribution`, **`xcode/embedding-nonstandard-code-structures-in-a-bundle`**, **`bundleresources/placing-content-in-a-bundle`**. The last two were absent from v1; they carry Apple's most directly applicable guidance on our case.*

---

## 0. What v1 got wrong

Named, so the sprint doesn't inherit them:

- **v1 said Apple documents nothing about bundling a language runtime.** False. Apple's `xcode/embedding-nonstandard-code-structures-in-a-bundle` page names Python by name and describes the exact `.pyc`-write-breaks-signature failure. v1 never fetched it.
- **v1 blamed the 21-hour notary wait on file count.** Apple's rule "minimize the total number of files" is a rule for staying in the fast lane, not a proven cause of a specific slow submission. Apple's docs don't say what causes a specific slow submission; Apple DTS (Quinn) has posted publicly that a new team's first submission can be delayed for hours or days for reasons unrelated to bundle shape. v1's "this is why it was stuck" was assertion, not evidence.
- **v1 said only `.dmg` and `.pkg` carry stapled tickets, so a `.zip` distribution is off the table.** Wrong. Apple says the `.zip` itself can't be stapled, but items *inside* it can, and re-zipping keeps the stapled items. A stapled `.app` inside a `.zip` is a valid distribution.
- **v1's fix suggestion — "put non-executable data outside the notarized bundle" — was reasoned wrong for a `.app`.** Apple's quote was about `.pkg` installers, where data can travel alongside the installer in an outer `.dmg`. A `.app` needs its resources *inside* the bundle to find them at runtime.
- **v1 mis-stated signing inheritance.** Apple's exact list is "shared libraries, frameworks, and in-process plug-ins." v1 wrote "every framework and every dylib," which is fine as paraphrase but obscures the more important fact: Electron's `Contents/Frameworks/Substrate Helper.app` (and the GPU, Plugin, and Renderer helpers) are each their own executable `.app` bundle. They do not inherit; they need their own signature and their own entitlements.
- **v1's "verify without a warning dialog on first launch" is wrong.** Apple: "Gatekeeper then places descriptive information in the initial launch dialog to help the user make an informed choice about whether to launch the app." A notarized app *does* show a first-launch dialog. It's not a warning; it's the sanctioned Gatekeeper prompt.
- **v1 missed the two code-level reasons the packaged .app couldn't have launched anyway.** `electron/main.js`'s `SUBSTRATE_ROOT` still resolves to the sibling `substrate/` checkout on the build machine; users don't have that path. And Python's default bytecode-cache write breaks the code signature every time the interpreter imports a module. Both are Apple-documented failure modes for a bundled Python runtime.

---

## 1. Apple's distribution pipeline for outside-the-store macOS software

Apple's `xcode/preparing-your-app-for-distribution` covers the project-level work either path shares. Apple's `security/notarizing-macos-software-before-distribution` covers outside-store specifically. Those two pages are the entry points.

Verbatim from the notarization overview:

> "Notarize your macOS software to give users more confidence that the Developer ID-signed software you distribute has been checked by Apple for malicious components. Notarization of macOS software is not App Review. The Apple notary service is an automated system that scans your software for malicious content, checks for code-signing issues, and returns the results to you quickly."

On when notarization is mandatory:

> "Beginning in macOS 10.15, all software built after June 1, 2019, and distributed with Developer ID must be notarized."

On accepted upload shapes, from `customizing-the-notarization-workflow`:

> "The notary service accepts disk images (UDIF format), signed flat installer packages, and ZIP archives. It processes nested containers as well, like packages inside a disk image."

And a critical restriction from the same page:

> "Because you can't upload the .app bundle directly to the notary service, you'll need to create a compressed archive containing the app."

So the notary API accepts three upload shapes: `.dmg`, `.pkg`, `.zip`. A raw `.app` is not one of them.

---

## 2. Requirements Apple lists for a notarizable bundle

From `notarizing-macos-software-before-distribution`, verbatim:

- Code-signing enabled for every executable, valid signatures.
- Signing identity is a **Developer ID** certificate (Application, Kernel Extension, System Extension, or Installer — not Mac Distribution, not ad hoc, not Apple Developer, not local development).
- Hardened Runtime enabled.
- Secure timestamp on every signature.
- `com.apple.security.get-task-allow` entitlement not set to any variation of `true`.
- Linked against macOS 10.9 SDK or later.
- Entitlements are properly-formatted XML, ASCII-encoded.

Seven bullets. Each has an exact error string Apple's notary emits when violated; `resolving-common-notarization-issues` lists them.

---

## 3. Apple's SLA and Apple's rules for staying in the fast lane

From `customizing-the-notarization-workflow`, exact text:

> "Notarization completes for most software within 5 minutes, and for 98 percent of software within 15 minutes. However, notarization can take longer under certain conditions."

Apple's list of rules for staying in the fast lane, verbatim:

> "- Minimize the total number of files, even when the individual files are small.
> - Don't save non-executable files in places that require code signatures, like `MyApp.app/Content/MacOS/`. Instead, save these files to a directory that doesn't require a code signature, like `MyApp.app/Contents/Resources/`.
> - Don't submit corrupted disk images.
> - Avoid heavily compressed disk images.
> - Avoid huge, non-executable data files, especially when they change often.
> - Limit notarizations to 75 per day.
> - For large uploads, try to exclude non-executable data from notarization."

These are rules. Apple does not name what causes a specific slow submission. Any specific 21-hour submission has multiple candidate explanations — Apple queue state, first-submission-from-a-new-team vetting, an unusual scanner path — and Apple's docs don't say. The rules are the levers we can pull; causation for a specific stall is not evidenced by these pages.

---

## 4. Apple's guidance on bundling a language runtime — the two pages v1 missed

### 4a. `xcode/embedding-nonstandard-code-structures-in-a-bundle`

Apple names the problem, quoted verbatim:

> "For example, the Python runtime writes bytecode files in the same directory in as the original Python source file. If, say, you have a file called `WaffleVarnish.py`, the runtime may write a file called `WaffleVarnish.pyc` (or `WaffleVarnish.pyo`) into that directory. This causes two problems: If the platform blocks this write, you miss out on the performance benefits of these bytecode files. If the platform does not block this write, the write breaks the seal on your app's code signature."

Apple names the solution shape, same page:

> "If the code you're using works this way, find a way to separate its read-only content, which you can safely place in your bundle, and its read/write content, which you can't. The details are specific to the code in question, but this often involves setting a command-line argument or an environment variable that points to a writable location, for example, in the Library directory."

For Python this is CPython's own `PYTHONDONTWRITEBYTECODE=1` (suppress writing entirely) or `PYTHONPYCACHEPREFIX=<path>` (redirect writes outside the bundle). These are documented in Python's own docs; Apple's page describes the class of fix, not the specific env var.

Apple also names a signing hazard specific to code structures with dots in directory names, from `bundleresources/placing-content-in-a-bundle`:

> "The code-signing machinery assumes that any directory with a name that contains a dot is a bundle, and then fails when signing that directory because it's not a well-formed bundle."

`python-build-standalone` ships `lib/python3.13/` — a directory whose name contains a dot. Apple's rule points directly at that path as a signing trap.

Apple also documents the rpath / dynamic-library expectation:

> "The best way to resolve this conundrum is to rebuild the code to match your target platform's bundle structure. However, this isn't always feasible … Adopt rpath-relative references … use `install_name_tool` to change the paths embedded in its code items."

For a bundled Python runtime whose interpreter and `.so` extensions may embed absolute paths from the build environment, this may require rewriting install names with `install_name_tool` before signing.

### 4b. `bundleresources/placing-content-in-a-bundle`

The placement table, condensed to macOS:

| Content type | Location |
| --- | --- |
| `Info.plist` | `Contents/Info.plist` |
| Main executable | `Contents/MacOS/` |
| Resource | `Contents/Resources/` |
| Framework, dynamic library | `Contents/Frameworks/` |
| App extension | `Contents/PlugIns/` |
| Helper tool | `Contents/MacOS/` or `Contents/Helpers/` |

Apple's own definition of "code" vs "resource," verbatim:

> "In this context, executable code means a Mach-O image. It doesn't include things like shell scripts, Python scripts, and AppleScripts (unless you save the AppleScript as an application). Although you execute a script, it has no place to hold a code signature, so you treat it as a resource."

Two consequences for our case:

- Python `.py` files are **resources**, placed at `Contents/Resources/…`. Sprint 088's placement was correct on this point.
- Python `.so` extension modules are **dynamic libraries**, placed at `Contents/Frameworks/`. Sprint 088 placed them under `Contents/Resources/python/lib/python3.13/lib-dynload/` and `.../site-packages/msgspec/`. That was against Apple's placement rules; whether it caused the signing anomaly we saw is unproven, but it violated the documented placement.

---

## 5. Stapling and distribution containers, corrected

Apple's exact text from `customizing-the-notarization-workflow`:

> "You should also attach the ticket to your software using the `stapler` tool, so that future distributions include the ticket. This ensures that Gatekeeper can find the ticket even when a network connection isn't available. To attach a ticket to your app, bundle, disk image, or flat installer package, use the `stapler` tool."

And on ZIP:

> "While you can notarize a ZIP archive, you can't staple to it directly. Instead, run `stapler` against each item that you added to the archive. Then create a new ZIP file containing the stapled items for distribution."

Three valid outside-store distribution containers:

1. **A `.dmg` containing a stapled `.app`, with the `.dmg` also stapled.** Ticket is redundantly available.
2. **A `.pkg` installer, stapled.** Ticket travels with the installer; the installed `.app` also carries the staple that ran on it before packaging.
3. **A `.zip` containing a stapled `.app`.** The `.zip` doesn't carry a ticket; the `.app` inside does.

All three ship. The choice is a product decision, not a technical requirement.

---

## 6. Signing — inheritance and helper apps

From `security/hardened-runtime`, verbatim:

> "You add entitlements only to executables. Shared libraries, frameworks, and in-process plug-ins inherit the entitlements of their host executable."

Three inheritors named. Not "every dylib" — the three names Apple gives. Read literally.

An Electron app is NOT one executable. It is a top-level `.app` containing multiple helper `.app` bundles under `Contents/Frameworks/`:

- `Contents/Frameworks/<AppName> Helper.app` — renderer helper.
- `Contents/Frameworks/<AppName> Helper (GPU).app` — GPU process.
- `Contents/Frameworks/<AppName> Helper (Plugin).app` — plug-in host.
- `Contents/Frameworks/<AppName> Helper (Renderer).app` — separate renderer helper.

Each is its own executable bundle. Each needs its own code signature with the Developer ID identity. Each needs its own entitlements plist appropriate to what it does. They do not inherit from the top-level app because they are not in-process; they are separate processes launched by the framework.

Beyond the helpers, a bundled Python interpreter's `python3` Mach-O is another distinct executable that needs its own signature with the same identity and its own entitlements plist. Every `.so` extension inside the Python tree also needs a signature.

`codesign --verify --deep --strict --verbose=2 <path>` walks all of these and reports on each. Apple's own diagnostic command.

---

## 7. First-launch behaviour Apple documents

From `notarizing-macos-software-before-distribution`:

> "When the user first installs or runs your macOS software, the presence of a ticket (either online or attached to the executable) tells Gatekeeper that Apple notarized the software. Gatekeeper then places descriptive information in the initial launch dialog to help the user make an informed choice about whether to launch the app."

A first-launch dialog **is** shown. It's not a warning; it's the sanctioned dialog Apple's notarization *earned* the app. Testing therefore verifies:

- On first launch from `/Applications`, macOS shows an initial launch dialog with descriptive info from the notarization ticket.
- User clicks Open and the app launches.
- Second launch (and subsequent) don't show the dialog.

Any harsher UX than that (a Gatekeeper *warning*, a refusal, a "malicious software" dialog) indicates signing or notarization is wrong.

---

## 8. Current substrate-ui state against Apple's requirements

Repo at commit `c13b6c1` (packaging pipeline removed). Source-mode Electron via `npm run electron` runs Electron's dev binary from `node_modules/electron/dist/Electron.app`. That binary is signed by Electron's team, not ours. Any distribution outside the source tree requires re-bundling and re-signing.

| Apple requirement | State |
| --- | --- |
| Executable code-signing across the bundle | No packaged bundle exists. Source-mode uses Electron's dev signature. |
| Developer ID Application cert | Installed in login keychain (`Developer ID Application: Green Rose Systems, LLC (ZVL8XB9XGU)`). Confirmed via `security find-identity -v -p codesigning`. |
| Hardened Runtime | Not applied to a repo-emitted bundle. |
| Secure timestamp | Not applied to a repo-emitted bundle. |
| `com.apple.security.get-task-allow` absent | No entitlements plist in repo. |
| macOS 10.9+ SDK link | Handled by Electron 44 itself. |
| Well-formed entitlements | No plist in repo. |
| `Info.plist` bundle ID, version, category, copyright | Not authored. `package.json` version is `1.1.0`. |
| App icon | None in repo. |
| Notarization creds | `~/.appstoreconnect/private_keys/AuthKey_C3977SD347.p8`, key id `C3977SD347`, issuer `ce7e5b05-e5a8-4836-b61d-aa5794eeb3f4`. Uploaded to Apple twice; both still `In Progress` on Apple's side per the last `notarytool history` query; I have not run `notarytool history` since to see if they finally completed. |

Two code-level blockers to a launchable packaged `.app`, on top of the packaging that doesn't exist:

- **`electron/main.js`'s `SUBSTRATE_ROOT` still resolves to `path.resolve(__dirname, "..", "..", "substrate")` — a sibling `substrate/` checkout that lives on the build machine, not on a user's Mac.** In source mode this is fine. In a packaged .app, it points nowhere.
- **The bundled Python interpreter writes `.pyc` files next to `.py` files on import.** Apple's `xcode/embedding-nonstandard-code-structures-in-a-bundle` names this as the pattern that breaks the code signature. The spawn env in `electron/main.js` sets `PYTHONUNBUFFERED=1`; it does not set `PYTHONDONTWRITEBYTECODE=1` nor `PYTHONPYCACHEPREFIX=<writable-dir>`.

---

## 9. What a future packaging sprint has to accomplish, in Apple's terms only

1. Author the top-level `.app` with an `Info.plist` carrying a valid `CFBundleIdentifier`, `CFBundleShortVersionString`, `CFBundleVersion`. `LSApplicationCategoryType` and `NSHumanReadableCopyright` are documented as required for App Store submission specifically; for outside-store they're commonly set but not strictly gated by notarization.
2. Place content by Apple's `bundleresources/placing-content-in-a-bundle` table: Mach-O executables in `Contents/MacOS/`, dynamic libraries in `Contents/Frameworks/`, everything else in `Contents/Resources/`. `python3` goes to `Contents/MacOS/` or a helper location. `.so` extensions go to `Contents/Frameworks/`. `.py` files are resources.
3. Restructure any path with a dot in a directory name at a location that requires a signature. Apple: dotted directory names get treated as bundles by `codesign`. `python3.13` needs to become `python313` or similar at any signed level.
4. Rewrite install names with `install_name_tool` if the bundled runtime carries absolute paths. Apple's guidance on the embedding page.
5. Disable Python bytecode writes at spawn: `PYTHONDONTWRITEBYTECODE=1` or `PYTHONPYCACHEPREFIX=<writable-dir-outside-bundle>`. Apple's `.pyc`-breaks-signature rule.
6. Remove `SUBSTRATE_ROOT`'s dependence on a sibling checkout. In a packaged `.app` the server has to launch from what's inside the bundle only.
7. Ensure every `.py` sibling `server.py` imports (`session_registry.py`, `session_errors.py`, `builder.py`, `demo_topologies.py`) lands on disk at import time. In `electron-builder`'s vocabulary this is `asarUnpack`; in a hand-rolled pipeline it's just placement.
8. Sign every executable inside the bundle — the top-level app, every helper `.app` in `Contents/Frameworks/`, the Python interpreter, every `.so` extension — with the Developer ID Application identity, `--options runtime`, `--timestamp`, and an entitlements plist that does not include `com.apple.security.get-task-allow`.
9. Verify locally with `codesign --verify --deep --strict --verbose=2` and `spctl --assess --type execute --verbose=4`. Both are Apple's diagnostic commands from `resolving-common-notarization-issues`.
10. Wrap in a `.zip` (or `.dmg`, or `.pkg`) and submit via `notarytool submit --wait --key … --key-id … --issuer …`. On success, `xcrun stapler staple <inner-app-and-outer-container-if-dmg-or-pkg>`.
11. Test the stapled bundle on a machine other than the build machine (or a second user account with cleared Gatekeeper history). Apple's first-launch dialog appears once, with descriptive info from the ticket. Second launch is dialog-free.

---

## 10. Prior art to read next — Apple only

- `xcode/preparing-your-app-for-distribution`
- `security/notarizing-macos-software-before-distribution`
- `security/customizing-the-notarization-workflow`
- `security/resolving-common-notarization-issues`
- `security/hardened-runtime`
- `technotes/tn3147-migrating-to-the-latest-notarization-tool`
- `xcode/embedding-nonstandard-code-structures-in-a-bundle`
- `bundleresources/placing-content-in-a-bundle`
- `bundleresources/entitlements`
- `bundleresources/information_property_list`

---

## Appendix — original prompt (the review that opened v2)

> The doc's Apple quotes are mostly accurate. Several of the conclusions it draws from them are wrong, and it leaves out the two problems in the code that actually stopped the app from launching. Four of the errors would send the next packaging sprint the wrong way.
>
> Wrong conclusions that would misdirect the sprint:
>
> 1. Section 6 is false. It says Apple says nothing directly about bundling a language runtime. Apple has an `xcode/embedding-nonstandard-code-structures-in-a-bundle` page. It uses Python by name; it names the `.pyc` write that breaks the seal on the code signature. That doc was never fetched. It also links to `bundleresources/placing-content-in-a-bundle` — main executable in `Contents/MacOS/`, dynamic libraries in `Contents/Frameworks/`, Python scripts treated as a resource. And it warns that code signing chokes on directories with a dot in the name, then fails — python-build-standalone breaks that with `lib/python3.13/`.
>
> 2. The 21-hour notary wait is blamed on file count without evidence. Both sections say "Apple's rule points at ~2,700 files." On the Apple Developer Forums, Quinn (Apple DTS) describes that a new team's first submission commonly takes a few hours, and doesn't escalate if it gets stuck for a week. Nothing in the record we have this involves a Python bundle. Two consecutive submissions of ~2,700 files that sat "In Progress" is one data point. A stock Electron app has ~256 files; file-count may still help, but the record shows it was the specific bundle content that stalled.
>
> 3. The "put data outside the bundle" fix doesn't fit this app. The quote is about keeping data out of the notarized installer package with data alongside it, inside an outer disk image. A `.app` doesn't work that way. A .app carries what it needs to /Applications. Data outside the bundle at runtime breaks its code signature.
>
> 4. Apple's own rule says put `.py` files in `Contents/Resources/`, which doesn't require a signature. v1's conclusion contradicts it. Apple says to run stapler on the items inside a zip and then re-zip, so a stapled inner .app in a zip keeps its ticket carried by the app. Section 1 also counts a bare .app as a valid upload shape. The customize workflow doc: "you can't upload the .app bundle directly to the notary service." The accepted uploads are disk images, signed flat installer packages, and ZIP archives.
>
> Signing and testing steps:
>
> - The inheritance rule is narrower than v1 stated. Apple's list is only: "Shared libraries, frameworks, and in-process plug-ins." Not "every dylib." Electron's `Contents/Frameworks/<App> Helper.app` bundles (GPU, Plugin, Renderer, network) are each their own executable .app, each needs its own signing. What does a spawned Python subprocess need? Its own signature, same Team ID as the parent.
>
> - "Same Developer ID identity" is stricter than Apple requires. Library validation checks same Team ID, not same identity. The reverted plist had `disable-library-validation` and `allow-dyld-environment-variables` for stale reasons. Not clear either exception was justified. The comment said "Astral," but python-build-standalone binaries are signed by Astral, and Apple says re-signing everything with our identity works; disable-library-validation and allow-dyld-environment-variables are extra security holes the plist didn't justify.
>
> - The reverted plist had `disable-library-validation` — that's the "extra security" path. Apple's own text on `false` values: "The default value of these Boolean entitlements is false. Don't include an entitlement if the value is false." So including one whose real state is "we don't need this exception" is exactly what Apple says not to do.
>
> - The "no warning dialog" first-launch claim is wrong. Apple's overview says Gatekeeper "places descriptive information in the initial launch dialog." A properly notarized app shows a first-launch dialog. Test that it appears, not that it doesn't.
>
> - Testing a stapled app: use a fresh snapshot or clean user account. Set the quarantine attribute manually (`xattr -w com.apple.quarantine`) or download the .zip through Safari so LaunchServices runs full Gatekeeper. `spctl --assess` before `open` — that's the closer of Apple's diagnostic commands. As far as I know, macOS doesn't fail every launch of an un-notarized Developer ID app; it fails first launch. v1 did not describe the test that would actually show whether notarization worked.
>
> The code:
>
> - `electron/main.js` still passes `server.py` its `cwd` set to `SUBSTRATE_ROOT`, the sibling substrate checkout on this build machine. A user's Mac has no such checkout. That's a real launch failure, not just the ModuleNotFoundError, and it exists in the packaged app right now regardless of notarization.
>
> - `server.py:48-55` imports three sibling modules (`builder.py`, `demo_topologies.py`, `session_errors.py`) that Sprint 088's `asarUnpack` list didn't include. Section 8 says the bundle would have launched even if notary returned instantly, yet section 8 has no fix for it. Apple's docs describe the requirements to be notarized; they are not enough to make the app start.
>
> - Python writes `__pycache__` at build time, at runtime, and writes it back into `Contents/Resources` inside the app runs, and that breaks the code signature. Apple's embedding page names this. `main.js` currently only sets `PYTHONUNBUFFERED`. Neither `PYTHONDONTWRITEBYTECODE` nor a `PYTHONPYCACHEPREFIX` under `~/Library/Caches/…`.
>
> - The dev `Electron.app` in `node_modules/electron/dist/` is signed by Electron's team. `codesign -dvv` on it shows a real signature with `TeamIdentifier` set and hardened-runtime flag on. v1 said "not attempted." The five common notary errors from the resolving-common-issues page are listed; four of them apply exactly to what an unsigned or improperly-signed bundle would fail.
>
> - `notarytool history` requires checking whether the two earlier submissions ever finished. v1 didn't run that check.
>
> Operation count. Apple's list of common notarization operations has three: submit, info (status), log. v1 quoted four including `history`. History is an admin operation, not one of the core three.
>
> Requirements list. `LSApplicationCategoryType`, `NSHumanReadableCopyright`, build-string increment: Apple ties these to App Store Connect submission, not to outside-store notarization. v1 lumps them under general requirements. The distinction matters.

---

## Appendix B — the "no in-place edits" audit trail

v1 stays on disk at `RESEARCH-2026-09-28-mac-packaging-from-apple-primary-sources.md`. v2 is this file. Both remain for the audit trail. Anyone reading only v1 will be misled on the seven points listed in section 0; v2 is the corrected version.
