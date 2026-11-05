// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The top bar's workspace card names the pane's real folder (sprint 234; plan
// PLAN-2026-11-04-shell-to-react-r5.md, B3, F328).
//
// Before: an unbound pane's card read "workspace ~/.substrate/sandbox · shape sandbox", and a pane on
// the default per-session sandbox read the same; the branch line showed the folder's path.
//
// Steps: on the unbound pane, click the workspace chip: the card reads "none yet". Bind pane 1 on the
// default folder (the per-session sandbox) and take one turn: the card names the folder the server
// reports for the session (home written ~), shape isolated, and no branch.

import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const chip = (win: Page) => win.locator('[data-top-bar] [data-dropdown-region="workspace"] > span').first();

async function cardText(win: Page): Promise<string> {
  await chip(win).click();
  const card = win.locator('[data-top-bar] [data-dropdown-region="workspace"] > span').nth(1);
  await card.waitFor({ state: "visible", timeout: 5_000 });
  const text = (await card.innerText()).replace(/\s+/g, " ").trim();
  await chip(win).click();
  await card.waitFor({ state: "hidden", timeout: 5_000 });
  return text;
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const seen: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await win.locator("input[data-ws-input]").first().waitFor({ state: "visible", timeout: 15_000 });

    const unbound = await cardText(win);
    if (unbound !== "workspace none yet — pick one in the pane shape — · branch —") throw new Error(`unbound pane's card reads "${unbound}"`);
    seen.push(`unbound "${unbound}"`);

    await bindPaneAsUser(win, "deterministic");
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    await settled(win);
    const path: string | null = await win.evaluate(() => (window as any).__vm.get(1).snapshot().workspacePath);
    if (!path) throw new Error("the session reports no workspace path");
    const want = `workspace ${path.replace(/^\/Users\/[^/]+/, "~")} shape isolated · branch —`;
    const bound = await cardText(win);
    if (bound !== want) throw new Error(`bound pane's card reads "${bound}"; expected "${want}"`);
    seen.push(`bound "${bound}"`);

    console.log(`workspace_card: ok — ${seen.join("; ")}`);
    code = 0;
  } catch (e) {
    console.error(`workspace_card: FAIL — ${(e as Error).message}; passed: ${seen.join("; ") || "none"}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
