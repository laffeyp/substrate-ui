// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's split groups (sprint 504; roadmap 2026-11-14-editor-features r4 E6). The Architect, 2026-11-14:
// ⌘D and ⌘⇧D split the editor, a split opens from a tab's menu, tabs drag across group boundaries, a limit of
// three across and three down.
//
// The workspace is the large fixture set (lib/multipane.ts): twelve languages three to five folders deep and two
// long files of thousands of lines. Real key presses, real right-clicks, real drags. Each step is read from the DOM
// (each group's tabs, active file and code text, the focused group, the cells' rectangles) and, after quit, from the
// window's records. These agree:
//   groups — ⌘D then ⌘⇧D make three groups, each showing only its own file's code, the accent bar on the focused
//            group's tab alone (pixels); out of the editor and back the same; opening a file another group
//            holds focuses that group and adds no tab; the tab menu's "split right" makes a fourth;
//   drag   — a tab dragged onto another group's code moves there with its unsaved typing and leaves the code
//            untouched; the source group emptied by a drag closes;
//   limit  — ⌘D and ⌘⇧D pressed until refused: no line across or down crosses more than three groups, and the
//            refusal is EDITOR_KEY_REFUSED reason split_limit;
//   close  — ⌘W on an empty group closes it; ⌘W on a group's last tab closes the tab and the group;
//   trace  — EDITOR_GROUP_OPENED, EDITOR_TAB_MOVED and EDITOR_GROUP_CLOSED in the order of the steps, each with
//            the group count the DOM drew after it; the pixel anchor names an EDITOR_DRAWN whose groups is the
//            DOM's; no INVARIANT_BROKEN (S11 among them; lib/electron.ts fails the launch on any).
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Locator, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";
import { readPixels } from "./lib/editor_pixels";
import { decodePng } from "../pixel/png";
import { bigWorkspace, firstTurn, leaveEditor, openEditor, openFile } from "./lib/multipane";

const REPO = join(__dirname, "..", "..");

interface Group { id: number; focused: boolean; tabs: string[]; active: string | null; code: string; empty: boolean; left: number; top: number; right: number; bottom: number }

/** Every group as drawn: its tabs, active file, code text and rectangle. */
const groups = (win: Page) => win.evaluate(`(function () {
  return Array.from(document.querySelectorAll("[data-editor-group-cell]")).map(function (cell) {
    var root = cell.querySelector("[data-editor-group]");
    var tabs = Array.from(cell.querySelectorAll("[data-editor-tab]"));
    var act = tabs.find(function (t) { return t.getAttribute("data-active") === "1"; });
    var host = cell.querySelector("[data-editor-code]");
    var content = host && host.shadowRoot ? host.shadowRoot.querySelector(".cm-content") : null;
    var r = cell.getBoundingClientRect();
    return { id: Number(cell.getAttribute("data-editor-group-cell")), focused: !!root && root.getAttribute("data-focused") === "1",
      tabs: tabs.map(function (t) { return t.getAttribute("data-editor-tab"); }), active: act ? act.getAttribute("data-editor-tab") : null,
      code: content && host.offsetParent !== null ? content.textContent : "", empty: !!cell.querySelector("[data-editor-empty]"),
      left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  });
})()`) as Promise<Group[]>;

/** The most groups a line across (or down) crosses, from the drawn rectangles. */
function crossed(gs: Group[], across: boolean): number {
  let most = 0;
  for (const g of gs) {
    const at = across ? (g.top + g.bottom) / 2 : (g.left + g.right) / 2;
    most = Math.max(most, gs.filter((h) => (across ? h.top <= at && at < h.bottom : h.left <= at && at < h.right)).length);
  }
  return most;
}

/** A drag by the mouse, in steps (as editor_drag_chips.ts drives it), released at `at` inside the target. */
async function drag(win: Page, from: Locator, to: Locator, at?: { x: number; y: number }): Promise<void> {
  const a = (await from.boundingBox())!, b = (await to.boundingBox())!;
  await win.mouse.move(a.x + Math.min(20, a.width / 2), a.y + a.height / 2);
  await win.mouse.down();
  await win.mouse.move(a.x + 40, a.y + a.height / 2 + 10, { steps: 4 });
  await win.mouse.move(b.x + (at?.x ?? b.width / 2), b.y + (at?.y ?? b.height / 2), { steps: 8 });
  await win.mouse.up();
}

/** Of each group's active tab, whether the 2-pixel bar along its top is the accent #82a5c8 (blue over red by 45 or
 *  more, as editor_markdown_links.ts reads it), sampled from a screenshot at the window's pixel ratio. */
async function accentBars(win: Page): Promise<Record<number, boolean>> {
  const tabs = await win.evaluate(`Array.from(document.querySelectorAll("[data-editor-group-cell]")).map(function (cell) {
    var t = cell.querySelector('[data-editor-tab][data-active="1"]'); var r = t ? t.getBoundingClientRect() : null;
    return { id: Number(cell.getAttribute("data-editor-group-cell")), x: r ? r.left + r.width / 2 : -1, y: r ? r.top : -1, ratio: window.devicePixelRatio };
  })`) as { id: number; x: number; y: number; ratio: number }[];
  const img = decodePng(await win.screenshot());
  const out: Record<number, boolean> = {};
  for (const t of tabs) {
    if (t.x < 0) continue;
    const at = (Math.round(t.y * t.ratio + 1) * img.width + Math.round(t.x * t.ratio)) * 4;
    out[t.id] = img.data[at + 2] - img.data[at] >= 45 && img.data[at + 2] > 140;
  }
  return out;
}

const firstLine = (root: string, rel: string) => readFileSync(join(root, rel), "utf8").split("\n").find((l) => l.trim().length > 12)!.trim().slice(0, 40);

/** Opens `rel` from the tree; waits until group `group` shows it active with its code. */
async function openIn(win: Page, root: string, rel: string, group: number): Promise<void> {
  const parts = rel.split("/");
  for (let i = 1; i < parts.length; i++) {
    const dir = parts.slice(0, i).join("/");
    const row = win.locator(`[data-tree-row="${dir}"]`).first();
    await row.waitFor({ state: "visible", timeout: 10_000 });
    if (!(await win.locator(`[data-tree-row^="${dir}/"]`).first().isVisible().catch(() => false))) await row.click();
  }
  await win.locator(`[data-tree-row="${rel}"]`).first().click();
  await shows(win, group, rel, firstLine(root, rel));
}

async function shows(win: Page, group: number, rel: string, text: string): Promise<void> {
  await win.waitForFunction(([g, r, w]) => {
    const cell = document.querySelector(`[data-editor-group-cell="${g}"]`);
    const tab = cell?.querySelector(`[data-editor-tab="${r}"][data-active="1"]`);
    const code = cell?.querySelector("[data-editor-code]")?.shadowRoot?.querySelector(".cm-content")?.textContent ?? "";
    return !!tab && code.includes(w);
  }, [String(group), rel, text] as const, { timeout: 15_000 });
}

async function main(): Promise<void> {
  const ws = bigWorkspace("alpha");
  const pick = (end: string) => ws.files.find((f) => f.endsWith(end))!;
  const fileA = pick("models.py"), fileB = ws.files.find((f) => f.endsWith(".rs"))!, fileC = pick("long_one.txt"), fileD = ws.files.find((f) => f.endsWith(".go"))!;
  const launch = launchArgs();
  const shots = join(REPO, "runs", "packaged", `sprint-504-${process.env.SHAKEOUT_APP ? "bundle" : "source"}-${Date.now()}`);
  mkdirSync(shots, { recursive: true });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const errs: string[] = [];
  const seen: string[] = [];
  /** The group count the DOM drew after each grouping record's step, in order. */
  const counts: { name: string; groups: number }[] = [];
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await bindPaneAsUser(win, "deterministic", { folder: ws.root });
    await firstTurn(win, 1);
    await openEditor(win);
    await openFile(win, ws.root, fileA);
    // ⌘W is the menu's accelerator, which a synthetic key press does not reach; the gate clicks the menu item it fires.
    const closeKey = () => app.evaluate(({ Menu }) => { Menu.getApplicationMenu()?.getMenuItemById("menu-close-pane")?.click(); });
    const step = async (label: string, name?: string) => {
      await settled(win);
      const gs = await groups(win);
      if (name) counts.push({ name, groups: gs.length });
      seen.push(`${label}: ${gs.map((g) => `${g.id}${g.focused ? "*" : ""}[${g.tabs.map((t) => t.split("/").pop()).join(",")}]`).join(" ")}`);
      await win.screenshot({ path: join(shots, `${label.replace(/[^a-z0-9]+/gi, "-")}.png`) });
      return gs;
    };

    // ⌘D: a second group, empty and focused.
    await win.keyboard.press("Meta+d");
    let gs = await step("cmd-d", "EDITOR_GROUP_OPENED");
    if (gs.length !== 2 || !gs[1].focused || !gs[1].empty || gs[1].left <= gs[0].left) errs.push(`⌘D: ${JSON.stringify(gs.map((g) => [g.id, g.focused, g.empty]))}`);
    await openIn(win, ws.root, fileB, 2);
    // ⌘⇧D: a third, below the second.
    await win.keyboard.press("Meta+Shift+D");
    gs = await step("cmd-shift-d", "EDITOR_GROUP_OPENED");
    const g3 = gs.find((g) => g.id === 3);
    if (gs.length !== 3 || !g3?.focused || g3.top <= gs.find((g) => g.id === 2)!.top) errs.push(`⌘⇧D: ${JSON.stringify(gs.map((g) => [g.id, g.focused, g.top]))}`);
    await openIn(win, ws.root, fileC, 3);
    await openIn(win, ws.root, fileD, 3);
    gs = await step("three-groups");
    const own = { 1: fileA, 2: fileB, 3: fileD } as Record<number, string>;
    const bars = await accentBars(win);
    seen.push(`accent bars ${JSON.stringify(bars)}`);
    if (JSON.stringify(bars) !== JSON.stringify({ 1: false, 2: false, 3: true })) errs.push(`the accent bar is not on the focused group's tab alone: ${JSON.stringify(bars)}`);
    // Out of the editor and back (⌘⇧E twice): the same groups, tabs, focus and code.
    await leaveEditor(win);
    await openEditor(win);
    for (const g of gs) await shows(win, g.id, own[g.id], firstLine(ws.root, own[g.id])).catch(() => errs.push(`back in the editor, group ${g.id} does not show ${own[g.id]}`));
    const back = await step("back-in-editor");
    const shape = (list: Group[]) => JSON.stringify(list.map((g) => [g.id, g.focused, g.tabs, g.active]));
    if (shape(back) !== shape(gs)) errs.push(`back in the editor: ${shape(back)}; before ${shape(gs)}`);
    for (const g of gs) {
      if (g.active !== own[g.id]) errs.push(`group ${g.id} shows ${String(g.active)}, not ${own[g.id]}`);
      if (!g.code.includes(firstLine(ws.root, own[g.id]))) errs.push(`group ${g.id}'s code is not ${own[g.id]}'s`);
      for (const other of [1, 2, 3].filter((o) => o !== g.id)) if (g.tabs.includes(own[other])) errs.push(`group ${g.id} holds group ${other}'s tab`);
    }

    // Opening a file group 1 holds, from group 3: group 1 takes the focus, group 3 gains no tab.
    await openIn(win, ws.root, fileA, 1);
    gs = await step("reopen-a");
    if (!gs.find((g) => g.id === 1)?.focused || gs.find((g) => g.id === 3)?.tabs.length !== 2) errs.push(`reopening ${fileA}: ${JSON.stringify(gs.map((g) => [g.id, g.focused, g.tabs.length]))}`);

    // The tab menu's split right: a fourth group, focused.
    await win.locator(`[data-editor-group-cell="1"] [data-editor-tab="${fileA}"]`).click({ button: "right" });
    await win.locator('[data-context-item="split right"]').click();
    gs = await step("menu-split-right", "EDITOR_GROUP_OPENED");
    if (gs.length !== 4 || !gs.find((g) => g.id === 4)?.focused) errs.push(`menu split: ${JSON.stringify(gs.map((g) => [g.id, g.focused]))}`);

    // Typing in D (group 3), then D's tab dragged onto group 1's code: it moves with the typing; group 1's code keeps its text.
    const mark = "typed_in_group_three_504";
    await win.locator(`[data-editor-group-cell="3"] [data-editor-code]`).click({ position: { x: 200, y: 20 } });
    await win.keyboard.press("Meta+ArrowUp");
    await win.keyboard.type(mark + " ");
    const before1 = (await groups(win)).find((g) => g.id === 1)!.code;
    await drag(win, win.locator(`[data-editor-group-cell="3"] [data-editor-tab="${fileD}"]`), win.locator(`[data-editor-group-cell="1"] [data-editor-code]`));
    gs = await step("drag-d-to-1", "EDITOR_TAB_MOVED");
    const g1 = gs.find((g) => g.id === 1)!;
    if (g1.active !== fileD || !g1.code.includes(mark)) errs.push(`drag D: group 1 shows ${String(g1.active)}, typing ${g1.code.includes(mark) ? "kept" : "lost"}`);
    if (gs.find((g) => g.id === 3)?.tabs.includes(fileD)) errs.push("drag D: group 3 still holds D");
    if (!(await win.locator(`[data-editor-group-cell="1"] [data-editor-tab-unsaved="${fileD}"]`).count())) errs.push("drag D: the unsaved dot did not move with the tab");
    await win.locator(`[data-editor-group-cell="1"] [data-editor-tab="${fileA}"]`).click();
    await shows(win, 1, fileA, firstLine(ws.root, fileA));
    if ((await groups(win)).find((g) => g.id === 1)!.code !== before1) errs.push(`drag D: group 1's ${fileA} changed under the drop`);

    // C's tab, group 3's last, dragged onto group 4's placeholder: group 3 closes.
    await drag(win, win.locator(`[data-editor-group-cell="3"] [data-editor-tab="${fileC}"]`), win.locator('[data-editor-group-cell="4"]'));
    gs = await step("drag-c-to-4");
    // The move is recorded with the groups at the move, before its emptied source closes.
    counts.push({ name: "EDITOR_TAB_MOVED", groups: gs.length + 1 }, { name: "EDITOR_GROUP_CLOSED", groups: gs.length });
    if (gs.length !== 3 || gs.some((g) => g.id === 3) || gs.find((g) => g.id === 4)?.active !== fileC) errs.push(`drag C: ${JSON.stringify(gs.map((g) => [g.id, g.active]))}`);

    // The limit: ⌘D, then ⌘⇧D, until each is refused.
    const refusedBefore = async () => win.evaluate("(window.__vmSignals || []).filter(function (s) { return s.name === 'EDITOR_KEY_REFUSED'; }).length") as Promise<number>;
    for (const key of ["Meta+d", "Meta+Shift+D"]) {
      for (let k = 0; k < 10; k++) {
        const had = await refusedBefore();
        await win.keyboard.press(key);
        await settled(win);
        if ((await refusedBefore()) > had) break;
        gs = await step(`limit-${key}-${k}`, "EDITOR_GROUP_OPENED");
        if (crossed(gs, true) > 3 || crossed(gs, false) > 3) errs.push(`${key} ${k}: ${crossed(gs, true)} across, ${crossed(gs, false)} down`);
      }
    }
    gs = await step("at-limit");
    if (crossed(gs, true) !== 3 || crossed(gs, false) !== 3) errs.push(`at the limit: ${crossed(gs, true)} across, ${crossed(gs, false)} down`);

    // ⌘W on the focused empty group closes it; ⌘W on group 2's only tab closes the tab and the group.
    const focusedEmpty = gs.find((g) => g.focused);
    if (!focusedEmpty?.empty) errs.push("at the limit the focused group is not the new empty one");
    await closeKey();
    gs = await step("cmd-w-empty", "EDITOR_GROUP_CLOSED");
    if (gs.some((g) => g.id === focusedEmpty?.id)) errs.push(`⌘W left the empty group ${String(focusedEmpty?.id)}`);
    await win.locator('[data-editor-group-cell="2"] [data-editor-code]').click({ position: { x: 200, y: 40 } });
    await closeKey();
    gs = await step("cmd-w-last-tab", "EDITOR_GROUP_CLOSED");
    if (gs.some((g) => g.id === 2)) errs.push("⌘W on group 2's last tab left group 2");
    const px = await readPixels(win, join(shots, "final.png"), 0);
    const anchorSeq = "error" in px.anchor2 ? null : px.anchor2.seq;
    const finalGroups = gs.length;

    await app.close();
    const recs = windowRecords(launch);
    const grouping = recs.filter((r) => ["EDITOR_GROUP_OPENED", "EDITOR_TAB_MOVED", "EDITOR_GROUP_CLOSED"].includes(r.name)).map((r) => `${r.name}:${String(r.payload.groups)}`);
    const want = counts.map((c) => `${c.name}:${c.groups}`);
    if (JSON.stringify(grouping) !== JSON.stringify(want)) errs.push(`records ${JSON.stringify(grouping)}; the DOM ${JSON.stringify(want)}`);
    const opened = recs.filter((r) => r.name === "EDITOR_GROUP_OPENED").map((r) => `${String(r.payload.dir)}/${String(r.payload.how)}`);
    if (JSON.stringify(opened.slice(0, 3)) !== JSON.stringify(["right/key", "down/key", "right/menu"])) errs.push(`EDITOR_GROUP_OPENED ${JSON.stringify(opened)}`);
    const closed = recs.filter((r) => r.name === "EDITOR_GROUP_CLOSED").map((r) => String(r.payload.how));
    if (JSON.stringify(closed) !== JSON.stringify(["moved", "key", "last_tab"])) errs.push(`EDITOR_GROUP_CLOSED ${JSON.stringify(closed)}`);
    const refused = recs.filter((r) => r.name === "EDITOR_KEY_REFUSED").map((r) => `${String(r.payload.key)}:${String(r.payload.reason)}`);
    if (JSON.stringify(refused) !== JSON.stringify(["Meta+d:split_limit", "Meta+Shift+D:split_limit"])) errs.push(`EDITOR_KEY_REFUSED ${JSON.stringify(refused)}`);
    const drawn = recs.find((r) => r.proc_seq === anchorSeq);
    if (!drawn || drawn.name !== "EDITOR_DRAWN" || Number(drawn.payload.groups) !== finalGroups) errs.push(`the anchor's seq ${String(anchorSeq)} names ${drawn ? `${drawn.name} groups ${String(drawn.payload.groups)}` : "nothing"}; the DOM ${finalGroups}`);
    seen.push(`records ${grouping.length} in step order; opened ${opened.join(",")}; closed ${closed.join(",")}; refused ${refused.join(",")}; anchor seq ${String(anchorSeq)} EDITOR_DRAWN groups ${finalGroups}`);
    if (errs.length) throw new Error(errs.slice(0, 8).join("; "));
    console.log(`editor_groups: ok —\n  ${seen.join("\n  ")}\n  packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshots ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`editor_groups: FAIL — ${(e as Error).message.split("\n").slice(0, 12).join("\n")}\n  ${seen.join("\n  ")}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
