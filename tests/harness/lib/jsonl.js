// tests/harness/lib/jsonl.js — one place for reading the harness JSONL trace
// and waiting for a specific emit. Every harness delegates to this file.

"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function harnessJsonlPath() {
  return path.join(
    os.homedir(), "Library", "Application Support", "substrate-ui",
    "harness", "last.jsonl",
  );
}

function resetJsonl() {
  const p = harnessJsonlPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, "");
}

function readJsonl() {
  const p = harnessJsonlPath();
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, "utf8")
    .split("\n").filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

// Poll the JSONL until a signal with the given kind appears, or timeout.
// Returns the matched signal or throws.
async function waitForEmit(kind, { timeoutMs = 5000, pollMs = 50 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = readJsonl().find((s) => s.kind === kind);
    if (found) return found;
    await new Promise((r) => setTimeout(r, pollMs));
  }
  throw new Error(`waitForEmit(${kind}) timed out after ${timeoutMs}ms`);
}

module.exports = { harnessJsonlPath, resetJsonl, readJsonl, waitForEmit };
