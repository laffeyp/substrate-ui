// tests/harness/e2e_pane_splits.js — Sprint 003.
// Splits, gutter drag, 8-pane cap. Verifies same-step PANE_SPLIT →
// PANE_CREATED → PANE_FOCUSED chain and the cap: the 9th gesture emits
// zero PANE_SPLIT.

"use strict";
const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");

runHarness("e2e_pane_splits", async ({ win, check }) => {
  await win.locator('[data-testid^="pane-"]').first().waitFor({ state: "attached", timeout: 5000 });
  await new Promise((r) => setTimeout(r, 200));
  const bootCount = readJsonl().length;

  async function splitRight() { await win.keyboard.press("Meta+d");       await new Promise((r) => setTimeout(r, 150)); }
  async function splitDown()  { await win.keyboard.press("Meta+Shift+D"); await new Promise((r) => setTimeout(r, 150)); }

  await splitRight();
  await splitDown();
  check(await win.locator('[data-pane-id]').count() === 3, `three panes after right + down`);

  const gutter = win.locator('[data-testid^="gutter-"][data-axis="row"]').first();
  await gutter.waitFor({ state: "attached", timeout: 3000 });
  const box = await gutter.boundingBox();
  if (box) {
    await win.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await win.mouse.down();
    await win.mouse.move(200, box.y + box.height / 2, { steps: 10 });
    await win.mouse.up();
    await new Promise((r) => setTimeout(r, 200));
  }

  for (let i = 0; i < 6; i++) await splitRight();
  await new Promise((r) => setTimeout(r, 200));
  check(await win.locator('[data-pane-id]').count() === 8, `pane count clamps at cap 8`);

  const beforeCap = readJsonl().filter((s) => s.kind === "PANE_SPLIT").length;
  await splitRight();
  await new Promise((r) => setTimeout(r, 200));
  const afterCap = readJsonl().filter((s) => s.kind === "PANE_SPLIT").length;
  check(afterCap === beforeCap, `9th split gesture emits zero PANE_SPLIT (${beforeCap}→${afterCap})`);

  const emits = readJsonl();
  const kinds = emits.map((s) => s.kind);
  const psIdx = kinds.indexOf("PANE_SPLIT", bootCount);
  const pcIdx = kinds.indexOf("PANE_CREATED", psIdx);
  const pfIdx = kinds.indexOf("PANE_FOCUSED", pcIdx);
  check(psIdx > 0 && pcIdx > psIdx && pfIdx > pcIdx,
    `first-split chain PANE_SPLIT → PANE_CREATED → PANE_FOCUSED`);
  check((emits[pcIdx].t - emits[psIdx].t) < 16 && (emits[pfIdx].t - emits[pcIdx].t) < 16,
    `same-step per Layer 4 (< 16ms)`);

  const gStart = kinds.filter((k) => k === "GUTTER_DRAG_STARTED").length;
  const gStop  = kinds.filter((k) => k === "GUTTER_DRAG_STOPPED").length;
  check(gStart === 1 && gStop === 1, `one GUTTER_DRAG_STARTED + one _STOPPED (got ${gStart}/${gStop})`);
  const gsIdx = kinds.indexOf("GUTTER_DRAG_STARTED");
  const geIdx = kinds.indexOf("GUTTER_DRAG_STOPPED");
  check(geIdx > gsIdx, `stop follows start`);
  const delta = emits[geIdx]?.payload?.delta;
  const kind  = emits[geIdx]?.payload?.kind;
  check(typeof delta === "number" && Math.abs(delta) > 0 && Math.abs(delta) < 1,
    `GUTTER_DRAG_STOPPED.delta ∈ (-1,1) (got ${delta})`);
  check(kind === "row" || kind === "col",
    `GUTTER_DRAG_STOPPED.kind ∈ {row,col} (got ${kind})`);
});
