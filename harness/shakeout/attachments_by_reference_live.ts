// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// An attachment sent by reference reaches the model, and the model follows it (sprint 446; roadmap r13
// E10.1; ADD-TO-MESSAGE-2026-11-10-r3 rule 2). A repository written here holds big.txt, 70 KB, past the 64 KB
// a file goes inline, whose first line is a marker. The live roster's model (EDITOR_LIVE_MODEL overrides) gets
// a message with big.txt attached and is asked for the file's first line. These agree:
//   the message is accepted, and its UserMessage carries big.txt's reference line naming the path, size and
//   line count, not its content;
//   the model's read_file of big.txt follows the message, and its reply holds the marker;
//   server.jsonl's TURN_ACCEPTED counts 1 attachment, 1 by reference.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

const MODEL = process.env.EDITOR_LIVE_MODEL || undefined;
const MARKER = "the first line is marker 4471";
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
type Env = { seq: number; kind: string; payload: Record<string, unknown> };
const entries = (root: string): Env[] => readdirSync(root).filter((f) => f.startsWith("events-")).sort()
  .flatMap((f) => readFileSync(join(root, f), "utf8").split("\n").filter(Boolean)).map((l) => JSON.parse(l) as Env);

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const repo = join(__dirname, ".scratch", "attachments-by-reference-" + process.pid);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "big.txt"), MARKER + "\n" + ("x".repeat(99) + "\n").repeat(700));
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  const launch = launchArgs({ roster: "live" });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, MODEL, { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("Reply with the single word ready. Use no tools.");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 300_000 });
    const sid = await win.evaluate(() => (window as unknown as { __vm: { get(n: number): { snapshot(): { sessionId: string } } } }).__vm.get(1).snapshot().sessionId);
    const ask = "One file is attached by reference: its line names its path. Use read_file on that path, then reply with the file's first line exactly and nothing else.";
    const sent = await win.evaluate(async ([s, text]) => {
      const r = await fetch(`/api/session/${encodeURIComponent(s)}/turn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, attachments: [{ kind: "file", label: "big.txt", ref: "big.txt" }] }) });
      return { status: r.status, body: await r.text() };
    }, [sid, ask] as const);
    if (sent.status !== 200) throw new Error(`the message with big.txt: ${sent.status} ${sent.body}`);
    const record = await win.evaluate(async (s) => (await (await fetch(`/api/session/${encodeURIComponent(s)}`)).json()).record as string, sid);
    const deadline = Date.now() + 300_000;
    let envs = entries(record);
    const asked = () => envs.find((e) => e.kind === "UserMessage" && e.payload.text === ask);
    while (Date.now() < deadline && !(asked() && envs.some((e) => e.kind === "Returned" && e.seq > asked()!.seq))) { await new Promise((r) => setTimeout(r, 500)); envs = entries(record); }
    await app.close();
    const msg = asked();
    if (!msg) throw new Error("no UserMessage for the message");
    const att = (msg.payload.attachments as { text?: string }[] | undefined) ?? [];
    const line = att[0]?.text ?? "";
    if (att.length !== 1 || line !== "(not inlined: 68.4 KB, 701 lines, over the 64 KB a file goes inline; big.txt; read it with your file tools)") throw new Error(`the attachment's text: ${JSON.stringify(att)}`);
    const read = envs.find((e) => e.kind === "ToolCall" && e.seq > msg.seq && e.payload.tool === "read_file" && String((e.payload.args as unknown[])[0]).endsWith("big.txt"));
    if (!read) throw new Error(`the model made no read_file of big.txt: ${JSON.stringify(envs.filter((e) => e.seq > msg.seq && e.kind === "ToolCall").map((e) => [e.payload.tool, e.payload.args]))}`);
    const replies = envs.filter((e) => e.seq > msg.seq && (e.kind === "ModelReply" || e.kind === "FinalAnswer")).map((e) => String(e.payload.text ?? ""));
    if (!replies.some((t) => t.includes("4471"))) throw new Error(`the reply has no marker: ${JSON.stringify(replies)}`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const server = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const accepted = server.filter((r) => r.name === "TURN_ACCEPTED").map((r) => [r.payload.attachments, r.payload.by_reference]);
    if (JSON.stringify(accepted) !== JSON.stringify([[0, 0], [1, 1]])) throw new Error(`TURN_ACCEPTED ${JSON.stringify(accepted)}`);
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`attachments_by_reference_live: ok — big.txt went as its reference line; the model's read_file at ${read.seq} followed it and its reply holds the first line's marker; TURN_ACCEPTED 1 attachment, 1 by reference; packaged=${String(booted.packaged)}`);
    status = 0;
  } catch (e) {
    console.error(`attachments_by_reference_live: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
