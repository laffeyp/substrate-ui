// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The menu's Settings… and Close Pane (sprint 210; plan PLAN-2026-11-04-shell-to-react-r5.md, A12).
//
// Both items are clicked with Menu.getMenuItemById(...).click(), as electron_menu.ts does. ⌘W is Close
// Pane's accelerator; a synthetic ⌘W does not reach it (sprint 209), so the gate checks the item's
// accelerator and clicks the item. Close Pane ends the focused pane's session and removes the pane;
// on the last pane it does nothing.

import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

/** The `source` on the session record's SessionEndRequested, once the record holds one (10 s at most,
 *  read again each 50 ms; null if none arrives). */
async function endSource(state: string, sessionId: string): Promise<string | null> {
  const dir = join(state, "sessions", sessionId, "record");
  for (let at = Date.now(); Date.now() - at < 10_000; await new Promise((r) => setTimeout(r, 50))) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".jsonl"))) {
      for (const line of readFileSync(join(dir, file), "utf8").split("\n")) {
        if (!line.includes('"SessionEndRequested"')) continue;
        const env = JSON.parse(line) as { kind: string; payload?: { source?: string } };
        if (env.kind === "SessionEndRequested") return env.payload?.source ?? null;
      }
    }
  }
  return null;
}

type Signal = { name: string; payload?: Record<string, unknown> };
const visible = (win: Page, sel: string) => win.locator(sel).filter({ visible: true }).first();
const signals = (win: Page) => win.evaluate(() => (window as unknown as { __vmSignals?: Signal[] }).__vmSignals ?? []);
const paneCount = (win: Page) => win.evaluate(() => Array.from(document.querySelectorAll("[data-pane]")).filter((e) => (e as HTMLElement).offsetParent !== null).length);
const sessionOf = (win: Page, pane: number) => win.evaluate((id) => (window as any).__vm.get(id)?.snapshot().sessionId ?? null, pane);

async function clickMenu(app: ElectronApplication, id: string): Promise<void> {
  await app.evaluate(({ Menu }, itemId) => {
    const item = Menu.getApplicationMenu()?.getMenuItemById(itemId);
    if (!item) throw new Error("menu item not found: " + itemId);
    item.click();
  }, id);
}

async function oneTurn(win: Page, pane: number): Promise<void> {
  await visible(win, `[data-pane="${pane}"] textarea[data-input-bar]`).fill("hello");
  await win.keyboard.press("Enter");
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const seen: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);

    // Settings…
    await clickMenu(app, "menu-settings");
    await win.getByText("SETTINGS · ⌘,", { exact: true }).waitFor({ timeout: 5_000 });
    await win.keyboard.press("Escape");
    await win.getByText("SETTINGS · ⌘,", { exact: true }).waitFor({ state: "hidden", timeout: 5_000 });
    seen.push("Settings… opens the dialog; Escape closes it");

    // Close Pane: its accelerator, then two bound panes down to one.
    const accel = await app.evaluate(({ Menu }) => Menu.getApplicationMenu()?.getMenuItemById("menu-close-pane")?.accelerator ?? null);
    if (accel !== "CmdOrCtrl+W") throw new Error(`Close Pane's accelerator is ${accel}`);
    await bindPaneAsUser(win, "deterministic");
    await oneTurn(win, 1);
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    await win.keyboard.press("Meta+d");
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 2, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, "deterministic");
    await oneTurn(win, 2);
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(2)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    const first = await sessionOf(win, 1);
    const second = await sessionOf(win, 2);
    if (!first || !second || first === second) throw new Error(`expected two sessions; got ${first}, ${second}`);
    const before = (await signals(win)).length;
    await clickMenu(app, "menu-close-pane");
    await win.waitForFunction(() => Array.from(document.querySelectorAll("[data-pane]")).filter((e) => (e as HTMLElement).offsetParent !== null).length === 1, undefined, { timeout: 10_000 });
    await win.waitForFunction((n) => ((window as any).__vmSignals ?? []).slice(n).some((s: Signal) => s.name === "SESSION_END_REQUESTED"), before, { timeout: 10_000 });
    const ends = (await signals(win)).slice(before).filter((s) => s.name === "SESSION_END_REQUESTED");
    if (ends.length !== 1 || ends[0].payload?.session_id !== second || ends[0].payload?.reason !== "user_close") {
      throw new Error(`expected one SESSION_END_REQUESTED for ${second} with reason user_close; got ${JSON.stringify(ends)}`);
    }
    if ((await sessionOf(win, 1)) !== first) throw new Error("the remaining pane lost its session");
    // The record names the end's source as the client sent it (sprint 337, plan row F2, F330): before,
    // the client sent `reason` and the server, which reads `source`, recorded "user_end" for every end.
    const recorded = await endSource(launch.state, second);
    if (recorded !== "user_close") throw new Error(`the record's SessionEndRequested for ${second} has source ${JSON.stringify(recorded)}; want user_close`);
    seen.push(`accelerator CmdOrCtrl+W; Close Pane ended ${second} (user_close, on the record too) and left pane 1 on ${first}`);

    // The last pane stays.
    const beforeLast = (await signals(win)).length;
    await clickMenu(app, "menu-close-pane");
    // Close Pane changes nothing here, so there is no state to wait for. Menu commands reach the
    // window in order over one IPC channel: once Settings…, sent next, has opened its dialog, the
    // Close Pane before it has been handled.
    await clickMenu(app, "menu-settings");
    await win.getByText("SETTINGS · ⌘,", { exact: true }).waitFor({ timeout: 5_000 });
    await win.keyboard.press("Escape");
    await settled(win);
    const left = await paneCount(win);
    const endsLast = (await signals(win)).slice(beforeLast).filter((s) => s.name === "SESSION_END_REQUESTED");
    if (left !== 1 || endsLast.length) throw new Error(`Close Pane on the last pane: ${left} panes, ${endsLast.length} end requests`);
    seen.push("Close Pane on the last pane does nothing");

    console.log(`menu_commands: ok — ${seen.join("; ")}`);
    code = 0;
  } catch (e) {
    console.error(`menu_commands: FAIL — ${(e as Error).message}; passed: ${seen.join("; ") || "none"}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
