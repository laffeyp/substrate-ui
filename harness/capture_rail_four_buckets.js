// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/* Sprint 034b observation harness: four-bucket rail.
   Asserts the extracted rail module renders four bucket headings (live
   sessions, recent records, bundles, records) and emits RECORDS_LOADED once
   per bucket per refresh with the v0.7 optional `bucket` payload set. */
"use strict";
const { chromium } = require("playwright");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const fails = [];
const pageErrors = [];
const ok = (m) => console.log(`  ok  ${m}`);
const fail = (m) => { console.error(`  FAIL  ${m}`); fails.push(m); };

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e.message)));
  await page.goto(BASE);
  await page.waitForSelector("#rail .rail-group", { timeout: 5000 });
  await page.waitForFunction(
    () => ((window).__signals || []).filter((s) => s.name === "RECORDS_LOADED" && s.payload?.bucket).length >= 4,
    { timeout: 5000 },
  );
  ok("rail mounts; four bucket RECORDS_LOADED emits landed");

  const headings = await page.$$eval("#rail .rail-group", (nodes) =>
    nodes.map((n) => (n.textContent || "").trim().toLowerCase()),
  );
  const wanted = ["live sessions", "recent records", "bundles", "records"];
  for (const w of wanted) {
    if (headings.some((h) => h.startsWith(w))) ok(`heading present: ${w}`);
    else fail(`heading missing: ${w} (got: ${JSON.stringify(headings)})`);
  }

  const orderIdxs = wanted.map((w) => headings.findIndex((h) => h.startsWith(w)));
  const inOrder = orderIdxs.every((v, i, arr) => i === 0 || v > arr[i - 1]);
  if (inOrder) ok("bucket order preserved: sessions → recent → bundles → records");
  else fail(`bucket order wrong: ${JSON.stringify(orderIdxs)}`);

  const emits = await page.evaluate(() => ((window).__signals || [])
    .filter((s) => s.name === "RECORDS_LOADED" && s.payload?.bucket)
    .map((s) => ({ bucket: s.payload.bucket, count: s.payload.count })));
  const bucketsSeen = new Set(emits.map((e) => e.bucket));
  for (const w of ["sessions", "recent", "bundles", "records"]) {
    if (bucketsSeen.has(w)) ok(`RECORDS_LOADED{bucket:${w}} fired`);
    else fail(`RECORDS_LOADED bucket ${w} missing; got ${JSON.stringify([...bucketsSeen])}`);
  }
  for (const e of emits) {
    if (typeof e.count !== "number" || e.count < 0)
      fail(`RECORDS_LOADED{bucket:${e.bucket}}.count invalid: ${e.count}`);
  }
  ok(`all four counts are non-negative integers`);

  // The bundles bucket must show ≥1 entry (034a's /api/bundles ships ≥2 defaults).
  const bundleCount = emits.find((e) => e.bucket === "bundles")?.count ?? 0;
  if (bundleCount >= 1) ok(`bundles bucket has ≥1 entry (${bundleCount})`);
  else fail(`bundles bucket empty; expected ≥1 (got ${bundleCount})`);

  // Records bucket count should equal /api/records?exclude_sessions=true's demo count.
  const demoCount = emits.find((e) => e.bucket === "records")?.count ?? 0;
  const excl = await page.evaluate(async () =>
    (await fetch("/api/records?exclude_sessions=true").then((r) => r.json())).filter((r) => r.source !== "run").length,
  );
  if (demoCount === excl) ok(`records bucket count matches non-run subset of exclude_sessions=true (${demoCount})`);
  else fail(`records bucket count ${demoCount} ≠ exclude_sessions demo count ${excl}`);

  if (pageErrors.length === 0) ok("no uncaught page errors");
  else fail(`page errors: ${JSON.stringify(pageErrors)}`);

  await browser.close();
  if (fails.length) {
    console.error(`\nFAIL — ${fails.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nSprint 034b four-bucket rail observation contract PASS.");
})();
