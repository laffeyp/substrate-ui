// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/* Structural E2E for the ASSAY arm-matrix view (sprint 014) — track 1 of the observation contract
   (DOM assertions; capture_assay.js is track 2, the screenshot). Drives the real console in real
   Chrome against the real backend, selects an assay, and asserts the matrix is wired right: the
   ASSAYS rail group, the four arm rows, BOTH currencies present (the metric-splice can't recur), the
   compute column, the plain-language verdicts, and the explainer.

   Run (server up on :8765):  cd substrate-ui && node harness/e2e_assay.js  */
"use strict";
const { chromium } = require("playwright");
const { maybeCaptureTail } = require("./lib/capture-tail");
const assert = require("assert");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const ASSAY = process.env.ASSAY || "coding_cells";

(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await b.newPage();
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);

  const assays = await p.$$eval(".assay .nm", (a) => a.map((x) => x.textContent.trim()));
  assert(assays.includes(ASSAY), `ASSAYS rail group is missing '${ASSAY}': ${assays}`);

  await p.evaluate((name) => {
    const a = [...document.querySelectorAll(".assay")].find(
      (e) => e.querySelector(".nm") && e.querySelector(".nm").textContent.trim() === name);
    a.click();
  }, ASSAY);
  await p.waitForSelector(".am table", { timeout: 25000 });

  const arms = (await p.$$eval(".am tr[data-arm]", (trs) => trs.map((t) => t.getAttribute("data-arm")))).sort();
  assert.deepStrictEqual(arms, ["ensemble_no_correction", "full", "strong_ref", "weak_single"], `arm rows: ${arms}`);

  const html = await p.$eval(".am", (e) => e.innerHTML);
  for (const must of [
    "solved reliably", "solved sometimes", "flakiness", "compute", "gap vs the bar",
    "provenance", "How to read this", "worse", "can't tell yet",
  ]) {
    assert(html.includes(must), `matrix is missing the required surface: '${must}'`);
  }
  // metric-splice invariant: each arm shows BOTH a reliable score AND a per-attempt score (>= 4 each).
  assert((html.match(/%/g) || []).length >= 8, "both currencies must render per arm (too few % values)");

  console.log(`e2e_assay PASS — ASSAYS group + 4 arms + both currencies + compute + plain verdicts + explainer (assay '${ASSAY}')`);
  await maybeCaptureTail(p, "assay");
  await b.close();
})();
