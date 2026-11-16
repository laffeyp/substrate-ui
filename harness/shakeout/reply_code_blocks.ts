// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Fenced code in replies (sprint 512; roadmap 2026-11-14-editor-features r5 E12; the Architect, 2026-11-15: "Each block
// may highlight once its closing fence arrives, but it must be built in the correct format while that happens").
//
// A reply reaches the window as one whole ModelReply envelope; Substrate has no reply-delta kind. An open fence reaches
// the window when a reply stops inside a block (its token limit, an interrupt). The gate serves two replies from a local
// server, each fetched by a scripted deterministic session (`web_fetch` returns the body as it is, and a scripted
// session replies with its last tool's output):
//   open   — prose, then a Rust block of the real memchr.rs fixture's first 60 lines with no closing fence;
//   closed — the same prose and Rust block, closed, then Python (models.py, 40 lines), shell, and an untagged block.
// These agree:
//   form   — the open block is drawn as a code box: the label "rust", the box's ground, monospace, no colour tokens;
//   place  — each line of the open block sits where the same line sits in the closed one (within 1 px of the box\'s
//            top and left), and the boxes are the same width;
//   colour — the closed blocks parse as Rust, Python and Shell; the untagged one stays plain; a Rust keyword\'s ink is
//            the palette\'s keyword colour (CIEDE2000 under 12), a Python string\'s the string colour;
//   once   — each closed block\'s text is parsed once, after the pane leaves for the editor and comes back twice;
//            the open block\'s text is never parsed;
//   trace  — no INVARIANT_BROKEN (lib/electron.ts fails the launch on any).
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Locator, type Page } from "playwright";
import { ciede2000 } from "../pixel/ciede2000";
import { decodePng } from "../pixel/png";
import { launchArgs, settled, waitForApp } from "./lib/electron";
import { leaveEditor, openEditor } from "./lib/multipane";

const REPO = join(__dirname, "..", "..");
const FIX = join(REPO, "harness", "fixtures", "code");
const KEYWORD = "#7da3ca", STRING = "#c7ade6";
const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

const lines = (file: string, n: number) => readFileSync(join(FIX, file), "utf8").split("\n").slice(0, n).join("\n");
const RUST = lines("memchr.rs", 60), PY = lines("models.py", 40);
const SH = 'for f in src/*.rs; do\n  printf "%s: %d\\n" "$f" "$(wc -l < "$f")"\ndone | sort -t: -k2 -n';
const PLAIN = "total 48\n-rw-r--r--  1 gate  staff  2210 memchr.rs\n-rw-r--r--  1 gate  staff  9876 models.py";
const PROSE = "Here is the search loop from memchr, then the model layer.\n\n";
const OPEN_RUST = RUST.split("\n").slice(0, 34).join("\n");
const OPEN = `${PROSE}\`\`\`rust\n${OPEN_RUST}`;
const CLOSED = `${PROSE}\`\`\`rust\n${RUST}\n\`\`\`\n\nAnd the models:\n\n\`\`\`python\n${PY}\n\`\`\`\n\nTo count lines:\n\n\`\`\`sh\n${SH}\n\`\`\`\n\nThe listing:\n\n\`\`\`\n${PLAIN}\n\`\`\`\n`;

async function ink(el: Locator): Promise<{ rgb: [number, number, number]; n: number }> {
  await el.scrollIntoViewIfNeeded();
  const img = decodePng(await el.screenshot());
  const ground = rgb("#1a1c20");
  const px: [number, number, number][] = [];
  for (let i = 0; i < img.data.length; i += 4) {
    const c: [number, number, number] = [img.data[i], img.data[i + 1], img.data[i + 2]];
    if (ciede2000(c, ground) > 25) px.push(c);
  }
  if (!px.length) return { rgb: [0, 0, 0], n: 0 };
  const med = (k: 0 | 1 | 2) => px.map((c) => c[k]).sort((a, b) => a - b)[Math.floor(px.length / 2)];
  return { rgb: [med(0), med(1), med(2)], n: px.length };
}

/** Each line's first character, as offsets from the pre's top-left, and the pre's width. */
const placeOf = (pre: Locator) => pre.evaluate((el) => {
  const box = el.getBoundingClientRect();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const out: { top: number; left: number }[] = [];
  let atStart = true;
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n.textContent ?? "";
    for (let i = 0; i < t.length; i++) {
      if (atStart && t[i] !== "\n") {
        const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1);
        const b = r.getBoundingClientRect();
        out.push({ top: b.top - box.top, left: b.left - box.left });
      }
      if (t[i] === "\n") { if (atStart) out.push({ top: Number.NaN, left: Number.NaN }); atStart = true; } else atStart = false;
    }
  }
  return { width: box.width, lines: out };
});

async function session(win: Page, base: string, url: string): Promise<void> {
  const post = (path: string, body: unknown) => fetch(base + path, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const { session_id: sid } = await (await post("/api/session", { driver: "deterministic", driver_params: { script: [["web_fetch", [url]]] } })).json() as { session_id: string };
  await win.evaluate(`(function () { var vm = window.__vm; return (vm.get(1) || vm.spawn(1)).attachExisting(${JSON.stringify(sid)}); })()`);
  await win.waitForFunction(`window.__vm.get(1).snapshot().sessionId === ${JSON.stringify(sid)}`, undefined, { timeout: 15_000 });
  if (!(await post(`/api/session/${sid}/turn`, { text: "show the code" })).ok) throw new Error("the turn was refused");
  await win.waitForFunction("window.__vm.get(1).snapshot().parkReason", undefined, { timeout: 30_000 });
  await win.waitForFunction(() => document.querySelector("[data-reply-code]") !== null, undefined, { timeout: 15_000 }).catch(() => undefined);
  await settled(win);
}

async function main(): Promise<void> {
  const server = createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }); res.end(req.url === "/open.md" ? OPEN : CLOSED); });
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const md = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const launch = launchArgs();
  const shots = join(REPO, "runs", "packaged", `sprint-512-${process.env.SHAKEOUT_APP ? "bundle" : "source"}-${Date.now()}`);
  mkdirSync(shots, { recursive: true });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const errs: string[] = [];
  const seen: string[] = [];
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setContentSize(1512, 945); });
    const base = `http://127.0.0.1:${new URL(win.url()).port}`;

    // The reply that stops inside its Rust block.
    await session(win, base, `${md}/open.md`);
    const open = win.locator('[data-reply-code="rust"]').first();
    if (!(await open.count())) throw new Error("the reply cut off inside its Rust block draws no code box");
    const openForm = await open.evaluate((el) => {
      const box = el.parentElement as HTMLElement;
      return { closed: el.getAttribute("data-closed"), label: (box.firstElementChild as HTMLElement).textContent, ground: getComputedStyle(box).backgroundColor, font: getComputedStyle(el).fontFamily, tokens: el.querySelectorAll("[data-tk]").length, text: el.textContent };
    });
    seen.push(`open block: closed ${String(openForm.closed)}, label ${String(openForm.label)}, ground ${openForm.ground}, tokens ${openForm.tokens}`);
    if (openForm.closed !== "0" || openForm.label !== "rust" || openForm.ground !== "rgb(26, 28, 32)" || !/monospace/.test(openForm.font) || openForm.tokens) errs.push(`the open block\'s form ${JSON.stringify({ ...openForm, text: undefined })}`);
    if (openForm.text !== OPEN_RUST) errs.push("the open block\'s text is not the reply\'s 34 lines");
    const openPlace = await placeOf(open);
    await open.screenshot({ path: join(shots, "open-block.png") });

    // The reply with every block closed.
    await session(win, base, `${md}/closed.md`);
    await win.waitForFunction(() => {
      const langs = Array.from(document.querySelectorAll("[data-reply-code]")).map((e) => e.getAttribute("data-tool-lang"));
      return langs.includes("Rust") && langs.includes("Python") && langs.includes("Shell");
    }, undefined, { timeout: 20_000 }).catch(() => undefined);
    const blocks = await win.locator("[data-reply-code]").evaluateAll((els) => els.map((e) => `${e.getAttribute("data-reply-code")}:${e.getAttribute("data-closed")}:${e.getAttribute("data-tool-lang")}:${e.querySelectorAll("[data-tk]").length > 0 ? "tokens" : "plain"}`));
    seen.push(`closed blocks ${JSON.stringify(blocks)}`);
    if (JSON.stringify(blocks) !== JSON.stringify(["rust:1:Rust:tokens", "python:1:Python:tokens", "sh:1:Shell:tokens", "1:1::plain"])) errs.push(`closed blocks ${JSON.stringify(blocks)}`);
    const rust = win.locator('[data-reply-code="rust"]').first();
    const shut = await placeOf(rust);
    let moved = 0, worst = 0;
    openPlace.lines.forEach((p, k) => {
      const q = shut.lines[k];
      if (Number.isNaN(p.top)) return;
      const d = Math.max(Math.abs(p.top - q.top), Math.abs(p.left - q.left));
      worst = Math.max(worst, d);
      if (d > 1) moved++;
    });
    seen.push(`place: ${openPlace.lines.length} open lines, ${moved} moved over 1 px, worst ${worst.toFixed(2)} px; widths ${openPlace.width.toFixed(1)} and ${shut.width.toFixed(1)}`);
    if (moved || Math.abs(openPlace.width - shut.width) > 1) errs.push(`colouring moved ${moved} lines (worst ${worst.toFixed(1)} px); widths ${openPlace.width} and ${shut.width}`);

    const inks: [string, Locator, string][] = [
      ["Rust keyword", rust.locator('[data-tk="keyword"]').first(), KEYWORD],
      ["Python string", win.locator('[data-reply-code="python"] [data-tk="string"]').first(), STRING],
    ];
    for (const [what, el, hex] of inks) {
      if (!(await el.count())) { errs.push(`${what}: not drawn`); continue; }
      const got = await ink(el);
      const d = ciede2000(got.rgb, rgb(hex));
      seen.push(`${what} ΔE ${d.toFixed(1)}`);
      if (got.n < 6 || d > 12) errs.push(`${what}: ink ${JSON.stringify(got.rgb)}, ΔE ${d.toFixed(1)} to ${hex}`);
    }
    await rust.screenshot({ path: join(shots, "closed-rust.png") });
    await win.locator('[data-reply-code="sh"]').first().screenshot({ path: join(shots, "closed-sh.png") });

    // Parsed once: the pane leaves for the editor and comes back twice, remounting every block.
    for (let k = 0; k < 2; k++) { await openEditor(win); await leaveEditor(win); }
    await win.waitForFunction(() => document.querySelector('[data-reply-code="rust"][data-tool-lang="Rust"]') !== null, undefined, { timeout: 10_000 });
    const parses = await win.evaluate(() => (globalThis as unknown as { __substrateCodeParses?: Record<string, number> }).__substrateCodeParses ?? {});
    const count = (t: string) => parses[t] ?? 0;
    const counts = { rust: count(RUST), python: count(PY), sh: count(SH), open: count(OPEN_RUST), plain: count(PLAIN) };
    seen.push(`parses ${JSON.stringify(counts)}`);
    if (counts.rust !== 1 || counts.python !== 1 || counts.sh !== 1 || counts.open !== 0 || counts.plain !== 0) errs.push(`parses ${JSON.stringify(counts)}; want 1, 1, 1, 0, 0`);
    await app.close();
    if (errs.length) throw new Error(errs.join("; "));
    console.log(`reply_code_blocks: ok —\n  ${seen.join("\n  ")}\n  packaged=${String(!!process.env.SHAKEOUT_APP)}; screenshots ${shots}`);
    code = 0;
  } catch (e) {
    console.error(`reply_code_blocks: FAIL — ${(e as Error).message.split("\n").slice(0, 6).join(" / ")}\n  ${seen.join("\n  ")}\n  screenshots ${shots}`);
  } finally {
    await app.close().catch(() => undefined);
    server.close();
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
