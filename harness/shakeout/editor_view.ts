// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor view opens and returns (sprint 407; roadmap 2026-11-09-code-editor r6, R1 and R3).
//
// The real input path: keys pressed on the window, the pane bound through its picker. At the picker
// ⌘⇧E is refused; on a session it shows frame 24a's four areas; Escape (from the input bar) and ⌘⇧E
// return; a page opens over the editor and Escape goes back to it. Screenshots at 1512 and 504 points
// wide go to runs/packaged/sprint-407-<stamp>-<source|packaged>/ to be read beside
// runs/design/sheet-v11/24a.png. After the app closes, window-1.jsonl must hold the editor's records
// in order and main.jsonl no INVARIANT_BROKEN (launch.cleanup). SHAKEOUT_APP=<Substrate.app> runs the
// bundle, and the gate then requires that launch's APP_BOOTED to read packaged: true.

import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords, type WindowRecord } from "./lib/electron";

const REPO_ROOT = join(__dirname, "..", "..");
const visible = (win: Page, sel: string) => win.locator(sel).filter({ visible: true }).first();
const shown = (win: Page, sel: string) => win.evaluate((q) => Array.from(document.querySelectorAll(q)).some((e) => (e as HTMLElement).offsetParent !== null), sel);

async function size(app: ElectronApplication, win: Page, w: number, h: number): Promise<void> {
  await app.evaluate(({ BrowserWindow }, [cw, ch]) => { BrowserWindow.getAllWindows()[0].setContentSize(cw, ch); }, [w, h]);
  await win.waitForFunction((cw) => window.innerWidth === cw, w, { timeout: 10_000 });
  await settled(win);
}

async function expectView(win: Page, editor: boolean, what: string): Promise<void> {
  await win.waitForFunction((want) => Array.from(document.querySelectorAll("[data-editor-view]")).some((e) => (e as HTMLElement).offsetParent !== null) === want, editor, { timeout: 10_000 })
    .catch(() => { throw new Error(`${what}: the editor view is ${editor ? "not shown" : "still shown"}`); });
  await settled(win);
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-407-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    // Adversarial: a native menu item holding ⌘⇧E would take the key before the window.
    const claimed = await app.evaluate(({ Menu }) => {
      // A loop, not a named function: tsx wraps named functions in a __name helper main lacks.
      const out: string[] = [];
      const stack: Electron.MenuItem[] = [...(Menu.getApplicationMenu()?.items ?? [])];
      while (stack.length) {
        const it = stack.pop()!;
        if (it.accelerator && /^(CmdOrCtrl|Cmd|Command)\+Shift\+E$/i.test(String(it.accelerator))) out.push(it.label);
        if (it.submenu) stack.push(...it.submenu.items);
      }
      return out;
    });
    if (claimed.length) throw new Error(`the native menu claims ⌘⇧E: ${claimed.join(", ")}`);

    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    // 1. At the picker the key is refused and nothing changes.
    await visible(win, "input[data-ws-input]").waitFor({ timeout: 15_000 });
    await win.keyboard.press("Meta+Shift+E");
    await settled(win);
    if (await shown(win, "[data-editor-view]")) throw new Error("the editor opened over a pane with no session");
    if (!(await shown(win, "input[data-ws-input]"))) throw new Error("the picker left after a refused ⌘⇧E");
    // 2. A session, bound as a user binds it, with one turn.
    await bindPaneAsUser(win, "deterministic");
    await visible(win, "textarea[data-input-bar]").fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as unknown as { __vm?: { get(n: number): { snapshot(): { parkReason: unknown } } } }).__vm?.get(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    // 3. ⌘⇧E: the four areas, the input bar in the bottom one, the panes gone.
    await win.keyboard.press("Meta+Shift+E");
    await expectView(win, true, "⌘⇧E on a session");
    for (const area of ["left", "centre", "right", "bottom"]) if (!(await shown(win, `[data-editor-area="${area}"]`))) throw new Error(`area ${area} not drawn`);
    if (!(await shown(win, '[data-editor-area="bottom"] textarea[data-input-bar]'))) throw new Error("the input bar is not in the bottom panel");
    if (await shown(win, '[data-vm-transcript-mount="terminal"]')) throw new Error("the panes are still drawn under the editor");
    const geo = await win.evaluate(() => Object.fromEntries(["left", "right", "bottom"].map((a) => {
      const r = document.querySelector(`[data-editor-area="${a}"]`)!.getBoundingClientRect();
      return [a, a === "bottom" ? Math.round(r.height) : Math.round(r.width)];
    })));
    // 4. Screenshots at the widths the Architect works at.
    await size(app, win, 1512, 945);
    await win.screenshot({ path: join(shots, "editor-1512x945.png") });
    await size(app, win, 504, 945);
    await win.screenshot({ path: join(shots, "editor-504x945.png") });
    const narrow = await win.evaluate(() => {
      const c = document.querySelector('[data-editor-area="centre"]')!.getBoundingClientRect();
      const wrapped = Array.from(document.querySelectorAll("[data-editor-left-tab]")).some((e) => (e as HTMLElement).getBoundingClientRect().height > 20);
      return { centre: Math.round(c.width), wrapped, scrollX: document.documentElement.scrollWidth > window.innerWidth };
    });
    // At the window's minimum the prompt must still be there (D90): the centre narrows last.
    if (narrow.centre < 240 || narrow.wrapped || narrow.scrollX) throw new Error(`at 504 px: centre ${narrow.centre} px, labels wrapped ${narrow.wrapped}, sideways scroll ${narrow.scrollX}`);
    if (!(await shown(win, '[data-editor-area="bottom"] textarea[data-input-bar]'))) throw new Error("at 504 px the input bar is not shown");
    await size(app, win, 1512, 945);
    // 5. Escape from the input bar returns to the panes.
    await visible(win, '[data-editor-area="bottom"] textarea[data-input-bar]').click();
    await win.keyboard.press("Escape");
    await expectView(win, false, "Escape in the editor");
    if (!(await shown(win, '[data-vm-transcript-mount="terminal"]'))) throw new Error("the panes did not return");
    // 6. ⌘⇧E twice.
    await win.keyboard.press("Meta+Shift+E");
    await expectView(win, true, "⌘⇧E again");
    await win.keyboard.press("Meta+Shift+E");
    await expectView(win, false, "⌘⇧E in the editor");
    // 7. A page over the editor, and back.
    await win.keyboard.press("Meta+Shift+E");
    await expectView(win, true, "⌘⇧E a third time");
    await win.keyboard.press("Meta+3");
    await expectView(win, false, "⌘3 over the editor");
    await win.keyboard.press("Escape");
    await expectView(win, true, "Escape on the assay page over the editor");
    await win.keyboard.press("Escape");
    await expectView(win, false, "Escape in the editor after the page");
    // 8. Sprint 409: the chip and the footer name the way back, and the chip takes it.
    await win.keyboard.press("Meta+Shift+E");
    await expectView(win, true, "⌘⇧E a fourth time");
    const chrome = await win.evaluate(() => ({
      chip: Array.from(document.querySelectorAll("[data-top-bar] button")).map((b) => ({ text: (b.textContent || "").trim(), bg: getComputedStyle(b).backgroundColor })).find((b) => b.text.includes("⌘⇧E")) ?? null,
      hint: (document.querySelector("[data-footer] > span:last-child")?.textContent || "").trim(),
    }));
    if (!chrome.chip || chrome.chip.text !== "⌘⇧E pane" || chrome.chip.bg !== "rgb(130, 165, 200)") throw new Error(`the top bar's chip in the editor: ${JSON.stringify(chrome.chip)}`);
    if (chrome.hint !== "esc or ⌘⇧E back to the pane") throw new Error(`the footer's hint in the editor: ${chrome.hint}`);
    await win.screenshot({ path: join(shots, "editor-chrome-1512x945.png") });
    await win.locator("[data-top-bar] button", { hasText: "⌘⇧E pane" }).first().click();
    await expectView(win, false, "a click on the chip");

    await app.close();
    const recs = windowRecords(launch);
    const pane1 = (r: WindowRecord) => r.pane_id === 1;
    const editor = recs.filter((r) => pane1(r) && r.name.startsWith("EDITOR_")).map((r) => r.name === "EDITOR_KEY_REFUSED" ? `REFUSED(${String(r.payload.key)},${String(r.payload.reason)})` : r.name === "EDITOR_CLOSED" ? `CLOSED(${String(r.payload.tab_count)})` : r.name.replace("EDITOR_", ""));
    // Sprint 411: the files tree draws after the server's listing arrives, so an open writes EDITOR_DRAWN
    // once with 0 rows and again with the listing's; a run of DRAWN records is one step here, and
    // tree_rows is checked against the disk by harness/shakeout/editor_tree.ts.
    for (let i = editor.length - 1; i > 0; i--) if (editor[i] === "DRAWN" && editor[i - 1] === "DRAWN") editor.splice(i, 1);
    const wantEditor = ["REFUSED(Meta+Shift+E,no_session)", "OPENED", "DRAWN", "CLOSED(0)", "OPENED", "DRAWN", "CLOSED(0)", "OPENED", "DRAWN", "CLOSED(0)", "OPENED", "DRAWN", "CLOSED(0)"];
    if (editor.join(" ") !== wantEditor.join(" ")) throw new Error(`pane 1's editor records: ${editor.join(" ")}; want ${wantEditor.join(" ")}`);
    const drawn = recs.find((r) => r.name === "EDITOR_DRAWN")!.payload;
    const wantDrawn = { tab_count: 0, left_folded: false, right_folded: false, bottom_folded: false, showing: "spine", left_tab: "files", dock: "bottom", sides_swapped: false, focus: false, tree_rows: drawn.tree_rows, modified_dots: 0 };
    if (JSON.stringify(drawn) !== JSON.stringify(wantDrawn)) throw new Error(`EDITOR_DRAWN ${JSON.stringify(drawn)}`);
    const views = recs.filter((r) => r.name === "VIEW_CHANGED").map((r) => `${String(r.payload.cause)} ${String(r.payload.from)}→${String(r.payload.to)}`);
    const wantViews = ["key panes→editor", "close editor→panes", "key panes→editor", "key editor→panes", "key panes→editor", "key editor→assay", "close assay→editor", "close editor→panes", "key panes→editor", "button editor→panes"];
    if (views.join("; ") !== wantViews.join("; ")) throw new Error(`VIEW_CHANGED: ${views.join("; ")}`);
    const routed = recs.filter((r) => r.name === "KEY_ROUTED" && (r.payload.key === "Meta+Shift+E" || r.payload.action === "close-editor")).map((r) => `${String(r.payload.key)}:${String(r.payload.action)}`);
    if (routed.filter((x) => x === "Meta+Shift+E:toggle-editor").length !== 6 || routed.filter((x) => x === "Escape:close-editor").length !== 2) throw new Error(`KEY_ROUTED: ${routed.join(" ")}`);
    if (packaged) {
      const traces = join(launch.state, "electron", "logs", "traces");
      const boot = readdirSync(traces).sort().pop()!;
      const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED");
      if (!booted || booted.payload.packaged !== true) throw new Error(`APP_BOOTED in the packaged run: ${JSON.stringify(booted?.payload)}`);
      console.log(`editor_view: packaged launch, app_commit ${String(booted.payload.app_commit)}, vocabulary ${String(booted.payload.vocab_version)}`);
    }
    console.log(`editor_view: ok — ${editor.join(" ")}; views ${views.join("; ")}; sizes left ${geo.left} right ${geo.right} bottom ${geo.bottom}; at 504 the centre is ${narrow.centre} px, labels wrapped ${narrow.wrapped}, page scrolls sideways ${narrow.scrollX}; screenshots in ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`editor_view: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
