// Sprint 071 — mount-seam check under `?atom-transcript=1`.
//
// Loads the shell with the flag on and asserts:
//   1. Both mount divs exist in the DOM.
//   2. Two `[reveal] transcript root mounted` console lines fire.
//   3. No `page error` events.
//   4. The dc-runtime transcript region is empty (the mount div's
//      parent scroller contains no `<sc-for pn.liveTranscript>` rows).
//
// Exits 0 on pass; 1 on any assertion failure.

import { chromium } from "playwright";
import { ServerHandle } from "./shakeout/lib/server";

const BASE_URL = "http://127.0.0.1:8765";

async function main(): Promise<void> {
  const server = new ServerHandle();
  await server.start();
  await server.waitHealthy(10_000);
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const failures: string[] = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    const consoleLines: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => consoleLines.push(msg.text()));
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto(BASE_URL + "/?atom-transcript=1", { waitUntil: "networkidle" });
    await page.waitForFunction(() => (window as any).__vm != null, undefined, { timeout: 10_000 });
    await page.waitForTimeout(500);

    // 1. Terminal view (default): mount exists, empty, no dc-runtime rows.
    const termMount = await page.$("#vm-transcript-mount");
    if (!termMount) failures.push("terminal-view mount div not found");
    const termChildren = await page.evaluate(() => {
      const host = document.getElementById("vm-transcript-mount");
      return host ? host.childElementCount : -1;
    });
    if (termChildren !== 0) {
      failures.push(`terminal mount has ${termChildren} children; expected 0 (Transcript stub renders null)`);
    }
    const anyDcRowTerm = await page.evaluate(() => {
      const scroller = document.getElementById("vm-transcript");
      if (!scroller) return false;
      const rows = scroller.querySelectorAll('div[style*="max-width:840px"]');
      return rows.length > 0;
    });
    if (anyDcRowTerm) {
      failures.push("dc-runtime transcript rows present in terminal view under flag-on boot");
    }

    // 2. Toggle into reveal view; check the reveal mount.
    await page.keyboard.down("Control");
    await page.keyboard.press("`");
    await page.keyboard.up("Control");
    await page.waitForTimeout(500);

    const revMount = await page.$("#vm-transcript-mount-reveal");
    if (!revMount) failures.push("reveal-view mount div not found after toggling reveal");
    const revChildren = await page.evaluate(() => {
      const host = document.getElementById("vm-transcript-mount-reveal");
      return host ? host.childElementCount : -1;
    });
    if (revChildren !== 0) {
      failures.push(`reveal mount has ${revChildren} children; expected 0 (Transcript stub renders null)`);
    }

    // 3. Both React roots mounted, one console line each.
    const mountedLines = consoleLines.filter((line) => line.includes("transcript root mounted"));
    if (mountedLines.length !== 2) {
      failures.push(`expected 2 "transcript root mounted" console lines, got ${mountedLines.length}`);
    }

    if (pageErrors.length !== 0) {
      failures.push(`page errors: ${pageErrors.join("; ")}`);
    }

    if (failures.length === 0) {
      console.log("[mount-seam] PASS");
    } else {
      console.log("[mount-seam] FAIL");
      for (const failure of failures) console.log("  - " + failure);
    }

    await context.close().catch(() => undefined);
  } finally {
    await browser.close().catch(() => undefined);
    await server.stop().catch(() => undefined);
  }

  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => { console.error(err); process.exit(1); });
