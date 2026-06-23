/* Live end-to-end test of the substrate-ui console — drives the REAL app in real Chrome against
   the REAL running server (no mocks). Asserts §7 holds in the rendered DOM: records load from the
   backend, the run-as-graph shows firing-anchored lifespans + the spawn-cohort band, provenance
   resolves, and the seq-cursor truncates the run in lock-step. Exit 0 = pass, 1 = fail.

   Playwright is a repo-local devDependency (run `npm install` once in substrate-ui/; it drives the
   system Chrome via channel:'chrome', so no browser download). Run:
     cd substrate && uv run python ../substrate-ui/server.py &      # the real backend on :8765
     cd substrate-ui && npm run e2e                                 # drives real Chrome; exit 0 = pass
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
  // the rail groups demos vs your-runs (Drift watchlist fold): a "demos" header + a "your runs"
  // header (runs/ session records, newest-first), so accumulating runs stay corralled + scannable.
  const groups = await p.$$eval(".rail-group", (els) => els.map((e) => e.textContent.trim()));
  check(groups.some((g) => /^demos$/i.test(g)) && groups.some((g) => /your runs/i.test(g)), `rail groups demos vs your-runs (${groups.join(" | ")})`);

  // 2) select code_review -> the run-as-graph renders 6 instances + the spawn-cohort band (§7.3)
  await p.evaluate(() => [...document.querySelectorAll(".rec")].find((e) => /code_review/.test(e.textContent)).click());
  await p.waitForTimeout(1200);
  const lanes = await p.$$eval(".lane", (e) => e.length);
  check(lanes === 6, `code_review run-as-graph has 6 Producer lanes (${lanes})`);
  const cohort = await p.$eval(".cohort .ct", (e) => e.textContent).catch(() => null);
  check(cohort && /5 concurrent/.test(cohort), `spawn-cohort band reads "${cohort}" (5 concurrent reviewers)`);
  const cancelled = await p.$$eval(".bar.cancelled", (e) => e.length);
  check(cancelled === 2, `2 reviewers rendered cancelled (cancel-others) (${cancelled})`);
  // two-segment lanes (legibility fix): each lane = queued (fired->started, faint) + ran
  // (started->ended, solid); the spawn dot marks the START of the run (the bar's left edge), NOT
  // the end. (Diagnosed by correlating run_graph fired/started/ended with the rendered geometry.)
  const segOk = await p.$$eval(".lane", (els) => els.every((l) => {
    const bar = l.querySelector(".bar"), dot = l.querySelector(".spawn"), q = l.querySelector(".qbar");
    if (!bar || !dot) return !!q;  // a not-yet-started lane is queued-only — still valid
    return !!q && Math.abs(parseFloat(dot.style.left) - parseFloat(bar.style.left)) < 0.5;
  }));
  check(segOk, "run-as-graph lanes split queued|ran with the spawn dot at the run START (bar left), not the end");
  const verdict = await p.$eval("#verdict", (e) => e.textContent.trim());
  check(/FINALISED/.test(verdict), `health verdict from run_graph.status: "${verdict}"`);

  // 2b) static topology-structure view (sprint 002 — the design-§6 read-side gap the perceptual
  // verification surfaced): toggle to TOPOLOGY -> authored structure (initial Producers + the
  // adjudicate Trigger); toggle back -> the run-as-graph lanes return.
  await p.evaluate(() => document.getElementById("gvTopo").click());
  await p.waitForTimeout(400);
  const topoText = (await p.$eval("#graph", (e) => e.textContent)).replace(/\s+/g, " ");
  check(/reviewer-security/.test(topoText) && /initial/.test(topoText) && /adjudicate/.test(topoText) && /starts judge/.test(topoText),
    `topology view: authored Producers (initial-marked) + the adjudicate Trigger ("${topoText.slice(0, 64)}")`);
  const lanesInTopo = await p.$$eval(".lane", (e) => e.length);
  check(lanesInTopo === 0, `topology view is static structure, not run lanes (${lanesInTopo} lanes)`);
  await p.evaluate(() => document.getElementById("gvRun").click());
  await p.waitForTimeout(400);
  check((await p.$$eval(".lane", (e) => e.length)) === 6, "toggle back to run-as-graph restores the 6 lanes");

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

  // 7b) perceptual-pass regression (the stale-inspector bug the screenshot capture found, the DOM
  // E2E missed): switching records MUST clear the inspector — else the prior record's diff/provenance
  // bleeds into the next one (e.g. a diff of two OTHER records showing while viewing demo_paused).
  await selectRec("demo_paused");
  const inspAfterSwitch = await p.$eval("#insp", (e) => e.textContent);
  check(/Select an event or a Producer/.test(inspAfterSwitch) && !/divergence|demo_diff/.test(inspAfterSwitch),
    `inspector clears on record switch — no stale diff/provenance bleeds through ("${inspAfterSwitch.trim().slice(0, 44)}")`);

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

  // 13) scene panel (sprint 008): game_of_life renders its Generation.grid as a cursor-driven cell
  // grid; the tab is SHAPE-detected — visible for a record carrying a 2-D numeric field, hidden
  // otherwise. (Structural track — moved here from capture_scene.js so CI gates it; review #49 fold 1.)
  await selectRec("game_of_life");
  await p.waitForTimeout(500);
  const sceneVisible = await p.$eval("#gvScene", (e) => getComputedStyle(e).display !== "none");
  check(sceneVisible, "scene tab appears for game_of_life (a renderable 2-D grid shape)");
  // section 8 left the centre in I/O mode (readpane hidden); return to the graph pane so the scene
  // can render into #graph before we assert its cells.
  await p.evaluate(() => { if (document.getElementById("readpane").style.display === "none") document.getElementById("modeToggle").click(); });
  await p.waitForTimeout(200);
  await p.evaluate(() => document.getElementById("gvScene").click());
  await p.waitForTimeout(300);
  const cells = await p.$$eval(".scene-grid .cell", (e) => e.length);
  check(cells === 25, `scene renders the 5x5 grid (${cells} cells)`);
  const liveIdx = async () => p.$$eval(".scene-grid .cell", (cs) => cs.map((c, i) => c.classList.contains("on") ? i : -1).filter((i) => i >= 0));
  const setSeq = async (v) => { await p.evaluate((val) => { const s = document.getElementById("seq"); s.value = val; s.oninput({ target: s }); }, v); await p.waitForTimeout(200); };
  await setSeq(3); const g0 = await liveIdx();      // gen0: vertical blinker
  await setSeq(132); const g1 = await liveIdx();    // gen1: horizontal blinker
  check(g0.length === 3 && g1.length === 3, `blinker has 3 live cells each generation (g0=${g0.length}, g1=${g1.length})`);
  check(JSON.stringify(g0) !== JSON.stringify(g1), `the cursor drives the scene: live cells move gen0->gen1 (the blinker oscillates) g0=${JSON.stringify(g0)} g1=${JSON.stringify(g1)}`);
  await selectRec("code_review");
  await p.waitForTimeout(300);
  const sceneHidden = await p.$eval("#gvScene", (e) => getComputedStyle(e).display === "none");
  check(sceneHidden, "scene tab hidden for code_review (no renderable 2-D grid shape)");

  // 14) replay Transport (sprint 009): play advances the cursor through the run; pause holds it;
  // reaching the end stops; replaying from the end rewinds to 0. Read the cursor STATE (#seqnow) as
  // the signal — the cursor value IS the replay position, not the animation.
  await selectRec("game_of_life");
  await p.waitForTimeout(300);
  await p.evaluate(() => { const s = document.getElementById("seq"); s.value = 0; s.oninput({ target: s }); });
  const seqNow = () => p.$eval("#seqnow", (e) => +e.textContent);
  const sMax = await p.$eval("#seqmax", (e) => +e.textContent);
  const s0 = await seqNow();
  await p.evaluate(() => document.getElementById("play").click());   // play
  await p.waitForTimeout(700);
  const s1 = await seqNow();
  check(s1 > s0, `play advances the cursor through the run (#seqnow ${s0} -> ${s1})`);
  check(/⏸/.test(await p.$eval("#play", (e) => e.textContent)), "play button shows pause (⏸) while playing");
  await p.evaluate(() => document.getElementById("play").click());   // pause
  await p.waitForTimeout(150);
  const s2 = await seqNow();
  await p.waitForTimeout(500);
  check((await seqNow()) === s2, `pause holds the cursor (held at ${s2})`);
  // play to the end at TOP speed: rAF decouples advance-rate from render-rate, so 480/s reaches the
  // end of a 200-seq tail fast — the old per-tick-render loop (~60/s) could NOT finish 200 seqs in
  // this window, so reaching max here proves the decoupling, not just that play stops at the end.
  await p.evaluate((m) => { const s = document.getElementById("seq"); s.value = Math.max(0, m - 200); s.oninput({ target: s }); const sp = document.getElementById("speedsel"); sp.value = "480"; sp.onchange(); document.getElementById("play").click(); }, sMax);
  await p.waitForTimeout(1500);
  const sEnd = await seqNow();
  check(sEnd === sMax, `top-speed play clears a 200-seq tail and stops at the end (seq ${sEnd} == max ${sMax}); rAF-decoupled, not render-bound`);
  check(/▶/.test(await p.$eval("#play", (e) => e.textContent)), "at the end the play button returns to ▶");
  // replay from the end -> clicking play rewinds to ~0 and advances (slow speed so it stays near 0)
  await p.evaluate(() => { const sp = document.getElementById("speedsel"); sp.value = "30"; sp.onchange(); document.getElementById("play").click(); });
  await p.waitForTimeout(450);
  const sReplay = await seqNow();
  check(sReplay > 0 && sReplay < Math.floor(sMax / 2), `replay from the end rewinds to ~0 and advances (seq ${sReplay})`);
  await p.evaluate(() => document.getElementById("play").click());   // stop

  // 15) terminal (sprint 010): a read interface over the same record. Open it; cat an application
  // event -> the dock shows its full payload (the content); narrate -> the legible beats with seq + t.
  // Read the DOCK TEXT as the signal. Also: the event stream now carries a relative timestamp (t+).
  await selectRec("pair_coding");
  await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById("termOpen").click());
  await p.waitForTimeout(150);
  const appseq = await p.evaluate(() => (STATE.events.find((e) => !e.kind.startsWith("substrate.")) || {}).seq);
  await p.fill("#terminput", "cat " + appseq); await p.press("#terminput", "Enter");
  await p.waitForTimeout(250);
  let dock = await p.$eval("#termbody", (e) => e.innerText);
  check(/"text"/.test(dock) && /solution\.py/.test(dock), `terminal cat <seq> prints the application event's full payload (the content)`);
  await p.fill("#terminput", "narrate"); await p.press("#terminput", "Enter");
  await p.waitForTimeout(250);
  dock = await p.$eval("#termbody", (e) => e.innerText);
  check(/RunFinalised/.test(dock) && /t\+/.test(dock), "terminal narrate prints the legible beats with seq + t");
  await p.evaluate(() => document.getElementById("termClose").click());
  const streamHasT = await p.$$eval(".ev .tt", (els) => els.length > 0 && /t\+/.test(els[0].textContent));
  check(streamHasT, "the event stream shows a relative timestamp (t+) alongside seq");

  // 16) content views (sprint 011): the inspector renders application CONTENT readable, and output
  // artifacts are clickable. On pair_coding: a CodeChunk event -> a content block with the real code;
  // an output artifact in the I/O pane -> clickable, inspects it.
  await selectRec("pair_coding");
  await p.waitForTimeout(300);
  await p.evaluate(() => { if (document.getElementById("readpane").style.display === "none") document.getElementById("modeToggle").click(); });
  await p.waitForTimeout(150);
  const ccseq = await p.evaluate(() => (STATE.events.find((e) => e.kind === "CodeChunk") || {}).seq);
  await p.evaluate((s) => { const el = [...document.querySelectorAll(".ev")].find((e) => +e.dataset.seq === s); if (el) el.click(); }, ccseq);
  await p.waitForTimeout(200);
  const insp1 = await p.$eval("#insp", (e) => e.innerText);
  check(/def solve/.test(insp1), "inspector renders the CodeChunk content readable (the real code 'def solve')");
  await p.evaluate(() => document.getElementById("modeToggle").click());  // to I/O
  await p.waitForTimeout(300);
  await p.evaluate(() => { const a = document.querySelector("#iopane .art[data-seq]"); if (a) a.click(); });
  await p.waitForTimeout(200);
  const insp2 = await p.$eval("#insp", (e) => e.innerText);
  check(/seq \d/.test(insp2) && !/Select an event or a Producer/.test(insp2), "clicking an output artifact inspects it (BACKLOG: inspector works on artifacts)");
  await p.evaluate(() => document.getElementById("modeToggle").click());  // back to read

  await b.close();
  if (fails.length) { console.error("\nFAILED:\n  - " + fails.join("\n  - ")); process.exit(1); }
  console.log("\nE2E PASS — the live console renders the real backend, §7 honored.");
})().catch((e) => { console.error("E2E ERROR", e); process.exit(1); });
