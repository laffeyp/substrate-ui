// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The graph's app view keeps the delegate lane on the rows it shows (UI sprint 155): every row app
// view keeps draws its three lane cells as all view does.
//
// Steps: bind pane 1 (deterministic) and send one message; ⌘M to the meta view's down graph; read
// each row's seq and lane colours under "all", then under "app"; compare the rows app keeps.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

type Row = { seq: string; kind: string; lanes: string[] };
// Plain-string evaluate: esbuild's __name helper does not exist in the page.
const ROWS = `Array.from(document.querySelectorAll('div[title="click to inspect · click again to close"]')).filter((el) => el.offsetParent !== null).map((el) => ({
  seq: (el.children[1] || {}).textContent ? el.children[1].textContent.trim() : "",
  kind: (el.children[3] || {}).textContent ? el.children[3].textContent.trim() : "",
  lanes: Array.from(el.firstElementChild.children).slice(0, 3).map((c) => getComputedStyle(c).backgroundColor),
}))`;
const EMPTY = "rgba(0, 0, 0, 0)";

async function scope(win: Page, name: "all" | "app"): Promise<Row[]> {
  await win.locator("span", { hasText: new RegExp(`^${name}$`) }).first().click();
  await settled(win);
  return win.evaluate(ROWS) as Promise<Row[]>;
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    const bar = win.locator('[data-pane="1"] [data-input-bar]').first();
    await bar.click();
    await bar.fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(`window.__vm.get(1).snapshot().transcript.some((r) => r.role === "model")`, undefined, { timeout: 20_000 });
    await win.keyboard.press("Meta+m");
    await win.locator('div[title="click to inspect · click again to close"]').first().waitFor({ state: "visible", timeout: 15_000 });

    const all = await scope(win, "all");
    const app_ = await scope(win, "app");
    if (!app_.length || app_.length >= all.length) throw new Error(`app view kept ${app_.length} of ${all.length} rows`);
    const bySeq = new Map(all.map((r) => [r.seq, r]));
    const differ = app_.filter((r) => JSON.stringify(r.lanes) !== JSON.stringify(bySeq.get(r.seq)?.lanes));
    if (differ.length) throw new Error(`${differ.length} of ${app_.length} kept rows draw other lanes in app view: ${differ.slice(0, 3).map((r) => `${r.seq} ${r.kind} app ${JSON.stringify(r.lanes)} all ${JSON.stringify(bySeq.get(r.seq)?.lanes)}`).join("; ")}`);
    const delegated = app_.filter((r) => r.lanes[1] !== EMPTY);
    if (!delegated.length) throw new Error("no kept row has a coloured delegate cell, so the check proved nothing");
    console.log(`app_view_delegate_lane: ok — app view keeps ${app_.length} of ${all.length} rows; each draws all view's lanes; ${delegated.length} carry the delegate lane (${delegated.slice(0, 3).map((r) => r.kind).join(", ")})`);
    code = 0;
  } catch (e) {
    console.error(`app_view_delegate_lane: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
