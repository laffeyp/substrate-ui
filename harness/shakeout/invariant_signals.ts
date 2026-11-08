// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The runtime checker in the running app (INVARIANT_BROKEN, vocabulary v0.21, sprint 373; plan
// 2026-11-05-sdd-signals item 5). Pane 1 picks the sandbox and the deterministic model, opens its
// session and sends one turn: a normal run, which must break no rule. Then the gate plants, through
// the window's own record channel (window.native.signal, the path every window record takes to main),
// one record sequence per rule, each on a pane of its own (900 and up), so the app's state is not
// touched:
//   S3 a picker line with no folder armed; S4 a commit after the length line; S4 a commit bound how
//   attach; S4 a commit whose pane closes before its bind; S5 a row of the session a pane held, drawn
//   after the pane attached another; S6 an ack with no open request;
//   S8 a turn for a session the pane never opened; E8 a transcript that follows the bottom and is not
//   at it.
//   S7 an ack for a session the server never created; S8 an ack for a message the server never
//   accepted; S9 a refusal the server never made (sprint 376: main reads server.jsonl as it grows);
//   T4 a streamed reply never drawn; T5 an open request never answered; T6 a sent message never
//   answered (sprint 375; each breaks when its window in the vocabulary passes).
// main.jsonl then holds exactly sixteen INVARIANT_BROKEN (panes 906 and 908 break a server pairing as well), in that order, each for window 1 and its
// planted pane, its recent records ending with the planted record. S1 (a stream's first record) is
// planted in web/app/__tests__/invariants.spec.ts: a window's first record is written before a gate
// can send one.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp, type Launch } from "./lib/electron";

const visible = (win: Page, sel: string) => win.locator(sel).filter({ visible: true }).first();

type Rec = { name: string; window_id: number | null; payload: Record<string, unknown> };
function mainRecords(launch: Launch): Rec[] {
  const traces = join(launch.state, "electron", "logs", "traces");
  if (!existsSync(traces)) return [];
  const boot = readdirSync(traces).sort().pop();
  const file = boot ? join(traces, boot, "main.jsonl") : "";
  return file && existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Rec) : [];
}
const brokenIn = (launch: Launch) => mainRecords(launch).filter((r) => r.name === "INVARIANT_BROKEN");

const rec = (pane: number, name: string, payload: Record<string, unknown>) => ({ pane_id: pane, name, category: "plant", stratum: "event", payload });
const PLANTS: [string, number, ReturnType<typeof rec>[]][] = [
  ["S3", 903, [rec(903, "PANE_OPENED", { pane_id: 903, cause: "split" }), rec(903, "PICKER_LINE_ENTERED", { pane_id: 903, line: "guidance", cause: "picked" })]],
  ["S4", 904, [rec(904, "PANE_OPENED", { pane_id: 904, cause: "split" }), rec(904, "PICKER_FOLDER_ARMED", { pane_id: 904, workspace: null, is_default: true, source: "row" }),
    rec(904, "PICKER_LINE_ENTERED", { pane_id: 904, line: "length", cause: "picked" }), rec(904, "PICKER_COMMITTED", { pane_id: 904, workspace: null, is_default: true })]],
  ["S4", 914, [rec(914, "PANE_OPENED", { pane_id: 914, cause: "split" }), rec(914, "PICKER_FOLDER_ARMED", { pane_id: 914, workspace: null, is_default: true, source: "row" }),
    rec(914, "PICKER_LINE_ENTERED", { pane_id: 914, line: "tone", cause: "picked" }), rec(914, "PICKER_COMMITTED", { pane_id: 914, workspace: null, is_default: true }),
    rec(914, "PANE_BOUND", { pane_id: 914, binding: "session", how: "attach", session_id: "plant-914" })]],
  ["S4", 924, [rec(924, "PANE_OPENED", { pane_id: 924, cause: "split" }), rec(924, "PICKER_FOLDER_ARMED", { pane_id: 924, workspace: null, is_default: true, source: "row" }),
    rec(924, "PICKER_LINE_ENTERED", { pane_id: 924, line: "tone", cause: "picked" }), rec(924, "PICKER_COMMITTED", { pane_id: 924, workspace: null, is_default: true }),
    rec(924, "PANE_CLOSED", { pane_id: 924, had_session: false })]],
  ["S5", 905, [rec(905, "PANE_OPENED", { pane_id: 905, cause: "split" }), rec(905, "SESSION_ATTACH_STARTED", { session_id: "plant-a" }), rec(905, "SESSION_ATTACH_STARTED", { session_id: "plant-b" }),
    rec(905, "TRANSCRIPT_ROW_DRAWN", { pane_id: 905, session_id: "plant-a", seq: 3, kind: "ModelReply" })]],
  ["S6", 906, [rec(906, "PANE_OPENED", { pane_id: 906, cause: "split" }), rec(906, "SESSION_OPEN_ACKED", { session_id: "plant-906", name: null, driver: "deterministic" })]],
  ["S8", 908, [rec(908, "PANE_OPENED", { pane_id: 908, cause: "split" }), rec(908, "TURN_SUBMITTED", { session_id: "plant-908", turn_index: 0, text_length: 1 }),
    rec(908, "TURN_ACK", { session_id: "plant-908" })]],
  ["E8", 918, [rec(918, "TRANSCRIPT_SCROLLED", { pane_id: 918, at_bottom: false, following: true, pinned: false, cause: "content" })]],
  // The server pairings (sprint 376): window records the server's records do not back.
  ["S7", 941, [rec(941, "SESSION_OPEN_REQUESTED", { driver: "deterministic", workspace: null, bundle: null }), rec(941, "SESSION_OPEN_ACKED", { session_id: "plant-941", name: null, driver: "deterministic" })]],
  ["S8", 942, [rec(942, "TURN_ACK", { session_id: "plant-942" })]],
  ["S9", 943, [rec(943, "TURN_REFUSED", { failure_class: "http_error", detail: "plant" })]],
  // The timing rules (sprint 375): waits no record answers. T4 breaks after 1 s, T5 and T6 after 10 s.
  ["T4", 931, [rec(931, "STREAM_ENVELOPE_APPENDED", { seq: 7, kind: "ModelReply" })]],
  ["T5", 932, [rec(932, "SESSION_OPEN_REQUESTED", { driver: "deterministic", workspace: null, bundle: null })]],
  ["T6", 933, [rec(933, "SESSION_ATTACH_STARTED", { session_id: "plant-933" }), rec(933, "TURN_SUBMITTED", { session_id: "plant-933", turn_index: 0, text_length: 1 })]],
];

async function main(): Promise<void> {
  const launch = launchArgs({ plantsBreaks: true });
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic");
    await visible(win, "textarea[data-input-bar]").fill("hello");
    await win.keyboard.press("Enter");
    await win.waitForFunction(() => !!(window as any).__vm?.get?.(1)?.snapshot().parkReason, undefined, { timeout: 30_000 });
    const normal = brokenIn(launch);
    if (normal.length) throw new Error(`the normal run broke ${normal.length} rule(s): ${normal.map((r) => `${String(r.payload.rule)} ${JSON.stringify((r.payload.context as Record<string, unknown>).state)}`).join("; ")}`);

    for (const [, , recs] of PLANTS) {
      await win.evaluate((rs) => { for (const r of rs) (window as any).native.signal(r); }, recs);
    }
    const deadline = Date.now() + 20_000;
    while (brokenIn(launch).length < PLANTS.length + 2 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 100));

    // The trace, read once the app has closed and its files are complete.
    await app.close();
    const got = brokenIn(launch);
    const lines = got.map((r) => {
      const ctx = r.payload.context as { state: Record<string, unknown>; recent: { pane_id?: number; name: string }[] };
      // A timing break names the record that opened the wait; an ordering break ends its recent records with the one that broke it.
      const last = (ctx.state.from as { pane_id?: number; name: string } | undefined) ?? ctx.recent[ctx.recent.length - 1];
      const late = typeof ctx.state.waited_ms === "number" && ctx.state.waited_ms > (ctx.state.within_ms as number) ? " late" : "";
      return `${String(r.payload.rule)} window=${String(r.window_id)} pane=${String(ctx.state.pane_id)} last=${last?.name}@${String(last?.pane_id)}${late}`;
    });
    // The record that broke an ordering rule, or that opened a timing rule's wait: the plant's last
    // record, except pane 908's (S8), whose turn is answered after it so that it opens no T6 wait.
    const breaking = (pane: number, recs: ReturnType<typeof rec>[]) => (pane === 908 ? recs[recs.length - 2] : recs[recs.length - 1]).name;
    // Pane 906's ack and pane 908's ack also answer nothing the server wrote, so S7 and S8 break
    // for them too, ahead of the pane's own rule.
    const also: Record<number, string> = { 906: `S7 window=1 pane=906 last=SESSION_OPEN_ACKED@906`, 908: `S8 window=1 pane=908 last=TURN_ACK@908` };
    const want = PLANTS.flatMap(([rule, pane, recs]) => {
      const own = `${rule} window=1 pane=${pane} last=${breaking(pane, recs)}@${pane}${rule.startsWith("T") ? " late" : ""}`;
      return pane === 906 ? [also[906], own] : pane === 908 ? [own, also[908]] : [own];
    });
    if (lines.join("\n") !== want.join("\n")) throw new Error(`INVARIANT_BROKEN in main.jsonl:\n  ${lines.join("\n  ") || "none"}\nwant:\n  ${want.join("\n  ")}`);
    console.log(`invariant_signals: ok — the normal run broke no rule; ${PLANTS.length} plants, ${want.length} INVARIANT_BROKEN in order: ${PLANTS.map(([r]) => r).join(", ")}`);
    code = 0;
  } catch (e) {
    console.error(`invariant_signals: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
