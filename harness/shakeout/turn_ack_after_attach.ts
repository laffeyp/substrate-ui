// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A turn sent the moment a pane attaches is acknowledged by its own message, not the replay of an old one (sprint 507).
// Found by `session_prompt_once_across_restart` in the close's chained run: a reattached pane counted turns from 0,
// sent "two" before the record's replay landed, and the replayed "one" (turn 0) acknowledged it before the server had
// accepted it (S8: window_acks 1, server_accepted 0). The gate makes that order every time: a deterministic session
// with three turns on the record, then in one call in the page `attachExisting` and, in the same tick it returns,
// `sendTurn`. These agree:
//   index — the window's TURN_SUBMITTED names turn 3, the index the server's TURN_ACCEPTED gives it;
//   ack   — the window's TURN_ACK comes after the server's TURN_ACCEPTED for turn 3, and there is one;
//   trace — no INVARIANT_BROKEN (lib/electron.ts fails the launch on any; S8 among them).
// Five rounds, each a fresh session. SHAKEOUT_APP=<Substrate.app> runs the bundle.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { launchArgs, settled, waitForApp } from "./lib/electron";

const ROUNDS = 5;
type Rec = { name: string; wall: string; payload: Record<string, unknown> };

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  const errs: string[] = [];
  const seen: string[] = [];
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    const base = `http://127.0.0.1:${new URL(win.url()).port}`;
    const post = (path: string, body: unknown) => fetch(base + path, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const sids: string[] = [];
    for (let r = 0; r < ROUNDS; r++) {
      const { session_id: sid } = await (await post("/api/session", { driver: "deterministic" })).json() as { session_id: string };
      for (const t of ["one", "two", "three"]) if (!(await post(`/api/session/${sid}/turn`, { text: t })).ok) throw new Error(`turn ${t} refused`);
      // Attach and send in one tick: the replay of the three turns has not landed when the turn is sent.
      await win.evaluate(`(function () { var c = window.__vm.get(1); return c.attachExisting(${JSON.stringify(sid)}).then(function () { return c.sendTurn("four"); }); })()`);
      await win.waitForFunction(`window.__vm.get(1).snapshot().parkReason && window.__vm.get(1).snapshot().transcript.some(function (r) { return r.text === "four"; })`, undefined, { timeout: 30_000 });
      await settled(win);
      sids.push(sid);
    }
    await app.close();
    const boot = join(launch.state, "electron", "logs", "traces", readdirSync(join(launch.state, "electron", "logs", "traces")).sort().pop()!);
    const read = (f: string): Rec[] => readFileSync(join(boot, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Rec);
    const win1 = read("window-1.jsonl"), server = read("server.jsonl");
    sids.forEach((sid, r) => {
      const sub = win1.filter((x) => x.name === "TURN_SUBMITTED" && x.payload.session_id === sid).map((x) => x.payload.turn_index);
      const acks = win1.filter((x) => x.name === "TURN_ACK" && x.payload.session_id === sid);
      const acc = server.find((x) => x.name === "TURN_ACCEPTED" && x.payload.session_id === sid && x.payload.turn_index === 3);
      seen.push(`round ${r + 1}: submitted ${JSON.stringify(sub)}, acks ${acks.length}, accepted turn 3 ${acc ? acc.wall.slice(11, 23) : "none"}, ack ${acks[0]?.wall.slice(11, 23) ?? "none"}`);
      if (JSON.stringify(sub) !== "[3]") errs.push(`round ${r + 1}: TURN_SUBMITTED turn_index ${JSON.stringify(sub)}; the server gives 3`);
      if (acks.length !== 1 || !acc || acks[0].wall < acc.wall) errs.push(`round ${r + 1}: ${acks.length} acks, the first ${acks[0]?.wall ?? "none"}, accepted ${acc?.wall ?? "never"}`);
    });
    if (errs.length) throw new Error(errs.join("; "));
    console.log(`turn_ack_after_attach: ok — ${seen.join("; ")}; packaged=${String(!!process.env.SHAKEOUT_APP)}`);
    code = 0;
  } catch (e) {
    console.error(`turn_ack_after_attach: FAIL — ${(e as Error).message.split("\n").slice(0, 3).join(" / ")}; ${seen.join("; ")}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
