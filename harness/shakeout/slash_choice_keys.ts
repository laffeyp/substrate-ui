// Arrow keys in the slash choice menu (UI sprint 164; roadmap ROADMAP-2026-10-12-slash-entry.md).
//
// Steps: bind pane 1 and send a message (history holds it); "/tone ": ↑ lights /tone dry (the row
// nearest the bar) and the bar still reads "/tone "; ↑ lights formal; ↓ ↓ returns to the bar with
// nothing lit; ↑ ↑ ↵ sets the tone to formal. With the bar empty, ↑ recalls the sent message.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const STATE = `(() => {
  const pane = document.querySelector('[data-pane="1"]');
  const lit = Array.from(pane.querySelectorAll('[data-slash-row][data-lit="1"]')).filter((e) => e.offsetParent !== null);
  return { lit: lit.length ? lit[0].getAttribute("data-slash-row") : "", value: pane.querySelector("[data-input-bar]").value };
})()`;
type S = { lit: string; value: string };
async function press(win: Page, key: string): Promise<S> {
  await win.keyboard.press(key);
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
    const bar = win.locator('[data-pane="1"] [data-input-bar]').first();
    await bar.click();
    await bar.fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(`window.__vm.get(1).snapshot().transcript.some((r) => r.role === "model")`, undefined, { timeout: 20_000 });

    await bar.click();
    await bar.fill("/tone ");
    await settled(win);
    let s = await press(win, "ArrowUp");
    if (s.lit !== "/tone dry" || s.value !== "/tone ") throw new Error(`↑ from the bar gave ${JSON.stringify(s)}; want /tone dry lit, the bar unchanged`);
    s = await press(win, "ArrowUp");
    if (s.lit !== "/tone formal") throw new Error(`a second ↑ gave ${JSON.stringify(s)}`);
    await press(win, "ArrowDown");
    s = await press(win, "ArrowDown");
    if (s.lit !== "" || s.value !== "/tone ") throw new Error(`↓ past the bottom row gave ${JSON.stringify(s)}; want the bar, nothing lit`);
    await press(win, "ArrowUp");
    await press(win, "ArrowUp");
    await press(win, "Enter");
    await win.waitForFunction(`fetch("/api/session/" + window.__vm.get(1).snapshot().sessionId).then((r) => r.json()).then((m) => m.tone === "formal")`, undefined, { timeout: 5_000 })
      .catch(() => { throw new Error("↑ ↑ ↵ did not set the tone to formal"); });

    await bar.click();
    await bar.fill("");
    s = await press(win, "ArrowUp");
    if (!s.value.includes("hello") && !s.value.startsWith("/tone")) throw new Error(`↑ on an empty bar recalled ${JSON.stringify(s.value)}`);
    console.log(`slash_choice_keys: ok — ↑ lit /tone dry then formal, ↓ ↓ returned to the bar, ↑ ↑ ↵ set formal; ↑ on an empty bar recalled ${JSON.stringify(s.value)}`);
    code = 0;
  } catch (e) {
    console.error(`slash_choice_keys: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
