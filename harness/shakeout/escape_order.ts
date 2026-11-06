// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Escape's order (sprint 209; plan PLAN-2026-11-04-shell-to-react-r5.md, A11).
//
// Escape closes find, then a dialog, then a menu, then a surface; with none open it interrupts the
// focused pane's running turn, hard, or soft with Shift (web/app/keymap.ts). The deterministic driver
// answers at once, so for the interrupt branch the gate sets the controller's snapshot to running and
// records what the focused pane's controller's interruptTurn receives; the controller's own
// interrupt is not under test. ⌘W is a menu accelerator that synthetic keys do not reach; it is
// gated through its menu item in menu_commands.ts.

import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const visible = (win: Page, sel: string) => win.locator(sel).filter({ visible: true }).first();
const findOpen = (win: Page) => win.locator("span").filter({ hasText: /^find$/ }).filter({ visible: true }).count().then((n) => n > 0);
const settingsOpen = (win: Page) => win.getByText("SETTINGS · ⌘,", { exact: true }).isVisible();
const crumb = async (win: Page) => (await visible(win, "[data-crumb]").innerText()).trim();

async function press(win: Page, key: string): Promise<void> {
  await win.keyboard.press(key);
  await settled(win);
}

async function expect(what: string, got: boolean): Promise<void> {
  if (!got) throw new Error(what);
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const seen: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic");
    await visible(win, "textarea[data-input-bar]").fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    await win.locator("body").click({ position: { x: 5, y: 300 } });

    // Find over the settings dialog: find closes first.
    await press(win, "Meta+,");
    await press(win, "Meta+f");
    await expect("⌘F with settings open did not open find", (await findOpen(win)) && (await settingsOpen(win)));
    await press(win, "Escape");
    await expect("the first Escape should close find and leave the settings dialog", !(await findOpen(win)) && (await settingsOpen(win)));
    await press(win, "Escape");
    await expect("the second Escape should close the settings dialog", !(await settingsOpen(win)));
    seen.push("find, then the dialog");

    // The settings dialog over the records page: the dialog closes first, then the page.
    await win.locator("[data-top-bar] span", { hasText: /^records$/ }).first().click();
    await win.waitForFunction(() => (document.querySelector("[data-crumb]")?.textContent ?? "").trim().endsWith("› records"), undefined, { timeout: 5_000 });
    await press(win, "Meta+,");
    await expect("⌘, did not open the settings dialog over records", await settingsOpen(win));
    await press(win, "Escape");
    await expect("Escape should close the dialog and keep the records page", !(await settingsOpen(win)) && (await crumb(win)).endsWith("› records"));
    await press(win, "Escape");
    await expect(`Escape should close the records page; the crumb reads ${await crumb(win)}`, !(await crumb(win)).endsWith("› records"));
    seen.push("the dialog, then the records page");

    // With nothing open and the turn running, Escape interrupts: hard, or soft with Shift.
    await win.evaluate(() => {
      const w = window as any;
      w.__interruptCalls = [] as string[];
      // The focused pane's controller takes the interrupt (web/app/keymap.ts, sprint 327).
      w.__vm.get(1).interruptTurn = (tier: string) => { w.__interruptCalls.push(tier); return Promise.resolve(); };
      w.__vm.get(1).patch({ parkReason: null, endedReason: null, connection: "connected" });
    });
    await win.waitForFunction(() => !(window as any).__vm.get(1).snapshot().parkReason, undefined, { timeout: 5_000 });
    await settled(win);
    await press(win, "Escape");
    await press(win, "Shift+Escape");
    await press(win, "Meta+f");
    await press(win, "Escape");
    const calls: string[] = await win.evaluate(() => (window as any).__interruptCalls);
    await expect(`interrupt calls ${JSON.stringify(calls)}; expected ["hard","soft"] (none for the Escape that closed find)`, JSON.stringify(calls) === JSON.stringify(["hard", "soft"]));
    await expect("the Escape with find open should close find", !(await findOpen(win)));
    seen.push(`running turn: Escape hard, ⇧Escape soft, Escape with find open closes find only; calls ${JSON.stringify(calls)}`);

    console.log(`escape_order: ok — ${seen.join("; ")}`);
    code = 0;
  } catch (e) {
    console.error(`escape_order: FAIL — ${(e as Error).message}; passed: ${seen.join("; ") || "none"}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
