// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A record opened read-only, written with how it was asked for and whether it opened (RECORD_OPENED,
// vocabulary v0.19, sprint 371). After one turn in pane 1, whose record is the fixture:
//   File ▸ Open Record…, with main's folder dialog answering that record's folder (no panel opens);
//   a substrate://record/ link to the same record; a substrate://record/ link to a record that does
//   not exist, whose stream errors (refused).
// window-1.jsonl then holds exactly three RECORD_OPENED, in that order, each in pane 1's context:
// open_record attached, deep_link attached, deep_link refused. Run panes (how run) are checked in
// run_panes.ts.

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp, windowRecords } from "./lib/electron";

const visible = (win: Page, sel: string) => win.locator(sel).filter({ visible: true }).first();
const opened = (win: Page, n: number, what: string) => win.waitForFunction((want) => ((window as any).__vmSignals ?? []).filter((s: { name: string }) => s.name === "RECORD_OPENED").length >= want, n, { timeout: 15_000 })
  .catch(() => { throw new Error(`${what} wrote no RECORD_OPENED`); });

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic");
    await visible(win, "textarea[data-input-bar]").fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    const sid = await win.evaluate(() => (window as any).__vm.get(1).snapshot().sessionId as string);
    // The session's record, under the launch's SUBSTRATE_HOME (server.py _sessions_base).
    const dir = join(launch.state, "sessions", sid);
    const root = join(dir, "record");
    if (!existsSync(root)) throw new Error(`no record at ${root}; ${dir} holds ${existsSync(dir) ? readdirSync(dir).join(", ") : "nothing"}`);

    await app.evaluate(({ dialog }, folder) => {
      (dialog as unknown as { showOpenDialog: unknown }).showOpenDialog = async () => ({ canceled: false, filePaths: [folder] });
    }, root);
    await app.evaluate(({ Menu }) => { Menu.getApplicationMenu()?.getMenuItemById("menu-open-record")?.click(); });
    await opened(win, 1, "File ▸ Open Record…");
    await app.evaluate(({ app: a }, url) => { a.emit("open-url", { preventDefault() { /* test */ } }, url); }, `substrate://record/${encodeURIComponent(root)}`);
    await opened(win, 2, "the link to the record");
    await app.evaluate(({ app: a }) => { a.emit("open-url", { preventDefault() { /* test */ } }, "substrate://record/no-such-record"); });
    await opened(win, 3, "the link to no record");

    // The trace, read once the app has closed and its files are complete.
    await app.close();
    const got = windowRecords(launch).filter((r) => r.name === "RECORD_OPENED");
    const lines = got.map((r) => `pane=${String(r.pane_id)} pane_id=${String(r.payload.pane_id)} how=${String(r.payload.how)} outcome=${String(r.payload.outcome)}`);
    const want = ["pane=1 pane_id=1 how=open_record outcome=attached", "pane=1 pane_id=1 how=deep_link outcome=attached", "pane=1 pane_id=1 how=deep_link outcome=refused"];
    if (lines.join("\n") !== want.join("\n")) throw new Error(`RECORD_OPENED in window-1.jsonl:\n  ${lines.join("\n  ") || "none"}\nwant:\n  ${want.join("\n  ")}`);
    console.log(`record_open_signals: ok — ${want.length} RECORD_OPENED in order: open_record attached, deep_link attached, deep_link refused (record ${root})`);
    code = 0;
  } catch (e) {
    console.error(`record_open_signals: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
