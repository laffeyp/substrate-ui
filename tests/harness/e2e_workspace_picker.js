// tests/harness/e2e_workspace_picker.js — Sprint 006.
// Primes ~/.substrate/recent-workspaces.json with three rows, walks with
// ArrowDown four times, asserts one WORKSPACE_PICKER_WALKED per keypress
// with the correct to_index and from_index, plus wrap-around at row 3.

"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { runHarness } = require("./lib/harness");
const { readJsonl } = require("./lib/jsonl");

const RECENT = path.join(os.homedir(), ".substrate", "recent-workspaces.json");

let priorRecent = null;
try { priorRecent = fs.readFileSync(RECENT, "utf8"); } catch (_) {}
fs.mkdirSync(path.dirname(RECENT), { recursive: true });
fs.writeFileSync(RECENT, JSON.stringify([
  { path: "/tmp/substrate-harness-alpha",  shape: "flat",     last_used: Date.now() - 1000 },
  { path: "/tmp/substrate-harness-beta",   shape: "worktree", last_used: Date.now() - 2000 },
  { path: "/tmp/substrate-harness-gamma",  shape: "isolate",  last_used: Date.now() - 3000 },
]));

process.on("exit", () => {
  if (priorRecent !== null) fs.writeFileSync(RECENT, priorRecent);
  else { try { fs.unlinkSync(RECENT); } catch (_) {} }
});

runHarness("e2e_workspace_picker", async ({ win, check }) => {
  await win.locator('[data-pane-id]').first().waitFor({ state: "attached", timeout: 5000 });
  await new Promise((r) => setTimeout(r, 400));
  const paneId = await win.$eval('[data-pane-id]', el => el.getAttribute("data-pane-id"));

  const pickerInput = win.locator(`[data-testid="unbound-picker-input-${paneId}"]`);
  await pickerInput.waitFor({ state: "attached", timeout: 3000 });

  const list = win.locator(`[data-testid="unbound-picker-list-${paneId}"] > div`);
  check(await list.count() === 3, `three recent rows render`);

  await pickerInput.focus();
  await win.keyboard.press("ArrowDown");
  await new Promise((r) => setTimeout(r, 80));
  let walks = readJsonl().filter((s) => s.kind === "WORKSPACE_PICKER_WALKED");
  check(walks.length === 1 && walks[0].payload.from_index === -1 && walks[0].payload.to_index === 0,
    `first walk: from=-1, to=0 (got ${walks[0]?.payload?.from_index},${walks[0]?.payload?.to_index})`);

  await win.keyboard.press("ArrowDown");
  await win.keyboard.press("ArrowDown");
  await new Promise((r) => setTimeout(r, 80));
  walks = readJsonl().filter((s) => s.kind === "WORKSPACE_PICKER_WALKED");
  check(walks.length === 3 && walks[2].payload.to_index === 2, `three walks; third to=2`);

  await win.keyboard.press("ArrowDown");
  await new Promise((r) => setTimeout(r, 80));
  walks = readJsonl().filter((s) => s.kind === "WORKSPACE_PICKER_WALKED");
  check(walks[3]?.payload?.to_index === 0, `wrap-around: fourth walk to=0`);

  const kinds = readJsonl().map((s) => s.kind);
  const forbidden = kinds.filter((k) => k.startsWith("WORKSPACE_PICKER_") && k !== "WORKSPACE_PICKER_WALKED");
  check(forbidden.length === 0, `only WORKSPACE_PICKER_WALKED fires (no OPENED / COMMITTED / CLOSED)`);
});
