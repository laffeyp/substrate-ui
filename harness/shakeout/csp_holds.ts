// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The page's Content-Security-Policy holds (sprint 333; plan PLAN-2026-11-04-shell-to-react-r5.md,
// E6, F320, F344).
//
// Before: no policy, so Electron warned of an insecure one on every load, and none could be set while
// dc-runtime evaluated the shell from a string (F344). Now reveal.html sets default-src, script-src,
// style-src and connect-src to 'self' and img-src to 'self' and data:.
//
// Steps: the page carries the policy; every violation is counted from the first script on (a listener
// for `securitypolicyviolation`, installed before the page loads and kept across a reload, and every
// console line that starts "Refused to"); the window is driven
// through a bound turn, meta's five lenses, the side graph, find, the records page, the settings dialog
// and back. No violation, and no "Insecure Content-Security-Policy" warning, appears.

import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const POLICY = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'";

async function main(): Promise<void> {
  const launch = launchArgs({ csp: "enforce" });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const refused: string[] = [];
  const seen: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    win.on("console", (m) => { const t = m.text(); if (/^Refused to|Insecure Content-Security-Policy/.test(t)) refused.push(t.slice(0, 200)); });
    // The listener goes in before the page's first script: installed for the next load, then a reload.
    await win.addInitScript(() => {
      const w = window as unknown as { __csp: string[] };
      w.__csp = [];
      document.addEventListener("securitypolicyviolation", (ev) => w.__csp.push(`${ev.violatedDirective} ${ev.blockedURI}`));
    });
    await waitForApp(win);
    await win.reload();
    await waitForApp(win);
    const policy = await win.evaluate(() => document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute("content") ?? null);
    if (policy !== POLICY) throw new Error(`the page's policy reads ${JSON.stringify(policy)}`);
    if (!await win.evaluate(() => Array.isArray((window as unknown as { __csp?: string[] }).__csp))) throw new Error("the violation listener did not load before the page");
    seen.push("policy set");

    const click = async (text: string) => { await win.getByText(text, { exact: true }).filter({ visible: true }).first().click(); await settled(win); };
    await bindPaneAsUser(win, "deterministic");
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm.get(1).snapshot().parkReason, undefined, { timeout: 30_000 });
    await win.keyboard.press("Meta+m");
    await win.locator("[data-meta-view]").waitFor({ timeout: 10_000 });
    for (const lens of ["i/o", "structure", "language", "scene", "stream+graph"]) await click(lens);
    await click("→ side");
    await click("⇅ down");
    await win.keyboard.press("Meta+f");
    await win.keyboard.type("hello");
    await settled(win);
    await win.keyboard.press("Escape");
    await win.keyboard.press("Meta+m");
    await win.locator("[data-top-bar] span").filter({ hasText: /^records$/ }).first().click();
    await win.locator('[data-app-mount="records"]').waitFor({ timeout: 5_000 });
    await settled(win);
    await win.keyboard.press("Escape");
    await win.keyboard.press("Meta+,");
    await settled(win);
    await win.keyboard.press("Escape");
    await settled(win);
    seen.push("a turn, five lenses, side and down, find, records, settings");

    const events = await win.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
    if (events.length || refused.length) throw new Error(`violations: ${JSON.stringify([...events, ...refused])}`);
    seen.push("no violation, no insecure-policy warning");
    console.log(`csp_holds: ok — ${seen.join("; ")}`);
    code = 0;
  } catch (e) {
    console.error(`csp_holds: FAIL — ${(e as Error).message}; passed: ${seen.join("; ") || "none"}; console: ${JSON.stringify(refused)}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
