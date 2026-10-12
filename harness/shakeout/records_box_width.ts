// The records page's box is the picker box's width (UI sprint 157): with one pane, the two boxes
// share their left and right edges.
//
// Steps at 1512 × 945: read the unbound pane's picker box; open the records page; read its box.

import { _electron as electron } from "playwright";
import { launchArgs, waitForApp } from "./lib/electron";

// Plain-string evaluates: esbuild's __name helper does not exist in the page.
const PICKER = `(() => { const i = Array.from(document.querySelectorAll("input[data-ws-input]")).find((e) => e.offsetParent !== null); const r = i.parentElement.parentElement.getBoundingClientRect(); return { left: r.left, width: r.width }; })()`;
const RECORDS = `(() => { const b = document.querySelector("[data-records-workspaces]"); if (!b) return null; const r = b.getBoundingClientRect(); return { left: r.left, width: r.width }; })()`;

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1512, 945));
    await win.locator("input[data-ws-input]").first().waitFor({ state: "visible", timeout: 15_000 });
    await win.waitForTimeout(300);
    const picker = await win.evaluate(PICKER) as { left: number; width: number };
    await win.locator("[data-top-bar] span", { hasText: /^records$/ }).first().click();
    await win.waitForFunction(`!!document.querySelector("[data-records-workspaces]")`, undefined, { timeout: 10_000 });
    await win.waitForTimeout(300);
    const records = await win.evaluate(RECORDS) as { left: number; width: number };
    if (Math.abs(records.left - picker.left) > 1 || Math.abs(records.width - picker.width) > 1) {
      throw new Error(`records box ${JSON.stringify(records)}, picker box ${JSON.stringify(picker)}`);
    }
    console.log(`records_box_width: ok — picker and records boxes both start at ${picker.left.toFixed(1)}px and run ${picker.width.toFixed(1)}px`);
    code = 0;
  } catch (e) {
    console.error(`records_box_width: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
