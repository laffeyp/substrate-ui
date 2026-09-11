// tests/harness/e2e_lenses.js — Sprint 017.
// Binds a session, submits one turn, opens reveal, cycles through the
// four lens tabs. Asserts LENS_SWITCHED per click with correct from/to
// chain, DOM lens body flips per click, and the lens anchor pixel byte
// decodes to 192 (scene ordinal per Layer 7) after the last click.

"use strict";
const path = require("node:path");
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const { screenshotAnchorByte } = require("./lib/anchor");
const {
  bindWorkspaceOrFixture, submitPrompt, waitForFirstPane,
  cleanupSession, rmWorkspace,
} = require("./lib/session");

let sid = null, workspace = null;
process.on("exit", () => { cleanupSession(sid); if (workspace) rmWorkspace(workspace); });

runHarness("e2e_lenses", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  ({ sid, workspace } = await bindWorkspaceOrFixture(win, paneId, "lenses"));
  check(!!sid, `session bound (session_id=${sid})`);

  if (workspace) {
    await submitPrompt(win, paneId, "hello");
  }

  await win.locator(`[data-testid="pane-reveal-toggle-${paneId}"]`).click();
  await new Promise((r) => setTimeout(r, 200));
  const shell = win.locator(`[data-testid="reveal-shell-${paneId}"]`);
  await shell.waitFor({ state: "attached", timeout: 3000 });
  check(await shell.getAttribute("data-lens") === "stream+graph", `initial lens is stream+graph`);
  check(await win.locator(`[data-testid="lens-stream+graph"]`).count() === 1, `stream+graph body renders`);

  const preClicks = readJsonl().filter((s) => s.kind === "LENS_SWITCHED").length;
  for (const lens of ["i/o", "structure", "scene"]) {
    await win.locator(`[data-testid="lens-tab-${lens}"]`).click();
    await new Promise((r) => setTimeout(r, 150));
    check(await shell.getAttribute("data-lens") === lens, `data-lens === "${lens}" after click`);
    check(await win.locator(`[data-testid="lens-${lens}"]`).count() === 1, `${lens} lens body renders`);
  }

  const byte = await screenshotAnchorByte(win, `anchor-pane-${paneId}-lens`, path.join(__dirname, "shot-lens.png"));
  check(byte === 192, `anchor-pane-${paneId}-lens byte === 192 (scene) (got ${byte})`);

  const switches = readJsonl().filter((s) => s.kind === "LENS_SWITCHED").slice(preClicks);
  check(switches.length === 3, `three LENS_SWITCHED emits (got ${switches.length})`);
  check(switches[0].payload.from === "stream+graph" && switches[0].payload.to === "i/o", `chain 1: stream+graph → i/o`);
  check(switches[1].payload.from === "i/o" && switches[1].payload.to === "structure", `chain 2: i/o → structure`);
  check(switches[2].payload.from === "structure" && switches[2].payload.to === "scene", `chain 3: structure → scene`);
});
