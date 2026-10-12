// The slash hint sits in one fixed column and stays (UI sprints 163, 166; roadmap
// ROADMAP-2026-10-12-slash-entry.md).
//
// Steps: bind pane 1; the hint's left edge is the same for "/g", "/guid", "/guidance ",
// "/guidance hig" and "/tone bl", lies right of the width of "/guidance harness", and reads the
// command's choices and description; "/l" (two matches) shows none and lists both; "/name " with
// text past the column shows none.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

// Plain-string evaluate: esbuild's __name helper does not exist in the page.
const READ = `(() => {
  const pane = document.querySelector('[data-pane="1"]');
  const rows = Array.from(pane.querySelectorAll("[data-slash-row]")).filter((e) => e.offsetParent !== null).map((e) => e.getAttribute("data-slash-row"));
  const hint = pane.querySelector("[data-slash-hint]");
  const ta = pane.querySelector("[data-input-bar]");
  const shown = !!hint && hint.offsetParent !== null && !!(hint.textContent || "").trim();
  const ctx = document.createElement("canvas").getContext("2d");
  const cs = getComputedStyle(ta);
  ctx.font = cs.fontSize + " " + cs.fontFamily;
  return {
    rows,
    hint: shown ? (hint.textContent || "").replace(/\\s+/g, " ").trim() : "",
    left: shown ? hint.getBoundingClientRect().left - ta.getBoundingClientRect().left : null,
    longest: ctx.measureText("/guidance harness").width,
  };
})()`;
type R = { rows: string[]; hint: string; left: number | null; longest: number };

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

    const guidance = "auto|harness|low|medium|high";
    const cases: [string, string][] = [["/g", guidance], ["/guid", guidance], ["/guidance ", guidance], ["/guidance hig", guidance], ["/tone bl", "blunt|neutral|formal|dry"]];
    const lefts: number[] = [];
    for (const [text, want] of cases) {
      const r = await fill(win, text);
      if (!r.hint.includes(want)) throw new Error(`${JSON.stringify(text)} hint reads ${JSON.stringify(r.hint)}`);
      if (r.left === null || r.left <= r.longest) throw new Error(`${JSON.stringify(text)} hint starts at ${r.left}px, inside "/guidance harness" (${r.longest.toFixed(1)}px)`);
      lefts.push(r.left);
    }
    if (Math.max(...lefts) - Math.min(...lefts) > 1) throw new Error(`the hint moved: ${lefts.map((x) => x.toFixed(1)).join(", ")}px`);

    const many = await fill(win, "/l");
    if (JSON.stringify(many.rows) !== JSON.stringify(["/length", "/list"]) || many.hint) throw new Error(`"/l" gave ${JSON.stringify(many)}`);
    const long = await fill(win, "/name a much longer session name than the column");
    if (long.hint) throw new Error(`text past the column still shows the hint: ${JSON.stringify(long.hint)}`);
    console.log(`slash_inline_hint: ok — the hint holds at ${lefts[0].toFixed(1)}px for ${cases.map((c) => JSON.stringify(c[0])).join(", ")} (right of ${many.longest.toFixed(1)}px); "/l" lists two; long /name text hides it`);
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
