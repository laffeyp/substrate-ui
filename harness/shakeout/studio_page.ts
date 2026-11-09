// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Studio is there, as the dc-runtime template (`web/reveal.html` at `d4322e1`) drew it (sprint 334;
// restored after sprints 242-245 removed it: BLACKBOARD, 2026-11-05 failure entry).
//
// Steps: the top bar's "studio" button opens the page; the crumb ends "› studio"; the page reads
// "studio · author a topology" and "coming soon…"; its body is dimmed (opacity 0.4) and takes no
// pointer; the form shows TOPOLOGY NAME with adversarial_pair_review and the three sample producers;
// the canvas tab shows the node-graph with the producer cards; Escape returns to the panes; the
// button again opens it, and the button once more closes it.

import { _electron as electron, type Page } from "playwright";
import { launchArgs, settled, waitForApp } from "./lib/electron";

const crumb = async (win: Page) => (await win.locator("[data-crumb]").first().innerText()).trim();

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const seen: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    const button = win.locator("[data-top-bar] span").filter({ hasText: /^studio$/ }).first();
    await button.click();
    await win.getByText("studio · author a topology", { exact: true }).waitFor({ timeout: 5_000 });
    await win.getByText("coming soon…", { exact: true }).waitFor({ timeout: 5_000 });
    if (!(await crumb(win)).endsWith("› studio")) throw new Error(`the crumb reads ${await crumb(win)}`);
    seen.push("the button opens Studio; the crumb ends › studio; coming soon…");

    const body = await win.evaluate(() => {
      const name = Array.from(document.querySelectorAll("div")).find((d) => d.textContent === "TOPOLOGY NAME");
      let el: HTMLElement | null = name ?? null;
      while (el && getComputedStyle(el).opacity === "1") el = el.parentElement;
      const input = name?.nextElementSibling as HTMLInputElement | undefined;
      return { opacity: el ? getComputedStyle(el).opacity : null, pointer: el ? getComputedStyle(el).pointerEvents : null, topology: input?.value ?? null };
    });
    if (body.opacity !== "0.4" || body.pointer !== "none" || body.topology !== "adversarial_pair_review") throw new Error(`the form ${JSON.stringify(body)}`);
    for (const producer of ["builder", "attacker", "judge"]) {
      if (!(await win.locator(`input[value="${producer}"]`).count())) throw new Error(`the form lacks producer ${producer}`);
    }
    seen.push("the form, dimmed and inert, with adversarial_pair_review and its three producers");

    await win.getByText("canvas", { exact: true }).click();
    await win.getByText(/^node-graph — drag the Producer cards/).waitFor({ timeout: 5_000 });
    if (!(await win.getByText("emits Draft", { exact: true }).count())) throw new Error("the canvas lacks the builder card");
    await win.getByText("form", { exact: true }).click();
    await settled(win);
    seen.push("canvas and form tabs");

    await win.keyboard.press("Escape");
    await win.getByText("studio · author a topology", { exact: true }).waitFor({ state: "detached", timeout: 5_000 });
    await button.click();
    await win.getByText("studio · author a topology", { exact: true }).waitFor({ timeout: 5_000 });
    await button.click();
    await win.getByText("studio · author a topology", { exact: true }).waitFor({ state: "detached", timeout: 5_000 });
    seen.push("Escape closes it; the button toggles it");

    console.log(`studio_page: ok — ${seen.join("; ")}`);
    code = 0;
  } catch (e) {
    console.error(`studio_page: FAIL — ${(e as Error).message}; passed: ${seen.join("; ") || "none"}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
