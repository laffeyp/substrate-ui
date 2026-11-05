// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Pixel capture for the move off dc-runtime (sprint 192; plan PLAN-2026-11-04-shell-to-react-r3.md, "Gates").
//
// Launches the app from source on an offline roster, binds pane 1 on the deterministic driver in a
// fixed repo-local folder, drives 14 screens, and writes each at 1440x900 and 900x380 to
// captures/pixel/<label>/<screen>@<w>x<h>.png. Text that changes between runs is replaced with fixed
// stand-ins before each screenshot (masks.ts).
// The assay page is not captured: it had no opener when the baseline was taken, so it has no old
// picture to hold; harness/shakeout/assay_page.ts gates it by behaviour (sprint 257).
//
// Usage: npx tsx harness/pixel/capture.ts <label>

import { _electron as electron } from "playwright";
import type { ElectronApplication, Page } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "../shakeout/lib/electron";
import { VOLATILE_TEXT, normalizeVolatileText } from "./masks";

const REPO_ROOT = join(__dirname, "..", "..");
const FOLDER = join(REPO_ROOT, "harness", "shakeout", ".scratch", "pixel");
export const SIZES: readonly (readonly [number, number])[] = [[1440, 900], [900, 380]];
export const SCREENS = [
  "panes-picker", "panes-one-turn", "panes-two",
  "meta-stream-down", "meta-stream-side", "meta-inspector", "meta-io", "meta-structure", "meta-language", "meta-scene",
  "records", "settings", "end-dialog", "first-run",
] as const;
type Screen = (typeof SCREENS)[number];

async function setSize(app: ElectronApplication, win: Page, w: number, h: number): Promise<void> {
  await app.evaluate(({ BrowserWindow }, size) => {
    BrowserWindow.getAllWindows()[0].setContentSize(size[0], size[1]);
  }, [w, h] as [number, number]);
  await win.waitForFunction((size) => window.innerWidth === size[0] && window.innerHeight === size[1], [w, h] as [number, number], { timeout: 5_000 });
  await settled(win);
}

async function shoot(app: ElectronApplication, win: Page, dir: string, screen: Screen, done: Set<Screen>): Promise<void> {
  for (const [w, h] of SIZES) {
    await setSize(app, win, w, h);
    // The app redraws every 500 ms; a value that ticks between the replacement and the screenshot
    // (`0s ago` to `1s ago`) is written over its stand-in. After the shot, replace again: anything
    // replaced means the page changed under the shot, so take it again (sprint 199).
    const stands = VOLATILE_TEXT.map((v) => ({ source: v.source, stand: v.stand }));
    let png: Buffer | null = null;
    for (let attempt = 1; attempt <= 3 && !png; attempt++) {
      await win.evaluate(normalizeVolatileText, stands);
      await settled(win);
      const shot = await win.screenshot({ animations: "disabled", caret: "hide" });
      const changed = await win.evaluate(normalizeVolatileText, stands);
      if (changed === 0) png = shot;
      else console.log(`[pixel] ${screen}@${w}x${h}: ${changed} value(s) changed during the shot; attempt ${attempt}`);
    }
    if (!png) throw new Error(`${screen}@${w}x${h}: values kept changing during three shots`);
    writeFileSync(join(dir, `${screen}@${w}x${h}.png`), png);
  }
  done.add(screen);
  console.log(`[pixel] ${screen}`);
}

const visible = (win: Page, selector: string) => win.locator(selector).filter({ visible: true }).first();

async function clickText(win: Page, text: string): Promise<void> {
  await win.locator("span").filter({ hasText: new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }).filter({ visible: true }).first().click();
  await settled(win);
}

async function main(): Promise<void> {
  const label = process.argv[2];
  if (!label) throw new Error("usage: npx tsx harness/pixel/capture.ts <label>");
  const dir = join(REPO_ROOT, "captures", "pixel", label);
  mkdirSync(dir, { recursive: true });
  mkdirSync(FOLDER, { recursive: true });
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const done = new Set<Screen>();
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);

    await visible(win, "input[data-ws-input]").waitFor({ timeout: 15_000 });
    await shoot(app, win, dir, "panes-picker", done);

    await bindPaneAsUser(win, "deterministic", { folder: FOLDER });
    // `fill`, not `keyboard.type`: typed at full speed, the bar sometimes kept the last letter after
    // Enter (sprint 199, one run in four), and every later screen carried it.
    await visible(win, "textarea[data-input-bar]").fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => {
      const vm = (window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: string | null } } | null } }).__vm;
      return !!vm?.get(1)?.snapshot().parkReason;
    }, undefined, { timeout: 30_000 });
    await settled(win);
    await shoot(app, win, dir, "panes-one-turn", done);

    await win.keyboard.press("Meta+m");
    await visible(win, '[data-vm-transcript-mount="reveal"]').waitFor({ timeout: 10_000 });
    await settled(win);
    await shoot(app, win, dir, "meta-stream-down", done);

    const userRow = win.locator('[data-stream-scroll] [title^="click to inspect"]').filter({ hasText: "UserMessage" }).first();
    await userRow.click();
    await win.getByText("INSPECT", { exact: true }).first().waitFor({ timeout: 5_000 });
    await win.getByText("INSPECT", { exact: true }).first().evaluate((el) => el.scrollIntoView({ block: "center" }));
    await settled(win);
    await shoot(app, win, dir, "meta-inspector", done);
    await userRow.click();
    await settled(win);

    await clickText(win, "→ side");
    await shoot(app, win, dir, "meta-stream-side", done);
    await clickText(win, "⇅ down");

    for (const [chip, screen] of [["i/o", "meta-io"], ["structure", "meta-structure"], ["language", "meta-language"], ["scene", "meta-scene"]] as const) {
      await clickText(win, chip);
      await shoot(app, win, dir, screen, done);
    }
    await clickText(win, "stream+graph");

    await win.keyboard.press("Meta+m");
    await visible(win, '[data-vm-transcript-mount="terminal"]').waitFor({ timeout: 10_000 });
    await win.locator("[data-top-bar] span", { hasText: /^records$/ }).first().click();
    await visible(win, "[data-records-workspaces]").waitFor({ timeout: 10_000 });
    await visible(win, "[data-records-workspaces] [data-records-lit]").click();
    await visible(win, "[data-records-session]").waitFor({ timeout: 10_000 });
    await settled(win);
    await shoot(app, win, dir, "records", done);
    await win.keyboard.press("Escape");
    await visible(win, '[data-vm-transcript-mount="terminal"]').waitFor({ timeout: 10_000 });

    await win.keyboard.press("Meta+,");
    await win.getByText("SETTINGS · ⌘,", { exact: true }).waitFor({ timeout: 5_000 });
    await settled(win);
    await shoot(app, win, dir, "settings", done);
    await win.keyboard.press("Escape");
    await settled(win);

    await visible(win, "textarea[data-input-bar]").fill("/");
    await visible(win, '[data-slash-row="/exit"]').click();
    await win.getByText(/^End session/).waitFor({ timeout: 5_000 });
    await settled(win);
    await shoot(app, win, dir, "end-dialog", done);
    await win.keyboard.press("Escape");
    await settled(win);

    const before = await win.evaluate(() => [...new Set(((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).map((x) => x.name))]);
    console.log(`[pixel] signals through the end dialog: ${before.join(" ")}`);
    await win.keyboard.press("Meta+d");
    await win.waitForFunction(() => Array.from(document.querySelectorAll("[data-pane]")).filter((e) => (e as HTMLElement).offsetParent !== null).length === 2, undefined, { timeout: 5_000 });
    await settled(win);
    await shoot(app, win, dir, "panes-two", done);

    const url = new URL(win.url());
    url.searchParams.set("firstrun", "1");
    await win.goto(url.toString());
    await waitForApp(win);
    await win.getByText("DRIVERS ON THIS MACHINE", { exact: true }).waitFor({ timeout: 10_000 });
    await settled(win);
    await shoot(app, win, dir, "first-run", done);

    const fired = await win.evaluate(() => [...new Set(((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).map((x) => x.name))]);
    console.log(`[pixel] signals since the first-run reload: ${fired.join(" ") || "none"}`);
    const missing = SCREENS.filter((s) => !done.has(s));
    if (missing.length) throw new Error(`screens not captured: ${missing.join(", ")}`);
    console.log(`[pixel] ${done.size} screens × ${SIZES.length} sizes → ${dir}`);
    code = 0;
  } catch (e) {
    console.error(`[pixel] FAIL after ${[...done].join(", ") || "no screen"}: ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

if (require.main === module) main();
