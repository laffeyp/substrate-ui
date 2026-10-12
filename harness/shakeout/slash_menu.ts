// One slash-command table (UI sprint 162): the menu lists every command the controller runs, a
// command's choices appear after it and a space, and /help writes one row per command.
//
// Steps: bind pane 1; "/" lists slashCatalog()'s commands in order; "/to" closes the menu and hints /tone;
// "/tone " lists the four tones with neutral marked current; picking formal sets the manifest's
// tone; "/help" writes one row per command.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const ROWS = `Array.from(document.querySelectorAll('[data-pane="1"] [data-slash-row]')).filter((e) => e.offsetParent !== null).map((e) => ({ cmd: e.getAttribute("data-slash-row"), current: e.getAttribute("data-current") === "1", text: (e.textContent || "").replace(/\\s+/g, " ").trim() }))`;
type Row = { cmd: string; current: boolean; text: string };
const rows = (win: Page) => win.evaluate(ROWS) as Promise<Row[]>;

async function fill(win: Page, text: string): Promise<void> {
  const bar = win.locator('[data-pane="1"] [data-input-bar]').first();
  await bar.click();
  await bar.fill(text);
  await settled(win);
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

    const catalog = await win.evaluate(`window.__vm.get(1).slashCatalog().map((c) => "/" + c.name)`) as string[];
    if (catalog.length < 13) throw new Error(`slashCatalog() names ${catalog.length} commands: ${catalog.join(" ")}`);
    await fill(win, "/");
    const all = (await rows(win)).map((r) => r.cmd);
    if (JSON.stringify(all) !== JSON.stringify(catalog)) throw new Error(`"/" lists ${JSON.stringify(all)}; the table is ${JSON.stringify(catalog)}`);

    // UI sprint 163: one match closes the menu; its hint sits in the input row instead.
    await fill(win, "/to");
    const to = (await rows(win)).map((r) => r.cmd);
    const toHint = await win.evaluate(`(document.querySelector('[data-pane="1"] [data-slash-hint]')?.textContent || "").trim()`) as string;
    if (to.length || !toHint.includes("blunt|neutral|formal|dry")) throw new Error(`"/to" lists ${JSON.stringify(to)}, hint ${JSON.stringify(toHint)}`);

    await fill(win, "/tone ");
    const tones = await rows(win);
    if (JSON.stringify(tones.map((r) => r.cmd)) !== JSON.stringify(["/tone blunt", "/tone neutral", "/tone formal", "/tone dry"])) throw new Error(`"/tone " lists ${JSON.stringify(tones)}`);
    if (!tones.find((r) => r.cmd === "/tone neutral")?.current) throw new Error(`neutral is not marked current: ${JSON.stringify(tones)}`);
    await win.locator('[data-pane="1"] [data-slash-row="/tone formal"]').first().click();
    await win.waitForFunction(`fetch("/api/session/" + window.__vm.get(1).snapshot().sessionId).then((r) => r.json()).then((m) => m.tone === "formal")`, undefined, { timeout: 5_000 })
      .catch(() => { throw new Error("picking /tone formal did not set the tone"); });

    await fill(win, "/help");
    await win.keyboard.press("Enter");
    await win.waitForFunction(`document.querySelectorAll('[data-pane="1"] [data-help-row]').length > 0`, undefined, { timeout: 5_000 })
      .catch(() => { throw new Error("/help wrote no rows"); });
    const help = await win.evaluate(`Array.from(document.querySelectorAll('[data-pane="1"] [data-help-row]')).map((e) => (e.textContent || "").replace(/\\s+/g, " ").trim())`) as string[];
    for (const name of ["/guidance", "/length", "/tone", "/dellm", "/model"]) {
      const line = help.find((h) => h.startsWith(name));
      if (!line || line.split(" ").length < 3) throw new Error(`/help has no described row for ${name}: ${JSON.stringify(help)}`);
    }
    if (help.length !== catalog.length) throw new Error(`/help wrote ${help.length} rows for ${catalog.length} commands`);
    console.log(`slash_menu: ok — "/" lists ${catalog.length} commands from the one table; "/tone " offers 4 with neutral current; formal set the tone; /help wrote ${help.length} described rows`);
    code = 0;
  } catch (e) {
    console.error(`slash_menu: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
