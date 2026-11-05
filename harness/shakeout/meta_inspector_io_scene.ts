// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Meta's inspector, i/o lens and scene lens, held to the controller's envelopes (sprint 208; plan
// PLAN-2026-11-04-shell-to-react-r5.md, A10; the payload check an equality from D2, sprint 294).
//
// After one deterministic turn: the UserMessage row's inspector shows that envelope's kind, seq and
// payload, equal to the record's field for field and in order, and closes on a second click; the i/o
// lens lists the turn's input and output documents in seq order; the scene lens shows its empty line,
// since the record has no grid.

import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, settled, waitForApp } from "./lib/electron";

type Env = { seq: number; kind: string; payload: Record<string, unknown> };
const visible = (win: Page, sel: string) => win.locator(sel).filter({ visible: true }).first();
const envelopes = (win: Page) => win.evaluate(() =>
  ((window as any).__vm.get(1).snapshot().rawEnvelopes as Env[]).map((e) => ({ seq: e.seq, kind: e.kind, payload: e.payload })));
const chip = async (win: Page, text: string) => {
  await win.locator("span").filter({ hasText: new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }).filter({ visible: true }).first().click();
  await settled(win);
};
const IO_KINDS = ["UserMessage", "ModelReply", "FinalAnswer", "ToolResult"];

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  const seen: string[] = [];
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic");
    await visible(win, "textarea[data-input-bar]").fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    await win.keyboard.press("Meta+m");
    await visible(win, '[data-vm-transcript-mount="reveal"]').waitFor({ timeout: 10_000 });
    await settled(win);
    const envs = await envelopes(win);

    // Inspector.
    const user = envs.find((e) => e.kind === "UserMessage");
    if (!user) throw new Error(`no UserMessage among ${envs.length} envelopes`);
    const row = win.locator('[data-stream-scroll] [title^="click to inspect"]').filter({ hasText: "UserMessage" }).first();
    await row.click();
    const inspect = win.getByText("INSPECT", { exact: true }).first();
    await inspect.waitFor({ timeout: 5_000 });
    const shown = await inspect.evaluate((el) => {
      const head = el.parentElement!;
      const box = head.parentElement!;
      const pres = Array.from(box.querySelectorAll("pre"));
      return { head: Array.from(head.children).map((c) => (c.textContent ?? "").trim()), payload: pres[pres.length - 1]?.textContent ?? "" };
    });
    if (shown.head[1] !== "UserMessage") throw new Error(`inspector kind ${JSON.stringify(shown.head[1])}`);
    if (shown.head[2] !== `seq ${user.seq} · click the row again to close`) throw new Error(`inspector seq line ${JSON.stringify(shown.head[2])}; the envelope's seq is ${user.seq}`);
    let payload: unknown;
    try { payload = JSON.parse(shown.payload); } catch { throw new Error(`inspector payload is not JSON: ${shown.payload.slice(0, 120)}`); }
    // The inspector shows the record's payload as it arrived (plan row D2, F328); before, the stream
    // merged the producer's kind and instance into it.
    if (JSON.stringify(payload) !== JSON.stringify(user.payload)) throw new Error(`inspector payload ${shown.payload.slice(0, 200)}; the envelope's ${JSON.stringify(user.payload).slice(0, 200)}`);
    await row.click();
    await inspect.waitFor({ state: "hidden", timeout: 5_000 });
    seen.push(`inspector UserMessage seq ${user.seq}, the record's payload exactly, closes`);

    // i/o.
    await chip(win, "i/o");
    const want = envs.filter((e) => IO_KINDS.includes(e.kind) && e.payload).map((e) => e.seq);
    const docs = await win.evaluate(() => {
      const foot = Array.from(document.querySelectorAll("div")).find((d) => d.offsetParent !== null && (d.textContent ?? "").startsWith("inputs & outputs"));
      const list = foot?.parentElement;
      if (!list) return [];
      return Array.from(list.querySelectorAll("pre")).map((pre) => {
        const head = pre.previousElementSibling as HTMLElement;
        // dc-runtime wraps {{ d.title }} in a span of its own; the seq is the span floated right.
        const seqText = head.querySelector('span[style*="float"]')?.textContent ?? "";
        return { title: (head.firstChild?.textContent ?? "").trim(), seq: Number(seqText.replace(/^seq /, "")), text: pre.textContent ?? "" };
      });
    });
    const got = docs.map((d) => d.seq);
    if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`i/o seqs ${JSON.stringify(got)}; the envelopes give ${JSON.stringify(want)}`);
    const sorted = [...got].sort((a, b) => a - b);
    if (JSON.stringify(got) !== JSON.stringify(sorted)) throw new Error(`i/o documents out of seq order: ${JSON.stringify(got)}`);
    if (docs[0]?.title !== "UserMessage · input" || docs[0]?.text !== "hello") throw new Error(`first i/o document ${JSON.stringify(docs[0])}`);
    seen.push(`i/o ${docs.length} documents, seqs ${JSON.stringify(got)}, first "UserMessage · input" hello`);

    // Scene.
    await chip(win, "scene");
    await win.getByText(/^no 2-D grid on this record\./).filter({ visible: true }).first().waitFor({ timeout: 5_000 });
    seen.push("scene empty line");

    console.log(`meta_inspector_io_scene: ok — ${seen.join("; ")}`);
    code = 0;
  } catch (e) {
    console.error(`meta_inspector_io_scene: FAIL — ${(e as Error).message}; passed: ${seen.join("; ") || "none"}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
