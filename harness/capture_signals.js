// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/* Sprint 021+022 fixture capture — drives the console through records, record-load, view toggles,
   cursor + transport, and prune in real Chrome against the real backend, then dumps window.__signals
   to a JSONL under captures/sprint-NNN/. The grader (tools/capture-grade.ts) reads that file.

   Usage:
     cd substrate && uv run python ../substrate-ui/server.py &
     cd substrate-ui && node harness/capture_signals.js [sprint-id]

   Default sprint id is 021. Overrideable so later sprints can extend the fixture in place.
*/
"use strict";
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const SPRINT = process.argv[2] || "021";
const OUT_DIR = path.join(__dirname, "..", "captures", `sprint-${SPRINT}`);
const OUT_FILE = path.join(OUT_DIR, "console.jsonl");

const waitSig = (p, name, timeout = 5000) =>
  p.waitForFunction((n) => (window.__signals || []).some((s) => s.name === n), name, { timeout });

const countSig = (p, name) =>
  p.evaluate((n) => (window.__signals || []).filter((s) => s.name === n).length, name);

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on("dialog", (d) => d.accept());  // auto-accept the your-runs clear confirm

  await p.goto(BASE + "/", { waitUntil: "networkidle", timeout: 20000 });
  await waitSig(p, "RECORD_LOADED", 10000);
  await waitSig(p, "GRAPH_RENDERED");
  await waitSig(p, "HEALTH_RENDERED");

  // ensure a your-runs record exists so the prune has something to clear + a game_of_life record
  // exists (its Generation.grid unlocks the scene tab). Launch, wait, refresh the rail.
  await p.evaluate(() => fetch("/api/launch?topology=game_of_life", { method: "POST" }).then((r) => r.json()));
  await p.waitForTimeout(700);
  await p.evaluate(() => loadRecords());
  await p.waitForFunction(() => document.querySelector(".rail-clear") !== null, null, { timeout: 5000 });

  // select the fresh game_of_life run (its scene tab is renderable)
  const beforeSelects = await countSig(p, "RECORD_SELECTED");
  await p.evaluate(() => {
    const el = [...document.querySelectorAll(".rec")].find((e) => /game_of_life/.test(e.textContent));
    if (el) el.click();
  });
  await p.waitForFunction((n) => (window.__signals || []).filter((s) => s.name === "RECORD_SELECTED").length > n, beforeSelects, { timeout: 5000 });
  await p.waitForFunction(() => {
    const sigs = window.__signals || [];
    const lastSel = [...sigs].reverse().find((s) => s.name === "RECORD_SELECTED");
    if (!lastSel) return false;
    return sigs.some((s) => s.name === "RECORD_LOADED" && s.ts > lastSel.ts && s.payload.name === lastSel.payload.name);
  }, null, { timeout: 10000 });

  // diff subsystem: pick the second non-empty diff option and let renderDiff run
  await p.evaluate(() => {
    const sel = document.getElementById("diffsel");
    const other = [...sel.options].map((o) => o.value).filter((v) => v).find((v) => true);
    if (other) { sel.value = other; sel.onchange(); }
  });
  await waitSig(p, "DIFF_REQUESTED");
  await waitSig(p, "DIFF_RENDERED", 10000);

  // assay subsystem: click the first .assay row if any exist in this environment
  const hasAssay = await p.evaluate(() => document.querySelector(".assay") !== null);
  if (hasAssay) {
    await p.evaluate(() => document.querySelector(".assay").click());
    await waitSig(p, "ASSAY_SELECTED");
    await waitSig(p, "ASSAY_REPORT_LOADED", 15000);
    // return to a record view for the subsequent view-toggle checks
    await p.evaluate(() => {
      const el = [...document.querySelectorAll(".rec")].find((e) => /game_of_life/.test(e.textContent));
      if (el) el.click();
    });
    await p.waitForFunction(() => document.getElementById("gvScene") !== null, null, { timeout: 5000 });
  }

  // view subsystem: toggle topology → back to run → scene → io → back
  await p.evaluate(() => document.getElementById("gvTopo").click());
  await waitSig(p, "TOPOLOGY_RENDERED");
  await p.evaluate(() => document.getElementById("gvRun").click());
  const gTopoAfter = await countSig(p, "GRAPH_RENDERED");
  await p.waitForFunction((n) => (window.__signals || []).filter((s) => s.name === "GRAPH_RENDERED").length > n, gTopoAfter - 1, { timeout: 5000 });
  await p.evaluate(() => document.getElementById("gvScene").click());
  await waitSig(p, "SCENE_RENDERED");
  await p.evaluate(() => document.getElementById("modeToggle").click());   // → io
  await waitSig(p, "IO_RENDERED");
  await p.evaluate(() => document.getElementById("modeToggle").click());   // → back to graph

  // speed + play + cursor
  await p.evaluate(() => { const sel = document.getElementById("speedsel"); sel.value = "120"; sel.onchange(); });
  await waitSig(p, "SPEED_CHANGED");
  await p.evaluate(() => document.getElementById("play").click());
  await waitSig(p, "PLAY_STARTED");
  await p.waitForTimeout(700);
  await p.evaluate(() => document.getElementById("play").click());
  await waitSig(p, "PLAY_STOPPED");
  await p.evaluate(() => { const s = document.getElementById("seq"); s.value = "3"; s.oninput({ target: s }); });
  await waitSig(p, "CURSOR_MOVED");

  // inspector: return to run view so .lane[data-inst] exists in the graph, then click one event
  // row and one producer lane so the fixture carries both inspects.
  await p.evaluate(() => document.getElementById("gvRun").click());
  await p.waitForFunction(() => document.querySelector("#graph .lane[data-inst]") !== null, null, { timeout: 5000 });
  await p.evaluate(() => { const e = document.querySelector("#stream .ev[data-seq]"); if (e) e.click(); });
  await waitSig(p, "EVENT_INSPECTED");
  await p.evaluate(() => { const l = document.querySelector("#graph .lane[data-inst]"); if (l) l.click(); });
  await waitSig(p, "PRODUCER_INSPECTED");

  // (Sprint 037c: the legacy terminal dock subsystem was retired; its eleven tags —
  // TERMINAL_OPENED, TERMINAL_CLOSED, MODEL_SELECTED, PARAMS_CHANGED, CHAT_ENTERED,
  // CHAT_EXITED, TURN_SUBMITTED, AGENT_LAUNCH_REQUESTED, AGENT_LAUNCHED,
  // AGENT_TURN_STREAMED, FINAL_ANSWER_RENDERED — dropped from v0.7.3. Terminal-view
  // coverage lives in capture_terminal_*.js.)

  // topology launch + studio-link click. Pick the first non-empty option; click launchbtn.
  await p.evaluate(() => {
    const sel = document.getElementById("launchsel");
    const alt = [...sel.options].map((o) => o.value).find((v) => v);
    if (alt) sel.value = alt;
  });
  await p.evaluate(() => document.getElementById("launchbtn").click());
  await waitSig(p, "TOPOLOGY_LAUNCH_REQUESTED");
  await waitSig(p, "TOPOLOGY_LAUNCHED", 10000);
  // launchbtn selectRecord()s the new run; wait for its RECORD_LOADED so the RECORD_SELECTED it
  // just emitted has its matching pair inside the fixture window (else the grader flags a stale
  // RECORD_SELECTED as an unmatched pair).
  const newRunName = await p.evaluate(() => {
    const last = [...(window.__signals || [])].reverse().find((s) => s.name === "TOPOLOGY_LAUNCHED");
    return last ? last.payload.run_name : null;
  });
  if (newRunName) {
    await p.waitForFunction(
      (n) => (window.__signals || []).some((s) => s.name === "RECORD_LOADED" && s.payload.name === n),
      newRunName,
      { timeout: 10000 },
    );
  }
  // studio link — preventDefault fires the emit synchronously; the 50ms setTimeout would navigate
  // away but the harness snapshots before then.
  await p.evaluate(() => document.getElementById("studiolink").click());
  await waitSig(p, "STUDIO_OPENED");

  // incident coverage: force a topology-launch rejection with a bogus name, then a bad-name fetch
  // via the shared api() helper. Both emit their vocab-required payloads and grade at Sprint 028.
  await p.evaluate(() => {
    const sel = document.getElementById("launchsel");
    const opt = document.createElement("option");
    opt.value = "does_not_exist"; opt.textContent = "does_not_exist"; sel.appendChild(opt);
    sel.value = "does_not_exist";
    document.getElementById("launchbtn").click();
  });
  await waitSig(p, "LAUNCH_REJECTED", 10000);
  await p.evaluate(() => window.api("/api/records/DOES_NOT_EXIST").catch(() => null));
  await waitSig(p, "FETCH_FAILED", 5000);

  // prune the your-runs group
  await p.evaluate(() => document.querySelector(".rail-clear").click());
  await waitSig(p, "RECORDS_PRUNED");

  // trigger the unload emit before closing the page
  await p.evaluate(() => window.dispatchEvent(new Event("beforeunload")));
  const signals = await p.evaluate(() => window.__signals || []);
  fs.writeFileSync(OUT_FILE, signals.map((s) => JSON.stringify(s)).join("\n") + "\n");
  console.log(`wrote ${signals.length} signals to ${OUT_FILE}`);
  await b.close();
})().catch((e) => { console.error("CAPTURE ERROR", e); process.exit(1); });
