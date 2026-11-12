// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Quick open (sprint 441; roadmap r10 E9; frame 24i). A repository written here: src/lib/cart.ts (changed since
// HEAD), tests/cart.test.ts, src/ui/CartDrawer.tsx, src/lib/menu.ts, and build/cart.js ignored by .gitignore.
// The change and build/cart.js are written into the session's worktree, uncommitted (sprint 483). These agree:
//   ⌘P in the editor opens the box with its field focused (EDITOR_QUICK_OPENED);
//   `cart` lists src/lib/cart.ts, tests/cart.test.ts, src/ui/CartDrawer.tsx in that order, "cart" lit in the
//   first, the dot on the changed file, build/cart.js absent;
//   ↓ ↵ opens tests/cart.test.ts (how=quick_open) and the code has the focus;
//   with menu.ts opened from the tree, ⌘P shows RECENT with tests/cart.test.ts;
//   `cartd` ⌘↵ adds CartDrawer.tsx's tab and menu.ts stays shown;
//   Escape closes the box and the editor stays; Go ▸ Quick Open opens it; the box inside the centre;
//   FILES_LISTED_ALL lists 5 files each time; KEY_ROUTED Meta+p quick-open.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean): Promise<T> {
  const deadline = Date.now() + 10_000;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const rows = (win: Page, kind: string) => win.evaluate(`Array.from(document.querySelectorAll('[data-quick-row="${kind}"]')).map(function (e) { return e.getAttribute("data-path"); })`) as Promise<string[]>;
const snap = (win: Page) => win.evaluate(`(function () { var s = globalThis.__substrateEditor.getSnapshot(); return { active: s.active, tabs: s.tabs }; })()`) as Promise<{ active: string | null; tabs: string[] }>;
const boxOpen = (win: Page) => win.locator("[data-quick-open]").count();
const menu = (app: ElectronApplication, id: string) => app.evaluate(({ Menu }, item) => { Menu.getApplicationMenu()?.getMenuItemById(item)?.click(); }, id);

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-441-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-quick-open-" + process.pid);
  for (const d of ["src/lib", "src/ui", "tests"]) mkdirSync(join(repo, d), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, ".gitignore"), "build/\n");
  writeFileSync(join(repo, "src/lib/cart.ts"), "export const total = 1;\n");
  writeFileSync(join(repo, "src/lib/menu.ts"), "export const tea = 450;\n");
  writeFileSync(join(repo, "src/ui/CartDrawer.tsx"), "export const Drawer = 1;\n");
  writeFileSync(join(repo, "tests/cart.test.ts"), "test();\n");
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  // The kernel gives the session a worktree from the repository's HEAD (editor_dots). Sprint 483: the change is
  // compared with the branch's last commit, so it is written uncommitted into the session's workspace once it exists,
  // with the ignored copy.
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await win.waitForFunction(() => window.innerWidth === 1512, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    const ws = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { workspacePath: string } } } }).__vm.get(1).snapshot().workspacePath);
    mkdirSync(join(ws, "build"), { recursive: true });
    writeFileSync(join(ws, "src/lib/cart.ts"), "export const total = 2;\n");
    writeFileSync(join(ws, "build/cart.js"), "x\n"); // ignored by .gitignore
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().waitFor({ timeout: 10_000 });

    // ⌘P: the box, focused; `cart` in the expected order, lit, dotted, the ignored copy absent.
    await win.keyboard.press("Meta+p");
    await until(win, "the box focused", () => win.evaluate(`document.activeElement && document.activeElement.getAttribute("data-quick-input")`), (v) => v === "1");
    await win.keyboard.type("cart");
    await until(win, "the matches", () => rows(win, "match"), (r) => same(r, ["src/lib/cart.ts", "tests/cart.test.ts", "src/ui/CartDrawer.tsx"]));
    const lit = await win.evaluate(`Array.from(document.querySelectorAll('[data-quick-row="match"][data-path="src/lib/cart.ts"] span span')).map(function (e) { return e.textContent; }).join("")`);
    if (lit !== "cart") throw new Error(`lit letters ${JSON.stringify(lit)}`);
    await until(win, "the dot on the changed file", () => win.evaluate(`Array.from(document.querySelectorAll("[data-quick-dot]")).map(function (e) { return e.getAttribute("data-quick-dot"); })`) as Promise<string[]>, (d) => same(d, ["src/lib/cart.ts"]));
    const inside = await win.evaluate(`(function () { var c = document.querySelector("[data-editor-centre-column]").getBoundingClientRect(), b = document.querySelector("[data-quick-open]").getBoundingClientRect(); return b.left >= c.left && b.right <= c.right && b.top >= c.top; })()`);
    if (!inside) throw new Error("the box is not inside the centre");
    const shot = join(shots, "quick-open.png");
    await win.screenshot({ path: shot });

    // ↓ ↵: the second match opens, the code focused.
    await win.keyboard.press("ArrowDown");
    await win.keyboard.press("Enter");
    await until(win, "tests/cart.test.ts shown", () => snap(win), (s) => s.active === "tests/cart.test.ts");
    await until(win, "the code focused", () => win.evaluate(`!!(document.activeElement && document.activeElement.hasAttribute("data-editor-code"))`) as Promise<boolean>, (v) => v);
    if (await boxOpen(win)) throw new Error("the box stayed open after ↵");

    // RECENT, after menu.ts opens from the tree.
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/lib"]').first().click();
    await win.locator('[data-tree-row="src/lib/menu.ts"]').first().click();
    await until(win, "menu.ts shown", () => snap(win), (s) => s.active === "src/lib/menu.ts");
    await win.keyboard.press("Meta+p");
    await until(win, "RECENT", () => rows(win, "recent"), (r) => same(r, ["tests/cart.test.ts"]));

    // ⌘↵: CartDrawer's tab added, menu.ts stays shown.
    await win.keyboard.type("cartd");
    await until(win, "cartd", () => rows(win, "match"), (r) => r[0] === "src/ui/CartDrawer.tsx");
    await win.keyboard.press("Meta+Enter");
    await until(win, "the tab behind", () => snap(win), (s) => s.tabs.includes("src/ui/CartDrawer.tsx") && s.active === "src/lib/menu.ts");

    // Escape closes the box and keeps the editor; Go ▸ Quick Open opens it.
    await win.keyboard.press("Meta+p");
    await until(win, "the box again", () => boxOpen(win), (n) => n === 1);
    await win.keyboard.press("Escape");
    await until(win, "the box closed", () => boxOpen(win), (n) => n === 0);
    if (!(await win.locator("[data-editor-view]").count())) throw new Error("Escape in the box left the editor");
    await menu(app, "menu-quick-open");
    await until(win, "Go ▸ Quick Open", () => boxOpen(win), (n) => n === 1);
    await app.close();

    const recs = windowRecords(launch);
    const quick = recs.filter((r) => r.name === "EDITOR_QUICK_OPENED").length;
    if (quick !== 4) throw new Error(`EDITOR_QUICK_OPENED ${quick}, want 4`);
    const opened = recs.filter((r) => r.name === "EDITOR_FILE_OPENED").map((r) => String(r.payload.how));
    if (!same(opened, ["quick_open", "tree", "quick_open"])) throw new Error(`EDITOR_FILE_OPENED ${JSON.stringify(opened)}`);
    const routed = recs.filter((r) => r.name === "KEY_ROUTED" && r.payload.action === "quick-open").length;
    if (routed !== 3) throw new Error(`KEY_ROUTED quick-open ${routed}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const listed = server.filter((r) => r.name === "FILES_LISTED_ALL").map((r) => Number(r.payload.files));
    if (listed.length !== 4 || listed.some((n) => n !== 5)) throw new Error(`FILES_LISTED_ALL ${JSON.stringify(listed)}`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_quick_open: ok — ⌘P focused the box; cart → cart.ts (lit, dotted), cart.test.ts, CartDrawer.tsx, build/ ignored; ↓↵ opened cart.test.ts with the code focused; RECENT cart.test.ts; ⌘↵ added CartDrawer.tsx behind menu.ts; Escape kept the editor; Go ▸ Quick Open opened it; EDITOR_QUICK_OPENED 4, FILES_LISTED_ALL 5 ×4; packaged=${String(booted.packaged)}; screenshot ${shot}`);
    status = 0;
  } catch (e) {
    console.error(`editor_quick_open: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
