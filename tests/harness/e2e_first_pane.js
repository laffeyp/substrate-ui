// tests/harness/e2e_first_pane.js — Sprint 002, three-channel harness.
// The one pane mounts with eleven anchors; focus decodes to byte 255;
// status decodes to byte 0 (unbound); the JSONL trace carries
// WINDOW_OPENED → PANE_CREATED → PANE_FOCUSED with agreeing window_id
// and pane_id.

"use strict";
const path = require("node:path");

const { runHarness } = require("./lib/harness");
const { screenshotAnchorByte } = require("./lib/anchor");
const { readJsonl } = require("./lib/jsonl");
const { assertSequence } = require("./lib/assert");

runHarness("e2e_first_pane", async ({ win, check }) => {
  const anchors = win.locator('[data-testid^="anchor-pane-"]');
  await anchors.first().waitFor({ state: "attached", timeout: 5000 });
  await new Promise((r) => setTimeout(r, 200));

  const count = await anchors.count();
  check(count === 11, `pane carries eleven anchors (got ${count})`);

  const focusId = await win.$eval('[data-testid$="-focus"]', el => el.getAttribute("data-testid"));
  const statusId = await win.$eval('[data-testid$="-status"]', el => el.getAttribute("data-testid"));

  const fb = await screenshotAnchorByte(win, focusId, path.join(__dirname, "shot-focus.png"));
  const sb = await screenshotAnchorByte(win, statusId, path.join(__dirname, "shot-status.png"));
  check(fb === 255, `focus anchor byte === 255 (got ${fb})`);
  check(sb === 0,   `status anchor byte === 0 (unbound) (got ${sb})`);

  const emits = readJsonl();
  const [wo, pc, pf] = assertSequence(emits, ["WINDOW_OPENED", "PANE_CREATED", "PANE_FOCUSED"]);
  check(emits[wo].payload.window_id === emits[pc].payload.window_id,
    `window_id agrees across WINDOW_OPENED + PANE_CREATED`);
  check(emits[pc].payload.pane_id === emits[pf].payload.pane_id,
    `pane_id agrees across PANE_CREATED + PANE_FOCUSED`);
});
