// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window's keys inside the editor (sprint 417; roadmap 2026-11-09-code-editor r8, E1; D49 (c),
// spec r6 §4, D86). Real key presses on the running window: ⌘D and ⌘⇧D are refused (the editor does
// not split), ⌘, opens settings over the editor and Escape closes them back to it, ⌘3 opens the assay
// page and Escape returns to the editor, ⌘M goes to meta. These agree:
//   DOM    — the editor still shown after each refusal, one pane, the dialog and page over the editor;
//   pixels — the anchor decodes after the refusals and names an EDITOR_DRAWN (lib/editor_pixels.ts);
//   signals (after close) — EDITOR_KEY_REFUSED for Meta+d and Meta+Shift+D with reason no_split, no
//            PANE_OPENED for a second pane, DIALOG_OPENED and DIALOG_CLOSED, and VIEW_CHANGED in order.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels } from "./lib/editor_pixels";

const REPO_ROOT = join(__dirname, "..", "..");
const shown = (win: Page, sel: string) => win.evaluate((q) => Array.from(document.querySelectorAll(q)).some((e) => (e as HTMLElement).offsetParent !== null), sel);

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-417-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const folder = mkdtempSync(join(tmpdir(), "editor-keys-"));
  writeFileSync(join(folder, "a.txt"), "a\n");
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await win.waitForFunction(() => window.innerWidth === 1512, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, "deterministic", { folder });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    await win.keyboard.press("Meta+Shift+E");
    await win.locator("[data-editor-view]").first().waitFor({ state: "visible", timeout: 10_000 });
    await settled(win);

    for (const k of ["Meta+d", "Meta+Shift+D"]) {
      await win.keyboard.press(k);
      await settled(win);
      if (!(await shown(win, "[data-editor-view]"))) throw new Error(`${k} left the editor`);
    }
    const px = await readPixels(win, join(shots, "after-refusals.png"), 0);
    if ("error" in px.anchor) throw new Error(`after the refusals the pixel anchor does not decode: ${px.anchor.error}`);

    await win.keyboard.press("Meta+,");
    await win.waitForFunction(() => ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).some((s) => s.name === "DIALOG_OPENED"), undefined, { timeout: 10_000 });
    await win.keyboard.press("Escape");
    await win.waitForFunction(() => ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).some((s) => s.name === "DIALOG_CLOSED"), undefined, { timeout: 10_000 });
    await settled(win);
    if (!(await shown(win, "[data-editor-view]"))) throw new Error("Escape on the settings dialog left the editor");

    await win.keyboard.press("Meta+3");
    await win.locator("[data-editor-view]").first().waitFor({ state: "detached", timeout: 10_000 });
    await win.keyboard.press("Escape");
    await win.locator("[data-editor-view]").first().waitFor({ state: "visible", timeout: 10_000 });
    await win.keyboard.press("Meta+m");
    await win.locator("[data-editor-view]").first().waitFor({ state: "detached", timeout: 10_000 });

    await app.close();
    const recs = windowRecords(launch);
    const refused = recs.filter((r) => r.name === "EDITOR_KEY_REFUSED").map((r) => `${String(r.payload.key)}:${String(r.payload.reason)}`);
    if (JSON.stringify(refused) !== JSON.stringify(["Meta+d:no_split", "Meta+Shift+D:no_split"])) throw new Error(`EDITOR_KEY_REFUSED: ${JSON.stringify(refused)}`);
    const opened = recs.filter((r) => r.name === "PANE_OPENED").map((r) => r.pane_id);
    if (opened.some((p) => p !== 1)) throw new Error(`a pane other than 1 opened: ${JSON.stringify(opened)}`);
    const dialogs = recs.filter((r) => r.name.startsWith("DIALOG_")).map((r) => r.name);
    if (JSON.stringify(dialogs) !== JSON.stringify(["DIALOG_OPENED", "DIALOG_CLOSED"])) throw new Error(`dialog records: ${JSON.stringify(dialogs)}`);
    const views = recs.filter((r) => r.name === "VIEW_CHANGED").map((r) => `${String(r.payload.cause)} ${String(r.payload.from)}→${String(r.payload.to)}`);
    const wantViews = ["key panes→editor", "key editor→assay", "close assay→editor", "key editor→meta"];
    if (JSON.stringify(views) !== JSON.stringify(wantViews)) throw new Error(`VIEW_CHANGED: ${views.join("; ")}`);
    const anchor = px.anchor;
    const rec = recs.find((r) => r.proc_seq === anchor.seq);
    if (!rec || rec.name !== "EDITOR_DRAWN") throw new Error(`the pixels name seq ${anchor.seq}; window-1.jsonl holds ${rec ? rec.name : "nothing"}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_keys: ok — refused ${refused.join(", ")}; one pane; settings opened and closed over the editor; VIEW_CHANGED ${views.join(", ")}; pixels seq ${anchor.seq} = EDITOR_DRAWN; packaged=${String(booted.packaged)}`);
    code = 0;
  } catch (e) {
    console.error(`editor_keys: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
