// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Esc interrupts a turn the window did not send (sprint 501). In Substrate Next on 2026-11-15 a message
// queued during a turn started on the server after that turn parked; the window, which saw no sendTurn,
// stayed parked, and Esc, which interrupts only a running turn, took no action (KEY_ROUTED action none),
// while Ctrl-C in the input box, which does not ask, interrupted. The gate: a scripted deterministic
// session whose every turn runs `bash sleep 8` (no model reply is read, so no model is needed); turn 1
// is posted over the API and parks; turn 2 is posted over the API too, so the window sees it only on the
// record; with the caret in the input box, Esc. These agree:
//   key    — KEY_ROUTED Escape, action interrupt;
//   window — TURN_INTERRUPTED in the window, the time from the key under 1.5 s;
//   record — the session's record ends turn 2 with Returned reason interrupted, before the sleep's end.
// SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron, type Page } from "playwright";
import { launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const SLEEP_S = 8;

async function attach(win: Page, sid: string): Promise<void> {
  await win.evaluate(`(function () { var vm = window.__vm; return (vm.get(1) || vm.spawn(1)).attachExisting(${JSON.stringify(sid)}); })()`);
  await win.waitForFunction(`window.__vm.get(1) && window.__vm.get(1).snapshot().sessionId === ${JSON.stringify(sid)}`, undefined, { timeout: 15_000 });
}

const parked = (win: Page) => win.evaluate("window.__vm.get(1).snapshot().parkReason") as Promise<string | null>;

function returned(state: string, sid: string): { seq: number; reason: string }[] {
  const root = join(state, "sessions", sid, "record");
  const out: { seq: number; reason: string }[] = [];
  for (const f of readdirSync(root).filter((n) => n.startsWith("events-")).sort()) {
    for (const line of readFileSync(join(root, f), "utf8").split("\n")) {
      if (!line.trim()) continue;
      const e = JSON.parse(line) as { seq: number; kind: string; payload?: { reason?: string } };
      if (e.kind === "Returned") out.push({ seq: e.seq, reason: String(e.payload?.reason) });
    }
  }
  return out;
}

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const seen: string[] = [];
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    const base = `http://127.0.0.1:${new URL(win.url()).port}`;
    const post = (path: string, body: unknown) => fetch(base + path, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const { session_id: sid } = await (await post("/api/session", { driver: "deterministic", driver_params: { script: [["bash", [`sleep ${SLEEP_S}`]]] } })).json() as { session_id: string };
    await attach(win, sid);

    // Turn 1, from outside the window; it parks.
    await post(`/api/session/${sid}/turn`, { text: "first" });
    await win.waitForFunction("window.__vm.get(1).snapshot().parkReason", undefined, { timeout: 30_000 });
    seen.push(`turn 1 parked (${String(await parked(win))})`);

    // Turn 2, from outside the window; the window learns of it from the record.
    const t2 = post(`/api/session/${sid}/turn`, { text: "second" });
    const started = Date.now();
    await win.waitForFunction("window.__vm.get(1).snapshot().transcript.filter(function (r) { return r.text === 'second'; }).length > 0", undefined, { timeout: 15_000 });
    await settled(win);
    const p2 = await parked(win);
    seen.push(`turn 2's message on the record; the window's parkReason ${JSON.stringify(p2)}`);
    await win.locator("textarea[data-input-bar]").filter({ visible: true }).first().click();
    const keyAt = Date.now();
    await win.keyboard.press("Escape");
    const interrupted = await win.waitForFunction("window.__vm.get(1).snapshot().parkReason === 'interrupted'", undefined, { timeout: (SLEEP_S + 5) * 1000 }).then(() => true, () => false);
    const tookMs = Date.now() - keyAt;
    await t2.catch(() => undefined);
    const sleptMs = Date.now() - started;
    await app.close();

    const recs = windowRecords(launch);
    const esc = recs.filter((r) => r.name === "KEY_ROUTED" && r.payload.key === "Escape").pop();
    const ti = recs.filter((r) => r.name === "TURN_INTERRUPTED");
    const ends = returned(launch.state, sid);
    seen.push(`KEY_ROUTED Escape action ${String(esc?.payload.action)}, target ${String(esc?.payload.target)}; TURN_INTERRUPTED ${ti.length}; parked interrupted ${tookMs} ms after the key; Returned ${JSON.stringify(ends.map((e) => e.reason))}`);
    const errs: string[] = [];
    if (esc?.payload.action !== "interrupt") errs.push(`Esc took action ${String(esc?.payload.action)}`);
    if (!ti.length) errs.push("no TURN_INTERRUPTED in the window");
    if (!interrupted || tookMs > 1500) errs.push(`turn 2 parked interrupted ${interrupted ? `${tookMs} ms` : "never"} after the key; the bar is 1500 ms`);
    if (ends.length !== 2 || ends[1].reason !== "interrupted") errs.push(`the record's Returned reasons ${JSON.stringify(ends.map((e) => e.reason))}; want replied, interrupted`);
    if (sleptMs >= SLEEP_S * 1000) errs.push(`turn 2 ran ${sleptMs} ms, the sleep's full ${SLEEP_S} s`);
    if (errs.length) throw new Error(errs.join("; "));
    console.log(`escape_interrupts_queued: ok — ${seen.join("; ")}; packaged=${String(!!process.env.SHAKEOUT_APP)}`);
    code = 0;
  } catch (e) {
    console.error(`escape_interrupts_queued: FAIL — ${(e as Error).message.split("\n")[0]}; ${seen.join("; ")}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
