// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The tree's find by name (sprint 437; research RESEARCH-2026-11-10-editor-search-r2; VS Code's Explorer
// find). A plain folder written here, no git: src/cart/Cart.ts, src/cart/index.ts, src/lib/checkout.ts,
// src/lib/tax.ts, README.md, and build/cart.js ignored by .gitignore. These agree:
//   ⌥⌘F with the tree focused opens the tree's find, not the inspector's replace;
//   `cart`, filter: only src, src/cart and src/cart/Cart.ts, though src was never opened; the letters lit;
//   build/cart.js absent (ignored);
//   highlight: the tree as it was, src badged 2; ↓ reveals src/cart, ↓ again src/cart/Cart.ts, ↵ opens it;
//   `ckt` fuzzy finds src/lib/checkout.ts; continuous finds nothing and says so;
//   Escape closes the find and the tree keeps the folders the find opened;
//   signals — EDITOR_TREE_FOUND filter and highlight with the drawn counts; FILES_FOUND for each; the name in
//   no trace (E1).
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
async function until<T>(win: Page, what: string, read: () => Promise<T> | T, ok: (v: T) => boolean): Promise<T> {
  const deadline = Date.now() + 10_000;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const rows = (win: Page) => win.evaluate(`Array.from(document.querySelectorAll("[data-tree-row]")).map(function (e) { return e.getAttribute("data-tree-row"); })`) as Promise<string[]>;

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-437-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const folder = join(__dirname, ".scratch", "editor-tree-find-" + process.pid);
  for (const d of ["src/cart", "src/lib", "build"]) mkdirSync(join(folder, d), { recursive: true });
  writeFileSync(join(folder, ".gitignore"), "build/\n");
  for (const f of ["src/cart/Cart.ts", "src/cart/index.ts", "src/lib/checkout.ts", "src/lib/tax.ts", "build/cart.js", "README.md"]) writeFileSync(join(folder, f), "x\n");
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
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
    await win.locator('[data-tree-row="src"]').first().waitFor({ timeout: 10_000 });
    const before = await rows(win);

    // ⌥⌘F with the tree focused.
    await win.locator("[data-editor-tree-rows]").first().focus();
    await win.keyboard.press("Meta+Alt+F");
    await until(win, "the tree's find focused", () => win.evaluate(`document.activeElement && document.activeElement.getAttribute("data-tree-find-input")`), (v) => v === "1");
    await win.keyboard.type("cart");
    const typed = await win.locator("[data-tree-find-input]").first().inputValue();
    if (typed !== "cart") throw new Error(`the find box holds ${JSON.stringify(typed)} after typing cart`);
    await until(win, "the filtered rows", () => rows(win), (r) => same(r, ["src", "src/cart", "src/cart/Cart.ts"]));
    const litText = await win.evaluate(`Array.from(document.querySelectorAll('[data-tree-row="src/cart/Cart.ts"] span[style*="background"]')).map(function (e) { return e.textContent; }).join("")`);
    if (litText !== "Cart") throw new Error(`lit letters ${JSON.stringify(litText)}`);
    await win.screenshot({ path: join(shots, "filter.png") });

    // Highlight: the tree as it was, src badged.
    await win.locator('[data-tree-find-toggle="filter"]').first().click();
    await until(win, "the tree in highlight", () => rows(win), (r) => same(r, before));
    await until(win, "src's badge", () => win.locator('[data-tree-badge="src"]').first().textContent().catch(() => null), (t) => t === "2");
    await win.screenshot({ path: join(shots, "highlight.png") });
    await win.locator("[data-tree-find-input]").first().focus();
    await win.keyboard.press("ArrowDown");
    await until(win, "↓ reveals src/cart", () => win.evaluate(`(document.querySelector("[data-tree-at]") || {}).getAttribute ? document.querySelector("[data-tree-at]").getAttribute("data-tree-row") : null`), (v) => v === "src/cart");
    await win.keyboard.press("ArrowDown");
    await until(win, "↓ reveals Cart.ts", () => win.evaluate(`document.querySelector("[data-tree-at]") && document.querySelector("[data-tree-at]").getAttribute("data-tree-row")`), (v) => v === "src/cart/Cart.ts");
    await win.keyboard.press("Enter");
    await until(win, "↵ opened Cart.ts", () => win.evaluate(`globalThis.__substrateEditor.getSnapshot().active`), (v) => v === "src/cart/Cart.ts");

    // Fuzzy, then continuous.
    await win.locator('[data-tree-find-toggle="filter"]').first().click();
    await win.locator("[data-tree-find-input]").first().fill("ckt");
    await until(win, "fuzzy ckt", () => rows(win), (r) => same(r, ["src", "src/lib", "src/lib/checkout.ts"]));
    await win.locator('[data-tree-find-toggle="fuzzy"]').first().click();
    await until(win, "continuous ckt", () => win.locator("[data-tree-find-none]").count(), (n) => n === 1);

    // Escape: the find closes; the folders it opened stay open.
    await win.locator("[data-tree-find-input]").first().focus();
    await win.keyboard.press("Escape");
    await until(win, "the find closed", () => win.locator("[data-tree-find-input]").count(), (n) => n === 0);
    const after = await rows(win);
    for (const want of ["src/cart", "src/cart/Cart.ts"]) if (!after.includes(want)) throw new Error(`after Escape the tree lacks ${want}: ${JSON.stringify(after)}`);
    if (!(await win.locator("[data-editor-view]").count())) throw new Error("Escape in the find left the editor");
    await app.close();

    const recs = windowRecords(launch);
    const foundRecs = recs.filter((r) => r.name === "EDITOR_TREE_FOUND").map((r) => `${String(r.payload.mode)}:${String(r.payload.fuzzy)}:${String(r.payload.files)}:${String(r.payload.folders)}`);
    for (const want of ["filter:true:1:1", "highlight:true:1:1", "filter:true:1:0", "filter:false:0:0"]) if (!foundRecs.includes(want)) throw new Error(`EDITOR_TREE_FOUND lacks ${want}: ${JSON.stringify(foundRecs)}`);
    const drawn = recs.filter((r) => r.name === "EDITOR_DRAWN").map((r) => Number(r.payload.tree_rows));
    if (!drawn.includes(3)) throw new Error(`EDITOR_DRAWN.tree_rows never 3 (the filtered rows): ${JSON.stringify(drawn)}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const serverFound = server.filter((r) => r.name === "FILES_FOUND").map((r) => `${String(r.payload.fuzzy)}:${String(r.payload.files)}:${String(r.payload.folders)}`);
    if (!server.some((r) => r.name === "FILES_FOUND" && Number(r.payload.name_length) === 4)) throw new Error("no FILES_FOUND for a name of 4 characters (cart)");
    for (const want of ["true:1:1", "true:1:0", "false:0:0"]) if (!serverFound.includes(want)) throw new Error(`FILES_FOUND lacks ${want}: ${JSON.stringify(serverFound)}`);
    const unread = server.filter((r) => r.name === "FILES_FOUND" && Number(r.payload.unreadable) !== 0).length;
    if (unread) throw new Error(`FILES_FOUND reported unreadable folders ${unread} times`);
    const allTraces = readdirSync(join(traces, boot)).map((f) => readFileSync(join(traces, boot, f), "utf8")).join("\n");
    if (allTraces.includes('"ckt"') || allTraces.includes("=ckt")) throw new Error("the name ckt is in the trace");
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_tree_find: ok — ⌥⌘F in the tree; cart filtered to src, src/cart, Cart.ts (src never opened, build/ ignored), "Cart" lit; highlight kept the tree, src badged 2; ↓ src/cart, ↓ Cart.ts, ↵ opened; ckt fuzzy checkout.ts, continuous none; Escape kept src/cart open; EDITOR_TREE_FOUND ${foundRecs.length}, FILES_FOUND ${serverFound.length}; packaged=${String(booted.packaged)}; screenshots ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_tree_find: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
