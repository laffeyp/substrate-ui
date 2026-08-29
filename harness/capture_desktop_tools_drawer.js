/* Sprint 036d observation harness — desktop tools drawer + create-time
   tools field on the new-session dialog.

   Discipline: real POST for creation, real PATCH for mid-session flips,
   real GET /api/session/<id> to read back the manifest tools slice, real
   POST /end for cleanup. Also verifies the sort invariant: the drawer
   accepts any order in the input and the PATCH payload is sorted. */
"use strict";
const { chromium } = require("playwright");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const fails = [];
const pageErrors = [];
const ok = (m) => console.log(`  ok  ${m}`);
const fail = (m) => { console.error(`  FAIL  ${m}`); fails.push(m); };

const SUFFIX = Math.random().toString(36).slice(2, 10);
const WORKSPACE = `/tmp/036d-harness-${SUFFIX}`;

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e.message)));
  await page.goto(BASE);
  await page.waitForSelector("#view-desktop.active", { timeout: 5000 });
  // Sprint 041: session controls moved from the shared head to inside
  // #view-terminal. Flip to terminal before addressing the mount points.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 });
  await page.waitForSelector("#terminal-input", { timeout: 2000 });

  await page.waitForSelector("#tools-drawer-input", { timeout: 3000 });
  ok("tools drawer mounted in desktop header");

  // Wait for the initial refresh to settle.
  await page.waitForFunction(
    () => {
      const s = document.getElementById("tools-drawer-status")?.textContent || "";
      return s.includes("restricted") || s.includes("unrestricted") || s.includes("no live session");
    },
    { timeout: 3000 },
  );
  ok("drawer settled after initial refresh");

  // Create a session via the 036c dialog with a specific workspace AND a
  // create-time tools value (verifies the toolsField() registration).
  await page.click("#new-session-btn");
  await page.waitForSelector("#workspace-picker-input", { timeout: 2000 });
  await page.fill("#workspace-picker-input", WORKSPACE);
  await page.waitForSelector("#tools-field-input", { timeout: 2000 });
  await page.fill("#tools-field-input", "grep, read_file"); // reverse alphabetical on purpose
  const beforeCreate = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").length,
  );
  await page.click("#new-session-create");
  await page.waitForFunction(
    (b) => ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").length > b,
    beforeCreate,
    { timeout: 5000 },
  );
  const created = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").slice(-1)[0],
  );
  const sessionId = created?.payload?.session_id;
  if (!sessionId) { fail("session not created"); await browser.close(); process.exit(1); }
  ok(`session ${sessionId.slice(0, 12)}… created with workspace + tools`);

  // Manifest carries the sorted tools list from the create-time field.
  const manifestPostCreate = await page.evaluate(
    async (sid) => await fetch(`/api/session/${sid}`).then((r) => r.json()),
    sessionId,
  );
  const expectedSorted = ["grep", "read_file"];
  if (JSON.stringify(manifestPostCreate?.tools) === JSON.stringify(expectedSorted))
    ok(`create-time tools sorted on manifest: ${JSON.stringify(expectedSorted)}`);
  else fail(`create-time tools mismatch: expected ${JSON.stringify(expectedSorted)}, got ${JSON.stringify(manifestPostCreate?.tools)}`);

  // Drawer refreshes and reflects the create-time tools.
  await page.waitForFunction(
    (sid) => (document.getElementById("tools-drawer-status")?.textContent || "").includes(sid.slice(0, 8)),
    sessionId,
    { timeout: 3000 },
  );
  const drawerInputAfterCreate = await page.$eval("#tools-drawer-input", (el) => el.value);
  if (drawerInputAfterCreate === "grep, read_file")
    ok(`drawer input echoes sorted list: "${drawerInputAfterCreate}"`);
  else fail(`drawer input wrong: "${drawerInputAfterCreate}"`);

  // Flip 1: reduce tools via the drawer.
  const beforeFlip1 = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "TOOLS_RESTRICTED").length,
  );
  await page.fill("#tools-drawer-input", "grep");
  await page.click("#tools-drawer-apply");
  await page.waitForFunction(
    (b) => ((window).__signals || []).filter((s) => s.name === "TOOLS_RESTRICTED").length > b,
    beforeFlip1,
    { timeout: 5000 },
  );
  const restrict1 = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "TOOLS_RESTRICTED").slice(-1)[0],
  );
  if (JSON.stringify(restrict1?.payload?.tools) === JSON.stringify(["grep"])
      && restrict1?.payload?.session_id === sessionId) {
    ok(`TOOLS_RESTRICTED{tools:["grep"]} on shrink`);
  } else {
    fail(`TOOLS_RESTRICTED wrong on shrink: ${JSON.stringify(restrict1?.payload)}`);
  }
  const manifestAfter1 = await page.evaluate(
    async (sid) => await fetch(`/api/session/${sid}`).then((r) => r.json()),
    sessionId,
  );
  if (JSON.stringify(manifestAfter1?.tools) === JSON.stringify(["grep"]))
    ok("manifest tools reduced to [grep]");
  else fail(`manifest not reduced: ${JSON.stringify(manifestAfter1?.tools)}`);

  // Flip 2: expand tools, out-of-order input.
  const beforeFlip2 = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "TOOLS_RESTRICTED").length,
  );
  await page.fill("#tools-drawer-input", "write_file, bash, grep");
  await page.click("#tools-drawer-apply");
  await page.waitForFunction(
    (b) => ((window).__signals || []).filter((s) => s.name === "TOOLS_RESTRICTED").length > b,
    beforeFlip2,
    { timeout: 5000 },
  );
  const restrict2 = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "TOOLS_RESTRICTED").slice(-1)[0],
  );
  const wanted2 = ["bash", "grep", "write_file"]; // sorted
  if (JSON.stringify(restrict2?.payload?.tools) === JSON.stringify(wanted2))
    ok(`TOOLS_RESTRICTED sort invariant holds on expand: ${JSON.stringify(wanted2)}`);
  else fail(`TOOLS_RESTRICTED sort wrong: ${JSON.stringify(restrict2?.payload?.tools)}`);
  const manifestAfter2 = await page.evaluate(
    async (sid) => await fetch(`/api/session/${sid}`).then((r) => r.json()),
    sessionId,
  );
  if (JSON.stringify(manifestAfter2?.tools) === JSON.stringify(wanted2))
    ok("manifest tools sorted lexicographically on expand");
  else fail(`manifest sort wrong: ${JSON.stringify(manifestAfter2?.tools)}`);

  // Flip 3: clear (empty input) → PATCH {tools: []} → unrestricted.
  const beforeFlip3 = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "TOOLS_RESTRICTED").length,
  );
  await page.fill("#tools-drawer-input", "");
  await page.click("#tools-drawer-apply");
  await page.waitForFunction(
    (b) => ((window).__signals || []).filter((s) => s.name === "TOOLS_RESTRICTED").length > b,
    beforeFlip3,
    { timeout: 5000 },
  );
  const restrict3 = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "TOOLS_RESTRICTED").slice(-1)[0],
  );
  if (JSON.stringify(restrict3?.payload?.tools) === "[]")
    ok("TOOLS_RESTRICTED{tools:[]} on clear");
  else fail(`clear emit wrong: ${JSON.stringify(restrict3?.payload)}`);
  const manifestAfter3 = await page.evaluate(
    async (sid) => await fetch(`/api/session/${sid}`).then((r) => r.json()),
    sessionId,
  );
  // Empty [] sent → server stores None (unrestricted) per _session_patch shape.
  if (manifestAfter3?.tools === null || (Array.isArray(manifestAfter3?.tools) && manifestAfter3.tools.length === 0))
    ok(`manifest cleared to unrestricted: ${JSON.stringify(manifestAfter3?.tools)}`);
  else fail(`clear not landed: ${JSON.stringify(manifestAfter3?.tools)}`);

  // Cleanup.
  const endResult = await page.evaluate(async (sid) => {
    const r = await fetch(`/api/session/${sid}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "harness-cleanup" }),
    });
    return { status: r.status, body: await r.json() };
  }, sessionId);
  if (endResult.status === 200 && endResult.body?.status === "ended")
    ok("session ended via POST /end");
  else fail(`POST /end failed: ${JSON.stringify(endResult)}`);

  if (pageErrors.length === 0) ok("no uncaught page errors");
  else fail(`page errors: ${JSON.stringify(pageErrors)}`);

  await browser.close();
  if (fails.length) {
    console.error(`\nFAIL — ${fails.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nSprint 036d desktop tools-drawer observation contract PASS.");
})();
