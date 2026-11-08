// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Electron helpers for the gates. One copy of the launch options, the pane binding a user does,
// and the controller signals the app actually emitted (window.__vmSignals, web/vm/instrumentation/sdd.ts).

import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "playwright";
import type { EmittedRecord } from "./flow";
import { scratchDir } from "./scratch";

const REPO_ROOT = join(__dirname, "..", "..", "..");

export interface Launch {
  options: { args: string[]; env: Record<string, string>; executablePath?: string; bypassCSP: boolean };
  state: string;
  cleanup: () => void;
}

/** Each launch gets its own user-data dir (Electron's single-instance lock keys on it) and its own
 * state root (SUBSTRATE_HOME), so a gate never touches the user's app or ~/.substrate.
 * The model roster is isolated the same way: by default Ollama points at a closed port and no CLI
 * is discovered, so the bar offers its one fallback row, `deterministic`, on every machine and every
 * launch. A gate that needs this machine's real models passes `{ roster: "live" }`.
 * SHAKEOUT_APP=<Substrate.app> runs the packaged bundle. */
/** `csp`: the page's Content-Security-Policy (web/reveal.html, sprint 332) forbids evaluating strings
 *  as script, which is how Playwright runs a gate's string predicates (`waitForFunction("...")`), so
 *  gates run with Playwright's bypass by default. `harness/shakeout/csp_holds.ts` asks for "enforce"
 *  and checks the policy itself. */
/** `plantsBreaks`: the launch plants rule breaks on purpose (harness/shakeout/invariant_signals.ts).
 *  Every other launch fails its gate at cleanup when main.jsonl holds an INVARIANT_BROKEN: the app broke
 *  a rule of its own vocabulary while the gate drove it (plan 2026-11-05-sdd-signals item 7, sprint 380). */
export function launchArgs(opts: { roster?: "offline" | "live"; csp?: "bypass" | "enforce"; plantsBreaks?: boolean } = {}): Launch {
  const dir = scratchDir("electron-shakeout-");
  const state = scratchDir("electron-shakeout-state-");
  const env = { ...process.env, SUBSTRATE_HOME: state } as Record<string, string>;
  if ((opts.roster ?? "offline") === "offline") {
    env.OLLAMA_BASE_URL = "http://127.0.0.1:9";
    env.SUBSTRATE_CLI_ADAPTERS = "";
  }
  const app = process.env.SHAKEOUT_APP || "";
  const bypassCSP = (opts.csp ?? "bypass") === "bypass";
  return {
    options: app
      ? { executablePath: join(app, "Contents", "MacOS", "Substrate"), args: ["--user-data-dir=" + dir], env, bypassCSP }
      : { args: [REPO_ROOT, "--user-data-dir=" + dir], env, bypassCSP },
    state,
    cleanup: () => {
      const broken = opts.plantsBreaks ? [] : brokenRules(state);
      for (const d of [dir, state]) {
        try { rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ }
      }
      if (broken.length) {
        console.error(`FAIL — the app emitted ${broken.length} INVARIANT_BROKEN: ${broken.join("; ")}`);
        process.exit(1);
      }
    },
  };
}

/** Every INVARIANT_BROKEN in a launch's main.jsonl files, as "rule state" lines. */
function brokenRules(state: string): string[] {
  const traces = join(state, "electron", "logs", "traces");
  if (!existsSync(traces)) return [];
  const out: string[] = [];
  for (const boot of readdirSync(traces)) {
    const file = join(traces, boot, "main.jsonl");
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      if (!line.includes('"INVARIANT_BROKEN"')) continue;
      const p = (JSON.parse(line) as { payload: { rule: string; context: { state: unknown } } }).payload;
      out.push(`${p.rule} ${JSON.stringify(p.context.state).slice(0, 300)}`);
    }
  }
  return out;
}

/** A window's records from the launch's latest boot (sprint 360). Read after the app has closed, so
 *  the file is complete. */
export interface WindowRecord { proc_seq: number; pane_id: number | null; name: string; payload: Record<string, unknown> }
export function windowRecords(launch: Launch, windowId = 1): WindowRecord[] {
  const traces = join(launch.state, "electron", "logs", "traces");
  const boot = readdirSync(traces).sort().pop()!;
  return readFileSync(join(traces, boot, `window-${windowId}.jsonl`), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as WindowRecord);
}


/** Wait until the shell's view-model is up. */
export async function waitForApp(win: Page, timeout = 30_000): Promise<void> {
  await win.waitForFunction(() => (window as unknown as { __vm?: unknown }).__vm != null, undefined, { timeout });
}

/** Bind the focused unbound pane the way a first-run user does: Enter in the path input picks the
 * first row, the per-session sandbox, and arms the bar's model half (UI sprint 124). The model
 * groups start folded (UI sprint 128), so the user opens them and clicks a model: `model`, or the
 * roster's default (`deterministic` on an offline roster). Resolves once the chat prompt is visible. */
export async function bindPaneAsUser(win: Page, model?: string, opts: { folder?: string } = {}): Promise<void> {
  const path = win.locator('input[data-ws-input]').first();
  await path.waitFor({ state: "visible", timeout: 15_000 });
  await path.click();
  // A typed folder becomes the first row, and ↵ picks it.
  if (opts.folder) await path.fill(opts.folder);
  await win.keyboard.press("Enter");
  await win.locator('[data-model-half][data-armed="1"]').first().waitFor({ state: "visible", timeout: 15_000 });
  // The roster's default, once the roster has loaded; an offline roster has none, and its one row
  // is `deterministic`.
  const target = model ?? await win.waitForFunction(
    () => {
      const w = window as unknown as { __vm?: { snapshot(): { driverDefault: string | null } }; __vmSignals?: { name: string }[] };
      if (!(w.__vmSignals ?? []).some((s) => s.name === "DRIVER_ROSTER_LOADED")) return null;
      return w.__vm?.snapshot().driverDefault ?? "deterministic";
    },
    undefined,
    { timeout: 15_000 },
  ).then((h) => h.jsonValue() as Promise<string>);
  const row = win.locator(`[data-model-row="${target}"] > span`).first();
  for (const group of ["cli agents", "ollama · cloud", "ollama · local"]) {
    if (await row.isVisible()) break;
    const header = win.locator(`[data-model-row="${group}"] > span`).first();
    if (await header.isVisible()) await header.click();
  }
  // Diagnosis (sprint 335): mark the page, and record where the click lands and when the folder's
  // armed flag changes, so a miss says whether the page reloaded or what took the click.
  // A plain string: tsx wraps named functions in a `__name` helper the page lacks.
  await win.evaluate(`(() => {
    window.__bindMark = Date.now(); window.__bindLog = [];
    var say = function (s) { window.__bindLog.push(Math.round(performance.now()) + " " + s); };
    var label = function (el) { var out = []; for (var e = el, k = 0; e && k < 4; e = e.parentElement, k++) out.push(e.tagName + (e.getAttribute("data-model-row") ? "[model=" + e.getAttribute("data-model-row") + "]" : "") + (e.hasAttribute("data-ws-scroll") ? "[ws-scroll]" : "") + (e.hasAttribute("data-model-half") ? "[model-half]" : "")); return out.join("<"); };
    ["mousedown", "mouseup", "click"].forEach(function (t) { document.addEventListener(t, function (ev) { say(t + " " + label(ev.target)); }, true); });
    var half = document.querySelector("[data-model-half]");
    if (half) new MutationObserver(function () { say("armed=" + half.getAttribute("data-armed")); }).observe(half, { attributes: true, attributeFilter: ["data-armed"] });
    say("armed=" + (half && half.getAttribute("data-armed")));
  })()`);
  await row.click();
  // UI sprint 132: the guidance line under the model column opens next; `auto` leaves the level to
  // the model, and picking it starts the session. On a miss the error names the picker's state.
  await win.locator('[data-guidance-half] [data-guidance-row="auto"][data-lit="1"]').first().waitFor({ state: "visible", timeout: 15_000 })
    .catch(async (err: Error) => {
      const state = await win.evaluate(() => ({
        placeholder: (document.querySelector("input[data-ws-input]") as HTMLInputElement | null)?.placeholder ?? null,
        armed: document.querySelector("[data-model-half]")?.getAttribute("data-armed") ?? null,
        modelRows: Array.from(document.querySelectorAll("[data-model-row]")).map((e) => `${e.getAttribute("data-model-row")}:${e.getAttribute("data-lit")}`),
        guidance: Array.from(document.querySelectorAll("[data-guidance-row]")).map((e) => `${e.getAttribute("data-guidance-row")}:${e.getAttribute("data-lit")}`),
        driver: (window as unknown as { __vm?: { snapshot(): { driver: string | null } } }).__vm?.snapshot().driver ?? null,
        signals: ((window as unknown as { __vmSignals?: { name: string }[] }).__vmSignals ?? []).map((x) => x.name).join(" "),
        sameLoad: typeof (window as unknown as { __bindMark?: number }).__bindMark === "number",
        log: (window as unknown as { __bindLog?: string[] }).__bindLog ?? null,
      })).catch(() => null);
      throw new Error(`${err.message.split("\n")[0]}; after clicking model row ${target}: ${JSON.stringify(state)}`);
    });
  await win.locator('[data-guidance-row="auto"]').first().click();
  // UI sprint 143: LENGTH and TONE follow; the defaults (normal, neutral) write no text, and the
  // tone pick starts the session.
  await win.locator('[data-length-half] [data-length-row="normal"][data-lit="1"]').first().waitFor({ state: "visible", timeout: 15_000 });
  await win.locator('[data-length-row="normal"]').first().click();
  await win.locator('[data-tone-half] [data-tone-row="neutral"][data-lit="1"]').first().waitFor({ state: "visible", timeout: 15_000 });
  await win.locator('[data-tone-row="neutral"]').first().click();
  await win.locator('[data-input-bar]').first().waitFor({ state: "visible", timeout: 15_000 });
}

/** After a window reload, wait for pane 1 to reattach `sessionId` by itself. The window keeps the
 * focused pane's session in the URL (`?session=`), and a reload reattaches it: the user's resume
 * path, so a gate checks that path instead of rebinding the pane by hand. */
export async function waitForReattached(win: Page, sessionId: string): Promise<void> {
  await win.waitForFunction(
    (id) => {
      const vm = (window as unknown as { __vm?: { get(n: number): { snapshot(): { sessionId: string | null } } | null } }).__vm;
      return vm?.get(1)?.snapshot().sessionId === id;
    },
    sessionId,
    { timeout: 15_000 },
  );
}

/** The controller signals the renderer emitted so far, in order. */
export async function observedSignals(win: Page): Promise<EmittedRecord[]> {
  return win.evaluate(() => {
    const buf = (window as unknown as { __vmSignals?: { name: string; payload: Record<string, unknown> }[] }).__vmSignals ?? [];
    return buf.map((s) => ({ tag: s.name, payload: s.payload }));
  });
}

/** Resolve once the page has drawn a frame after the current one (UI sprint 162). A key handler
 * that sets state is drawn by the next frame; a fixed sleep read state before the draw when the
 * machine was busy (left_folds_workspace read the folder row still lit after ↓). */
export async function settled(win: Page): Promise<void> {
  await win.evaluate("new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))))");
}
