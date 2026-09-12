// tests/harness/e2e_slash_router.js — Sprint 030.
//
// Typing "/" at the start of the prompt draft opens the slash router
// menu; ArrowDown/ArrowUp fire SLASH_ROUTER_WALKED with {from_index,
// to_index}; Enter picks the walked command and fires
// SLASH_COMMAND_ROUTED{command, arg_length}; the router state
// resets and the prompt draft clears. Backspacing the leading "/"
// closes the router with SLASH_ROUTER_CLOSED. Esc while open closes.
//
// Layer 5: from SLASH_ROUTER_OPENED, to = SLASH_ROUTER_CLOSED |
// SLASH_COMMAND_ROUTED (either terminates). SLASH_ROUTER_WALKED is
// framed inside the open→close window per Layer 3.

"use strict";
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");
const {
  bindWorkspaceOrFixture, waitForFirstPane,
  cleanupSession, rmWorkspace,
} = require("./lib/session");

let sid = null, workspace = null;
process.on("exit", () => { cleanupSession(sid); if (workspace) rmWorkspace(workspace); });

runHarness("e2e_slash_router", async ({ win, check }) => {
  const paneId = await waitForFirstPane(win);
  ({ sid, workspace } = await bindWorkspaceOrFixture(win, paneId, "slash_router"));
  check(!!sid, `session bound (session_id=${sid})`);

  const prompt = win.locator(`[data-testid="prompt-${paneId}"]`);
  await prompt.waitFor({ state: "attached", timeout: 5000 });

  // Type "/" → SLASH_ROUTER_OPENED.
  const preOpen = readJsonl().length;
  await prompt.click();
  await win.keyboard.type("/");
  await new Promise((r) => setTimeout(r, 200));
  const opens = readJsonl().slice(preOpen).filter((s) => s.kind === "SLASH_ROUTER_OPENED");
  check(opens.length === 1, `one SLASH_ROUTER_OPENED after "/" (got ${opens.length})`);
  check(opens[0].payload.pane_id === paneId, `OPENED.pane_id matches`);
  const menu = win.locator(`[data-testid="slash-router-${paneId}"]`);
  await menu.waitFor({ state: "attached", timeout: 2000 });
  check(await menu.getAttribute("data-index") === "0", `initial index === 0`);

  // ArrowDown ArrowDown ArrowUp → three SLASH_ROUTER_WALKED emits.
  const preWalk = readJsonl().length;
  await win.keyboard.press("ArrowDown");
  await new Promise((r) => setTimeout(r, 60));
  await win.keyboard.press("ArrowDown");
  await new Promise((r) => setTimeout(r, 60));
  await win.keyboard.press("ArrowUp");
  await new Promise((r) => setTimeout(r, 100));
  const walks = readJsonl().slice(preWalk).filter((s) => s.kind === "SLASH_ROUTER_WALKED");
  check(walks.length === 3, `three SLASH_ROUTER_WALKED (got ${walks.length})`);
  check(walks[0].payload.from_index === 0 && walks[0].payload.to_index === 1,
    `walk 1: 0→1 (got ${walks[0].payload.from_index}→${walks[0].payload.to_index})`);
  check(walks[1].payload.from_index === 1 && walks[1].payload.to_index === 2,
    `walk 2: 1→2`);
  check(walks[2].payload.from_index === 2 && walks[2].payload.to_index === 1,
    `walk 3: 2→1`);
  check(await menu.getAttribute("data-index") === "1", `final index === 1`);

  // Backspace to close → SLASH_ROUTER_CLOSED (leading "/" removed).
  const preClose = readJsonl().length;
  await win.keyboard.press("Backspace");
  await new Promise((r) => setTimeout(r, 200));
  const closes = readJsonl().slice(preClose).filter((s) => s.kind === "SLASH_ROUTER_CLOSED");
  check(closes.length === 1, `one SLASH_ROUTER_CLOSED on non-slash prompt`);
  check(await win.locator(`[data-testid="slash-router-${paneId}"]`).count() === 0,
    `router menu unmounts on close`);

  // Reopen, then Enter routes.
  const preRoute = readJsonl().length;
  await prompt.focus();
  await win.keyboard.type("/");
  await new Promise((r) => setTimeout(r, 150));
  await win.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 200));
  const routeEmits = readJsonl().slice(preRoute);
  const opens2 = routeEmits.filter((s) => s.kind === "SLASH_ROUTER_OPENED");
  const routed = routeEmits.filter((s) => s.kind === "SLASH_COMMAND_ROUTED");
  const closes2 = routeEmits.filter((s) => s.kind === "SLASH_ROUTER_CLOSED");
  check(opens2.length === 1, `reopen fires one OPENED`);
  check(routed.length === 1, `Enter fires one SLASH_COMMAND_ROUTED`);
  check(routed[0].payload.command === "/list",
    `ROUTED.command === "/list" (index 0)`);
  check(typeof routed[0].payload.arg_length === "number" && routed[0].payload.arg_length === 0,
    `ROUTED.arg_length === 0`);
  check(/^\/[a-z_-]+$/.test(routed[0].payload.command),
    `ROUTED.command matches Layer 2 pattern ^/[a-z_-]+$`);
  check(closes2.length === 0,
    `route does not also fire CLOSED (Layer 5 says ROUTED is a terminal itself)`);
  check(await win.locator(`[data-testid="slash-router-${paneId}"]`).count() === 0,
    `router menu unmounts on route`);

  // Esc-close path.
  const preEsc = readJsonl().length;
  await prompt.focus();
  await win.keyboard.type("/");
  await new Promise((r) => setTimeout(r, 150));
  await win.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 200));
  const escEmits = readJsonl().slice(preEsc);
  check(escEmits.filter((s) => s.kind === "SLASH_ROUTER_OPENED").length === 1,
    `Esc-path: one OPENED`);
  check(escEmits.filter((s) => s.kind === "SLASH_ROUTER_CLOSED").length === 1,
    `Esc-path: one CLOSED`);

  // Layer 5 symmetry — every OPENED has exactly one terminal
  // (CLOSED or ROUTED).
  const emits = readJsonl();
  const openCount = emits.filter((s) => s.kind === "SLASH_ROUTER_OPENED").length;
  const closeCount = emits.filter((s) => s.kind === "SLASH_ROUTER_CLOSED").length;
  const routeCount = emits.filter((s) => s.kind === "SLASH_COMMAND_ROUTED").length;
  check(openCount === closeCount + routeCount,
    `OPEN count === CLOSE + ROUTE (${openCount} === ${closeCount} + ${routeCount})`);
});
