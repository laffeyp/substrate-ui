// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/* Perceptual-signal capture for the substrate-ui console — the SECOND track of the two-track
   visual grading the observation contract requires (AGENTS.md hard rule 9; foundation 01 signal
   type #2 "Screenshots at Key Frames"; TECHNIQUES Visual/UI "Two-track visual grading"). The live
   E2E (e2e_console.js) is the STRUCTURAL track (DOM assertions). This is the PERCEPTUAL track: it
   drives the real console in real Chrome against the real backend and saves a screenshot at each
   key frame, so a vision-model judge can verify it LOOKS the way it should — not just that the DOM
   text matches. Screenshots land in screenshots/ (gitignored); the agent then Reads each PNG.

   Playwright is a repo-local devDependency (npm install once). Run:
     cd substrate && uv run python ../substrate-ui/server.py &      # the real backend on :8765
     cd substrate-ui && npm run capture                             # writes screenshots/NN-*.png
*/
"use strict";
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const OUT = path.join(__dirname, "..", "screenshots");

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
  const shots = [];
  const shot = async (name, note) => {
    const file = path.join(OUT, name + ".png");
    await p.screenshot({ path: file });
    shots.push({ name, note });
    console.log("  shot  " + name + ".png  — " + note);
  };

  await p.goto(BASE + "/", { waitUntil: "networkidle", timeout: 20000 });
  await p.waitForTimeout(2000);
  await shot("01-default-load", "initial console: rail + whichever record auto-selected");

  await selectRec(p, "code_review");
  await shot("02-code_review-graph", "run-as-graph: 6 lanes, spawn-cohort band, FINALISED verdict, 2 cancelled");

  await p.evaluate(() => document.getElementById("gvTopo").click());
  await p.waitForTimeout(400);
  await shot("02b-topology-structure", "static topology-structure view: authored Producers/Triggers/Views/Routes/Termination (design §6)");
  await p.evaluate(() => document.getElementById("gvRun").click());
  await p.waitForTimeout(300);

  await p.evaluate(() => { const l = [...document.querySelectorAll(".lane")].find((e) => /judge/.test(e.textContent)); if (l) l.click(); });
  await p.waitForTimeout(600);
  await shot("03-provenance-judge", "provenance inspector for the judge: its Trigger (adjudicate) + ancestry");

  await selectRec(p, "demo_failed");
  await shot("04-verdict-failed", "red FAILED verdict (view_failure)");
  await selectRec(p, "demo_paused");
  await shot("05-verdict-paused", "cyan PAUSED verdict");
  await selectRec(p, "demo_broken");
  await shot("06-verdict-not-clean", "FINALISED but NOT CLEAN (a producer failed inside)");

  await selectRec(p, "natural_conversation");
  await shot("07-cohort-bands", "per-turn 4-way concurrency banded by parent");

  await selectRec(p, "demo_diff_a");
  await p.evaluate(() => { const s = document.getElementById("diffsel"); if (s) { s.value = "demo_diff_b"; s.onchange(); } });
  await p.waitForTimeout(600);
  await shot("08-diff", "diff a-vs-b: first divergence at seq 5");

  await selectRec(p, "demo_solo_chat");
  await p.evaluate(() => { const t = document.getElementById("modeToggle"); if (t) t.click(); });
  await p.waitForTimeout(500);
  await shot("09-io-pane", "I/O pane: the seed in, the Message artifact out, baseline channel");

  await selectRec(p, "demo_resumable");
  await shot("10-resume-paused", "paused resumable run: resume button shown, PAUSED verdict");

  // a seq-cursor scrub on code_review to show the run truncating live
  await selectRec(p, "code_review");
  await p.evaluate(() => { const s = document.getElementById("seq"); if (s) { s.value = 13; s.oninput({ target: s }); } });
  await p.waitForTimeout(500);
  await shot("11-seq-scrub", "seq cursor at 13: judge not yet spawned (fewer lanes)");

  await b.close();
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(shots, null, 2));
  console.log("\nCAPTURE DONE — " + shots.length + " key frames in screenshots/. Now VIEW each PNG and grade perceptually.");
})().catch((e) => { console.error("CAPTURE ERROR", e); process.exit(1); });
