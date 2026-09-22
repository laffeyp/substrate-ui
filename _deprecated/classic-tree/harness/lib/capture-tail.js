/* Optional signal-capture tail for the standing e2e harnesses (Sprint 031).
   Reads window.__signals and writes it to captures/e2e-<name>.jsonl when CAPTURE_SIGNALS=1.
   With the env var unset, returns immediately. Never throws — a capture failure logs and moves on;
   the e2e's DOM pass/fail is orthogonal to the signal fixture. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");

async function maybeCaptureTail(page, name) {
  if (process.env.CAPTURE_SIGNALS !== "1") return;
  try {
    const signals = await page.evaluate(() => (window.__signals || []));
    const outDir = path.join(__dirname, "..", "..", "captures");
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `e2e-${name}.jsonl`);
    const body = signals.map((s) => JSON.stringify(s)).join("\n") + (signals.length ? "\n" : "");
    fs.writeFileSync(outFile, body);
    console.log(`[capture-tail] wrote ${signals.length} signals to ${outFile}`);
  } catch (e) {
    console.error(`[capture-tail] non-fatal: ${(e && e.message) || e}`);
  }
}

module.exports = { maybeCaptureTail };
