// harness/_electron_sprint080_exit.ts
//
// Sprint 080 exit test. Launches `electron .`, triggers each
// commandable menu item via app.evaluate + Menu.getMenuItemById,
// asserts the renderer received the menu event and acted on it.

import { _electron as electron } from "playwright";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

function freePort(port: number): void {
  const r = spawnSync("lsof", ["-iTCP:" + port, "-sTCP:LISTEN", "-t"], { encoding: "utf8" });
  const pids = r.status === 0 && r.stdout.trim()
    ? r.stdout.trim().split("\n").map((s) => Number(s.trim())).filter(Number.isFinite)
    : [];
  if (pids.length > 0) spawnSync("kill", ["-9", ...pids.map(String)]);
}

async function main(): Promise<void> {
  freePort(8765);
  const repoRoot = join(__dirname, "..");

  console.log("[exit] launching electron .");
  const app = await electron.launch({ args: [repoRoot], timeout: 30_000 });
  const stderr: string[] = [];
  app.process().stderr?.on("data", (c) => stderr.push(c.toString()));

  const win = await app.firstWindow({ timeout: 20_000 });
  await win.waitForFunction(
    () => document.querySelectorAll('[data-vm-atom-root="terminal"]').length >= 1,
    undefined,
    { timeout: 15_000 },
  );

  // Install a console hook in the renderer that records every menu
  // command it received. Rely on window.native.onMenuCommand — the
  // same subscription reveal.ts wires up.
  await win.evaluate(() => {
    (window as unknown as { __menuLog: string[] }).__menuLog = [];
    const nb = (window as unknown as { native?: { onMenuCommand?: (cb: (c: string, p: unknown) => void) => void } }).native;
    if (nb?.onMenuCommand) {
      nb.onMenuCommand((command, payload) => {
        (window as unknown as { __menuLog: string[] }).__menuLog.push(
          command + (payload ? "|" + JSON.stringify(payload) : ""),
        );
      });
    }
  });

  async function fire(itemId: string): Promise<void> {
    await app.evaluate(({ Menu }, id) => {
      const menu = Menu.getApplicationMenu();
      if (!menu) throw new Error("no application menu");
      const item = menu.getMenuItemById(id);
      if (!item) throw new Error("menu item not found: " + id);
      item.click();
    }, itemId);
    await new Promise((r) => setTimeout(r, 200));
  }

  // 1. new-session: pane count grows from 1 to 2.
  const panesBefore = await win.evaluate(() =>
    document.querySelectorAll('[data-vm-transcript-mount="terminal"]').length,
  );
  await fire("menu-new-session");
  await win.waitForFunction(
    () => document.querySelectorAll('[data-vm-transcript-mount="terminal"]').length >= 2,
    undefined,
    { timeout: 3_000 },
  );
  const panesAfter = await win.evaluate(() =>
    document.querySelectorAll('[data-vm-transcript-mount="terminal"]').length,
  );
  if (panesAfter <= panesBefore) throw new Error(`new-session did not add a pane: before=${panesBefore} after=${panesAfter}`);
  console.log(`[exit] new-session: panes ${panesBefore} → ${panesAfter}: ok`);

  // 2. toggle-reveal: state.revealed flips from false to true.
  const revealedBefore = await win.evaluate(() => {
    const root = document.getElementById("dc-root") as (HTMLElement & Record<string, unknown>) | null;
    const key = Object.keys(root ?? {}).find((k) => k.startsWith("__reactContainer"));
    if (!key || !root) return null;
    const stack: unknown[] = [((root[key] as { stateNode?: { current?: unknown } }).stateNode?.current)];
    while (stack.length > 0) {
      const cur = stack.pop();
      if (!cur) continue;
      const inst = (cur as { stateNode?: { logic?: { state?: { revealed?: boolean } } } }).stateNode;
      if (inst?.logic?.state && typeof inst.logic.state.revealed === "boolean") return inst.logic.state.revealed;
      const c = (cur as { child?: unknown }).child;
      const s = (cur as { sibling?: unknown }).sibling;
      if (s) stack.push(s);
      if (c) stack.push(c);
    }
    return null;
  });
  await fire("menu-toggle-reveal");
  await new Promise((r) => setTimeout(r, 300));
  const revealedAfter = await win.evaluate(() => {
    const root = document.getElementById("dc-root") as (HTMLElement & Record<string, unknown>) | null;
    const key = Object.keys(root ?? {}).find((k) => k.startsWith("__reactContainer"));
    if (!key || !root) return null;
    const stack: unknown[] = [((root[key] as { stateNode?: { current?: unknown } }).stateNode?.current)];
    while (stack.length > 0) {
      const cur = stack.pop();
      if (!cur) continue;
      const inst = (cur as { stateNode?: { logic?: { state?: { revealed?: boolean } } } }).stateNode;
      if (inst?.logic?.state && typeof inst.logic.state.revealed === "boolean") return inst.logic.state.revealed;
      const c = (cur as { child?: unknown }).child;
      const s = (cur as { sibling?: unknown }).sibling;
      if (s) stack.push(s);
      if (c) stack.push(c);
    }
    return null;
  });
  if (revealedBefore !== false || revealedAfter !== true) {
    throw new Error(`toggle-reveal did not flip: before=${revealedBefore} after=${revealedAfter}`);
  }
  console.log(`[exit] toggle-reveal: revealed ${revealedBefore} → ${revealedAfter}: ok`);

  // 3. Menu log should have both events.
  const log = await win.evaluate(() => (window as unknown as { __menuLog: string[] }).__menuLog);
  console.log("[exit] renderer menu log:", log);
  if (!log.includes("new-session") || !log.includes("toggle-reveal")) {
    throw new Error("menu log missing expected events: " + JSON.stringify(log));
  }

  await app.close();
  console.log("[exit] PASS");
}

main().catch((err) => {
  console.error("[exit] FAIL:", err);
  process.exit(1);
});
