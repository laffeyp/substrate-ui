// A git workspace's label on the records page reads "git" (UI sprint 154): sessions do not get
// worktrees, so the page does not say they do.
//
// Steps: `git init` a repo-local folder (the page leaves out $TMPDIR paths); open a session in it
// over the API; open the records page; read the folder's row.

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { launchArgs, waitForApp } from "./lib/electron";

// Plain-string evaluate: esbuild's __name helper does not exist in the page.
const ROW = (leaf: string) => `(() => {
  const path = Array.from(document.querySelectorAll("[data-records-workspaces] span")).find((e) => e.offsetParent !== null && (e.textContent || "").endsWith(${JSON.stringify(leaf)}));
  return path ? Array.from(path.parentElement.children).map((c) => (c.textContent || "").trim()) : null;
})()`;

async function main(): Promise<void> {
  const folder = join(__dirname, ".scratch", "git-label-" + process.pid);
  mkdirSync(folder, { recursive: true });
  execFileSync("git", ["init", "-q", folder]);
  const leaf = folder.split("/").pop()!;
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: "deterministic", workspace: ${JSON.stringify(folder)} }) }).then((r) => { if (!r.ok) throw new Error("open " + r.status); })`);
    await win.evaluate(`window.__vm.loadRecentWorkspaces()`);
    await win.locator("[data-top-bar] span", { hasText: /^records$/ }).first().click();
    await win.waitForFunction(`!!(${ROW(leaf)})`, undefined, { timeout: 10_000 })
      .catch(() => { throw new Error("the git folder is not on the records page"); });
    const cells = await win.evaluate(ROW(leaf)) as string[];
    const label = cells[2];
    if (label !== "git" || cells.join(" ").includes("worktree")) throw new Error(`the row reads ${JSON.stringify(cells)}; want the label "git" and no "worktree"`);
    console.log(`git_workspace_label: ok — the git folder's row reads ${JSON.stringify(cells)}`);
    code = 0;
  } catch (e) {
    console.error(`git_workspace_label: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
