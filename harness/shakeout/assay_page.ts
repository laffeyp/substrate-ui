// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The assay page (sprint 257; plan PLAN-2026-11-04-shell-to-react-r5.md, B5, F352).
//
// Before: nothing opened the page, and it showed a fixed table and an empty state that named a
// request nobody made. Now ⌘3 and View ▸ Assays open it, and it draws the server's assays.
//
// Fixture: a two-arm coding assay (harness/shakeout/fixtures/assays/, eight cells: strong_ref passes
// 3 of 4, full 2 of 4; the two other arms of the coding suite never ran; no committed records, so
// the control check fails), copied into the app's bench results folder before launch.
//
// Steps: ⌘3 opens the page and the listing names the fixture (ASSAYS_LOADED, count 1). A click on it
// draws the report: one line per arm in the server's order, each arm's pass^k as passes/cases, the
// control reading "control", the arms that never ran reading "not run", and the failed control check
// in plain words above the table (ASSAY_REPORT_LOADED, arms 4). ⌘3 again returns to the panes. View ▸
// Assays opens it again and Escape closes it. With the fixture removed, the page says no assays are
// on record.

import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { launchArgs, settled, waitForApp } from "./lib/electron";

const FIXTURE = join(__dirname, "fixtures", "assays");
const NAME = "coding-fixture";

type Signal = { name: string; payload?: Record<string, unknown> };
const signals = (win: Page) => win.evaluate(() => (window as unknown as { __vmSignals?: Signal[] }).__vmSignals ?? []);

async function clickMenu(app: ElectronApplication, id: string): Promise<void> {
  await app.evaluate(({ Menu }, itemId) => {
    const item = Menu.getApplicationMenu()?.getMenuItemById(itemId);
    if (!item) throw new Error("menu item not found: " + itemId);
    item.click();
  }, id);
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const bench = join(launch.options.env.SUBSTRATE_HOME, "bench_results");
  mkdirSync(bench, { recursive: true });
  for (const f of [`${NAME}.jsonl`, `${NAME}.meta.json`]) copyFileSync(join(FIXTURE, f), join(bench, f));
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const seen: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    const page = win.locator("[data-app-mount=\"assays\"]");

    // ⌘3 opens the page; the listing names the fixture.
    await win.keyboard.press("Meta+3");
    await win.locator(`[data-assay-row="${NAME}"]`).waitFor({ timeout: 10_000 });
    const listed = (await signals(win)).filter((s) => s.name === "ASSAYS_LOADED");
    if (listed.length < 1 || listed[listed.length - 1].payload?.count !== 1) throw new Error(`ASSAYS_LOADED ${JSON.stringify(listed)}`);
    seen.push("⌘3 opens the page; ASSAYS_LOADED count 1");

    // A click draws the report, checked against what the server returns.
    await win.locator(`[data-assay-row="${NAME}"]`).click();
    await win.locator(`[data-assay-report="${NAME}"]`).waitFor({ timeout: 30_000 });
    const server = await win.evaluate(async (name) => {
      const r = await fetch(`/api/assay/${name}`).then((res) => res.json());
      return { arms: r.report.arms.map((a: { arm: string; passes: number; n_cases: number }) => [a.arm, a.passes, a.n_cases]), control: r.report.control_arm, check: r.report.control_check.state };
    }, NAME);
    const drawn = await win.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("[data-assay-arm]")).map((el) => {
      const arm = el.getAttribute("data-assay-arm") ?? "";
      const verdict = document.querySelector(`[data-assay-verdict="${arm}"]`)?.textContent ?? "";
      const pass = (el.nextElementSibling?.nextElementSibling?.textContent ?? "").trim();
      return [arm, pass, verdict];
    }));
    if (JSON.stringify(drawn.map((d) => d[0])) !== JSON.stringify(server.arms.map((a: unknown[]) => a[0]))) throw new Error(`arms drawn ${JSON.stringify(drawn)}; the server's ${JSON.stringify(server.arms)}`);
    for (const [arm, passes, cases] of server.arms as [string, number, number][]) {
      const line = drawn.find((d) => d[0] === arm)!;
      const want = cases === 0 ? "not run" : `${passes}/${cases}`;
      if (line[1] !== want) throw new Error(`${arm} reads "${line[1]}"; the server has ${passes}/${cases}`);
      const verdict = arm === server.control ? "control" : cases === 0 ? "not run" : null;
      if (verdict && line[2] !== verdict) throw new Error(`${arm}'s verdict reads "${line[2]}"; expected "${verdict}"`);
    }
    const warning = await win.locator("[data-assay-warning]").first().innerText();
    if (server.check !== "fail" || !warning.startsWith("no delta: the control arm did not run on every case (fail)")) throw new Error(`control check ${server.check}; the page says "${warning}"`);
    const report = (await signals(win)).filter((s) => s.name === "ASSAY_REPORT_LOADED").pop();
    if (report?.payload?.name !== NAME || report.payload.arms !== server.arms.length) throw new Error(`ASSAY_REPORT_LOADED ${JSON.stringify(report ?? null)}`);
    seen.push(`report ${JSON.stringify(drawn)}; the failed control check said; ASSAY_REPORT_LOADED arms ${server.arms.length}`);

    // ⌘3 again returns to the panes.
    await win.keyboard.press("Meta+3");
    await page.waitFor({ state: "detached", timeout: 5_000 });
    seen.push("⌘3 again closes it");

    // View ▸ Assays opens it; Escape closes it.
    await clickMenu(app, "menu-toggle-assays");
    await win.locator(`[data-assay-row="${NAME}"]`).waitFor({ timeout: 10_000 });
    await win.keyboard.press("Escape");
    await page.waitFor({ state: "detached", timeout: 5_000 });
    seen.push("View ▸ Assays opens it; Escape closes it");

    // With no cells files the page says so.
    rmSync(join(bench, `${NAME}.jsonl`));
    rmSync(join(bench, `${NAME}.meta.json`));
    await win.keyboard.press("Meta+3");
    await win.locator("[data-assays-empty]").waitFor({ timeout: 10_000 });
    await settled(win);
    seen.push("no cells files: the empty note");

    console.log(`assay_page: ok — ${seen.join("; ")}`);
    code = 0;
  } catch (e) {
    console.error(`assay_page: FAIL — ${(e as Error).message}; passed: ${seen.join("; ") || "none"}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
