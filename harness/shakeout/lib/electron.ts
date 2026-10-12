// Electron helpers for the gates. One copy of the launch options, the pane binding a user does,
// and the controller signals the app actually emitted (window.__vmSignals, web/vm/instrumentation/sdd.ts).

import { rmSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "playwright";
import type { EmittedRecord } from "./flow";
import { scratchDir } from "./scratch";

const REPO_ROOT = join(__dirname, "..", "..", "..");

export interface Launch {
  options: { args: string[]; env: Record<string, string>; executablePath?: string };
  state: string;
  cleanup: () => void;
}

/** Each launch gets its own user-data dir (Electron's single-instance lock keys on it) and its own
 * state root (SUBSTRATE_HOME), so a gate never touches the user's app or ~/.substrate.
 * The model roster is isolated the same way: by default Ollama points at a closed port and no CLI
 * is discovered, so the bar offers its one fallback row, `deterministic`, on every machine and every
 * launch. A gate that needs this machine's real models passes `{ roster: "live" }`.
 * SHAKEOUT_APP=<Substrate.app> runs the packaged bundle. */
export function launchArgs(opts: { roster?: "offline" | "live" } = {}): Launch {
  const dir = scratchDir("electron-shakeout-");
  const state = scratchDir("electron-shakeout-state-");
  const env = { ...process.env, SUBSTRATE_HOME: state } as Record<string, string>;
  if ((opts.roster ?? "offline") === "offline") {
    env.OLLAMA_BASE_URL = "http://127.0.0.1:9";
    env.SUBSTRATE_CLI_ADAPTERS = "";
  }
  const app = process.env.SHAKEOUT_APP || "";
  return {
    options: app
      ? { executablePath: join(app, "Contents", "MacOS", "Substrate"), args: ["--user-data-dir=" + dir], env }
      : { args: [REPO_ROOT, "--user-data-dir=" + dir], env },
    state,
    cleanup: () => {
      for (const d of [dir, state]) {
        try { rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ }
      }
    },
  };
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
  await row.click();
  // UI sprint 132: the guidance line under the model column opens next; `auto` leaves the level to
  // the model, and picking it starts the session.
  await win.locator('[data-guidance-half] [data-guidance-row="auto"][data-lit="1"]').first().waitFor({ state: "visible", timeout: 15_000 });
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
