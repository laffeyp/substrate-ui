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

    await win.keyboard.press("Meta+m");
    await win.getByText("structure", { exact: true }).first().click();
    const heading = win.getByText(/^PRODUCERS \(\d+\)/).first();
    await heading.waitFor({ state: "visible", timeout: 15_000 });
    const read = (attr: string) => win.evaluate((a) => Array.from(document.querySelectorAll(`[${a}]`)).filter((e) => (e as HTMLElement).offsetParent !== null).map((e) => e.getAttribute(a) || ""), attr);
    const listed = await read("data-topo-producer");
    const missing = NEW.filter((p) => !listed.includes(p));
    const stale = OLD.filter((p) => listed.includes(p));
    if (missing.length || stale.length) {
      throw new Error(`producers ${JSON.stringify(listed)}: missing ${JSON.stringify(missing)}, old names ${JSON.stringify(stale)}`);
    }
    const triggers = await read("data-topo-trigger");
    const views = await read("data-topo-view");
    // UI sprint 137: the page lists exactly what the record's RunStarted manifest declares.
    const graph = await win.evaluate(async (id) => {
      const r = await fetch(`/api/records/s_${id.replace(/^s_/, "")}/topology_graph`);
      return r.ok ? await r.json() as { producers: { kind: string; emits: string[] }[]; triggers: { id: string; on: string[] }[]; views: string[]; routes: unknown[]; termination: string[]; outside: string[] } : null;
    }, sid);
    if (!graph) throw new Error(`no topology_graph for ${sid}`);
    const same = (a: string[], b: string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
    if (!same(listed, graph.producers.map((p) => p.kind)) || !same(triggers, graph.triggers.map((t) => t.id)) || !same(views, graph.views)) {
      throw new Error(`the page differs from the record: page ${JSON.stringify({ listed, triggers, views })}; record ${JSON.stringify(graph)}`);
    }
    // UI sprint 138: every primitive has its own section, each heading carries its definition, and
    // the events listed are every kind the topology emits, subscribes to, or takes from outside.
    const headings = await win.evaluate(() => Array.from(document.querySelectorAll(".st-h")).filter((e) => (e as HTMLElement).offsetParent !== null).map((e) => ({ text: (e.textContent || "").replace(/\s*\(\d+\)$/, "").trim(), def: e.getAttribute("title") || "" })));
    const want = ["PRODUCERS", "TRIGGERS", "VIEWS", "ENDS", "ROUTES", "RUN", "EVENTS"];
    if (JSON.stringify(headings.map((h) => h.text)) !== JSON.stringify(want)) throw new Error(`sections ${JSON.stringify(headings.map((h) => h.text))}; want ${JSON.stringify(want)}`);
    const undefinedHeadings = headings.filter((h) => h.def.length < 20).map((h) => h.text);
    if (undefinedHeadings.length) throw new Error(`no hover definition on ${JSON.stringify(undefinedHeadings)}`);
    const events = await read("data-topo-event");
    const kinds = new Set<string>([...graph.producers.flatMap((p) => p.emits), ...graph.triggers.flatMap((t) => t.on), ...graph.outside]);
    if (!same(events, [...kinds])) throw new Error(`events ${JSON.stringify(events)}; the record's kinds ${JSON.stringify([...kinds])}`);
    const outsideOnPage = await win.evaluate(() => Array.from(document.querySelectorAll("[data-topo-event]")).filter((e) => (e.parentElement?.textContent || "").includes("outside")).map((e) => e.getAttribute("data-topo-event")));
    for (const k of ["InterruptRequested", "SessionEndRequested"]) if (!outsideOnPage.includes(k)) throw new Error(`${k} should read as outside; outside on the page ${JSON.stringify(outsideOnPage)}`);
    const routesNone = await win.locator("[data-topo-routes-none]").count();
    if ((graph.routes.length === 0) !== (routesNone === 1)) throw new Error(`routes: record has ${graph.routes.length}, page none-marker ${routesNone}`);
    const ends = (await win.locator("[data-topo-ends]").innerText()).trim();
    if (ends !== graph.termination.join(" · ")) throw new Error(`ends "${ends}"; record ${JSON.stringify(graph.termination)}`);
    const form = /^[a-z]+(-[a-z]+)*-on-[a-z]+(-[a-z]+)*$/;
    const offForm = triggers.filter((t) => t !== "session_started" && !form.test(t));
    if (!triggers.length || offForm.length) {
      throw new Error(`triggers ${JSON.stringify(triggers)}: off the <x>-on-<y> form ${JSON.stringify(offForm)}`);
    }
    console.log(`structure_lists_producers: ok — matches the record: ${events.length} events, ${listed.length} producers, ${triggers.length} triggers, ${graph.routes.length} routes, ${views.length} views, ends ${ends}; outside ${JSON.stringify(outsideOnPage)}; 7 sections defined (${sid})`);
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
