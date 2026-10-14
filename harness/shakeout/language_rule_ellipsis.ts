// The language lens's setting-change rule stays inside the lens (UI sprint 175).
//
// A bundle change writes a long rule ("bundle standard → standard-low · guidance … · turn 1"). It
// ran past the last lane and made the lens scroll sideways. Steps, on the deterministic driver: a
// turn; /guidance low, /tone blunt, /length full; a turn; reveal, pick language. The rule's text
// ends at or before the lens body's right edge, is cut (its full width is wider than it shows), and
// its hover carries the whole text.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const BAR = `(document.querySelector('[data-pane="1"] [data-session-bar-line]')?.textContent || "").replace(/\\s+/g, " ").trim()`;

async function type(win: Page, text: string): Promise<void> {
  const bar = win.locator('[data-pane="1"] [data-input-bar]').first();
  await bar.click();
  await bar.fill(text);
  await win.keyboard.press("Enter");
  await settled(win);
}

async function turn(win: Page, text: string): Promise<void> {
  const before = await win.evaluate(`window.__vm.get(1).snapshot().transcript.filter((r) => r.role === "model").length`) as number;
  await type(win, text);
  await win.waitForFunction(`window.__vm.get(1).snapshot().transcript.filter((r) => r.role === "model").length > ${before} && /returned/.test(${BAR})`, undefined, { timeout: 20_000 });
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    await turn(win, "one");
    await type(win, "/guidance low");
    await type(win, "/tone blunt");
    await type(win, "/length full");
    await turn(win, "two");
    await win.keyboard.press("Meta+m");
    await win.getByText("language", { exact: true }).first().click();
    await win.waitForFunction(`Array.from(document.querySelectorAll('[data-lang-rule]')).some((e) => e.getClientRects().length)`, undefined, { timeout: 15_000 });
    const m = await win.evaluate(`(() => {
      const rule = Array.from(document.querySelectorAll('[data-lang-rule]')).find((e) => e.getClientRects().length);
      const text = rule.querySelector('span[title]');
      const body = rule.closest('[data-lang-body]');
      return { title: text.getAttribute('title'), right: text.getBoundingClientRect().right, bodyRight: body.getBoundingClientRect().right, full: text.scrollWidth, shown: text.clientWidth };
    })()`) as { title: string; right: number; bodyRight: number; full: number; shown: number };
    if (!/bundle .* · turn 1$/.test(m.title)) throw new Error(`the rule's hover reads ${JSON.stringify(m.title)}; the gate needs a bundle change to make the long text`);
    if (m.right > m.bodyRight + 0.5) throw new Error(`the rule's text ends at ${m.right.toFixed(1)}px, past the lens body's ${m.bodyRight.toFixed(1)}px`);
    if (!(m.full > m.shown)) throw new Error(`the rule's text is not cut (${m.full}px of ${m.shown}px); the check would prove nothing`);
    console.log(`language_rule_ellipsis: ok — "${m.title}" shows ${m.shown}px of ${m.full}px, ending at ${m.right.toFixed(1)}px inside the body's ${m.bodyRight.toFixed(1)}px; the hover has the whole text`);
    code = 0;
  } catch (e) {
    console.error(`language_rule_ellipsis: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
