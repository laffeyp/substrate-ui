/* Live E2E for the Studio authoring surface — drives /studio.html in real Chrome against the real
   backend: author (pre-filled reviewer/judge) -> validate -> build a REAL run -> follow the console
   deep-link -> assert the authored run EXECUTED (a Verdict exists because the adjudicate Trigger fired
   the judge). Plus the negative path. The structural track of the two-track observation contract.
   Run: cd substrate && uv run python ../substrate-ui/server.py & ; cd substrate-ui && npm run e2e:studio */
"use strict";
const { chromium } = require("playwright");
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

  await b.close();
  if (fails.length) { console.error("\nFAILED:\n  - " + fails.join("\n  - ")); process.exit(1); }
  console.log("\nSTUDIO E2E PASS — author -> validate -> build (a real run) -> view, all live.");
})().catch((e) => { console.error("STUDIO E2E ERROR", e); process.exit(1); });
