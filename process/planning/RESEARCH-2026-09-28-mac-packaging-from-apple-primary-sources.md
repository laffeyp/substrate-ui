# Research — How Apple documents packaging a macOS app for distribution outside the App Store

*Opened 2026-09-28. Every claim in this document is sourced from Apple's own developer documentation, fetched from `https://developer.apple.com/tutorials/data/documentation/<path>.json` on 2026-09-28. Non-Apple assertions are called out explicitly.*

*Companion to `RESEARCH-2026-09-27-moves-…` and `RESEARCH-2026-09-27-mastering-…`. Written after Sprint 088's packaging pipeline was reverted (commit `c13b6c1`) because it produced a bundle Apple's notary service could not process in normal time and that would not have launched even if it had been notarized.*

---

## 1. What Apple names as the distribution pipeline

Two distribution destinations exist for a macOS app in Apple's docs. **App Store** distribution and **outside-the-store** distribution. This document treats only the second; that is the target.

Apple's page "Preparing Your App for Distribution" (`xcode/preparing-your-app-for-distribution`) covers the project-level work required before either path. Apple's page "Notarizing macOS software before distribution" (`security/notarizing-macos-software-before-distribution`) covers the outside-store path specifically. Two complementary pages, the second links back to the first.

From the notarizing page, verbatim:

> "Notarize your macOS software to give users more confidence that the Developer ID-signed software you distribute has been checked by Apple for malicious components. Notarization of macOS software is not App Review. The Apple notary service is an automated system that scans your software for malicious content, checks for code-signing issues, and returns the results to you quickly."

Two anchor facts from that paragraph. First, notarization is *not* App Review — no human review, no rejection for taste, only signature and malware scans. Second, the promise is fast turnaround.

From the same page, on when notarization is required:

> "Beginning in macOS 10.14.5, software signed with a new Developer ID certificate and all new or updated kernel extensions must be notarized to run. Beginning in macOS 10.15, all software built after June 1, 2019, and distributed with Developer ID must be notarized."

The "must" is Apple's word. Without notarization, macOS refuses to launch a signed-with-Developer-ID app that a user downloaded from the internet.

From the same page, on accepted deliverables:

> "You can notarize several different types of software deliverables, including: macOS apps, Non-app bundles, such as kernel extensions, Disk images (UDIF format), Flat installer packages"

Four accepted top-level shapes. A `.app` alone is one. A `.dmg` around a `.app` is another. A `.pkg` installer is another. Apple names no preference among them.

---

## 2. Requirements Apple documents for a notarizable bundle

From "Notarizing macOS software before distribution", section "Prepare your software for notarization" — Apple's exact list:

> "Enable code-signing for all of the executables you distribute, and ensure that executables have valid code signatures."

> "Use a 'Developer ID' application, kernel extension, system extension, or installer certificate for your code-signing signature. (Don't use a Mac Distribution, ad hoc, Apple Developer, or local development certificate.)"

> "Enable the Hardened Runtime capability for your app and command line targets."

> "Include a secure timestamp with your code-signing signature."

> "Don't include the `com.apple.security.get-task-allow` entitlement with the value set to any variation of `true`."

> "Link against the macOS 10.9 or later SDK."

> "Ensure your processes have properly-formatted XML, ASCII-encoded entitlements."

Seven bullets. That is Apple's canonical requirements list.

The "Resolving common notarization issues" page (`security/resolving-common-notarization-issues`) restates each one in the context of the specific error message Apple emits when it is violated. The error strings, quoted from that page:

- Invalid or missing code signature → verify with `codesign -vvv --deep --strict <path>`.
- Wrong cert type → "You can only notarize apps that you sign with a Developer ID certificate."
- Missing secure timestamp → "add a secure timestamp by adding the `timestamp` option to your `OTHER_CODE_SIGN_FLAGS` build setting."
- `com.apple.security.get-task-allow` present → "notarization fails".
- Old SDK → "notarization only works for binaries linked against macOS 10.9 or later."
- Hardened Runtime missing → "notarization fails".
- Malformed entitlements → "the notary service will reject with an error message like: `bplist00…`".

Every one of these seven is an automated check, produces an error string, and can be diagnosed against a specific `codesign`, `pkgutil`, or `plutil` command Apple names.

---

## 3. Apple's SLA and Apple's rules for staying in the fast lane

From "Customizing the notarization workflow" (`security/customizing-the-notarization-workflow`), section "Avoid long notarization response times and size limits":

> "Notarization completes for most software within 5 minutes, and for 98 percent of software within 15 minutes. However, notarization can take longer under certain conditions. Help to avoid long response times by following a few rules:
>
> - Minimize the total number of files, even when the individual files are small.
> - Don't save non-executable files in places that require code signatures, like `MyApp.app/Content/MacOS/`. Instead, save these files to a directory that doesn't require a code signature, like `MyApp.app/Contents/Resources/`.
> - Don't submit corrupted disk images. You can verify the integrity of a disk image by running the `hdiutil` utility.
> - Avoid heavily compressed disk images.
> - Avoid huge, non-executable data files, especially when they change often.
> - Limit notarizations to 75 per day.
> - For large uploads, try to exclude non-executable data from notarization."

Seven rules. Apple's own text.

Sprint 088's pipeline violated the first rule. It uploaded a Python-runtime tree of ~2,700 files, the vast majority of which were non-executable `.py` files inside `Contents/Resources/python/`. Two submissions sat "In Progress" for 21 and 18 hours. Apple's rule points directly at the cause; Apple's suggested fix is:

> "For large uploads, try to exclude non-executable data from notarization. For example, if you use an installer package, you could move all your non-executable data into a folder next to a notarized installer package. Put both the data and the notarized installer package into a single disk image, and ship the disk image without notarization."

The engineering read for our case: pure-Python source lives *outside* the notarized bundle, inside the outer container that carries the notarized bundle to the user. The interpreter binary and any `.so` extensions stay inside the notarized bundle; the `.py` source travels alongside.

---

## 4. What Apple says the bundle itself must carry

From "Preparing Your App for Distribution" (`xcode/preparing-your-app-for-distribution`):

**Bundle ID.** Apple's exact text: "the bundle ID (`CFBundleIdentifier`), which uniquely identifies your app throughout the system, defaults to the organization ID appended to the app name that you enter in reverse-DNS format—for example, the bundle ID becomes `com.example.mycompany.HelloWorld`."

**Version + build string.** Apple's text: "The version number (`CFBundleShortVersionString`) and build string (`CFBundleVersion`) uniquely identify the build of your app throughout the system. … Build strings for Mac apps must increment across all versions of your app."

**Category (macOS).** Apple's text: "For macOS apps, you also set a category for your app in your project. … Choose a category from the App Category pop-up menu." This is the `LSApplicationCategoryType` `Info.plist` key.

**App icon.** Apple's text: "Add an icon to represent your app in various locations on a device and on the App Store. You can use either a single multilayer Icon Composer file that supports [Liquid Glass] or an icon asset catalog to represent your icon."

**Usage descriptions.** Apple's text: "You must provide usage descriptions in the `Info.plist` for all protected resources your app accesses, such as a person's location, calendar, reminders, and contacts. Also provide usage descriptions for accessories, such as the camera and microphone."

**Hardened Runtime + App Sandbox (macOS).** Apple's text, verbatim: "If you notarize your macOS app to distribute it outside of the App Store, you must [enable the Hardened Runtime] and, optionally, can also enable App Sandbox."

**Copyright key (macOS).** Apple's text: "For macOS apps, [set] `NSHumanReadableCopyright` in the information property list before you upload your app to App Store Connect."

**Export compliance.** Apple's text: "If you distribute your app outside the United States or Canada, your app is subject to U.S. export laws. If your app uses encryption, it is subject to U.S. export compliance requirements."

---

## 5. What Apple says about the signing story specifically

Every executable inside the bundle must be signed with the same Developer ID Application identity. From "Notarizing macOS software before distribution":

> "Enable code-signing for all of the executables you distribute, and ensure that executables have valid code signatures."

The Hardened Runtime page (`security/hardened-runtime`) adds a specific rule about nested code:

> "You add entitlements only to executables. Shared libraries, frameworks, and in-process plug-ins inherit the entitlements of their host executable."

So the entitlements plist attaches to the top-level executable; every framework and every dylib inside the bundle inherits. Signing them individually is still required. Inheritance is about entitlements, not about signatures.

The Hardened Runtime page also names a specific exception path relevant to loading external code:

> "The default value of these Boolean entitlements is false. When Xcode signs your code, it includes an entitlement only if the value is true. If you're manually signing code, follow this convention to ensure maximum compatibility. Don't include an entitlement if the value is false."

The plist should carry only the exceptions the runtime actually needs. Every additional exception weakens the guarantee.

`notarytool` is Apple's supported command-line entry point. From "Migrating to the latest notarization tool" (`technotes/tn3147-migrating-to-the-latest-notarization-tool`):

> "Starting November 1, 2023, the Apple notary service no longer accepts uploads from `altool` or Xcode 13 or earlier."

The three notarytool operations Apple documents:

> "The common notarization operations are: Submit a file to the notary service. Check on the status of a previous submission. Fetch the notary log. Get a history of recent activity."

Submission uses `notarytool submit <file> --wait --key … --key-id … --issuer …`. Status uses `info <submission-id>`. Log uses `log <submission-id>`. History uses `history`. Four commands total.

After a successful notarization, Apple documents the stapling step, still from "Customizing the notarization workflow":

> "You should also attach the ticket to your software using the `stapler` tool, so that future distributions include the ticket. This ensures that Gatekeeper can find the ticket even when a network connection isn't available."

And an important restriction on the ZIP shape:

> "While you can notarize a ZIP archive, you can't staple to it directly. Instead, run `stapler` against each item that you added to the archive. Then create a new ZIP file containing the stapled items for distribution. Although tickets are created for standalone binaries, it's not currently possible to staple tickets to them."

A `.dmg` or `.pkg` accepts a stapled ticket directly. A `.zip` does not. That determines the outer container: for a shippable, offline-installable outside-store macOS app, the outermost thing that carries the ticket is a `.dmg` or a `.pkg`, not a `.zip`.

---

## 6. What Apple documents about bundling a language runtime

Nothing directly. The word "Python" does not appear in any of the six pages fetched (`notarize`, `customize`, `resolve`, `hardened`, `notarytool`, `prepare`). The word "interpreter" does not appear. The word "script" appears once, in a phrase about pkgbuild.

Apple's rules do apply to any bundled runtime, but they are stated at the level of files and executables, not language ecosystems. The applicable rules are the same seven from section 2 plus the seven from section 3. A Python interpreter is a Mach-O executable, subject to signing, hardening, and entitlement rules. A Python `.so` extension is a Mach-O bundle, subject to signing. Everything else — `.py` files, package data, metadata directories — is non-executable and subject to the "minimize file count" rule.

Any prior claim I made that named a specific third-party bundler as "the professional shape" had no citation from Apple. Retracting each of those claims. Apple names no bundler. Apple names requirements.

---

## 7. Where the current source-mode substrate-ui sits against Apple's requirements

Present-tense audit against Apple's list. As of commit `c13b6c1`:

| Apple requirement | State | Notes |
| --- | --- | --- |
| Executable code-signing | Not attempted (source mode) | `npm run electron` runs against `node_modules/electron/dist/Electron.app` which is signed by Electron's own team. Repo emits no signed artifact. |
| Developer ID Application cert | Present in login keychain | `Developer ID Application: Green Rose Systems, LLC (ZVL8XB9XGU)`. Installed via Xcode → Manage Certificates. |
| Hardened Runtime | Not attempted (source mode) | Electron's dev binary carries the default runtime for `electron .`. |
| Secure timestamp | Not attempted | |
| No `get-task-allow` entitlement | Not attempted | |
| macOS 10.9+ SDK link | Handled by Electron 44 | Electron's own binary meets this. |
| Well-formed entitlements | No entitlements plist authored in repo currently | The one that Sprint 088 introduced was removed at revert. |
| Bundle ID (`CFBundleIdentifier`) | Not authored | Any packaging attempt has to set one; `com.greenrosesystems.substrate` was proposed in the reverted config. |
| `CFBundleShortVersionString` | Only in `package.json` (`1.1.0`) | Not projected into an `Info.plist` because the repo has no bundle-authoring step. |
| App icon | None authored | No `.icns` in the repo. |
| `NSHumanReadableCopyright` | None | |
| `LSApplicationCategoryType` | None | |
| `notarytool` credentials | Present on disk (`~/.appstoreconnect/private_keys/AuthKey_C3977SD347.p8`, key id `C3977SD347`, issuer `ce7e5b05-…`) | Verified by two successful uploads to Apple this session; both were of a bundle that then sat "In Progress" on Apple's side. |

Every requirement Apple documents can be met; none of them is presently met at the repo level because the packaging pipeline that would meet them was removed. That is the current, honest state.

---

## 8. What a future packaging sprint has to accomplish, expressed only in Apple's terms

Not a checklist of tools. Not a mention of any specific third-party bundler. Only the requirements sourced above:

1. Produce a `.app` bundle whose `Info.plist` carries a valid `CFBundleIdentifier`, `CFBundleShortVersionString`, `CFBundleVersion`, `LSApplicationCategoryType`, `NSHumanReadableCopyright`, and any `NS…UsageDescription` keys required by protected resources the app touches.
2. Sign every executable inside the bundle — main binary, framework binaries, helper binaries, any bundled interpreter, any `.so` extension — with the same Developer ID Application identity, with the secure timestamp option on, under the Hardened Runtime, with a plist of entitlements that does not include `com.apple.security.get-task-allow`.
3. Keep the total file count of the notarized bundle low. Apple's rule quoted verbatim: "Minimize the total number of files, even when the individual files are small." Bundled non-executable data (Python sources, JS, assets) either sits inside the notarized bundle at a low file count, or ships in the outer container alongside the notarized bundle so it is not scanned.
4. Verify the bundle locally with `codesign --verify --deep --strict --verbose=2 <path>` and `spctl --assess --type execute --verbose=4 <path>` before submitting to notary. Both are Apple's diagnostic commands, named in the Resolving Common Issues page.
5. Submit via `notarytool submit --wait --key … --key-id … --issuer …`. Apple's target is 5 minutes; Apple's 98th percentile is 15 minutes. Anything past that is a signal to fetch the log and read it. Apple's guidance: "Always check the log file, even if notarization succeeds, because it might contain warnings that you can fix prior to your next submission."
6. Staple the returned ticket with `xcrun stapler staple <bundle>`. If the outer distribution container is a `.dmg` or `.pkg`, staple that too — Apple's own rule: `.zip` cannot carry a stapled ticket, only its inner items can.
7. Verify the stapled bundle with `spctl --assess --type execute` and, on a second machine (or a second user account with cleared launch history), verify Gatekeeper permits the app on first launch without a warning dialog.

Every step in that list traces to an Apple-documented rule. Nothing else in this document tells the sprint which tool to use to accomplish it; that is a separate research question, addressed against Apple's docs plus the specific tool's own docs, in a document that opens when this one is signed off.

---

## 9. Prior art to read next — Apple only

- `xcode/preparing-your-app-for-distribution` — the top-level distribution page.
- `security/notarizing-macos-software-before-distribution` — notarization overview.
- `security/customizing-the-notarization-workflow` — the command-line notarization pipeline.
- `security/resolving-common-notarization-issues` — every failure mode Apple documents, with its exact error string.
- `security/hardened-runtime` — the runtime restrictions and how entitlements relax them.
- `technotes/tn3147-migrating-to-the-latest-notarization-tool` — `notarytool` reference.
- `bundleresources/entitlements` — the entitlements reference index.
- `bundleresources/information_property_list` — the `Info.plist` reference index.

---

## Appendix — original prompt

> Okay, now get the research document in for the actual way to correctly package this based solely on Apple's documentation.
>
> Again, this is framed only as a series of mechanical changes.
>
> Because that's what it is.
