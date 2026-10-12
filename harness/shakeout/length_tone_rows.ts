// LENGTH and TONE rows in the workspace bar reach the session (UI sprint 143, kernel K296).
//
// Steps: pick a workspace, the model, guidance `auto`, then LENGTH `terse` and TONE `blunt` (the
// tone pick starts the session); send one message. The session's manifest holds length terse and
// tone blunt; its record holds SessionStarted with both and two `control` fragments whose
// provenance names them; the model chip's card names both. A second pane picked at the defaults
// writes no `control` fragment.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { launchArgs, waitForApp } from "./lib/electron";

type Vm = { get(id: number): { snapshot(): { sessionId: string | null; transcript: { role: string }[] } } | null };

async function pickThrough(win: Page, length: string, tone: string): Promise<void> {
  const input = win.locator("input[data-ws-input]").filter({ visible: true }).first();
  await input.click();
  await win.keyboard.press("Enter");
  await win.locator('[data-model-half][data-armed="1"]').filter({ visible: true }).first().waitFor({ timeout: 15_000 });
  await win.locator('[data-model-row="deterministic"] > span').filter({ visible: true }).first().click();
  await win.locator('[data-guidance-row="auto"][data-lit="1"]').filter({ visible: true }).first().waitFor({ timeout: 15_000 });
  await win.locator('[data-guidance-row="auto"]').filter({ visible: true }).first().click();
  await win.locator('[data-length-row="normal"][data-lit="1"]').filter({ visible: true }).first().waitFor({ timeout: 15_000 });
  await win.locator(`[data-length-row="${length}"]`).filter({ visible: true }).first().click();
  await win.locator('[data-tone-row="neutral"][data-lit="1"]').filter({ visible: true }).first().waitFor({ timeout: 15_000 });
  await win.locator(`[data-tone-row="${tone}"]`).filter({ visible: true }).first().click();
  await win.locator("[data-input-bar]").filter({ visible: true }).first().waitFor({ timeout: 15_000 });
}

async function sendAndRead(win: Page, paneId: number): Promise<{ manifest: Record<string, unknown>; started: Record<string, unknown>; controls: { text: string; provenance: Record<string, string> }[] }> {
  const bar = win.locator(`[data-pane="${paneId}"] [data-input-bar]`).first();
  await bar.click();
  await bar.fill("hello");
  await win.keyboard.press("Enter");
  await win.waitForFunction((id) => ((window as unknown as { __vm: Vm }).__vm.get(id)!.snapshot().transcript.some((r) => r.role === "model")), paneId, { timeout: 20_000 });
  return win.evaluate(async (id) => {
    const sid = (window as unknown as { __vm: Vm }).__vm.get(id)!.snapshot().sessionId!;
    const manifest = await (await fetch(`/api/session/${sid}`)).json();
    const events = await (await fetch(`/api/records/${sid}/events`)).json() as { kind: string; payload: Record<string, unknown> }[];
    const started = (events.find((e) => e.kind === "SessionStarted") || { payload: {} }).payload;
    const controls = events.filter((e) => e.kind === "PromptFragment" && e.payload.source === "control").map((e) => ({ text: String(e.payload.text), provenance: e.payload.provenance as Record<string, string> }));
    return { manifest, started, controls };
  }, paneId);
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await pickThrough(win, "terse", "blunt");
    const one = await sendAndRead(win, 1);
    if (one.manifest.length !== "terse" || one.manifest.tone !== "blunt") throw new Error(`manifest ${JSON.stringify({ length: one.manifest.length, tone: one.manifest.tone })}`);
    if (one.started.length !== "terse" || one.started.tone !== "blunt") throw new Error(`SessionStarted ${JSON.stringify({ length: one.started.length, tone: one.started.tone })}`);
    const names = one.controls.map((c) => `${c.provenance.control}:${c.provenance.position}`);
    if (JSON.stringify(names) !== JSON.stringify(["length:terse", "tone:blunt"]) || one.controls.some((c) => !c.text)) throw new Error(`control fragments ${JSON.stringify(one.controls)}`);
    await win.locator("[data-top-bar] [data-model-chip]").first().click();
    const card = (await win.locator("[data-model-card]").first().innerText()).replace(/\s+/g, " ");
    if (!card.includes("length terse") || !card.includes("tone blunt")) throw new Error(`the chip's card reads "${card}"`);
    await win.locator("[data-top-bar] [data-model-chip]").first().click();

    await win.keyboard.press("Meta+d");
    await win.waitForFunction(() => document.querySelectorAll("[data-pane]").length === 2, undefined, { timeout: 10_000 });
    await pickThrough(win, "normal", "neutral");
    const paneId = Number(await win.locator("[data-pane]").nth(1).getAttribute("data-pane"));
    const two = await sendAndRead(win, paneId);
    if (two.controls.length !== 0) throw new Error(`the defaults wrote control fragments: ${JSON.stringify(two.controls)}`);
    console.log(`length_tone_rows: ok — terse and blunt reach the manifest, SessionStarted and two control fragments ${JSON.stringify(names)}; the chip's card names them; the defaults write none`);
    code = 0;
  } catch (e) {
    console.error(`length_tone_rows: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
