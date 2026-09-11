// tests/harness/lib/launch.js — Electron launch + tear-down shared across
// every sprint harness.

"use strict";
const { _electron: electron } = require("playwright");
const path = require("node:path");

const REPO = path.resolve(__dirname, "..", "..", "..");

function substratePython() {
  return process.env.SUBSTRATE_UI_PYTHON
    || path.join(REPO, "..", "substrate", ".venv", "bin", "python");
}

async function launchApp(extraEnv = {}) {
  return electron.launch({
    args: ["."], cwd: REPO,
    env: {
      ...process.env,
      SUBSTRATE_HARNESS: "1",
      SUBSTRATE_UI_PYTHON: substratePython(),
      PYTHONUNBUFFERED: "1",
      ...extraEnv,
    },
  });
}

module.exports = { REPO, substratePython, launchApp };
