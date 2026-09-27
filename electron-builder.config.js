// Sprint 088 — signed + notarized macOS .dmg configuration.
//
// Boundary: this config produces `dist-electron/*.dmg` (plus its
// stapled `.app` inside) and stops. Hosting the .dmg — S3, GitHub
// Releases, a domain — is a separate step handed off outside this
// repo. No `publish` field, no auto-updater feed URL, no upload
// hook. `npm run dist` ends when the file exists on local disk.
//
// Signing identity lives in the login keychain, installed via Xcode
// (Settings → Accounts → Manage Certificates → + → Developer ID
// Application). electron-builder looks it up by name via macOS
// `security find-identity`; no .p12 file, no keychain UI.
//
// Notarization runs headless via the App Store Connect API key at
// ~/.appstoreconnect/private_keys/AuthKey_<KEYID>.p8. Three env vars
// feed @electron/notarize: APPLE_API_KEY (path to .p8),
// APPLE_API_KEY_ID (10-char), APPLE_API_ISSUER (uuid). electron-
// builder invokes notarize automatically when `mac.notarize` is
// set and the identity resolves.

/** @type {import("electron-builder").Configuration} */
module.exports = {
  appId: "com.greenrosesystems.substrate",
  productName: "Substrate",
  copyright: "Copyright © 2026 Green Rose Systems, LLC",
  asar: true,
  // Python must open server.py as a real file on disk; the bundled
  // interpreter can't read from inside an asar archive. asarUnpack
  // pulls these two out to `Contents/Resources/app.asar.unpacked/`,
  // which is what electron/main.js references at spawn time.
  asarUnpack: [
    "server.py",
    "session_registry.py",
  ],

  // What goes into the .app bundle. `server.py` and `session_registry.py`
  // sit next to `electron/main.js` at repo root, so they land inside the
  // asar automatically. `web/dist/**` carries the built renderer. The
  // bundled Python runtime lives outside asar (see `extraResources`) so
  // its .dylibs are addressable at runtime paths.
  files: [
    "electron/**/*",
    "web/dist/**/*",
    "server.py",
    "session_registry.py",
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

  // The Python runtime + substrate venv gets fetched into `build/python/`
  // by `scripts/fetch-python-runtime.sh` before packaging and copied
  // into `Contents/Resources/python/` at pack time. electron/main.js
  // then spawns `Contents/Resources/python/bin/python3 server.py`
  // instead of `uv run python`.
  extraResources: [
    { from: "build/python", to: "python", filter: ["**/*"] },
  ],

  directories: {
    output: "dist-electron",
    buildResources: "build",
  },

  mac: {
    category: "public.app-category.developer-tools",
    // arm64 first (dev box is arm64); universal builds double the size
    // and require every native module to ship universal binaries.
    // Ship arm64 only for the first cut; add x64 in a follow-up once
    // an Intel test path exists.
    target: [
      { target: "dmg", arch: ["arm64"] },
    ],
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: "build/entitlements.mac.plist",
    entitlementsInherit: "build/entitlements.mac.plist",
    // Exact common name from `security find-identity -v -p codesigning`.
    // The private key binds through Xcode's cert installation; no .p12
    // on disk.
    identity: "Developer ID Application: Green Rose Systems, LLC (ZVL8XB9XGU)",
    notarize: {
      teamId: "ZVL8XB9XGU",
    },
  },

  dmg: {
    // A plain drag-to-Applications dmg. No background image, no
    // custom licensing agreement, no icon file — those are aesthetic
    // layers we can add later without changing the pipeline. Once
    // build/icon.icns exists (a 1024×1024 icon converted to .icns
    // via `iconutil`), add `icon: "build/icon.icns"` here and set
    // `mac.icon: "build/icon.icns"` above.
    title: "${productName} ${version}",
    iconSize: 96,
    window: { width: 540, height: 380 },
    contents: [
      { x: 140, y: 200, type: "file" },
      { x: 400, y: 200, type: "link", path: "/Applications" },
    ],
  },
};
