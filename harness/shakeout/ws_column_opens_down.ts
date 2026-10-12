// The workspace list fills its column and opens downward (UI sprints 148, 150); ← and a click on
// the list's empty space go back to it from the model column (UI sprint 150).
//
// Steps: open five sessions in a repo-local folder over the API (the picker leaves out $TMPDIR
// paths, where a gate's SUBSTRATE_HOME lives); refresh the workspace list. Folded: the list
// reaches the column's bottom and does not scroll. Open the folder's row: the box's top holds, the
// first session sits in the room under the rows, and the list scrolls. ↵ arms a workspace; ←
// on the folded "cli agents" goes back; ↵ again; fold the row; a click on the list's empty space goes back.

import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { launchArgs, waitForApp } from "./lib/electron";

// Plain-string evaluates: esbuild's __name helper does not exist in the page.
const MEASURE = `(() => {
  const input = Array.from(document.querySelectorAll("input[data-ws-input]")).find((e) => e.offsetParent !== null);
  const box = input.parentElement.parentElement;
  const list = box.querySelector("[data-ws-scroll]");
  const col = list.parentElement;
  const cs = getComputedStyle(col);
  const colBottom = col.getBoundingClientRect().bottom - parseFloat(cs.paddingBottom) - parseFloat(cs.borderBottomWidth);
  const lr = list.getBoundingClientRect();
  const session = Array.from(list.querySelectorAll("[data-ws-lit]")).find((e) => e.style.padding.endsWith("40px"));
  const sr = session ? session.getBoundingClientRect() : null;
  return {
    top: box.getBoundingClientRect().top,
    listBottom: lr.bottom, colBottom,
    scrolls: list.scrollHeight > list.clientHeight + 0.5,
    sessionInView: !!sr && sr.top >= lr.top - 0.5 && sr.bottom <= lr.bottom + 0.5 && list.scrollTop === 0,
  };
})()`;

type M = { top: number; listBottom: number; colBottom: number; scrolls: boolean; sessionInView: boolean };
const measure = (win: Page) => win.evaluate(MEASURE) as Promise<M>;
const keysIn = (win: Page) => win.evaluate(`(() => ({
  armed: document.querySelector("[data-model-half]").getAttribute("data-armed"),
  wsLit: !!Array.from(document.querySelectorAll("[data-ws-lit='1']")).find((e) => e.offsetParent !== null),
}))()`) as Promise<{ armed: string; wsLit: boolean }>;

async function main(): Promise<void> {
  const folder = join(__dirname, ".scratch", "ws-column-" + process.pid);
  mkdirSync(folder, { recursive: true });
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    for (let i = 0; i < 5; i++) {
      await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: "deterministic", workspace: ${JSON.stringify(folder)}, name: "fixture-${i}" }) }).then((r) => { if (!r.ok) throw new Error("open " + r.status); })`);
    }
    await win.evaluate(`window.__vm.loadRecentWorkspaces()`);
    const leaf = folder.split("/").pop()!;
    const findRow = `Array.from(document.querySelectorAll("[data-ws-lit]")).find((e) => e.offsetParent !== null && (e.textContent || "").includes(${JSON.stringify(leaf)}) && (e.textContent || "").includes("recent"))`;
    await win.waitForFunction(`!!${findRow}`, undefined, { timeout: 10_000 })
      .catch(() => { throw new Error("the folder's recent row is not in the picker"); });

    const folded = await measure(win);
    if (Math.abs(folded.listBottom - folded.colBottom) > 1) throw new Error(`folded, the list ends ${(folded.colBottom - folded.listBottom).toFixed(1)}px above the column's bottom`);
    if (folded.scrolls) throw new Error("folded, the list already scrolls");

    await win.evaluate(`${findRow}.firstElementChild.click()`);
    await win.waitForFunction(`Array.from(document.querySelectorAll("[data-ws-scroll] [data-ws-lit]")).some((e) => e.style.padding.endsWith("40px"))`, undefined, { timeout: 10_000 })
      .catch(() => { throw new Error("opening the row showed no session"); });
    await win.waitForTimeout(200);
    const opened = await measure(win);
    if (Math.abs(opened.top - folded.top) > 0.5) throw new Error(`the box's top moved from ${folded.top} to ${opened.top}`);
    if (!opened.sessionInView) throw new Error("the first session is not in the room under the rows");
    if (!opened.scrolls) throw new Error("five sessions did not make the list scroll");

    const input = win.locator("input[data-ws-input]").first();
    await input.click();
    for (let i = 0; i < 20 && !(await win.evaluate(`(document.querySelector("[data-ws-lit='1']")?.textContent || "").includes("per session sandbox")`)); i++) await win.keyboard.press("ArrowUp");
    await win.keyboard.press("Enter");
    await win.locator('[data-model-half][data-armed="1"]').first().waitFor({ state: "visible", timeout: 10_000 });
    await win.keyboard.press("ArrowLeft");
    await win.waitForTimeout(100);
    const afterLeft = await keysIn(win);
    if (afterLeft.armed !== "0" || !afterLeft.wsLit) throw new Error(`← on a folded cli agents left ${JSON.stringify(afterLeft)}`);

    await input.click();
    await win.keyboard.press("Enter");
    await win.locator('[data-model-half][data-armed="1"]').first().waitFor({ state: "visible", timeout: 10_000 });
    await win.evaluate(`${findRow}.firstElementChild.click()`);
    await win.waitForFunction(`!Array.from(document.querySelectorAll("[data-ws-scroll] [data-ws-lit]")).some((e) => e.style.padding.endsWith("40px"))`, undefined, { timeout: 5_000 });
    const at = await win.evaluate(`(() => { const r = document.querySelector("[data-ws-scroll]").getBoundingClientRect(); return { x: r.left + r.width - 30, y: r.bottom - 4 }; })()`) as { x: number; y: number };
    await win.mouse.click(at.x, at.y);
    await win.waitForTimeout(100);
    const afterClick = await keysIn(win);
    if (afterClick.armed !== "0" || !afterClick.wsLit) throw new Error(`a click on the list's empty space left ${JSON.stringify(afterClick)}`);

    console.log(`ws_column_opens_down: ok — folded, the list reaches the column's bottom (${folded.listBottom.toFixed(1)} / ${folded.colBottom.toFixed(1)}); opened, the top held at ${opened.top}, the first session sat under the rows, and five scrolled; ← and a click on empty space went back to the workspace column`);
    code = 0;
  } catch (e) {
    console.error(`ws_column_opens_down: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
    rmSync(folder, { recursive: true, force: true });
  }
  process.exit(code);
}

main();
