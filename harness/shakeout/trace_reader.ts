// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The trace reader (scripts/read_trace.py, plan 2026-11-05-sdd-signals item 6, sprint 378). Pane 1
// picks the sandbox and the deterministic model and sends "hello"; the app closes; the reader prints
// the launch for pane 1. Its listing alone must say what the pane did, from pick to reply:
//   the picker's folder armed, then its commit, the session's open acked, the turn submitted, the
//   turn acked, and the reply's drawn transcript row joined to the kernel's entry at its seq (a kernel line
//   naming that seq and a kind), and no seq the kernel record lacks.
// Plant: a reader that skips the join prints no kernel line.

import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

const REPO = join(__dirname, "..", "..");
const visible = (win: Page, sel: string) => win.locator(sel).filter({ visible: true }).first();

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic");
    await visible(win, "textarea[data-input-bar]").fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    const sid = await win.evaluate(() => (window as any).__vm.get(1).snapshot().sessionId as string);
    await app.close();

    const r = spawnSync("uv", ["run", "--project", join(REPO, "..", "substrate"), "python", join(REPO, "scripts", "read_trace.py"), "--home", launch.state, "--pane", "1"], { encoding: "utf8", cwd: REPO });
    if (r.status !== 0) throw new Error(`read_trace exited ${r.status}: ${r.stderr.trim()}`);
    const lines = r.stdout.split("\n");
    const at = (pat: RegExp) => lines.findIndex((l) => pat.test(l));
    const chain = [/ PICKER_FOLDER_ARMED /, / PICKER_COMMITTED /, / SESSION_OPEN_ACKED .*session_id=/, / TURN_SUBMITTED /, / TURN_ACK /];
    const where = chain.map(at);
    const ordered = where.every((i, k) => i >= 0 && (k === 0 || i > where[k - 1]));
    // The reply's row: drawn after the turn was submitted (the user's own row is drawn before the ack).
    const drawn = lines.findIndex((l, i) => i > where[3] && / TRANSCRIPT_ROW_DRAWN .*kind=ModelReply/.test(l));
    const joined = drawn >= 0 && /↳ kernel seq=\d+ ModelReply /.test(lines[drawn + 1] ?? "");
    const missing = lines.filter((l) => /not in the record/.test(l));
    if (!r.stdout.startsWith("## Signal Capture") || !ordered || !joined || missing.length) {
      throw new Error(`the listing for pane 1 (session ${sid}): header ${r.stdout.startsWith("## Signal Capture")}, chain at lines ${where.join(", ")}, reply joined ${joined}, ${missing.length} seq(s) not in the record\n${r.stdout.slice(0, 3000)}`);
    }
    console.log(`trace_reader: ok — pane 1 from pick to reply in order (lines ${where.join(", ")}); the reply's row joined to the kernel: ${lines[drawn + 1].trim().slice(0, 100)}`);
    code = 0;
  } catch (e) {
    console.error(`trace_reader: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
