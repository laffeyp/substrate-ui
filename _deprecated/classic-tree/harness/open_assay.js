/* Open the console in a VISIBLE Chrome window (headed) and land on the assay arm matrix — so the
   human sees it live, not a screenshot. Stays open until the window is closed or the process killed.

   Run:  cd substrate-ui && node harness/open_assay.js        (server must be up on :8765)  */
"use strict";
const { chromium } = require("playwright");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const ASSAY = process.env.ASSAY || "coding_cells";

(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: false, args: ["--start-maximized"] });
  const ctx = await b.newContext({ viewport: null }); // real window size, not a fixed viewport
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200); // rail (records + assays) populated
  await p.evaluate((name) => {
    const a = [...document.querySelectorAll(".assay")].find(
      (e) => e.querySelector(".nm") && e.querySelector(".nm").textContent.trim() === name);
    if (a) a.click();
  }, ASSAY);
  await p.waitForSelector(".am table", { timeout: 25000 }).catch(() => {});
  console.log(`opened — '${ASSAY}' arm matrix is on screen. Close the window (or kill this process) to end.`);
  await new Promise(() => {}); // keep the browser open
})();
