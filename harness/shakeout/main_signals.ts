// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Electron main's signals (vocabulary v0.10; plan 2026-11-05-sdd-signals item 4, sprint 356), read
// from the launch's main.jsonl. Steps:
//   - the app boots: SERVER_SPAWNED, SERVER_BOUND (T1: within 5 s; its port is server.jsonl's
//     SERVER_STARTED port), WINDOW_OPENED boot;
//   - the window opens the folder dialog twice, picked then cancelled, and the record dialog
//     cancelled: three NATIVE_DIALOG_CLOSED. The dialog is replaced in main; no real panel opens;
//   - View ▸ Meta twice: two MENU_COMMAND_SENT toggle-meta;
//   - a substrate://record/ link: DEEP_LINK_RECEIVED record;
//   - window.open of an outside page: NAVIGATION_BLOCKED external. shell.openExternal is replaced,
//     so no browser opens;
//   - File ▸ New Window, then that window closed: WINDOW_OPENED menu and WINDOW_CLOSED, both with
//     window 2's id;
//   - quit: APP_QUIT_REQUESTED app, SERVER_EXITED expected, APP_QUIT_COMPLETED last.
// Every window-scoped record carries its window's id in the record context. Run against a bundle
// with SHAKEOUT_APP=<Substrate.app>.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { launchArgs, waitForApp } from "./lib/electron";

type Rec = { proc_seq: number; window_id: number | null; name: string; payload: Record<string, unknown> };
const read = (p: string): Rec[] => readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Rec);

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const logs = await app.evaluate(({ app: a }) => a.getPath("logs"));
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ dialog, shell }) => {
      let calls = 0;
      (dialog as unknown as { showOpenDialog: unknown }).showOpenDialog = async () => {
        calls += 1;
        return calls === 1 ? { canceled: false, filePaths: ["/tmp"] } : { canceled: true, filePaths: [] };
      };
      (shell as unknown as { openExternal: unknown }).openExternal = async () => undefined;
    });
    await win.evaluate(async () => {
      const n = (window as unknown as { native: { pickFolder(): Promise<string | null>; openRecordDialog(): Promise<string | null> } }).native;
      await n.pickFolder();
      await n.pickFolder();
      await n.openRecordDialog();
    });
    for (let i = 0; i < 2; i++) {
      await app.evaluate(({ Menu }) => { Menu.getApplicationMenu()?.getMenuItemById("menu-toggle-meta")?.click(); });
    }
    await app.evaluate(({ app: a }) => { a.emit("open-url", { preventDefault() { /* test */ } }, "substrate://record/no-such-record"); });
    await win.evaluate(() => { window.open("https://example.com/", "_blank"); });
    const second = app.waitForEvent("window");
    await app.evaluate(({ Menu }) => { Menu.getApplicationMenu()?.getMenuItemById("menu-new-window")?.click(); });
    const win2 = await second;
    await waitForApp(win2);
    const id2 = await app.evaluate(({ BrowserWindow }) => {
      const ws = BrowserWindow.getAllWindows();
      const w = ws.reduce((a, b) => (b.id > a.id ? b : a));
      const id = w.id;
      w.close();
      return id;
    });
    await win2.waitForEvent("close", { timeout: 10_000 }).catch(() => undefined);
    await app.close();

    const root = join(logs, "traces");
    const dir = join(root, readdirSync(root).sort().pop()!);
    const m = read(join(dir, "main.jsonl"));
    const server = read(join(dir, "server.jsonl"));
    const want: [string, (r: Rec) => boolean][] = [
      ["APP_BOOTED", () => true],
      ["SERVER_SPAWNED", (r) => typeof r.payload.pid === "number" && typeof r.payload.packaged === "boolean"],
      ["SERVER_BOUND", (r) => r.payload.port === server[0]?.payload.port && Number(r.payload.ms) <= 5000],
      ["WINDOW_OPENED", (r) => r.payload.cause === "boot" && r.window_id === 1],
      ["NATIVE_DIALOG_CLOSED", (r) => r.payload.dialog === "pick_folder" && r.payload.outcome === "picked" && r.window_id === 1],
      ["NATIVE_DIALOG_CLOSED", (r) => r.payload.dialog === "pick_folder" && r.payload.outcome === "cancelled" && r.window_id === 1],
      ["NATIVE_DIALOG_CLOSED", (r) => r.payload.dialog === "open_record" && r.payload.outcome === "cancelled" && r.window_id === 1],
      ["MENU_COMMAND_SENT", (r) => r.payload.command === "toggle-meta" && r.window_id === 1],
      ["MENU_COMMAND_SENT", (r) => r.payload.command === "toggle-meta" && r.window_id === 1],
      ["DEEP_LINK_RECEIVED", (r) => r.payload.link_kind === "record" && r.window_id === null],
      ["NAVIGATION_BLOCKED", (r) => r.payload.target_kind === "external" && r.window_id === 1],
      ["WINDOW_OPENED", (r) => r.payload.cause === "menu" && r.window_id === id2],
      ["WINDOW_CLOSED", (r) => r.window_id === id2],
      ["APP_QUIT_REQUESTED", (r) => r.payload.cause === "app"],
      ["SERVER_EXITED", (r) => r.payload.expected === true],
      ["APP_QUIT_COMPLETED", () => true],
    ];
    // The wanted records in this order; other records may sit between them.
    let i = 0;
    for (const r of m) if (i < want.length && r.name === want[i][0] && want[i][1](r)) i += 1;
    if (i < want.length) {
      throw new Error(`main.jsonl lacks ${want[i][0]} (step ${i + 1} of ${want.length}) in order:\n${m.map((r) => `  ${r.proc_seq} ${r.name} w${r.window_id} ${JSON.stringify(r.payload)}`).join("\n")}`);
    }
    if (m[m.length - 1].name !== "APP_QUIT_COMPLETED") throw new Error(`main.jsonl ends with ${m[m.length - 1].name}`);
    if (m.filter((r) => r.name === "APP_QUIT_REQUESTED").length !== 1) throw new Error("APP_QUIT_REQUESTED is not written once");
    if (process.env.TRACE_PRINT) for (const r of m) console.log(JSON.stringify(r));
    console.log(`main_signals: ok — ${want.length} main records in order, window ids in context, SERVER_BOUND port ${String(server[0]?.payload.port)} matches SERVER_STARTED`);
    code = 0;
  } catch (e) {
    console.error(`main_signals: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
