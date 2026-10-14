// The bar line names its settings and carries language shifts (UI sprint 172; design sheet 22b).
//
// The deterministic driver's replies never vary, so the drift detector never fires on them in a
// gate; tests/test_language_shift_route_172.py proves a reply-side shift reaches the route with a
// scripted driver. Here the gate adds one shift to every response of the language route (stated in
// the output), so each of the app's own refreshes carries it, and reads how the bar draws it and
// what each command does:
//   1. two turns, the shift on the first turn's reply: "length normal words ↑", its hover the
//      shift's note;
//   2. /language off hides it, and the line ends "· guidance <level> · length normal · tone neutral";
//   3. /language on shows it, /language clear hides it;
//   4. /language opens the meta view on the language lens with turn 0, the shift's turn, selected
//      (with no selection the lens would show the last turn, t1).

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

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    await win.route("**/api/session/*/language", async (route) => {
      const response = await route.fetch();
      const v = await response.json();
      const reply = (v?.lines || []).find((l: { stream: string; turn: number }) => l.stream === "model" && l.turn === 0);
      if (reply) v.shifts = [{ seq: reply.seq + 1, turn: 0, stream: "model", measure: "words", direction: "up", source_seq: reply.seq }];
      await route.fulfill({ response, json: v });
    });
    await type(win, "one");
    await win.waitForFunction(`/returned/.test(${BAR})`, undefined, { timeout: 20_000 });
    await type(win, "two");
    await win.waitForFunction(`/returned/.test(${BAR}) && (window.__vm.get(1).snapshot().language?.lines || []).some((l) => l.stream === "model" && l.turn === 1) && window.__vm.get(1).snapshot().language.shifts.length === 1`, undefined, { timeout: 20_000 });
    await settled(win);
    const shifted = await win.evaluate(BAR) as string;
    if (!shifted.endsWith("length normal words ↑ · tone neutral")) throw new Error(`the shift is not after length: ${JSON.stringify(shifted)}`);
    const title = await win.evaluate(`document.querySelector('[data-pane="1"] [data-lang-shift="words ↑"]')?.getAttribute("title")`);
    if (title !== "words up, flagged at turn 0. Length is normal.") throw new Error(`the shift's hover reads ${JSON.stringify(title)}`);

    await type(win, "/language off");
    const plain = await win.evaluate(BAR) as string;
    if (!/ · guidance \S+ · length normal · tone neutral$/.test(plain)) throw new Error(`with /language off the line does not end with its named settings: ${JSON.stringify(plain)}`);
    await type(win, "/language on");
    if (!(await win.evaluate(BAR) as string).includes("words ↑")) throw new Error("/language on did not bring the shift back");
    await type(win, "/language clear");
    if ((await win.evaluate(BAR) as string).includes("words ↑")) throw new Error("/language clear left the shift on the line");

    await type(win, "/language");
    await win.waitForFunction(`Array.from(document.querySelectorAll('[data-lang]')).some((e) => e.getClientRects().length)`, undefined, { timeout: 10_000 })
      .catch(() => { throw new Error("/language did not open the language lens"); });
    const label = await win.evaluate(`Array.from(document.querySelectorAll('[data-lang-readout]')).filter((e) => e.getClientRects().length).map((e) => (e.textContent || "").trim().split(/\\s+/)[0])[0]`);
    if (label !== "t0") {
      await new Promise((r) => setTimeout(r, 500));
      const later = await win.evaluate(`Array.from(document.querySelectorAll('[data-lang-readout]')).filter((e) => e.getClientRects().length).map((e) => (e.textContent || "").trim().split(/\\s+/)[0])[0]`);
      const snap = await win.evaluate(`JSON.stringify({ tick: window.__vm.get(1).snapshot().languageOpenTick, shifts: window.__vm.get(1).snapshot().language?.shifts })`);
      throw new Error(`/language opened the lens on ${JSON.stringify(label)} (${JSON.stringify(later)} 500 ms later), not the shift's turn t0; ${snap}`);
    }
    console.log(`language_bar_line: ok — ${JSON.stringify(plain.slice(plain.indexOf("guidance")))}; a words shift added to the route read "length normal words ↑" with its note; off/on/clear did; /language opened the lens on t0, the shift's turn`);
    code = 0;
  } catch (e) {
    console.error(`language_bar_line: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
