// Sprint 089 — Mac packaging config, rebuilt from Apple's docs after
// Sprint 088's config produced a non-launchable .app.
//
// Design anchor:
//   process/planning/RESEARCH-2026-09-28-mac-packaging-from-apple-primary-sources-v2.md
//   process/sprints/sprint-089-mac-packaging-per-apple-rules.md
//
// Boundary of this config: it produces dist-electron/*.dmg on local
// disk. Hosting the .dmg is handed off; this config does not upload,
// does not publish, does not autoupdate. Notarization happens
// internally via the notarize block — Apple credentials come from
// APPLE_API_KEY / APPLE_API_KEY_ID / APPLE_API_ISSUER in the
// environment.
//
// Notary submission path (per Apple's customizing-the-notarization-
// workflow doc): the signed .app is zipped, submitted to notary,
// the ticket is stapled onto the .app, and then the .dmg is built
// around the stapled .app. electron-builder handles this whole
// sequence when `mac.notarize: true` is set.

/** @type {import("electron-builder").Configuration} */
module.exports = {
  appId: "com.greenrosesystems.substrate",
  productName: "Substrate",
  copyright: "Copyright © 2026 Green Rose Systems, LLC",
  asar: true,

  // server.py opens its sibling .py files by name — Python's import
  // system needs them on disk, not inside asar. They go to
  // Contents/Resources/app.asar.unpacked/ (Sprint 088's bug: only
  // session_registry.py was listed; the others caused
  // ModuleNotFoundError at first launch). The session registry itself
  // now ships in the kernel wheel (substrate.session_registry).
  asarUnpack: [
    "server.py",
    "session_errors.py",
    "builder.py",
    "demo_topologies.py",
    // Python's http server serves the reveal shell from disk via
    // `Path(__file__).parent / "web" / "dist"`. Inside asar the
    // files are compressed archive members Python can't stat.
    // asarUnpack pulls them to Contents/Resources/app.asar.unpacked/
    // so the server finds them where it expects.
    "web/dist/**",
  ],

  files: [
    "electron/**/*",
    "web/dist/**/*",
    "server.py",
    "session_errors.py",
    "builder.py",
    "demo_topologies.py",
    "package.json",
    "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
    "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
    "!**/node_modules/*.d.ts",
    "!**/node_modules/.bin",
    "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
    "!.editorconfig",
    "!**/._*",
    "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
    "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
  ],

  // The bundled Python runtime lands in Contents/Resources/python/.
  // scripts/fetch-python-runtime.sh materialises it under
  // build/python/ before this config runs.
  extraResources: [
    { from: "build/python", to: "python", filter: ["**/*"] },
  ],
  // F10: the runtime's Mach-O code (interpreter, libpython, extension modules), split out by
  // scripts/fetch-python-runtime.sh step 11. Resources/python keeps symlinks to these.
  extraFiles: [
    { from: "build/python-native", to: "Frameworks/python-native", filter: ["**/*"] },
  ],

  directories: {
    output: "dist-electron",
    buildResources: "build",
  },

  // Declare `substrate://` in the bundle's Info.plist. Electron's
  // `app.setAsDefaultProtocolClient` documentation: "On macOS, you can
  // only register protocols that have been added to your app's
  // info.plist, which cannot be modified at runtime." The runtime call
  // in electron/main.js is source-mode-only without this. Review
  // 2026-09-28 § F5.
  protocols: [
    { name: "Substrate deep-link", schemes: ["substrate"], role: "Editor" },
  ],

  // Every new signed build gets a CFBundleVersion strictly greater
  // than the last (Apple's monotonically-increasing build-string
  // requirement, per review 2026-09-28 § F10). Epoch seconds keeps it
  // unique across every rebuild without a manual bump.
  // CFBundleShortVersionString stays at 1.1.0 (product-visible
  // version); only the internal build number ticks.
  buildVersion: String(Math.floor(Date.now() / 1000)),

  mac: {
    category: "public.app-category.developer-tools",
    // F10 (review 2026-09-28): the app shipped Electron's default icon. Built from the canonical
    // mascot by scripts/make_icon.py; committed so a build does not need Pillow.
    icon: "build/icon.icns",
    target: [
      { target: "dmg", arch: ["arm64"] },
    ],
    // Apple's seven-bullet notarization requirements: hardened runtime
    // on, entitlements plist attached, secure timestamp (default), no
    // get-task-allow (enforced by the entitlements file itself).
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: "build/entitlements.mac.plist",
    entitlementsInherit: "build/entitlements.mac.plist",
    // Team-name form. electron-builder strips the "Developer ID
    // Application: " prefix itself; passing the full common name
    // errors out (Sprint 088 trip-up).
    identity: "Green Rose Systems, LLC (ZVL8XB9XGU)",
    notarize: true,
    // Sprint 098: the build records the commits it was built from, in Info.plist, BEFORE
    // signing (a change to a signed bundle breaks its seal, Apple TN2206). scripts/release.sh
    // sets these; a build made outside it says "unrecorded".
    extendInfo: {
      SubstrateUICommit: process.env.SUBSTRATE_UI_COMMIT || "unrecorded",
      SubstrateKernelVersion: process.env.SUBSTRATE_KERNEL_VERSION || "unrecorded",
    },
  },

  dmg: {
    title: "${productName} ${version}",
    iconSize: 96,
    window: { width: 540, height: 380 },
    contents: [
      { x: 140, y: 200, type: "file" },
      { x: 400, y: 200, type: "link", path: "/Applications" },
    ],
  },
};
