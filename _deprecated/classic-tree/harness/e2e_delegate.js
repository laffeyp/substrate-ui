/* Structural E2E for the delegated-child BRANCH (sprint 017, W2.2) — track 1 of the observation
   contract (DOM assertions; capture_delegate.js is track 2, the screenshot). Drives the real console
   in real Chrome against the real backend: selects the demo_delegate parent, switches to the I/O
   surface, asserts the delegate ToolResult renders a navigable child branch, clicks it and lands in
   the child record, asserts the breadcrumb, and clicks back to the parent. Proves the parent->child
   stitch across two records via child_root — the UI half of run-granularity provenance.

   Needs the demo records (cd substrate && uv run python ../substrate-ui/gen_demo_records.py).
   Run (server up on :8765):  cd substrate-ui && node harness/e2e_delegate.js  */
"use strict";
const { chromium } = require("playwright");
const { maybeCaptureTail } = require("./lib/capture-tail");
const assert = require("assert");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";

async function selectRecord(p, name) {
  await p.evaluate((n) => {
    const rec = [...document.querySelectorAll(".rec")].find(
      (e) => e.querySelector(".nm") && e.querySelector(".nm").textContent.trim() === n);
    if (!rec) throw new Error("record not in rail: " + n);
    rec.click();
  }, name);
  await p.waitForFunction((n) => document.getElementById("runname").textContent.trim() === n, name, { timeout: 15000 });
}

async function toIO(p) {
  // #modeToggle reads "I/O" while in the graph view; click it to reach the I/O surface.
  const t = await p.$eval("#modeToggle", (e) => e.textContent.trim());
  if (t === "I/O") await p.click("#modeToggle");
  await p.waitForSelector("#iopane .art", { timeout: 15000 });
}

(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await b.newPage();
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.waitForTimeout(700);

  // 1. the parent + both children are served (the parent splits across TWO children — the plan's scenario)
  const names = await p.$$eval(".rec .nm", (a) => a.map((x) => x.textContent.trim()));
  for (const n of ["demo_delegate", "demo_delegate_child", "demo_delegate_child2"])
    assert(names.includes(n), `${n} missing from rail: ${names}`);

  // 2. the parent's TWO delegate ToolResults each render a NAVIGABLE child branch naming its child record
  await selectRecord(p, "demo_delegate");
  await toIO(p);
  const childNames = await p.$$eval(".branch[data-child]", (bs) => bs.map((b) => b.getAttribute("data-child")).sort());
  assert.deepStrictEqual(childNames, ["demo_delegate_child", "demo_delegate_child2"],
    `expected two navigable child branches, got: ${childNames}`);
  const branch = await p.$(".branch[data-child='demo_delegate_child']");
  const branchText = await branch.innerText();
  assert(/delegated child/i.test(branchText), `branch copy off: ${branchText}`);

  // 3. clicking the branch navigates INTO the child record; its answer + the breadcrumb are present
  await branch.click();
  await p.waitForFunction(() => document.getElementById("runname").textContent.trim() === "demo_delegate_child", { timeout: 15000 });
  const childHtml = await p.$eval("#iopane", (e) => e.innerHTML);
  assert(childHtml.includes("FinalAnswer"), "child record shows no FinalAnswer");
  const crumb = await p.$(".crumb[data-parent='demo_delegate']");
  assert(crumb, "no breadcrumb back to the delegating parent on the child view");

  // 4. the breadcrumb returns to the parent
  await crumb.click();
  await p.waitForFunction(() => document.getElementById("runname").textContent.trim() === "demo_delegate", { timeout: 15000 });

  console.log("e2e_delegate PASS — parent delegate ToolResult -> navigable child branch -> child record -> breadcrumb back");
  await maybeCaptureTail(p, "delegate");
  await b.close();
})().catch((e) => { console.error("e2e_delegate FAIL:", e.message); process.exit(1); });
