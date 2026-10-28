// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// One input bar, in the panes view and the meta view, with the text entry a user expects (UI sprint 141).
//
// Before: the panes view drew an <input> and the meta view a separate <textarea>, with two key
// handlers; ⇧↵ made a new line in meta only, and a pasted multi-line text lost its lines in panes.
//
// Steps, on a deterministic session, in the panes view and then the meta view:
//   1. "one" ⇧↵ "two": the bar holds two lines and is taller than one line; ↵ sends them as one
//      message, and the bar clears;
//   2. a pasted three-line text keeps its three lines;
//   3. forty lines: the bar stops growing (at most 40% of the window) and scrolls;
//   4. ↑ in an empty bar recalls the last message; ↓ returns to the empty draft;
//   5. ↵ while an input method is composing sends nothing;
//   6. both views show the same bar: [data-input-bar], with the panes view's hint, "type to input · / for commands · ↵ to send".

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

type Vm = { get(id: number): { snapshot(): { transcript: { role: string; text: string }[] } } | null };

const bar = (win: Page) => win.locator("[data-input-bar]").filter({ visible: true }).first();
const value = (win: Page) => bar(win).evaluate((el) => (el as HTMLTextAreaElement).value);
const height = (win: Page) => bar(win).evaluate((el) => Math.round(el.getBoundingClientRect().height));
const userRows = (win: Page) => win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript.filter((r) => r.role === "user").map((r) => r.text));

async function clear(win: Page): Promise<void> {
  await bar(win).click();
  await win.keyboard.press("Meta+a");
  await win.keyboard.press("Backspace");
}

async function checkView(win: Page, app: Awaited<ReturnType<typeof electron.launch>>, view: string): Promise<string> {
  await clear(win);
  const oneLine = await height(win);
  const sentBefore = (await userRows(win)).length;
  await win.keyboard.type("one");
  await win.keyboard.press("Shift+Enter");
  await win.keyboard.type("two");
  if ((await value(win)) !== "one\ntwo") throw new Error(`${view}: ⇧↵ left ${JSON.stringify(await value(win))}`);
  const twoLines = await height(win);
  if (twoLines <= oneLine) throw new Error(`${view}: two lines did not grow the bar (${oneLine} → ${twoLines}px)`);
  await win.keyboard.press("Enter");
  await win.waitForFunction((n) => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript.filter((r) => r.role === "user").length > n, sentBefore, { timeout: 10_000 });
  const sent = (await userRows(win)).at(-1);
  if (sent !== "one\ntwo") throw new Error(`${view}: ↵ sent ${JSON.stringify(sent)}`);
  if ((await value(win)) !== "") throw new Error(`${view}: the bar kept ${JSON.stringify(await value(win))} after sending`);

  await app.evaluate(({ clipboard }) => clipboard.writeText("alpha\nbeta\ngamma"));
  await bar(win).click();
  await win.keyboard.press("Meta+v");
  if ((await value(win)) !== "alpha\nbeta\ngamma") throw new Error(`${view}: paste gave ${JSON.stringify(await value(win))}`);

  await clear(win);
  for (let i = 0; i < 40; i += 1) { await win.keyboard.type(`line ${i}`); await win.keyboard.press("Shift+Enter"); }
  const tall = await bar(win).evaluate((el) => ({ h: el.getBoundingClientRect().height, scroll: el.scrollHeight, vh: window.innerHeight }));
  if (tall.h > tall.vh * 0.4 + 2 || tall.scroll <= tall.h) throw new Error(`${view}: forty lines gave a ${Math.round(tall.h)}px bar (window ${tall.vh}px, content ${tall.scroll}px)`);

  await clear(win);
  await win.keyboard.press("ArrowUp");
  if ((await value(win)) !== "one\ntwo") throw new Error(`${view}: ↑ recalled ${JSON.stringify(await value(win))}`);
  await bar(win).evaluate((el) => { const t = el as HTMLTextAreaElement; t.selectionStart = t.selectionEnd = t.value.length; });
  await win.keyboard.press("ArrowDown");
  if ((await value(win)) !== "") throw new Error(`${view}: ↓ left ${JSON.stringify(await value(win))}, not the empty draft`);

  await win.keyboard.type("half");
  const rowsBefore = (await userRows(win)).length;
  // A send records TURN_SUBMITTED in the key handler, before any network: count it, not rows later.
  const submitted = "(window.__vmSignals || []).filter((s) => s.name === 'TURN_SUBMITTED').length";
  const submittedBefore = await win.evaluate(submitted) as number;
  await bar(win).evaluate((el) => el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true })));
  await settled(win);
  if ((await win.evaluate(submitted)) !== submittedBefore || (await userRows(win)).length !== rowsBefore) throw new Error(`${view}: ↵ during composition sent a message`);
  await clear(win);

  const look = await bar(win).evaluate((el) => ({ tag: el.tagName, hint: el.getAttribute("placeholder") }));
  return JSON.stringify(look);
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);
    const panes = await checkView(win, app, "panes");
    await win.keyboard.press("Meta+m");
    await win.locator('[data-vm-transcript-mount="reveal"]').first().waitFor({ state: "attached", timeout: 10_000 });
    const meta = await checkView(win, app, "meta");
    if (panes !== meta) throw new Error(`the views draw different bars: panes ${panes}, meta ${meta}`);
    if (!panes.includes('"hint":"type to input · / for commands · ↵ to send"')) throw new Error(`the bar's hint is not the panes view's: ${panes}`);
    console.log(`input_bar: ok — panes and meta draw the same bar ${panes}; ⇧↵, paste, growth to a limit, ↑/↓ recall and the composing guard hold in both`);
    code = 0;
  } catch (e) {
    console.error(`input_bar: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
