/* Perceptual capture — DYNAMIC + EDGE states the static key-frame pass (capture_console.js) doesn't
   cover: the live ● LIVE pulse mid-write, a torn record's amber INCOMPLETE, the resume result + the
   interrupted-stage bar, the event-click inspector (distinct from lane-click provenance), and the
   seq-cursor at its start edge. Same repo-local Playwright + real Chrome + real backend. Run:
     cd substrate && uv run python ../substrate-ui/server.py &
     cd substrate-ui && npm run capture:states
   Then VIEW screenshots/2*-*.png. (Creates launch_/resume_ records; clean runs/ afterward.)
*/
"use strict";
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const OUT = path.join(__dirname, "screenshots");

const selectRec = async (p, name) => {
  await p.evaluate((n) => {
    const r = [...document.querySelectorAll(".rec")].find(
      (e) => e.querySelector(".nm") && e.querySelector(".nm").textContent.trim() === n);
    if (r) r.click();
  }, name);
  await p.waitForTimeout(700);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await b.newPage({ viewport: { width: 1680, height: 1010 }, deviceScaleFactor: 2 });
  const shot = async (name, note) => {
    await p.screenshot({ path: path.join(OUT, name + ".png") });
    console.log("  shot  " + name + ".png  — " + note);
  };
  await p.goto(BASE + "/", { waitUntil: "networkidle", timeout: 20000 });
  await p.waitForTimeout(2000);

  // 20) torn record -> amber INCOMPLETE verdict (a no-terminal, not-live record)
  await selectRec(p, "demo_torn");
  await shot("20-torn-incomplete", "amber INCOMPLETE verdict (torn, no terminal, not live)");

  // 21) event-click inspector (distinct from lane-click provenance): click an event in the stream
  await selectRec(p, "code_review");
  await p.evaluate(() => {
    const ev = [...document.querySelectorAll(".ev")].find((e) => /VerdictRendered/.test(e.textContent));
    if (ev) ev.click();
  });
  await p.waitForTimeout(500);
  await shot("21-event-inspector", "event-click inspector: VerdictRendered event detail (not lane provenance)");

  // 22) seq cursor at the START edge (seq 0) — the run at its very beginning, just RunStarted
  await selectRec(p, "natural_conversation");
  await p.evaluate(() => { const s = document.getElementById("toStart"); if (s) s.click(); });
  await p.waitForTimeout(500);
  await shot("22-seq-zero", "seq cursor at 0 (toStart): run at its beginning, no producers spawned yet");

  // 23) LIVE launch -> the ● LIVE pulsing verdict while the run is still being written
  await p.evaluate(() => { const s = document.getElementById("launchsel"); if (s) s.value = "live_demo"; });
  await p.evaluate(() => { const btn = document.getElementById("launchbtn"); if (btn) btn.click(); });
  await p.waitForTimeout(1100);  // launch returns fast (~0.1s); should be following + LIVE now
  await shot("23-live-pulse", "live launch: ● LIVE verdict + run-as-graph growing while written");

  // 24) the same live run, after it reaches its terminal -> FINALISED
  await p.waitForTimeout(5000);
  await shot("24-live-finalised", "the live run reached its terminal -> ● FINALISED (follow stopped)");

  // 25) resume a paused run -> FINALISED + the interrupted stage1 bar (amber dashed, not blue running)
  await selectRec(p, "demo_resumable");
  await p.evaluate(() => { const btn = document.getElementById("resumebtn"); if (btn) btn.click(); });
  await p.waitForTimeout(3500);
  await shot("25-resume-result", "resume -> FINALISED; stage1 shows interrupted (amber dashed), no running lane");

  await b.close();
  console.log("\nDYNAMIC CAPTURE DONE — view screenshots/2*-*.png, then grade. (Clean runs/ of launch_/resume_ after.)");
})().catch((e) => { console.error("CAPTURE ERROR", e); process.exit(1); });
