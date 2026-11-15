// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Change marks start at the repository (sprint 502; the Architect, 2026-11-14: "if it's not a repository, no
// change files, but if it is a repository inside a plain workspace, change files … the change recognition
// starts at the repository level always"). The workspace is a plain folder, created with make_repository
// false (sprint 497), holding:
//   loose.txt, notes/plan.md          — outside every repository;
//   projects/alpha/                   — a repository: the large fixtures (lib/multipane.ts), committed, then one
//                                       file edited three folders down and one new file added;
//   projects/beta/                    — a repository, committed, unchanged.
// The tree is opened down to the edited file. These agree:
//   dots   — the edited and new files, each folder above them up to and including projects/alpha; nothing in
//            projects/beta, nothing outside the repositories, and not projects/, which is above them;
//   pixels — the anchor's modified_dots counts the files; the accent row bands count files and folders;
//   hunks  — the edited file opened in the editor reads its hunk against its repository's HEAD (status line);
//   trace  — DIFF_READ base repositories with repositories 2, and the one-file read base head;
//   disk   — the workspace holds no .git of its own after the run.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels } from "./lib/editor_pixels";
import { bigWorkspace } from "./lib/multipane";
import { scratchDir } from "./lib/scratch";

const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });

function repo(at: string, from: string): void {
  mkdirSync(at, { recursive: true });
  cpSync(from, at, { recursive: true });
  git(at, "init", "-q", "-b", "main");
  git(at, "config", "user.email", "gate@example.invalid");
  git(at, "config", "user.name", "gate");
  git(at, "add", "-A");
  git(at, "commit", "-q", "-m", "base");
}

const dotsOf = (win: Page, kind: string) => win.evaluate((k) => Array.from(document.querySelectorAll(`[data-tree-dot="${k}"]`)).map((d) => d.parentElement!.getAttribute("data-tree-row")!).sort(), kind);
const drawn = (win: Page) => win.evaluate(() => Array.from(document.querySelectorAll("[data-tree-row]")).map((e) => e.getAttribute("data-tree-row")!));

async function openDir(win: Page, rel: string): Promise<void> {
  const row = win.locator(`[data-tree-row="${rel}"]`).first();
  await row.waitFor({ state: "visible", timeout: 10_000 });
  if (!(await win.locator(`[data-tree-row^="${rel}/"]`).first().isVisible().catch(() => false))) await row.click();
  await settled(win);
}

async function main(): Promise<void> {
  const plain = scratchDir("dots-repos-");
  writeFileSync(join(plain, "loose.txt"), "outside every repository\n".repeat(200));
  mkdirSync(join(plain, "notes"), { recursive: true });
  writeFileSync(join(plain, "notes", "plan.md"), "# plan\n" + "a loose note line\n".repeat(400));
  const A = bigWorkspace("alpha"), B = bigWorkspace("beta");
  const alpha = join(plain, "projects", "alpha"), beta = join(plain, "projects", "beta");
  repo(alpha, A.root);
  repo(beta, B.root);
  const edited = A.files.find((f) => f.endsWith("models.py"))!; // alpha/<a|d|f>/… three or more folders down
  writeFileSync(join(alpha, edited), "# edited by the gate, sprint 502\n" + readFileSync(join(alpha, edited), "utf8"));
  const added = "alpha/d/e/added_by_gate.ts";
  writeFileSync(join(alpha, added), "export const added = 1;\n".repeat(50));
  // The truth, from git in each repository, as workspace paths.
  const files = [`projects/alpha/${edited}`, `projects/alpha/${added}`].sort();
  const dirs = [...new Set(files.flatMap((f) => f.split("/").slice(0, -1).map((_, n, a) => a.slice(0, n + 1).join("/"))))].filter((d) => d === "projects/alpha" || d.startsWith("projects/alpha/")).sort();

  const launch = launchArgs();
  const shots = join(__dirname, "..", "..", "runs", "packaged", `sprint-502-dots-${process.env.SHAKEOUT_APP ? "bundle" : "source"}-${Date.now()}`);
  mkdirSync(shots, { recursive: true });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const seen: string[] = [];
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    const base = `http://127.0.0.1:${new URL(win.url()).port}`;
    const post = (path: string, body: unknown) => fetch(base + path, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const made = await (await post("/api/session", { driver: "deterministic", workspace: plain, make_repository: false })).json() as { session_id: string };
    await post(`/api/session/${made.session_id}/turn`, { text: "hello" });
    await win.evaluate(`(function () { var vm = window.__vm; return (vm.get(1) || vm.spawn(1)).attachExisting(${JSON.stringify(made.session_id)}); })()`);
    await win.waitForFunction(`window.__vm.get(1).snapshot().sessionId === ${JSON.stringify(made.session_id)}`, undefined, { timeout: 15_000 });
    await win.keyboard.press("Meta+Shift+E");
    await win.locator("[data-editor-view]").first().waitFor({ state: "visible", timeout: 10_000 });
    for (const d of ["notes", "projects", "projects/beta", ...dirs]) await openDir(win, d);

    const shot = join(shots, "tree.png");
    const deadline = Date.now() + 20_000;
    let f = await dotsOf(win, "1"), d = await dotsOf(win, "dir");
    let px = await readPixels(win, shot, (await drawn(win)).length);
    while (Date.now() < deadline && !(JSON.stringify(f) === JSON.stringify(files) && JSON.stringify(d) === JSON.stringify(dirs) && px.dotted === files.length + dirs.length)) {
      await settled(win);
      f = await dotsOf(win, "1"); d = await dotsOf(win, "dir");
      px = await readPixels(win, shot, (await drawn(win)).length);
    }
    const errs: string[] = [];
    if (JSON.stringify(f) !== JSON.stringify(files)) errs.push(`file dots on ${JSON.stringify(f)}; git says ${JSON.stringify(files)}`);
    if (JSON.stringify(d) !== JSON.stringify(dirs)) errs.push(`folder dots on ${JSON.stringify(d)}; want ${JSON.stringify(dirs)}`);
    const outside = [...f, ...d].filter((p) => !p.startsWith("projects/alpha"));
    if (outside.length) errs.push(`dots outside projects/alpha: ${JSON.stringify(outside)}`);
    if ("error" in px.anchor || px.anchor.modified_dots !== files.length) errs.push(`the anchor's modified_dots ${"error" in px.anchor ? px.anchor.error : px.anchor.modified_dots}; ${files.length} files changed`);
    if (px.dotted !== files.length + dirs.length) errs.push(`${px.dotted} accent row bands; ${files.length} files and ${dirs.length} folders`);
    seen.push(`file dots ${f.length}, folder dots ${JSON.stringify(d)}, accent bands ${px.dotted}; beta, notes/, loose.txt and projects/ undotted`);

    await win.locator(`[data-tree-row="projects/alpha/${edited}"]`).first().click();
    const vs = await win.waitForFunction(() => {
      const m = /^\+(\d+) −\d+ vs head$/.exec(document.querySelector("[data-status-vs]")?.textContent ?? "");
      return m ? Number(m[1]) : null;
    }, undefined, { timeout: 15_000 }).then((h) => h.jsonValue() as Promise<number>, () => null);
    await win.screenshot({ path: join(shots, "edited-file.png") });
    if (vs !== 1) errs.push(`the edited file's status line reads vs head +${String(vs)}; one line was added`);
    seen.push(`the edited file reads vs head +${String(vs)}`);
    await app.close();

    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const reads = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).filter((r) => r.name === "DIFF_READ").map((r) => r.payload);
    const whole = reads.filter((r) => r.hunks === undefined), one = reads.filter((r) => r.hunks !== undefined);
    seen.push(`DIFF_READ whole ${JSON.stringify(whole.map((r) => `${String(r.base)}:${String(r.files)}:${String(r.repositories)}`))}, one-file ${JSON.stringify(one.map((r) => `${String(r.base)}:${String(r.hunks)}`))}`);
    if (!whole.some((r) => r.base === "repositories" && r.repositories === 2 && r.files === 2)) errs.push("no DIFF_READ base repositories, repositories 2, files 2");
    if (!one.some((r) => r.base === "head" && Number(r.hunks) >= 1)) errs.push("no one-file DIFF_READ base head with a hunk");
    if (existsSync(join(plain, ".git"))) errs.push("the plain workspace was made a repository");
    const drawnRecs = windowRecords(launch).filter((r) => r.name === "EDITOR_DRAWN");
    if (!drawnRecs.some((r) => r.payload.modified_dots === files.length)) errs.push(`no EDITOR_DRAWN with modified_dots ${files.length}`);
    if (errs.length) throw new Error(errs.join("; "));
    console.log(`editor_dots_repositories: ok — ${seen.join("; ")}; packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshots ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`editor_dots_repositories: FAIL — ${(e as Error).message.split("\n")[0]}; ${seen.join("; ")}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
