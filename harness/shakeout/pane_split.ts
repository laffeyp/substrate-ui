// Pane-split transcript flow. Opens the reveal shell with
// `?atom-transcript=1`, splits a second pane, drives one deterministic
// turn on each pane's controller, and asserts every mount div in the
// DOM contains a rendered `<div data-vm-atom-root>` with children.
//
// This catches the regression where reveal.html emits one
// `<div id="vm-transcript-mount">` per pane; getElementById-based
// mounting picked the first, leaving every other pane blank.

import { chromium } from "playwright";
import { BASE_URL } from "./lib/server";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";

const RUN_TIMEOUT_MS = 60_000;

export const flow: Flow = {
  name: "pane_split_transcript",
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
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      page.on("pageerror", (err) => {
        defects.push({
          category: "pane_split_page_error",
          observed: err.message,
          expected: "no page errors while splitting panes",
          reproduces: true,
          severity: "high",
        });
      });

      await page.goto(BASE_URL + "/?atom-transcript=1&t=" + Date.now(), { waitUntil: "networkidle" });
      await page.waitForFunction(() => (window as unknown as { __vm?: unknown }).__vm != null, undefined, { timeout: 10_000 });

      // Drive pane 1's turn.
      await page.evaluate(async () => {
        const vm = (window as unknown as { __vm: { get(id: number): unknown; spawn(id: number): unknown } }).__vm;
        const c = (vm.get(1) ?? vm.spawn(1)) as { loadDriverRoster: () => Promise<void>; pickDriver: (n: string) => void; openSession: (o: { driver: string }) => Promise<void>; sendTurn: (t: string) => Promise<void> };
        await c.loadDriverRoster();
        c.pickDriver("deterministic");
        await c.openSession({ driver: "deterministic" });
        await c.sendTurn("hello from pane 1");
      });
      await page.waitForFunction(() => {
        const vm = (window as unknown as { __vm?: { get(id: number): { snapshot(): { parkReason?: unknown } } | null } }).__vm;
        return vm?.get(1)?.snapshot().parkReason != null;
      }, undefined, { timeout: RUN_TIMEOUT_MS });

      // Split right — reveal_component.ts `_split('right')` spawns pane 2,
      // registers a controller, and re-renders the pane strip. The
      // second mount div then appears in the DOM.
      await page.evaluate(() => {
        const root = document.getElementById("dc-root") as (HTMLElement & Record<string, unknown>) | null;
        if (!root) throw new Error("no #dc-root");
        const key = Object.keys(root).find((k) => k.startsWith("__reactContainer"));
        if (!key) throw new Error("no react container fiber on #dc-root");
        const container = root[key] as { stateNode?: { current?: unknown } } | undefined;
        const stack: unknown[] = [container?.stateNode?.current];
        let logic: { _split: (dir: string) => void } | null = null;
        while (stack.length > 0) {
          const cursor = stack.pop();
          if (!cursor) continue;
          const inst = (cursor as { stateNode?: { logic?: { _split?: unknown } } }).stateNode;
          const cand = inst?.logic;
          if (cand && typeof cand._split === "function") { logic = cand as { _split: (dir: string) => void }; break; }
          const child = (cursor as { child?: unknown }).child;
          const sibling = (cursor as { sibling?: unknown }).sibling;
          if (sibling) stack.push(sibling);
          if (child) stack.push(child);
        }
        if (!logic) throw new Error("could not reach component logic to split panes");
        const cast = logic as unknown as { state: { panes: { id: number; unbound?: boolean }[] }; _split: (dir: string) => void; _bindPane: (id: number, ws: string) => void };
        cast._split("right");
        const newestPane = cast.state.panes[cast.state.panes.length - 1];
        if (newestPane && newestPane.unbound) cast._bindPane(newestPane.id, "~/.substrate/sandbox");
      });
      await page.waitForFunction(
        () => document.querySelectorAll('[data-vm-transcript-mount="terminal"]').length >= 2,
        undefined,
        { timeout: 5_000 },
      ).catch(() => undefined);

      // Drive pane 2's turn.
      await page.evaluate(async () => {
        const vm = (window as unknown as { __vm: { get(id: number): unknown; spawn(id: number): unknown } }).__vm;
        const c = (vm.get(2) ?? vm.spawn(2)) as { loadDriverRoster: () => Promise<void>; pickDriver: (n: string) => void; openSession: (o: { driver: string }) => Promise<void>; sendTurn: (t: string) => Promise<void> };
        await c.loadDriverRoster();
        c.pickDriver("deterministic");
        await c.openSession({ driver: "deterministic" });
        await c.sendTurn("hello from pane 2");
      });
      await page.waitForFunction(() => {
        const vm = (window as unknown as { __vm?: { get(id: number): { snapshot(): { parkReason?: unknown } } | null } }).__vm;
        return vm?.get(2)?.snapshot().parkReason != null;
      }, undefined, { timeout: RUN_TIMEOUT_MS });

      await page.waitForTimeout(300);

      // Now assert: every mount div has an atom root with children.
      // Duplicate-ID mounting would leave pane 2's mount empty.
      const shape = await page.evaluate(() => {
        const mounts = Array.from(document.querySelectorAll<HTMLElement>('[data-vm-transcript-mount="terminal"]'));
        return mounts.map((host) => {
          const inner = host.querySelector("[data-vm-atom-root]");
          const rowText = Array.from(host.querySelectorAll("span"))
            .map((s) => (s.textContent || "").trim())
            .filter((t) => t.length > 0)
            .slice(0, 20);
          return {
            paneId: host.getAttribute("data-pane-id"),
            hasInner: !!inner,
            innerChildren: inner?.childElementCount ?? -1,
            spans: rowText.length,
          };
        });
      });

      if (shape.length < 2) {
        defects.push({
          category: "pane_split_missing_mount",
          observed: `only ${shape.length} terminal mount div(s) in DOM after split; expected 2`,
          expected: "one terminal-view mount per pane",
          reproduces: true,
          severity: "high",
        });
      }
      for (const s of shape) {
        if (!s.hasInner) {
          defects.push({
            category: "pane_split_no_atom_root",
            observed: `pane ${s.paneId} terminal mount has no [data-vm-atom-root] inner div`,
            expected: "every pane's mount owns a React root",
            reproduces: true,
            severity: "high",
          });
        }
        if (s.innerChildren !== undefined && s.innerChildren <= 0) {
          defects.push({
            category: "pane_split_empty_transcript",
            observed: `pane ${s.paneId} atom root has ${s.innerChildren} children after a driven turn`,
            expected: "atom root contains rendered rows",
            reproduces: true,
            severity: "high",
          });
        }
        if (s.spans === 0) {
          defects.push({
            category: "pane_split_no_text",
            observed: `pane ${s.paneId} rendered zero spans of text after a driven turn`,
            expected: "transcript rows render as visible text",
            reproduces: true,
            severity: "high",
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
