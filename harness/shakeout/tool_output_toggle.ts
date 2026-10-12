// One setting folds or unfolds every tool card: ⌘E, /fold (flips) and /unfold (UI sprint 140).
// No control on screen: the Architect's call.
//
// Steps, on two recorded sessions with one finished `add` call each (fixtures/write_session_shapes.py,
// written into the launch's own SUBSTRATE_HOME):
//   1. bind pane 1; attach the first session (its card's state before any flip is the per-card
//      rule, which on a replayed record opens it: the call draws before its result is paired);
//   2. ⌘E: the card is open; ⌘E again: it closes; /fold: open; /fold: closed; /unfold: open;
//   3. with tools unfolded, attach the second session: its card arrives open;
//   4. the top bar holds no tools control.

import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

type Pane = { snapshot(): { transcript: { role: string }[] }; attachExisting(id: string): Promise<void> };
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
    const attach = async (sid: string) => {
      await win.evaluate(async (id) => { await (window as unknown as { __vm: Vm }).__vm.get(1)!.attachExisting(id); }, sid);
      await win.locator("[data-vm-transcript-mount] details").first().waitFor({ state: "attached", timeout: 15_000 });
    };
    const opened = () => win.evaluate(() => Array.from(document.querySelectorAll("[data-vm-transcript-mount] details")).filter((d) => (d as HTMLElement).offsetParent !== null).map((d) => (d as HTMLDetailsElement).open));
    const expect = async (want: boolean, step: string) => {
      await win.waitForFunction(
        (w) => { const d = Array.from(document.querySelectorAll("[data-vm-transcript-mount] details")).filter((x) => (x as HTMLElement).offsetParent !== null); return d.length > 0 && d.every((x) => (x as HTMLDetailsElement).open === w); },
        want, { timeout: 5_000 },
      ).catch(async () => { throw new Error(`${step}: cards ${JSON.stringify(await opened())}; expected all ${want ? "open" : "closed"}`); });
    };

    await attach(ids.new);
    await win.keyboard.press("Meta+e");
    await expect(true, "after ⌘E");
    await win.keyboard.press("Meta+e");
    await expect(false, "after a second ⌘E");
    const slash = async (line: string) => {
      const input = win.locator('[data-input-bar]').first();
      await input.click();
      await input.fill(line);
      await win.keyboard.press("Enter");
    };
    await slash("/fold");
    await expect(true, "after /fold");
    await slash("/fold");
    await expect(false, "after a second /fold");
    await slash("/unfold");
    await expect(true, "after /unfold");
    if (await win.locator("[data-top-bar] [data-tools-toggle]").count()) throw new Error("the top bar holds a tools control");
    await attach(ids.old);
    await expect(true, "a card that arrived after the flip");
    console.log(`tool_output_toggle: ok — ⌘E, /fold and /unfold fold and unfold every card; a later card arrives open; no control in the bar (${ids.new}, ${ids.old})`);
    code = 0;
  } catch (e) {
    console.error(`tool_output_toggle: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
