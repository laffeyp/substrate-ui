// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/* e2e_terminal_v1.js — STRUCTURAL track for terminal-v1.
   Runs against the real parent server on :8765. Playwright is the parent substrate-ui's pinned
   devDep — reused, not re-installed.

   Discipline (SDD kit + Addendum A / B):
   - A1 three lenses: this is the STRUCTURAL lens. The perceptual lens is capture_terminal_v1.js;
     the adversarial lens is a documented per-sprint pass in BLACKBOARD ## Sprint tail.
   - A4 verify the observer: every wait is on a real condition (waitForSelector / waitForFunction),
     never a sleep.
   - B3 NAME + VALUE + PATH: every assertion names the element (NAME), asserts exact expected content
     including class + text (VALUE), and (where a user action ran a handler) asserts the STATE
     mutation the handler was supposed to make (PATH — expose via window.__TERMINAL_V1_STATE).

   Run:
     cd substrate && uv run python ../substrate-ui/server.py &   # backend on :8765
     cd substrate-ui && npm run e2e:terminal-v1
*/
"use strict";
const { chromium } = require("playwright");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const fails = [];
const check = (cond, msg) => { if (!cond) fails.push(msg); else console.log("  ok  " + msg); };

const TABS = [
  { testid: "tab-agent-terminal",        label: "agent terminal" },
  { testid: "tab-records",               label: "records" },
  { testid: "tab-assays",                label: "assays" },
  { testid: "tab-run-as-graph",          label: "run-as-graph" },
  { testid: "tab-topology-structure",    label: "topology structure" },
  { testid: "tab-event-stream-inspector", label: "event stream" },
  { testid: "tab-io",                    label: "i/o" },
  { testid: "tab-studio",                label: "studio" },
];

(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = [];
  p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  p.on("pageerror", (e) => errors.push(String(e.message)));

  await p.goto(BASE + "/terminal-v1/", { waitUntil: "domcontentloaded", timeout: 10000 });
  await p.waitForSelector('[data-testid="tab-agent-terminal"]', { timeout: 5000 });

  // ---- Sprint 002/003 shell assertions ----
  check(errors.length === 0, "no console/page errors on load (" + errors.slice(0, 2).join("; ") + ")");
  check((await p.title()) === "terminal-v1", `page title exact "terminal-v1"`);
  // NAME + VALUE per tab: element exists AND label text is exact
  for (const { testid, label } of TABS) {
    const nameOk = (await p.$$(`[data-testid="${testid}"]`)).length === 1;
    check(nameOk, `NAME: tab element present: ${testid}`);
    if (nameOk) {
      const text = (await p.$eval(`[data-testid="${testid}"]`, (e) => e.textContent.trim()));
      check(text === label, `VALUE: tab ${testid} label exact "${label}" (got "${text}")`);
    }
  }
  // PATH: initial STATE.activeTab is the initial-active tab, not just DOM state
  const initTab = await p.evaluate(() => window.__TERMINAL_V1_STATE?.activeTab);
  check(initTab === "tab-agent-terminal", `PATH: STATE.activeTab initial value "tab-agent-terminal" (got "${initTab}")`);
  const sel = await p.$$eval('.tab[aria-selected="true"]', (els) => els.map((e) => e.dataset.testid));
  check(sel.length === 1 && sel[0] === "tab-agent-terminal", `DOM matches STATE: exactly Agent Terminal aria-selected on load`);
  check((await p.$$eval('[data-testid="anchor-strip"] .anchor', (els) => els.length)) === 8, `anchor strip has 8 anchors`);

  // ---- Sprint 004/005: click each tab, assert transition + STATE mutation ----
  for (const { testid } of TABS) {
    await p.click(`[data-testid="${testid}"]`);
    await p.waitForSelector(`[data-testid="${testid}"][aria-selected="true"]`, { timeout: 2000 });
    const s = await p.$$eval('.tab[aria-selected="true"]', (els) => els.map((e) => e.dataset.testid));
    const a = await p.$$eval('.anchor.active', (els) => els.map((e) => e.dataset.anchor));
    const pane = await p.$$eval('.pane.pane-active', (els) => els.map((e) => e.dataset.paneFor));
    const stateTab = await p.evaluate(() => window.__TERMINAL_V1_STATE?.activeTab);
    check(s.length === 1 && s[0] === testid, `after click ${testid}: NAME exactly one aria-selected + matches`);
    check(a.length === 1 && a[0] === testid, `after click ${testid}: NAME exactly one anchor active + matches`);
    check(pane.length === 1 && pane[0] === testid, `after click ${testid}: NAME exactly one pane visible + matches`);
    check(stateTab === testid, `after click ${testid}: PATH STATE.activeTab === "${testid}"`);
  }

  // ---- Sprint 006/007: agent terminal — picker first, then N+V+P on echo ----
  // Clear localStorage so this run doesn't inherit a "last model" from a previous run —
  // NAME + VALUE + PATH require a known starting state.
  await p.evaluate(() => localStorage.removeItem("terminal-v1.lastModel"));
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForSelector('[data-testid="modelpicker"]');

  // Use deterministic for the wired-agent path — pure calc loop, no network, no cloud tag.
  const TEST_MODEL = "deterministic";

  // Sprint 007: picker present, populated, terminput disabled, prompt reads "substrate$"
  check(
    (await p.$eval('[data-testid="termprompt"]', (e) => e.textContent.trim())) === "substrate$",
    `Sprint 007 VALUE: termprompt reads "substrate$" before model picked`
  );
  check((await p.$eval('[data-testid="terminput"]', (e) => e.disabled)) === true,
        `Sprint 007 VALUE: terminput is disabled before model picked`);
  check((await p.evaluate(() => window.__TERMINAL_V1_STATE?.term?.model)) === null,
        `Sprint 007 PATH: STATE.term.model === null before picker change`);
  await p.waitForFunction(() => document.querySelectorAll('#modelpicker option').length > 1, { timeout: 5000 });
  const optionCount = await p.$$eval('#modelpicker option', (els) => els.length);
  check(optionCount > 1, `Sprint 007 NAME: #modelpicker populated with >1 option (got ${optionCount})`);
  // Confirm TEST_MODEL is in the options
  const modelValues = await p.$$eval('#modelpicker option', (els) => els.map((o) => o.value));
  check(modelValues.includes(TEST_MODEL), `Sprint 007 NAME: TEST_MODEL "${TEST_MODEL}" is a picker option`);

  // Pick TEST_MODEL — VALUE + PATH transitions expected
  await p.selectOption('[data-testid="modelpicker"]', TEST_MODEL);
  await p.waitForFunction((m) => window.__TERMINAL_V1_STATE?.term?.model === m, TEST_MODEL);
  check((await p.evaluate(() => window.__TERMINAL_V1_STATE?.term?.model)) === TEST_MODEL,
        `Sprint 007 PATH: STATE.term.model === "${TEST_MODEL}" after picker change`);
  check((await p.evaluate(() => localStorage.getItem("terminal-v1.lastModel"))) === TEST_MODEL,
        `Sprint 007 PATH: localStorage['terminal-v1.lastModel'] === "${TEST_MODEL}"`);
  const promptAfter = await p.$eval('[data-testid="termprompt"]', (e) => e.textContent.trim());
  check(promptAfter === TEST_MODEL + " ›", `Sprint 007 VALUE: prompt reads "${TEST_MODEL} ›" after pick (got "${promptAfter}")`);
  check((await p.$eval('[data-testid="terminput"]', (e) => e.disabled)) === false,
        `Sprint 007 VALUE: terminput enabled after model pick`);

  // Sprint 008 — type triggers /api/agent, poll runs, agent-turn lines land, FinalAnswer arrives
  const historyLenBefore = await p.evaluate(() => window.__TERMINAL_V1_STATE?.term?.history?.length ?? -1);
  check(historyLenBefore === 0, `Sprint 006 PATH: STATE.term.history empty before input (got ${historyLenBefore})`);
  await p.focus('[data-testid="terminput"]');
  await p.type('[data-testid="terminput"]', "compute (2+3)*4");
  await p.press('[data-testid="terminput"]', "Enter");
  // NAME + VALUE: user echo line appears immediately with tl-in class + exact text
  await p.waitForFunction(
    (expected) => {
      const lines = [...document.querySelectorAll('[data-testid="termbody"] .term-line')];
      return lines.some((l) => l.className.includes("tl-in") && l.textContent === expected);
    },
    TEST_MODEL + " › compute (2+3)*4"
  );
  check(true, `Sprint 006 NAME+VALUE: user echo line appeared with tl-in + exact text`);
  const historyAfter = await p.evaluate(() => window.__TERMINAL_V1_STATE?.term?.history);
  check(Array.isArray(historyAfter) && historyAfter.length === 1 && historyAfter[0] === "compute (2+3)*4",
        `Sprint 006 PATH: STATE.term.history == ["compute (2+3)*4"]`);
  check((await p.$eval('[data-testid="terminput"]', (e) => e.value)) === "",
        `Sprint 006 VALUE: terminput cleared after Enter`);
  // Sprint 008 — wait for the agent turn to complete. The deterministic loop is fast (< 1s),
  // so we cannot reliably observe polling === true mid-flight (Playwright samples too slowly).
  // Instead wait for the terminal COMPLETION state: polling back to false AND the FinalAnswer
  // check-mark landed AND STATE.term.runName is set to prove the turn actually ran (PATH).
  await p.waitForFunction(
    () => {
      const s = window.__TERMINAL_V1_STATE;
      const done = document.querySelector('[data-testid="termbody"]')?.textContent?.includes("✓");
      return s?.term?.polling === false && done && typeof s?.term?.runName === "string";
    },
    { timeout: 30000 }
  );
  check(true, `Sprint 008 PATH: agent turn completed (polling flipped, runName set, ✓ in termbody)`);
  const bodyText = await p.$eval('[data-testid="termbody"]', (e) => e.textContent);
  check(bodyText.includes("✓ 20") || /✓.*20/.test(bodyText),
        `Sprint 008 VALUE: FinalAnswer "20" appears in termbody (calc agent returned (2+3)*4)`);
  const runName = await p.evaluate(() => window.__TERMINAL_V1_STATE?.term?.runName);
  check(typeof runName === "string" && runName.startsWith("launch_agent_calc_"),
        `Sprint 008 PATH: STATE.term.runName starts with "launch_agent_calc_" (got "${runName}")`);
  check((await p.$eval('[data-testid="terminput"]', (e) => e.disabled)) === false,
        `Sprint 008 VALUE: terminput re-enabled after agent turn`);

  // ---- State-preserved-across-tab-switch (Sprint 005/006 invariant) ----
  await p.click('[data-testid="tab-records"]');
  await p.waitForSelector('.pane[data-pane-for="tab-records"].pane-active');
  await p.click('[data-testid="tab-agent-terminal"]');
  await p.waitForSelector('.pane[data-pane-for="tab-agent-terminal"].pane-active');
  const bodyText2 = await p.$eval('[data-testid="termbody"]', (e) => e.textContent);
  check(bodyText2.includes("compute (2+3)*4") && (bodyText2.includes("✓ 20") || /✓.*20/.test(bodyText2)),
        `state preserved: termbody still shows user echo AND FinalAnswer after tab-switch cycle`);

  // Sprint 007 — reload: last-model is pre-highlighted, but STATE.term.model resets (picker must be clicked)
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForSelector('[data-testid="modelpicker"]');
  await p.waitForFunction((m) => document.querySelector('#modelpicker')?.value === m, TEST_MODEL, { timeout: 5000 });
  const preSelected = await p.$eval('#modelpicker', (e) => e.value);
  check(preSelected === TEST_MODEL, `Sprint 007 PATH: after reload, #modelpicker.value === "${TEST_MODEL}" from localStorage`);
  check((await p.evaluate(() => window.__TERMINAL_V1_STATE?.term?.model)) === null,
        `Sprint 007 PATH: after reload, STATE.term.model is null until user re-picks (Architect ruling)`);
  check((await p.$eval('[data-testid="terminput"]', (e) => e.disabled)) === true,
        `Sprint 007 VALUE: after reload, terminput disabled until re-pick`);

  // ---- Sprint 009: Records rail port ----
  await p.click('[data-testid="tab-records"]');
  await p.waitForFunction(() => document.querySelectorAll('[data-testid="recordsrail"] .rec').length > 0, { timeout: 5000 });
  const recCount = await p.$$eval('[data-testid="recordsrail"] .rec', (els) => els.length);
  check(recCount > 0, `Sprint 009 NAME: rail has > 0 .rec elements (got ${recCount})`);
  const groups = await p.$$eval('[data-testid="recordsrail"] .rail-group', (els) => els.map((e) => e.textContent));
  check(groups.some((g) => /^demos$/i.test(g.trim())), `Sprint 009 VALUE: rail has a "demos" group header (got ${JSON.stringify(groups)})`);
  const firstRecName = await p.$$eval('[data-testid="recordsrail"] .rec', (els) => els[0]?.dataset.name);
  check(!!firstRecName, `Sprint 009 NAME: first .rec has data-name (got "${firstRecName}")`);
  const beforeSel = await p.evaluate(() => window.__TERMINAL_V1_STATE?._currentRecord);
  check(beforeSel === null, `Sprint 009 PATH: STATE._currentRecord === null before selection (got ${JSON.stringify(beforeSel)})`);
  await p.click(`[data-testid="rec-${firstRecName}"]`);
  await p.waitForFunction((n) => window.__TERMINAL_V1_STATE?._currentRecord === n, firstRecName);
  check((await p.evaluate(() => window.__TERMINAL_V1_STATE?._currentRecord)) === firstRecName,
        `Sprint 009 PATH: STATE._currentRecord === "${firstRecName}" after click`);
  const selCount = await p.$$eval('[data-testid="recordsrail"] .rec.sel', (els) => els.map((e) => e.dataset.name));
  check(selCount.length === 1 && selCount[0] === firstRecName,
        `Sprint 009 VALUE: exactly one .rec.sel and it matches the click (got ${JSON.stringify(selCount)})`);
  const topBar = await p.$eval('[data-testid="recordstopbar"]', (e) => e.textContent);
  check(topBar === firstRecName, `Sprint 009 VALUE: top bar shows selected record name (got "${topBar}")`);

  // ---- Sprint 010: subject rule wired; event stream + inspector read the selected record ----
  // The selectRecord fetch is async; wait for events to populate.
  await p.waitForFunction(() => window.__TERMINAL_V1_STATE?.events?.length > 0, { timeout: 5000 });
  const eventsLen = await p.evaluate(() => window.__TERMINAL_V1_STATE?.events?.length);
  check(eventsLen > 0, `Sprint 010 PATH: STATE.events populated after Records selection (got ${eventsLen})`);
  await p.click('[data-testid="tab-event-stream-inspector"]');
  await p.waitForSelector('[data-testid="eventstream"] .stream-line');
  const streamLineCount = await p.$$eval('[data-testid="eventstream"] .stream-line', (els) => els.length);
  check(streamLineCount === eventsLen, `Sprint 010 VALUE: stream-line count (${streamLineCount}) matches STATE.events length (${eventsLen})`);
  const transportText = await p.$eval('[data-testid="eventtransport"]', (e) => e.textContent);
  check(transportText.includes(firstRecName) && transportText.includes(`${eventsLen} events`),
        `Sprint 010 VALUE: transport shows record name + count (got "${transportText}")`);
  // Click first stream line; assert inspector populates, STATE.selectedEvent set (PATH)
  const firstSeq = await p.$eval('[data-testid="eventstream"] .stream-line:first-child', (e) => Number(e.dataset.seq));
  await p.click(`[data-testid="stream-line-${firstSeq}"]`);
  await p.waitForFunction((s) => window.__TERMINAL_V1_STATE?.selectedEvent?.seq === s, firstSeq);
  const selEv = await p.evaluate(() => window.__TERMINAL_V1_STATE?.selectedEvent);
  check(selEv && selEv.seq === firstSeq, `Sprint 010 PATH: STATE.selectedEvent.seq === ${firstSeq} after click`);
  const inspectorText = await p.$eval('[data-testid="inspector"]', (e) => e.textContent);
  check(inspectorText.includes(`seq ${firstSeq}`) && inspectorText.includes(selEv.kind),
        `Sprint 010 VALUE: inspector shows selected event kind + seq (got kind=${selEv.kind})`);

  // ---- Sprint 011: I/O tab ----
  await p.click('[data-testid="tab-io"]');
  await p.waitForSelector('[data-testid="io-input"]');
  const ioInputText = await p.$eval('[data-testid="io-input"]', (e) => e.textContent);
  check(ioInputText && ioInputText.trim() !== "no record selected" && ioInputText.trim() !== "no input recorded",
        `Sprint 011 VALUE: io-input shows real input for selected record (first 40 chars: "${ioInputText.slice(0, 40)}")`);
  // Count expected artifacts from STATE and compare to DOM
  const artifactCounts = await p.evaluate(() => {
    const ARTS = new Set(["FinalAnswer","SelectedPatch","RepairSummary","Verdict","Solved","Exhausted","Synthesis","CritiquePosted","BasketVerdict","Answer","Result"]);
    const stateCount = (window.__TERMINAL_V1_STATE?.events || []).filter((e) => ARTS.has(e.kind)).length;
    const domCount = document.querySelectorAll('[data-testid="io-artifacts"] .io-artifact').length;
    return { stateCount, domCount };
  });
  check(artifactCounts.stateCount === artifactCounts.domCount,
        `Sprint 011 PATH+VALUE: io-artifacts DOM count (${artifactCounts.domCount}) matches STATE events with artifact kinds (${artifactCounts.stateCount})`);

  // ---- Sprint 012: Topology structure tab ----
  await p.click('[data-testid="tab-topology-structure"]');
  await p.waitForFunction(() => window.__TERMINAL_V1_STATE?.topology != null, { timeout: 5000 });
  const grpCount = await p.$$eval('[data-testid="topopane"] .grp', (els) => els.length);
  check(grpCount === 5, `Sprint 012 VALUE: topology pane has 5 group headers (got ${grpCount})`);
  const grpLabels = await p.$$eval('[data-testid="topopane"] .grp', (els) => els.map((e) => e.textContent.trim()));
  check(grpLabels.some((l) => /producers/i.test(l)) && grpLabels.some((l) => /triggers/i.test(l)) &&
        grpLabels.some((l) => /views/i.test(l)) && grpLabels.some((l) => /routes/i.test(l)) &&
        grpLabels.some((l) => /termination/i.test(l)),
        `Sprint 012 VALUE: all five expected group headers present`);
  const topology = await p.evaluate(() => window.__TERMINAL_V1_STATE?.topology);
  check(topology && Array.isArray(topology.producers), `Sprint 012 PATH: STATE.topology fetched with producers array`);

  // ---- Sprint 013: Run-as-graph text summary ----
  // Pick a demo record with a real topology (deterministic calc has ~ single producer). demo_code_review has many.
  await p.click('[data-testid="tab-records"]');
  const demoRec = await p.$$eval('[data-testid="recordsrail"] .rec', (els) => {
    const c = els.find((e) => /code_review|debate|adversarial|game_of_life/.test(e.dataset.name));
    return (c || els[0]).dataset.name;
  });
  await p.click(`[data-testid="rec-${demoRec}"]`);
  await p.waitForFunction((n) => window.__TERMINAL_V1_STATE?._currentRecord === n, demoRec);
  await p.waitForFunction(() => window.__TERMINAL_V1_STATE?.events?.length > 0, { timeout: 5000 });
  await p.click('[data-testid="tab-run-as-graph"]');
  await p.waitForFunction(() => window.__TERMINAL_V1_STATE?.runGraph != null, { timeout: 5000 });
  const rowCount = await p.$$eval('[data-testid="graphpane"] .row', (els) => els.length);
  const stateRowCount = await p.evaluate(() => (window.__TERMINAL_V1_STATE?.runGraph?.instances || []).length);
  check(rowCount === stateRowCount, `Sprint 013 PATH+VALUE: run-as-graph rows (${rowCount}) match STATE.runGraph.instances (${stateRowCount})`);
  check(rowCount > 0, `Sprint 013 NAME: run-as-graph has > 0 producer rows for record ${demoRec}`);

  // ---- Sprint 014: Assays tab ----
  await p.click('[data-testid="tab-assays"]');
  await p.waitForFunction(() => document.querySelectorAll('[data-testid="assayspicker"] .assay-item').length > 0, { timeout: 5000 });
  const assayCount = await p.$$eval('[data-testid="assayspicker"] .assay-item', (els) => els.length);
  check(assayCount > 0, `Sprint 014 NAME: assays picker populated (${assayCount} assays)`);
  const firstAssay = await p.$$eval('[data-testid="assayspicker"] .assay-item', (els) => els[0].dataset.name);
  await p.click(`[data-testid="assay-${firstAssay}"]`);
  await p.waitForFunction((n) => window.__TERMINAL_V1_STATE?.selectedAssay === n, firstAssay);
  check((await p.evaluate(() => window.__TERMINAL_V1_STATE?.selectedAssay)) === firstAssay,
        `Sprint 014 PATH: STATE.selectedAssay === "${firstAssay}" after click`);
  await p.waitForSelector('[data-testid="assaysbody"] .field');
  const bodyRows = await p.$$eval('[data-testid="assaysbody"] .field', (els) => els.length);
  check(bodyRows >= 5, `Sprint 014 VALUE: assay body renders ≥ 5 field rows (got ${bodyRows})`);

  // ---- Sprint 015: Studio tab (placeholder — port pending; no iframe per Architect ruling) ----
  await p.click('[data-testid="tab-studio"]');
  await p.waitForSelector('[data-testid="studiopane"]');
  const studioText = await p.$eval('[data-testid="studiopane"]', (e) => e.textContent.trim());
  check(studioText === "studio — port pending",
        `Sprint 015 VALUE: studio pane shows placeholder text (got "${studioText}")`);

  await b.close();
  if (fails.length) { console.error("\nFAIL:\n  " + fails.join("\n  ")); process.exit(1); }
  console.log("\nPASS: terminal-v1 structural checks");
})().catch((e) => { console.error("crash:", e); process.exit(1); });
