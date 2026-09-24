// Model-reply render flow. Drives one deterministic turn and asserts
// the ModelReply row's DOM contains the reply text. This catches the
// jsx-runtime signature-mismatch class of bug: when the shim falls
// back to React.createElement without translating the key argument,
// every JSX call `_jsx(type, {children}, key)` treats the key as a
// positional child and overwrites `props.children`. The model reply
// paragraph then renders as its map index (`0`) instead of its text.

import { chromium } from "playwright";
import { BASE_URL } from "./lib/server";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";

export const flow: Flow = {
  name: "model_reply_render",
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
      const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
      const page = await context.newPage();
      page.on("pageerror", (err) => {
        defects.push({
          category: "model_reply_render_page_error",
          observed: err.message,
          expected: "no page errors on a turn",
          reproduces: true,
          severity: "high",
        });
      });

      await page.goto(BASE_URL + "/?atom-transcript=1&t=" + Date.now(), { waitUntil: "networkidle" });
      await page.waitForFunction(() => (window as unknown as { __vm?: unknown }).__vm != null, undefined, { timeout: 10_000 });

      await page.evaluate(async () => {
        const vm = (window as unknown as { __vm: { get(id: number): unknown; spawn(id: number): unknown } }).__vm;
        const c = (vm.get(1) ?? vm.spawn(1)) as { loadDriverRoster: () => Promise<void>; pickDriver: (n: string) => void; openSession: (o: { driver: string }) => Promise<void>; sendTurn: (t: string) => Promise<void> };
        await c.loadDriverRoster();
        c.pickDriver("deterministic");
        await c.openSession({ driver: "deterministic" });
        await c.sendTurn("hey");
      });
      await page.waitForFunction(() => {
        const vm = (window as unknown as { __vm?: { get(id: number): { snapshot(): { parkReason?: unknown } } | null } }).__vm;
        return vm?.get(1)?.snapshot().parkReason != null;
      }, undefined, { timeout: 30_000 });
      await page.waitForTimeout(400);

      const snapshot = await page.evaluate(() => {
        const vm = (window as unknown as { __vm?: { get(id: number): { snapshot(): { transcript?: { role: string; text?: string }[] } } | null } }).__vm;
        const rows = vm?.get(1)?.snapshot().transcript ?? [];
        const modelRow = rows.find((r) => r.role === "model");
        return { modelText: modelRow?.text ?? null, rowCount: rows.length };
      });
      if (!snapshot.modelText) {
        defects.push({
          category: "model_reply_render_no_model_row",
          observed: `no model row in snapshot after park (${snapshot.rowCount} rows total)`,
          expected: "at least one model row with a non-empty text",
          reproduces: true,
          severity: "high",
        });
        return { emitted, defects };
      }

      const domResult = await page.evaluate((expected) => {
        const mount = document.querySelector<HTMLElement>('[data-vm-transcript-mount="terminal"][data-pane-id="1"]');
        const text = mount?.textContent ?? "";
        return { text, containsReply: text.includes(expected) };
      }, snapshot.modelText);

      if (!domResult.containsReply) {
        defects.push({
          category: "model_reply_render_text_missing",
          observed: `pane 1 DOM did not contain the model reply "${snapshot.modelText}"; visible text is "${domResult.text.slice(0, 200)}"`,
          expected: "the model reply text renders inside the pane",
          reproduces: true,
          severity: "high",
        });
      }

      // Guard against the specific jsx-runtime symptom: a rendered
      // paragraph whose only text content is the character "0". If
      // any paragraph inside the atom root has exactly that content,
      // the shim regressed to the createElement fallback signature.
      const zeroParagraphs = await page.evaluate(() => {
        const mount = document.querySelector<HTMLElement>('[data-vm-transcript-mount="terminal"][data-pane-id="1"]');
        if (!mount) return 0;
        const paragraphs = Array.from(mount.querySelectorAll("div")).filter((d) => {
          const style = d.getAttribute("style") || "";
          return style.includes("margin: 0px 0px 10px");
        });
        return paragraphs.filter((p) => (p.textContent || "").trim() === "0").length;
      });
      if (zeroParagraphs > 0) {
        defects.push({
          category: "model_reply_render_zero_paragraph",
          observed: `${zeroParagraphs} paragraph(s) rendered as literal "0" — jsx-runtime shim key/child signature mismatch`,
          expected: "paragraphs render their inline text, not the map index",
          reproduces: true,
          severity: "high",
        });
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
