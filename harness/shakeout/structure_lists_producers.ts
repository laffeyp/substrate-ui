// The structure view lists the session's producers under their K263 names and its triggers under
// K264's one rule, `<what it starts>-on-<event>`.
//
// Kernel K263 merged five session-open fragment producers into `session_prompt`, folded the two
// warning producers into it, and renamed `session_open` to `first_message`. The structure view
// reads the producer list from the record's RunStarted topology.
//
// Steps, in the Electron app with its own SUBSTRATE_HOME, on the deterministic driver:
//   1. open a session and send one turn;
//   2. reveal the graph (ctrl+`) and pick the structure lens;
//   3. the PRODUCERS list names session_prompt and first_message and none of the old names;
//   4. every TRIGGERS row except the session_started instrument's has the form <x>-on-<y>.

import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";

type Pane = {
  snapshot(): { sessionId: string | null; transcript: { role: string; text: string }[] };
  openSession(o: { driver: string }): Promise<void>;
  sendTurn(t: string): Promise<void>;
};
type Vm = { get(id: number): Pane | null };

const NEW = ["session_prompt", "first_message"];
const OLD = [
  "role_fragment", "bundle_methodology_fragment", "bundle_personality_fragment",
  "tools_suite_fragment", "parent_context_fragment", "session_warning",
  "fragment_error_warning", "session_open",
];

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
      await pane.sendTurn("hello");
      return pane.snapshot().sessionId!;
    });
    await win.waitForFunction(() => {
      const rows = (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript;
      return rows.some((r) => r.role === "model");
    }, undefined, { timeout: 15_000 });

    await win.keyboard.press("Control+`");
    await win.getByText("structure", { exact: true }).first().click();
    const heading = win.getByText(/^PRODUCERS \(\d+\)/).first();
    await heading.waitFor({ state: "visible", timeout: 15_000 });
    const listed = await heading.evaluate((el) => {
      const out: string[] = [];
      for (let n = el.nextElementSibling; n && !/^TRIGGERS/.test(n.textContent || ""); n = n.nextElementSibling) {
        const name = (n.querySelector("span")?.firstChild?.textContent || "").trim();
        if (name) out.push(name);
      }
      return out;
    });
    const missing = NEW.filter((p) => !listed.includes(p));
    const stale = OLD.filter((p) => listed.includes(p));
    if (missing.length || stale.length) {
      throw new Error(`producers ${JSON.stringify(listed)}: missing ${JSON.stringify(missing)}, old names ${JSON.stringify(stale)}`);
    }
    const triggers = await win.getByText(/^TRIGGERS \(\d+\)/).first().evaluate((el) => {
      const out: string[] = [];
      for (let n = el.nextElementSibling; n; n = n.nextElementSibling) {
        const id = (n.querySelector("span")?.textContent || "").trim();
        if (id) out.push(id);
      }
      return out;
    });
    const form = /^[a-z]+(-[a-z]+)*-on-[a-z]+(-[a-z]+)*$/;
    const offForm = triggers.filter((t) => t !== "session_started" && !form.test(t));
    if (!triggers.length || offForm.length) {
      throw new Error(`triggers ${JSON.stringify(triggers)}: off the <x>-on-<y> form ${JSON.stringify(offForm)}`);
    }
    console.log(`structure_lists_producers: ok — ${listed.length} producers ${JSON.stringify(listed)}; ${triggers.length} triggers ${JSON.stringify(triggers)} (${sid})`);
    code = 0;
  } catch (e) {
    console.error(`structure_lists_producers: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
