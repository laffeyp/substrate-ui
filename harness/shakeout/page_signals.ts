// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Each page's rows, written when it opens and when their count changes (PAGE_DRAWN, vocabulary
// v0.19, sprint 372). With one session in a repo-local folder:
//   the records page (the top bar's records): its rows; the folder's row opened: one session row
//   more; Escape; ⌘3, the assay page: no arm rows; Escape; the top bar's studio: the form's rows
//   (producers, views, triggers, routes, from the studio store), inert.
// window-1.jsonl then holds exactly four PAGE_DRAWN, in that order.

import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const drawn = (win: Page, n: number, what: string) => win.waitForFunction((want) => ((window as any).__vmSignals ?? []).filter((s: { name: string }) => s.name === "PAGE_DRAWN").length >= want, n, { timeout: 10_000 })
  .catch(() => { throw new Error(`${what} wrote no PAGE_DRAWN`); });

async function main(): Promise<void> {
  const folder = join(__dirname, ".scratch", "page-signals-" + process.pid);
  mkdirSync(folder, { recursive: true });
  const leaf = folder.split("/").pop()!;
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: "deterministic", workspace: ${JSON.stringify(folder)}, name: "page-fixture" }) }).then((r) => { if (!r.ok) throw new Error("open " + r.status); })`);
    await win.evaluate(`window.__vm.loadRecentWorkspaces()`);

    await win.locator("[data-top-bar] span", { hasText: /^records$/ }).first().click();
    await win.waitForFunction(`Array.from(document.querySelectorAll("[data-records-workspaces] span")).some((e) => (e.textContent || "").endsWith(${JSON.stringify(leaf)}))`, undefined, { timeout: 10_000 });
    await drawn(win, 1, "the records page");
    await win.locator("[data-records-workspaces] span", { hasText: leaf }).first().click();
    await win.waitForFunction(`document.querySelectorAll("[data-records-session]").length > 0`, undefined, { timeout: 10_000 });
    await drawn(win, 2, "opening the folder's row");
    const shown = await win.evaluate(`document.querySelectorAll("[data-records-workspaces] [data-records-lit]").length`) as number;
    await win.keyboard.press("Escape");
    await settled(win);
    await win.keyboard.press("Meta+3");
    await drawn(win, 3, "the assay page");
    await win.keyboard.press("Escape");
    await settled(win);
    await win.locator("[data-top-bar] span", { hasText: /^studio$/ }).first().click();
    await drawn(win, 4, "the studio page");
    const studioRows = await win.evaluate(() => {
      const st = ((globalThis as any).__substrateStudio).getSnapshot();
      return st.prods.length + st.sviews.length + st.trigs.length + st.sroutes.length;
    });

    // The trace, read once the app has closed and its files are complete.
    await app.close();
    const got = windowRecords(launch).filter((r) => r.name === "PAGE_DRAWN");
    const show = got.map((r) => `${String(r.payload.page)} rows=${String(r.payload.rows)}${r.payload.inert !== undefined ? " inert=" + String(r.payload.inert) : ""}`).join("; ");
    const [a, b, c, d] = got;
    const ok = got.length === 4
      && a.payload.page === "records" && (a.payload.rows as number) >= 1
      && b.payload.page === "records" && b.payload.rows === (a.payload.rows as number) + 1 && b.payload.rows === shown
      && c.payload.page === "assays" && c.payload.rows === 0
      && d.payload.page === "studio" && d.payload.rows === studioRows && d.payload.inert === true;
    if (!ok) throw new Error(`PAGE_DRAWN in window-1.jsonl: ${show || "none"}; the records page drew ${shown} rows with the folder open; the studio form holds ${studioRows}`);
    console.log(`page_signals: ok — 4 PAGE_DRAWN in order: ${show}`);
    code = 0;
  } catch (e) {
    console.error(`page_signals: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
