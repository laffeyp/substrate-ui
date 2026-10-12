// New windows and the menu bar (UI sprint 147).
//
// Steps: read the application menu and check it against the card's table; bind window 1 and send;
// File → New Window: a second window opens at the picker and window 1 is unchanged; bind window 2
// and send: a different session; Close Window closes window 2 and window 1 still answers; close
// the last window: the app keeps running, and `activate` (a Dock click) opens a window.
// Native menus draw outside the page, so the gate reads Electron's menu model, not pixels.

import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

type Vm = { get(id: number): { snapshot(): { sessionId: string | null; transcript: { role: string }[] } } | null };
type Item = { id: string; label: string; role: string; accelerator: string };

async function clickMenu(app: ElectronApplication, id: string): Promise<void> {
  await app.evaluate(({ Menu }, itemId) => {
    const item = Menu.getApplicationMenu()?.getMenuItemById(itemId);
    if (!item) throw new Error("menu item not found: " + itemId);
    item.click();
  }, id);
}

async function menuModel(app: ElectronApplication): Promise<Record<string, Item[]>> {
  return app.evaluate(({ Menu }) => {
    const out: Record<string, { id: string; label: string; role: string; accelerator: string }[]> = {};
    for (const top of Menu.getApplicationMenu()?.items ?? []) {
      out[top.role || top.label] = (top.submenu?.items ?? []).map((i) => ({
        id: i.id || "", label: i.label || "", role: String(i.role || ""), accelerator: String(i.accelerator || ""),
      }));
    }
    return out;
  });
}

async function send(win: Page, text: string): Promise<string> {
  const before = await modelRows(win);
  const bar = win.locator('[data-pane="1"] [data-input-bar]').first();
  await bar.click();
  await bar.fill(text);
  await win.keyboard.press("Enter");
  await win.waitForFunction((n) => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript.filter((r) => r.role === "model").length > n, before, { timeout: 20_000 });
  return win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().sessionId!);
}

const modelRows = (win: Page) => win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript.filter((r) => r.role === "model").length);
const windowCount = (app: ElectronApplication) => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length);

function checkMenu(m: Record<string, Item[]>): void {
  const find = (menu: string, pred: (i: Item) => boolean) => (m[menu] ?? []).find(pred);
  const want: [string, string, (i: Item) => boolean, string][] = [
    ["substrate", "Settings… (⌘, is the renderer's)", (i) => i.id === "menu-settings" && i.accelerator === "", ""],
    ["File", "New Window ⌘N", (i) => i.id === "menu-new-window" && i.label === "New Window" && i.accelerator === "CmdOrCtrl+N", ""],
    ["File", "Close Pane ⌘W", (i) => i.id === "menu-close-pane" && i.accelerator === "CmdOrCtrl+W", ""],
    ["File", "Close Window ⇧⌘W", (i) => i.id === "menu-close-window" && i.accelerator === "CmdOrCtrl+Shift+W", ""],
    ["View", "Meta (⌘M is the renderer's)", (i) => i.id === "menu-toggle-meta" && i.label === "Meta" && i.accelerator === "", ""],
    ["View", "Enter Full Screen", (i) => i.role.toLowerCase() === "togglefullscreen", ""],
    ["window", "Minimize", (i) => i.label === "Minimize", ""],
  ];
  for (const [menu, name, pred] of want) {
    if (!find(menu, pred)) throw new Error(`${menu} menu has no ${name}: ${JSON.stringify(m[menu])}`);
  }
  const all = Object.values(m).flat();
  if (all.some((i) => i.accelerator === "Ctrl+`" || i.id === "menu-toggle-reveal" || i.id === "menu-new-session")) throw new Error("a retired item (Toggle Reveal ⌃`, New Session) is still in the menu");
  if ((m["help"] ?? []).some((i) => /about/i.test(i.label) || i.role.toLowerCase() === "about")) throw new Error(`the Help menu repeats About: ${JSON.stringify(m["help"])}`);
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const one = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(one);
    checkMenu(await menuModel(app));

    await bindPaneAsUser(one);
    const sidOne = await send(one, "hello from one");
    const rowsOne = await modelRows(one);

    const [two] = await Promise.all([app.waitForEvent("window", { timeout: 20_000 }), clickMenu(app, "menu-new-window")]);
    await waitForApp(two);
    await two.locator("input[data-ws-input]").first().waitFor({ state: "visible", timeout: 15_000 })
      .catch(() => { throw new Error("the new window did not open at the picker"); });
    if ((await windowCount(app)) !== 2) throw new Error(`after New Window there are ${await windowCount(app)} windows`);
    const stillOne = await one.evaluate(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().sessionId);
    if (stillOne !== sidOne || (await modelRows(one)) !== rowsOne) throw new Error("New Window changed window 1's session or transcript");

    await bindPaneAsUser(two);
    const sidTwo = await send(two, "hello from two");
    if (sidTwo === sidOne) throw new Error(`both windows hold session ${sidOne}`);

    await two.bringToFront();
    await clickMenu(app, "menu-close-window");
    for (let i = 0; i < 50 && (await windowCount(app)) !== 1; i++) await one.waitForTimeout(100);
    if ((await windowCount(app)) !== 1) throw new Error(`Close Window left ${await windowCount(app)} windows`);
    if (two.isClosed() === false) throw new Error("Close Window closed a window other than the second");
    await send(one, "still here");
    if ((await modelRows(one)) < rowsOne + 1) throw new Error("window 1 did not answer after window 2 closed");

    await clickMenu(app, "menu-close-window");
    for (let i = 0; i < 50 && (await windowCount(app)) !== 0; i++) await new Promise((r) => setTimeout(r, 100));
    if ((await windowCount(app)) !== 0) throw new Error("the last window did not close");
    const [three] = await Promise.all([app.waitForEvent("window", { timeout: 20_000 }), app.evaluate(({ app: a }) => { a.emit("activate"); })]);
    await waitForApp(three);
    console.log(`new_window: ok — menu matches the HIG table; New Window opened a second window at the picker (${sidOne} untouched); window 2 ran ${sidTwo}; Close Window closed it and window 1 answered; with no windows the app kept running and activate opened one`);
    code = 0;
  } catch (e) {
    console.error(`new_window: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
