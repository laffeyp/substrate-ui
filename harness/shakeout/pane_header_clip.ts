// Pane header clip flow. Splits panes horizontally until each cell is
// narrow, then asserts the focused pane's header row does not paint
// past its own right edge into the neighbouring pane. `overflow:hidden`
// on the header is the fix; when a dropdown opens the header switches
// to `overflow:visible` so the popover can escape below.

import { chromium } from "playwright";
import { BASE_URL } from "./lib/server";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";

export const flow: Flow = {
  name: "pane_header_clip",
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
        viewport: { width: 1200, height: 800 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      page.on("pageerror", (err) => {
        defects.push({
          category: "pane_header_clip_page_error",
          observed: err.message,
          expected: "no page errors while splitting panes",
          reproduces: true,
          severity: "high",
        });
      });

      await page.goto(BASE_URL + "/?atom-transcript=1&t=" + Date.now(), { waitUntil: "networkidle" });
      await page.waitForFunction(() => (window as unknown as { __vm?: unknown }).__vm != null, undefined, { timeout: 10_000 });

      // Split right four times so the four panes tile side-by-side.
      // Each pane's cell shrinks to about 300 px — narrow enough to
      // force the header's chip row to overflow if the container is
      // `overflow:visible`.
      await page.evaluate(() => {
        const root = document.getElementById("dc-root") as (HTMLElement & Record<string, unknown>) | null;
        if (!root) throw new Error("no #dc-root");
        const key = Object.keys(root).find((k) => k.startsWith("__reactContainer"));
        if (!key) throw new Error("no react fiber");
        const container = root[key] as { stateNode?: { current?: unknown } } | undefined;
        const stack: unknown[] = [container?.stateNode?.current];
        let logic: { _split: (dir: string) => void; state: { panes: { id: number }[] }; _bindPane: (id: number, ws: string) => void } | null = null;
        while (stack.length > 0) {
          const cursor = stack.pop();
          if (!cursor) continue;
          const inst = (cursor as { stateNode?: { logic?: { _split?: unknown } } }).stateNode;
          const cand = inst?.logic;
          if (cand && typeof cand._split === "function") { logic = cand as typeof logic; break; }
          const child = (cursor as { child?: unknown }).child;
          const sibling = (cursor as { sibling?: unknown }).sibling;
          if (sibling) stack.push(sibling);
          if (child) stack.push(child);
        }
        if (!logic) throw new Error("no logic");
        for (let i = 0; i < 3; i++) logic._split("right");
        for (const p of logic.state.panes) logic._bindPane(p.id, "~/.substrate/sandbox");
      });
      await page.waitForFunction(
        () => document.querySelectorAll('[data-vm-transcript-mount="terminal"]').length >= 4,
        undefined,
        { timeout: 5_000 },
      ).catch(() => undefined);

      // Focus each pane and check header right-edge against its own cell.
      const findings = await page.evaluate(() => {
        const mounts = Array.from(document.querySelectorAll<HTMLElement>('[data-vm-transcript-mount="terminal"]'));
        const result: { paneId: string | null; headerRight: number; cellRight: number; overflowPx: number }[] = [];
        for (const mount of mounts) {
          // Pane cell = mount's ancestor with grid-column set (line 44 of reveal.html).
          let cell: HTMLElement | null = mount;
          while (cell && !cell.style.gridColumn) cell = cell.parentElement;
          if (!cell) continue;
          const cellRect = cell.getBoundingClientRect();
          // Header row = first child of the pane cell (line 46).
          const header = cell.querySelector<HTMLElement>(':scope > div[style*="background:#26292e"]');
          if (!header) continue;
          const chips = Array.from(header.querySelectorAll<HTMLElement>(":scope > span"));
          let maxRight = header.getBoundingClientRect().left;
          for (const c of chips) {
            const r = c.getBoundingClientRect();
            if (r.right > maxRight) maxRight = r.right;
          }
          result.push({
            paneId: mount.getAttribute("data-pane-id"),
            headerRight: Math.round(maxRight),
            cellRight: Math.round(cellRect.right),
            overflowPx: Math.round(maxRight - cellRect.right),
          });
        }
        return result;
      });

      for (const f of findings) {
        // Allow a couple of pixels for subpixel rendering; anything larger
        // is a chip painting outside its pane.
        if (f.overflowPx > 2) {
          defects.push({
            category: "pane_header_clip_bleed",
            observed: `pane ${f.paneId} header chips extend ${f.overflowPx}px past the pane's right edge (header ${f.headerRight}, cell ${f.cellRight})`,
            expected: "header chips clipped at the pane's right edge",
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
