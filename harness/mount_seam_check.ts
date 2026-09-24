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

    // 1. Terminal view (default): mount exists, contains the atom
    //    root div; the atom root has at least one child (the
    //    Transcript's wrapper). No dc-runtime rows present.
    const termMount = await page.$('[data-vm-transcript-mount="terminal"][data-pane-id="1"]');
    if (!termMount) failures.push("terminal-view mount div not found");
    const termShape = await page.evaluate(() => {
      const host = document.querySelector<HTMLElement>('[data-vm-transcript-mount="terminal"][data-pane-id="1"]');
      const inner = host?.querySelector("[data-vm-atom-root]");
      return {
        hostChildren: host?.childElementCount ?? -1,
        innerExists: !!inner,
        innerChildren: inner?.childElementCount ?? -1,
      };
    });
    if (termShape.hostChildren < 1) failures.push(`terminal mount has ${termShape.hostChildren} children; expected atom root`);
    if (!termShape.innerExists) failures.push("terminal atom root [data-vm-atom-root] not mounted");
    const anyDcRowTerm = await page.evaluate(() => {
      const scroller = document.querySelector<HTMLElement>('[data-vm-transcript-scroller="1"]');
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

    const revMount = await page.$('[data-vm-transcript-mount="reveal"][data-pane-id="1"]');
    if (!revMount) failures.push("reveal-view mount div not found after toggling reveal");
    const revShape = await page.evaluate(() => {
      const host = document.querySelector<HTMLElement>('[data-vm-transcript-mount="reveal"][data-pane-id="1"]');
      const inner = host?.querySelector("[data-vm-atom-root]");
      return {
        hostChildren: host?.childElementCount ?? -1,
        innerExists: !!inner,
      };
    });
    if (revShape.hostChildren < 1) failures.push(`reveal mount has ${revShape.hostChildren} children; expected atom root`);
    if (!revShape.innerExists) failures.push("reveal atom root [data-vm-atom-root] not mounted");

    // 3. Both React roots mounted (may re-mount as dc-runtime
    // re-renders clear the outer mount div; the observer re-attaches
    // the inner root each time). At least one line per view.
    const mountedLines = consoleLines.filter((line) => line.includes("transcript root mounted"));
    const terminalLines = mountedLines.filter((line) => line.includes("terminal")).length;
    const revealLines = mountedLines.filter((line) => line.includes("reveal")).length;
    if (terminalLines < 1) failures.push(`expected ≥1 "transcript root mounted (terminal)" console lines, got ${terminalLines}`);
    if (revealLines < 1) failures.push(`expected ≥1 "transcript root mounted (reveal)" console lines, got ${revealLines}`);

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
