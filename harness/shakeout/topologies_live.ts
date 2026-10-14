// A real model calls Review and Build in the app (UI sprint 177; research r8 § 4.1, § 4.3).
//
// Live: it needs a real model (TOPOLOGIES_LIVE_MODEL, default glm-5.2:cloud through Ollama), so it
// is not in `gates:electron`. SHAKEOUT_APP=/Applications/Substrate.app runs the installed app on
// its own state folder.
//
// Steps, in a fresh repository whose `feature` branch adds `mean(xs)` (it divides by zero on []):
//   1. open a session on the model in the repository; ask it to review `feature` and to build a
//      card (add `slugify` to text.py; two commands must pass);
//   2. the session's runs open their panes as they start;
//   3. both runs end; the review's report names `mean`; the build ends done;
//   4. the card's commands pass on the build's branch, run here in a fresh worktree;
//   5. a second message: the session's record holds each run's end, told once.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";
import { scratchDir } from "./lib/scratch";

type Row = { role: string; text: string };
type Run = { run_id: string; topology: string; running: boolean; paused: boolean; outcome: string | null };
type Snap = { sessionId: string | null; transcript: Row[]; viewOnly: string | null; runs: Run[] };
type Vm = { get(id: number): { snapshot(): Snap } | null; paneIds(): number[] };

const MODEL = process.env.TOPOLOGIES_LIVE_MODEL || "glm-5.2:cloud";
const CHECKS = [
  "python3 -m unittest -q test_text",
  "python3 -c \"from text import slugify; assert slugify('Hello Big World') == 'hello-big-world'\"",
];

function git(repo: string, ...args: string[]): string {
  return execFileSync("git", ["-C", repo, "-c", "user.name=fixture", "-c", "user.email=fixture@example.com", ...args], { encoding: "utf8" }).trim();
}

function fixtureRepo(): string {
  const repo = join(scratchDir("topologies-live-"), "textlib");
  mkdirSync(repo);
  writeFileSync(join(repo, "text.py"), 'def word_count(text):\n    """The number of words in text, split on whitespace."""\n    return len(text.split())\n');
  writeFileSync(join(repo, "test_text.py"), "import unittest\n\nfrom text import word_count\n\n\nclass WordCount(unittest.TestCase):\n    def test_counts_words(self):\n        self.assertEqual(word_count('a b  c'), 3)\n\n\nif __name__ == '__main__':\n    unittest.main()\n");
  git(repo, "init", "-q", "-b", "main");
  git(repo, "add", "-A");
  git(repo, "commit", "-qm", "word_count");
  git(repo, "checkout", "-qb", "feature");
  writeFileSync(join(repo, "stats.py"), "def mean(xs):\n    return sum(xs) / len(xs)\n");
  git(repo, "add", "-A");
  git(repo, "commit", "-qm", "mean");
  git(repo, "checkout", "-q", "main");
  return repo;
}

async function main(): Promise<void> {
  const repo = fixtureRepo();
  const launch = launchArgs({ roster: "live" });
  const shot = (name: string) => process.env.TOPOLOGIES_LIVE_SHOTS ? join(process.env.TOPOLOGIES_LIVE_SHOTS, name) : null;
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    const sid = await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: ${JSON.stringify(MODEL)}, workspace: ${JSON.stringify(repo)} }) }).then(async (r) => { if (!r.ok) throw new Error("open " + r.status + " " + await r.text()); return (await r.json()).session_id; })`) as string;
    await win.evaluate(async (id) => { await (window as unknown as { __vm: { get(n: number): { attachExisting(i: string): Promise<void> } } }).__vm.get(1).attachExisting(id); }, sid);
    const snap = (id: number) => win.evaluate((n) => (window as unknown as { __vm: Vm }).__vm.get(n)?.snapshot() ?? null, id);
    const send = async (text: string) => {
      const input = win.locator('[data-input-bar][placeholder^="type to input"]').first();
      await input.click();
      await input.fill(text);
      await win.keyboard.press("Enter");
    };

    // 1. The ask.
    await send([
      "Two jobs, both with your tools. First, call the review tool on the branch `feature` with the defects style.",
      "Second, call the build tool with this card:",
      "what: add a function slugify(text) to text.py that lowercases the text and joins its words with hyphens, and a unittest for it in test_text.py;",
      "where: text.py, test_text.py;",
      `commands: ${CHECKS.map((c) => JSON.stringify(c)).join(" and ")}.`,
      "Both return at once; say what you started and stop.",
    ].join("\n"));

    // 2. The runs and their panes.
    const started = Date.now();
    let paneCount = 0;
    let runs: Run[] = [];
    while (Date.now() - started < 15 * 60_000) {
      const s = (await snap(1))!;
      runs = s.runs;
      const viewOnly = await win.evaluate(() => { const vm = (window as unknown as { __vm: Vm }).__vm; return vm.paneIds().filter((id) => vm.get(id)?.snapshot().viewOnly).length; });
      if (viewOnly > paneCount) {
        paneCount = viewOnly;
        const f = shot(`panes-${paneCount}.png`);
        if (f) await win.screenshot({ path: f });
      }
      const topologies = new Set(runs.map((r) => r.topology));
      if (topologies.has("review") && topologies.has("build") && runs.every((r) => !r.running && !r.paused)) break;
      await win.waitForTimeout(2_000);
    }
    const review = runs.find((r) => r.topology === "review");
    const build = runs.find((r) => r.topology === "build");
    if (!review || !build) throw new Error(`the session started ${JSON.stringify(runs)}; pane 1: ${JSON.stringify((await snap(1))!.transcript.slice(-8).map((r) => r.text.slice(0, 200)))}`);
    if (runs.some((r) => r.running)) throw new Error(`runs still running after 15 minutes: ${JSON.stringify(runs)}`);
    if (paneCount < 2) throw new Error(`only ${paneCount} run pane(s) opened`);
    console.log(`topologies_live: runs ${JSON.stringify(runs)}`);

    // 3, 5. Ask again: the record holds each run's end, and the reply reads them.
    await send("Both runs have ended. What did the review find, and did the build's checks pass?");
    await win.waitForFunction(() => {
      const t = (window as unknown as { __vm: Vm }).__vm.get(1)?.snapshot().transcript ?? [];
      return t.filter((r) => r.text.includes(" ended ")).length >= 2 && t[t.length - 1]?.text.startsWith("· returned");
    }, undefined, { timeout: 10 * 60_000 });
    const rows = (await snap(1))!.transcript;
    const ends = rows.filter((r) => /^run r_\S+ · (review|build) ended /.test(r.text)).map((r) => r.text);
    console.log(`topologies_live: ends ${JSON.stringify(ends)}`);
    const reviewEnd = ends.find((t) => t.includes(review.run_id));
    const buildEnd = ends.find((t) => t.includes(build.run_id));
    if (!reviewEnd || !buildEnd) throw new Error(`the caller's record lacks a run's end: ${JSON.stringify(ends)}`);
    if (ends.length !== 2) throw new Error(`a run's end was told more than once: ${JSON.stringify(ends)}`);
    if (!reviewEnd.includes("ended done")) throw new Error(`the review ended ${reviewEnd}`);
    if (!buildEnd.includes("ended done")) throw new Error(`the build ended ${buildEnd}`);
    const reply = rows.filter((r) => r.role === "model").pop()?.text ?? "";
    console.log(`topologies_live: the model's reply: ${reply.slice(0, 600)}`);

    // The review's report, read from its run record with the kernel's reader.
    const reviewText = execFileSync("uv", ["run", "--project", "../substrate", "python", "-c",
      "import sys; from substrate import api; print(next(e['payload']['done'] for e in api.read_record(sys.argv[1], resolve_blobs=True) if e['kind'] == 'ReportWritten'))",
      join(launch.state, "sessions", "runs", review.run_id)], { cwd: join(__dirname, "..", ".."), encoding: "utf8" });
    console.log(`topologies_live: the review: ${reviewText.slice(0, 1500)}`);
    if (!reviewText.includes("mean")) throw new Error("the review does not name mean");

    // 4. The card's commands on the build's branch, in a worktree made here.
    const branch = `build/${build.run_id}`;
    const check = join(scratchDir("topologies-live-check-"), "wt");
    git(repo, "worktree", "add", "-q", "--detach", check, branch);  // the branch is checked out in the build's worktree
    const commits = git(repo, "log", "--oneline", `main..${branch}`);
    if (!commits) throw new Error(`the branch ${branch} has no commit past main`);
    for (const c of CHECKS) execFileSync("/bin/sh", ["-c", c], { cwd: check, stdio: "pipe" });
    const f = shot("end.png");
    if (f) await win.screenshot({ path: f });
    console.log(`topologies_live: ok — ${MODEL} started ${review.run_id} (review) and ${build.run_id} (build); ${paneCount} run panes opened; both ended done; ${branch} has ${commits.split("\n").length} commit(s) and passes the card's ${CHECKS.length} commands (${sid}, ${repo})`);
    code = 0;
  } catch (e) {
    console.error(`topologies_live: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
