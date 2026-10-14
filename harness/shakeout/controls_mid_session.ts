// Guidance, length and tone on the session bar, changed mid-session by slash commands (UI sprint
// 161; kernel K296, K298); the prompt for the message after each change carries the new text (UI
// sprint 167; kernel K299).
//
// Steps: bind pane 1 (deterministic) and send; the bar line ends with guidance, normal, neutral.
// /tone blunt: manifest and bar line read blunt; the next turn records SessionChanged(tone).
// /guidance low: the bundle is standard-low and the bar line reads low; the next turn records
// SessionChanged(bundle). /length enormous: refused, nothing changes.

import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

const BAR = `(document.querySelector('[data-pane="1"] [data-session-bar-line]')?.textContent || "").replace(/\\s+/g, " ").trim()`;
const SID = `window.__vm.get(1).snapshot().sessionId`;

async function type(win: Page, text: string): Promise<void> {
  const bar = win.locator('[data-pane="1"] [data-input-bar]').first();
  await bar.click();
  await bar.fill(text);
  await win.keyboard.press("Enter");
}

async function turn(win: Page, text: string): Promise<void> {
  const before = await win.evaluate(`window.__vm.get(1).snapshot().transcript.filter((r) => r.role === "model").length`) as number;
  await type(win, text);
  await win.waitForFunction(`window.__vm.get(1).snapshot().transcript.filter((r) => r.role === "model").length > ${before} && /returned/.test(${BAR})`, undefined, { timeout: 20_000 });
}

// UI sprint 167: what the model received with the message after each change, read from the record
// through the kernel (long prompt text sits in blobs).
type Delivery = { field: string; old: string; new: string; message: string; written: number; new_text_in_prompt: boolean; old_text_in_prompt: boolean };
function deliveries(state: string, sid: string): Delivery[] {
  const out = execFileSync("uv", ["run", "--project", join(__dirname, "..", "..", "..", "substrate"), "python", join(__dirname, "lib", "prompt_after_change.py"), join(state, "sessions", sid, "record")], { encoding: "utf8" });
  return JSON.parse(out.trim().split("\n").pop() as string) as Delivery[];
}

const manifest = (win: Page) => win.evaluate(`fetch("/api/session/" + ${SID}).then((r) => r.json())`) as Promise<Record<string, unknown>>;
const changes = (win: Page) => win.evaluate(`window.__vm.get(1).snapshot().rawEnvelopes.filter((e) => e.kind === "SessionChanged").map((e) => e.payload)`) as Promise<{ field: string; old: string; new: string }[]>;

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    await turn(win, "hello");
    const start = await win.evaluate(BAR) as string;
    if (!/ · guidance \S+ · length normal · tone neutral$/.test(start)) throw new Error(`the bar line reads ${JSON.stringify(start)}`);

    await type(win, "/tone blunt");
    await win.waitForFunction(`/ · tone blunt$/.test(${BAR})`, undefined, { timeout: 5_000 })
      .catch(async () => { throw new Error(`after /tone blunt the bar line reads ${JSON.stringify(await win.evaluate(BAR))}`); });
    if ((await manifest(win)).tone !== "blunt") throw new Error(`the manifest's tone is ${JSON.stringify((await manifest(win)).tone)}`);
    await turn(win, "again");
    const tone = (await changes(win)).find((c) => c.field === "tone");
    if (!tone || tone.old !== "neutral" || tone.new !== "blunt") throw new Error(`the record's changes: ${JSON.stringify(await changes(win))}`);

    await type(win, "/guidance low");
    await win.waitForFunction(`/ · guidance low · length normal · tone blunt$/.test(${BAR})`, undefined, { timeout: 5_000 })
      .catch(async () => { throw new Error(`after /guidance low the bar line reads ${JSON.stringify(await win.evaluate(BAR))}; last rows ${await win.evaluate(`JSON.stringify(window.__vm.get(1).snapshot().transcript.slice(-2).map((r) => r.text))`)}`); });
    if ((await manifest(win)).bundle !== "standard-low") throw new Error(`the manifest's bundle is ${JSON.stringify((await manifest(win)).bundle)}`);
    await turn(win, "once more");
    const bundle = (await changes(win)).find((c) => c.field === "bundle");
    if (!bundle || bundle.new !== "standard-low") throw new Error(`the record's changes: ${JSON.stringify(await changes(win))}`);

    // UI sprint 167: the prompt for the message after each change carries the new text, not the old.
    const sid = await win.evaluate(SID) as string;
    const got = deliveries(launch.state, sid).filter((d) => d.field === "tone" || d.field === "bundle");
    if (got.length < 2) throw new Error(`the record holds ${got.length} tone/bundle changes: ${JSON.stringify(got)}`);
    for (const d of got) {
      // A tone or bundle change writes text; with none written the check would pass on nothing.
      if (d.written === 0 || !d.new_text_in_prompt || d.old_text_in_prompt) throw new Error(`the prompt for ${JSON.stringify(d.message)} after ${d.field} ${d.old}→${d.new} lacks the new text or keeps the old: ${JSON.stringify(d)}`);
    }

    const barBefore = await win.evaluate(BAR) as string;
    await type(win, "/length enormous");
    await win.waitForFunction(`window.__vm.get(1).snapshot().transcript.some((r) => /enormous/.test(r.text || "") && r.role !== "user")`, undefined, { timeout: 5_000 })
      .catch(() => { throw new Error("/length enormous showed no refusal"); });
    if ((await manifest(win)).length === "enormous" || (await win.evaluate(BAR)) !== barBefore) throw new Error("/length enormous changed something");
    console.log(`controls_mid_session: ok — bar ${JSON.stringify(start)} → ${JSON.stringify(barBefore)}; tone neutral→blunt and bundle ${bundle.old}→${bundle.new} recorded; /length enormous refused`);
    code = 0;
  } catch (e) {
    console.error(`controls_mid_session: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
