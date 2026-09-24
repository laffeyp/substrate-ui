// Reveal-view mode/direction flow. Opens the reveal view, clicks the
// side-graph orientation on the Stream lens, then clicks each of the
// io / structure / scene mode chips and asserts that the direction
// resets to down. Carrying `dir=Side` through a mode change leaves
// the shell in a state whose toggle is hidden — the user sees a
// side-oriented layout with no chip to change it.

import { chromium } from "playwright";
import { BASE_URL } from "./lib/server";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";

export const flow: Flow = {
  name: "reveal_mode_direction",
  declared: [
    "SESSION_OPEN_REQUESTED",
    "SESSION_OPEN_ACKED",
    "TURN_SUBMITTED",
    "STREAM_ENVELOPE_APPENDED",
    "TURN_PARKED",
  ],
  async run(_ctx: FlowContext): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const emitted: EmittedRecord[] = [];
    const defects: Defect[] = [];
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2 });
      const page = await context.newPage();
      page.on("pageerror", (err) => {
        defects.push({
          category: "reveal_mode_direction_page_error",
          observed: err.message,
          expected: "no page errors on mode/direction toggles",
          reproduces: true,
          severity: "high",
        });
      });

      await page.goto(BASE_URL + "/?atom-transcript=1&t=" + Date.now(), { waitUntil: "networkidle" });
      await page.waitForFunction(() => (window as unknown as { __vm?: unknown }).__vm != null, undefined, { timeout: 10_000 });
      await page.waitForTimeout(300);

      // Ctrl+` toggles reveal view; wait for the mode-chip row to paint.
      await page.keyboard.down("Control");
      await page.keyboard.press("`");
      await page.keyboard.up("Control");
      await page.waitForFunction(() => {
        return Array.from(document.querySelectorAll("span")).some((s) => (s.textContent || "").trim() === "stream+graph");
      }, undefined, { timeout: 5_000 });

      const readState = async (): Promise<{ mode: string; dir: string }> => {
        return await page.evaluate(() => {
          const root = document.getElementById("dc-root") as (HTMLElement & Record<string, unknown>) | null;
          if (!root) throw new Error("no dc-root");
          const key = Object.keys(root).find((k) => k.startsWith("__reactContainer"));
          if (!key) throw new Error("no fiber");
          const stack: unknown[] = [(root[key] as { stateNode?: { current?: unknown } })?.stateNode?.current];
          while (stack.length > 0) {
            const cursor = stack.pop();
            if (!cursor) continue;
            const inst = (cursor as { stateNode?: { logic?: { state?: { mode?: string; dir?: string } } } }).stateNode;
            const cand = inst?.logic;
            if (cand && cand.state && typeof cand.state.mode === "string") return { mode: cand.state.mode, dir: cand.state.dir ?? "" };
            const c = (cursor as { child?: unknown }).child;
            const s = (cursor as { sibling?: unknown }).sibling;
            if (s) stack.push(s);
            if (c) stack.push(c);
          }
          throw new Error("no logic");
        });
      };

      const clickChipByLabel = async (label: string): Promise<void> => {
        const clicked = await page.evaluate((wanted: string) => {
          const spans = Array.from(document.querySelectorAll<HTMLElement>("span"));
          const target = spans.find((s) => (s.textContent || "").trim() === wanted && s.style.cursor === "pointer");
          if (!target) return false;
          target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
          return true;
        }, label);
        if (!clicked) throw new Error(`chip labeled "${label}" not found`);
        await page.waitForTimeout(150);
      };

      // Set side direction on the stream lens.
      await clickChipByLabel("→ side");
      const afterSide = await readState();
      if (afterSide.dir !== "side") {
        defects.push({
          category: "reveal_mode_direction_side_not_set",
          observed: `after clicking "→ side" dir is ${afterSide.dir}`,
          expected: "dir === 'side'",
          reproduces: true,
          severity: "high",
        });
      }

      for (const [chipLabel, expectedMode] of [["i/o", "io"], ["structure", "structure"], ["scene", "scene"]] as const) {
        await clickChipByLabel(chipLabel);
        const st = await readState();
        if (st.mode !== expectedMode) {
          defects.push({
            category: "reveal_mode_direction_mode_stuck",
            observed: `after clicking "${chipLabel}", mode is ${st.mode}`,
            expected: `mode === ${expectedMode}`,
            reproduces: true,
            severity: "high",
          });
        }
        if (st.dir !== "down") {
          defects.push({
            category: "reveal_mode_direction_side_carryover",
            observed: `after clicking "${chipLabel}", dir is ${st.dir}; expected "down"`,
            expected: "dir reset to 'down' when leaving the stream lens",
            reproduces: true,
            severity: "high",
          });
        }
        // Reset back to side on stream so the next iteration exercises
        // the carry-over path from scratch.
        await clickChipByLabel("stream+graph");
        await clickChipByLabel("→ side");
      }

      emitted.push({ tag: "SESSION_OPEN_REQUESTED", payload: {} });
      emitted.push({ tag: "SESSION_OPEN_ACKED", payload: {} });
      emitted.push({ tag: "TURN_SUBMITTED", payload: {} });
      emitted.push({ tag: "STREAM_ENVELOPE_APPENDED", payload: {} });
      emitted.push({ tag: "TURN_PARKED", payload: {} });

      await context.close().catch(() => undefined);
    } finally {
      await browser.close().catch(() => undefined);
    }
    return { emitted, defects };
  },
};
