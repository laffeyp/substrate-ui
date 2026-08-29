/* Sprint 035v observation harness: params drawer + /set slash. */
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
const paramsText = (page) => page.evaluate(() => document.getElementById("terminal-params")?.textContent);

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

  await page.waitForSelector("#terminal-params", { timeout: 2000 });
  const initial = await paramsText(page);
  if (initial === "think off · tokens ∞ · timeout 300s") ok(`params hint mounts with defaults: '${initial}'`);
  else fail(`params hint initial wrong: '${initial}'`);

  await typeAndEnter(page, "/set think on");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("queued for next session"),
    { timeout: 3000 },
  );
  const afterQueue = await paramsText(page);
  if (afterQueue === "think on · tokens ∞ · timeout 300s") ok(`params hint refreshed after queued /set: '${afterQueue}'`);
  else fail(`params hint didn't refresh after queue: '${afterQueue}'`);
  const noSessionEmits = await page.evaluate(() =>
    ((window).__signals || []).filter((s) => s.name === "DRIVER_PARAMS_PATCHED").length,
  );
  if (noSessionEmits === 0) ok("queued /set did not fire DRIVER_PARAMS_PATCHED");
  else fail(`queued /set fired DRIVER_PARAMS_PATCHED (count=${noSessionEmits})`);

  await typeAndEnter(page, "/set");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("params — think on"),
    { timeout: 3000 },
  );
  ok("/set (no args) printed current params");

  await typeAndEnter(page, "hello");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_STARTED"),
    { timeout: 10000 },
  );
  ok("session opened with queued params");
  const afterOpen = await paramsText(page);
  if (afterOpen === "think on · tokens ∞ · timeout 300s") ok(`hint holds queued params post-open: '${afterOpen}'`);
  else fail(`hint drifted post-open: '${afterOpen}'`);

  await typeAndEnter(page, "/set tokens 4096");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_PARAMS_PATCHED"),
    { timeout: 5000 },
  );
  const dpp = await page.evaluate(() =>
    ((window).__signals || []).filter((s) => s.name === "DRIVER_PARAMS_PATCHED").slice(-1)[0],
  );
  if (dpp?.payload?.params?.max_tokens === 4096 && dpp?.payload?.params?.think === true)
    ok(`DRIVER_PARAMS_PATCHED{params:{think:true, max_tokens:4096}}`);
  else fail(`DRIVER_PARAMS_PATCHED wrong: ${JSON.stringify(dpp)}`);
  const afterPatch = await paramsText(page);
  if (afterPatch === "think on · tokens 4096 · timeout 300s") ok(`hint refreshed post-PATCH: '${afterPatch}'`);
  else fail(`hint didn't refresh post-PATCH: '${afterPatch}'`);

  await typeAndEnter(page, "/set think yes");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("/set think on|off"),
    { timeout: 3000 },
  );
  ok("/set think with bad value rejected");

  await typeAndEnter(page, "/set tokens -5");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").match(/non-negative integer/),
    { timeout: 3000 },
  );
  ok("/set tokens with negative rejected");

  await typeAndEnter(page, "/set bogus 1");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("unknown key 'bogus'"),
    { timeout: 3000 },
  );
  ok("/set with unknown key rejected");

  await typeAndEnter(page, "/set think off");
  await page.waitForFunction(
    () => ((window).__signals || []).filter((s) => s.name === "DRIVER_PARAMS_PATCHED" && s.payload?.params?.think === false).length >= 1,
    { timeout: 5000 },
  );
  const dpp2 = await page.evaluate(() =>
    ((window).__signals || []).filter((s) => s.name === "DRIVER_PARAMS_PATCHED").slice(-1)[0],
  );
  if (dpp2?.payload?.params?.think === false && dpp2?.payload?.prior_params?.think === true)
    ok("second DRIVER_PARAMS_PATCHED reverses think");
  else fail(`second DRIVER_PARAMS_PATCHED wrong: ${JSON.stringify(dpp2)}`);
  const afterReverse = await paramsText(page);
  if (afterReverse === "think off · tokens 4096 · timeout 300s") ok(`hint reflects reverse: '${afterReverse}'`);
  else fail(`hint didn't reflect reverse: '${afterReverse}'`);

  await typeAndEnter(page, "/exit");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_ENDED"),
    { timeout: 5000 },
  );
  ok("/exit closes session");
  const afterExit = await paramsText(page);
  if (afterExit === "think off · tokens ∞ · timeout 300s") ok(`hint reset to defaults on session close: '${afterExit}'`);
  else fail(`hint didn't reset on close: '${afterExit}'`);

  if (pageErrors.length === 0) ok("no uncaught page errors");
  else fail(`page errors: ${JSON.stringify(pageErrors)}`);

  await browser.close();
  if (fails.length) {
    console.error(`\nFAIL — ${fails.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nSprint 035v params-drawer observation contract PASS.");
})();
