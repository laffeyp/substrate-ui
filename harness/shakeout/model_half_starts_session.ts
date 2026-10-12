// The workspace bar runs left to right: a folder pick ungreys the model half, a model pick starts
// the session; a session picked under a folder resumes on its own model (UI sprint 124).
//
// Run against the installed app: SHAKEOUT_APP=/Applications/Substrate.app (own user-data dir and
// SUBSTRATE_HOME, so the user's running app and ~/.substrate are untouched).
//
// Steps: a fresh pane's model half is greyed and a click on a model row does nothing. Click "per
// session sandbox" → the half is armed. Click "deterministic" → the chat prompt shows; the first
// message opens a session whose driver is deterministic. Split right (cmd+D): the new pane's bar
// shows; open "per session sandbox" and click that session → pane 2 attaches to it, on
// deterministic, without touching the model half. SHAKEOUT_SHOTS=<dir> saves screenshots.

import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { launchArgs, waitForApp } from "./lib/electron";

type Snap = { sessionId: string | null; driver: string | null };

function snap(win: Page, pane: number): Promise<Snap | null> {
  return win.evaluate((n) => {
    const vm = (window as unknown as { __vm?: { get(n: number): { snapshot(): Snap } | null } }).__vm;
    const s = vm?.get(n)?.snapshot();
    return s ? { sessionId: s.sessionId, driver: s.driver } : null;
  }, pane);
}

async function main(): Promise<void> {
  const launch = launchArgs({ roster: "live" });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const shots = process.env.SHAKEOUT_SHOTS || "";
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    const half = win.locator("[data-model-half]").first();
    const model = win.locator('[data-model-row="deterministic"] > span').first();
    await half.waitFor({ state: "visible", timeout: 15_000 });
    await model.waitFor({ state: "visible", timeout: 15_000 });
    if ((await half.getAttribute("data-armed")) !== "0") throw new Error("a fresh pane's model half is not greyed");
    if (shots) await win.screenshot({ path: join(shots, "1-greyed.png") });

    await model.click();
    await win.waitForTimeout(300);
    if (await win.locator('[data-input-bar]').first().isVisible()) {
      throw new Error("a click on a greyed model row started a session");
    }

    await win.getByText("per session sandbox", { exact: true }).first().click();
    await win.locator('[data-model-half][data-armed="1"]').first().waitFor({ state: "visible", timeout: 5_000 });
    if (shots) await win.screenshot({ path: join(shots, "2-armed.png") });

    await model.click();
    const prompt = win.locator('[data-input-bar]').first();
    await prompt.waitFor({ state: "visible", timeout: 15_000 });
    await prompt.click();
    await win.keyboard.type("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => {
      const vm = (window as unknown as { __vm?: { get(n: number): { snapshot(): Snap } | null } }).__vm;
      return !!vm?.get(1)?.snapshot().sessionId;
    }, undefined, { timeout: 30_000 });
    const first = await snap(win, 1);
    if (!first || first.driver !== "deterministic") throw new Error(`pane 1 opened on ${JSON.stringify(first)}, not deterministic`);
    if (shots) await win.screenshot({ path: join(shots, "3-started.png") });

    await win.keyboard.press("Meta+d");
    const row = win.locator("div", { has: win.getByText("per session sandbox", { exact: true }) }).last();
    await row.waitFor({ state: "visible", timeout: 10_000 });
    await row.locator("xpath=preceding-sibling::span[1]").click();
    const sub = win.getByText(first.sessionId!.slice(0, 12), { exact: true }).first();
    await sub.waitFor({ state: "visible", timeout: 15_000 });
    if (shots) await win.screenshot({ path: join(shots, "4-split-picker.png") });
    await sub.click();
    await win.waitForFunction((sid) => {
      const vm = (window as unknown as { __vm?: { get(n: number): { snapshot(): Snap } | null } }).__vm;
      return vm?.get(2)?.snapshot().sessionId === sid;
    }, first.sessionId, { timeout: 15_000 });
    const second = await snap(win, 2);
    if (!second || second.driver !== "deterministic") throw new Error(`pane 2 resumed on ${JSON.stringify(second)}`);
    console.log(`model_half_starts_session: ok — greyed, armed, started ${first.sessionId} on deterministic; pane 2 resumed it on ${second.driver}`);
    code = 0;
  } catch (e) {
    console.error(`model_half_starts_session: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
