// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/* Sprint 035u observation harness: Ctrl+C interrupt.
   Asserts: Ctrl+C without a session prints a hint; Ctrl+C with an
   idle session prints "no turn in flight"; Ctrl+C with a selection
   in the input does NOT interrupt (browser copy path preserved);
   Ctrl+C with no selection AND a session posts /interrupt and prints
   the outcome per piece B 217d's response shape.

   Run: node harness/capture_terminal_interrupt.js (server on :8765).
*/
"use strict";
const { chromium } = require("playwright");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const fails = [];
const pageErrors = [];
const ok = (m) => console.log(`  ok  ${m}`);
const fail = (m) => { console.error(`  FAIL  ${m}`); fails.push(m); };

const typeAndEnter = async (page, text) => {
  await page.focus("#terminal-input");
  await page.type("#terminal-input", text);
  await page.keyboard.press("Enter");
};

const ctrlC = async (page) => {
  await page.focus("#terminal-input");
  await page.keyboard.down("Control");
  await page.keyboard.press("c");
  await page.keyboard.up("Control");
};

const bodyText = (page) => page.evaluate(() => document.getElementById("terminal-body")?.textContent || "");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e.message)));
  await page.goto(BASE + "?view=desktop");
  await page.waitForSelector("#view-desktop.active", { timeout: 5000 });
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 });
  await page.waitForSelector("#terminal-input", { timeout: 2000 });

  await ctrlC(page);
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("no session in flight"),
    { timeout: 3000 },
  );
  ok("Ctrl+C with no session prints hint");

  await typeAndEnter(page, "hello");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "PARK_LANDED"),
    { timeout: 15000 },
  );
  ok("session opened + parked (idle)");

  await ctrlC(page);
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("no turn in flight"),
    { timeout: 5000 },
  );
  ok("Ctrl+C on idle session: 'no turn in flight'");

  await page.focus("#terminal-input");
  await page.type("#terminal-input", "some text to copy");
  await page.evaluate(() => {
    const inp = document.getElementById("terminal-input");
    inp.setSelectionRange(0, inp.value.length);
  });
  const bodyBefore = await bodyText(page);
  // Ctrl+C with a selection must NOT fire an interrupt POST. Race the request
  // against a short timeout; a firing request is the failure, not the timeout.
  const interruptFired = page
    .waitForRequest((req) => /\/api\/session\/[^/]+\/interrupt$/.test(req.url()), { timeout: 500 })
    .then(() => true)
    .catch(() => false);
  await ctrlC(page);
  const didFire = await interruptFired;
  if (didFire) fail("Ctrl+C with selection issued a POST /interrupt (must not)");
  const bodyAfter = await bodyText(page);
  const beforeCount = (bodyBefore.match(/interrupt/g) || []).length;
  const afterCount = (bodyAfter.match(/interrupt/g) || []).length;
  const beforeNoTurn = (bodyBefore.match(/no turn in flight/g) || []).length;
  const afterNoTurn = (bodyAfter.match(/no turn in flight/g) || []).length;
  if (afterCount === beforeCount && afterNoTurn === beforeNoTurn) ok(`Ctrl+C with selection did not fire interrupt (stable: interrupt=${beforeCount}, no-turn=${beforeNoTurn})`);
  else fail(`Ctrl+C with selection wrongly fired: interrupt ${beforeCount}→${afterCount}, no-turn ${beforeNoTurn}→${afterNoTurn}`);
  await page.evaluate(() => { document.getElementById("terminal-input").value = ""; });

  await ctrlC(page);
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").match(/no turn in flight/g)?.length >= 2,
    { timeout: 5000 },
  );
  ok("Ctrl+C with no selection fired interrupt path (second no-turn line landed)");

  await typeAndEnter(page, "/exit");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_ENDED"),
    { timeout: 5000 },
  );
  ok("/exit ends the session");

  if (pageErrors.length === 0) ok("no uncaught page errors");
  else fail(`page errors: ${JSON.stringify(pageErrors)}`);

  await browser.close();
  if (fails.length) {
    console.error(`\nFAIL — ${fails.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nSprint 035u Ctrl+C interrupt observation contract PASS.");
})();
