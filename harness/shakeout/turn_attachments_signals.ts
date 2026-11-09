// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A turn's attachments in the running app, read from its trace and the session's record (UI sprint
// 388; editor plan round 2, item 0(e); kernel K344; vocabulary v0.27). After one deterministic turn
// in pane 1, the window writes a file to the workspace and sends a second turn with a file, a line
// range and an event attached, as the input bar's chips will (item 0(h)); then a turn with a path
// outside the workspace, which is refused.
// server.jsonl must hold TURN_ACCEPTED for turn 1 with attachments 3, and API_REFUSED (area turn,
// status 400) with no TURN_ACCEPTED after it; the record's UserMessage at turn 1 must carry the three
// attachments with the file's text, the two lines, and the event's kind; no path or text reaches the
// trace (E1).

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

type Rec = { name: string; payload: Record<string, unknown> };

async function call(win: Page, method: string, url: string, body?: unknown): Promise<{ status: number; data: any }> {
  return win.evaluate(async ([m, u, b]) => {
    const r = await fetch(u as string, { method: m as string, headers: { "Content-Type": "application/json" }, body: b === undefined ? undefined : JSON.stringify(b) });
    return { status: r.status, data: await r.json().catch(() => null) };
  }, [method, url, body] as const);
}

function recordEntries(root: string): any[] {
  return readdirSync(root).filter((f) => f.startsWith("events-")).sort()
    .flatMap((f) => readFileSync(join(root, f), "utf8").split("\n").filter(Boolean)).map((l) => JSON.parse(l));
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic");
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    const sid = await win.evaluate(() => (window as any).__vm.get(1).snapshot().sessionId as string);
    const s = `/api/session/${encodeURIComponent(sid)}`;

    const made = await call(win, "PUT", `${s}/file?path=attached.txt`, { text: "alpha\nbeta\ngamma\n" });
    if (made.status !== 200) throw new Error(`writing attached.txt: ${made.status} ${JSON.stringify(made.data)}`);
    const before = await call(win, "GET", s);
    const root = before.data.record as string;
    const first = recordEntries(root).find((e) => e.kind === "UserMessage");
    const attachments = [
      { kind: "file", label: "attached.txt", ref: "attached.txt" },
      { kind: "lines", label: "attached.txt 2–3", ref: "attached.txt", span: [2, 3] },
      { kind: "event", label: "turn 0", ref: `seq:${first.seq}` },
    ];
    const turn = await call(win, "POST", `${s}/turn`, { text: "look at these", attachments });
    if (turn.status !== 200) throw new Error(`the turn with attachments: ${turn.status} ${JSON.stringify(turn.data)}`);
    const bad = await call(win, "POST", `${s}/turn`, { text: "and this", attachments: [{ kind: "file", label: "x", ref: "../outside.txt" }] });
    if (bad.status !== 400) throw new Error(`an attachment outside the workspace answered ${bad.status}, expected 400`);
    await app.close();

    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const recs = readFileSync(join(traces, boot, "server.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Rec)
      .filter((r) => (r.name === "TURN_ACCEPTED" && r.payload.session_id === sid) || (r.name === "API_REFUSED" && r.payload.area === "turn"));
    const shape = recs.map((r) => [r.name, r.payload.turn_index ?? r.payload.status, r.payload.attachments ?? null]);
    const want = [["TURN_ACCEPTED", 0, 0], ["TURN_ACCEPTED", 1, 3], ["API_REFUSED", 400, null]];
    if (JSON.stringify(shape) !== JSON.stringify(want)) throw new Error(`server.jsonl's turn records: ${JSON.stringify(shape)}, expected ${JSON.stringify(want)}`);
    const all = readFileSync(join(traces, boot, "server.jsonl"), "utf8");
    if (all.includes("attached.txt") || all.includes("gamma")) throw new Error("a path or text reached the trace (E1)");

    const messages = recordEntries(root).filter((e) => e.kind === "UserMessage");
    const got = messages[1]?.payload?.attachments ?? [];
    const texts = got.map((a: { text?: string }) => a.text ?? "");
    if (messages.length !== 2 || got.length !== 3 || texts[0] !== "alpha\nbeta\ngamma\n" || texts[1] !== "beta\ngamma\n" || JSON.parse(texts[2]).kind !== "UserMessage") {
      throw new Error(`the record's UserMessages: ${JSON.stringify(messages.map((m) => m.payload))}`);
    }
    console.log(`turn_attachments_signals: ok — TURN_ACCEPTED counts 3 attachments, the record's UserMessage at turn 1 carries the file, the two lines and the event with their text, an attachment outside the workspace is refused 400, no path or text in server.jsonl`);
    code = 0;
  } catch (e) {
    console.error(`turn_attachments_signals: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
