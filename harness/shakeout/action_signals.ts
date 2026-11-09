// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The user actions v0.24 gave tags (P-0.24-ACTIONS, sprint 385), driven as a user does and read from
// window-1.jsonl after the app closes. After one deterministic turn in pane 1:
//   find:    ⌘F, type "ab", Escape, ⌘F, ⌘F           FIND_OPENED, FIND_QUERY_CHANGED 1 and 2,
//                                                     FIND_CLOSED escape, FIND_OPENED, FIND_CLOSED toggle
//   cards:   model chip, workspace chip, Escape,      TOP_BAR_CARD_SET model open; model closed
//            model chip, a click outside              other_card and workspace open; workspace closed
//                                                     escape; model open; model closed outside
//   meta:    ⌘M; → side; a side-graph segment twice;  STREAM_DIRECTION_SET side; SEQ_SELECTED side_graph
//            ⇅ down; app; all; a stream row           seq, then null; down; STREAM_LEVEL_SET app, all;
//                                                     SEQ_SELECTED stream_row; FIND_SCOPE_SET stream
//   language: /language; each stream tab; another    LANGUAGE_STREAM_SET per change; LANGUAGE_VIEW_SET;
//            view; a language row; ↓ ↑ → ←            SEQ_SELECTED language_row, language_key twice;
//                                                     LANGUAGE_LANE_SET 1, 0
// (SEQ_SELECTED language_open, /language at a shift's turn, is checked by language_bar_line.ts.)
// then a recorded session with one finished tool call (fixtures/write_session_shapes.py):
//   tools:   its card's summary clicked twice; ⌘E;    TOOL_CARD_TOGGLED twice, open flipping;
//            /fold; /unfold                           TOOL_OUTPUT_MODE_SET key, slash, slash, and no
//                                                     TOOL_CARD_TOGGLED for the cards they move
//   picked:  the model chip; ⌘D; ↵ ↵ in pane 2's      TOP_BAR_CARD_SET model open; closed picked
//            picker
// Every pane tag is in pane 1's context; a set to the value shown writes nothing; the find query is
// written as its length only (E1).

import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords, type WindowRecord } from "./lib/electron";

const REPO = join(__dirname, "..", "..");
const failures: string[] = [];
const check = (ok: boolean, what: string) => { if (!ok) failures.push(what); console.log(`${ok ? "ok  " : "FAIL"} ${what}`); };
const visible = (win: Page, sel: string) => win.locator(sel).filter({ visible: true }).first();

async function slash(win: Page, line: string): Promise<void> {
  const input = visible(win, "textarea[data-input-bar]");
  await input.click();
  await input.fill(line);
  await win.keyboard.press("Enter");
  await settled(win);
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const ids = JSON.parse(execFileSync("uv", ["run", "--project", "../substrate", "python", "harness/shakeout/fixtures/write_session_shapes.py"], {
    cwd: REPO, env: { ...process.env, SUBSTRATE_HOME: launch.state }, encoding: "utf8",
  }).trim().split("\n").pop()!) as { old: string; new: string };
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic");
    await visible(win, "textarea[data-input-bar]").fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    // A second turn, so the language lens has two turns for its keys to move between.
    await visible(win, "textarea[data-input-bar]").fill("again");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => { const s = (window as any).__vm?.get?.(1)?.snapshot(); return !!s?.parkReason && s.transcript.filter((r: { role: string }) => r.role === "model").length >= 2; }, undefined, { timeout: 30_000 });
    // Each step starts at the window's next record number; its checks run on window-1.jsonl after the
    // app has closed, on the records from that number to the next step's.
    const mark = () => win.evaluate(() => { const b = (window as any).__vmSignals as { proc_seq: number }[]; return b.length ? b[b.length - 1].proc_seq + 1 : 0; });
    const steps: { from: number; check: (recs: [string, Record<string, unknown>][]) => void }[] = [];
    const step = async (check: (recs: [string, Record<string, unknown>][]) => void) => { steps.push({ from: await mark(), check }); };

    // Find.
    let openBefore = false;
    let segSeq = -1, rowSeq = -1, tabs: string[] = [];
    await step((all) => {
      const findRecs = all.filter(([n]) => /^FIND_/.test(n));
      check(JSON.stringify(findRecs) === JSON.stringify([
        ["FIND_OPENED", { scope: "transcript" }], ["FIND_QUERY_CHANGED", { length: 1 }], ["FIND_QUERY_CHANGED", { length: 2 }],
        ["FIND_CLOSED", { cause: "escape" }], ["FIND_OPENED", { scope: "transcript" }], ["FIND_CLOSED", { cause: "toggle" }],
      ]), `find (${JSON.stringify(findRecs)})`);
    });
    await win.keyboard.press("Meta+f");
    const find = visible(win, 'input[placeholder="find in transcript"]');
    await find.waitFor({ state: "visible", timeout: 5_000 });
    await find.click();
    await win.keyboard.type("ab");
    await win.keyboard.press("Escape");
    await settled(win);
    await win.keyboard.press("Meta+f");
    await settled(win);
    await win.keyboard.press("Meta+f");
    await settled(win);

    // The top bar's cards.
    await step((all) => {
      const cards = all.filter(([n]) => n === "TOP_BAR_CARD_SET");
      check(JSON.stringify(cards) === JSON.stringify([
        ["TOP_BAR_CARD_SET", { card: "model", open: true, cause: "click" }],
        ["TOP_BAR_CARD_SET", { card: "model", open: false, cause: "other_card" }],
        ["TOP_BAR_CARD_SET", { card: "workspace", open: true, cause: "click" }],
        ["TOP_BAR_CARD_SET", { card: "workspace", open: false, cause: "escape" }],
        ["TOP_BAR_CARD_SET", { card: "model", open: true, cause: "click" }],
        ["TOP_BAR_CARD_SET", { card: "model", open: false, cause: "outside" }],
      ]), `cards (${JSON.stringify(cards)})`);
    });
    await visible(win, "[data-model-chip]").click();
    await settled(win);
    await visible(win, ".hover-top-bar-ws-chip").click();
    await settled(win);
    await win.keyboard.press("Escape");
    await settled(win);
    await visible(win, "[data-model-chip]").click();
    await settled(win);
    await visible(win, "[data-vm-transcript-mount]").click({ position: { x: 5, y: 5 } });
    await settled(win);

    // Meta's stream lens.
    await win.keyboard.press("Meta+m");
    await visible(win, '[data-lens-chip="stream"]').waitFor({ state: "visible", timeout: 10_000 });
    await step((all) => {
      const metaRecs = all.filter(([n]) => /^(STREAM_|SEQ_SELECTED|FIND_SCOPE_SET)/.test(n));
      check(JSON.stringify(metaRecs) === JSON.stringify([
        ["STREAM_DIRECTION_SET", { direction: "side" }],
        ["SEQ_SELECTED", { seq: segSeq, how: "side_graph" }], ["SEQ_SELECTED", { seq: null, how: "side_graph" }],
        ["STREAM_DIRECTION_SET", { direction: "down" }],
        ["STREAM_LEVEL_SET", { level: "app" }], ["STREAM_LEVEL_SET", { level: "all" }],
        ["SEQ_SELECTED", { seq: rowSeq, how: "stream_row" }], ["FIND_SCOPE_SET", { scope: "stream" }],
      ]), `meta (${JSON.stringify(metaRecs)})`);
    });
    await win.getByText("→ side", { exact: true }).click();
    const seg = visible(win, ".hover-side-seg");
    await seg.waitFor({ state: "visible", timeout: 5_000 });
    segSeq = Number((await seg.getAttribute("title"))!.match(/seq (\d+)/)![1]);
    await seg.click();
    await settled(win);
    await seg.click();
    await settled(win);
    await win.getByText("⇅ down", { exact: true }).click();
    await win.getByText("app", { exact: true }).click();
    await win.getByText("all", { exact: true }).click();
    await win.getByText("all", { exact: true }).click();
    const row = visible(win, "[data-stream-row]");
    rowSeq = Number(await row.getAttribute("data-stream-row"));
    await row.click();
    await settled(win);

    // The language lens.
    await win.keyboard.press("Meta+m");
    await settled(win);
    await slash(win, "/language");
    await win.waitForFunction(`document.querySelectorAll("[data-lang-row]").length > 0`, undefined, { timeout: 10_000 });
    await step((all) => {
      const lang = all.filter(([n]) => /^(LANGUAGE_|SEQ_SELECTED)/.test(n));
      const streams = lang.filter(([n]) => n === "LANGUAGE_STREAM_SET").map(([, p]) => p.stream);
      check(streams.length === tabs.length && streams[streams.length - 1] === "model", `LANGUAGE_STREAM_SET for each tab changed to, back to model (${JSON.stringify(streams)})`);
      check(lang.some(([n]) => n === "LANGUAGE_VIEW_SET"), `LANGUAGE_VIEW_SET (${JSON.stringify(lang)})`);
      const sels = lang.filter(([n]) => n === "SEQ_SELECTED").map(([, p]) => p);
      check(sels.length === 3 && sels[0].how === "language_row" && sels[1].how === "language_key" && sels[2].how === "language_key" && sels[1].seq !== sels[0].seq && sels[2].seq === sels[0].seq, `SEQ_SELECTED: a language row, then ↓ and ↑ (${JSON.stringify(sels)})`);
      const lanes = lang.filter(([n]) => n === "LANGUAGE_LANE_SET").map(([, p]) => p.lane);
      check(JSON.stringify(lanes) === "[1,0]", `LANGUAGE_LANE_SET → then ← (${JSON.stringify(lanes)})`);
    });
    tabs = await win.locator("[data-lang-stream]").evaluateAll((els) => els.map((e) => e.getAttribute("data-lang-stream")!));
    for (const t of [...tabs.slice(1), tabs[0]]) { await win.locator(`[data-lang-stream="${t}"]`).first().click(); await settled(win); }
    const views = await win.locator("[data-lang-view]").evaluateAll((els) => els.map((e) => e.getAttribute("data-lang-view")!));
    await win.locator(`[data-lang-view="${views[views.length - 1]}"]`).first().click();
    await settled(win);
    await visible(win, "[data-lang-row]").click();
    await settled(win);
    // The language keys: ↓ and ↑ move the lit turn, → and ← the lane.
    await win.evaluate(`document.activeElement && document.activeElement.blur && document.activeElement.blur()`);
    for (const k of ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"]) { await win.keyboard.press(k); await settled(win); }

    // A tool card, and the fold toggle.
    await win.keyboard.press("Meta+m");
    await settled(win);
    await win.evaluate(async (id) => { await (window as any).__vm.get(1).attachExisting(id); }, ids.new);
    const summary = win.locator("[data-vm-transcript-mount] details > summary").filter({ visible: true }).first();
    await summary.waitFor({ state: "visible", timeout: 15_000 });
    openBefore = await summary.evaluate((s) => (s.parentElement as HTMLDetailsElement).open);
    await step((all) => {
      const tools = all.filter(([n]) => /^TOOL_/.test(n));
      const toggled = tools.filter(([n]) => n === "TOOL_CARD_TOGGLED").map(([, p]) => p);
      check(toggled.length === 2 && toggled[0].open === !openBefore && toggled[1].open === openBefore && toggled.every((p) => typeof p.seq === "number" && p.pane_id === 1 && typeof p.session_id === "string"), `TOOL_CARD_TOGGLED for the two clicks only (${JSON.stringify(toggled)})`);
      const modes = tools.filter(([n]) => n === "TOOL_OUTPUT_MODE_SET").map(([, p]) => `${p.mode}:${p.cause}`);
      check(modes.join(",") === "expanded:key,collapsed:slash,expanded:slash", `TOOL_OUTPUT_MODE_SET (${modes.join(", ")})`);
    });
    await summary.click();
    await settled(win);
    await summary.click();
    await settled(win);
    await win.keyboard.press("Meta+e");
    await settled(win);
    await slash(win, "/fold");
    await slash(win, "/unfold");

    // A model picked in a picker closes the model card: ⌘D with the card open, then pane 2 picks its model.
    await step((all) => {
      const cards = all.filter(([n]) => n === "TOP_BAR_CARD_SET");
      check(JSON.stringify(cards) === JSON.stringify([
        ["TOP_BAR_CARD_SET", { card: "model", open: true, cause: "click" }],
        ["TOP_BAR_CARD_SET", { card: "model", open: false, cause: "picked" }],
      ]), `a model picked closes the card (${JSON.stringify(cards)})`);
    });
    await visible(win, "[data-model-chip]").click();
    await settled(win);
    await win.keyboard.press("Meta+d");
    await settled(win);
    // Pane 2's picker has the focus: ↵ picks its folder, ↵ its model, which closes pane 1's card.
    for (const k of ["Enter", "Enter"]) { await win.keyboard.press(k); await settled(win); }
    await win.waitForFunction(() => ((window as any).__vmSignals as { name: string; pane_id: number | null }[]).some((r) => r.name === "DRIVER_PICKED" && r.pane_id === 2), undefined, { timeout: 10_000 })
      .catch(() => { throw new Error("pane 2's picker picked no model"); });
    await settled(win);
    const end = await mark();
    await app.close();
    const recs = windowRecords(launch);
    steps.forEach((st, i) => {
      const to = i + 1 < steps.length ? steps[i + 1].from : end;
      st.check(recs.filter((r) => r.proc_seq >= st.from && r.proc_seq < to).map((r) => [r.name, r.payload] as [string, Record<string, unknown>]));
    });
    const PANE_TAGS = new Set(["TOP_BAR_CARD_SET", "STREAM_DIRECTION_SET", "STREAM_LEVEL_SET", "SEQ_SELECTED", "LANGUAGE_STREAM_SET", "LANGUAGE_VIEW_SET", "LANGUAGE_LANE_SET", "TOOL_CARD_TOGGLED"]);
    const offPane = recs.filter((r: WindowRecord) => PANE_TAGS.has(r.name) && r.pane_id !== 1);
    check(offPane.length === 0, `every pane tag in pane 1's context, on disk (${offPane.map((r) => r.name).join(", ") || "all"})`);
    check(!JSON.stringify(recs.filter((r) => r.name.startsWith("FIND_"))).includes("ab"), "the find query's text is not written (E1)");
    code = failures.length ? 1 : 0;
    console.log(code === 0 ? "action_signals: ok — find, the top bar cards, meta's stream and language lenses, a tool card and the fold toggle are each written once per change" : `action_signals: FAIL — ${failures.length} check(s): ${failures.join("; ")}`);
  } catch (e) {
    console.error(`action_signals: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
