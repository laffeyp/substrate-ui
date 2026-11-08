// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A CLI driver's sign-in, written as it goes (sprint 370): CLI_STATUS_CHECKED, CLI_LOGIN_PROMPTED,
// CLI_LOGIN_FINISHED. The gate answers every CLI call itself, so no real CLI runs and the box's
// sign-ins do not matter:
//   /api/models lists a fixture CLI, `codex`, as one whose login the card hosts;
//   its status answers not signed in, then signed in after the first login, then not;
//   pty/start answers a pty id; the stream sends one line and an exit, twice, then lines only;
//   pty/close answers ok.
// Steps: pane 1's picker, the sandbox row, the codex row (the status check, not signed in: the
// card), guidance, length, tone; the pane binds and draws the card, whose flow ends signed in;
// retry, which ends failed; retry, then cancel while it waits (dismissed).
// window-1.jsonl then holds, for codex: CLI_STATUS_CHECKED authed false, CLI_LOGIN_PROMPTED pane 1,
// then CLI_LOGIN_FINISHED signed_in, failed, dismissed, all in pane 1's context.

import { _electron as electron, type Page, type Route } from "playwright";
import { launchArgs, settled, waitForApp, windowRecords } from "./lib/electron";

const CLI = "codex";
const visible = (win: Page, sel: string) => win.locator(sel).filter({ visible: true }).first();
const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");

async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    let statusCalls = 0;
    let streams = 0;
    await win.route("**/api/models", async (route: Route) => {
      const res = await route.fetch();
      const v = (await res.json()) as Record<string, unknown>;
      const cli = Array.isArray(v.cli) ? (v.cli as string[]) : [];
      const login = Array.isArray(v.cli_login_supported) ? (v.cli_login_supported as string[]) : [];
      const models = Array.isArray(v.models) ? (v.models as string[]) : [];
      await route.fulfill({ response: res, json: { ...v, cli: cli.includes(CLI) ? cli : [...cli, CLI], cli_login_supported: login.includes(CLI) ? login : [...login, CLI], models: models.includes(CLI) ? models : [...models, CLI] } });
    });
    await win.route(`**/api/cli/${CLI}/status`, (route) => {
      statusCalls += 1;
      return route.fulfill({ json: { authed: statusCalls === 2, raw: "fixture" } });
    });
    await win.route(`**/api/cli/${CLI}/pty/start`, (route) => route.fulfill({ json: { sid: `fx${streams + 1}` } }));
    await win.route(`**/api/cli/${CLI}/pty/close/**`, (route) => route.fulfill({ json: { ok: true } }));
    await win.route(`**/api/cli/${CLI}/pty/stream/**`, (route) => {
      streams += 1;
      const line = `data: ${b64("open https://example.com/device to sign in\r\n")}\n\n`;
      const body = streams <= 2 ? line + `event: exit\ndata: {"exit_code":0}\n\n` : line;
      return route.fulfill({ status: 200, headers: { "content-type": "text/event-stream", "cache-control": "no-cache" }, body });
    });
    await win.reload();
    await waitForApp(win);

    const input = visible(win, "input[data-ws-input]");
    await input.waitFor({ timeout: 15_000 });
    await input.click();
    await win.keyboard.press("Enter");
    await visible(win, '[data-model-half][data-armed="1"]').waitFor({ timeout: 15_000 });
    const row = win.locator(`[data-model-row="${CLI}"] > span`).first();
    if (!(await row.isVisible())) await visible(win, '[data-model-row="cli agents"] > span').click();
    await row.click();
    await visible(win, '[data-guidance-row="auto"]').click();
    await visible(win, '[data-length-row="normal"]').click();
    await visible(win, '[data-tone-row="neutral"]').click();

    const card = win.getByText("login inside substrate").first();
    await card.waitFor({ timeout: 15_000 }).catch(() => { throw new Error("the sign-in card did not draw"); });
    const ended = (n: number) => win.waitForFunction((want) => ((window as any).__vmSignals ?? []).filter((s: { name: string }) => s.name === "CLI_LOGIN_FINISHED").length >= want, n, { timeout: 15_000 })
      .catch(() => { throw new Error(`the card's flow did not end a ${n === 1 ? "first" : n === 2 ? "second" : "third"} time`); });
    await ended(1);
    await visible(win, "button:has-text('retry')").click();
    await ended(2);
    await visible(win, "button:has-text('retry')").click();
    await visible(win, "button:has-text('cancel')").waitFor({ timeout: 10_000 });
    await settled(win);
    await visible(win, "button:has-text('cancel')").click();
    await ended(3);

    // The trace, read once the app has closed and its files are complete.
    await app.close();
    const names = new Set(["CLI_STATUS_CHECKED", "CLI_LOGIN_PROMPTED", "CLI_LOGIN_FINISHED"]);
    const got = windowRecords(launch).filter((r) => names.has(r.name) && r.payload.driver === CLI);
    const lines = got.map((r) => `${r.name} pane=${String(r.pane_id)} ${Object.entries(r.payload).map(([k, v]) => `${k}=${String(v)}`).join(" ")}`);
    const want = [
      `CLI_STATUS_CHECKED pane=1 driver=${CLI} authed=false`,
      `CLI_LOGIN_PROMPTED pane=1 pane_id=1 driver=${CLI}`,
      `CLI_LOGIN_FINISHED pane=1 pane_id=1 driver=${CLI} outcome=signed_in`,
      `CLI_LOGIN_FINISHED pane=1 pane_id=1 driver=${CLI} outcome=failed`,
      `CLI_LOGIN_FINISHED pane=1 pane_id=1 driver=${CLI} outcome=dismissed`,
    ];
    if (lines.join("\n") !== want.join("\n")) throw new Error(`records in window-1.jsonl:\n  ${lines.join("\n  ") || "none"}\nwant:\n  ${want.join("\n  ")}`);
    console.log(`cli_login_signals: ok — ${want.length} records in order: the status check, the card, then signed in, failed and dismissed`);
    code = 0;
  } catch (e) {
    console.error(`cli_login_signals: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup();
  }
  process.exit(code);
}

main();
