// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// An image sent as a file chip goes as an image, and Claude Code opens it (sprint 460; roadmap r13 E10.5;
// ADD-TO-MESSAGE-2026-11-10-r3 rule 7). The live roster's `claude` driver (Claude Code on this machine). A repository
// written here holds src/red.png, a 64×64 PNG of one colour, built by this gate. After a first turn, these agree:
//   ⌥-click src/red.png in the editor's tree: chip "red.png";
//   the question sent with it: the record's UserMessage attachment reads "(not inlined: an image, PNG, …; src/red.png;
//   read it with your file tools)"; a HarnessToolCall Read names src/red.png after it; the reply names red;
//   the sent chip is dashed, its hover the path and the line;
//   window-1.jsonl: EDITOR_CHIP_ADDED file alt_click; TRANSCRIPT_CHIPS_DRAWN chips 1 by_reference 1; server.jsonl:
//   TURN_ACCEPTED attachments 1 by_reference 1 for the question.
// A screenshot of the sent message and the reply goes to runs/packaged/sprint-460-<stamp>-<source|packaged>/.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { crc32, deflateSync } from "node:zlib";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
const ASK = "What single colour fills the attached image? Answer with the colour's name only.";
type Env = { seq: number; kind: string; payload: Record<string, unknown> };
type Row = { seq: number; role: string; text: string };
const envs = (win: Page) => win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: Env[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []) as Promise<Env[]>;
const transcript = (win: Page) => win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { transcript: Row[] } } } }).__vm.get(1).snapshot().transcript.map((r) => ({ seq: r.seq, role: r.role, text: r.text }))) as Promise<Row[]>;
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 15_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v).slice(0, 600)}`);
  return v;
}

/** A PNG of one colour: signature, IHDR (8-bit RGB), one IDAT of filter-0 rows, IEND. */
function solidPng(w: number, h: number, rgb: [number, number, number]): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => rgb).flat())]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-460-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "image-chip-claude-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "src/red.png"), solidPng(64, 64, [220, 20, 20]));
  writeFileSync(join(repo, "README.md"), "a test repository\n");
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  const launch = launchArgs({ roster: "live" });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await win.waitForFunction(() => window.innerWidth === 1512, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, "claude", { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("Reply with the single word ready. Use no tools.");
    await win.keyboard.press("Enter");
    await until(win, "the first turn's Returned", () => envs(win), (es) => es.some((e) => e.kind === "Returned"), 300_000);

    await win.keyboard.press("Meta+Shift+E");
    await win.locator('[data-tree-row="src"]').first().click();
    await win.locator('[data-tree-row="src/red.png"]').first().click({ modifiers: ["Alt"] });
    await until(win, "the image's chip", () => win.locator('[data-editor-area="bottom"] [data-chip="src/red.png"]').count(), (n) => n === 1);
    const box = win.locator('[data-editor-area="bottom"] textarea[data-input-bar]').first();
    await box.click();
    await box.fill(ASK);
    await win.keyboard.press("Enter");
    const done = await until(win, "the question's Returned", () => envs(win), (es) => {
      const at = es.find((e) => e.kind === "UserMessage" && e.payload.text === ASK);
      return !!at && es.some((e) => e.seq > at.seq && e.kind === "Returned");
    }, 300_000);
    const asked = done.find((e) => e.kind === "UserMessage" && e.payload.text === ASK)!;
    const att = (asked.payload.attachments as { kind: string; text?: string }[]) ?? [];
    if (att.length !== 1 || !/^\(not inlined: an image, PNG, [0-9.]+ [KM]?B; src\/red\.png; read it with your file tools\)$/.test(att[0].text ?? "")) throw new Error(`the attachment: ${JSON.stringify(att)}`);
    const reads = done.filter((e) => e.seq > asked.seq && e.kind === "HarnessToolCall" && e.payload.tool === "Read" && String((e.payload.args as { file_path?: string })?.file_path ?? "").endsWith("src/red.png"));
    if (!reads.length) throw new Error(`no Read of src/red.png after the question: ${JSON.stringify(done.filter((e) => e.seq > asked.seq && e.kind === "HarnessToolCall").map((e) => e.payload))}`);
    const reply = (await transcript(win)).filter((r) => r.role === "model" && r.seq > asked.seq).map((r) => r.text).join(" ");
    if (!/\bred\b/i.test(reply)) throw new Error(`the reply: ${JSON.stringify(reply)}`);
    // The reply drawn, not only held: the editor terminal's transcript shows it after the question.
    const drawnText = await until(win, "the reply drawn in the editor's terminal", () => win.evaluate(`(function () { var m = document.querySelector('[data-vm-transcript-mount="editor"]'); return m ? m.innerText : ""; })()`) as Promise<string>, (t) => { const at = t.lastIndexOf(ASK.slice(0, 30)); return at >= 0 && /◆\s*red\b/i.test(t.slice(at)); }, 10_000);
    void drawnText;
    const chip = await until(win, "the sent chip", () => win.evaluate(`(function () { var e = document.querySelector('[data-sent-chip="src/red.png"]'); return e ? { dashed: e.getAttribute("data-by-reference") === "1", title: e.getAttribute("title") } : null; })()`) as Promise<{ dashed: boolean; title: string } | null>, (c) => !!c);
    if (!chip!.dashed || !chip!.title.startsWith("src/red.png\n(not inlined: an image, PNG")) throw new Error(`the sent chip: ${JSON.stringify(chip)}`);
    // No scroll to the chip: the terminal follows the bottom, so the question, the Read and the reply are all in view.
    const shot = join(shots, "image-sent.png");
    await win.screenshot({ path: shot });
    await app.close();

    const recs = windowRecords(launch);
    const added = recs.filter((r) => r.name === "EDITOR_CHIP_ADDED").map((r) => `${String(r.payload.kind)}:${String(r.payload.how)}`);
    if (JSON.stringify(added) !== JSON.stringify(["file:alt_click"])) throw new Error(`EDITOR_CHIP_ADDED ${JSON.stringify(added)}`);
    const drawn = recs.filter((r) => r.name === "TRANSCRIPT_CHIPS_DRAWN").map((r) => [r.payload.chips, r.payload.by_reference]);
    if (JSON.stringify(drawn) !== "[[1,1]]") throw new Error(`TRANSCRIPT_CHIPS_DRAWN ${JSON.stringify(drawn)}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const accepted = server.filter((r) => r.name === "TURN_ACCEPTED").map((r) => [r.payload.attachments, r.payload.by_reference]);
    if (JSON.stringify(accepted) !== "[[0,0],[1,1]]") throw new Error(`TURN_ACCEPTED ${JSON.stringify(accepted)}`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`image_chip_claude: ok — src/red.png went as "${att[0].text}"; Claude Code read it (${reads.length} Read call(s) after seq ${asked.seq}) and replied ${JSON.stringify(reply.trim().slice(0, 40))}; the sent chip dashed with the line on hover; EDITOR_CHIP_ADDED file alt_click; TRANSCRIPT_CHIPS_DRAWN 1/1; TURN_ACCEPTED 1/1; packaged=${String(booted.packaged)}; screenshot ${shot}`);
    status = 0;
  } catch (e) {
    console.error(`image_chip_claude: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
