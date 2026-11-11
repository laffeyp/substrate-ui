// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Chips in the message (sprint 443; roadmap r11 E10 (a); D94; frame 24k). A repository written here:
// src/lib/cart.ts and tests/cart.test.ts. These agree:
//   ⌥-click on src/lib/cart.ts and on tests/ in the tree adds two chips, `cart.ts` and `tests/`, each with its
//   path on hover; ⌥-click on cart.ts again adds nothing;
//   ⌫ at the start of the empty draft removes tests/; × removes cart.ts;
//   cart.ts added again and a message sent: the record's UserMessage carries the attachment {kind file, label
//   cart.ts, ref src/lib/cart.ts} with the file's text; the bar has no chip after;
//   signals — EDITOR_CHIP_ADDED file, folder, file; INPUT_CHIP_REMOVED folder by backspace, file by x;
//   TURN_SUBMITTED and TURN_ACCEPTED count 1 attachment for the message.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 10_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const chips = (win: Page) => win.evaluate(`Array.from(document.querySelectorAll('[data-editor-area="bottom"] [data-chip]')).map(function (e) { return { ref: e.getAttribute("data-chip"), title: e.getAttribute("title"), label: e.firstChild && e.firstChild.textContent }; })`) as Promise<{ ref: string; title: string; label: string }[]>;
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
const CART = "export const total = 1;\n";

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-443-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-chips-" + process.pid);
  for (const d of ["src/lib", "tests"]) mkdirSync(join(repo, d), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "src/lib/cart.ts"), CART);
  writeFileSync(join(repo, "tests/cart.test.ts"), "test();\n");
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
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    const sid = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { sessionId: string } } } }).__vm.get(1).snapshot().sessionId);
    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/lib"]').first().click();

    // ⌥-click a file and a folder; the file again adds nothing.
    await win.locator('[data-tree-row="src/lib/cart.ts"]').first().click({ modifiers: ["Alt"] });
    await win.locator('[data-tree-row="tests"]').first().click({ modifiers: ["Alt"] });
    await win.locator('[data-tree-row="src/lib/cart.ts"]').first().click({ modifiers: ["Alt"] });
    await until(win, "two chips", () => chips(win), (c) => same(c, [{ ref: "src/lib/cart.ts", title: "src/lib/cart.ts", label: "cart.ts" }, { ref: "tests", title: "tests", label: "tests/" }]));
    if (await win.evaluate(`globalThis.__substrateEditor.getSnapshot().active`)) throw new Error("⌥-click opened the file");
    const shot = join(shots, "chips.png");
    await win.screenshot({ path: shot });

    // ⌫ in the empty draft, then ×.
    const box = win.locator('[data-editor-area="bottom"] textarea[data-input-bar]').first();
    await box.click();
    await win.keyboard.press("Backspace");
    await until(win, "⌫ removed tests/", () => chips(win), (c) => same(c.map((x) => x.ref), ["src/lib/cart.ts"]));
    await win.locator('[data-editor-area="bottom"] [data-chip-x="src/lib/cart.ts"]').first().click();
    await until(win, "× removed cart.ts", () => chips(win), (c) => c.length === 0);

    // cart.ts again, and a message with it.
    await win.locator('[data-tree-row="src/lib/cart.ts"]').first().click({ modifiers: ["Alt"] });
    await until(win, "cart.ts again", () => chips(win), (c) => c.length === 1);
    const before = await returned(win);
    await box.click();
    await box.fill("what is the total?");
    await win.keyboard.press("Enter");
    await until(win, "the turn's Returned", () => returned(win), (n) => n > before, 30_000);
    await until(win, "the chips gone after sending", () => chips(win), (c) => c.length === 0);

    const record = await win.evaluate(async (s) => (await (await fetch(`/api/session/${encodeURIComponent(s)}`)).json()).record as string, sid);
    await app.close();
    const envs = readdirSync(record).filter((f) => f.startsWith("events-")).sort().flatMap((f) => readFileSync(join(record, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { kind: string; payload: Record<string, unknown> }));
    const asked = envs.filter((e) => e.kind === "UserMessage").pop()!;
    const att = (asked.payload.attachments as { kind: string; label: string; ref: string; text: string }[] | undefined) ?? [];
    if (att.length !== 1 || att[0].kind !== "file" || att[0].label !== "cart.ts" || att[0].ref !== "src/lib/cart.ts" || att[0].text !== CART) throw new Error(`the UserMessage's attachments: ${JSON.stringify(att)}`);

    const recs = windowRecords(launch);
    const added = recs.filter((r) => r.name === "EDITOR_CHIP_ADDED").map((r) => String(r.payload.kind));
    if (!same(added, ["file", "folder", "file"])) throw new Error(`EDITOR_CHIP_ADDED ${JSON.stringify(added)}`);
    const removed = recs.filter((r) => r.name === "INPUT_CHIP_REMOVED").map((r) => `${String(r.payload.kind)}:${String(r.payload.how)}`);
    if (!same(removed, ["folder:backspace", "file:x"])) throw new Error(`INPUT_CHIP_REMOVED ${JSON.stringify(removed)}`);
    const submitted = recs.filter((r) => r.name === "TURN_SUBMITTED").map((r) => Number(r.payload.attachments));
    if (!same(submitted, [0, 1])) throw new Error(`TURN_SUBMITTED.attachments ${JSON.stringify(submitted)}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const accepted = server.filter((r) => r.name === "TURN_ACCEPTED").map((r) => Number(r.payload.attachments));
    if (!same(accepted, [0, 1])) throw new Error(`TURN_ACCEPTED.attachments ${JSON.stringify(accepted)}`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_chips: ok — ⌥-click: cart.ts and tests/ with their paths on hover, cart.ts twice still two; ⌫ removed tests/, × cart.ts; cart.ts sent with a message: the UserMessage's attachment holds the file's text; EDITOR_CHIP_ADDED file, folder, file; INPUT_CHIP_REMOVED folder:backspace, file:x; TURN_SUBMITTED and TURN_ACCEPTED 0 then 1; packaged=${String(booted.packaged)}; screenshot ${shot}`);
    status = 0;
  } catch (e) {
    console.error(`editor_chips: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
