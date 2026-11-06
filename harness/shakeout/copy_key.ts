// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// ⌘C copies; Ctrl+C in an empty prompt interrupts the focused pane's turn (sprint 325; plan
// PLAN-2026-11-04-shell-to-react-r5.md, E3, F336).
//
// Before: reveal.ts took Ctrl+C and ⌘C alike, so on macOS ⌘C with no selection in the prompt sent an
// interrupt; and it held pane 1's controller, so Ctrl+C in any pane interrupted pane 1's session.
//
// An interrupt is a POST to /api/session/<id>/interrupt. Steps: bind pane 1 (deterministic), send a
// turn, wait for it to park. In pane 1's empty prompt ⌘C, then Ctrl+C: once Ctrl+C's interrupt has
// arrived, it is the only one, and it names pane 1's session (the key handler runs ⌘C's first, so an
// interrupt from it would have come before). Typed text selected and ⌘C puts it on the clipboard and
// sends no interrupt. Split; pane 2 opens a session; Ctrl+C in pane 2's empty prompt interrupts pane
// 2's session.

import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const sid = (win: Page, pane: number) => win.evaluate((id) => (window as any).__vm.get(id).snapshot().sessionId as string, pane);

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const seen: string[] = [];
  const interrupts: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    win.on("request", (req) => { const m = /\/api\/session\/([^/]+)\/interrupt/.exec(req.url()); if (m && req.method() === "POST") interrupts.push(decodeURIComponent(m[1])); });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic");
    const bar1 = win.locator('[data-pane="1"] textarea[data-input-bar]');
    await bar1.fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm.get(1).snapshot().parkReason, undefined, { timeout: 30_000 });
    const one = await sid(win, 1);

    await bar1.click();
    await win.keyboard.press("Meta+c");
    await win.keyboard.press("Control+c");
    const until = (n: number) => new Promise<void>((resolve, reject) => {
      const started = Date.now();
      const poll = () => interrupts.length >= n ? resolve() : Date.now() - started > 10_000 ? reject(new Error(`waited for interrupt ${n}; ${interrupts.length} arrived`)) : setImmediate(poll);
      poll();
    });
    await until(1);
    await settled(win);
    if (interrupts.length !== 1 || interrupts[0] !== one) throw new Error(`⌘C then Ctrl+C in pane 1's empty prompt sent ${JSON.stringify(interrupts)}; expected one interrupt, for ${one}`);
    seen.push("⌘C sent no interrupt; Ctrl+C one, for pane 1's session");

    await bar1.fill("copy me");
    await bar1.press("Meta+a");
    await win.keyboard.press("Meta+c");
    const clip = await app.evaluate(({ clipboard }) => clipboard.readText());
    await settled(win);
    if (clip !== "copy me") throw new Error(`⌘C on a selection put ${JSON.stringify(clip)} on the clipboard`);
    if (interrupts.length !== 1) throw new Error(`⌘C on a selection sent an interrupt: ${JSON.stringify(interrupts)}`);
    seen.push("⌘C on a selection copied it");
    await bar1.fill("");

    await win.keyboard.press("Meta+d");
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 2, undefined, { timeout: 5_000 });
    await win.evaluate(() => (window as any).__vm.get(2).openSession({ driver: "deterministic" }));
    const bar2 = win.locator('[data-pane="2"] textarea[data-input-bar]');
    await bar2.waitFor({ timeout: 10_000 });
    const two = await sid(win, 2);
    await bar2.click();
    await win.keyboard.press("Control+c");
    await until(2);
    if (interrupts[1] !== two) throw new Error(`Ctrl+C in pane 2's prompt interrupted ${interrupts[1]}; pane 2's session is ${two}, pane 1's ${one}`);
    seen.push("Ctrl+C in pane 2 interrupted pane 2's session");

    console.log(`copy_key: ok — ${seen.join("; ")}`);
    code = 0;
  } catch (e) {
    console.error(`copy_key: FAIL — ${(e as Error).message}; passed: ${seen.join("; ") || "none"}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
