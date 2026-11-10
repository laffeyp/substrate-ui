// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The meta pane inside the editor view (sprint 430; roadmap 2026-11-09-code-editor r10, E5; frame 24b's
// column; the Architect, 2026-11-09: ⌘M, the meta pane, no chip). A real repository; the live roster's model (EDITOR_LIVE_MODEL overrides) reads
// src/cart.ts and edits one line. These agree:
//   truth  — the header's event count equals the kernel record's envelopes on disk; the seq ACTIVITY's ◂
//            opens is the record's edit_file ToolCall on the file;
//   DOM    — ⌘M opens the meta pane in the editor's right column in place of the inspector (≈300 px →
//            ≈400 px, `META <name> · N events`, the five lens chips, no swap chip) and closes it; ◂ opens it on
//            the stream lens with that seq's row lit, inspected inline and scrolled into view; the footer adds `seq N selected`
//            and the hint `⌘M meta`; folded, the rail reads META and ⌘M unfolds it;
//   pixels — the anchor's third row, from a screenshot with the meta pane open, reads meta open, and names the
//            EDITOR_DRAWN with showing lenses;
//   signals — EDITOR_INSPECTOR_SWAPPED lenses, spine, lenses; SEQ_SELECTED editor_activity with the seq;
//            KEY_ROUTED Meta+m → toggle-meta; no VIEW_CHANGED (the editor stays).
// The column is screenshotted beside 24b. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels } from "./lib/editor_pixels";

const REPO_ROOT = join(__dirname, "..", "..");
const MODEL = process.env.EDITOR_LIVE_MODEL || undefined;
const FILE = "src/cart.ts";
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean): Promise<T> {
  const deadline = Date.now() + 15_000;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}
interface Column { showing: string | null; width: number; head: string | null; chip: string | null; label: string | null; lenses: number; rail: string | null; inspected: string | null; footer: string; inView: boolean }
async function column(win: Page): Promise<Column> {
  return win.evaluate(`(() => {
    var c = document.querySelector('[data-editor-area="right"]'); var t = function (s) { var e = document.querySelector(s); return e ? e.textContent : null; };
    var rail = document.querySelector('[data-editor-rail="right"]');
    var ins = document.querySelector("[data-stream-inspector]");
    return { showing: c ? c.getAttribute("data-showing") : null, width: c ? Math.round(c.getBoundingClientRect().width) : 0, head: t("[data-record-head]"), chip: t("[data-editor-swap]"), label: (function () { var h = c && c.firstElementChild; return h ? h.firstElementChild.textContent : null; })(),
      lenses: document.querySelectorAll('[data-editor-area="right"] [data-lens-chip]').length, rail: rail ? rail.textContent : null,
      inspected: ins ? ins.getAttribute("data-stream-inspector") : null, footer: t("[data-footer]") || "",
      inView: (function () { if (!ins || !c) return false; var a = ins.getBoundingClientRect(), b = c.getBoundingClientRect(); return a.top >= b.top && a.top < b.bottom - 20; })() };
  })()`);
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-430-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-meta-pane-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, FILE), "export const a = 1;\nexport const b = 2;\nexport const c = 3;\n");
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  const launch = launchArgs({ roster: "live" });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await win.waitForFunction(() => window.innerWidth === 1512, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, MODEL, { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first()
      .fill(`Use read_file to read ${FILE}. Then use edit_file on ${FILE} to replace exactly \`export const b = 2;\` with \`export const b = 20;\`. Change nothing else, then reply "done".`);
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 300_000 });
    const sid = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { sessionId: string } } } }).__vm.get(1).snapshot().sessionId);
    const ws = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { workspacePath: string } } } }).__vm.get(1).snapshot().workspacePath);
    if (!readFileSync(join(ws, FILE), "utf8").includes("export const b = 20;")) throw new Error("the model did not make the edit");
    // Truth: the kernel record on disk.
    const record = await win.evaluate(async (s) => (await (await fetch(`/api/session/${encodeURIComponent(s)}`)).json()).record as string, sid);
    const envs = readdirSync(record).filter((f) => f.startsWith("events-")).sort().flatMap((f) => readFileSync(join(record, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { seq: number; kind: string; payload: Record<string, unknown> }));
    const editSeq = envs.filter((e) => e.kind === "ToolCall" && e.payload.tool === "edit_file").map((e) => e.seq).pop();
    if (editSeq === undefined) throw new Error("no edit_file ToolCall on the record");

    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator(`[data-tree-row="${FILE}"]`).first().click();
    await win.locator(`[data-activity-open="${editSeq}"]`).first().waitFor({ timeout: 15_000 });
    const insp = await column(win);
    if (insp.showing !== "inspector" || insp.chip !== null || Math.abs(insp.width - 300) > 2) throw new Error(`the inspector column: ${JSON.stringify(insp)}`);

    // ⌘M: the meta pane, inside the editor.
    await win.keyboard.press("Meta+m");
    const rec = await until(win, "the meta pane", () => column(win), (c) => c.showing === "meta" && c.lenses === 5);
    if (!(await win.evaluate(() => !!document.querySelector("[data-editor-view]")))) throw new Error("⌘M left the editor");
    const n = envs.length;
    const headN = Number((rec.head ?? "").match(/(\d+) events/)?.[1] ?? -1);
    if (headN !== n) throw new Error(`the header counts ${headN} events; the record on disk holds ${n}`);
    if (rec.chip !== null || rec.label !== "META" || Math.abs(rec.width - 400) > 2) throw new Error(`the meta pane: ${JSON.stringify(rec)}`);
    if (!rec.footer.includes("⌘M meta")) throw new Error(`the footer reads ${rec.footer}`);
    const shot = join(shots, "meta-pane.png");
    const px = await readPixels(win, shot, 0);
    if ("error" in px.anchor3 || !px.anchor3.meta) throw new Error(`the anchor's third row with the meta pane open: ${JSON.stringify(px.anchor3)}`);
    const row3 = px.anchor3;
    // ⌘M again: the inspector.
    await win.keyboard.press("Meta+m");
    await until(win, "back to the inspector", () => column(win), (c) => c.showing === "inspector" && Math.abs(c.width - 300) <= 2);

    // ◂ on the edit's ACTIVITY row: the meta pane, the stream lens, the seq lit and inspected.
    await win.locator(`[data-activity-open="${editSeq}"]`).first().click();
    const opened = await until(win, "◂ opened the seq", () => column(win), (c) => c.showing === "meta" && c.inspected === String(editSeq) && c.inView);
    if (!opened.footer.includes(`seq ${editSeq} selected`)) throw new Error(`the footer reads ${opened.footer}`);
    await win.locator('[data-editor-area="right"]').first().screenshot({ path: join(shots, "meta-pane-column.png") });
    // Folded, the rail says META; ⌘M unfolds the column.
    await win.keyboard.press("Meta+Alt+KeyR");
    await until(win, "the meta pane folded", () => column(win), (c) => (c.rail ?? "").includes("META"));
    await win.keyboard.press("Meta+m");
    await until(win, "⌘M unfolded the column", () => column(win), (c) => c.showing !== null && c.rail === null);
    const frame = join(REPO_ROOT, "runs", "design", "sheet-v11", "24b.png");
    if (existsSync(frame)) copyFileSync(frame, join(shots, "24b.png"));

    await app.close();
    const recs = windowRecords(launch);
    const swapped = recs.filter((r) => r.name === "EDITOR_INSPECTOR_SWAPPED").map((r) => String(r.payload.showing));
    if (JSON.stringify(swapped.slice(0, 3)) !== JSON.stringify(["lenses", "spine", "lenses"])) throw new Error(`EDITOR_INSPECTOR_SWAPPED ${JSON.stringify(swapped)}`);
    const selected = recs.filter((r) => r.name === "SEQ_SELECTED" && r.payload.how === "editor_activity").map((r) => r.payload.seq);
    if (JSON.stringify(selected) !== JSON.stringify([editSeq])) throw new Error(`SEQ_SELECTED editor_activity ${JSON.stringify(selected)}`);
    const keyed = recs.filter((r) => r.name === "KEY_ROUTED" && r.payload.action === "toggle-meta").length;
    if (keyed < 3) throw new Error(`KEY_ROUTED toggle-meta ${keyed}`);
    if (recs.some((r) => r.name === "VIEW_CHANGED" && r.payload.from === "editor")) throw new Error("⌘M changed the view");
    const named = recs.find((r) => r.proc_seq === row3.seq);
    if (!named || named.name !== "EDITOR_DRAWN" || named.payload.showing !== "lenses") throw new Error(`the third row names seq ${row3.seq}: ${named ? `${named.name} ${JSON.stringify(named.payload)}` : "missing"}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_meta_pane: ok — inspector ${insp.width}px, ⌘M meta pane ${rec.width}px (${rec.head}; ${n} envelopes on disk); ◂ opened seq ${editSeq} (the edit_file call) inspected, footer "seq ${editSeq} selected"; folded rail META, ⌘M unfolded; anchor row 3 meta = EDITOR_DRAWN showing lenses at seq ${row3.seq}; EDITOR_INSPECTOR_SWAPPED ${swapped.join(", ")}; packaged=${String(booted.packaged)}; screenshots ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_meta_pane: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
