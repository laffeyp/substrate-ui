// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Highlighting a person can see, graded by the pixels (sprint 475; BLACKBOARD 2026-11-11: "There is no syntax
// highlighting whatsoever … it's like it's all white text still"). Sprint 472's gate read computed styles, the
// structural lens; this one decodes the screenshot (ADDENDUMS.md A2). A repository written here holds main.rs, main.c
// and Cargo.toml; the deterministic driver. For each file, once its language has loaded: a screenshot; for each named
// token the glyph pixels inside the token's box are decoded from the PNG (the 15% of pixels farthest from the ground,
// averaged: the glyph's inked core), and their colour is within 40 (RGB distance) of the palette's colour for that
// token; in main.rs the keyword's colour is more than 60 from the bound name's. Sprint 481: the colours are each look's palette;
// every pair of coloured classes decodes at least 8 ΔE2000 apart under `new`; under `original` (Settings) main.c draws
// sprint 475's palette. Prints each token's decoded colour.
// Screenshots go to runs/packaged/sprint-475-<stamp>-<source|packaged>/. SHAKEOUT_APP=<Substrate.app> runs the bundle.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";
import { decodePng } from "../pixel/png";
import { ciede2000 } from "../pixel/ciede2000";

const REPO_ROOT = join(__dirname, "..", "..");
const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
type Rgb = [number, number, number];
const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const dist = (a: Rgb, b: Rgb) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const GROUND = hex("#212327");
/** Each look's palette, as `web/app/derive/look.ts` holds it: sprint 481's notes (new) and sprint 475's (original). */
type Cls = "keyword" | "string" | "number" | "type" | "name" | "meta";
const PALETTE: Record<"new" | "original", Record<Cls, string>> = {
  new: { keyword: "#7da3ca", string: "#c7ade6", number: "#d496c3", type: "#b0bbd2", name: "#e8eaee", meta: "#948dc5" },
  original: { keyword: "#82a5c8", string: "#b7a4d8", number: "#cc8fb8", type: "#a9c0d8", name: "#e8eaee", meta: "#9c8fc4" },
};
/** Each file: its text, its language, and the tokens to check: [text, class]. */
const FILES: { name: string; text: string; language: string; tokens: [string, Cls][] }[] = [
  { name: "main.rs", language: "Rust", text: '// a comment\nfn main() {\n    let total = 42;\n    let label = "text";\n}\n',
    tokens: [["fn", "keyword"], ["let", "keyword"], ['"text"', "string"], ["42", "number"], ["total", "name"]] },
  { name: "main.c", language: "C", text: '#include <stdio.h>\n/* a program */\nint main(void) {\n  printf("hello");\n  return 0;\n}\n',
    tokens: [["int", "type"], ["return", "keyword"], ['"hello"', "string"], ["0", "number"], ["#include", "meta"]] },
  { name: "Cargo.toml", language: "TOML", text: '# the package\n[package]\nname = "demo"\nversion = "0.1.0"\n',
    tokens: [['"demo"', "string"]] },
];
/** The box of the first occurrence of `token` as a whole word in the code, in CSS pixels. */
const boxOf = (win: Page, token: string) => win.evaluate(`(function (token) {
  var h = document.querySelector("[data-editor-code]"); var root = h && h.shadowRoot; if (!root) return null;
  var content = root.querySelector(".cm-content"); if (!content) return null;
  var walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT); var node;
  var word = /^[A-Za-z0-9_]+$/.test(token);
  while ((node = walker.nextNode())) {
    var text = node.textContent || ""; var at = text.indexOf(token);
    while (at >= 0) {
      var before = at > 0 ? text[at - 1] : ""; var after = text[at + token.length] || "";
      if (!word || (!/[A-Za-z0-9_]/.test(before) && !/[A-Za-z0-9_]/.test(after))) {
        var range = document.createRange(); range.setStart(node, at); range.setEnd(node, at + token.length);
        var r = range.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
      }
      at = text.indexOf(token, at + 1);
    }
  }
  return null;
})(${JSON.stringify(token)})`) as Promise<{ x: number; y: number; w: number; h: number } | null>;
const statusLanguage = (win: Page) => win.evaluate(`(function () { var e = document.querySelector("[data-status-language]"); return e ? e.textContent : null; })()`) as Promise<string | null>;
const returned = (win: Page) => win.evaluate(() => ((window as unknown as { __vm: { get(n: number): { snapshot(): { rawEnvelopes: { kind: string }[] } } } }).__vm.get(1).snapshot().rawEnvelopes ?? []).filter((e) => e.kind === "Returned").length);
async function until<T>(win: Page, what: string, read: () => Promise<T>, ok: (v: T) => boolean, ms = 20_000): Promise<T> {
  const deadline = Date.now() + ms;
  let v = await read();
  while (!ok(v) && Date.now() < deadline) { await settled(win); v = await read(); }
  if (!ok(v)) throw new Error(`${what}: ${JSON.stringify(v)}`);
  return v;
}

async function main(): Promise<void> {
  const packaged = !!process.env.SHAKEOUT_APP;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const shots = join(REPO_ROOT, "runs", "packaged", `sprint-481-${stamp}-${packaged ? "packaged" : "source"}`);
  mkdirSync(shots, { recursive: true });
  const repo = join(__dirname, ".scratch", "editor-highlight-seen-" + process.pid);
  mkdirSync(repo, { recursive: true });
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.email", "gate@example.invalid"); git(repo, "config", "user.name", "gate");
  for (const f of FILES) writeFileSync(join(repo, f.name), f.text);
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "base");
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let status = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    await win.waitForFunction(() => window.innerWidth === 1512, undefined, { timeout: 10_000 });
    await bindPaneAsUser(win, "deterministic", { folder: repo });
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await until(win, "hello's Returned", () => returned(win), (n) => n >= 1, 30_000);
    await win.keyboard.press("Meta+Shift+E");
    const report: string[] = [];
    const seenBy: Partial<Record<Cls, Rgb>> = {};
    const checkFile = async (f: (typeof FILES)[number], look: "new" | "original") => {
      await win.locator(`[data-tree-row="${f.name}"]`).first().click();
      await until(win, `${f.name}'s language`, () => statusLanguage(win), (l) => l === f.language);
      // The parser's tokens: the first token's colour leaves the text's white once the language has applied.
      const first = f.tokens[0];
      const decode = async () => {
        const png = await win.screenshot({ path: join(shots, `${f.name}.png`) });
        const img = decodePng(png);
        const scale = img.width / (await win.evaluate(() => window.innerWidth));
        const out: Record<string, Rgb | null> = {};
        for (const [token] of f.tokens) {
          const b = await boxOf(win, token);
          if (!b) { out[token] = null; continue; }
          const px: { c: Rgb; d: number }[] = [];
          for (let y = Math.ceil(b.y * scale); y < Math.floor((b.y + b.h) * scale); y++) {
            for (let x = Math.ceil(b.x * scale); x < Math.floor((b.x + b.w) * scale); x++) {
              const i = (y * img.width + x) * 4;
              const c: Rgb = [img.data[i], img.data[i + 1], img.data[i + 2]];
              px.push({ c, d: dist(c, GROUND) });
            }
          }
          px.sort((a, z) => z.d - a.d);
          const core = px.slice(0, Math.max(1, Math.floor(px.length * 0.15)));
          out[token] = [0, 1, 2].map((k) => Math.round(core.reduce((s, p) => s + p.c[k], 0) / core.length)) as Rgb;
        }
        return out;
      };
      const seen = await until(win, `${look} ${f.name} drawn in its colours`, decode, (o) => !!o[first[0]] && dist(o[first[0]]!, hex(PALETTE[look][first[1]])) < 40);
      for (const [token, cls] of f.tokens) {
        const got = seen[token], want = PALETTE[look][cls];
        report.push(`${look} ${f.name} ${token}=${got ? `rgb(${got.join(",")})` : "none"} want ${want}`);
        if (!got || dist(got, hex(want)) >= 40) throw new Error(`${look} ${f.name}: ${token} drawn ${got ? `rgb(${got.join(",")})` : "not found"}, want ${want} (distance ${got ? Math.round(dist(got, hex(want))) : "-"})`);
        if (look === "new" && cls !== "name" && !seenBy[cls]) seenBy[cls] = got;
      }
      if (f.name === "main.rs" && dist(seen.fn!, seen.total!) <= 60) throw new Error(`main.rs: the keyword and the bound name are ${Math.round(dist(seen.fn!, seen.total!))} apart`);
    };
    for (const f of FILES) await checkFile(f, "new");
    // Sprint 481 (E20): every pair of coloured classes, as decoded, at least 8 ΔE2000 apart (CIEDE2000, `pixel/ciede2000.ts`).
    const classes = Object.keys(seenBy) as Cls[];
    for (let i = 0; i < classes.length; i++) for (let j = i + 1; j < classes.length; j++) {
      const d = ciede2000(seenBy[classes[i]]!, seenBy[classes[j]]!);
      report.push(`${classes[i]}/${classes[j]} ΔE2000 ${d.toFixed(1)}`);
      if (d < 8) throw new Error(`${classes[i]} and ${classes[j]} decode ${d.toFixed(1)} ΔE2000 apart, want at least 8`);
    }
    // The original look (sprint 478) draws sprint 475's palette.
    await win.keyboard.press("Meta+,");
    await win.locator('[data-setting-look="original"]').first().click();
    await win.keyboard.press("Escape");
    await checkFile(FILES[1], "original");
    await app.close();
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const booted = readFileSync(join(traces, boot, "main.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { name: string; payload: Record<string, unknown> }).find((r) => r.name === "APP_BOOTED")!.payload;
    if (packaged && booted.packaged !== true) throw new Error(`APP_BOOTED packaged ${String(booted.packaged)}`);
    console.log(`editor_highlight_seen: ok — decoded from the screenshots: ${report.join("; ")}; packaged=${String(booted.packaged)}; screenshots in ${shots}`);
    status = 0;
  } catch (e) {
    console.error(`editor_highlight_seen: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: status !== 0 });
    rmSync(repo, { recursive: true, force: true });
  }
  process.exit(status);
}

main();
