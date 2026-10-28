// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window has one top bar, at its top edge, and the bar shows the focused pane (UI sprint 136).
//
// Before sprint 136 the terminal view drew a header on every pane, and the reveal view drew a
// second, larger bar with the same controls. Now one bar sits at the window's top edge in every
// view, under the window buttons (the 78px inset, web/reveal.ts), and panes carry no bar.
//
// Run against the installed app: SHAKEOUT_APP=/Applications/Substrate.app (own user-data dir and
// SUBSTRATE_HOME, so the user's running app and ~/.substrate are untouched).
//
// Steps: bind pane 1; split right (cmd+D), then down (cmd+shift+D) → three panes. Assert exactly
// one visible [data-top-bar] and one "substrate" label, at the top edge with the 78px inset, before
// and after the split. Click each pane in turn: the bar reads that pane's name, pane-<id>.

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
    const read = () => win.evaluate(() => {
      const bars = Array.from(document.querySelectorAll("[data-top-bar]")).filter((el) => (el as HTMLElement).offsetParent !== null).map((el) => {
        const bar = el as HTMLElement;
        const box = bar.getBoundingClientRect();
        return { top: Math.round(box.top), pad: getComputedStyle(bar).paddingLeft };
      });
      const labels = Array.from(document.querySelectorAll("span")).filter((s) => s.offsetParent !== null && s.childElementCount === 0 && s.textContent === "substrate").length;
      return { bars, labels };
    });
    const check = (where: string, got: { bars: { top: number; pad: string }[]; labels: number }) => {
      if (got.bars.length !== 1 || got.labels !== 1) {
        throw new Error(`${where}: expected one top bar and one "substrate" label; got ${JSON.stringify(got)}`);
      }
      if (got.bars[0].top !== 0 || got.bars[0].pad !== "78px") {
        throw new Error(`${where}: the bar should sit at the top edge with the 78px inset; got ${JSON.stringify(got.bars[0])}`);
      }
    };
    const single = await read();
    check("one pane", single);

    await win.keyboard.press("Meta+d");
    await win.keyboard.press("Meta+Shift+d");
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 3, undefined, { timeout: 10_000 });
    const split = await read();
    check("three panes", split);

    const crumbs: string[] = [];
    for (const pane of await win.locator("[data-pane]").all()) {
      await pane.click({ position: { x: 40, y: 40 } });
      const id = await pane.getAttribute("data-pane");
      await win.waitForFunction(
        (paneId) => {
          const panes = Array.from(document.querySelectorAll("[data-pane]")) as HTMLElement[];
          const mine = panes.find((p) => p.getAttribute("data-pane") === paneId);
          return !!mine && getComputedStyle(mine).opacity === "1";
        },
        id,
        { timeout: 5_000 },
      );
      const crumb = (await win.locator("[data-crumb]").innerText()).trim();
      crumbs.push(crumb);
      // No pane here is renamed, so each is named pane-<id>.
      if (crumb !== `pane-${id}`) throw new Error(`focused pane ${id}; the bar reads "${crumb}" — ${JSON.stringify(crumbs)}`);
    }
    console.log(`one_top_bar: ok — one pane ${JSON.stringify(single)}; three panes ${JSON.stringify(split)}; names by focus ${JSON.stringify(crumbs)}`);
    code = 0;
  } catch (e) {
    console.error(`one_top_bar: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
