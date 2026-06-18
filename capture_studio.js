/* Perceptual capture for the Studio authoring surface — the second observation track. Drives
   /studio.html and screenshots the key frames (filled form, validated, built) so the agent can VIEW
   and grade what it looks like. Run: npm run capture:studio (server up). View screenshots/3*-*.png. */
"use strict";
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const OUT = path.join(__dirname, "screenshots");

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 2 });
  const shot = async (n, note) => { await p.screenshot({ path: path.join(OUT, n + ".png"), fullPage: true }); console.log("  shot  " + n + ".png — " + note); };

  await p.goto(BASE + "/studio.html", { waitUntil: "networkidle", timeout: 20000 });
  await p.waitForTimeout(800);
  await shot("30-studio-filled", "authoring surface, pre-filled reviewer/judge example (producers/views/triggers/termination)");
  await p.click("#validateBtn"); await p.waitForTimeout(600);
  await shot("31-studio-valid", "validate -> green valid");
  await p.click("#buildBtn"); await p.waitForTimeout(2800);
  await shot("32-studio-built", "build -> built · finalised + record name + view-in-console link");

  // sprint 004: routes + composed termination
  await p.goto(BASE + "/studio.html", { waitUntil: "networkidle", timeout: 20000 });
  await p.waitForTimeout(700);
  await p.click("#addRoute");
  await p.evaluate(() => { const r = document.querySelector("#routes .row"); r.querySelector(".rid").value = "stage-crit"; r.querySelector(".rof").value = "Critique"; r.querySelector(".rslot").value = "crit_ctx"; });
  await p.evaluate(() => { const s = document.getElementById("termKind"); s.value = "all_of"; s.onchange(); });
  await p.waitForTimeout(300);
  await shot("33-studio-routes-composition", "routes section filled + all_of composed termination with member policies");

  // sprint 005: the drag-canvas
  await p.goto(BASE + "/studio.html", { waitUntil: "networkidle", timeout: 20000 });
  await p.waitForTimeout(700);
  await p.click("#vCanvas"); await p.waitForTimeout(500);
  // element screenshot (the canvas is bounded ~960x460) — fullPage×2 would exceed the viewer limit
  await (await p.$("#canvas")).screenshot({ path: path.join(OUT, "34-studio-canvas.png") });
  console.log("  shot  34-studio-canvas.png — drag-canvas node-graph (Producer cards + labelled Trigger edges)");

  await b.close();
  console.log("\nSTUDIO CAPTURE DONE — view screenshots/3*-*.png, then grade perceptually.");
})().catch((e) => { console.error("CAPTURE ERROR", e); process.exit(1); });
