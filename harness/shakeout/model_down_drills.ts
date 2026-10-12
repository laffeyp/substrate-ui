// ↓ keeps drilling down the model column (UI sprint 149).
//
// Steps, on this machine's live roster (three groups: cli agents, ollama · cloud, ollama · local):
// ↵ arms the first workspace and lights "cli agents"; ↓ to "ollama · cloud" (cli agents is folded,
// so the landed group stays folded); → opens it; ↓ through its models onto "ollama · local": the
// group above is open, so it opens; ↓ lights its first model; ↓ to the last row and once more:
// while the column scrolls, the lit row stays on the last row.

import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { launchArgs, waitForApp } from "./lib/electron";

const CLOUD = "ollama · cloud";
const LOCAL = "ollama · local";

async function lit(win: Page): Promise<{ label: string; open: boolean; scrolls: boolean }> {
  return win.evaluate(() => {
    const half = Array.from(document.querySelectorAll("[data-model-half]")).find((e) => (e as HTMLElement).offsetParent !== null)!;
    const row = half.querySelector('[data-lit="1"]');
    const scroll = half.querySelector("[data-model-scroll]") as HTMLElement;
    return {
      label: row?.getAttribute("data-model-row") ?? "",
      open: (row?.lastElementChild?.textContent || "").trim() === "▾",
      scrolls: scroll.scrollHeight > scroll.clientHeight + 0.5,
    };
  });
}

async function down(win: Page): Promise<{ label: string; open: boolean; scrolls: boolean }> {
  await win.keyboard.press("ArrowDown");
  await win.waitForTimeout(60);
  return lit(win);
}

async function main(): Promise<void> {
  const launch = launchArgs({ roster: "live" });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    const input = win.locator("input[data-ws-input]").first();
    await input.waitFor({ state: "visible", timeout: 15_000 });
    await win.locator(`[data-model-row="${LOCAL}"]`).first().waitFor({ state: "attached", timeout: 20_000 })
      .catch(() => { throw new Error(`the live roster has no "${LOCAL}" group`); });
    await input.click();
    await win.keyboard.press("Enter");
    await win.locator('[data-model-half][data-armed="1"]').first().waitFor({ state: "visible", timeout: 15_000 });

    let at = await lit(win);
    if (at.label !== "cli agents") throw new Error(`the armed column lights ${JSON.stringify(at)}`);
    at = await down(win);
    if (at.label !== CLOUD || at.open) throw new Error(`↓ from a folded cli agents gave ${JSON.stringify(at)}; the landed group should stay folded`);
    await win.keyboard.press("ArrowRight");
    await win.waitForTimeout(60);

    const walked: string[] = [];
    for (let i = 0; i < 40; i++) {
      at = await down(win);
      walked.push(at.label);
      if (at.label === LOCAL || at.label === "cli agents") break;
    }
    if (at.label !== LOCAL) throw new Error(`↓ through ${CLOUD} did not reach ${LOCAL}: ${walked.join(" › ")}`);
    if (!at.open) throw new Error(`↓ onto ${LOCAL} with ${CLOUD} open left it folded`);
    const first = await down(win);
    if (first.label === "cli agents" || first.label === LOCAL) throw new Error(`↓ under the opened ${LOCAL} lit ${JSON.stringify(first)}`);

    let last = first;
    for (let i = 0; i < 40; i++) {
      const next = await down(win);
      if (next.label === last.label || next.label === "cli agents") { at = next; break; }
      last = next;
      at = next;
    }
    if (!at.scrolls) throw new Error(`the column does not scroll at the end, so the no-wrap rule was not exercised: ${JSON.stringify(at)}`);
    if (at.label !== last.label) throw new Error(`↓ on the last row (${last.label}) wrapped to ${at.label} while the column scrolls`);
    console.log(`model_down_drills: ok — ${CLOUD} opened by →; ↓ walked ${walked.length - 1} model(s) and opened ${LOCAL}; first local model ${first.label}; ↓ on the last row (${last.label}) stayed while the column scrolls`);
    code = 0;
  } catch (e) {
    console.error(`model_down_drills: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
