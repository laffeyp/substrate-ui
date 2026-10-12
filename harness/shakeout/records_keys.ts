// The records page takes the workspace picker's keys (UI sprint 156).
//
// Steps: five sessions in a repo-local folder over the API (the page leaves out $TMPDIR paths);
// the records page; ↓ until the folder's row is lit; → opens it; ↓ lights its first session; ←
// lights the folder and folds it; ⇧↵ opens it again; ↓ then ↵ opens that session in pane 1 and
// leaves the records page.

import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { launchArgs, waitForApp } from "./lib/electron";

// Plain-string evaluate: esbuild's __name helper does not exist in the page.
const STATE = `(() => {
  const lit = document.querySelector('[data-records-lit="1"]');
  const sessions = document.querySelectorAll('[data-records-session]');
  return {
    lit: lit ? (lit.textContent || "").replace(/\\s+/g, " ").trim() : "",
    litIsSession: !!lit && lit.hasAttribute("data-records-session"),
    sessions: sessions.length,
    onRecords: !!document.querySelector("[data-records-workspaces]"),
  };
})()`;
type S = { lit: string; litIsSession: boolean; sessions: number; onRecords: boolean };
async function press(win: Page, key: string): Promise<S> {
  await win.keyboard.press(key);
  await win.waitForTimeout(150);
  return win.evaluate(STATE) as Promise<S>;
}

async function main(): Promise<void> {
  const folder = join(__dirname, ".scratch", "records-keys-" + process.pid);
  mkdirSync(folder, { recursive: true });
  const leaf = folder.split("/").pop()!;
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    for (let i = 0; i < 5; i++) {
      await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: "deterministic", workspace: ${JSON.stringify(folder)}, name: "fixture-${i}" }) }).then((r) => { if (!r.ok) throw new Error("open " + r.status); })`);
    }
    await win.evaluate(`window.__vm.loadRecentWorkspaces()`);
    await win.locator("[data-top-bar] span", { hasText: /^records$/ }).first().click();
    await win.waitForFunction(`Array.from(document.querySelectorAll("[data-records-workspaces] span")).some((e) => (e.textContent || "").endsWith(${JSON.stringify(leaf)}))`, undefined, { timeout: 10_000 });
    await win.evaluate(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`);

    let s = await press(win, "ArrowDown");
    for (let i = 0; i < 10 && !s.lit.includes(leaf); i++) s = await press(win, "ArrowDown");
    if (!s.lit.includes(leaf)) throw new Error(`↓ never lit the folder's row: ${JSON.stringify(s)}`);
    const folderRow = s.lit;
    s = await press(win, "ArrowRight");
    await win.waitForFunction(`document.querySelectorAll("[data-records-session]").length > 0`, undefined, { timeout: 10_000 })
      .catch(() => { throw new Error("→ on the folder's row showed no session"); });
    s = await press(win, "ArrowDown");
    if (!s.litIsSession) throw new Error(`↓ under the opened row lit ${JSON.stringify(s)}`);
    s = await press(win, "ArrowLeft");
    if (s.lit !== folderRow || s.sessions !== 0) throw new Error(`← on a session gave ${JSON.stringify(s)}; want the folder lit and folded`);
    s = await press(win, "Shift+Enter");
    await win.waitForFunction(`document.querySelectorAll("[data-records-session]").length > 0`, undefined, { timeout: 10_000 })
      .catch(() => { throw new Error("⇧↵ on the folder's row did not open it"); });
    s = await press(win, "ArrowDown");
    if (!s.litIsSession) throw new Error(`↓ after ⇧↵ lit ${JSON.stringify(s)}`);
    const name = s.lit.split(" ")[0];
    s = await press(win, "Enter");
    await win.waitForFunction(`!document.querySelector("[data-records-workspaces]") && !!window.__vm.get(1).snapshot().sessionId`, undefined, { timeout: 10_000 })
      .catch(async () => { throw new Error(`↵ on ${name} did not open it: ${JSON.stringify(await win.evaluate(STATE))}`); });
    const opened = await win.evaluate(`window.__vm.get(1).snapshot().sessionName || ""`) as string;
    console.log(`records_keys: ok — ↓ lit the folder, → opened it, ↓ lit a session, ← folded back to the folder, ⇧↵ reopened, ↵ opened ${name} in pane 1 (${opened || "attached"})`);
    code = 0;
  } catch (e) {
    console.error(`records_keys: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
