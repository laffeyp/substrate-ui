/* Sprint 037b — session-flow perceptual capture.

   Four screenshots under substrate-ui/screenshots/37-*.png:
   - 37-terminal-view-empty.png       — terminal-view before any turn.
   - 37-terminal-view-mid-turn.png    — terminal-view after turn 1's park.
   - 37-desktop-view-four-columns.png — desktop-view head + rail + panes.
   - 37-desktop-view-mid-session.png  — desktop-view during an active
     session, showing the driver + bundle pickers bound.

   Cleans up its own session at the end so runs don't accumulate. */
"use strict";
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const SHOTS_DIR = path.join(__dirname, "..", "screenshots");

const shot = async (page, name) => {
  await page.screenshot({ path: path.join(SHOTS_DIR, name), fullPage: false });
};

(async () => {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => { throw e; });

  await page.goto(BASE + "?view=desktop");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "SESSION_INIT"),
    { timeout: 5000 },
  );
  await page.waitForSelector("#view-desktop.active", { timeout: 5000 });

  // Frame 1: terminal-view-empty.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 });
  await page.waitForSelector("#terminal-input", { timeout: 2000 });
  await shot(page, "37-terminal-view-empty.png");

  // Send turn 1 and wait for park.
  await page.focus("#terminal-input");
  await page.type("#terminal-input", "hello");
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "PARK_LANDED"),
    { timeout: 10000 },
  );

  // Frame 2: terminal-view-mid-turn — after the reply landed.
  await shot(page, "37-terminal-view-mid-turn.png");

  const sessionId = await page.evaluate(
    () =>
      ((window).__signals || [])
        .filter((s) => s.name === "DRIVER_SESSION_STARTED")
        .slice(-1)[0]?.payload?.session_id ?? null,
  );

  // Frame 3: desktop-view-mid-session — pickers show the bound session.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "desktop", { timeout: 2000 });
  await page.waitForFunction(
    (sid) => (document.getElementById("driver-picker-status")?.textContent || "").includes(sid.slice(0, 12)),
    sessionId,
    { timeout: 3000 },
  );
  await shot(page, "37-desktop-view-mid-session.png");

  // End session so the fourth frame captures the "no live session" desktop shape.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 });
  await page.waitForSelector("#terminal-input", { timeout: 2000 });
  const endedBefore = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "DRIVER_SESSION_ENDED").length,
  );
  await page.focus("#terminal-input");
  await page.type("#terminal-input", "/exit");
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    (before) => ((window).__signals || []).filter((s) => s.name === "DRIVER_SESSION_ENDED").length > before,
    endedBefore,
    { timeout: 5000 },
  );

  // Frame 4: desktop-view-four-columns — head + rail + panes (session ended).
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "desktop", { timeout: 2000 });
  await shot(page, "37-desktop-view-four-columns.png");

  console.log(`wrote 4 screenshots to ${SHOTS_DIR}`);
  await browser.close();
})().catch((e) => { console.error("CAPTURE ERROR", e); process.exit(1); });
