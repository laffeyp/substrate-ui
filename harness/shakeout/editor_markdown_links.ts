// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A tab's menu, Markdown rendered, and links followed (sprint 503; roadmap 2026-11-14-editor-features r4 E5).
//
// The workspace is the large fixture set (lib/multipane.ts) and docs/: GUIDE.md, a links list over the real
// harness/fixtures/code/README-substrate-ui.md twice (so `## Install` repeats and the second is `#install-1`), and
// RUNBOOK.md, a copy of this repository's runbook round 10 (363 lines). The links: a file three folders away, a file
// at a heading, two headings of this file, an external address, and a file that is not there. Each is followed from
// the source (⌘-click) and from the rendered view (click). main's shell.openExternal is replaced for the run, so the
// browser never opens and the address it was given is read back. These agree:
//   menu   — the tab's menu holds add to message, show rendered, close, close others; then show source;
//   source — the file link opens its file (tab active); the heading links put the caret on the heading's line, in
//            this file and in RUNBOOK.md; the external link reaches openExternal; the missing file opens nothing;
//   view   — rendered: every heading drawn with its anchor, the six links drawn, the code hidden; the link's pixels
//            in the accent; a heading link brings its heading to the view's top; the same outcomes as the source;
//   trace  — EDITOR_MARKDOWN_SHOWN rendered then source; EDITOR_LINK_FOLLOWED once per follow with its kind, view
//            and found; EDITOR_FILE_OPENED how link per new tab; NAVIGATION_BLOCKED external per address; no address
//            or path of a link in any trace file (E1).
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "playwright";
import { headingLine } from "../../web/app/derive/md_links";
import { decodePng } from "../pixel/png";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { bigWorkspace, firstTurn, openEditor, openFile } from "./lib/multipane";

const REPO = join(__dirname, "..", "..");
const SITE = "https://example.org/substrate-gate-503";

function workspace(): { root: string; guide: string; runbook: string; models: string } {
  const A = bigWorkspace("alpha");
  const models = A.files.find((f) => f.endsWith("models.py"))!;
  const readme = readFileSync(join(REPO, "harness", "fixtures", "code", "README-substrate-ui.md"), "utf8");
  const guide = [
    "# Gate guide",
    "",
    "## Links",
    "",
    `- [gate-models](../${models})`,
    "- [gate-runbook](RUNBOOK.md#5-build-and-install--no-apple)",
    "- [gate-licensing](#licensing-and-use)",
    "- [gate-install](#install-1)",
    `- [gate-site](${SITE})`,
    "- [gate-gone](nothing-here.md)",
    "",
    readme,
    readme,
  ].join("\n");
  mkdirSync(join(A.root, "docs"), { recursive: true });
  writeFileSync(join(A.root, "docs", "GUIDE.md"), guide);
  const runbook = readFileSync(join(REPO, "RUNBOOK-2026-11-12-project-r10.md"), "utf8");
  writeFileSync(join(A.root, "docs", "RUNBOOK.md"), runbook);
  return { root: A.root, guide, runbook, models };
}

const snap = (win: Page) => win.evaluate("(function () { var s = globalThis.__substrateEditor.getSnapshot(); return { active: s.active, tabs: s.tabs, caretLine: s.caretLine }; })()") as Promise<{ active: string | null; tabs: string[]; caretLine: number }>;

/** The middle of a label's second letter in the code, found through the code's shadow root. */
async function labelInCode(win: Page, label: string): Promise<{ x: number; y: number } | null> {
  return win.evaluate(`(function () {
    var root = document.querySelector("[data-editor-code]").shadowRoot;
    var walker = document.createTreeWalker(root.querySelector(".cm-content"), NodeFilter.SHOW_TEXT), n;
    while ((n = walker.nextNode())) {
      var i = n.textContent.indexOf(${JSON.stringify(label)});
      if (i >= 0) { var r = document.createRange(); r.setStart(n, i + 1); r.setEnd(n, i + 2); var b = r.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }
    }
    return null;
  })()`) as Promise<{ x: number; y: number } | null>;
}

async function menuItems(win: Page, tab: string): Promise<string[]> {
  await win.locator(`[data-editor-tab="${tab}"]`).first().click({ button: "right" });
  await win.locator("[data-context-menu]").first().waitFor({ state: "visible", timeout: 5_000 });
  return win.evaluate(() => Array.from(document.querySelectorAll("[data-context-item]")).map((e) => e.getAttribute("data-context-item")!));
}

async function pick(win: Page, label: string): Promise<void> {
  await win.locator(`[data-context-item="${label}"]`).first().click();
  await settled(win);
}

async function showTab(win: Page, rel: string): Promise<void> {
  await win.locator(`[data-editor-tab="${rel}"]`).first().click();
  await win.waitForFunction((r) => (globalThis as unknown as { __substrateEditor: { getSnapshot(): { active: string } } }).__substrateEditor.getSnapshot().active === r, rel, { timeout: 10_000 });
  await settled(win);
}

const opened = (app: ElectronApplication) => app.evaluate(() => (globalThis as unknown as { __opened?: string[] }).__opened ?? []);

/** Waits for `test` on the editor\'s state, up to 10 s; false on none. */
async function until(win: Page, test: (s: { active: string | null; tabs: string[]; caretLine: number }) => boolean): Promise<boolean> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) { if (test(await snap(win))) return true; await settled(win); }
  return false;
}

/** Of a PNG, the pixels of the accent #82a5c8's hue. */
function accentPixels(png: Buffer): number {
  const img = decodePng(png);
  let n = 0;
  // Blue over red by 45 or more: the accent (130, 165, 200) stands 70 apart, the prose's greys about 7.
  for (let i = 0; i < img.data.length; i += 4) if (img.data[i + 2] - img.data[i] >= 45 && img.data[i + 2] > 140) n++;
  return n;
}

async function main(): Promise<void> {
  const ws = workspace();
  const guide = "docs/GUIDE.md", runbook = "docs/RUNBOOK.md";
  const lineRunbook = headingLine(ws.runbook, "5-build-and-install--no-apple")!;
  const lineLicensing = headingLine(ws.guide, "licensing-and-use")!;
  const lineInstall1 = headingLine(ws.guide, "install-1")!;
  const launch = launchArgs();
  const shots = join(REPO, "runs", "packaged", `sprint-503-${process.env.SHAKEOUT_APP ? "bundle" : "source"}-${Date.now()}`);
  mkdirSync(shots, { recursive: true });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const errs: string[] = [];
  const seen: string[] = [];
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    // The browser is not opened: the address main would hand it is kept for the gate to read.
    await app.evaluate(({ shell }) => { const g = globalThis as unknown as { __opened: string[] }; g.__opened = []; shell.openExternal = async (u: string) => { g.__opened.push(u); }; });
    await bindPaneAsUser(win, "deterministic", { folder: ws.root });
    await firstTurn(win, 1);
    await openEditor(win);
    await openFile(win, ws.root, guide);

    // The menu.
    const items = await menuItems(win, guide);
    seen.push(`menu ${JSON.stringify(items)}`);
    if (JSON.stringify(items.slice(1)) !== JSON.stringify(["show rendered", "close"])) errs.push(`one tab: menu ${JSON.stringify(items)}`);
    await win.keyboard.press("Escape");

    // Source: ⌘-click each link.
    const cmdClick = async (label: string) => {
      await showTab(win, guide);
      // The links sit at the guide's top; an in-file jump leaves them above the view, as a person would scroll back.
      await win.evaluate(`(function () { document.querySelector("[data-editor-code]").shadowRoot.querySelector(".cm-scroller").scrollTop = 0; })()`);
      await settled(win);
      const at = await labelInCode(win, label);
      if (!at) { errs.push(`source: ${label} not drawn in the code`); return; }
      await win.keyboard.down("Meta");
      await win.mouse.click(at.x, at.y);
      await win.keyboard.up("Meta");
      await settled(win);
    };
    await cmdClick("gate-models");
    if (!(await until(win, (s) => s.active === `alpha/${ws.models.split("/").slice(1).join("/")}` || s.active === ws.models))) errs.push(`source: the file link left ${String((await snap(win)).active)} shown`);
    await cmdClick("gate-runbook");
    if (!(await until(win, (s) => s.active === runbook && s.caretLine === lineRunbook))) { const s = await snap(win); errs.push(`source: the runbook link shows ${String(s.active)} at line ${s.caretLine}; its heading is line ${lineRunbook}`); }
    // A tab comes back where it was left: the guide, last seen at its top, after the runbook at line 128.
    await showTab(win, guide);
    const back = await win.evaluate(`(function () { return document.querySelector("[data-editor-code]").shadowRoot.querySelector(".cm-scroller").scrollTop; })()`) as number;
    if (back > 40) errs.push(`source: the guide came back scrolled ${back} px down; it was left at its top`);
    seen.push(`guide back at scroll ${back}`);
    await cmdClick("gate-licensing");
    if (!(await until(win, (s) => s.active === guide && s.caretLine === lineLicensing))) errs.push(`source: #licensing-and-use left the caret on line ${(await snap(win)).caretLine}; the heading is line ${lineLicensing}`);
    await cmdClick("gate-install");
    if (!(await until(win, (s) => s.active === guide && s.caretLine === lineInstall1))) errs.push(`source: #install-1 left the caret on line ${(await snap(win)).caretLine}; the second Install is line ${lineInstall1}`);
    await cmdClick("gate-site");
    await settled(win);
    const tabsBefore = (await snap(win)).tabs;
    await cmdClick("gate-gone");
    const afterGone = await snap(win);
    if (JSON.stringify(afterGone.tabs) !== JSON.stringify(tabsBefore) || afterGone.active !== guide) errs.push(`source: the missing file changed the tabs to ${JSON.stringify(afterGone.tabs)}`);
    const sourceOpened = await opened(app);
    if (JSON.stringify(sourceOpened) !== JSON.stringify([SITE])) errs.push(`source: openExternal was given ${JSON.stringify(sourceOpened)}`);
    seen.push(`source: file, runbook line ${lineRunbook}, licensing line ${lineLicensing}, install-1 line ${lineInstall1}, site handed to the browser, gone opened nothing`);

    // Rendered.
    await showTab(win, guide);
    const items2 = await menuItems(win, guide);
    if (JSON.stringify(items2.slice(1)) !== JSON.stringify(["show rendered", "close", "close others"])) errs.push(`three tabs: menu ${JSON.stringify(items2)}`);
    await pick(win, "show rendered");
    await win.locator("[data-md-view]").first().waitFor({ state: "visible", timeout: 10_000 });
    const drawn = await win.evaluate(() => ({
      headings: document.querySelectorAll("[data-md-heading]").length,
      links: Array.from(document.querySelectorAll("[data-md-link]")).map((e) => e.getAttribute("data-md-link")),
      images: document.querySelectorAll("[data-md-image]").length,
      strayBang: Array.from(document.querySelectorAll("[data-md-view] p")).some((p) => /!\s*$/.test((p.firstChild as HTMLElement | null)?.textContent ?? "") && !!p.querySelector("[data-md-link]")),
      code: getComputedStyle(document.querySelector("[data-editor-code]")!).display,
    }));
    let fenced = false;
    const wantHeadings = ws.guide.split("\n").filter((l) => { const t = l.trim(); if (/^```/.test(t)) { fenced = !fenced; return false; } return !fenced && /^#{1,4}\s+/.test(t); }).length;
    if (drawn.headings !== wantHeadings) errs.push(`rendered: ${drawn.headings} headings drawn; the file holds ${wantHeadings}`);
    // The guide's six come first; the README's own links follow them.
    if (JSON.stringify(drawn.links.slice(0, 6)) !== JSON.stringify(["file", "file", "heading", "heading", "external", "file"]) || drawn.links.length < 6) errs.push(`rendered: links ${JSON.stringify(drawn.links)}`);
    if (drawn.code !== "none") errs.push(`rendered: the code is still drawn (${drawn.code})`);
    // The README opens with an image, twice over in the guide: each draws as one marked alt text, no stray "!".
    if (drawn.images !== 2 || drawn.strayBang) errs.push(`rendered: ${drawn.images} images drawn, a stray "!" before a link: ${String(drawn.strayBang)}`);
    await win.screenshot({ path: join(shots, "rendered.png") });
    const linkPx = drawn.links.length ? accentPixels(await win.locator("[data-md-link]").first().screenshot({ path: join(shots, "link.png") })) : 0;
    const textPx = accentPixels(await win.locator("[data-md-view] p:not(:has([data-md-link]))").first().screenshot({ path: join(shots, "paragraph.png") }));
    if (linkPx < 20 || textPx > 0) errs.push(`rendered pixels: ${linkPx} accent pixels in the link, ${textPx} in a paragraph`);
    seen.push(`rendered: ${drawn.headings} headings, ${drawn.links.length} links, code hidden; ${linkPx} accent pixels in a link, ${textPx} in prose`);

    if (!drawn.links.length) throw new Error(errs.join("; "));
    const clickLink = async (n: number) => { await win.locator("[data-md-link]").nth(n).click(); await settled(win); };
    const headingAtTop = (slug: string) => win.evaluate((s) => {
      const view = document.querySelector("[data-md-view]")!, el = view.querySelector(`[data-md-heading="${s}"]`);
      return el ? Math.round(el.getBoundingClientRect().top - view.getBoundingClientRect().top) : null;
    }, slug);
    await clickLink(2);
    const topL = await headingAtTop("licensing-and-use");
    if (topL === null || topL < 0 || topL > 30) errs.push(`rendered: #licensing-and-use sits ${String(topL)} px below the view's top`);
    await clickLink(3);
    const topI = await headingAtTop("install-1");
    if (topI === null || topI < 0 || topI > 30) errs.push(`rendered: #install-1 sits ${String(topI)} px below the view's top`);
    await win.screenshot({ path: join(shots, "rendered-install-1.png") });
    await clickLink(4);
    await clickLink(5);
    const afterGone2 = await snap(win);
    if (afterGone2.active !== guide) errs.push(`rendered: the missing file showed ${String(afterGone2.active)}`);
    const renderedOpened = await opened(app);
    if (JSON.stringify(renderedOpened) !== JSON.stringify([SITE, SITE])) errs.push(`rendered: openExternal was given ${JSON.stringify(renderedOpened)}`);
    await clickLink(1);
    if (!(await until(win, (s) => s.active === runbook && s.caretLine === lineRunbook))) errs.push(`rendered: the runbook link shows ${String((await snap(win)).active)} at line ${(await snap(win)).caretLine}`);
    seen.push(`rendered: licensing ${String(topL)} px and install-1 ${String(topI)} px from the top; site handed to the browser; gone opened nothing; runbook at line ${lineRunbook}`);

    // Back to the source.
    await showTab(win, guide);
    if (!(await win.locator("[data-md-view]").first().isVisible().catch(() => false))) errs.push("the guide tab lost its rendered form when shown again");
    const items3 = await menuItems(win, guide);
    if (!items3.includes("show source")) errs.push(`rendered tab: menu ${JSON.stringify(items3)}`);
    await pick(win, "show source");
    if (await win.locator("[data-md-view]").first().isVisible().catch(() => false)) errs.push("show source left the rendered view drawn");
    await app.close();

    // The trace.
    const recs = windowRecords(launch);
    const shown = recs.filter((r) => r.name === "EDITOR_MARKDOWN_SHOWN").map((r) => r.payload.form);
    const follows = recs.filter((r) => r.name === "EDITOR_LINK_FOLLOWED").map((r) => `${String(r.payload.kind)}/${String(r.payload.view)}/${r.payload.found ? "found" : "missing"}`);
    const viaLink = recs.filter((r) => r.name === "EDITOR_FILE_OPENED" && r.payload.how === "link").length;
    const want = ["file/source/found", "file/source/found", "heading/source/found", "heading/source/found", "external/source/found", "file/source/missing",
      "heading/rendered/found", "heading/rendered/found", "external/rendered/found", "file/rendered/missing", "file/rendered/found"];
    if (JSON.stringify(shown) !== JSON.stringify(["rendered", "source"])) errs.push(`EDITOR_MARKDOWN_SHOWN ${JSON.stringify(shown)}`);
    if (JSON.stringify(follows) !== JSON.stringify(want)) errs.push(`EDITOR_LINK_FOLLOWED ${JSON.stringify(follows)}`);
    if (viaLink !== 2) errs.push(`EDITOR_FILE_OPENED how link ${viaLink}; two new tabs came from links`);
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const main = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> });
    const blocked = main.filter((r) => r.name === "NAVIGATION_BLOCKED" && r.payload.target_kind === "external").length;
    if (blocked !== 2) errs.push(`NAVIGATION_BLOCKED external ${blocked}; two addresses were followed`);
    for (const f of readdirSync(join(traces, boot))) {
      const t = readFileSync(join(traces, boot, f), "utf8");
      for (const leak of ["example.org", "nothing-here", "RUNBOOK.md", "licensing-and-use"]) if (t.includes(leak)) errs.push(`${f} holds "${leak}" (E1)`);
    }
    seen.push(`EDITOR_LINK_FOLLOWED ${follows.length}, EDITOR_MARKDOWN_SHOWN ${JSON.stringify(shown)}, FILE_OPENED how link ${viaLink}, NAVIGATION_BLOCKED external ${blocked}`);
    if (errs.length) throw new Error(errs.slice(0, 8).join("; "));
    console.log(`editor_markdown_links: ok — ${seen.join("; ")}; packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshots ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`editor_markdown_links: FAIL — ${(e as Error).message.split("\n")[0]}; ${seen.join("; ")}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
