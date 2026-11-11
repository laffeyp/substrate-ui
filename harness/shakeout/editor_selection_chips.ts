// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// ⌘⇧A adds the editor's selection to the message (sprint 454; roadmap r13 E10.3; the Architect, 2026-11-10: a key
// under the left hand). A repository written here holds src/cart.ts, four lines; the deterministic driver. Line 3 is
// typed into, unsaved; then, with the code focused, these agree:
//   lines 2–3 selected, ⌘⇧A: the chip "cart.ts 2–3"; line 1's columns 8–22, ⌘⇧A: "cart.ts 1:8–22"; no selection,
//   ⌘⇧A: "cart.ts"; lines 2–3 again: still three chips;
//   "look" sent: the record's UserMessage holds the range [2, 3] with the typed line, [1, 8, 1, 22] with
//   "const total = 1", and the file; the disk holds the typed line (the save before send);
//   window-1.jsonl: KEY_ROUTED Meta+Shift+A → add-selection ×4; EDITOR_CHIP_ADDED range key, range key, file key;
//   TRANSCRIPT_CHIPS_DRAWN chips 3, by_reference 0.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const CART = "export const total = 1;\nexport function add(a, b) {\n  return a + b;\n}\n";
type Env = { seq: number; kind: string; payload: Record<string, unknown> };
const chips = (win: Page) => win.evaluate(`Array.from(document.querySelectorAll('[data-editor-area="bottom"] [data-chip]')).map(function (e) { return e.firstChild && e.firstChild.textContent; })`) as Promise<string[]>;
const firstLine = (win: Page) => win.evaluate(`(function () { var r = document.querySelector("[data-editor-code]").shadowRoot; var l = r && r.querySelector(".cm-line"); return l ? l.textContent : null; })()`) as Promise<string | null>;
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 15_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
async function press(win: Page, key: string, times = 1): Promise<void> { for (let i = 0; i < times; i++) await win.keyboard.press(key); }

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-454-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-selection-chips-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "src/cart.ts"), CART);
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
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
    await until(win, "hello's Returned", () => returned(win), (n) => n >= 1, 30_000);
    const sid = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { sessionId: string } } } }).__vm.get(1).snapshot().sessionId);
    const ws = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { workspacePath: string } } } }).__vm.get(1).snapshot().workspacePath);
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/cart.ts"]').first().click();
    await until(win, "cart.ts drawn", () => firstLine(win), (t) => t === "export const total = 1;");

    // Line 3 typed into, unsaved.
    await win.locator("[data-editor-code] .cm-line", { hasText: "return a + b;" }).first().click();
    await press(win, "Meta+ArrowRight");
    await win.keyboard.type(" // three");
    // Lines 2–3, whole.
    await press(win, "Meta+ArrowUp"); await press(win, "ArrowDown"); await press(win, "Shift+ArrowDown", 2);
    await press(win, "Meta+Shift+A");
    await until(win, "the lines chip", () => chips(win), (c) => JSON.stringify(c) === JSON.stringify(["cart.ts 2–3"]));
    // Line 1, columns 8–22.
    await press(win, "Meta+ArrowUp"); await press(win, "ArrowRight", 7); await press(win, "Shift+ArrowRight", 15);
    await press(win, "Meta+Shift+A");
    await until(win, "the in-line chip", () => chips(win), (c) => c.length === 2 && c[1] === "cart.ts 1:8–22");
    // No selection: the file.
    await press(win, "ArrowRight");
    await press(win, "Meta+Shift+A");
    await until(win, "the file chip", () => chips(win), (c) => c.length === 3 && c[2] === "cart.ts");
    // Lines 2–3 again: one chip still.
    await press(win, "Meta+ArrowUp"); await press(win, "ArrowDown"); await press(win, "Shift+ArrowDown", 2);
    await press(win, "Meta+Shift+A");
    await settled(win);
    if ((await chips(win)).length !== 3) throw new Error(`the same range twice: ${JSON.stringify(await chips(win))}`);
    await win.screenshot({ path: join(shots, "bar.png") });

    const box = win.locator('[data-editor-area="bottom"] textarea[data-input-bar]').first();
    await box.click();
    await box.fill("look");
    await win.keyboard.press("Enter");
    await until(win, "look's Returned", () => returned(win), (n) => n >= 2, 30_000);
    await win.locator("[data-sent-chips]").first().scrollIntoViewIfNeeded();
    const shot = join(shots, "sent.png");
    await win.screenshot({ path: shot });
    const disk = readFileSync(join(ws, "src/cart.ts"), "utf8");
    const record = await win.evaluate(async (s) => (await (await fetch(`/api/session/${encodeURIComponent(s)}`)).json()).record as string, sid);
    await app.close();

    if (!disk.includes("  return a + b; // three\n")) throw new Error(`the disk: ${JSON.stringify(disk)}`);
    const envs = readdirSync(record).filter((f) => f.startsWith("events-")).sort().flatMap((f) => readFileSync(join(record, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Env));
    const asked = envs.filter((e) => e.kind === "UserMessage" && e.payload.text === "look").pop()!;
    const att = (asked.payload.attachments as { kind: string; label: string; span?: number[]; text?: string }[]).map((a) => [a.kind, a.label, a.span ?? [], a.text ?? ""]);
    const want = [
      ["lines", "cart.ts 2–3", [2, 3], "(src/cart.ts, lines 2–3)\nexport function add(a, b) {\n  return a + b; // three\n"],
      ["lines", "cart.ts 1:8–22", [1, 8, 1, 22], "(src/cart.ts, 1:8–1:22)\nconst total = 1"],
      ["file", "cart.ts", [], "(src/cart.ts)\n" + disk],
    ];
    if (JSON.stringify(att) !== JSON.stringify(want)) throw new Error(`the UserMessage's attachments: ${JSON.stringify(att)}`);
    const recs = windowRecords(launch);
    const routed = recs.filter((r) => r.name === "KEY_ROUTED" && r.payload.key === "Meta+Shift+A").map((r) => `${String(r.payload.action)}:${String(r.payload.target)}`);
    if (JSON.stringify(routed) !== JSON.stringify(Array(4).fill("add-selection:editor"))) throw new Error(`KEY_ROUTED ⌘⇧A ${JSON.stringify(routed)}`);
    const added = recs.filter((r) => r.name === "EDITOR_CHIP_ADDED").map((r) => `${String(r.payload.kind)}:${String(r.payload.how)}`);
    if (JSON.stringify(added) !== JSON.stringify(["range:key", "range:key", "file:key"])) throw new Error(`EDITOR_CHIP_ADDED ${JSON.stringify(added)}`);
    const drawn = recs.filter((r) => r.name === "TRANSCRIPT_CHIPS_DRAWN").map((r) => [r.payload.chips, r.payload.by_reference]);
    if (JSON.stringify(drawn) !== "[[3,0]]") throw new Error(`TRANSCRIPT_CHIPS_DRAWN ${JSON.stringify(drawn)}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_selection_chips: ok — ⌘⇧A: "cart.ts 2–3", "cart.ts 1:8–22", "cart.ts", the range again one chip; "look" carried the typed line, "const total = 1" and the file; the disk saved first; KEY_ROUTED add-selection ×4; EDITOR_CHIP_ADDED range, range, file by key; TRANSCRIPT_CHIPS_DRAWN 3/0; packaged=${String(booted.packaged)}; screenshot ${shot}`);
    status = 0;
  } catch (e) {
    console.error(`editor_selection_chips: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
