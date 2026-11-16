// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A live `claude` reply with fenced code (sprint 512). The live roster, this machine's Claude Code. One turn asks for a
// Python function and a shell command, each in its own fenced block, with no tools. These agree: the reply holds a
// python and a sh/bash block, each closed and parsed (data-tool-lang Python, Shell) with colour tokens; the screenshot
// is kept for reading. SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

const REPO = join(__dirname, "..", "..");
const ASK = "Use no tools. Reply with a Python function that reverses the words of a sentence, in a ```python fenced block, then a shell one-liner that counts lines in every .py file under the current folder, in a ```sh fenced block. One sentence of prose before each block.";

async function main(): Promise<void> {
  const launch = launchArgs({ roster: "live" });
  const shots = join(REPO, "runs", "packaged", `sprint-512-claude-${process.env.SHAKEOUT_APP ? "bundle" : "source"}-${Date.now()}`);
  mkdirSync(shots, { recursive: true });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await bindPaneAsUser(win, "claude", { folder: mkdtempSync(join(tmpdir(), "reply-claude-")) });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill(ASK);
    await win.keyboard.press("Enter");
    const t0 = Date.now();
    await win.waitForFunction("(window.__vm.get(1).snapshot().rawEnvelopes || []).some(function (e) { return e.kind === 'Returned'; })", undefined, { timeout: 300_000, polling: 1000 });
    await win.waitForFunction(() => document.querySelectorAll('[data-reply-code][data-tool-lang]:not([data-tool-lang=""])').length >= 2, undefined, { timeout: 20_000 }).catch(() => undefined);
    await settled(win);
    const blocks = await win.locator("[data-reply-code]").evaluateAll((els) => els.map((e) => `${e.getAttribute("data-reply-code")}:${e.getAttribute("data-closed")}:${e.getAttribute("data-tool-lang")}:${e.querySelectorAll("[data-tk]").length}`));
    const last = win.locator("[data-reply-code]").last();
    if (await last.count()) { await last.scrollIntoViewIfNeeded(); await win.screenshot({ path: join(shots, "reply.png") }); }
    await app.close();
    const py = blocks.find((b) => b.startsWith("python:1:Python:")), sh = blocks.find((b) => /^(sh|bash|shell|zsh):1:Shell:/.test(b));
    if (!py || !sh || Number(py.split(":")[3]) < 5 || Number(sh.split(":")[3]) < 2) throw new Error(`blocks ${JSON.stringify(blocks)}`);
    console.log(`reply_code_claude: ok — reply in ${Math.round((Date.now() - t0) / 1000)} s; blocks ${JSON.stringify(blocks)}; packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshot ${shots}/reply.png`);
    code = 0;
  } catch (e) {
    console.error(`reply_code_claude: FAIL — ${(e as Error).message.split("\n")[0]}; screenshots ${shots}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
