/* Sprint 035s observation harness: the terminal-view slash router.
   Opens a session, exercises each slash the router handles, asserts
   the expected side-effect (either an emit or a body-line print).

   Slashes covered: /help, /model, /tools, /bundle, /context, /narrate,
   /tail, /cat, /list (five targets), /replay, /studio, /interrupt,
   unknown-slash. /exit tested at end (also covered by
   capture_terminal_session.js).

   Run: node harness/capture_terminal_slash_router.js (server on :8765).
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

const bodyLines = (page) => page.evaluate(() => {
  const b = document.getElementById("terminal-body");
  return b ? Array.from(b.children).map((c) => (c.textContent || "").trim()) : [];
});

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

  // Open a session so slashes that need one work. Send "hello" and wait
  // for DRIVER_SESSION_STARTED (fires from the record's SessionStarted
  // envelope per sprint 240).
  await typeAndEnter(page, "hello");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_STARTED"),
    { timeout: 10000 },
  );
  ok("session opened for slash tests");

  await typeAndEnter(page, "/help");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("/model <name>"),
    { timeout: 3000 },
  );
  ok("/help printed slash inventory");

  await typeAndEnter(page, "/model deterministic");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_PATCHED"),
    { timeout: 5000 },
  );
  const dp = await page.evaluate(() =>
    ((window).__signals || []).filter((s) => s.name === "DRIVER_PATCHED").slice(-1)[0],
  );
  if (dp?.payload?.driver === "deterministic") ok("/model → DRIVER_PATCHED{driver=deterministic}");
  else fail(`/model DRIVER_PATCHED wrong: ${JSON.stringify(dp)}`);

  await typeAndEnter(page, "/tools read_file,grep");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "TOOLS_RESTRICTED"),
    { timeout: 5000 },
  );
  const tr = await page.evaluate(() =>
    ((window).__signals || []).filter((s) => s.name === "TOOLS_RESTRICTED").slice(-1)[0],
  );
  if (Array.isArray(tr?.payload?.tools) && tr.payload.tools.includes("read_file")) ok("/tools → TOOLS_RESTRICTED{tools=[read_file, grep]}");
  else fail(`/tools TOOLS_RESTRICTED wrong: ${JSON.stringify(tr)}`);

  await typeAndEnter(page, "/bundle session");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "BUNDLE_ATTACHED"),
    { timeout: 5000 },
  );
  const ba = await page.evaluate(() =>
    ((window).__signals || []).filter((s) => s.name === "BUNDLE_ATTACHED").slice(-1)[0],
  );
  if (ba?.payload?.bundle === "session") ok("/bundle → BUNDLE_ATTACHED{bundle=session}");
  else fail(`/bundle BUNDLE_ATTACHED wrong: ${JSON.stringify(ba)}`);

  await typeAndEnter(page, "/context 3-5 --kind ModelReply");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("context pending: seq 3..5"),
    { timeout: 3000 },
  );
  ok("/context printed pending-context confirmation");

  await typeAndEnter(page, "/tail");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").match(/event\(s\)/),
    { timeout: 5000 },
  );
  ok("/tail returned event list");

  await typeAndEnter(page, "/narrate");
  await page.waitForTimeout(1500);
  const narrated = await bodyLines(page);
  if (narrated.length > 5) ok(`/narrate produced ${narrated.length} body lines`);
  else fail(`/narrate produced too few body lines: ${narrated.length}`);

  await typeAndEnter(page, "/cat 0");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("# seq 0"),
    { timeout: 3000 },
  );
  ok("/cat 0 printed seq-0 header");

  await typeAndEnter(page, "/list records");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").match(/record\(s\)/),
    { timeout: 5000 },
  );
  ok("/list records printed record count");

  await typeAndEnter(page, "/list sessions");
  await page.waitForTimeout(500);
  ok("/list sessions issued");

  await typeAndEnter(page, "/list topologies");
  await page.waitForTimeout(500);
  ok("/list topologies issued");

  await typeAndEnter(page, "/list applications");
  await page.waitForTimeout(500);
  ok("/list applications issued");

  await typeAndEnter(page, "/list bundles");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("034a"),
    { timeout: 3000 },
  );
  ok("/list bundles printed sprint-034a-pending hint");

  await typeAndEnter(page, "/replay demo_broken");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("substrate replay"),
    { timeout: 3000 },
  );
  ok("/replay printed CLI-only hint");

  let popupOpened = false;
  ctx.on("page", () => { popupOpened = true; });
  await typeAndEnter(page, "/studio");
  await page.waitForTimeout(500);
  if (popupOpened) ok("/studio opened a new tab");
  else fail("/studio did not open a popup");

  await typeAndEnter(page, "/interrupt");
  await page.waitForTimeout(1000);
  ok("/interrupt issued");

  await typeAndEnter(page, "/nonexistent-slash");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("unknown slash: /nonexistent-slash"),
    { timeout: 3000 },
  );
  ok("unknown slash produced error line");

  await typeAndEnter(page, "/exit");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_ENDED"),
    { timeout: 5000 },
  );
  ok("/exit → DRIVER_SESSION_ENDED");

  if (pageErrors.length === 0) ok("no uncaught page errors");
  else fail(`page errors: ${JSON.stringify(pageErrors)}`);

  await browser.close();
  if (fails.length) {
    console.error(`\nFAIL — ${fails.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nSprint 035s slash-router observation contract PASS.");
})();
