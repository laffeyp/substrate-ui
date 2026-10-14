// The handoff setting on a real model (UI sprint 179; kernel K324, vocabulary § Y.3).
//
// Live: it needs a real model (HANDOFF_LIVE_MODEL, default glm-5.2:cloud), so it is not in
// `gates:electron`. SHAKEOUT_APP=/Applications/Substrate.app runs the installed app.
//
// The same task, in two sessions on the same model, one at `rare` and one at `eager`: a small code
// change whose done-condition is a command, which the model can do itself or hand to build. Each
// session's prompt must carry its position's text. Each record is read with
// `substrate handoff`, which prints the topology calls per turn. The observation is the two
// counts; the run fails only when a session does not answer.

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { launchArgs, waitForApp } from "./lib/electron";
import { scratchDir } from "./lib/scratch";

const MODEL = process.env.HANDOFF_LIVE_MODEL || "glm-5.2:cloud";
// A change whose done-condition is a command: the case the eager text names for build.
const TASK =
  "Add a function slugify(text) to text.py that lowercases the text and joins its words with " +
  "hyphens, with a unittest for it in test_text.py. It is done when `python3 -m unittest -q " +
  "test_text` passes.";
const TEXT_PY = 'def word_count(text):\n    return len(text.split())\n';
const TEST_PY = "import unittest\n\nfrom text import word_count\n\n\nclass T(unittest.TestCase):\n    def test_count(self):\n        self.assertEqual(word_count('a b'), 2)\n";

async function main(): Promise<void> {
  const launch = launchArgs({ roster: "live" });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    const rows: Record<string, unknown[]> = {};
    for (const position of ["rare", "eager"]) {
      const folder = scratchDir(`handoff-${position}-`);
      writeFileSync(join(folder, "text.py"), TEXT_PY);
      writeFileSync(join(folder, "test_text.py"), TEST_PY);
      const sid = await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: ${JSON.stringify(MODEL)}, workspace: ${JSON.stringify(folder)}, handoff: ${JSON.stringify(position)} }) }).then(async (r) => { if (!r.ok) throw new Error("open " + r.status + " " + await r.text()); return (await r.json()).session_id; })`) as string;
      const turn = await win.evaluate(async ([id, text]) => {
        const r = await fetch(`/api/session/${id}/turn`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
        return { status: r.status, body: await r.text() };
      }, [sid, TASK]);
      if (turn.status !== 200) throw new Error(`${position}: the turn returned ${turn.status} ${turn.body.slice(0, 300)}`);
      const record = join(launch.state, "sessions", sid, "record");
      const out = execFileSync("uv", ["run", "--project", join(__dirname, "..", "..", "..", "substrate"), "substrate", "handoff", record], { encoding: "utf8" });
      rows[position] = out.trim().split("\n").filter((l) => l.startsWith("{")).map((l) => JSON.parse(l));
      // The position's text reached the prompt (rare and eager each write one), or a count says nothing.
      const reached = execFileSync("uv", ["run", "--project", join(__dirname, "..", "..", "..", "substrate"), "python", "-c",
        "import sys; from substrate import api; from substrate.topologies.session.vocabulary import HANDOFF_TEXTS, HandoffPosition as H; t = HANDOFF_TEXTS[H(sys.argv[2])]; print(any(t in str(e['payload'].get('system', '')) + str(e['payload'].get('text', '')) for e in api.read_record(sys.argv[1], resolve_blobs=True) if e['kind'] == 'PromptComposed'))",
        record, position], { encoding: "utf8" }).trim();
      if (reached !== "True") throw new Error(`${position}: the position's text is not in any prompt of ${sid}`);
      // What it did instead, and whether the topology tools were on offer.
      const seen = execFileSync("uv", ["run", "--project", join(__dirname, "..", "..", "..", "substrate"), "python", "-c",
        "import sys, json; from substrate import api; ev = list(api.read_record(sys.argv[1], resolve_blobs=True)); st = next(e['payload'] for e in ev if e['kind'] == 'SessionStarted'); print(json.dumps({'offered': [t for t in st['tool_suite'] if t in ('delegate', 'review', 'build')], 'called': [e['payload']['tool'] for e in ev if e['kind'] == 'ToolCall']}))",
        record], { encoding: "utf8" }).trim();
      console.log(`handoff_live: ${position} (${sid}): ${out.trim()} ${seen}`);
    }
    const calls = (p: string) => (rows[p] as { calls: number }[]).reduce((n, r) => n + r.calls, 0);
    console.log(`handoff_live: ok — ${MODEL}: rare made ${calls("rare")} topology call(s), eager made ${calls("eager")}, on the same task`);
    code = 0;
  } catch (e) {
    console.error(`handoff_live: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
