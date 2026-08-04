/* Perceptual capture for the delegated-child branch (sprint 017, W2.2) — track 2 of the observation
   contract. Element-screenshots the bounded I/O pane (Addendum A6: bounded surface, capped dims) at
   two frames: the parent with the delegate child branch, and the child with the breadcrumb. The agent
   then READS the PNGs and grades legibility (structural assertions live in e2e_delegate.js, the gate).

   Needs the demo records + a server on :8765.  Run: cd substrate-ui && node harness/capture_delegate.js */
"use strict";
const { chromium } = require("playwright");
const fs = require("fs");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const OUT = __dirname + "/../screenshots";

async function selectRecord(p, name) {
  await p.evaluate((n) => [...document.querySelectorAll(".rec")].find(
    (e) => e.querySelector(".nm") && e.querySelector(".nm").textContent.trim() === n).click(), name);
  await p.waitForFunction((n) => document.getElementById("runname").textContent.trim() === n, name, { timeout: 15000 });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.waitForTimeout(700);

  await selectRecord(p, "demo_delegate");
  if ((await p.$eval("#modeToggle", (e) => e.textContent.trim())) === "I/O") await p.click("#modeToggle");
  await p.waitForSelector(".branch[data-child]", { timeout: 15000 });
  await p.$eval("#iopane", (e) => (e.scrollTop = 0));
  await p.locator("#iopane").screenshot({ path: OUT + "/delegate-parent-branch.png" });

  await p.click(".branch[data-child]");
  await p.waitForFunction(() => document.getElementById("runname").textContent.trim() === "demo_delegate_child", { timeout: 15000 });
  await p.waitForSelector(".crumb[data-parent]", { timeout: 15000 });
  await p.locator("#iopane").screenshot({ path: OUT + "/delegate-child-breadcrumb.png" });

  console.log("capture_delegate wrote delegate-parent-branch.png + delegate-child-breadcrumb.png");
  await b.close();
})().catch((e) => { console.error("capture_delegate FAIL:", e.message); process.exit(1); });
