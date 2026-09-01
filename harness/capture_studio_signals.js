// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/* Sprint 032 studio-signals capture — drives /studio.html through one authoring round-trip in real
   Chrome against the real backend, then dumps window.__signals to captures/sprint-021/studio.jsonl.
   Grader reads that file at `npm run grade:studio-signals`. */
"use strict";
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const OUT_DIR = path.join(__dirname, "..", "captures", "sprint-021");
const OUT_FILE = path.join(OUT_DIR, "studio.jsonl");

const waitSig = (p, name, timeout = 10000) =>
  p.waitForFunction((n) => (window.__signals || []).some((s) => s.name === n), name, { timeout });

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });

  await p.goto(BASE + "/studio.html", { waitUntil: "networkidle", timeout: 20000 });
  await waitSig(p, "SESSION_INIT");

  // Canvas toggle round-trip
  await p.evaluate(() => document.getElementById("vCanvas").click());
  await waitSig(p, "CANVAS_TOGGLED");
  await p.evaluate(() => document.getElementById("vForm").click());

  // Add + remove a row
  await p.evaluate(() => document.getElementById("addProducer").click());
  await waitSig(p, "SPEC_ROW_ADDED");
  await p.evaluate(() => {
    const rows = document.querySelectorAll("#producers .row");
    const last = rows[rows.length - 1];
    last.querySelector(".rm").click();
  });
  await waitSig(p, "SPEC_ROW_REMOVED");

  // Validate the pre-filled reviewer/judge spec
  await p.evaluate(() => document.getElementById("validateBtn").click());
  await waitSig(p, "SPEC_VALIDATE_REQUESTED");
  await waitSig(p, "SPEC_VALIDATED");

  // Build (the pre-fill is buildable end-to-end)
  await p.evaluate(() => document.getElementById("buildBtn").click());
  await waitSig(p, "SPEC_BUILD_REQUESTED");
  await waitSig(p, "SPEC_BUILT", 30000);

  // Console-link click. target="_blank" in production opens a new tab, but Playwright's
  // dispatchEvent still triggers the current tab's default anchor navigation and nukes the buffer.
  // Guard: add a capture-phase preventDefault so the click's emit fires but no navigation happens.
  await p.evaluate(() => {
    const link = document.querySelector(".consolelink");
    if (!link) return;
    link.addEventListener("click", (e) => e.preventDefault(), { capture: true, once: true });
    link.click();
  });
  await waitSig(p, "CONSOLE_LINK_FOLLOWED", 3000);

  await p.evaluate(() => window.dispatchEvent(new Event("beforeunload")));
  const signals = await p.evaluate(() => window.__signals || []);
  fs.writeFileSync(OUT_FILE, signals.map((s) => JSON.stringify(s)).join("\n") + (signals.length ? "\n" : ""));
  console.log(`wrote ${signals.length} signals to ${OUT_FILE}`);
  await b.close();
})().catch((e) => { console.error("STUDIO CAPTURE ERROR", e); process.exit(1); });
