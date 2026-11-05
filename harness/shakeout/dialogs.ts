// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The settings and end-session dialogs (sprint 202; plan PLAN-2026-11-04-shell-to-react-r4.md, A8).
//
// Settings: ⌘, opens it; + raises the type size by 1px; Escape closes it; after a window reload ⌘,
// shows the raised size (web/app/state/settings.ts keeps it in localStorage). End session: after one
// turn, /exit opens the dialog, which names the session the footer names (F351); "cancel esc" closes
// it and ends nothing; /exit again and "end session" close it, and SESSION_END_REQUESTED then
// SESSION_ENDED_LOCAL fire.

import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const visible = (win: Page, sel: string) => win.locator(sel).filter({ visible: true }).first();
const signals = (win: Page) => win.evaluate(() =>
  ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).map((s) => s.name));
const sizeLabel = (win: Page) => win.getByText(/^\d+px$/).filter({ visible: true }).first().innerText();
const settingsOpen = (win: Page) => win.getByText("SETTINGS · ⌘,", { exact: true }).isVisible();
const endOpen = (win: Page) => win.getByText(/^End session/).isVisible();

async function openEnd(win: Page): Promise<void> {
  await visible(win, "textarea[data-input-bar]").fill("/");
  await visible(win, '[data-slash-row="/exit"]').click();
  await win.getByText(/^End session/).waitFor({ timeout: 5_000 });
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const seen: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic");
    await visible(win, "textarea[data-input-bar]").fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });

    // End session: the confirm names the session, as the footer does (F351: it named a fixed example).
    await openEnd(win);
    const heading = await win.getByText(/^End session/).innerText();
    const footer = await win.getByText(/^session \S+$/).filter({ visible: true }).first().innerText();
    const named = heading.match(/^End session (\S+)\?$/)?.[1];
    if (!named || `session ${named}` !== footer) throw new Error(`the confirm reads "${heading}"; the footer reads "${footer}"`);
    seen.push(`end confirm names ${named}`);

    // End session: cancel ends nothing.
    await win.getByText("cancel esc", { exact: true }).filter({ visible: true }).first().click();
    await settled(win);
    if (await endOpen(win)) throw new Error("cancel esc left the end-session dialog open");
    if ((await signals(win)).includes("SESSION_END_REQUESTED")) throw new Error("cancel esc requested an end");
    seen.push("end cancel closes, no request");

    // End session: confirm ends it.
    await openEnd(win);
    await win.getByText("end session", { exact: true }).filter({ visible: true }).first().click();
    await win.waitForFunction(() => ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).some((s) => s.name === "SESSION_ENDED_LOCAL"), undefined, { timeout: 15_000 });
    if (await endOpen(win)) throw new Error("end session left the dialog open");
    const tags = await signals(win);
    const req = tags.indexOf("SESSION_END_REQUESTED");
    const ended = tags.indexOf("SESSION_ENDED_LOCAL");
    if (req < 0 || ended < req) throw new Error(`expected SESSION_END_REQUESTED then SESSION_ENDED_LOCAL; got ${tags.join(" ")}`);
    seen.push("end confirm: SESSION_END_REQUESTED, SESSION_ENDED_LOCAL");

    // Settings: open, raise the size, close with Escape.
    await win.keyboard.press("Meta+,");
    await win.getByText("SETTINGS · ⌘,", { exact: true }).waitFor({ timeout: 5_000 });
    const before = await sizeLabel(win);
    // The dialog's + is in the "type size" row; the window has other + controls.
    const sizeRow = win.locator("div").filter({ has: win.getByText("type size", { exact: true }), visible: true }).last();
    await sizeRow.getByText("+", { exact: true }).click();
    const raised = `${parseInt(before, 10) + 1}px`;
    await win.waitForFunction((want) => Array.from(document.querySelectorAll("span")).some((s) => s.offsetParent !== null && s.textContent === want), raised, { timeout: 5_000 });
    await win.keyboard.press("Escape");
    await settled(win);
    if (await settingsOpen(win)) throw new Error("Escape left the settings dialog open");
    seen.push(`settings ${before} → ${raised}, Escape closes`);

    // The size survives a reload.
    await win.reload();
    await waitForApp(win);
    await win.keyboard.press("Meta+,");
    await win.getByText("SETTINGS · ⌘,", { exact: true }).waitFor({ timeout: 5_000 });
    const after = await sizeLabel(win);
    if (after !== raised) throw new Error(`after a reload the type size reads ${after}; expected ${raised}`);
    seen.push(`after reload ${after}`);

    console.log(`dialogs: ok — ${seen.join("; ")}`);
    code = 0;
  } catch (e) {
    console.error(`dialogs: FAIL — ${(e as Error).message}; passed: ${seen.join("; ") || "none"}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
