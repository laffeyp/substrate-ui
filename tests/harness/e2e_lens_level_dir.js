// tests/harness/e2e_lens_level_dir.js — Sprint 018.
// Binds a session, opens reveal, clicks the level chip and the dir
// chip. Each click emits STREAM_LEVEL_TOGGLED or STREAM_DIR_TOGGLED
// with the ratified Layer 2 payload {pane_id, from, to}. Perceptual:
// the anchor-pane-<id>-level byte flips 0→255 on level=app; the
// anchor-pane-<id>-dir byte flips 0→255 on dir=side (Layer 7 § pixel
// anchor encoding). Toggle twice per chip → alternation from=previous.to.

"use strict";
const path = require("node:path");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const { screenshotAnchorByte } = require("./lib/anchor");
const {
  bindWorkspaceOrFixture, waitForFirstPane, cleanupSession, rmWorkspace,
} = require("./lib/session");

let sid = null, workspace = null;
process.on("exit", () => { cleanupSession(sid); if (workspace) rmWorkspace(workspace); });

runHarness("e2e_lens_level_dir", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  ({ sid, workspace } = await bindWorkspaceOrFixture(win, paneId, "lens-level-dir"));
  check(!!sid, `session bound (session_id=${sid})`);

  await win.locator(`[data-testid="pane-reveal-toggle-${paneId}"]`).click();
  await new Promise((r) => setTimeout(r, 200));
  const shell = win.locator(`[data-testid="reveal-shell-${paneId}"]`);
  await shell.waitFor({ state: "attached", timeout: 3000 });

  const levelChip = win.locator(`[data-testid="stream-level-toggle-${paneId}"]`);
  const dirChip   = win.locator(`[data-testid="stream-dir-toggle-${paneId}"]`);
  await levelChip.waitFor({ state: "attached", timeout: 3000 });
  await dirChip.waitFor({ state: "attached", timeout: 3000 });

  check((await shell.getAttribute("data-stream-level")) === "all", `initial level === "all"`);
  check((await shell.getAttribute("data-stream-dir")) === "down",  `initial dir === "down"`);

  const level0 = await screenshotAnchorByte(win, `anchor-pane-${paneId}-level`, path.join(__dirname, "shot-level-0.png"));
  const dir0   = await screenshotAnchorByte(win, `anchor-pane-${paneId}-dir`,   path.join(__dirname, "shot-dir-0.png"));
  check(level0 === 0, `anchor-pane-${paneId}-level byte === 0 (all) (got ${level0})`);
  check(dir0 === 0,   `anchor-pane-${paneId}-dir byte === 0 (down) (got ${dir0})`);

  const preClicks = readJsonl().length;

  await levelChip.click();
  await new Promise((r) => setTimeout(r, 150));
  check((await shell.getAttribute("data-stream-level")) === "app", `after 1 click: level === "app"`);
  const level1 = await screenshotAnchorByte(win, `anchor-pane-${paneId}-level`, path.join(__dirname, "shot-level-1.png"));
  check(level1 === 255, `anchor byte === 255 (app) (got ${level1})`);

  await dirChip.click();
  await new Promise((r) => setTimeout(r, 150));
  check((await shell.getAttribute("data-stream-dir")) === "side", `after 1 click: dir === "side"`);
  const dir1 = await screenshotAnchorByte(win, `anchor-pane-${paneId}-dir`, path.join(__dirname, "shot-dir-1.png"));
  check(dir1 === 255, `anchor byte === 255 (side) (got ${dir1})`);

  await levelChip.click();
  await dirChip.click();
  await new Promise((r) => setTimeout(r, 150));
  check((await shell.getAttribute("data-stream-level")) === "all",  `after 2nd click: level === "all"`);
  check((await shell.getAttribute("data-stream-dir")) === "down",   `after 2nd click: dir === "down"`);

  const emitsAfter = readJsonl().slice(preClicks);
  const levels = emitsAfter.filter((s) => s.kind === "STREAM_LEVEL_TOGGLED");
  const dirs   = emitsAfter.filter((s) => s.kind === "STREAM_DIR_TOGGLED");
  check(levels.length === 2, `two STREAM_LEVEL_TOGGLED emits (got ${levels.length})`);
  check(dirs.length === 2,   `two STREAM_DIR_TOGGLED emits (got ${dirs.length})`);

  check(levels[0].payload.from === "all"  && levels[0].payload.to === "app",  `level 1: all → app`);
  check(levels[1].payload.from === "app"  && levels[1].payload.to === "all",  `level 2: app → all (alternates)`);
  check(dirs[0].payload.from === "down"   && dirs[0].payload.to === "side",   `dir 1: down → side`);
  check(dirs[1].payload.from === "side"   && dirs[1].payload.to === "down",   `dir 2: side → down (alternates)`);

  for (const e of [...levels, ...dirs]) {
    check(e.payload.pane_id === paneId, `${e.kind}.pane_id matches`);
  }
});
