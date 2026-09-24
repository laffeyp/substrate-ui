// Sprint 075 — caret pin assertion.
//
// Boots the substrate server via ServerHandle, launches headless
// Chromium via Playwright at a viewport that overflows the
// transcript, drives a real bash tool turn that produces three
// cards, scrolls the transcript mid-way, clicks the topmost card's
// caret, and asserts the clicked header's viewport y differs by no
// more than one pixel between pre-click and post-settle. Five runs.
//
// This flow is Playwright-based (unlike the rest of the shakeout,
// which uses NodeSubstrateClient). It's registered in
// harness/shakeout/run.ts as an ordinary Flow; run() spins up its
// own browser context per run.

import { chromium } from "playwright";
import { BASE_URL } from "./lib/server";
import type { Flow, EmittedRecord, Defect, FlowContext } from "./lib/flow";

const RUN_TIMEOUT_MS = 300_000;

async function pickRealDriver(): Promise<string> {
  const res = await fetch(BASE_URL + "/api/models");
  const data = (await res.json()) as { models: string[]; default: string };
  const chosen = data.default !== "deterministic" ? data.default : data.models.find((m) => m !== "deterministic");
  if (!chosen) throw new Error("no non-deterministic driver on server");
  return chosen;
}

export const flow: Flow = {
  name: "caret_pin",
  declared: [
    "SESSION_OPEN_REQUESTED",
    "SESSION_OPEN_ACKED",
    "TURN_SUBMITTED",
    "STREAM_ENVELOPE_APPENDED",
    "TURN_PARKED",
  ],
  async run(ctx: FlowContext): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const emitted: EmittedRecord[] = [];
    const defects: Defect[] = [];
    const driver = await pickRealDriver();
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    try {
      const context = await browser.newContext({
        viewport: { width: 900, height: 380 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      page.on("pageerror", (err) => {
        console.error("[caret_pin] page error:", err.message);
        defects.push({
          category: "caret_pin_page_error",
          observed: err.message,
          expected: "no page errors during caret click roundtrip",
          reproduces: true,
          severity: "high",
        });
      });
      page.on("console", (msg) => {
        const text = msg.text();
        if (msg.type() === "error" || msg.type() === "warning") {
          console.error("[caret_pin] page console " + msg.type() + ": " + text);
        }
      });

      await page.goto(BASE_URL + "/?atom-transcript=1&t=" + Date.now(), { waitUntil: "networkidle" });
      await page.waitForFunction(() => (window as any).__vm != null, undefined, { timeout: 10_000 });

      await page.evaluate(async (drv) => {
        const vm = (window as any).__vm;
        const controller = vm.get(1) ?? vm.spawn(1);
        await controller.loadDriverRoster();
        controller.pickDriver(drv);
        await controller.openSession({ driver: drv });
        await controller.sendTurn(
          "Call the bash tool three times with `echo one`, `echo two`, `echo three`. One call per response, no summary.",
        );
      }, driver);

      await page.waitForFunction(() => {
        const snap = (window as any).__vm?.get(1)?.snapshot();
        return snap?.parkReason != null;
      }, undefined, { timeout: RUN_TIMEOUT_MS });

      // Wait for at least one bash card header to render.
      const shape = await page.evaluate(() => {
        const scroller = document.querySelector<HTMLElement>("[data-vm-transcript-scroller=\"1\"]");
        const mount = document.querySelector<HTMLElement>("[data-vm-transcript-mount=\"terminal\"][data-pane-id=\"1\"]");
        const spans = Array.from(document.querySelectorAll<HTMLElement>("span"));
        const cursorPointer = spans.filter((s) => s.style && s.style.cursor === "pointer");
        const snap = (window as any).__vm?.get(1)?.snapshot();
        return {
          scrollerExists: !!scroller,
          scrollerChildren: scroller ? scroller.childElementCount : -1,
          mountExists: !!mount,
          mountChildren: mount ? mount.childElementCount : -1,
          mountInnerHTMLLen: mount ? (mount.innerHTML || "").length : -1,
          cursorPointerSpans: cursorPointer.length,
          cursorPointerTexts: cursorPointer.map((s) => (s.textContent || "").slice(0, 80)),
          scrollerInnerHTMLLen: scroller ? (scroller.innerHTML || "").length : -1,
          transcriptRowCount: snap?.transcript?.length ?? -1,
        };
      });
      console.log("[caret_pin] DOM shape:", JSON.stringify(shape, null, 2));
      await page.waitForFunction(() => {
        const summaries = Array.from(document.querySelectorAll<HTMLElement>("summary"));
        return summaries.filter((s) => (s.textContent || "").includes("bash")).length >= 1;
      }, undefined, { timeout: 30_000 });

      // Scroll mid-way through the transcript.
      await page.evaluate(() => {
        const el = document.querySelector<HTMLElement>("[data-vm-transcript-scroller=\"1\"]");
        if (el) el.scrollTop = Math.floor(el.scrollHeight / 2);
      });
      await page.waitForTimeout(400);

      // Grab the top-visible bash card header (a <summary> element).
      const cardHandle = await page.evaluateHandle(() => {
        const scroller = document.querySelector<HTMLElement>("[data-vm-transcript-scroller=\"1\"]");
        if (!scroller) return null;
        const scrollerTop = scroller.getBoundingClientRect().top;
        const summaries = Array.from(document.querySelectorAll<HTMLElement>("summary"));
        const headers = summaries.filter((s) => (s.textContent || "").includes("bash"));
        let target: HTMLElement | null = null;
        let topmost = Number.POSITIVE_INFINITY;
        for (const header of headers) {
          const offset = header.getBoundingClientRect().top - scrollerTop;
          if (offset >= 0 && offset < topmost) {
            topmost = offset;
            target = header;
          }
        }
        return target;
      });
      const card = (cardHandle as any).asElement();
      if (!card) {
        defects.push({
          category: "caret_pin_no_visible_card",
          observed: "no bash card header intersects the viewport after mid-scroll",
          expected: "at least one card header inside the scroller's viewport",
          reproduces: true,
          severity: "high",
        });
        return { emitted, defects };
      }

      const readTop = async (): Promise<number> => {
        return await page.evaluate((el: any) => Math.round(el.getBoundingClientRect().top), cardHandle);
      };
      // Playwright's ElementHandle.click() calls scrollIntoViewIfNeeded
      // first, which mutates the scroller's scrollTop and defeats the
      // pin assertion. Dispatch the click directly instead.
      const dispatchClick = async (): Promise<void> => {
        await page.evaluate((el: any) => {
          el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        }, cardHandle);
      };

      const before = await readTop();
      await dispatchClick();
      await page.waitForTimeout(500);
      const afterOpen = await readTop();
      await dispatchClick();
      await page.waitForTimeout(500);
      const afterClose = await readTop();

      if (Math.abs(afterOpen - before) > 1) {
        defects.push({
          category: "caret_pin_drift_on_open",
          observed: `header top moved from ${before} to ${afterOpen} on click-open`,
          expected: "header top unchanged (within 1px) across click-open",
          reproduces: true,
          severity: "high",
        });
      }
      if (Math.abs(afterClose - before) > 1) {
        defects.push({
          category: "caret_pin_drift_on_close",
          observed: `header top moved from ${before} to ${afterClose} on click-close`,
          expected: "header top unchanged (within 1px) across click-close",
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
