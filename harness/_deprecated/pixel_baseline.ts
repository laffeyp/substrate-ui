// Sprint 070 — pixel baseline capture.
//
// Drives the reveal shell through the STATES × VIEWPORTS matrix
// declared in pixel_baseline_states.ts, at deviceScaleFactor 2, and
// writes twelve PNGs to captures/pixel-baseline-2026-09-23/. These
// are the visual ground truth Phase 8 sprints diff against.
//
// Run: `npm run pixel:baseline`

import { chromium } from "playwright";
import { ServerHandle } from "./shakeout/lib/server";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { STATES, VIEWPORTS, CAPTURES_DIR } from "./pixel_baseline_states";

async function main(): Promise<void> {
  mkdirSync(resolve(process.cwd(), CAPTURES_DIR), { recursive: true });
  const server = new ServerHandle();
  (globalThis as any).__pixelBaselineServer = server;
  await server.start();
  await server.waitHealthy(10_000);
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  let captured = 0;
  try {
    for (const state of STATES) {
      for (const vp of VIEWPORTS) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 2,
        });
        const page = await context.newPage();
        page.on("pageerror", (err) => console.error(`[pixel-baseline] page error ${state.name}/${vp.name}:`, err.message));
        try {
          await state.drive(page);
          const outPath = `${CAPTURES_DIR}/${state.name}-${vp.name}.png`;
          await page.screenshot({ path: outPath });
          console.log(`[pixel-baseline] captured ${outPath}`);
          captured++;
        } catch (err) {
          console.error(`[pixel-baseline] failed ${state.name}/${vp.name}:`, err instanceof Error ? err.message : err);
        } finally {
          await context.close().catch(() => undefined);
        }
      }
    }
    console.log(`[pixel-baseline] captured N=${captured} screenshots`);
  } finally {
    await browser.close().catch(() => undefined);
    await server.stop().catch(() => undefined);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
