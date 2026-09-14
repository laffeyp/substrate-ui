// harness/see.ts — pixel-anchor capture for the reveal shell.
//
// Runs a real Chrome, drives the reveal shell into a known state via
// window.__vm.attachExisting(<sessionId>), then screenshots the
// stream+graph pane and writes it to captures/see-latest.png so the
// agent can Read the image and check its own work. No SDD signal
// harness, no vocabulary emission — just eyes.

import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const BASE = process.env.SUBSTRATE_UI_BASE || "http://127.0.0.1:8765";
const SESSION_ID = process.env.SUBSTRATE_UI_SEE_SESSION || "";
const OUT_DIR = path.resolve("captures");
const OUT_PATH = path.join(OUT_DIR, "see-latest.png");

async function main(): Promise<void> {
  if (!SESSION_ID) {
    console.error("SUBSTRATE_UI_SEE_SESSION=<session_id> required.");
    console.error("Example: SUBSTRATE_UI_SEE_SESSION=s_bba8fe9d9e3645c9b7bdafdc npm run see");
    process.exit(2);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/?session=${SESSION_ID}`, { waitUntil: "load" });

  // Wait for the controller to bind and stream some envelopes; don't
  // fail on timeout — screenshot whatever is on screen.
  // tsx transpiles inline function bodies with esbuild helpers that
  // reference `__name`; that identifier is undefined inside Playwright's
  // page context. Pass every browser-side script as a raw string so
  // nothing gets transpiled.
  const WAIT_ENVELOPES = "() => { var v = window.__vm; return !!(v && v.snapshot && (v.snapshot().rawEnvelopes||[]).length > 0); }";
  const OPEN_REVEAL = "() => { var root = document.getElementById('dc-root'); if (!root) return; var key = Object.keys(root).find(function(k){return k.indexOf('__reactContainer')===0}); if (!key) return; function walk(f){ if(!f) return null; var i=f.stateNode; if(i && i.logic && typeof i.logic.setState==='function') return i.logic; return walk(f.child)||walk(f.sibling); } var c=root[key]; var cur=c && c.stateNode && c.stateNode.current; var l=walk(cur); if(l) l.setState({revealed:true, mode:'stream', dir:'down'}); }";

  try {
    await page.waitForFunction(WAIT_ENVELOPES, null, { timeout: 8000 });
  } catch (_err) { /* screenshot anyway */ }
  await page.evaluate(OPEN_REVEAL);
  // Ctrl+` is the canonical reveal toggle. Fire it as a fallback if
  // setState hasn't landed by the time we take the shot.
  await page.keyboard.press("Control+`");
  await page.waitForTimeout(800);
  // Scroll the stream pane by a fraction if the caller asked. The
  // stream+graph pane's overflow container carries `ref={streamRef}`
  // which the DC component holds as `this._streamEl`.
  const SCROLL = process.env.SUBSTRATE_UI_SEE_SCROLL || "";
  if (SCROLL) {
    const script = `(() => { var root = document.getElementById('dc-root'); if (!root) return; var key = Object.keys(root).find(k => k.indexOf('__reactContainer')===0); if (!key) return; function walk(f){ if(!f) return null; var i=f.stateNode; if(i && i.logic && i.logic._streamEl) return i.logic._streamEl; return walk(f.child)||walk(f.sibling); } var c=root[key]; var cur=c && c.stateNode && c.stateNode.current; var el=walk(cur); if(el) el.scrollTop = Math.round(el.scrollHeight * ${Number(SCROLL) || 0}); })()`;
    await page.evaluate(script);
    await page.waitForTimeout(300);
  }

  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT_PATH, fullPage: false });
  await browser.close();
  console.log(`captured: ${OUT_PATH}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
