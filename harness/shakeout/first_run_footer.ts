// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// First run and the footer (sprint 207; plan PLAN-2026-11-04-shell-to-react-r5.md, A9).
//
// Footer: no status and "unbound — pick a workspace" before a session; "● live" and "session <name>"
// after a turn; the records page's hint; "● finalised" after the session ends (open item 34, fixed
// in plan row B2, sprint 224). First run (?firstrun=1): a row per driver in the controller's roster,
// the template's texts ("s-1a04" in its top bar, "~/Documents/substrate · default · created on bind"
// as the workspace; restored in sprint 334), and a pick that closes it and fires DRIVER_PICKED.

import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

type Signal = { name: string; payload?: Record<string, unknown> };
const visible = (win: Page, sel: string) => win.locator(sel).filter({ visible: true }).first();
const signals = (win: Page) => win.evaluate(() => (window as unknown as { __vmSignals?: Signal[] }).__vmSignals ?? []);

/** The footer's three spans: status, record, hint. */
const footer = (win: Page) => win.evaluate(() => {
  const bar = document.querySelector("[data-footer]");
  return bar ? Array.from(bar.children).map((c) => (c.textContent ?? "").trim()) : [];
});

async function waitFooter(win: Page, want: (spans: string[]) => boolean, what: string): Promise<string[]> {
  const deadline = Date.now() + 10_000;
  let spans: string[] = [];
  while (Date.now() < deadline) {
    spans = await footer(win);
    if (want(spans)) return spans;
    await settled(win);
  }
  throw new Error(`footer: expected ${what}; reads ${JSON.stringify(spans)}`);
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const seen: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await visible(win, "input[data-ws-input]").waitFor({ timeout: 15_000 });

    const unbound = await waitFooter(win, (s) => s[0] === "" && s[1] === "unbound — pick a workspace" && s[2] === "⌘M toggles meta", "no status · unbound · the meta hint");
    seen.push(`unbound ${JSON.stringify(unbound)}`);

    await bindPaneAsUser(win, "deterministic");
    await visible(win, "textarea[data-input-bar]").fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    const crumb = (await visible(win, "[data-crumb]").innerText()).trim();
    const bound = await waitFooter(win, (s) => s[0] === "● live" && s[1] === `session ${crumb}`, `live · session ${crumb}`);
    seen.push(`after a turn ${JSON.stringify(bound)}`);

    await win.locator("[data-top-bar] span", { hasText: /^records$/ }).first().click();
    await waitFooter(win, (s) => s[2] === "esc back to session", "the records hint");
    await win.keyboard.press("Escape");
    await waitFooter(win, (s) => s[2] === "⌘M toggles meta", "the meta hint back after Escape");
    seen.push("records hint, and back");

    await visible(win, "textarea[data-input-bar]").fill("/");
    await visible(win, '[data-slash-row="/exit"]').click();
    await win.getByText("end session", { exact: true }).filter({ visible: true }).first().click();
    await win.waitForFunction(() => ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).some((s) => s.name === "SESSION_ENDED_LOCAL"), undefined, { timeout: 15_000 });
    // The end is complete when the controller has unbound the session (forceClose); read the footer then.
    await win.waitForFunction(() => (window as any).__vm?.get?.(1)?.snapshot().sessionId === null, undefined, { timeout: 15_000 });
    await settled(win);
    const ended = await waitFooter(win, (s) => s[0] === "● finalised" && s[1] === `session ${crumb}`, `finalised · session ${crumb}`);
    seen.push(`after the end ${JSON.stringify(ended)}`);

    // First run, as the pixel capture opens it: the same window with ?firstrun=1.
    const url = new URL(win.url());
    url.searchParams.set("firstrun", "1");
    await win.goto(url.toString());
    await waitForApp(win);
    await win.getByText("DRIVERS ON THIS MACHINE", { exact: true }).waitFor({ timeout: 10_000 });
    await win.waitForFunction(() => ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).some((s) => s.name === "DRIVER_ROSTER_LOADED"), undefined, { timeout: 15_000 });
    const roster: string[] = await win.evaluate(() => (window as any).__vm.snapshot().driverRoster);
    const rows = await win.evaluate(() => {
      const head = Array.from(document.querySelectorAll("div")).find((d) => d.textContent === "DRIVERS ON THIS MACHINE")!;
      const out: string[] = [];
      for (let el = head.nextElementSibling; el && el.textContent !== "WORKSPACE"; el = el.nextElementSibling) {
        const first = el.querySelector("span");
        if (first) out.push((first.textContent ?? "").trim());
      }
      return out;
    });
    // The list ends with the built-in deterministic driver whether or not the roster names it.
    if (rows[rows.length - 1] !== "deterministic") throw new Error(`first run's last row is not deterministic: ${JSON.stringify(rows)}`);
    const missing = roster.filter((d) => !rows.some((r) => r === d || r.endsWith(` · ${d}`) || r === `${d} (cli)`));
    if (missing.length) throw new Error(`first run lacks a row for ${missing.join(", ")}; rows ${JSON.stringify(rows)}`);
    seen.push(`first run rows ${JSON.stringify(rows)} for roster ${JSON.stringify(roster)}`);
    const shown = await win.evaluate(() => {
      const head = Array.from(document.querySelectorAll("div")).find((d) => d.textContent === "DRIVERS ON THIS MACHINE")!;
      return (head.closest("[style*='position: fixed']") as HTMLElement | null)?.innerText ?? "";
    });
    for (const text of ["s-1a04", "~/Documents/substrate", "default · created on bind"]) {
      if (!shown.includes(text)) throw new Error(`first run lacks the template's text ${text}`);
    }
    seen.push("first run shows the template's texts");

    const before = (await signals(win)).length;
    // The row in the first-run list; the window behind it has its own "deterministic" text.
    await win.getByText("DRIVERS ON THIS MACHINE", { exact: true }).locator("xpath=following-sibling::*").getByText("deterministic", { exact: true }).first().click();
    await win.getByText("DRIVERS ON THIS MACHINE", { exact: true }).waitFor({ state: "hidden", timeout: 5_000 });
    const picked = (await signals(win)).slice(before).find((s) => s.name === "DRIVER_PICKED");
    if (!picked || picked.payload?.driver !== "deterministic") throw new Error(`expected DRIVER_PICKED {driver: deterministic}; got ${JSON.stringify(picked ?? null)}`);
    const driver = await win.evaluate(() => (window as any).__vm.snapshot().driver);
    if (driver !== "deterministic") throw new Error(`the controller's driver is ${driver}`);
    seen.push("pick closes first run; DRIVER_PICKED deterministic");

    console.log(`first_run_footer: ok — ${seen.join("; ")}`);
    code = 0;
  } catch (e) {
    console.error(`first_run_footer: FAIL — ${(e as Error).message}; passed: ${seen.join("; ") || "none"}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
