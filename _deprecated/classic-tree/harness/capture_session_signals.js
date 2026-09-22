/* Sprint 037b — session-flow signal-trace capture.

   Drives the same session narrative as 037a's E2E (page load → view
   flip → turn 1 → view flip → turn 2 → /exit) but skips the mid-session
   driver PATCH — the fixture stays linear so `grade:session-signals`
   reads a byte-stable capture in CI.

   Dumps `window.__signals` to `captures/sprint-037/session.jsonl`;
   `grade:session-signals` runs `capture-grade.ts --kind session` against
   it and asserts `EXPECTED_ORDER_SESSION` + `checkDriverSessionBookends`.

   Skeptic checks land inline as assertions AND as trace shape the grader
   picks up: at least one DRIVER_SESSION_STARTED, at least one
   DRIVER_SESSION_ENDED, exactly matching session_ids. */
"use strict";
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const OUT_DIR = path.join(__dirname, "..", "captures", "sprint-037");
const OUT_FILE = path.join(OUT_DIR, "session.jsonl");

const waitSig = (p, name, timeout = 5000) =>
  p.waitForFunction(
    (n) => ((window).__signals || []).some((s) => s.name === n),
    name,
    { timeout },
  );

const waitSigCount = (p, name, min, timeout = 10000) =>
  p.waitForFunction(
    ({ n, m }) => ((window).__signals || []).filter((s) => s.name === n).length >= m,
    { n: name, m: min },
    { timeout },
  );

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => { throw e; });

  await page.goto(BASE + "?view=desktop");
  await waitSig(page, "SESSION_INIT");
  await page.waitForSelector("#view-desktop.active", { timeout: 5000 });
  // Wait for the initial auto-selected record's paint tags so
  // checkViewSwitched's desktop-render pairing has a subject_record
  // available on every subsequent flip-to-desktop.
  await waitSig(page, "GRAPH_RENDERED", 10000);
  await waitSig(page, "STREAM_RENDERED");
  await waitSig(page, "HEALTH_RENDERED");

  // Flip to terminal-view → VIEW_SWITCHED.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await waitSig(page, "VIEW_SWITCHED");
  await page.waitForSelector("#terminal-input", { timeout: 2000 });

  // Turn 1 → open session, DRIVER_SESSION_STARTED, USER_MESSAGE_INJECTED, PARK_LANDED.
  await page.focus("#terminal-input");
  await page.type("#terminal-input", "hello");
  await page.keyboard.press("Enter");
  await waitSig(page, "DRIVER_SESSION_STARTED", 10000);
  await waitSigCount(page, "USER_MESSAGE_INJECTED", 1);
  await waitSigCount(page, "PARK_LANDED", 1);

  // Flip back to desktop → second VIEW_SWITCHED.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await waitSigCount(page, "VIEW_SWITCHED", 2);

  // Flip to terminal for turn 2 → third VIEW_SWITCHED.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await waitSigCount(page, "VIEW_SWITCHED", 3);
  await page.waitForSelector("#terminal-input", { timeout: 2000 });

  // Turn 2 → USER_MESSAGE_INJECTED #2, PARK_LANDED #2.
  await page.focus("#terminal-input");
  await page.type("#terminal-input", "again");
  await page.keyboard.press("Enter");
  await waitSigCount(page, "USER_MESSAGE_INJECTED", 2);
  await waitSigCount(page, "PARK_LANDED", 2);

  // /exit → DRIVER_SESSION_ENDED (reason "user_end" per 037a fix).
  await page.focus("#terminal-input");
  await page.type("#terminal-input", "/exit");
  await page.keyboard.press("Enter");
  await waitSig(page, "DRIVER_SESSION_ENDED", 5000);

  // Fire the tab-unload SESSION_ENDED bookend so the grader's
  // checkSessionBookends invariant reads SESSION_ENDED as the final
  // envelope (035s pattern).
  await page.evaluate(() => window.dispatchEvent(new Event("beforeunload")));
  const signals = await page.evaluate(() => (window).__signals || []);
  fs.writeFileSync(OUT_FILE, signals.map((s) => JSON.stringify(s)).join("\n") + "\n");
  console.log(`wrote ${signals.length} signals to ${OUT_FILE}`);

  await browser.close();
})().catch((e) => { console.error("CAPTURE ERROR", e); process.exit(1); });
