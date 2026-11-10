// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The design sheet's frames as PNGs (sprint 403). Each editor card's Track 2 reads its window
// screenshot beside the frame it answers to; this writes those frames from the sheet of record.
//
//   npx tsx harness/design/render_frames.ts 24a 24h 16c
//
// writes runs/design/sheet-v11/<id>.png, one per frame card, at device scale 1 so a frame keeps the
// size it is drawn at (1282 px wide for a window frame) and stays small enough to view (Addendum A6).

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const REPO_ROOT = join(__dirname, "..", "..");
const SHEET = join(REPO_ROOT, "..", "design", "received", "handoff 5", "sheets", "Substrate Shell Directions v11.dc.html");
const OUT = join(REPO_ROOT, "runs", "design", "sheet-v11");

async function main(ids: string[]): Promise<number> {
  if (!ids.length) {
    console.error("usage: npx tsx harness/design/render_frames.ts <frame id>…  (e.g. 24a 24h 16c)");
    return 1;
  }
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome" });
  let failed = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 2200, height: 1400 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(SHEET).href, { waitUntil: "load" });
    // The sheet draws its frames from support.js after load; wait for the cards, not a fixed time.
    await page.waitForFunction(() => document.querySelectorAll(".dv-opt .dv-card").length > 0, undefined, { timeout: 30_000 });
    await page.evaluate(() => document.fonts.ready);
    for (const id of ids) {
      const card = page.locator(`[id="${id}"] .dv-card`).first();
      if (!(await card.count())) {
        console.error(`FAIL — the sheet has no frame ${id}`);
        failed++;
        continue;
      }
      const box = await card.boundingBox();
      if (!box || box.width < 1 || box.height < 1) {
        console.error(`FAIL — frame ${id} draws nothing`);
        failed++;
        continue;
      }
      const file = join(OUT, `${id}.png`);
      await card.screenshot({ path: file });
      console.log(`${id} ${Math.round(box.width)}x${Math.round(box.height)} ${file}`);
    }
  } finally {
    await browser.close();
  }
  return failed ? 1 : 0;
}

main(process.argv.slice(2)).then((code) => process.exit(code), (err: unknown) => {
  console.error(err);
  process.exit(1);
});
