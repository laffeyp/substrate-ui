/* Sprint 035 observation harness — the terminal column as a real
   session driver. Flips to #view-terminal, opens a deterministic
   session via the first turn, sends two turns, asserts the four
   driver_session tags fire, verifies the record carries the substrate
   envelope kinds, ends with /exit, checks DRIVER_SESSION_ENDED lands.

   Two screenshots: 35-terminal-view-post-user-message.png,
   35-terminal-view-post-model-reply.png.

   Run: node harness/capture_terminal_session.js (server on :8765).
*/
"use strict";
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const OUT = path.join(__dirname, "..", "screenshots");
const fails = [];
const pageErrors = [];
const ok = (m) => console.log(`  ok  ${m}`);
const fail = (m) => { console.error(`  FAIL  ${m}`); fails.push(m); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e.message)));
  // Sprint 044: pin the driver via URL so this harness stays cost-neutral
  // regardless of what /api/models defaults to (locally it may resolve to
  // a paid cloud model). terminal.ts reads window.location.search.
  await page.goto(`${BASE}/?driver=deterministic`);
  await page.waitForSelector("#view-desktop.active", { timeout: 5000 });

  // Flip to the terminal view.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 });
  await page.waitForSelector("#terminal-input", { timeout: 2000 });
  ok("flipped to #view-terminal; terminal column mounted");

  // First turn — opens the session.
  await page.focus("#terminal-input");
  await page.keyboard.type("hello");
  await page.keyboard.press("Enter");
  // Wait for DRIVER_SESSION_STARTED to appear in the trace (the SessionStarted
  // envelope arrives via SSE after the daemon persists the record; deterministic
  // driver settles fast but give a generous ceiling).
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_STARTED"),
    { timeout: 10000 },
  );
  ok("DRIVER_SESSION_STARTED fired after first turn");

  const afterFirst = await page.evaluate(() => {
    const signals = (window).__signals || [];
    return {
      started: signals.filter((s) => s.name === "DRIVER_SESSION_STARTED").slice(-1)[0],
      injected: signals.filter((s) => s.name === "USER_MESSAGE_INJECTED"),
    };
  });
  if (afterFirst.started?.payload?.driver_name) ok(`DRIVER_SESSION_STARTED{driver_name=${afterFirst.started.payload.driver_name}}`);
  else fail(`DRIVER_SESSION_STARTED payload missing driver_name: ${JSON.stringify(afterFirst.started)}`);
  if (afterFirst.injected.length >= 1
      && typeof afterFirst.injected[0].payload.session_id === "string"
      && typeof afterFirst.injected[0].payload.turn_index === "number"
      && typeof afterFirst.injected[0].payload.text_length === "number") ok("USER_MESSAGE_INJECTED fired with schema-required fields");
  else fail(`USER_MESSAGE_INJECTED shape wrong: ${JSON.stringify(afterFirst.injected[0])}`);

  await page.screenshot({ path: path.join(OUT, "35-terminal-view-post-user-message.png"), fullPage: false });
  ok("screenshot 35-terminal-view-post-user-message.png written");

  // Wait for the model's reply to render (Park lands after each turn under
  // deterministic driver).
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "PARK_LANDED"),
    { timeout: 15000 },
  );
  ok("PARK_LANDED fired after first turn");

  await page.screenshot({ path: path.join(OUT, "35-terminal-view-post-model-reply.png"), fullPage: false });
  ok("screenshot 35-terminal-view-post-model-reply.png written");

  // Second turn — exercises the session's re-entry path.
  await page.focus("#terminal-input");
  await page.keyboard.type("again");
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => ((window).__signals || []).filter((s) => s.name === "USER_MESSAGE_INJECTED").length >= 2,
    { timeout: 10000 },
  );
  await page.waitForFunction(
    () => ((window).__signals || []).filter((s) => s.name === "PARK_LANDED").length >= 2,
    { timeout: 15000 },
  );
  ok("second turn: USER_MESSAGE_INJECTED + PARK_LANDED both landed");

  // /exit ends the session.
  await page.focus("#terminal-input");
  await page.keyboard.type("/exit");
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_ENDED"),
    { timeout: 5000 },
  );
  ok("DRIVER_SESSION_ENDED fired on /exit");

  const summary = await page.evaluate(() => {
    const signals = (window).__signals || [];
    const starts = signals.filter((s) => s.name === "DRIVER_SESSION_STARTED");
    const ends = signals.filter((s) => s.name === "DRIVER_SESSION_ENDED");
    const injects = signals.filter((s) => s.name === "USER_MESSAGE_INJECTED");
    const parks = signals.filter((s) => s.name === "PARK_LANDED");
    return {
      startedCount: starts.length,
      endedCount: ends.length,
      injectedCount: injects.length,
      parkedCount: parks.length,
      sameSession: starts[0]?.payload?.session_id === ends[0]?.payload?.session_id,
      endReason: ends[0]?.payload?.reason,
    };
  });
  if (summary.startedCount === 1 && summary.endedCount >= 1) ok(`session pair: 1 started, ${summary.endedCount} ended`);
  else fail(`session pair wrong: ${JSON.stringify(summary)}`);
  if (summary.injectedCount === 2 && summary.parkedCount === 2) ok(`turns: ${summary.injectedCount} injected, ${summary.parkedCount} parked`);
  else fail(`turn counts wrong: injected=${summary.injectedCount} parked=${summary.parkedCount}`);
  if (summary.sameSession) ok("session_id stable across start → end");
  else fail(`session_id drift across bookends: ${JSON.stringify(summary)}`);
  if (typeof summary.endReason === "string" && summary.endReason.length > 0) ok(`DRIVER_SESSION_ENDED{reason=${summary.endReason}}`);
  else fail(`DRIVER_SESSION_ENDED.reason missing: ${summary.endReason}`);

  if (pageErrors.length === 0) ok("no uncaught page errors");
  else fail(`page errors: ${JSON.stringify(pageErrors)}`);

  // Dump the full signal trace to a fixture the grader can consume.
  const fixturePath = path.join(__dirname, "..", "captures", "sprint-035", "terminal-session.jsonl");
  fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
  const signals = await page.evaluate(() => (window).__signals || []);
  fs.writeFileSync(fixturePath, signals.map((s) => JSON.stringify(s)).join("\n") + "\n");
  ok(`fixture written: ${path.relative(process.cwd(), fixturePath)}`);

  await browser.close();
  if (fails.length) {
    console.error(`\nFAIL — ${fails.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nSprint 035 observation contract PASS.");
})();
