// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/* Sprint 036a observation harness — desktop-view driver picker.
   Opens the page (desktop view active), asserts the picker mounts, creates
   a session via the terminal-view path, waits for the picker to bind,
   flips the dropdown, asserts DRIVER_PATCHED fires with the correct
   prior_driver, and verifies the manifest slice on disk carries the new
   driver via GET /api/session/<id>. */
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
  // Sprint 041: session controls moved from the shared head to inside
  // #view-terminal. Flip to terminal before addressing the mount points.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 });
  await page.waitForSelector("#terminal-input", { timeout: 2000 });

  await page.waitForSelector("#driver-picker-select", { timeout: 3000 });
  ok("picker mounted in desktop header");

  await page.waitForFunction(
    () => (document.getElementById("driver-picker-select")?.options.length || 0) >= 1,
    { timeout: 5000 },
  );
  const optionCount = await page.$eval("#driver-picker-select", (el) => el.options.length);
  ok(`picker populated with ${optionCount} model(s)`);

  // Initial bind depends on daemon state: an existing parked session yields
  // "session <sid>…"; a fresh daemon yields "no live session". Both are valid
  // preconditions — assert one or the other.
  const initialStatus = await page.$eval("#driver-picker-status", (el) => (el.textContent || "").trim());
  if (initialStatus.includes("no live session") || initialStatus.includes("session "))
    ok(`initial status well-formed: "${initialStatus}"`);
  else fail(`unexpected initial status: "${initialStatus}"`);

  // Open a session via the terminal view (proven path).
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
  if (!sessionId) { fail("session_id not resolvable from DRIVER_SESSION_STARTED"); await browser.close(); process.exit(1); }

  // Flip back to desktop; the substrate:session-changed event fired at start
  // with the new session_id in detail, so the picker rebinds to it.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "desktop", { timeout: 2000 });
  await page.waitForFunction(
    (sid) => (document.getElementById("driver-picker-status")?.textContent || "").includes(sid.slice(0, 12)),
    sessionId,
    { timeout: 3000 },
  );
  ok(`picker bound to newly-opened session ${sessionId.slice(0, 12)}…`);

  // Add ollama:llama3.2:1b as a synthetic option (may not be in /api/models on
  // this box) so we can flip to a distinct value.
  const priorDriver = await page.$eval("#driver-picker-select", (el) => el.value);
  await page.evaluate(() => {
    const sel = document.getElementById("driver-picker-select");
    const alt = Array.from(sel.options).map((o) => o.value).find((v) => v !== sel.value);
    if (alt) return;
    const opt = document.createElement("option");
    opt.value = "ollama:llama3.2:1b";
    opt.textContent = "ollama:llama3.2:1b";
    sel.appendChild(opt);
  });
  const nextDriver = await page.evaluate(() => {
    const sel = document.getElementById("driver-picker-select");
    return Array.from(sel.options).map((o) => o.value).find((v) => v !== sel.value);
  });
  if (!nextDriver) { fail("no alternate driver value to flip to"); await browser.close(); process.exit(1); }

  const beforeCount = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "DRIVER_PATCHED").length,
  );
  await page.selectOption("#driver-picker-select", nextDriver);
  await page.waitForFunction(
    (b) => ((window).__signals || []).filter((s) => s.name === "DRIVER_PATCHED").length > b,
    beforeCount,
    { timeout: 5000 },
  );
  const patched = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "DRIVER_PATCHED").slice(-1)[0],
  );
  if (patched?.payload?.driver === nextDriver && patched?.payload?.session_id === sessionId
      && patched?.payload?.prior_driver === priorDriver) {
    ok(`DRIVER_PATCHED{driver=${nextDriver}, prior_driver=${priorDriver}}`);
  } else {
    fail(`DRIVER_PATCHED wrong: ${JSON.stringify(patched?.payload)}`);
  }

  // Verify manifest state on disk via GET /api/session/<id>.
  const manifest = await page.evaluate(
    async (sid) => await fetch(`/api/session/${sid}`).then((r) => r.json()),
    sessionId,
  );
  if (manifest?.driver === nextDriver) ok(`manifest driver = ${nextDriver}`);
  else fail(`manifest driver mismatch: expected ${nextDriver}, got ${JSON.stringify(manifest?.driver)}`);

  const statusAfter = await page.$eval("#driver-picker-status", (el) => (el.textContent || "").trim());
  if (statusAfter.includes(`driver → ${nextDriver}`)) ok(`status reflects flip: "${statusAfter}"`);
  else fail(`status did not update: "${statusAfter}"`);

  // Clean end via terminal /exit.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 });
  await page.focus("#terminal-input");
  await page.type("#terminal-input", "/exit");
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_ENDED"),
    { timeout: 5000 },
  );

  // Desktop picker re-refreshes after the session ends. On a fresh daemon it
  // reports no-session; with older parked sessions on disk it rebinds to one
  // of them. Either way it no longer names the just-ended sid.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "desktop", { timeout: 2000 });
  await page.waitForFunction(
    (sid) => {
      const txt = document.getElementById("driver-picker-status")?.textContent || "";
      return !txt.includes(sid.slice(0, 12));
    },
    sessionId,
    { timeout: 3000 },
  );
  ok("picker no longer names the ended session");

  if (pageErrors.length === 0) ok("no uncaught page errors");
  else fail(`page errors: ${JSON.stringify(pageErrors)}`);

  await browser.close();
  if (fails.length) {
    console.error(`\nFAIL — ${fails.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nSprint 036a desktop-view driver picker observation contract PASS.");
})();
