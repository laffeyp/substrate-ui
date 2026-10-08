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
 * SHAKEOUT_APP=<Substrate.app> runs the packaged bundle. */
export function launchArgs(): Launch {
  const dir = scratchDir("electron-shakeout-");
  const state = scratchDir("electron-shakeout-state-");
  const env = { ...process.env, SUBSTRATE_HOME: state } as Record<string, string>;
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
 * first row, the per-session sandbox. Resolves once the chat prompt is visible. */
export async function bindPaneAsUser(win: Page): Promise<void> {
  const path = win.locator('input[placeholder^="type a path"]').first();
  await path.waitFor({ state: "visible", timeout: 15_000 });
  await path.click();
  await win.keyboard.press("Enter");
  await win.locator('[placeholder^="type to talk"]').first().waitFor({ state: "visible", timeout: 15_000 });
}

/** The controller signals the renderer emitted so far, in order. */
export async function observedSignals(win: Page): Promise<EmittedRecord[]> {
  return win.evaluate(() => {
    const buf = (window as unknown as { __vmSignals?: { name: string; payload: Record<string, unknown> }[] }).__vmSignals ?? [];
    return buf.map((s) => ({ tag: s.name, payload: s.payload }));
  });
}
