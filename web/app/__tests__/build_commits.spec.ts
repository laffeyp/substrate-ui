// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The commits a packaged build reports on APP_BOOTED (electron/build_commits.js, sprint 354), read
// from Info.plist fixtures: a kernel built from committed source, one built from uncommitted changes
// (fetch-python-runtime.sh marks it not releasable), and a plist without the keys.
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { createRequire } from "node:module";

const { commitsFromPlist } = createRequire(__filename)("../../../electron/build_commits.js") as {
  commitsFromPlist: (plist: string) => { app_commit: string; kernel_commit: string };
};

const plist = (releasable: string) => `<dict>
\t<key>SubstrateUICommit</key>
\t<string>0dc1040aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa+dirty</string>
\t<key>SubstrateKernelCommit</key>
\t<string>5f96b0a7b4b1bbbbbbbbbbbbbbbbbbbbbbbbbbbb</string>
\t<key>SubstrateKernelReleasable</key>
\t<string>${releasable}</string>
</dict>`;

test("a kernel built from committed source reads as its commit", () => {
  assert.deepStrictEqual(commitsFromPlist(plist("true")), {
    app_commit: "0dc1040aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa+dirty",
    kernel_commit: "5f96b0a7b4b1bbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  });
});

test("a kernel built from uncommitted changes reads as its commit +dirty", () => {
  assert.strictEqual(commitsFromPlist(plist("false")).kernel_commit, "5f96b0a7b4b1bbbbbbbbbbbbbbbbbbbbbbbbbbbb+dirty");
});

test("a plist without the keys reads unrecorded, never unrecorded+dirty", () => {
  assert.deepStrictEqual(commitsFromPlist("<dict><key>SubstrateKernelReleasable</key><string>false</string></dict>"), {
    app_commit: "unrecorded",
    kernel_commit: "unrecorded",
  });
});

