// Naming sessions from the top bar (UI sprint 145): the name reaches the daemon and holds.
//
// Steps: bind pane 1; double-click the bar's name and name it before the session opens; send a
// message (the session opens with that name); rename it in the bar with the session open; the
// bar, the manifest and the session list carry the new name; reload the window: the reattached
// pane's bar shows it.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp, waitForReattached } from "./lib/electron";

type Vm = { get(id: number): { snapshot(): { sessionId: string | null; transcript: { role: string }[] } } | null };

async function rename(win: Page, name: string): Promise<void> {
  await win.locator("[data-top-bar] [data-crumb]").first().dblclick();
  const input = win.locator("[data-top-bar] input").first();
  await input.waitFor({ state: "visible", timeout: 5_000 });
  await input.fill(name);
  await win.keyboard.press("Enter");
}

const crumb = (win: Page) => win.locator("[data-top-bar] [data-crumb]").first().innerText().then((t) => t.trim());

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    await rename(win, "first-name");
    await win.waitForFunction(() => (document.querySelector("[data-top-bar] [data-crumb]")?.textContent || "").trim() === "first-name", undefined, { timeout: 5_000 })
      .catch(async () => { throw new Error(`before the session opened, the bar reads "${await crumb(win)}"`); });
    const bar = win.locator('[data-pane="1"] [data-input-bar]').first();
    await bar.click();
    await bar.fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript.some((r) => r.role === "model"), undefined, { timeout: 20_000 });
    const sid = await win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().sessionId!);
    const opened = await win.evaluate(async (id) => (await (await fetch(`/api/session/${id}`)).json()).name, sid);
    if (opened !== "first-name") throw new Error(`the session opened named ${JSON.stringify(opened)}`);

    await rename(win, "second-name");
    await win.waitForFunction(async (id) => (await (await fetch(`/api/session/${id}`)).json()).name === "second-name", sid, { timeout: 5_000 })
      .catch(() => { throw new Error("the rename with the session open did not reach the manifest"); });
    const listed = await win.evaluate(async () => JSON.stringify(await (await fetch("/api/session")).json()));
    if (!listed.includes("second-name")) throw new Error(`the session list does not carry the new name: ${listed.slice(0, 300)}`);
    if ((await crumb(win)) !== "second-name") throw new Error(`the bar reads "${await crumb(win)}" after the rename`);

    await win.reload();
    await waitForApp(win);
    await waitForReattached(win, sid);
    await win.waitForFunction(() => (document.querySelector("[data-top-bar] [data-crumb]")?.textContent || "").trim() === "second-name", undefined, { timeout: 10_000 })
      .catch(async () => { throw new Error(`after a reload the bar reads "${await crumb(win)}"`); });
    console.log(`naming_sessions: ok — named before opening (first-name), renamed open (second-name); manifest, session list and bar agree; the name holds across a reload (${sid})`);
    code = 0;
  } catch (e) {
    console.error(`naming_sessions: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
