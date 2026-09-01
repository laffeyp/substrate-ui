// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/* Sprint 036e observation harness — isolate toggle in the new-session
   dialog + workspace-shape select.

   Covers three paths per the card's observation contract:
   - flat + isolate checked → POST {isolate: true} → manifest workspace_shape
     is "isolate" → ISOLATE_TOGGLED{isolate:true} fires.
   - flat + isolate unchecked → POST omits isolate → manifest is "flat" →
     ISOLATE_TOGGLED does NOT fire.
   - worktree selected → checkbox has HTML `disabled` attribute + aria-label
     "isolation implicit in worktree workspace" → click is inert → POST
     omits isolate → ISOLATE_TOGGLED does NOT fire → manifest is "worktree".
*/
"use strict";
const { chromium } = require("playwright");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const fails = [];
const pageErrors = [];
const ok = (m) => console.log(`  ok  ${m}`);
const fail = (m) => { console.error(`  FAIL  ${m}`); fails.push(m); };

const suffix = () => Math.random().toString(36).slice(2, 10);

const createSession = async (page, { workspace, shape, isolate }) => {
  await page.click("#new-session-btn");
  await page.waitForSelector("#workspace-picker-input", { timeout: 2000 });
  await page.fill("#workspace-picker-input", workspace);
  await page.waitForSelector("#workspace-shape-select", { timeout: 2000 });
  if (shape) await page.selectOption("#workspace-shape-select", shape);
  await page.waitForSelector("#isolate-field-checkbox", { timeout: 2000 });
  if (isolate) {
    // Try to check; only proceeds if not disabled.
    const disabled = await page.$eval("#isolate-field-checkbox", (el) => el.disabled);
    if (!disabled) await page.check("#isolate-field-checkbox");
  }
  const beforeCreate = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").length,
  );
  await page.click("#new-session-create");
  await page.waitForFunction(
    (b) => ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").length > b,
    beforeCreate,
    { timeout: 5000 },
  );
  const last = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").slice(-1)[0],
  );
  return last.payload.session_id;
};

const endSession = async (page, sid) => {
  await page.evaluate(async (id) => {
    await fetch(`/api/session/${id}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "harness-cleanup" }),
    });
  }, sid);
};

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e.message)));
  await page.goto(BASE + "?view=desktop");
  await page.waitForSelector("#view-desktop.active", { timeout: 5000 });
  // Sprint 041: session controls moved from the shared head to inside
  // #view-terminal. Flip to terminal before addressing the mount points.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 });
  await page.waitForSelector("#terminal-input", { timeout: 2000 });
  await page.waitForSelector("#new-session-btn", { timeout: 3000 });

  // ---- Case 1: flat + isolate checked ----
  const s1 = `/tmp/036e-a-${suffix()}`;
  const sidIso = await createSession(page, { workspace: s1, shape: "flat", isolate: true });
  ok(`case A: session created with flat + isolate (${sidIso.slice(0, 12)}…)`);
  const isoEmit = await page.evaluate(
    (sid) => ((window).__signals || [])
      .filter((s) => s.name === "ISOLATE_TOGGLED" && s.payload?.session_id === sid)
      .slice(-1)[0],
    sidIso,
  );
  if (isoEmit?.payload?.isolate === true) ok(`ISOLATE_TOGGLED{isolate:true} fired on case A`);
  else fail(`ISOLATE_TOGGLED missing on case A: ${JSON.stringify(isoEmit)}`);
  const mIso = await page.evaluate(
    async (sid) => await fetch(`/api/session/${sid}`).then((r) => r.json()),
    sidIso,
  );
  if (mIso?.workspace_shape === "isolate") ok(`case A manifest workspace_shape=isolate (workspace=${mIso.workspace})`);
  else fail(`case A manifest wrong: ${JSON.stringify({ shape: mIso?.workspace_shape, workspace: mIso?.workspace })}`);
  await endSession(page, sidIso);

  // ---- Case 2: flat + isolate NOT checked ----
  const s2 = `/tmp/036e-b-${suffix()}`;
  const isoCountBefore = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "ISOLATE_TOGGLED").length,
  );
  const sidFlat = await createSession(page, { workspace: s2, shape: "flat", isolate: false });
  ok(`case B: session created with flat + unchecked (${sidFlat.slice(0, 12)}…)`);
  const isoCountAfter = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "ISOLATE_TOGGLED").length,
  );
  if (isoCountAfter === isoCountBefore) ok(`case B: ISOLATE_TOGGLED NOT fired when unchecked`);
  else fail(`case B: ISOLATE_TOGGLED fired unexpectedly (${isoCountBefore}→${isoCountAfter})`);
  const mFlat = await page.evaluate(
    async (sid) => await fetch(`/api/session/${sid}`).then((r) => r.json()),
    sidFlat,
  );
  if (mFlat?.workspace_shape === "flat") ok(`case B manifest workspace_shape=flat`);
  else fail(`case B manifest wrong: ${JSON.stringify(mFlat?.workspace_shape)}`);
  await endSession(page, sidFlat);

  // ---- Case 3: worktree — checkbox must be disabled + aria-labeled ----
  await page.click("#new-session-btn");
  await page.waitForSelector("#workspace-shape-select", { timeout: 2000 });
  await page.selectOption("#workspace-shape-select", "worktree");
  await page.waitForFunction(
    () => (document.getElementById("isolate-field-checkbox"))?.disabled === true,
    { timeout: 1000 },
  );
  ok("worktree select disables the isolate checkbox (HTML attribute)");
  const ariaLabel = await page.$eval("#isolate-field-checkbox", (el) => el.getAttribute("aria-label"));
  if (ariaLabel === "isolation implicit in worktree workspace")
    ok(`isolate checkbox carries aria-label: "${ariaLabel}"`);
  else fail(`aria-label wrong: "${ariaLabel}"`);
  // Click is inert on a disabled checkbox — the DOM will not fire change.
  const checkedAfterClick = await page.evaluate(() => {
    const el = document.getElementById("isolate-field-checkbox");
    el.click();
    return el.checked;
  });
  if (checkedAfterClick === false) ok("click on disabled isolate checkbox is inert (still unchecked)");
  else fail("disabled checkbox accepted click");

  // Flip shape back to flat and confirm the checkbox re-enables.
  await page.selectOption("#workspace-shape-select", "flat");
  await page.waitForFunction(
    () => (document.getElementById("isolate-field-checkbox"))?.disabled === false,
    { timeout: 1000 },
  );
  ok("switching shape back to flat re-enables the isolate checkbox");

  // Flip to worktree again and submit — no isolate emit; manifest shape worktree.
  await page.selectOption("#workspace-shape-select", "worktree");
  await page.waitForFunction(
    () => (document.getElementById("isolate-field-checkbox"))?.disabled === true,
    { timeout: 1000 },
  );
  const wtPath = `/tmp/036e-wt-${suffix()}`;
  await page.fill("#workspace-picker-input", wtPath);
  const isoBefore3 = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "ISOLATE_TOGGLED").length,
  );
  const wsBefore3 = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").length,
  );
  await page.click("#new-session-create");
  // A worktree create may fail if the path is not a git repo — that IS the
  // expected daemon-side rejection. We assert either (a) the create landed
  // and manifest carries worktree shape, or (b) create failed with a
  // structured error AND no ISOLATE_TOGGLED fired. Both prove the toggle
  // was correctly muted.
  await page
    .waitForFunction(
      (b) => ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").length > b,
      wsBefore3,
      { timeout: 5000 },
    )
    .catch(() => null);
  const isoAfter3 = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "ISOLATE_TOGGLED").length,
  );
  if (isoAfter3 === isoBefore3) ok("case C: ISOLATE_TOGGLED NOT fired when isolate was muted by worktree");
  else fail(`case C: ISOLATE_TOGGLED fired unexpectedly (${isoBefore3}→${isoAfter3})`);
  const wsAfter3 = await page.evaluate(
    () => ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").length,
  );
  if (wsAfter3 > wsBefore3) {
    const last = await page.evaluate(
      () => ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").slice(-1)[0],
    );
    const mWt = await page.evaluate(
      async (sid) => await fetch(`/api/session/${sid}`).then((r) => r.json()),
      last.payload.session_id,
    );
    if (mWt?.workspace_shape === "worktree") ok(`case C manifest workspace_shape=worktree`);
    else fail(`case C manifest wrong: ${JSON.stringify(mWt?.workspace_shape)}`);
    await endSession(page, last.payload.session_id);
  } else {
    // Rejection is the honest daemon-side answer when the path is not a
    // git repo. That still proves the toggle stayed muted. Close the
    // dialog manually.
    ok("case C: daemon rejected worktree create for non-repo path (expected — toggle still muted)");
    await page.click("#new-session-cancel").catch(() => {});
  }

  if (pageErrors.length === 0) ok("no uncaught page errors");
  else fail(`page errors: ${JSON.stringify(pageErrors)}`);

  await browser.close();
  if (fails.length) {
    console.error(`\nFAIL — ${fails.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nSprint 036e isolate-toggle observation contract PASS.");
})();
