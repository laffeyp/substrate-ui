// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/* Live E2E for the Studio authoring surface — drives /studio.html in real Chrome against the real
   backend: author (pre-filled reviewer/judge) -> validate -> build a REAL run -> follow the console
   deep-link -> assert the authored run EXECUTED (a Verdict exists because the adjudicate Trigger fired
   the judge). Plus the negative path. The structural track of the two-track observation contract.
   Run: cd substrate && uv run python ../substrate-ui/server.py & ; cd substrate-ui && npm run e2e:studio */
"use strict";
const { chromium } = require("playwright");
const { maybeCaptureTail } = require("./lib/capture-tail");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const fails = [];
const check = (c, m) => { if (!c) fails.push(m); else console.log("  ok  " + m); };

(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 960 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e.message)));

  await p.goto(BASE + "/studio.html", { waitUntil: "networkidle", timeout: 20000 });
  await p.waitForTimeout(800);
  check(errors.length === 0, "studio loads, no page errors (" + errors.slice(0, 2).join("; ") + ")");
  check((await p.$$eval("#producers .row", (e) => e.length)) === 3, "pre-filled with the 3-Producer reviewer/judge example");

  // validate -> valid (through the REAL TopologyBuilder.build())
  await p.click("#validateBtn"); await p.waitForTimeout(600);
  let o = await p.$eval("#out", (e) => e.textContent);
  check(/valid/.test(o) && !/invalid/.test(o), `validate -> valid ("${o.replace(/\s+/g, " ").slice(0, 46)}")`);

  // build -> a REAL run, finalised, with a record name + a console deep-link
  await p.click("#buildBtn"); await p.waitForTimeout(2800);
  o = await p.$eval("#out", (e) => e.textContent);
  check(/built · finalised/.test(o), `build -> built · finalised ("${o.replace(/\s+/g, " ").slice(0, 56)}")`);
  const href = await p.$eval("#out a.consolelink", (e) => e.getAttribute("href")).catch(() => null);
  check(href && /\/\?record=build_/.test(href), `build result deep-links to the console ("${href}")`);

  // follow the deep-link -> the authored run EXECUTED (Critique x2 -> adjudicate fired -> Verdict)
  await p.goto(BASE + href, { waitUntil: "networkidle", timeout: 20000 });
  await p.waitForTimeout(1600);
  check(/build_/.test(await p.$eval("#runname", (e) => e.textContent).catch(() => "")), "deep-link selected the built record in the console");
  const stream = (await p.$eval("#stream", (e) => e.textContent).catch(() => "")).replace(/\s+/g, " ");
  check(/Verdict/.test(stream) && /Critique/.test(stream),
    `the authored run EXECUTED: Critique -> adjudicate fired -> Verdict ("${stream.slice(0, 80)}")`);

  // negative: a Trigger that starts an unknown Producer -> validate shows the clean typed error
  await p.goto(BASE + "/studio.html", { waitUntil: "networkidle", timeout: 20000 });
  await p.waitForTimeout(600);
  await p.evaluate(() => { document.querySelector("#triggers .row .tstarts").value = "ghost"; });
  await p.click("#validateBtn"); await p.waitForTimeout(600);
  o = (await p.$eval("#out", (e) => e.textContent)).replace(/\s+/g, " ");
  check(/invalid/.test(o) && /ghost/.test(o), `unknown-starts Trigger -> clean typed invalid ("${o.slice(0, 56)}")`);

  // sprint 004: a Route + a composed all_of TerminationPolicy -> validate -> build (a real run)
  await p.goto(BASE + "/studio.html", { waitUntil: "networkidle", timeout: 20000 });
  await p.waitForTimeout(700);
  await p.click("#addRoute");
  await p.evaluate(() => { const r = document.querySelector("#routes .row"); r.querySelector(".rid").value = "stage-crit"; r.querySelector(".rof").value = "Critique"; r.querySelector(".rslot").value = "crit_ctx"; });
  await p.evaluate(() => { const s = document.getElementById("termKind"); s.value = "all_of"; s.onchange(); });
  await p.waitForTimeout(300);
  check((await p.$$eval("#termMembers .member", (e) => e.length)) === 2, "all_of composition shows 2 default member policies");
  await p.click("#validateBtn"); await p.waitForTimeout(600);
  let r4 = (await p.$eval("#out", (e) => e.textContent)).replace(/\s+/g, " ");
  check(/valid/.test(r4) && !/invalid/.test(r4), `Route + all_of composition -> valid ("${r4.slice(0, 44)}")`);
  await p.click("#buildBtn"); await p.waitForTimeout(2800);
  r4 = (await p.$eval("#out", (e) => e.textContent)).replace(/\s+/g, " ");
  check(/built · finalised/.test(r4), `Route + all_of composition -> built · finalised ("${r4.slice(0, 50)}")`);

  // sprint 005 + the review-#42 slot-node fold: the drag-canvas view of the authored topology
  await p.goto(BASE + "/studio.html", { waitUntil: "networkidle", timeout: 20000 });
  await p.waitForTimeout(700);
  await p.click("#addRoute");
  await p.evaluate(() => { const r = document.querySelector("#routes .row"); r.querySelector(".rid").value = "stage-crit"; r.querySelector(".rof").value = "Critique"; r.querySelector(".rslot").value = "crit_ctx"; });
  await p.click("#vCanvas"); await p.waitForTimeout(400);
  check((await p.$$eval("#canvas .card", (e) => e.length)) === 3, "canvas renders 3 Producer cards");
  check((await p.$$eval("#canvas .card.initial", (e) => e.length)) === 2, "2 initial Producer cards marked");
  check((await p.$$eval("#canvas .slotnode", (e) => e.length)) === 1, "review #42 fold: a Route draws to a slot NODE (not to every Producer)");
  const edgeLbls = await p.$$eval("#canvas .edge-lbl", (e) => e.map((x) => x.textContent));
  check(edgeLbls.includes("adjudicate"), `a Trigger edge labelled "adjudicate" is drawn (${JSON.stringify(edgeLbls)})`);
  const before = await p.$eval('#canvas .card[data-kind="judge"]', (e) => e.style.left);
  const box = await p.$eval('#canvas .card[data-kind="judge"]', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(box.x, box.y); await p.mouse.down(); await p.mouse.move(box.x + 90, box.y + 40, { steps: 5 }); await p.mouse.up();
  await p.waitForTimeout(200);
  check(before !== (await p.$eval('#canvas .card[data-kind="judge"]', (e) => e.style.left)), "dragging the judge card moved it");
  await p.click("#vForm"); await p.waitForTimeout(300);
  check((await p.$$eval("#producers .row", (e) => e.length)) === 3, "toggle back to form: 3 Producer rows intact");
  await p.click("#validateBtn"); await p.waitForTimeout(500);
  check(/valid/.test(await p.$eval("#out", (e) => e.textContent)), "form still validates after the canvas round-trip");

  // sprint 007: a MODEL-backed Producer (judge model + prompt, deterministic responder) -> build ->
  // the run's Verdict carries the Responder's output (not note=kind) — a model-backed run that executed.
  await p.goto(BASE + "/studio.html", { waitUntil: "networkidle", timeout: 20000 });
  await p.waitForTimeout(700);
  check((await p.$$eval("#producers .row .pmodel", (e) => e.length)) === 3, "each Producer row has a model checkbox");
  check((await p.$$eval("#responderSel", (e) => e.length)) === 1, "a responder selector is present");
  await p.evaluate(() => {
    const judge = [...document.querySelectorAll("#producers .row")].find((r) => r.querySelector(".pkind").value === "judge");
    judge.querySelector(".pmodel").checked = true;
    judge.querySelector(".pprompt").value = "rate the critiques";
  });
  await p.click("#buildBtn"); await p.waitForTimeout(2800);
  const mhref = await p.$eval("#out a.consolelink", (e) => e.getAttribute("href")).catch(() => null);
  check(mhref && /build_/.test(mhref), "model-backed topology built");
  const mname = mhref ? mhref.split("record=")[1] : "";
  const io = await p.evaluate((n) => fetch(`/api/records/${n}/io`).then((r) => r.json()), mname);
  const verdict = (io.outputs || []).find((o) => o.kind === "Verdict");
  check(verdict && /^stub\[/.test(verdict.payload.note) && verdict.payload.note !== "judge",
    `model judge emitted the Responder's output, not note=kind ("${verdict && verdict.payload.note}")`);

  await maybeCaptureTail(p, "studio");
  await b.close();
  if (fails.length) { console.error("\nFAILED:\n  - " + fails.join("\n  - ")); process.exit(1); }
  console.log("\nSTUDIO E2E PASS — author (form + canvas, Routes + composition + model Producers) -> validate -> build -> view, all live.");
})().catch((e) => { console.error("STUDIO E2E ERROR", e); process.exit(1); });
