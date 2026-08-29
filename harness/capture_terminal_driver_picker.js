/* Sprint 035t observation harness: terminal-header driver picker.
   Asserts the picker mounts, populates from /api/models, changes fire
   DRIVER_PATCHED when a session is active, and changes queue when no
   session is open yet.

   Complements sprint 035s's /model slash — one control, two entry
   points, same wire.

   Run: node harness/capture_terminal_driver_picker.js (server on :8765).
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

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e.message)));
  await page.goto(BASE);
  await page.waitForSelector("#view-desktop.active", { timeout: 5000 });
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 });
  await page.waitForSelector("#terminal-input", { timeout: 2000 });

  // Picker mount + populate.
  await page.waitForSelector("#terminal-driver", { timeout: 2000 });
  await page.waitForFunction(
    () => document.getElementById("terminal-driver").options.length >= 3,
    { timeout: 5000 },
  );
  const meta = await page.evaluate(() => {
    const sel = document.getElementById("terminal-driver");
    return {
      optCount: sel.options.length,
      values: Array.from(sel.options).map((o) => o.value),
      currentValue: sel.value,
    };
  });
  if (meta.optCount >= 3) ok(`picker populated: ${meta.optCount} options`);
  else fail(`picker under-populated: ${meta.optCount}`);
  if (meta.values.includes("deterministic")) ok("deterministic is a picker option");
  else fail(`deterministic missing from picker: ${JSON.stringify(meta.values)}`);
  if (meta.values.includes("kimi-k2.6:cloud")) ok("kimi-k2.6:cloud is a picker option");
  else fail("kimi-k2.6:cloud missing from picker");

  // Confirm the initial value. mount passes driverDefault="deterministic";
  // populate leaves it in place (since "deterministic" is in the option
  // list). A change to a NON-current value is what tests the queue path.
  if (meta.currentValue === "deterministic") ok(`initial select value is 'deterministic'`);
  else fail(`initial value unexpected: ${meta.currentValue}`);

  // Change with no session active — pick kimi (different from current).
  // Should queue, not PATCH.
  await page.selectOption("#terminal-driver", "kimi-k2.6:cloud");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("queued for next session"),
    { timeout: 3000 },
  );
  const noSessionSignals = await page.evaluate(() =>
    ((window).__signals || []).filter((s) => s.name === "DRIVER_PATCHED").length,
  );
  if (noSessionSignals === 0) ok("change with no session did not fire DRIVER_PATCHED");
  else fail(`change with no session fired DRIVER_PATCHED (count=${noSessionSignals})`);

  // Revert to deterministic so the session opens with the safe stub driver.
  await page.selectOption("#terminal-driver", "deterministic");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "")
      .split("queued for next session").length >= 3,
    { timeout: 3000 },
  );
  ok("second change also queued (still no session)");

  // Open a session, then change the picker — should PATCH + emit.
  await typeAndEnter(page, "hello");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_STARTED"),
    { timeout: 10000 },
  );
  ok("session opened for PATCH test");

  await page.selectOption("#terminal-driver", "kimi-k2.6:cloud");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_PATCHED" && s.payload?.driver === "kimi-k2.6:cloud"),
    { timeout: 5000 },
  );
  const dp = await page.evaluate(() =>
    ((window).__signals || []).filter((s) => s.name === "DRIVER_PATCHED").slice(-1)[0],
  );
  if (dp?.payload?.driver === "kimi-k2.6:cloud" && dp?.payload?.prior_driver === "deterministic")
    ok(`DRIVER_PATCHED{driver=kimi-k2.6:cloud, prior_driver=deterministic}`);
  else fail(`DRIVER_PATCHED shape wrong: ${JSON.stringify(dp)}`);

  const promptText = await page.evaluate(() => document.getElementById("terminal-prompt")?.textContent);
  if (promptText && promptText.includes("kimi-k2.6:cloud")) ok(`prompt shows current driver (${promptText})`);
  else fail(`prompt did not refresh: ${promptText}`);

  // Change back — fires another DRIVER_PATCHED.
  await page.selectOption("#terminal-driver", "deterministic");
  await page.waitForFunction(
    () => ((window).__signals || []).filter((s) => s.name === "DRIVER_PATCHED" && s.payload?.driver === "deterministic").length >= 1,
    { timeout: 5000 },
  );
  const dp2 = await page.evaluate(() =>
    ((window).__signals || []).filter((s) => s.name === "DRIVER_PATCHED").slice(-1)[0],
  );
  if (dp2?.payload?.driver === "deterministic" && dp2?.payload?.prior_driver === "kimi-k2.6:cloud")
    ok("second DRIVER_PATCHED swap direction correct");
  else fail(`second DRIVER_PATCHED wrong: ${JSON.stringify(dp2)}`);

  await typeAndEnter(page, "/exit");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_ENDED"),
    { timeout: 5000 },
  );
  ok("/exit ends the session cleanly");

  if (pageErrors.length === 0) ok("no uncaught page errors");
  else fail(`page errors: ${JSON.stringify(pageErrors)}`);

  await browser.close();
  if (fails.length) {
    console.error(`\nFAIL — ${fails.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nSprint 035t driver-picker observation contract PASS.");
})();
