// tests/harness/e2e_reveal_toggle.js — Sprint 016.
// Binds a session, toggles reveal terminal → reveal → terminal via the
// header handle. Each click emits REVEAL_TOGGLED with matching pane_id
// and from/to. Ten rapid toggles + the two setup toggles verify Layer 5
// mutex: every from equals the previous to.

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

runHarness("e2e_reveal_toggle", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  ({ sid, workspace } = await bindWorkspaceOrFixture(win, paneId, "reveal"));
  check(!!sid, `session bound (session_id=${sid})`);

  const toggle = win.locator(`[data-testid="pane-reveal-toggle-${paneId}"]`);
  await toggle.waitFor({ state: "attached", timeout: 3000 });
  check((await toggle.getAttribute("data-reveal")) === "terminal", `initial state === terminal`);
  check(await win.locator(`[data-testid="prompt-${paneId}"]`).count() === 1, `prompt present when terminal`);

  const preClick = readJsonl().length;
  await toggle.click();
  await new Promise((r) => setTimeout(r, 200));
  check((await toggle.getAttribute("data-reveal")) === "reveal", `after click 1: reveal`);
  check(await win.locator(`[data-testid="reveal-shell-${paneId}"]`).count() === 1, `RevealShell mounts`);
  check(await win.locator(`[data-testid="prompt-${paneId}"]`).count() === 0, `Prompt unmounts`);

  const byte = await screenshotAnchorByte(win, `anchor-pane-${paneId}-reveal`, path.join(__dirname, "shot-reveal.png"));
  check(byte === 128, `anchor-pane-${paneId}-reveal byte === 128 when reveal (got ${byte})`);

  const emitsAfter1 = readJsonl().slice(preClick);
  const rt1 = emitsAfter1.find((s) => s.kind === "REVEAL_TOGGLED");
  check(rt1.payload.pane_id === paneId, `REVEAL_TOGGLED.pane_id matches`);
  check(rt1.payload.from === "terminal" && rt1.payload.to === "reveal", `REVEAL_TOGGLED{terminal→reveal}`);

  await toggle.click();
  await new Promise((r) => setTimeout(r, 200));
  check((await toggle.getAttribute("data-reveal")) === "terminal", `after click 2: terminal`);
  check(await win.locator(`[data-testid="prompt-${paneId}"]`).count() === 1, `Prompt remounts`);

  for (let i = 0; i < 10; i++) await toggle.click();
  await new Promise((r) => setTimeout(r, 300));

  const toggles = readJsonl().filter((s) => s.kind === "REVEAL_TOGGLED");
  check(toggles.length === 12, `twelve REVEAL_TOGGLED emits (2 setup + 10 rapid) (got ${toggles.length})`);
  let expectedFrom = "terminal";
  let alternates = true;
  for (const t of toggles) {
    if (t.payload.from !== expectedFrom) { alternates = false; break; }
    expectedFrom = t.payload.to;
  }
  check(alternates, `every REVEAL_TOGGLED.from equals previous .to (Layer 5 mutex holds)`);
});
