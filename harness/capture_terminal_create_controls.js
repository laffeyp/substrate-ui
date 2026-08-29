/* Sprint 035w observation harness: terminal-view create-time controls. */
"use strict";
const { chromium } = require("playwright");
const BASE = process.env.UI_BASE || "http://127.0.0.1:8765";
const fails = [];
const pageErrors = [];
const ok = (m) => console.log(`  ok  ${m}`);
const fail = (m) => { console.error(`  FAIL  ${m}`); fails.push(m); };
const typeAndEnter = async (page, text) => {
  await page.focus("#terminal-input");
  await page.type("#terminal-input", text);
  await page.keyboard.press("Enter");
};

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(String(e.message)));
  await page.goto(BASE);
  await page.waitForSelector("#view-desktop.active", { timeout: 5000 });
  await page.dispatchEvent("#view-toggle", "mousedown");
  await page.waitForFunction(() => (window).STATE?.view === "terminal", { timeout: 2000 });
  await page.waitForSelector("#terminal-input", { timeout: 2000 });

  await typeAndEnter(page, "/bundle session");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("bundle → session (queued for next session)"),
    { timeout: 3000 },
  );
  ok("/bundle queued");

  await typeAndEnter(page, "/tools read_file,grep");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("tools → [read_file, grep] (queued for next session)"),
    { timeout: 3000 },
  );
  ok("/tools queued");

  await typeAndEnter(page, "/workspace /tmp/wsp");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("workspace → /tmp/wsp (queued for next session)"),
    { timeout: 3000 },
  );
  ok("/workspace queued");

  await typeAndEnter(page, "/isolate on");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("isolate → on (queued for next session)"),
    { timeout: 3000 },
  );
  ok("/isolate queued");

  const uniqueName = "session-" + Math.random().toString(36).slice(2, 10);
  await typeAndEnter(page, `/name ${uniqueName}`);
  await page.waitForFunction(
    (n) => (document.getElementById("terminal-body")?.textContent || "").includes(`name → ${n} (queued for next session)`),
    uniqueName,
    { timeout: 3000 },
  );
  ok("/name queued");

  const preOpenEmits = await page.evaluate(() => ({
    bundle: ((window).__signals || []).filter((s) => s.name === "BUNDLE_ATTACHED").length,
    workspace: ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").length,
    tools: ((window).__signals || []).filter((s) => s.name === "TOOLS_RESTRICTED").length,
    isolate: ((window).__signals || []).filter((s) => s.name === "ISOLATE_TOGGLED").length,
  }));
  if (preOpenEmits.bundle === 0 && preOpenEmits.workspace === 0 && preOpenEmits.tools === 0 && preOpenEmits.isolate === 0)
    ok("no v0.7 session-control tags fired before session-open");
  else fail(`pre-open emits leaked: ${JSON.stringify(preOpenEmits)}`);

  await typeAndEnter(page, "hello");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_STARTED"),
    { timeout: 10000 },
  );
  ok("session opened with queued create-time fields");

  const postOpenEmits = await page.evaluate(() => ({
    bundle: ((window).__signals || []).filter((s) => s.name === "BUNDLE_ATTACHED").slice(-1)[0],
    workspace: ((window).__signals || []).filter((s) => s.name === "WORKSPACE_SELECTED").slice(-1)[0],
    tools: ((window).__signals || []).filter((s) => s.name === "TOOLS_RESTRICTED").slice(-1)[0],
    isolate: ((window).__signals || []).filter((s) => s.name === "ISOLATE_TOGGLED").slice(-1)[0],
  }));
  if (postOpenEmits.bundle?.payload?.bundle === "session") ok("BUNDLE_ATTACHED{bundle=session} fired on ACK");
  else fail(`BUNDLE_ATTACHED wrong: ${JSON.stringify(postOpenEmits.bundle)}`);
  if (postOpenEmits.workspace?.payload?.workspace_shape === "isolate") ok("WORKSPACE_SELECTED{workspace_shape=isolate} fired on ACK");
  else fail(`WORKSPACE_SELECTED wrong: ${JSON.stringify(postOpenEmits.workspace)}`);
  if (Array.isArray(postOpenEmits.tools?.payload?.tools) && postOpenEmits.tools.payload.tools.length === 2)
    ok("TOOLS_RESTRICTED{tools=[read_file, grep]} fired on ACK");
  else fail(`TOOLS_RESTRICTED wrong: ${JSON.stringify(postOpenEmits.tools)}`);
  if (postOpenEmits.isolate?.payload?.isolate === true) ok("ISOLATE_TOGGLED{isolate=true} fired on ACK");
  else fail(`ISOLATE_TOGGLED wrong: ${JSON.stringify(postOpenEmits.isolate)}`);

  const sid = await page.evaluate(() =>
    ((window).__signals || []).filter((s) => s.name === "DRIVER_SESSION_STARTED").slice(-1)[0]?.payload?.session_id,
  );
  if (sid) {
    const resp = await page.evaluate(async (s) => await fetch(`/api/session/${s}`).then((r) => r.json()), sid);
    if (resp?.name && resp.name.startsWith("session-")) ok(`manifest.name registered: ${resp.name}`);
    else fail(`manifest.name not registered: ${JSON.stringify(resp)}`);
  }

  await typeAndEnter(page, "/workspace /tmp/other");
  await page.waitForFunction(
    () => (document.getElementById("terminal-body")?.textContent || "").includes("workspace is create-only"),
    { timeout: 3000 },
  );
  ok("/workspace mid-session rejected");

  await typeAndEnter(page, "/exit");
  await page.waitForFunction(
    () => ((window).__signals || []).some((s) => s.name === "DRIVER_SESSION_ENDED"),
    { timeout: 5000 },
  );
  ok("/exit closes session");

  if (pageErrors.length === 0) ok("no uncaught page errors");
  else fail(`page errors: ${JSON.stringify(pageErrors)}`);

  await browser.close();
  if (fails.length) {
    console.error(`\nFAIL — ${fails.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log("\nSprint 035w create-time controls observation contract PASS.");
})();
