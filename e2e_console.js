/* Live end-to-end test of the substrate-ui console — drives the REAL app in real Chrome against
   the REAL running server (no mocks). Asserts §7 holds in the rendered DOM: records load from the
   backend, the run-as-graph shows firing-anchored lifespans + the spawn-cohort band, provenance
   resolves, and the seq-cursor truncates the run in lock-step. Exit 0 = pass, 1 = fail.

   Run (server up on :8765, playwright installed somewhere):
     cd substrate && uv run python ../substrate-ui/server.py &      # the real backend
     NODE_PATH=/path/to/node_modules node substrate-ui/e2e_console.js
*/
"use strict";
const { chromium } = require("playwright");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const fails = [];
const check = (cond, msg) => { if (!cond) fails.push(msg); else console.log("  ok  " + msg); };

(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await b.newPage({ viewport: { width: 1680, height: 1010 } });
  const errors = [];
  p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  p.on("pageerror", (e) => errors.push(String(e.message)));

  await p.goto(BASE + "/", { waitUntil: "networkidle", timeout: 20000 });
  await p.waitForTimeout(2500);

  // 1) loads real records from the backend, zero errors
  check(errors.length === 0, "no console/page errors (" + errors.slice(0, 2).join("; ") + ")");
  const recCount = await p.$$eval(".rec", (e) => e.length);
  check(recCount >= 9, `record rail shows the bundled records (${recCount} >= 9)`);

  // 2) select code_review -> the run-as-graph renders 6 instances + the spawn-cohort band (§7.3)
  await p.evaluate(() => [...document.querySelectorAll(".rec")].find((e) => /code_review/.test(e.textContent)).click());
  await p.waitForTimeout(1200);
  const lanes = await p.$$eval(".lane", (e) => e.length);
  check(lanes === 6, `code_review run-as-graph has 6 Producer lanes (${lanes})`);
  const cohort = await p.$eval(".cohort .ct", (e) => e.textContent).catch(() => null);
  check(cohort && /5 concurrent/.test(cohort), `spawn-cohort band reads "${cohort}" (5 concurrent reviewers)`);
  const cancelled = await p.$$eval(".bar.cancelled", (e) => e.length);
  check(cancelled === 2, `2 reviewers rendered cancelled (cancel-others) (${cancelled})`);
  const verdict = await p.$eval("#verdict", (e) => e.textContent.trim());
  check(/FINALISED/.test(verdict), `health verdict from run_graph.status: "${verdict}"`);

  // 3) provenance: click the judge lane -> the inspector shows its cause + ancestry
  await p.evaluate(() => { const l = [...document.querySelectorAll(".lane")].find((e) => /judge/.test(e.textContent)); if (l) l.click(); });
  await p.waitForTimeout(700);
  const insp = await p.$eval("#insp", (e) => e.textContent);
  check(/adjudicate/.test(insp) && /ancestry/i.test(insp), "provenance inspector shows the judge's Trigger + ancestry");

  // 4) the one seq-cursor truncates in lock-step: scrub before the judge spawns (seq 14) -> no judge lane
  await p.evaluate(() => { const s = document.getElementById("seq"); s.value = 13; s.oninput({ target: s }); });
  await p.waitForTimeout(500);
  const lanesAt13 = await p.$$eval(".lane", (e) => e.length);
  check(lanesAt13 < 6, `scrub to seq 13: the judge has not spawned yet (${lanesAt13} lanes < 6)`);

  // 5) §7.2 demonstrable on REAL non-clean records (finding 2) + the verdict NOT-CLEAN fix (finding 3)
  const selectRec = async (name) => {
    await p.evaluate((n) => { const r = [...document.querySelectorAll(".rec")].find((e) => e.querySelector(".nm").textContent.trim() === n); if (r) r.click(); }, name);
    await p.waitForTimeout(700);
  };
  const getVerdict = () => p.$eval("#verdict", (e) => e.textContent.trim() + " | " + e.className);
  await selectRec("demo_failed"); let vt = await getVerdict();
  check(/FAILED/.test(vt) && /v-failed/.test(vt), `demo_failed -> red FAILED verdict ("${vt}")`);
  await selectRec("demo_paused"); vt = await getVerdict();
  check(/PAUSED/.test(vt) && /v-paused/.test(vt), `demo_paused -> cyan PAUSED verdict ("${vt}")`);
  await selectRec("demo_broken"); vt = await getVerdict();
  check(/NOT CLEAN/.test(vt), `demo_broken -> verdict says NOT CLEAN ("${vt}") [finding 3]`);

  // 6) cohort fix (finding 1): natural_conversation's per-turn 4-way concurrency now bands by parent
  await selectRec("natural_conversation");
  await p.waitForTimeout(300);
  const cohorts = await p.$$eval(".cohort .ct", (els) => els.map((e) => e.textContent));
  check(cohorts.some((t) => /4 concurrent/.test(t)), `natural_conversation bands a 4-way cohort by parent (${JSON.stringify(cohorts.slice(0, 4))})`);

  // 7) diff surface: demo_diff_a vs demo_diff_b -> first divergence by seq (D-8)
  await selectRec("demo_diff_a");
  await p.evaluate(() => { const s = document.getElementById("diffsel"); s.value = "demo_diff_b"; s.onchange(); });
  await p.waitForTimeout(600);
  const diffText = (await p.$eval("#insp", (e) => e.textContent)).replace(/\s+/g, " ");
  check(/first divergence at seq 5/.test(diffText), `diff a-vs-b renders first divergence at seq 5 ("${diffText.slice(0, 60)}")`);

  // 8) I/O surface: demo_solo_chat — the seed in, the Message artifact out (toggle to I/O)
  await selectRec("demo_solo_chat");
  await p.evaluate(() => document.getElementById("modeToggle").click());
  await p.waitForTimeout(500);
  const ioText = (await p.$eval("#iopane", (e) => e.textContent)).replace(/\s+/g, " ");
  check(/Summarize the Q3 incident report/.test(ioText) && /Message/.test(ioText),
    `I/O shows the seed (input) + the Message artifact ("${ioText.slice(0, 70)}")`);
  check(/baseline/.test(ioText) && /q3_incidents/.test(ioText),
    `I/O surfaces the baseline channel (fixtures/seeds) [review #34]`);

  // 9) thin control: launch a bundled topology from the UI -> a real run appears + is read (§7.7)
  const before = await p.$$eval(".rec", (e) => e.length);
  await p.evaluate(() => { const s = document.getElementById("launchsel"); s.value = "debate"; });
  await p.evaluate(() => document.getElementById("launchbtn").click());
  await p.waitForTimeout(3000);  // the launch RUNS the topology server-side
  const after = await p.$$eval(".rec", (e) => e.length);
  const launchMsg = await p.$eval("#launchmsg", (e) => e.textContent);
  check(after > before && /launch_debate.*finalised/.test(launchMsg), `launch debate (fast) -> a new finalised run appears (${before}->${after}, "${launchMsg}")`);

  // 10) live-attach: launch a SLOW topology -> the console FOLLOWS it (verdict LIVE) -> FINALISED.
  // The live-follow context renders no-terminal as LIVE (not amber-incomplete) — resolves #33.
  await p.evaluate(() => { document.getElementById("launchsel").value = "live_demo"; });
  await p.evaluate(() => document.getElementById("launchbtn").click());
  await p.waitForTimeout(900);  // launch returns fast (~0.1s); should be following now
  const liveV = await p.$eval("#verdict", (e) => e.textContent.trim() + " | " + e.className);
  check(/LIVE/.test(liveV) && /v-live/.test(liveV), `live launch -> verdict LIVE while the run is being written ("${liveV}")`);
  await p.waitForTimeout(4200);  // the ~3s run finishes; the follow stops on the terminal
  const doneV = await p.$eval("#verdict", (e) => e.textContent.trim());
  check(/FINALISED/.test(doneV), `live run -> verdict becomes FINALISED when the run reaches its terminal ("${doneV}")`);

  // 11) a static TORN record (no terminal, not live) -> amber INCOMPLETE, NEVER "LIVE" (§7.2; #36 hole)
  await selectRec("demo_torn");
  await p.waitForTimeout(500);
  const tornV = await p.$eval("#verdict", (e) => e.textContent.trim() + " | " + e.className);
  check(/INCOMPLETE/.test(tornV) && /v-incomplete/.test(tornV) && !/LIVE/.test(tornV),
    `torn record -> amber INCOMPLETE, not LIVE ("${tornV}")`);

  // 12) thin control: RESUME a paused run -> feed the awaited input -> the continuation finalises (C1)
  await selectRec("demo_resumable");
  await p.waitForTimeout(500);
  const resumeShown = await p.$eval("#resumebtn", (e) => e.style.display !== "none");
  const pausedV = await p.$eval("#verdict", (e) => e.textContent.trim());
  check(resumeShown && /PAUSED/.test(pausedV), `paused resumable run -> resume button shown ("${pausedV}")`);
  // sample the verdict throughout resume -> it must NEVER flash a false "NOT CLEAN" (the run is clean;
  // the selectRecord staleness guard + conditional auto-select kill the race — review #38 obs b).
  let sawNotClean = false;
  await p.evaluate(() => document.getElementById("resumebtn").click());
  for (let i = 0; i < 14; i++) {
    await p.waitForTimeout(250);
    if (/NOT CLEAN/.test(await p.$eval("#verdict", (e) => e.textContent))) sawNotClean = true;
  }
  const resumedV = await p.$eval("#verdict", (e) => e.textContent.trim());
  const resumedMsg = await p.$eval("#launchmsg", (e) => e.textContent);
  check(/FINALISED/.test(resumedV) && /resumed/.test(resumedMsg) && !sawNotClean,
    `resume -> FINALISED, no false NOT-CLEAN flicker ("${resumedV}", flicker=${sawNotClean})`);
  // obs a: the pause-interrupted stage1 renders "interrupted" (amber dashed), NOT a blue "running"
  // lane in a finished run (a finished run must not show live work).
  const runningBars = await p.$$eval(".bar.running", (e) => e.length);
  const interruptedBars = await p.$$eval(".bar.interrupted", (e) => e.length);
  check(runningBars === 0 && interruptedBars >= 1, `resumed run shows stage1 interrupted, no "running" lanes (run=${runningBars}, intr=${interruptedBars})`);

  await b.close();
  if (fails.length) { console.error("\nFAILED:\n  - " + fails.join("\n  - ")); process.exit(1); }
  console.log("\nE2E PASS — the live console renders the real backend, §7 honored.");
})().catch((e) => { console.error("E2E ERROR", e); process.exit(1); });
