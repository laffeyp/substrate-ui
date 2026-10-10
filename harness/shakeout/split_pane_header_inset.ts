// Split-pane headers start at their left edge; only the single-pane header keeps the window-button inset.
//
// Reported 2026-10-09: split the window and every pane's header starts "substrate" 78px in, as
// if each pane had the window's close/minimise/zoom buttons above it. In split view the panes sit
// below the window's own bar; no pane header has the buttons above it.
// The Electron stylesheet (web/reveal.ts) padded every [data-top-bar] by 78px.
//
// Run against the installed app: SHAKEOUT_APP=/Applications/Substrate.app (own user-data dir and
// SUBSTRATE_HOME, so the user's running app and ~/.substrate are untouched).
//
// Steps: bind pane 1; the single pane's header sits at the window's top edge with the 78px inset.
// Split right (cmd+D), then down (cmd+shift+D) → three panes below the window's own bar; every
// pane header's padding is 10px and its "substrate" label starts within 12px of its left edge.

import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    // Pane headers are the top bars that carry the "substrate" label.
    const read = () => win.evaluate(() => Array.from(document.querySelectorAll("[data-top-bar]"))
      .filter((b) => (b as HTMLElement).offsetParent && Array.from(b.querySelectorAll("span")).some((s) => s.textContent === "substrate"))
      .map((el) => {
        const bar = el as HTMLElement;
        const box = bar.getBoundingClientRect();
        const label = Array.from(bar.querySelectorAll("span")).find((s) => s.textContent === "substrate")!;
        return { left: Math.round(box.left), top: Math.round(box.top), pad: getComputedStyle(bar).paddingLeft, labelOffset: Math.round(label.getBoundingClientRect().left - box.left) };
      }));

    // One pane: its header is the window's top edge, under the window buttons.
    const single = await read();
    if (single.length !== 1 || single[0].top !== 0 || single[0].pad !== "78px") {
      throw new Error(`single pane header should sit at the top with the 78px inset: ${JSON.stringify(single)}`);
    }

    await win.keyboard.press("Meta+d");
    await win.keyboard.press("Meta+Shift+d");
    await win.waitForFunction(() => Array.from(document.querySelectorAll("[data-top-bar]")).filter((b) => (b as HTMLElement).offsetParent && Array.from(b.querySelectorAll("span")).some((s) => s.textContent === "substrate")).length === 3, undefined, { timeout: 10_000 });
    const bars = await read();
    for (const b of bars) {
      if (b.top === 0) throw new Error(`a split pane header sits at the window's top edge: ${JSON.stringify(b)}`);
      if (b.pad !== "10px" || b.labelOffset > 12) {
        throw new Error(`a pane at (${b.left},${b.top}) starts "substrate" ${b.labelOffset}px in (padding ${b.pad}); expected 10px — ${JSON.stringify(bars)}`);
      }
    }
    console.log(`split_pane_header_inset: ok — single ${JSON.stringify(single)}; split ${JSON.stringify(bars)}`);
    code = 0;
  } catch (e) {
    console.error(`split_pane_header_inset: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
