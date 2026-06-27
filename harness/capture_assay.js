/* Perceptual-signal capture for the ASSAY arm-matrix view (sprint 014) — the second of the two-track
   visual grading the observation contract requires. Drives the real console in real Chrome against the
   real backend, selects an assay from the rail, and screenshots the arm matrix so the agent Reads the
   PNG: both currencies legible, the margin-verdict colored, provenance pinned, on-vocabulary, clean.

   Run (server already up on :8765):  cd substrate-ui && node harness/capture_assay.js  */
"use strict";
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const OUT = path.join(__dirname, "..", "screenshots");
const ASSAY = process.env.ASSAY || "coding_cells";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await b.newPage({ viewport: { width: 1680, height: 1010 }, deviceScaleFactor: 2 });
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.waitForTimeout(900); // rail (records + assays) populated
  const clicked = await p.evaluate((name) => {
    const a = [...document.querySelectorAll(".assay")].find(
      (e) => e.querySelector(".nm") && e.querySelector(".nm").textContent.trim() === name);
    if (a) { a.click(); return true; }
    return false;
  }, ASSAY);
  if (!clicked) { console.error(`assay '${ASSAY}' not found in the rail`); await b.close(); process.exit(1); }
  await p.waitForSelector(".am table", { timeout: 25000 }); // the matrix rendered (first build_report ~8s)
  await p.waitForTimeout(400);
  const file = path.join(OUT, "40-assay-matrix.png");
  await p.screenshot({ path: file });
  // structural echo: read the DOM the harness saw, so the log carries the assertion too
  const rows = await p.$$eval(".am tr[data-arm]", (trs) => trs.map((t) => t.getAttribute("data-arm")));
  console.log(`  shot  40-assay-matrix.png  — assay '${ASSAY}', ${rows.length} arm rows: ${rows.join(", ")}`);
  await b.close();
})();
