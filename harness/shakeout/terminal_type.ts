// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The terminal window's typography panel (sprint 539; roadmap 2026-11-17-daily-driver-fixes;
// DESIGN-2026-11-21-terminal-typography-r1). Settings (⌘,) gains a "Terminal type" section with a
// control per parameter; each writes a `--term-*` CSS variable the transcript reads, and clearing a
// control falls back to today's value (the standing appearance rule: an option beside the default).
//
// One deterministic session draws a real model reply into the transcript. The gate reads three things,
// each against the live transcript container ([data-vm-transcript-scroller="1"]) and three probe spans
// it appends inside it — the probes carry the exact style strings the body text, headings/bold and
// paragraph blocks read (`var(--term-brightness, …)`, `var(--term-emphasis-value, #cdd1d7)`,
// `margin-bottom: var(--term-paragraph, 10px)`), so they resolve each per-element variable exactly as
// Row.tsx, markdown.ts and ModelReply.tsx do:
//   default — no `--term-*` variable is set and the container draws today's values (13px, weight 400,
//             left, letter/word spacing normal), so the appearance is byte-identical;
//   set     — moving each control sets its variable and the matching computed property follows (size,
//             leading, tracking, word spacing, alignment, weight on the container; brightness, emphasis,
//             paragraph on the probes);
//   reset   — every variable clears and every computed value returns to the default it had;
//   dense   — the preset sets tight leading and negative tracking at once.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import type { Page } from "playwright";
import { launchArgs, settled, waitForApp } from "./lib/electron";

type Read = {
  fontSize: string; lineHeight: string; letterSpacing: string; wordSpacing: string; textAlign: string; fontWeight: string;
  vSize: string; vLeading: string; vTracking: string; vWord: string; vAlign: string; vWeight: string;
  vBrightness: string; vEmphasis: string; vParagraph: string;
  brightness: string; emphasis: string; paragraph: string;
};

/** Read the container's computed typography, every `--term-*` variable, and the three probes' resolved
 *  per-element values. */
async function readAll(win: Page): Promise<Read> {
  // The body avoids inner function declarations: tsx wraps a named arrow in a `__name` helper the page
  // lacks (lib/electron.ts bindPaneAsUser notes the same).
  return win.evaluate(() => {
    const sc = document.querySelector('[data-vm-transcript-scroller="1"]') as HTMLElement;
    const cs = getComputedStyle(sc);
    const st = sc.style;
    const bp = document.querySelector('[data-term-probe="brightness"]') as HTMLElement;
    const ep = document.querySelector('[data-term-probe="emphasis"]') as HTMLElement;
    const pp = document.querySelector('[data-term-probe="paragraph"]') as HTMLElement;
    return {
      fontSize: cs.fontSize, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, wordSpacing: cs.wordSpacing, textAlign: cs.textAlign, fontWeight: cs.fontWeight,
      vSize: st.getPropertyValue("--term-size").trim(), vLeading: st.getPropertyValue("--term-leading").trim(), vTracking: st.getPropertyValue("--term-tracking").trim(), vWord: st.getPropertyValue("--term-word-spacing").trim(), vAlign: st.getPropertyValue("--term-align").trim(), vWeight: st.getPropertyValue("--term-weight").trim(),
      vBrightness: st.getPropertyValue("--term-brightness").trim(), vEmphasis: st.getPropertyValue("--term-emphasis-value").trim(), vParagraph: st.getPropertyValue("--term-paragraph").trim(),
      brightness: getComputedStyle(bp).color,
      emphasis: getComputedStyle(ep).color,
      paragraph: getComputedStyle(pp).marginBottom,
    };
  });
}

/** Set a range control the React-compatible way (native value setter, then an input event). */
async function slide(win: Page, key: string, value: number): Promise<void> {
  await win.evaluate(({ key, value }) => {
    const el = document.querySelector(`[data-term-control="${key}"]`) as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    setter.call(el, String(value));
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, { key, value });
}

async function main(): Promise<void> {
  const ws = mkdtempSync(join(tmpdir(), "term-type-"));
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const errs: string[] = [];
  const seen: string[] = [];
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    const base = `http://127.0.0.1:${new URL(win.url()).port}`;
    const post = (path: string, body: unknown) => fetch(base + path, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const { session_id: sid } = await (await post("/api/session", { driver: "deterministic", workspace: ws })).json() as { session_id: string };
    await win.evaluate(`(function () { var vm = window.__vm; return (vm.get(1) || vm.spawn(1)).attachExisting(${JSON.stringify(sid)}); })()`);
    await win.waitForFunction(`window.__vm.get(1).snapshot().sessionId === ${JSON.stringify(sid)}`, undefined, { timeout: 15_000 });
    await win.evaluate("window.__noTranscriptWindowing = true");
    const r = await post(`/api/session/${sid}/turn`, { text: "hello" });
    if (!r.ok) throw new Error(`turn: HTTP ${r.status}`);
    await win.waitForFunction("window.__vm.get(1).snapshot().transcript.some((x) => x.role === 'model')", undefined, { timeout: 60_000 });
    await settled(win);

    // Three probes inside the live container, each carrying the exact style string its real element
    // reads. The blocks are unrolled to avoid an inner function literal (the `__name` trap above).
    await win.evaluate(() => {
      const sc = document.querySelector('[data-vm-transcript-scroller="1"]') as HTMLElement;
      const b = document.createElement("span");
      b.setAttribute("data-term-probe", "brightness");
      b.style.color = "var(--term-brightness, var(--transcript-reply, #b9bec5))";
      b.textContent = "brightness";
      sc.appendChild(b);
      const e = document.createElement("span");
      e.setAttribute("data-term-probe", "emphasis");
      e.style.color = "var(--term-emphasis-value, #cdd1d7)";
      e.textContent = "emphasis";
      sc.appendChild(e);
      const p = document.createElement("span");
      p.setAttribute("data-term-probe", "paragraph");
      p.style.marginBottom = "var(--term-paragraph, 10px)";
      p.textContent = "paragraph";
      sc.appendChild(p);
    });

    // Default: no variable set; the container draws today's values.
    const def = await readAll(win);
    const emptyVars = (r: Read) => [r.vSize, r.vLeading, r.vParagraph, r.vTracking, r.vWord, r.vAlign, r.vWeight, r.vBrightness, r.vEmphasis].every((x) => x === "");
    if (!emptyVars(def)) errs.push(`default sets a --term-* variable: ${JSON.stringify(def)}`);
    if (def.fontSize !== "13px") errs.push(`default font-size ${def.fontSize}, want 13px`);
    if (def.fontWeight !== "400") errs.push(`default font-weight ${def.fontWeight}, want 400`);
    if (def.textAlign !== "left") errs.push(`default text-align ${def.textAlign}, want left`);
    // letter/word-spacing `normal` serialise to "normal" or "0px" per browser; the strong default proof
    // is that no --term-* variable is emitted (above) and that reset returns to these captured values.
    if (def.paragraph !== "10px") errs.push(`default paragraph margin ${def.paragraph}, want 10px`);
    seen.push(`default: no --term-* set, ${def.fontSize}/${def.fontWeight}/${def.textAlign}, paragraph ${def.paragraph}, body ${def.brightness}, emphasis ${def.emphasis}`);

    // Move every control off its default.
    await win.keyboard.press("Meta+,");
    await win.locator('[data-settings-section="terminal-type"]').waitFor({ state: "visible", timeout: 5_000 });
    await slide(win, "size", 18);
    await slide(win, "leading", 2.2);
    await slide(win, "paragraph", 20);
    await slide(win, "tracking", 0.12);
    await slide(win, "wordSpacing", 0.6);
    await slide(win, "weight", 700);
    await slide(win, "brightness", 92);
    await slide(win, "emphasis", 96);
    await win.locator('[data-term-align="center"]').click();
    await settled(win);
    const set = await readAll(win);
    // The variables carry the picks.
    const wantVars: [keyof Read, string][] = [["vSize", "18px"], ["vLeading", "2.2"], ["vParagraph", "20px"], ["vTracking", "0.12em"], ["vWord", "0.6em"], ["vAlign", "center"], ["vWeight", "700"]];
    for (const [k, want] of wantVars) if (set[k] !== want) errs.push(`${k} ${set[k]}, want ${want}`);
    if (!set.vBrightness.startsWith("oklch")) errs.push(`--term-brightness ${set.vBrightness}`);
    if (!set.vEmphasis.startsWith("oklch")) errs.push(`--term-emphasis-value ${set.vEmphasis}`);
    // The rendered text follows.
    if (set.fontSize !== "18px") errs.push(`font-size followed to ${set.fontSize}, want 18px`);
    if (set.textAlign !== "center") errs.push(`text-align followed to ${set.textAlign}, want center`);
    if (set.fontWeight !== "700") errs.push(`font-weight followed to ${set.fontWeight}, want 700`);
    if (set.letterSpacing === def.letterSpacing) errs.push(`letter-spacing did not follow tracking (${set.letterSpacing})`);
    if (set.wordSpacing === def.wordSpacing) errs.push(`word-spacing did not follow (${set.wordSpacing})`);
    if (parseFloat(set.lineHeight) <= parseFloat(def.lineHeight)) errs.push(`line-height ${set.lineHeight} did not grow past ${def.lineHeight}`);
    if (set.paragraph !== "20px") errs.push(`paragraph margin followed to ${set.paragraph}, want 20px`);
    if (set.brightness === def.brightness) errs.push("body brightness did not change");
    if (set.emphasis === def.emphasis) errs.push("emphasis did not change");
    seen.push(`set: ${set.fontSize}/${set.fontWeight}/${set.textAlign}, tracking ${set.letterSpacing}, paragraph ${set.paragraph}, body ${set.brightness}, emphasis ${set.emphasis}`);

    // Reset: every variable clears, every computed value returns to the default.
    await win.locator("[data-term-reset]").click();
    await settled(win);
    const reset = await readAll(win);
    if (!emptyVars(reset)) errs.push(`reset left a --term-* variable: ${JSON.stringify(reset)}`);
    for (const k of ["fontSize", "letterSpacing", "wordSpacing", "textAlign", "fontWeight", "brightness", "emphasis", "paragraph"] as (keyof Read)[]) {
      if (reset[k] !== def[k]) errs.push(`reset ${k} ${reset[k]}, want ${def[k]}`);
    }
    seen.push(`reset: no --term-* set, back to ${reset.fontSize}/${reset.fontWeight}/${reset.textAlign}`);

    // Dense preset: tight leading and negative tracking at once.
    await win.locator('[data-term-preset="dense"]').click();
    await settled(win);
    const dense = await readAll(win);
    if (dense.vLeading !== "1.2") errs.push(`dense leading ${dense.vLeading}, want 1.2`);
    if (dense.vTracking !== "-0.02em") errs.push(`dense tracking ${dense.vTracking}, want -0.02em`);
    seen.push(`dense: leading ${dense.vLeading}, tracking ${dense.vTracking}`);
    await win.keyboard.press("Escape");

    if (errs.length) throw new Error(errs.join("; "));
    console.log(`terminal_type: ok — ${seen.join("; ")}; packaged=${String(!!process.env.SHAKEOUT_APP)}`);
    code = 0;
  } catch (e) {
    console.error(`terminal_type: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
