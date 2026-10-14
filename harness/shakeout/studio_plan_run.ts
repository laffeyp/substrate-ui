// The Studio checks and runs a plan for the pane's session (UI sprint 188; kernel K338).
//
// Steps: bind pane 1 (deterministic) and send a message so the pane has a session; open the
// Studio; pick `draft_and_critique` (the box fills); check it (no findings); take `or quiet` off
// its end and check again (`never_ends`, and the fixed plan offered); use the fixed plan (checked
// again: no findings); run it: the Studio closes on a view-only pane that shows the run's steps
// and its end.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

type Row = { role: string; text: string };
type Vm = { get(id: number): { snapshot(): { transcript: Row[]; viewOnly: string | null } } | null; paneIds(): number[] };

async function findings(win: Page): Promise<string[]> {
  await settled(win);
  return win.locator("[data-studio-finding]").allTextContents();
}

async function check(win: Page): Promise<string[]> {
  const before = await win.locator("[data-studio-out]").textContent();
  await win.locator("[data-studio-check]").click();
  await win.waitForFunction((b) => {
    const t = document.querySelector("[data-studio-out]")?.textContent ?? "";
    return t !== b && !t.includes("checking…");
  }, before, { timeout: 30_000 });
  return findings(win);
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
    await win.waitForFunction(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript.some((r) => r.role === "model"), undefined, { timeout: 20_000 });

    await win.getByText("studio", { exact: true }).first().click();
    const pick = win.locator('[data-studio-plan="draft_and_critique"]');
    await pick.waitFor({ state: "visible", timeout: 10_000 });
    await pick.click();
    const box = win.locator("[data-studio-lines]");
    const lines = await box.inputValue();
    if (!lines.includes('draft: model "') || !lines.includes("end: first Fix or quiet")) throw new Error(`the box holds ${JSON.stringify(lines)}`);

    const clean = await check(win);
    if (JSON.stringify(clean) !== JSON.stringify(["none"])) throw new Error(`the shipped plan has findings ${JSON.stringify(clean)}`);
    const dry = await win.locator("[data-studio-dry]").allTextContents();
    if (!dry.some((d) => d.startsWith("1 draft → Draft"))) throw new Error(`the dry run reads ${JSON.stringify(dry)}`);

    await box.fill(lines.replace("end: first Fix or quiet", "end: first Fix"));
    const broken = await check(win);
    if (!broken.some((f) => f.startsWith("never_ends · "))) throw new Error(`without "or quiet" the findings read ${JSON.stringify(broken)}`);
    // STUDIO_SHOT=<file.png> saves the Studio as it stands here, for a person to look at.
    if (process.env.STUDIO_SHOT) await win.screenshot({ path: process.env.STUDIO_SHOT });
    const useFixed = win.locator("[data-studio-use-fixed]");
    await useFixed.waitFor({ state: "visible", timeout: 5_000 });
    await useFixed.click();
    await win.waitForFunction(() => (document.querySelector("[data-studio-lines]") as HTMLTextAreaElement | null)?.value.includes("end: first Fix or quiet"), undefined, { timeout: 10_000 });
    await win.waitForFunction(() => Array.from(document.querySelectorAll("[data-studio-finding]")).map((e) => e.textContent).join("|") === "none", undefined, { timeout: 30_000 })
      .catch(async () => { throw new Error(`the fixed plan's findings read ${JSON.stringify(await findings(win))}`); });

    await win.locator("[data-studio-input]").fill("write add(a, b)");
    await win.locator("[data-studio-run]").click();
    const runPane = await win.waitForFunction(() => {
      const vm = (window as unknown as { __vm: Vm }).__vm;
      const ids = vm.paneIds().filter((id) => (vm.get(id)?.snapshot().viewOnly ?? "").startsWith("view only: the steps of"));
      return ids.length === 1 ? ids[0] : null;
    }, undefined, { timeout: 20_000 }).then((h) => h.jsonValue() as Promise<number>)
      .catch(async () => { throw new Error(`no run pane; the Studio says ${JSON.stringify(await win.locator("[data-studio-out]").textContent().catch(() => null))}`); });
    if (await win.locator("[data-studio]").count()) throw new Error("the Studio stayed open over the run's pane");
    await win.waitForFunction((n) => ((window as unknown as { __vm: Vm }).__vm.get(n)?.snapshot().transcript ?? []).some((r) => r.text === "run finished"), runPane, { timeout: 30_000 })
      .catch(async () => { throw new Error(`the run pane reads ${JSON.stringify(await win.evaluate((n) => (window as unknown as { __vm: Vm }).__vm.get(n)!.snapshot().transcript.map((r) => r.text), runPane))}`); });
    const rows = await win.evaluate((n) => (window as unknown as { __vm: Vm }).__vm.get(n)!.snapshot().transcript.map((r) => r.text), runPane);
    if (!rows[0]?.startsWith("**draft** · ")) throw new Error(`the run pane starts ${JSON.stringify(rows.slice(0, 2))}`);
    console.log(`studio_plan_run: ok — picked, checked clean, broke the end (never_ends), used the fixed plan (clean), ran it: pane ${runPane} reads ${rows.length} rows ending "run finished"`);
    code = 0;
  } catch (e) {
    console.error(`studio_plan_run: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
