/* Sprint 033 (v0.7.1 refactor) observation-contract harness: the two-view
   scaffold. Opens /, asserts the initial state, mousedown-triggers the
   header toggle, asserts the flip, presses Ctrl+`, asserts the flip back,
   focuses a rail input and preserves it across a round-trip.

   Asserts VIEW_SWITCHED{to_view, prior_view, subject_record} (v0.7.1
   TAG_SPLIT — was PANE_SWITCHED under v0.7). Enforces strict scroll
   equality across the flip cycle (REVIEW-2026-08-28 H3), catches uncaught
   page errors (H5), synchronizes on real DOM/STATE conditions (AP1),
   filters PANE_SWITCHED noise (view-scope flips no longer emit that tag).

   Two screenshots written: 33-desktop-view-console.png,
   33-terminal-view-empty.png.

   Run: node harness/capture_view_toggle.js (server must be on :8765).
*/
"use strict";
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const OUT = path.join(__dirname, "..", "screenshots");
const fails = [];
const pageErrors = [];
const ok = (m) => console.log(`  ok  ${m}`);
const fail = (m) => { console.error(`  FAIL  ${m}`); fails.push(m); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e.message)));

  await page.goto(BASE + "?view=desktop");
  await page.waitForSelector("#view-desktop.active", { timeout: 5000 });

  // Initial state
  const initial = await page.evaluate(() => ({
    desktopActive: document.getElementById("view-desktop").classList.contains("active"),
    terminalActive: document.getElementById("view-terminal").classList.contains("active"),
    stateView: (window).STATE?.view,
  }));
  if (initial.desktopActive && !initial.terminalActive) ok("initial: desktop active, terminal hidden");
  else fail(`initial state wrong: ${JSON.stringify(initial)}`);
  if (initial.stateView === "desktop") ok("STATE.view === 'desktop' on load");
  else fail(`STATE.view is ${initial.stateView}`);

  await page.screenshot({ path: path.join(OUT, "33-desktop-view-console.png"), fullPage: false });
  ok("screenshot 33-desktop-view-console.png written");

  // Mousedown the toggle. The handler calls preventDefault so focus does
  // NOT move to the button — pre-click focus is preserved by construction.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 });
  const afterMouse = await page.evaluate(() => ({
    desktopActive: document.getElementById("view-desktop").classList.contains("active"),
    terminalActive: document.getElementById("view-terminal").classList.contains("active"),
    lastSwitch: ((window).__signals || []).filter((s) => s.name === "VIEW_SWITCHED").slice(-1)[0],
  }));
  if (!afterMouse.desktopActive && afterMouse.terminalActive) ok("after mousedown: terminal active, desktop hidden");
  else fail(`after-mousedown state wrong: ${JSON.stringify(afterMouse)}`);
  if (afterMouse.lastSwitch?.name === "VIEW_SWITCHED"
      && afterMouse.lastSwitch?.payload?.to_view === "terminal"
      && afterMouse.lastSwitch?.payload?.prior_view === "desktop") ok("VIEW_SWITCHED{to_view:terminal, prior_view:desktop} fired");
  else fail(`VIEW_SWITCHED wrong shape: ${JSON.stringify(afterMouse.lastSwitch)}`);

  await page.screenshot({ path: path.join(OUT, "33-terminal-view-empty.png"), fullPage: false });
  ok("screenshot 33-terminal-view-empty.png written");

  // Ctrl+backtick flip back
  await page.keyboard.down("Control");
  await page.keyboard.press("`");
  await page.keyboard.up("Control");
  await page.waitForFunction(() => (window).STATE?.view === "desktop", { timeout: 2000 });
  const afterKey = await page.evaluate(() => ({
    stateView: (window).STATE?.view,
    lastSwitch: ((window).__signals || []).filter((s) => s.name === "VIEW_SWITCHED").slice(-1)[0],
  }));
  if (afterKey.stateView === "desktop") ok("Ctrl+` flipped back to desktop");
  else fail(`STATE.view is ${afterKey.stateView} after Ctrl+backtick`);
  if (afterKey.lastSwitch?.payload?.to_view === "desktop"
      && afterKey.lastSwitch?.payload?.prior_view === "terminal") ok("VIEW_SWITCHED{to_view:desktop, prior_view:terminal} fired");
  else fail(`second VIEW_SWITCHED wrong: ${JSON.stringify(afterKey.lastSwitch)}`);

  // Assert PANE_SWITCHED did NOT fire from the view-toggle path (v0.7.1
  // TAG_SPLIT — pane-scope tag no longer carries view-scope semantics).
  const paneSwitchesTerminalOrDesktop = await page.evaluate(() => ((window).__signals || [])
    .filter((s) => s.name === "PANE_SWITCHED")
    .filter((s) => s.payload?.to_pane === "terminal" || s.payload?.to_pane === "desktop"));
  if (paneSwitchesTerminalOrDesktop.length === 0) ok("PANE_SWITCHED never carried view-scope values (tag split honored)");
  else fail(`PANE_SWITCHED leak: ${JSON.stringify(paneSwitchesTerminalOrDesktop)}`);

  // Scroll + focus preservation. Focus the launchsel dropdown; seed the rail
  // with enough dummy content to force overflow (the test box may have too
  // few records to scroll naturally); scroll to a non-zero offset; verify the
  // scroll actually took effect (H3 fix: a "guard" on 0===0 is documentation,
  // not a guard); mousedown-flip to terminal, mousedown-flip back to desktop;
  // assert both focus + scroll restored EXACTLY.
  await page.evaluate(() => {
    const sel = document.getElementById("launchsel");
    if (sel) sel.focus();
    // The scrollable ancestor of #rail is the .col that wraps it. That col
    // lacks an id in the current HTML; tag it here so the snapshot (which
    // walks [id] elements only) can capture its scroll.
    const rail = document.getElementById("rail");
    const col = rail && rail.closest(".col");
    if (col) {
      col.id = "test-rail-col";
      // Seed enough overflow to guarantee a non-zero scrollTop on any viewport.
      const pad = document.createElement("div");
      pad.style.height = "1800px";
      pad.textContent = "test overflow pad";
      col.appendChild(pad);
      col.scrollTop = 240;
    }
  });
  const beforeFlipOut = await page.evaluate(() => ({
    activeId: document.activeElement?.id,
    colScroll: document.getElementById("test-rail-col")?.scrollTop,
  }));
  if (typeof beforeFlipOut.colScroll !== "number" || beforeFlipOut.colScroll < 100) {
    fail(`test setup broken: rail col scroll did not take effect (got ${beforeFlipOut.colScroll}, expected ~240) — scroll-restore assertion would be vacuous`);
  } else {
    ok(`test setup: rail col scrolled to ${beforeFlipOut.colScroll}`);
  }
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 });
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "desktop", { timeout: 2000 });
  // The restore runs inside requestAnimationFrame after the flip; the state
  // flag flips first. Wait for the actual DOM effect (focus landing) so the
  // assertion below is not racing the rAF callback.
  await page.waitForFunction(
    () => document.activeElement && (document.activeElement).id === "launchsel",
    { timeout: 2000 },
  );
  const afterRestore = await page.evaluate(() => ({
    activeId: document.activeElement?.id,
    colScroll: document.getElementById("test-rail-col")?.scrollTop,
  }));
  if (afterRestore.activeId === beforeFlipOut.activeId) ok(`focus restored exactly to #${afterRestore.activeId}`);
  else fail(`focus drifted: before=${beforeFlipOut.activeId} after=${afterRestore.activeId}`);
  if (afterRestore.colScroll === beforeFlipOut.colScroll) ok(`rail col scroll restored exactly (${afterRestore.colScroll})`);
  else fail(`rail col scroll drifted: before=${beforeFlipOut.colScroll} after=${afterRestore.colScroll}`);

  // VIEW_SWITCHED closed-set audit across the full capture
  const viewSwitches = await page.evaluate(() => ((window).__signals || [])
    .filter((s) => s.name === "VIEW_SWITCHED")
    .map((s) => [s.payload.to_view, s.payload.prior_view]));
  const okSet = new Set(["desktop", "terminal"]);
  const outOfSet = viewSwitches.flat().filter((v) => !okSet.has(v));
  if (outOfSet.length === 0) ok(`VIEW_SWITCHED closed set held (${viewSwitches.length} switches, all in {desktop, terminal})`);
  else fail(`VIEW_SWITCHED out-of-set values: ${JSON.stringify(outOfSet)}`);

  if (pageErrors.length === 0) ok("no uncaught page errors");
  else fail(`page errors: ${JSON.stringify(pageErrors)}`);

  await browser.close();
  if (fails.length) {
    console.error(`\nFAIL — ${fails.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nSprint 033 observation contract PASS.");
})();
