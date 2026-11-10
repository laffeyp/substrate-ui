// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's files tree on real folders, read four ways (sprints 410 and 411).
//
// The gate writes two real folders under harness/shakeout/.scratch/: a small one whose names sort
// differently with and without case, three levels deep (Addendum A3), and a large one (40 folders of
// 25 files, one folder of 600 files). For each it binds pane 1 to the folder through the picker,
// presses ⌘⇧E, and clicks folders open. After each step it waits for the screen to settle (Addendum
// A4: a condition, never a sleep) and reads:
//   1. the truth: the rows the folder on disk gives, sorted as the server sorts (folders first, then
//      by name without case, then by name);
//   2. the DOM: the rows drawn, by path, kind and depth;
//   3. the pixels: a screenshot of the running window decoded with harness/pixel/png.ts (Addendum
//      A2): the pixel anchor at the view's bottom-left corner (web/app/derive/anchor.ts), and which
//      16 px row bands of the tree hold ink;
// and after the app closes:
//   4. the signals: the EDITOR_DRAWN record in window-1.jsonl whose proc_seq the anchor carries must
//      hold the fields the pixels carry, and each FILES_LISTED in server.jsonl the entry count of the
//      folder on disk, in the order the folders were read.
// SHAKEOUT_APP=<Substrate.app> runs the bundle and requires its APP_BOOTED to read packaged: true.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, lstatSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords, type Launch } from "./lib/electron";
import type { Anchor } from "../../web/app/derive/anchor";
import { readPixels } from "./lib/editor_pixels";

const REPO_ROOT = join(__dirname, "..", "..");

interface Want { rel: string; kind: string; depth: number }

/** The rows the tree should draw for these open folders, from the disk, sorted as server.py
 *  _workspace_list sorts: folders first, then by name without case, then by name. */
function truth(root: string, open: Set<string>): Want[] {
  const out: Want[] = [];
  const walk = (rel: string, depth: number) => {
    const names = readdirSync(join(root, rel)).filter((n) => n !== ".git");
    const items = names.map((name) => {
      const st = lstatSync(join(root, rel, name));
      return { name, kind: st.isSymbolicLink() ? "link" : st.isDirectory() ? "dir" : "file" };
    }).sort((a, b) => (Number(a.kind !== "dir") - Number(b.kind !== "dir")) || (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const it of items) {
      const child = rel ? rel + "/" + it.name : it.name;
      out.push({ rel: child, kind: it.kind, depth });
      if (it.kind === "dir" && open.has(child)) walk(child, depth + 1);
    }
  };
  walk("", 0);
  return out;
}

function makeSmall(root: string): void {
  const files = ["Zeta/one.txt", "alpha/inner/deeper/z.txt", "alpha/inner/deep.json", "alpha/x.ts", "alpha/Y.ts", "beta.txt", "Alpha.md", "a.py", "README"];
  for (const f of files) { mkdirSync(join(root, f, ".."), { recursive: true }); writeFileSync(join(root, f), f + "\n"); }
}
function makeLarge(root: string): void {
  for (let d = 0; d < 40; d++) for (let f = 0; f < 25; f++) { const dir = join(root, `d${String(d).padStart(2, "0")}`); mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, `f${String(f).padStart(2, "0")}.txt`), "x\n"); }
  mkdirSync(join(root, "big"), { recursive: true });
  for (let f = 0; f < 600; f++) writeFileSync(join(root, "big", `file-${String(f).padStart(3, "0")}.txt`), "x\n");
  for (const f of ["notes.md", "setup.cfg", "Makefile"]) writeFileSync(join(root, f), "x\n");
}

interface Reading { step: string; anchor: Anchor; inked: number; fit: number; shot: string }

/** One screenshot, decoded: the anchor's cells and the tree's inked row bands. */
async function domRows(win: Page): Promise<Want[]> {
  return win.evaluate(() => Array.from(document.querySelectorAll("[data-tree-row]")).map((e) => ({ rel: e.getAttribute("data-tree-row")!, kind: e.getAttribute("data-tree-kind")!, depth: Number(e.getAttribute("data-tree-depth")) })));
}

async function size(app: ElectronApplication, win: Page, w: number, h: number): Promise<void> {
  await app.evaluate(({ BrowserWindow }, [cw, ch]) => { BrowserWindow.getAllWindows()[0].setContentSize(cw, ch); }, [w, h]);
  await win.waitForFunction((cw) => window.innerWidth === cw, w, { timeout: 10_000 });
  await settled(win);
}

/** Run one folder: bind, open the editor, open each folder in turn, read every step. */
async function runFolder(name: string, root: string, opens: string[], shots: string): Promise<{ readings: Reading[]; listed: number[]; launch: Launch; packagedOk: string }> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const readings: Reading[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await size(app, win, 1512, 945);
    await bindPaneAsUser(win, "deterministic", { folder: root });
    // A bound pane's session is created by its first message; until then ⌘⇧E is refused (no_session).
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    await win.keyboard.press("Meta+Shift+E");
    await win.locator("[data-editor-view]").first().waitFor({ state: "visible", timeout: 10_000 });
    const open = new Set<string>();
    const steps: [string, string | null][] = [["the top folder", null], ...opens.map((o): [string, string] => [`open ${o}/`, o])];
    for (const [step, folder] of steps) {
      if (folder) { await win.locator(`[data-tree-row="${folder}"]`).first().click(); open.add(folder); }
      const want = truth(root, open);
      // Settle: the DOM holds the rows the disk gives, and the screen's anchor carries that count.
      const file = join(shots, `${name}-${readings.length}.png`);
      const deadline = Date.now() + 15_000;
      let got = await readPixels(win, file, want.length);
      let dom = await domRows(win);
      while (Date.now() < deadline && !(dom.length === want.length && !("error" in got.anchor) && got.anchor.tree_rows === want.length)) {
        await settled(win);
        dom = await domRows(win);
        got = await readPixels(win, file, want.length);
      }
      if (JSON.stringify(dom) !== JSON.stringify(want)) {
        const at = want.findIndex((w, i) => JSON.stringify(w) !== JSON.stringify(dom[i]));
        throw new Error(`${name}, ${step}: the DOM draws ${dom.length} rows, the disk gives ${want.length}; first difference at row ${at}: drawn ${JSON.stringify(dom[at])}, on disk ${JSON.stringify(want[at])}`);
      }
      if ("error" in got.anchor) throw new Error(`${name}, ${step}: the pixel anchor does not decode: ${got.anchor.error}`);
      if (got.anchor.tree_rows !== want.length) throw new Error(`${name}, ${step}: the pixels say ${got.anchor.tree_rows} rows, the disk ${want.length}`);
      if (got.fit === 0 || got.inked !== got.fit) throw new Error(`${name}, ${step}: ${got.inked} of the ${got.fit} row bands inside the tree's visible box hold ink`);
      readings.push({ step, anchor: got.anchor, inked: got.inked, fit: got.fit, shot: file });
      if (step === "the top folder") console.log(`  ${name}: the tree as the pixels and DOM agree:\n${want.slice(0, 12).map((w) => "    " + "  ".repeat(w.depth) + (w.kind === "dir" ? "▸ " : "") + w.rel.split("/").pop() + (w.kind === "dir" ? "/" : "")).join("\n")}${want.length > 12 ? `\n    … ${want.length - 12} more` : ""}`);
    }
    await app.close();
    // The signals, read once the files are complete.
    const recs = windowRecords(launch);
    for (const r of readings) {
      const rec = recs.find((x) => x.proc_seq === r.anchor.seq);
      if (!rec || rec.name !== "EDITOR_DRAWN") throw new Error(`${name}, ${r.step}: the pixels carry proc_seq ${r.anchor.seq}; window-1.jsonl holds ${rec ? rec.name : "no record"} there`);
      const p = rec.payload;
      const same = p.tree_rows === r.anchor.tree_rows && p.modified_dots === r.anchor.modified_dots && p.left_folded === r.anchor.left_folded && p.right_folded === r.anchor.right_folded
        && p.bottom_folded === r.anchor.bottom_folded && (p.dock === "right") === r.anchor.dock_right && p.sides_swapped === r.anchor.sides_swapped && p.focus === r.anchor.focus;
      if (!same) throw new Error(`${name}, ${r.step}: the pixels ${JSON.stringify(r.anchor)} and the record ${JSON.stringify(p)} disagree`);
    }
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const lines = (f: string) => readFileSync(join(traces, boot, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const listed = lines("server.jsonl").filter((r) => r.name === "FILES_LISTED").map((r) => Number(r.payload.entries));
    const booted = lines("main.jsonl").find((r) => r.name === "APP_BOOTED");
    return { readings, listed, launch, packagedOk: `packaged=${String(booted?.payload.packaged)} vocabulary=${String(booted?.payload.vocab_version)}` };
  } catch (e) {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: true });
    throw e;
  }
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-411-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const base = join(__dirname, ".scratch", "editor-tree-" + process.pid);
  const small = join(base, "small"), large = join(base, "large");
  mkdirSync(small, { recursive: true }); mkdirSync(large, { recursive: true });
  makeSmall(small); makeLarge(large);
  let code = 1;
  try {
    const plans: [string, string, string[]][] = [
      ["small", small, ["alpha", "alpha/inner", "alpha/inner/deeper", "Zeta"]],
      ["large", large, ["d00", "big", "d39"]],
    ];
    for (const [name, root, opens] of plans) {
      const { readings, listed, launch, packagedOk } = await runFolder(name, root, opens, shots);
      const wantListed = ["", ...opens].map((rel) => readdirSync(join(root, rel)).length);
      if (JSON.stringify(listed) !== JSON.stringify(wantListed)) { launch.cleanup({ keep: true }); throw new Error(`${name}: FILES_LISTED entries ${JSON.stringify(listed)}, the disk ${JSON.stringify(wantListed)}`); }
      if (packaged && !packagedOk.startsWith("packaged=true")) { launch.cleanup({ keep: true }); throw new Error(`${name}: APP_BOOTED ${packagedOk}`); }
      launch.cleanup();
      console.log(`editor_tree: ${name} ok — ${readings.map((r) => `${r.step}: ${r.anchor.tree_rows} rows (pixels seq ${r.anchor.seq} = EDITOR_DRAWN; ${r.inked}/${r.fit} bands inked)`).join("; ")}; FILES_LISTED ${JSON.stringify(listed)} = disk; ${packagedOk}`);
    }
    console.log(`editor_tree: ok — screenshots in ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`editor_tree: FAIL — ${(e as Error).message}`);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
