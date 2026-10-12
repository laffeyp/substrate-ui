// Once one slash command matches, its hint sits in the input row (UI sprint 163; roadmap
// ROADMAP-2026-10-12-slash-entry.md).
//
// Steps: bind pane 1; "/l" lists /length and /list and shows no hint; "/guid" shows no menu and a
// hint naming guidance's choices and description, starting where the typed text ends; "/fold"
// shows its description; "/guidance " opens the choices and drops the hint.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

// Plain-string evaluate: esbuild's __name helper does not exist in the page.
const READ = `(() => {
  const pane = document.querySelector('[data-pane="1"]');
  const rows = Array.from(pane.querySelectorAll("[data-slash-row]")).filter((e) => e.offsetParent !== null).map((e) => e.getAttribute("data-slash-row"));
  const hint = pane.querySelector("[data-slash-hint]");
  const ta = pane.querySelector("[data-input-bar]");
  let offset = null, expected = null;
  if (hint && hint.offsetParent !== null && (hint.textContent || "").trim()) {
    offset = hint.getBoundingClientRect().left - ta.getBoundingClientRect().left;
    const ctx = document.createElement("canvas").getContext("2d");
    const cs = getComputedStyle(ta);
    ctx.font = cs.fontSize + " " + cs.fontFamily;
    expected = ctx.measureText(ta.value).width;
  }
  return { rows, hint: hint && hint.offsetParent !== null ? (hint.textContent || "").replace(/\\s+/g, " ").trim() : "", offset, expected };
})()`;
type R = { rows: string[]; hint: string; offset: number | null; expected: number | null };

async function fill(win: Page, text: string): Promise<R> {
  const bar = win.locator('[data-pane="1"] [data-input-bar]').first();
  await bar.click();
  await bar.fill(text);
  await settled(win);
  return win.evaluate(READ) as Promise<R>;
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);

    const many = await fill(win, "/l");
    if (JSON.stringify(many.rows) !== JSON.stringify(["/length", "/list"]) || many.hint) throw new Error(`"/l" gave ${JSON.stringify(many)}`);

    const one = await fill(win, "/guid");
    if (one.rows.length) throw new Error(`"/guid" still lists ${JSON.stringify(one.rows)} above the bar`);
    if (!one.hint.includes("auto|harness|low|medium|high") || !one.hint.includes("how much of the working standard")) throw new Error(`"/guid" hint reads ${JSON.stringify(one.hint)}`);
    if (one.hint.includes("/guidance")) throw new Error(`the hint completes the name: ${JSON.stringify(one.hint)}`);
    if (one.offset === null || one.expected === null || Math.abs(one.offset - one.expected) > 2) throw new Error(`the hint starts at ${one.offset}px, the typed text ends at ${one.expected}px`);

    const fold = await fill(win, "/fold");
    if (fold.rows.length || !fold.hint.includes("fold or unfold all tool output")) throw new Error(`"/fold" gave ${JSON.stringify(fold)}`);

    const space = await fill(win, "/guidance ");
    if (space.rows.length !== 5 || space.hint) throw new Error(`"/guidance " gave ${JSON.stringify(space)}`);
    console.log(`slash_inline_hint: ok — "/l" lists two; "/guid" hint ${JSON.stringify(one.hint)} at ${one.offset?.toFixed(1)}px (text ends ${one.expected?.toFixed(1)}px); "/guidance " lists 5 choices`);
    code = 0;
  } catch (e) {
    console.error(`slash_inline_hint: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
