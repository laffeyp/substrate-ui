/* Sprint 044 (piece G, close) — daily-driver end-to-end.

   Opens the terminal view against whatever driver /api/models defaults to
   (server.py:_agent_models — currently kimi-k2.7-code:cloud). Types one
   real prompt. Waits for ModelReply text to render. Screenshots at three
   anchors: session opened, mid-reply, session ended.

   No mocks. Real backend, real cloud model. If Ollama is offline or the
   cloud model is paywalled, the script fails loudly rather than silently
   passing on the deterministic stand-in.

   Run: node harness/capture_terminal_daily_driver.js (server on :8765,
   Ollama on :11434 with kimi-k2.7-code:cloud pulled). */
"use strict";
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const OUT = path.join(__dirname, "..", "screenshots");
const fails = [];
const pageErrors = [];
const ok = (m) => console.log(`  ok  ${m}`);
const fail = (m) => { console.error(`  FAIL  ${m}`); fails.push(m); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e.message)));
  page.on("console", (msg) => {
    // Surface console errors from the app so a wire break shows up in the log.
    if (msg.type() === "error") console.log(`  [console.error] ${msg.text()}`);
  });
  await page.goto(BASE + "?view=desktop");
  await page.waitForSelector("#view-desktop.active", { timeout: 5000 });

  // Flip to the terminal view.
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 });
  await page.waitForSelector("#terminal-input", { timeout: 2000 });
  ok("flipped to #view-terminal; terminal column mounted");

  // (The desktop driver picker is hidden pre-first-session, so it has
  // no useful value to read here. What matters is what DRIVER_SESSION_
  // STARTED reports after the session opens — checked below.)

  // First turn — opens the session with a real prompt.
  const PROMPT = "reply with the single word: hello";
  await page.focus("#terminal-input");
  await page.keyboard.type(PROMPT);
  await page.keyboard.press("Enter");

  // Wait for DRIVER_SESSION_STARTED — session is up.
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_STARTED"),
    { timeout: 15000 },
  );
  const started = await page.evaluate(() => {
    const s = ((window).__signals || []).filter((x) => x.name === "DRIVER_SESSION_STARTED").slice(-1)[0];
    return s && s.payload;
  });
  ok(`session started: driver=${started?.driver_name} tokens=${started?.driver_context_tokens}`);
  if (started?.driver_name && started.driver_name !== "deterministic") ok(`daily driver resolved to real model: ${started.driver_name}`);
  else fail(`daily driver resolved to ${started?.driver_name} — expected a real cloud model`);
  await page.screenshot({ path: path.join(OUT, "44-terminal-session-opened.png"), fullPage: false });

  // Wait for a ModelReply to arrive AND render in the terminal body.
  // A cloud model round-trip is 1–8s; give a generous 60s ceiling.
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll("#terminal-body div"))
      .some((el) => el.className && el.className.includes("accent")),
    { timeout: 60000 },
  );
  const replyText = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("#terminal-body div"));
    const accent = rows.filter((el) => el.className && el.className.includes("accent")).slice(-1)[0];
    return accent ? accent.textContent : "";
  });
  if (replyText && replyText.length > 0) ok(`ModelReply rendered: "${replyText.slice(0, 80)}${replyText.length > 80 ? "…" : ""}"`);
  else fail("no ModelReply text rendered in the terminal body");
  await page.screenshot({ path: path.join(OUT, "44-terminal-model-reply-rendered.png"), fullPage: false });

  // Wait for PARK — the turn's terminal state.
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "PARK_LANDED"),
    { timeout: 15000 },
  );
  ok("PARK_LANDED — turn 1 complete");

  // /exit ends the session cleanly.
  await page.focus("#terminal-input");
  await page.keyboard.type("/exit");
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_ENDED"),
    { timeout: 10000 },
  );
  ok("DRIVER_SESSION_ENDED fired on /exit");
  await page.screenshot({ path: path.join(OUT, "44-terminal-session-ended.png"), fullPage: false });

  if (pageErrors.length === 0) ok("no uncaught page errors");
  else fail(`page errors: ${JSON.stringify(pageErrors)}`);

  await browser.close();
  if (fails.length) {
    console.error(`\nFAIL — ${fails.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nPiece G daily-driver end-to-end PASS.");
})();
