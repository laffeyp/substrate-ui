// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Perceptual-track capture: the console on the live tool-use-chain agent run, in REAL Chrome.
// Repo-scoped Playwright (channel:'chrome'), per ADDENDUMS.md Addendum A5 — not a /tmp install.
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://127.0.0.1:8765";
const RECORD = process.env.RECORD || "";
const OUT = process.env.OUT || "screenshots/toolchain-console.png";

(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/?record=${encodeURIComponent(RECORD)}`, { waitUntil: "networkidle" });
  // give the graph + stream projections a beat to render off the record
  await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT });
  // read a couple of structural anchors so the capture is not blind
  const verdict = await page.locator(".verdict, [class*=verdict]").first().textContent().catch(() => "");
  const streamRows = await page.locator("#stream .ev, #stream [class*=ev], .stream-row").count().catch(() => 0);
  console.log(JSON.stringify({ record: RECORD, out: OUT, verdict: (verdict || "").trim().slice(0, 80), streamRows }));
  await browser.close();
})();
