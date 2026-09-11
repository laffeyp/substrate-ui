// tests/harness/e2e_boot.js — Sprint 001, three-channel observability.
//
// Structural (DOM): the anchor mounts and status text flips to alive.
// Perceptual (pixel byte): the anchor's rendered pixel decodes to 128.
// Signal (JSONL + bridge.log): BRIDGE_HELLO_RECEIVED carries a
// substrate_version that bridge.log echoes as substrate=<ver>.
// Three channels; one signal report.

"use strict";
const path = require("node:path");

const { runHarness } = require("./lib/harness");
const { screenshotAnchorByte } = require("./lib/anchor");
const { waitForEmit, readBridgeLog } = require("./lib/jsonl");

runHarness("e2e_boot", async ({ win, check }) => {
  const t0 = Date.now();
  const anchor = win.locator('[data-testid="anchor-bridge"]');
  await anchor.waitFor({ state: "attached", timeout: 3000 });

  const status = win.locator("#status");
  await status.waitFor({ state: "attached", timeout: 3000 });
  let statusText = "";
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    statusText = (await status.textContent()) || "";
    if (statusText.includes("alive")) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  const elapsed = Date.now() - t0;
  check(statusText.includes("alive"), `renderer status shows alive (${elapsed}ms, within 3s)`);
  check(await anchor.count() === 1, `DOM has [data-testid="anchor-bridge"]`);

  const shotPath = path.join(__dirname, "anchor-bridge.png");
  const byte = await screenshotAnchorByte(win, "anchor-bridge", shotPath);
  check(byte === 128, `decoded anchor-bridge byte === 128 (got ${byte})`);

  const hello = await waitForEmit("BRIDGE_HELLO_RECEIVED", { timeoutMs: 5000 });
  const v = hello.payload.substrate_version;
  check(!!v, `BRIDGE_HELLO_RECEIVED.substrate_version present ('${v}')`);
  check(hello.payload.protocol === 1, `BRIDGE_HELLO_RECEIVED.protocol === 1`);
  const log = readBridgeLog();
  check(log.includes(`substrate=${v}`),
    `bridge.log carries 'substrate=${v}' (log length ${log.length})`);
});
