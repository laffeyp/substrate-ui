// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The test install runs beside the working install and keeps to its own files (sprint 489; roadmap
// 2026-11-11-second-build r1 E3). The working install is /Applications/Substrate.app and must already
// be running. The test install is NEXT_APP (default dist-electron-next/mac-arm64/Substrate Next.app),
// launched as a person launches it, through `open` (no SUBSTRATE_HOME, no --user-data-dir), so its
// identity record decides its name, store and paths; its window takes no focus
// (SUBSTRATE_GATE_ISOLATE, passed by `open --env`). Playwright's launch is not used: its debugging
// switches leave no Singleton files in the data folder (measured, sprint 489). The turn runs over the
// test install's own server, whose port its log names; it quits by name, as runbook step 17 quits an
// install. These agree:
//   beside    — the test install opens while the working install runs; its data folder holds its own
//               SingletonLock;
//   own       — it runs one deterministic turn; that session's manifest is under ~/.substrate-next;
//               its log ~/Library/Logs/Substrate Next/substrate.log gains an app boot; its trace's
//               APP_BOOTED has packaged true, home_kind default;
//   untouched — before and after (the test install quit by name), the working install's main pid is
//               the same, ~/.substrate/sessions holds the same manifests with the same statuses, and
//               its log has the same count of app boots.
// Reads the working install's state only as counts. A person using the working install during the
// run can change its sessions; the gate then fails and says so.

import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";

const REPO_ROOT = join(__dirname, "..", "..");
const NEXT_APP = process.env.NEXT_APP || join(REPO_ROOT, "dist-electron-next", "mac-arm64", "Substrate Next.app");
const HOME = homedir();
const WORK = { store: join(HOME, ".substrate"), log: join(HOME, "Library", "Logs", "Substrate", "substrate.log") };
const NEXT = {
  store: join(HOME, ".substrate-next"),
  data: join(HOME, "Library", "Application Support", "Substrate Next"),
  logs: join(HOME, "Library", "Logs", "Substrate Next"),
};

/** The main process of the app whose executable is `exe`: no --type= switch (helpers carry one). */
function mainPid(exe: string): number | null {
  const out = execFileSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" });
  for (const line of out.split("\n")) {
    const m = /^\s*(\d+)\s+(.*)$/.exec(line);
    if (m && m[2].startsWith(exe) && !m[2].includes("--type=")) return Number(m[1]);
  }
  return null;
}
const workingPid = () => mainPid("/Applications/Substrate.app/Contents/MacOS/Substrate");
const nextPid = () => mainPid(join(NEXT_APP, "Contents", "MacOS", "Substrate"));

/** Each session's status, by id, from its manifest. */
function statuses(store: string): Map<string, string> {
  const out = new Map<string, string>();
  const base = join(store, "sessions");
  if (!existsSync(base)) return out;
  for (const id of readdirSync(base)) {
    const f = join(base, id, "manifest.json");
    if (!existsSync(f)) continue;
    try { out.set(id, String((JSON.parse(readFileSync(f, "utf8")) as { status?: string }).status)); } catch { out.set(id, "unreadable"); }
  }
  return out;
}

const boots = (log: string) => (existsSync(log) ? (readFileSync(log, "utf8").match(/ app boot ===/g) ?? []).length : 0);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const report: string[] = [];
  let status = 1;
  const pid0 = workingPid();
  if (!pid0) { console.error("two_installs: FAIL — the working install (/Applications/Substrate.app) is not running"); process.exit(1); }
  if (nextPid()) { console.error("two_installs: FAIL — the test install is already running"); process.exit(1); }
  const work0 = statuses(WORK.store);
  const workBoots0 = boots(WORK.log);
  const nextLog = join(NEXT.logs, "substrate.log");
  const nextBoots0 = boots(nextLog);
  const next0 = new Set(statuses(NEXT.store).keys());
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-489-two-installs-${new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-")}`);
  mkdirSync(shots, { recursive: true });
  const logLen0 = existsSync(nextLog) ? readFileSync(nextLog, "utf8").length : 0;
  execFileSync("open", ["-g", "-n", "--env", "SUBSTRATE_GATE_ISOLATE=1", NEXT_APP]);
  try {
    // Its server's port, from the lines its log gains after this launch.
    let port = 0;
    for (let k = 0; k < 120 && !port; k++) {
      await wait(250);
      const added = existsSync(nextLog) ? readFileSync(nextLog, "utf8").slice(logLen0) : "";
      port = Number(/server up on http:\/\/127\.0\.0\.1:(\d+)/.exec(added)?.[1] ?? 0);
    }
    if (!port) throw new Error(`no "server up" in ${nextLog} within 30 s`);
    // SingletonLock is a symlink to `<host>-<pid>`, not a file: existsSync follows it and reports false.
    let lockHeld = false;
    try { lockHeld = lstatSync(join(NEXT.data, "SingletonLock")).isSymbolicLink(); } catch { /* absent */ }
    report.push(`next pid ${String(nextPid())}, data folder lock ${lockHeld ? "held" : "missing"}`);
    if (!lockHeld) throw new Error(`no SingletonLock in ${NEXT.data}`);
    const controller = new SessionController(new NodeSubstrateClient(`http://127.0.0.1:${port}`));
    await controller.loadDriverRoster();
    await controller.openSession({ driver: "deterministic" });
    const sid = controller.snapshot().sessionId;
    if (!sid) throw new Error("no session opened on the test install");
    await controller.sendTurn("hello from the test install");
    for (let k = 0; k < 150 && !controller.snapshot().parkReason; k++) await wait(100);
    if (!controller.snapshot().parkReason) throw new Error("the turn did not park within 15 s");
    controller.disconnect();
    try { execFileSync("screencapture", ["-x", join(shots, "screen.png")]); } catch { report.push("screen capture refused"); }
    const pidMid = workingPid();
    if (pidMid !== pid0) throw new Error(`the working install's pid changed while the test install ran (${pid0} → ${String(pidMid)})`);
    execFileSync("osascript", ["-e", 'tell application "Substrate Next" to quit']);
    for (let k = 0; k < 120 && nextPid(); k++) await wait(250);
    if (nextPid()) throw new Error("the test install did not quit by name within 30 s");

    const newNext = [...statuses(NEXT.store).keys()].filter((id) => !next0.has(id));
    report.push(`next store new sessions ${newNext.length}`);
    if (!newNext.includes(sid)) throw new Error(`session ${sid} not under ${NEXT.store}`);
    const nextBoots = boots(nextLog) - nextBoots0;
    report.push(`next log app boots +${nextBoots}`);
    if (nextBoots < 1) throw new Error(`${nextLog} gained no app boot`);
    const traces = join(NEXT.logs, "traces");
    const boot = readdirSync(traces).filter((n) => statSync(join(traces, n)).isDirectory()).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    report.push(`next APP_BOOTED app_name ${String(booted.app_name)} packaged ${String(booted.packaged)} home_kind ${String(booted.home_kind)} gate_isolated ${String(booted.gate_isolated)}`);
    if (booted.packaged !== true || booted.home_kind !== "default" || booted.app_name !== "Substrate Next") throw new Error(`APP_BOOTED ${JSON.stringify(booted)}`);

    const pid1 = workingPid();
    const work1 = statuses(WORK.store);
    const changed = [...work0].filter(([id, st]) => work1.get(id) !== st).length;
    const added = [...work1.keys()].filter((id) => !work0.has(id)).length;
    const workBoots = boots(WORK.log) - workBoots0;
    report.push(`working pid ${pid0 === pid1 ? "same" : "changed"}; working sessions ${work0.size}, changed ${changed}, added ${added}; working log app boots +${workBoots}`);
    if (pid1 !== pid0 || changed || added || workBoots) throw new Error("the working install was touched");
    console.log(`two_installs: ok — ${report.join("; ")}; screenshot in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`two_installs: FAIL — ${(e as Error).message}; ${report.join("; ")}`);
    if (nextPid()) { try { execFileSync("osascript", ["-e", 'tell application "Substrate Next" to quit']); } catch { /* best-effort */ } }
  }
  process.exit(status);
}

main();
