// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/* Sprint 036b observation harness — desktop-view bundle picker.
   Mounts alongside the driver picker; reads GET /api/bundles for options;
   binds to the current session via substrate:session-changed; on flip
   fires PATCH /api/session/<id> {bundle} and emits BUNDLE_ATTACHED.

   Records the 032b ruling as a hard invariant: NO TranscriptCompacted
   envelope on the record after a mid-session bundle swap. */
"use strict";
const { chromium } = require("playwright");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const fails = [];
const pageErrors = [];
const ok = (m) => console.log(`  ok  ${m}`);
const fail = (m) => { console.error(`  FAIL  ${m}`); fails.push(m); };

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e.message)));
  await page.goto(BASE + "?view=desktop");
  await page.waitForSelector("#view-desktop.active", { timeout: 5000 });

  await page.waitForSelector("#bundle-picker-select", { timeout: 3000 });
  ok("bundle picker mounted in desktop header");

  await page.waitForFunction(
    () => (document.getElementById("bundle-picker-select")?.options.length || 0) >= 2,
    { timeout: 5000 },
  );
  const optionCount = await page.$eval("#bundle-picker-select", (el) => el.options.length);
  ok(`bundle picker populated with ${optionCount} option(s) — 1 (none) + shipped bundles`);

  const first = await page.$eval("#bundle-picker-select", (el) => el.options[0].value);
  if (first === "") ok(`first option is (none) sentinel: "${first}"`);
  else fail(`first option must be (none) sentinel, got: "${first}"`);

  // Open a session via terminal so the picker has a session to bind to.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 });
  await page.waitForSelector("#terminal-input", { timeout: 2000 });
  await page.focus("#terminal-input");
  await page.type("#terminal-input", "hello");
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_STARTED"),
    { timeout: 10000 },
  );
  const sessionId = await page.evaluate(() => {
    const last = ((window).__signals || [])
      .filter((s) => s.name === "DRIVER_SESSION_STARTED")
      .slice(-1)[0];
    return last?.payload?.session_id || null;
  });
  if (!sessionId) { fail("session_id not resolvable"); await browser.close(); process.exit(1); }

  // Back to desktop; wait for bundle picker to bind.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "desktop", { timeout: 2000 });
  await page.waitForFunction(
    (sid) => (document.getElementById("bundle-picker-status")?.textContent || "").includes(sid.slice(0, 12)),
    sessionId,
    { timeout: 3000 },
  );
  ok(`bundle picker bound to session ${sessionId.slice(0, 12)}…`);

  const priorBundle = await page.$eval("#bundle-picker-select", (el) => el.value);
  const nextBundle = await page.evaluate(() => {
    const sel = document.getElementById("bundle-picker-select");
    return Array.from(sel.options).map((o) => o.value).find((v) => v !== sel.value && v !== "");
  });
  if (!nextBundle) { fail("no alternate bundle to flip to"); await browser.close(); process.exit(1); }

  const beforeCount = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "BUNDLE_ATTACHED").length,
  );
  await page.selectOption("#bundle-picker-select", nextBundle);
  await page.waitForFunction(
    (b) => ((window).__signals || []).filter((s) => s.name === "BUNDLE_ATTACHED").length > b,
    beforeCount,
    { timeout: 5000 },
  );
  const attached = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "BUNDLE_ATTACHED").slice(-1)[0],
  );
  const priorForEmit = priorBundle === "" ? null : priorBundle;
  if (attached?.payload?.bundle === nextBundle
      && attached?.payload?.session_id === sessionId
      && attached?.payload?.prior_bundle === priorForEmit) {
    ok(`BUNDLE_ATTACHED{bundle=${nextBundle}, prior_bundle=${JSON.stringify(priorForEmit)}}`);
  } else {
    fail(`BUNDLE_ATTACHED wrong: ${JSON.stringify(attached?.payload)}`);
  }

  // Manifest slice on disk carries the new bundle.
  const manifest = await page.evaluate(
    async (sid) => await fetch(`/api/session/${sid}`).then((r) => r.json()),
    sessionId,
  );
  if (manifest?.bundle === nextBundle) ok(`manifest bundle = ${nextBundle}`);
  else fail(`manifest bundle mismatch: expected ${nextBundle}, got ${JSON.stringify(manifest?.bundle)}`);

  const statusAfter = await page.$eval("#bundle-picker-status", (el) => (el.textContent || "").trim());
  if (statusAfter.includes(`bundle → ${nextBundle}`)) ok(`status reflects flip: "${statusAfter}"`);
  else fail(`status did not update: "${statusAfter}"`);

  // 032b ruling: NO TranscriptCompacted{reason:"bundle_changed"} envelope on
  // the record after a mid-session bundle swap. Verify via a small delay for
  // any pending SSE, then read the record.
  await page.waitForFunction(() => true, { timeout: 300 }).catch(() => {});
  const record = await page.evaluate(
    async (sid) => await fetch(`/api/records/${sid}`).then((r) => r.json()),
    sessionId,
  );
  const compactionEvents = (record?.events || []).filter(
    (e) => e.kind === "TranscriptCompacted" && (e.payload || {}).reason === "bundle_changed",
  );
  if (compactionEvents.length === 0)
    ok("no TranscriptCompacted{reason:bundle_changed} on the record (032b ruling upheld)");
  else fail(`unexpected TranscriptCompacted{reason:bundle_changed}: ${compactionEvents.length} found`);

  // Clear the bundle by selecting the (none) sentinel — PATCH bundle:null.
  const clearBefore = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "BUNDLE_ATTACHED").length,
  );
  await page.selectOption("#bundle-picker-select", "");
  await page.waitForFunction(
    (b) => ((window).__signals || []).filter((s) => s.name === "BUNDLE_ATTACHED").length > b,
    clearBefore,
    { timeout: 3000 },
  );
  const cleared = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "BUNDLE_ATTACHED").slice(-1)[0],
  );
  if (cleared?.payload?.bundle === "" && cleared?.payload?.prior_bundle === nextBundle) {
    ok(`BUNDLE_ATTACHED{bundle:'', prior_bundle:${nextBundle}} on clear`);
  } else {
    fail(`clear emit wrong: ${JSON.stringify(cleared?.payload)}`);
  }
  const clearedManifest = await page.evaluate(
    async (sid) => await fetch(`/api/session/${sid}`).then((r) => r.json()),
    sessionId,
  );
  if (clearedManifest?.bundle === null || clearedManifest?.bundle === undefined)
    ok("manifest bundle cleared to null");
  else fail(`manifest not cleared: ${JSON.stringify(clearedManifest?.bundle)}`);

  // End session cleanly.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 });
  await page.focus("#terminal-input");
  await page.type("#terminal-input", "/exit");
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_ENDED"),
    { timeout: 5000 },
  );

  if (pageErrors.length === 0) ok("no uncaught page errors");
  else fail(`page errors: ${JSON.stringify(pageErrors)}`);

  await browser.close();
  if (fails.length) {
    console.error(`\nFAIL — ${fails.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nSprint 036b desktop-view bundle picker observation contract PASS.");
})();
