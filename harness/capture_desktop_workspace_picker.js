/* Sprint 036c observation harness — desktop-view workspace picker +
   new-session dialog + workspace_shape badge.

   Discipline notes (per REVIEW-2026-08-28-piece-g-eod SPEC-3 + the
   "harness correctly" reminder):
   - The harness creates its session by driving the actual DOM the user
     drives (button click → dialog fill → Create click). No shortcut via
     window.newSessionDialog internals.
   - Real POST /api/session; real /api/session/<id> read-back; real
     /end when done — no accumulated stray sessions between runs.
   - Every emitted tag is checked against v0.7.3 payload shape via
     window.__signals.
   - Badge assertion reads DOM text AND cross-checks with the manifest
     workspace_shape via a fresh GET. */
"use strict";
const { chromium } = require("playwright");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const fails = [];
const pageErrors = [];
const ok = (m) => console.log(`  ok  ${m}`);
const fail = (m) => { console.error(`  FAIL  ${m}`); fails.push(m); };

const SUFFIX = Math.random().toString(36).slice(2, 10);
const WORKSPACE = `/tmp/036c-harness-${SUFFIX}`;

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

  await page.waitForSelector("#new-session-btn", { timeout: 3000 });
  ok("new-session button mounted");

  await page.waitForSelector("#workspace-shape-badge", { timeout: 3000 });
  ok("workspace-shape badge mounted");

  // Dialog is closed initially.
  const initiallyHidden = await page.$eval("#new-session-dialog", (el) => el.style.display === "none");
  if (initiallyHidden) ok("dialog hidden before button click");
  else fail("dialog visible before button click");

  // Open the dialog.
  await page.click("#new-session-btn");
  await page.waitForFunction(
    () => document.getElementById("new-session-dialog")?.style.display === "block",
    { timeout: 2000 },
  );
  ok("dialog opens on button click");

  await page.waitForSelector("#workspace-picker-input", { timeout: 2000 });
  ok("workspace input rendered inside dialog");

  // Client-side validation: relative path shows an error.
  await page.fill("#workspace-picker-input", "not-absolute");
  await page.waitForFunction(
    () => (document.getElementById("workspace-picker-error")?.textContent || "").includes("absolute"),
    { timeout: 1000 },
  );
  ok("relative path shows validation error");

  // Client-side validation: valid path clears the error.
  await page.fill("#workspace-picker-input", WORKSPACE);
  await page.waitForFunction(
    () => (document.getElementById("workspace-picker-error")?.textContent || "") === "",
    { timeout: 1000 },
  );
  ok(`valid path clears error (${WORKSPACE})`);

  // Submit.
  const beforeCount = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").length,
  );
  await page.click("#new-session-create");
  await page.waitForFunction(
    (b) => ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").length > b,
    beforeCount,
    { timeout: 5000 },
  );
  ok("Create button issued POST and WORKSPACE_SELECTED landed");

  const selected = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").slice(-1)[0],
  );
  const sessionId = selected?.payload?.session_id;
  if (sessionId && selected.payload.workspace === WORKSPACE && selected.payload.workspace_shape === "flat") {
    ok(`WORKSPACE_SELECTED{session_id=${sessionId.slice(0, 12)}…, workspace=${WORKSPACE}, workspace_shape=flat}`);
  } else {
    fail(`WORKSPACE_SELECTED payload wrong: ${JSON.stringify(selected?.payload)}`);
  }

  // Real substrate-side check: GET /api/session/<id> and confirm the manifest
  // carries both fields — the daemon actually wrote them.
  const manifest = await page.evaluate(
    async (sid) => await fetch(`/api/session/${sid}`).then((r) => r.json()),
    sessionId,
  );
  if (manifest?.workspace === WORKSPACE) ok(`manifest workspace = ${WORKSPACE}`);
  else fail(`manifest workspace mismatch: ${JSON.stringify(manifest?.workspace)}`);
  if (manifest?.workspace_shape === "flat") ok(`manifest workspace_shape = flat`);
  else fail(`manifest workspace_shape mismatch: ${JSON.stringify(manifest?.workspace_shape)}`);

  // Badge updates via substrate:session-changed dispatched by the dialog.
  await page.waitForFunction(
    () => (document.getElementById("workspace-shape-badge")?.textContent || "").includes("shape flat"),
    { timeout: 3000 },
  );
  const badgeText = await page.$eval("#workspace-shape-badge", (el) => (el.textContent || "").trim());
  ok(`badge reflects shape: "${badgeText}"`);
  const badgeTitle = await page.$eval("#workspace-shape-badge", (el) => el.title);
  if (badgeTitle.includes(WORKSPACE)) ok(`badge title carries workspace path: "${badgeTitle}"`);
  else fail(`badge title missing workspace path: "${badgeTitle}"`);

  // Dialog closed after successful create.
  const closed = await page.$eval("#new-session-dialog", (el) => el.style.display === "none");
  if (closed) ok("dialog closes after create");
  else fail("dialog remained open after create");

  // Reopen and cancel closes without emitting.
  const beforeCancelCount = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").length,
  );
  await page.click("#new-session-btn");
  await page.click("#new-session-cancel");
  const afterCancelCount = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").length,
  );
  if (afterCancelCount === beforeCancelCount) ok("cancel closes dialog without emitting");
  else fail(`cancel emitted WORKSPACE_SELECTED (${beforeCancelCount} → ${afterCancelCount})`);
  const closedAfterCancel = await page.$eval("#new-session-dialog", (el) => el.style.display === "none");
  if (closedAfterCancel) ok("dialog hidden after cancel");
  else fail("dialog still visible after cancel");

  // Clean up: end the created session via direct POST /end. The dialog's
  // create path did not run the terminal-view session flow, so /exit is
  // not the right shutdown here.
  const endResult = await page.evaluate(async (sid) => {
    const r = await fetch(`/api/session/${sid}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "harness-cleanup" }),
    });
    return { status: r.status, body: await r.json() };
  }, sessionId);
  if (endResult.status === 200 && endResult.body?.status === "ended")
    ok(`session ended via POST /end (reason: ${endResult.body.reason || "n/a"})`);
  else fail(`POST /end failed: ${JSON.stringify(endResult)}`);
  const postEnd = await page.evaluate(
    async (sid) => await fetch(`/api/session/${sid}`).then((r) => r.json()),
    sessionId,
  );
  if (postEnd?.status === "ended") ok(`manifest status = ended after cleanup`);
  else fail(`manifest status not ended: ${JSON.stringify(postEnd?.status)}`);

  if (pageErrors.length === 0) ok("no uncaught page errors");
  else fail(`page errors: ${JSON.stringify(pageErrors)}`);

  await browser.close();
  if (fails.length) {
    console.error(`\nFAIL — ${fails.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nSprint 036c desktop workspace-picker observation contract PASS.");
})();
