// A delegate child opens an interactive pane beside its caller (UI sprint 178; kernel K323).
//
// Steps, on a deterministic session whose one turn calls `delegate` (driver_params.script):
//   1. bind pane 1 as a user; open the session with its script and attach pane 1; send a message;
//   2. a pane opens on its own on the child session (the caller's only child), and shows the
//      delegated task as the child's first message;
//   3. the caller's delegate call returns, and the child's pane is still open;
//   4. a line typed in the child's pane reaches the child's record as its next message.

import { _electron as electron } from "playwright";
import { bindPaneAsUser, launchArgs, waitForApp } from "./lib/electron";
import { scratchDir } from "./lib/scratch";

type Row = { role: string; text: string };
type Snap = { sessionId: string | null; transcript: Row[]; viewOnly: string | null };
type Vm = { get(id: number): { snapshot(): Snap } | null; paneIds(): number[] };

const TASK = "say hello from the child";

async function main(): Promise<void> {
  const launch = launchArgs();
  const folder = scratchDir("delegate-pane-");
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await waitForApp(win);
    await bindPaneAsUser(win, "deterministic", { folder });
    const script = [["delegate", [{ task: TASK }]]];
    const sid = await win.evaluate(`fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ driver: "deterministic", workspace: ${JSON.stringify(folder)}, driver_params: { script: ${JSON.stringify(script)} } }) }).then(async (r) => { if (!r.ok) throw new Error("open " + r.status + " " + await r.text()); return (await r.json()).session_id; })`) as string;
    await win.evaluate(async (id) => { await (window as unknown as { __vm: { get(n: number): { attachExisting(i: string): Promise<void> } } }).__vm.get(1).attachExisting(id); }, sid);
    const snap = (id: number) => win.evaluate((n) => (window as unknown as { __vm: Vm }).__vm.get(n)?.snapshot() ?? null, id);
    const input1 = win.locator('[data-input-bar]').first();
    await input1.click();
    await input1.fill("delegate it");
    await win.keyboard.press("Enter");

    // 2. The child's pane.
    let child = "";
    for (const deadline = Date.now() + 30_000; !child && Date.now() < deadline; ) {
      const kids = await win.evaluate(async (parent) => (await (await fetch(`/api/session/${parent}/children`)).json()).children as { session_id: string }[], sid);
      if (kids.length === 1) child = kids[0].session_id;
      else await win.waitForTimeout(200);
    }
    if (!child) throw new Error(`no child session; pane 1: ${JSON.stringify((await snap(1))?.transcript.map((r) => r.text))}`);
    const childPane = await win.waitForFunction((c) => {
      const vm = (window as unknown as { __vm: Vm }).__vm;
      return vm.paneIds().find((id) => vm.get(id)?.snapshot().sessionId === c) ?? null;
    }, child, { timeout: 15_000 }).then((h) => h.jsonValue() as Promise<number>)
      .catch(async () => { throw new Error(`no pane opened on ${child}; tape ${JSON.stringify(await win.evaluate(() => ((window as unknown as { __vmTape: { tag: string }[] }).__vmTape).filter((e) => e.tag.startsWith("DELEGATE"))))}`); });
    await win.waitForFunction(([n, task]) => {
      const t = (window as unknown as { __vm: Vm }).__vm.get(n as number)?.snapshot().transcript ?? [];
      return t.some((r) => r.role === "user" && r.text === task);
    }, [childPane, TASK] as const, { timeout: 15_000 })
      .catch(async () => { throw new Error(`the child's pane lacks its task: ${JSON.stringify((await snap(childPane))?.transcript.map((r) => r.text))}`); });
    const cs = (await snap(childPane))!;
    if (cs.viewOnly) throw new Error(`the child's pane is view-only: ${cs.viewOnly}`);

    // 3. The caller's call returned; the child's pane stays.
    await win.waitForFunction(() => {
      const t = (window as unknown as { __vm: Vm }).__vm.get(1)?.snapshot().transcript ?? [];
      return t.some((r) => r.text.startsWith("· returned"));
    }, undefined, { timeout: 30_000 });
    if (!(await win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.paneIds())).includes(childPane)) throw new Error("the child's pane closed");

    // 4. A typed line reaches the child.
    const panes = await win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.paneIds());
    const childInput = win.locator('[data-input-bar]').nth(panes.indexOf(childPane));
    await childInput.click();
    await childInput.fill("and one more thing");
    await win.keyboard.press("Enter");
    await win.waitForFunction((c) => {
      const vm = (window as unknown as { __vm: Vm }).__vm;
      const id = vm.paneIds().find((p) => vm.get(p)?.snapshot().sessionId === c);
      const t = id === undefined ? [] : vm.get(id)!.snapshot().transcript;
      const at = t.findIndex((row) => row.text === "and one more thing");
      return at >= 0 && t.slice(at + 1).some((row) => row.text.startsWith("· returned"));
    }, child, { timeout: 30_000 })
      .catch(async () => { throw new Error(`the typed line did not reach the child: ${JSON.stringify((await snap(childPane))?.transcript.map((r) => r.text))}`); });
    const record = await win.evaluate(async (c) => {
      const m = await (await fetch(`/api/session/${c}`)).json();
      return m;
    }, child);
    console.log(`delegate_pane: ok — ${sid} delegated; child ${child} (${(record as { driver: string }).driver}) opened pane ${childPane}, interactive; it stayed after the call returned and took a typed message`);
    code = 0;
  } catch (e) {
    console.error(`delegate_pane: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
