// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The commits a packaged build records in Info.plist (electron-builder.config.js extendInfo), as
// APP_BOOTED reports them (vocabulary v0.8, sprint 354). A kernel that fetch-python-runtime.sh built
// from uncommitted changes is marked not releasable; its commit reads "<sha>+dirty". The UI commit
// already carries its mark from the build. A missing key reads "unrecorded".
"use strict";

function plistString(plist, key) {
  const m = plist.match(new RegExp("<key>" + key + "</key>\\s*<string>([^<]*)</string>"));
  return m ? m[1] : "unrecorded";
}

function commitsFromPlist(plist) {
  const kernel = plistString(plist, "SubstrateKernelCommit");
  const kernelDirty = kernel !== "unrecorded" && plistString(plist, "SubstrateKernelReleasable") === "false";
  return { app_commit: plistString(plist, "SubstrateUICommit"), kernel_commit: kernel + (kernelDirty ? "+dirty" : "") };
}

module.exports = { commitsFromPlist };
