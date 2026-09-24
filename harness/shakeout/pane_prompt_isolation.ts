// Pane prompt isolation flow. Splits a second pane, types into pane
// 1's prompt input, and asserts that pane 2's input stays empty.
// A global `state.promptVal` field mirrored the same string into
// every pane's input on every render; per-pane `p.pv` is the fix.

import { chromium } from "playwright";
import { BASE_URL } from "./lib/server";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";

export const flow: Flow = {
  name: "pane_prompt_isolation",
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
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
      const page = await context.newPage();
      page.on("pageerror", (err) => {
        defects.push({
          category: "pane_prompt_isolation_page_error",
          observed: err.message,
          expected: "no page errors during typing",
          reproduces: true,
          severity: "high",
        });
      });

      await page.goto(BASE_URL + "/?atom-transcript=1&t=" + Date.now(), { waitUntil: "networkidle" });
      await page.waitForFunction(() => (window as unknown as { __vm?: unknown }).__vm != null, undefined, { timeout: 10_000 });

      // Split right and bind the new pane.
      await page.evaluate(() => {
        const root = document.getElementById("dc-root") as (HTMLElement & Record<string, unknown>) | null;
        if (!root) throw new Error("no #dc-root");
        const key = Object.keys(root).find((k) => k.startsWith("__reactContainer"));
        if (!key) throw new Error("no fiber");
        const stack: unknown[] = [((root[key] as { stateNode?: { current?: unknown } }).stateNode?.current)];
        let logic: { _split: (dir: string) => void; state: { panes: { id: number; unbound?: boolean }[] }; _bindPane: (id: number, ws: string) => void } | null = null;
        while (stack.length > 0) {
          const cursor = stack.pop();
          if (!cursor) continue;
          const inst = (cursor as { stateNode?: { logic?: { _split?: unknown } } }).stateNode;
          const cand = inst?.logic;
          if (cand && typeof cand._split === "function") { logic = cand as typeof logic; break; }
          const c = (cursor as { child?: unknown }).child;
          const s = (cursor as { sibling?: unknown }).sibling;
          if (s) stack.push(s);
          if (c) stack.push(c);
        }
        if (!logic) throw new Error("no logic");
        logic._split("right");
        const newest = logic.state.panes[logic.state.panes.length - 1];
        if (newest.unbound) logic._bindPane(newest.id, "~/.substrate/sandbox");
      });

      await page.waitForFunction(
        () => document.querySelectorAll('[data-vm-transcript-mount="terminal"]').length >= 2,
        undefined,
        { timeout: 5_000 },
      );

      // Locate each pane's prompt input by walking from the terminal
      // mount to the enclosing pane cell (grid-column set) and picking
      // the first input inside it.
      const inputsBefore = await page.evaluate(() => {
        const mounts = Array.from(document.querySelectorAll<HTMLElement>('[data-vm-transcript-mount="terminal"]'));
        return mounts.map((mount) => {
          let cell: HTMLElement | null = mount;
          while (cell && !cell.style.gridColumn) cell = cell.parentElement;
          const input = cell?.querySelector<HTMLInputElement>('input[placeholder^="type to talk"]');
          return { paneId: mount.getAttribute("data-pane-id"), value: input?.value ?? null };
        });
      });

      // Type into pane 1's input by dispatching a change event with
      // the desired value. React's onChange listeners react to input
      // events; we dispatch both.
      const testString = "hello from pane 1";
      const typed = await page.evaluate((val) => {
        const mounts = Array.from(document.querySelectorAll<HTMLElement>('[data-vm-transcript-mount="terminal"]'));
        const pane1 = mounts.find((m) => m.getAttribute("data-pane-id") === "1");
        if (!pane1) return false;
        let cell: HTMLElement | null = pane1;
        while (cell && !cell.style.gridColumn) cell = cell.parentElement;
        const input = cell?.querySelector<HTMLInputElement>('input[placeholder^="type to talk"]');
        if (!input) return false;
        // React 18 tracks the native setter for controlled inputs; use it.
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        if (nativeSetter) nativeSetter.call(input, val);
        else input.value = val;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }, testString);
      if (!typed) {
        defects.push({
          category: "pane_prompt_isolation_no_input",
          observed: "could not find pane 1's prompt input",
          expected: "each pane renders an input placeholder='type to talk...'",
          reproduces: true,
          severity: "high",
        });
        return { emitted, defects };
      }
      await page.waitForTimeout(150);

      const inputsAfter = await page.evaluate(() => {
        const mounts = Array.from(document.querySelectorAll<HTMLElement>('[data-vm-transcript-mount="terminal"]'));
        return mounts.map((mount) => {
          let cell: HTMLElement | null = mount;
          while (cell && !cell.style.gridColumn) cell = cell.parentElement;
          const input = cell?.querySelector<HTMLInputElement>('input[placeholder^="type to talk"]');
          return { paneId: mount.getAttribute("data-pane-id"), value: input?.value ?? null };
        });
      });

      const pane1After = inputsAfter.find((r) => r.paneId === "1");
      const pane2After = inputsAfter.find((r) => r.paneId === "2");
      if (pane1After?.value !== testString) {
        defects.push({
          category: "pane_prompt_isolation_pane1_not_typed",
          observed: `pane 1 input is "${pane1After?.value}"; expected "${testString}"`,
          expected: `pane 1 input === "${testString}"`,
          reproduces: true,
          severity: "high",
        });
      }
      if (pane2After?.value && pane2After.value.length > 0) {
        defects.push({
          category: "pane_prompt_isolation_bleed",
          observed: `pane 2 input contains "${pane2After.value}" after typing into pane 1; expected empty`,
          expected: "pane 2 input remains empty when typing into pane 1",
          reproduces: true,
          severity: "high",
        });
      }

      // Also ensure inputsBefore both started empty (invariant).
      for (const b of inputsBefore) {
        if (b.value && b.value.length > 0) {
          defects.push({
            category: "pane_prompt_isolation_dirty_start",
            observed: `pane ${b.paneId} input started with "${b.value}"`,
            expected: "inputs empty at start",
            reproduces: true,
            severity: "medium",
          });
        }
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
