// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// One file's hunks through the running app (sprint 418; roadmap 2026-11-09-code-editor r8, E2). A real
// repository (main with src/menu.ts) is bound through the picker; in the session's workspace src/menu.ts is then changed
// and src/new.ts added, uncommitted (sprint 483: the base is the branch's own last commit). The window reads
// GET /api/session/<id>/diff?path= for both files and for a path outside the workspace. The answer's hunk headers must
// equal `git diff -U0 HEAD` (a new file: against nothing, `git diff --no-index`); after close, server.jsonl must hold
// DIFF_READ base head with each read's hunk count, and the outside path a 400.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const repo = join(__dirname, ".scratch", "session-hunks-" + process.pid);
  mkdirSync(join(repo, "src"), { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  writeFileSync(join(repo, "src/menu.ts"), "a\nb\nc\nd\n");
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    const snap = await win.evaluate(() => { const s = (window as unknown as { __vm: { get(n: number): { snapshot(): { sessionId: string; workspacePath: string } } } }).__vm.get(1).snapshot(); return { sid: s.sessionId, ws: s.workspacePath }; });
    const read = (rel: string) => win.evaluate(`fetch("/api/session/${snap.sid}/diff?path=" + encodeURIComponent(${JSON.stringify(rel)})).then(async (r) => ({ status: r.status, body: await r.json() }))`) as Promise<{ status: number; body: { base: string; hunks: { old_start: number; old_count: number; new_start: number; new_count: number }[] } }>;
    writeFileSync(join(snap.ws, "src/menu.ts"), "a\nB\nc\nd\ne\n");
    writeFileSync(join(snap.ws, "src/new.ts"), "x\n");
    // git diff exits 1 when it finds a difference (--no-index); its output is still the answer.
    const diffOut = (...args: string[]) => { try { return git(snap.ws, ...args); } catch (e) { return String((e as { stdout?: string }).stdout ?? ""); } };
    const counts: number[] = [];
    for (const rel of ["src/menu.ts", "src/new.ts"]) {
      const got = await read(rel);
      const header = (h: { old_start: number; old_count: number; new_start: number; new_count: number }) => `-${h.old_start},${h.old_count} +${h.new_start},${h.new_count}`;
      const tracked = git(snap.ws, "ls-files", "--", rel).trim() !== "";
      const want = (tracked ? diffOut("diff", "-U0", "HEAD", "--", rel) : diffOut("diff", "-U0", "--no-index", "/dev/null", rel)).split("\n").filter((l) => l.startsWith("@@")).map((l) => { const m = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(l)!; return `-${m[1]},${m[2] ?? "1"} +${m[3]},${m[4] ?? "1"}`; });
      if (got.status !== 200 || got.body.base !== "head" || JSON.stringify(got.body.hunks.map(header)) !== JSON.stringify(want)) throw new Error(`${rel}: the app read ${JSON.stringify(got)}; git says ${JSON.stringify(want)}`);
      counts.push(want.length);
    }
    const out = await read("../outside.txt");
    if (out.status !== 400) throw new Error(`a path outside the workspace answered ${out.status}`);
    await app.close();
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const lines = (f: string) => readFileSync(join(traces, boot, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const reads = lines("server.jsonl").filter((r) => r.name === "DIFF_READ" && r.payload.hunks !== undefined).map((r) => `${String(r.payload.base)}:${String(r.payload.hunks)}`);
    if (JSON.stringify(reads) !== JSON.stringify(counts.map((n) => `head:${n}`))) throw new Error(`DIFF_READ with hunks: ${JSON.stringify(reads)}; want ${JSON.stringify(counts)}`);
    const booted = lines("main.jsonl").find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`session_hunks: ok — src/menu.ts ${counts[0]} hunks, src/new.ts ${counts[1]} (= git diff -U0); the outside path 400; DIFF_READ ${reads.join(" ")}; packaged=${String(booted.packaged)}`);
    code = 0;
  } catch (e) {
    console.error(`session_hunks: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
