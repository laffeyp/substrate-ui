// The graph's model lane on a session that has ended and been resumed.
//
// Reported 2026-10-09: after reattaching to a session, the model lane stops being drawn in both
// the down graph (the left lane cell of each stream row) and the side graph. The model span ran
// from the first envelope to the FIRST SessionEnded, and a resumed session's record holds one
// SessionEnded per earlier end, so every row after the first end had no model bar.
//
// Steps, in the Electron app with its own SUBSTRATE_HOME, on the deterministic driver:
//   1. open a session; turn "one"; end; turn "two"; end; reload (the pane reattaches); send "three";
//   2. reveal the graph (ctrl+`), down view: every row after the first `SessionEnded` row has a
//      model lane cell drawn (not transparent);
//   3. side view: the model lane holds three segments (two closed stretches and the open one).

import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp, waitForReattached } from "./lib/electron";

type Pane = {
  snapshot(): { sessionId: string | null; transcript: { role: string; text: string }[] };
  openSession(o: { driver: string }): Promise<void>;
  sendTurn(t: string): Promise<void>;
  attachExisting(id: string): Promise<void>;
};
type Vm = { get(id: number): Pane | null };

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win);

    const sid = await win.evaluate(async () => {
      const pane = (window as unknown as { __vm: Vm }).__vm.get(1)!;
      await pane.openSession({ driver: "deterministic" });
      const id = pane.snapshot().sessionId!;
      // No named helper inside evaluate: tsx wraps named functions in a `__name` the page lacks.
      const headers = { "Content-Type": "application/json" };
      for (const text of ["one", "two"]) {
        await fetch(`/api/session/${id}/turn`, { method: "POST", headers, body: JSON.stringify({ text }) });
        await fetch(`/api/session/${id}/end`, { method: "POST", headers, body: JSON.stringify({ source: "user_end" }) });
      }
      return id;
    });

    await win.reload();
    await waitForApp(win);
    await waitForReattached(win, sid);  // the reload reattaches the session from the URL
    await win.evaluate(async () => { await (window as unknown as { __vm: Vm }).__vm.get(1)!.sendTurn("three"); });
    await win.waitForFunction(() => {
      const rows = (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript;
      const at = rows.findIndex((r) => r.role === "user" && r.text === "three");
      return at >= 0 && rows.slice(at + 1).some((r) => r.role === "model");
    }, undefined, { timeout: 15_000 });

    await win.keyboard.press("Control+`");
    const rowSel = 'div[title="click to inspect · click again to close"]';
    await win.locator(rowSel).first().waitFor({ state: "visible", timeout: 15_000 });

    // Down view: each row's first lane cell is the model lane.
    const rows = await win.locator(rowSel).evaluateAll((els) => els.map((el) => {
      const lanes = el.querySelector("span");
      const cell = lanes ? (lanes.querySelector("span") as HTMLElement | null) : null;
      const kind = (el.children[3] as HTMLElement | undefined)?.innerText || "";
      return { kind: kind.trim(), model: cell ? getComputedStyle(cell).backgroundColor : "" };
    }));
    const firstEnd = rows.findIndex((r) => r.kind === "SessionEnded");
    if (firstEnd < 0) throw new Error(`no SessionEnded row among ${rows.length} rows`);
    const blank = rows.slice(firstEnd + 1).filter((r) => r.model === "" || r.model === "rgba(0, 0, 0, 0)");
    if (blank.length) {
      throw new Error(`${blank.length} of ${rows.length - firstEnd - 1} rows after the first end have no model lane (${blank.slice(0, 4).map((r) => r.kind).join(", ")})`);
    }

    // Side view: the model lane's segments.
    await win.getByText("side", { exact: false }).filter({ hasText: /side$/ }).first().click();
    const modelSegs = await win.evaluate(() => {
      const labels = Array.from(document.querySelectorAll("span")).filter((s) => s.textContent === "model" && s.style.visibility === "hidden");
      const row = labels[0]?.parentElement;
      const track = row ? row.children[1] : null;
      return track ? track.children.length : -1;
    });
    if (modelSegs !== 3) throw new Error(`side graph model lane has ${modelSegs} segments; expected 3 (two ended stretches and the open one)`);

    console.log(`graph_model_lane_on_resume: ok — ${rows.length - firstEnd - 1} rows after the first end carry the model lane; side model lane has ${modelSegs} segments (${sid})`);
    code = 0;
  } catch (e) {
    console.error(`graph_model_lane_on_resume: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
