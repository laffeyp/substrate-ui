// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The keys the window routes, written as KEY_ROUTED (sprint 367): the arrows, Enter, Escape and any
// ⌘ or Ctrl chord, with the keymap's action and where it went. Steps, each a target:
//   ↓ on pane 1's picker, focus out of any box (picker); "hello" and Enter in the input bar (box);
//   Escape with nothing open and no turn running (none); /language, then ↑ on the language lens
//   (language); ⌘M (window); the records page, then ↓ (records).
// window-1.jsonl then holds those records in that order (other routed keys may fall between), and
// no KEY_ROUTED names a typed character: the five letters of "hello" are not written.

import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const visible = (win: Page, sel: string) => win.locator(sel).filter({ visible: true }).first();
const blur = (win: Page) => win.evaluate(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`);

async function press(win: Page, key: string): Promise<void> {
  await win.keyboard.press(key);
  await settled(win);
}

async function main(): Promise<void> {
  const folder = join(__dirname, ".scratch", "key-signals-" + process.pid);
  mkdirSync(folder, { recursive: true });
  const leaf = folder.split("/").pop()!;
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await visible(win, "input[data-ws-input]").waitFor({ timeout: 15_000 });
    await blur(win);
    await press(win, "ArrowDown");
    await bindPaneAsUser(win, "deterministic");
    // Typed key by key, so each letter reaches the window's keydown (fill sends no key events).
    await visible(win, "textarea[data-input-bar]").click();
    await win.keyboard.type("hello");
    await press(win, "Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    await blur(win);
    await press(win, "Escape");
    await visible(win, "textarea[data-input-bar]").fill("/language");
    await press(win, "Enter");
    await win.waitForFunction(`window.__vmSignals.some((s) => s.name === "VIEW_CHANGED" && s.payload.cause === "language")`, undefined, { timeout: 10_000 });
    await win.waitForFunction(`document.querySelectorAll("[data-lang-row]").length > 0`, undefined, { timeout: 10_000 })
      .catch(() => { throw new Error("the language lens drew no turn rows"); });
    await blur(win);
    await press(win, "ArrowUp");
    await press(win, "Meta+m");
    await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: "deterministic", workspace: ${JSON.stringify(folder)}, name: "key-fixture" }) }).then((r) => { if (!r.ok) throw new Error("open " + r.status); })`);
    await win.evaluate(`window.__vm.loadRecentWorkspaces()`);
    await win.locator("[data-top-bar] span", { hasText: /^records$/ }).first().click();
    await win.waitForFunction(`Array.from(document.querySelectorAll("[data-records-workspaces] span")).some((e) => (e.textContent || "").endsWith(${JSON.stringify(leaf)}))`, undefined, { timeout: 10_000 });
    await blur(win);
    await press(win, "ArrowDown");

    // The trace, read once the app has closed and its files are complete.
    await app.close();
    const got = windowRecords(launch).filter((r) => r.name === "KEY_ROUTED");
    const show = got.map((r) => `${String(r.payload.key)} ${String(r.payload.action)} ${String(r.payload.target)}`).join("; ");
    const typed = got.filter((r) => { const k = String(r.payload.key); return !k.includes("+") && k.length === 1; });
    if (typed.length) throw new Error(`KEY_ROUTED wrote typed characters: ${typed.map((r) => String(r.payload.key)).join(" ")}`);
    const want: [string, string, string][] = [
      ["ArrowDown", "picker", "picker"], ["Enter", "none", "box"], ["Escape", "none", "none"], ["Enter", "none", "box"],
      ["ArrowUp", "language", "language"], ["Meta+m", "toggle-meta", "window"], ["ArrowDown", "records", "records"],
    ];
    let at = 0;
    for (const r of got) {
      if (at < want.length && r.payload.key === want[at][0] && r.payload.action === want[at][1] && r.payload.target === want[at][2] && r.pane_id === null) at++;
    }
    if (at < want.length) throw new Error(`KEY_ROUTED in window-1.jsonl lacks ${want[at].join(" ")} after the first ${at} of ${want.length}: ${show || "none"}`);
    console.log(`key_signals: ok — ${want.length} routed keys in order, one per target, no typed character (${got.length} KEY_ROUTED in all)`);
    code = 0;
  } catch (e) {
    console.error(`key_signals: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
