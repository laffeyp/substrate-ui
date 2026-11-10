// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Editor edge states (sprint 395, Phase 1): read-only bar on ended session, no read-only bar on
// live session. The test binds pane 1, opens a session, opens the editor, checks no read-only bar,
// ends the session, re-attaches, opens the editor, checks the read-only bar.

import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

type Vm = {
  get(id: number): {
    snapshot(): { sessionId: string | null; parkReason: unknown; endedReason: unknown };
    endSession(r?: string): Promise<void>;
    attachExisting(id: string): Promise<void>;
  } | null;
};

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);

    const sendCmd = async (cmd: string) => win.evaluate((c) => {
      const sh = (window as any).__substrateShell;
      if (sh) for (const fn of [...sh.channel.listeners]) fn(c);
    }, cmd);

    // Bind and open a session with the deterministic driver.
    await bindPaneAsUser(win, "deterministic");

    // Send a message to populate the snapshot (workspacePath needs a round-trip).
    const prompt = win.locator("[data-input-bar]").first();
    await prompt.waitFor({ state: "visible", timeout: 15_000 });
    await prompt.click();
    await prompt.type("hello", { delay: 10 });
    await win.keyboard.press("Enter");
    await win.waitForFunction(
      () => (window as unknown as { __vm: Vm }).__vm.get(1)?.snapshot().parkReason != null,
      undefined,
      { timeout: 60_000 },
    );

    const sid = await win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().sessionId);
    if (!sid) throw new Error("no session opened");

    // 1. Open editor on live session — no read-only bar.
    await sendCmd("toggle-editor");
    await win.locator("[data-editor-shell]").first().waitFor({ state: "visible", timeout: 5_000 });
    const readOnlyLive = await win.locator("[data-editor-readonly]").count();
    if (readOnlyLive > 0) throw new Error("read-only bar visible on live session");
    console.log("OK — live session: no read-only bar");

    // 2. Close editor, end session.
    await sendCmd("toggle-editor");
    await win.waitForFunction(() => document.querySelector("[data-editor-shell]") === null, undefined, { timeout: 5_000 });
    await win.evaluate(async () => {
      await (window as unknown as { __vm: Vm }).__vm.get(1)!.endSession("user_end");
    });

    // 3. Re-attach to the ended session.
    await win.evaluate(async (id) => {
      await (window as unknown as { __vm: Vm }).__vm.get(1)!.attachExisting(id);
    }, sid);
    await win.waitForFunction(
      () => (window as unknown as { __vm: Vm }).__vm.get(1)?.snapshot().endedReason != null,
      undefined,
      { timeout: 15_000 },
    );

    // 4. Open editor on ended session — read-only bar with "session ended".
    await sendCmd("toggle-editor");
    await win.locator("[data-editor-shell]").first().waitFor({ state: "visible", timeout: 5_000 });
    const readOnlyEl = win.locator("[data-editor-readonly]").first();
    await readOnlyEl.waitFor({ state: "visible", timeout: 5_000 });
    const text = await readOnlyEl.textContent();
    if (!text || !text.includes("session ended")) throw new Error("read-only bar text: " + JSON.stringify(text));
    console.log("OK — ended session: read-only bar shows 'session ended'");

    console.log("\nPASS — edge states gate (sprint 395)");
    code = 0;
  } catch (err: any) {
    console.error("FAIL:", err.message);
  } finally {
    await app.close().catch(() => {});
    process.exit(code);
  }
}

main();
