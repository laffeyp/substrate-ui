// The window reads a session written before vocabulary v0.3 and one written after it alike (U119).
//
// Old records end a turn with ModelReply → FinalAnswer (same text) → Park; v0.3 records write a
// ModelReply per model call (a tool-only one has no text) and end the turn with Returned. Both
// fixture sessions hold the same two turns (fixtures/write_session_shapes.py writes them into the
// launch's own SUBSTRATE_HOME before the app starts).
//
// Steps (run against the installed app with SHAKEOUT_APP=/Applications/Substrate.app):
//   1. write the two sessions; launch; bind pane 1;
//   2. attach each; read the transcript rows and the side graph's turn-end lane;
//   3. assert: each shows the replies "It is 5." and "Any time." once each, two turn-end rows
//      reading "· returned (replied) — your turn", and a "returned" lane with two segments;
//   4. the new session's failed-source SessionWarning (kernel K263) reads
//      "warning: fragment_source_failed · role · FileNotFoundError('reviewer.md')".

import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

type Row = { role: string; text: string };
type Pane = { snapshot(): { sessionId: string | null; transcript: Row[] }; attachExisting(id: string): Promise<void> };
type Vm = { get(id: number): Pane | null };

const REPO = join(__dirname, "..", "..");

async function main(): Promise<void> {
  const launch = launchArgs();
  const ids = JSON.parse(execFileSync("uv", ["run", "--project", "../substrate", "python", "harness/shakeout/fixtures/write_session_shapes.py"], {
    cwd: REPO, env: { ...process.env, SUBSTRATE_HOME: launch.state }, encoding: "utf8",
  }).trim().split("\n").pop()!) as { old: string; new: string };
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    await win.keyboard.press("Control+`");

    const seen: Record<string, { replies: string[]; ends: string[]; lane: number }> = {};
    const warnings: Record<string, string[]> = {};
    for (const [label, sid] of Object.entries(ids)) {
      await win.evaluate(async (id) => { await (window as unknown as { __vm: Vm }).__vm.get(1)!.attachExisting(id); }, sid);
      await win.waitForFunction(
        () => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript.filter((r) => r.role === "park").length === 2,
        undefined, { timeout: 15_000 },
      ).catch(() => { throw new Error(`${label}: the two turn ends never rendered`); });
      const rows = await win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript);
      await win.getByText("side", { exact: false }).filter({ hasText: /side$/ }).first().click();
      const lane = await win.evaluate(() => {
        const label = Array.from(document.querySelectorAll("span")).find((s) => s.textContent === "returned" && s.style.visibility === "hidden");
        const track = label?.parentElement?.children[1];
        return track ? track.children.length : -1;
      });
      await win.getByText("down", { exact: false }).filter({ hasText: /down$/ }).first().click();
      warnings[label] = rows.filter((r) => r.role === "warning").map((r) => r.text);
      seen[label] = {
        replies: rows.filter((r) => r.role === "model").map((r) => r.text),
        ends: rows.filter((r) => r.role === "park").map((r) => r.text),
        lane,
      };
    }
    const want = { replies: ["It is 5.", "Any time."], ends: ["· returned (replied) — your turn", "· returned (replied) — your turn"], lane: 2 };
    for (const [label, got] of Object.entries(seen)) {
      if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`${label} session shows ${JSON.stringify(got)}; expected ${JSON.stringify(want)}`);
    }
    const wantWarning = ["warning: fragment_source_failed · role · FileNotFoundError('reviewer.md')"];
    if (JSON.stringify(warnings.new) !== JSON.stringify(wantWarning) || warnings.old.length) {
      throw new Error(`warning rows ${JSON.stringify(warnings)}; expected new ${JSON.stringify(wantWarning)}, old none`);
    }
    console.log(`both_session_shapes: ok — new warning row ${JSON.stringify(warnings.new[0])}; old ${ids.old} and new ${ids.new} each show ${JSON.stringify(want)}`);
    code = 0;
  } catch (e) {
    console.error(`both_session_shapes: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
