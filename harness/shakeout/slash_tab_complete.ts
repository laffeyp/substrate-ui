// Tab completes slash command names (UI sprint 165; roadmap ROADMAP-2026-10-12-slash-entry.md).
//
// Steps: bind pane 1; "/guid" Tab → "/guidance " with its choices open; "/unf" Tab → "/unfold ";
// "/l" Tab → "/l" (length and list share only "l"), focus still in the bar; "/in" Tab →
// "/interrupt ".

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const STATE = `(() => {
  const pane = document.querySelector('[data-pane="1"]');
  const bar = pane.querySelector("[data-input-bar]");
  const rows = Array.from(pane.querySelectorAll("[data-slash-row]")).filter((e) => e.offsetParent !== null).length;
  return { value: bar.value, focused: document.activeElement === bar, rows };
})()`;
type S = { value: string; focused: boolean; rows: number };

async function tab(win: Page, text: string): Promise<S> {
  const bar = win.locator('[data-pane="1"] [data-input-bar]').first();
  await bar.click();
  await bar.fill(text);
  await settled(win);
  await win.keyboard.press("Tab");
  await settled(win);
  return win.evaluate(STATE) as Promise<S>;
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    const guid = await tab(win, "/guid");
    if (guid.value !== "/guidance " || guid.rows !== 5 || !guid.focused) throw new Error(`"/guid" Tab gave ${JSON.stringify(guid)}`);
    const unf = await tab(win, "/unf");
    if (unf.value !== "/unfold ") throw new Error(`"/unf" Tab gave ${JSON.stringify(unf)}`);
    const l = await tab(win, "/l");
    if (l.value !== "/l" || !l.focused) throw new Error(`"/l" Tab gave ${JSON.stringify(l)}`);
    const inn = await tab(win, "/in");
    if (inn.value !== "/interrupt ") throw new Error(`"/in" Tab gave ${JSON.stringify(inn)}`);
    console.log(`slash_tab_complete: ok — /guid → "/guidance " (5 choices), /unf → "/unfold ", /l stays (focus kept), /in → "/interrupt "`);
    code = 0;
  } catch (e) {
    console.error(`slash_tab_complete: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
