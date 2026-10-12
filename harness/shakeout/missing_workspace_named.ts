// A turn whose workspace folder is gone names the folder (kernel sprint 297, UI sprint 160): the
// transcript's error row says which folder, and that it is the session's workspace, where it said
// `FileNotFoundError(2, 'No such file or directory')`.
//
// Steps, live roster (the claude CLI is discovered): open a claude session over the API in a
// repo-local folder; attach pane 1; delete the folder; send a message. CliResponder refuses before
// it spawns, so no model is called.

import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { launchArgs, waitForApp } from "./lib/electron";

async function main(): Promise<void> {
  const folder = join(__dirname, ".scratch", "gone-workspace-" + process.pid);
  mkdirSync(folder, { recursive: true });
  const launch = launchArgs({ roster: "live" });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    const sid = await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: "claude", workspace: ${JSON.stringify(folder)} }) }).then(async (r) => { if (!r.ok) throw new Error("open " + r.status + " " + await r.text()); return (await r.json()).session_id; })`) as string;
    await win.evaluate(`window.__vm.get(1).attachExisting(${JSON.stringify(sid)})`);
    await win.waitForFunction(`window.__vm.get(1).snapshot().sessionId === ${JSON.stringify(sid)}`, undefined, { timeout: 15_000 });
    rmSync(folder, { recursive: true, force: true });
    await win.evaluate(`window.__vm.get(1).sendTurn("hello")`);
    await win.waitForFunction(`window.__vm.get(1).snapshot().transcript.some((r) => /model_error/.test(r.text || ""))`, undefined, { timeout: 30_000 })
      .catch(async () => { throw new Error(`no model_error row: ${await win.evaluate(`JSON.stringify(window.__vm.get(1).snapshot().transcript.slice(-3))`)}`); });
    const row = await win.evaluate(`window.__vm.get(1).snapshot().transcript.find((r) => /model_error/.test(r.text || "")).text`) as string;
    if (!row.includes(folder) || !row.includes("working folder does not exist")) throw new Error(`the error row reads ${JSON.stringify(row)}`);
    console.log(`missing_workspace_named: ok — ${row}`);
    code = 0;
  } catch (e) {
    console.error(`missing_workspace_named: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
