// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The workspace file API in the running app, read from its trace (UI sprint 387; editor plan round
// 2, item 0(c); vocabulary v0.26). After one deterministic turn in pane 1, the window calls the API
// as the editor view will: list the workspace, read a file, write it with the hash the read gave,
// write it again with a stale hash (refused), open the watch stream and close it.
// server.jsonl must hold, in order: FILES_LISTED, FILE_READ, FILE_WRITTEN (written at_rest, a seq),
// API_REFUSED (area files, status 409), FILES_WATCH_OPENED, FILES_WATCH_CLOSED, each for the
// session; the kernel record holds FileWritten at FILE_WRITTEN's seq with the old and the new text;
// no path or text reaches the trace (E1).

import { existsSync, readFileSync, readdirSync } from "node:fs";
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

    const listed = await call(win, "GET", `${s}/files?dir=`);
    const name = (listed.data?.entries ?? []).map((e: { name: string; kind: string }) => e).find((e: { kind: string }) => e.kind === "file")?.name ?? "notes.txt";
    if (!listed.data?.entries?.some((e: { name: string }) => e.name === name)) {
      const made = await call(win, "PUT", `${s}/file?path=${name}`, { text: "first\n" });
      if (made.status !== 200) throw new Error(`creating ${name}: ${made.status} ${JSON.stringify(made.data)}`);
    }
    const read = await call(win, "GET", `${s}/file?path=${encodeURIComponent(name)}`);
    if (read.status !== 200) throw new Error(`read ${name}: ${read.status}`);
    const wrote = await call(win, "PUT", `${s}/file?path=${encodeURIComponent(name)}`, { text: "edited by the gate\n", base_sha256: read.data.sha256 });
    if (wrote.status !== 200) throw new Error(`write: ${wrote.status} ${JSON.stringify(wrote.data)}`);
    const stale = await call(win, "PUT", `${s}/file?path=${encodeURIComponent(name)}`, { text: "lost", base_sha256: read.data.sha256 });
    if (stale.status !== 409) throw new Error(`a stale write answered ${stale.status}, expected 409`);
    // The watch: open, see its ready event, close; the server notices the hang-up on its next poll.
    await win.evaluate((url) => new Promise<void>((resolve) => {
      const es = new EventSource(url);
      es.addEventListener("ready", () => { es.close(); resolve(); });
    }), `${s}/files/watch`);
    const record = await call(win, "GET", s);
    // The server sees the close at its next watch poll (WATCH_POLL_S 0.5 s): wait for its record.
    const traces = join(launch.state, "electron", "logs", "traces");
    const boot = readdirSync(traces).sort().pop()!;
    const serverFile = join(traces, boot, "server.jsonl");
    const end = Date.now() + 10_000;
    while (Date.now() < end && !(existsSync(serverFile) && readFileSync(serverFile, "utf8").includes('"FILES_WATCH_CLOSED"'))) {
      await new Promise((r) => setTimeout(r, 100));
    }
    await app.close();

    const recs = readFileSync(serverFile, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Rec)
      .filter((r) => /^FILE|^FILES|^API_REFUSED$/.test(r.name) && (r.payload.session_id === sid || r.payload.area === "files"));
    const seq = wrote.data.seq as number;
    const want: [string, Record<string, unknown>][] = [
      ["FILE_WRITTEN", { written: "at_rest", seq }],
      ["API_REFUSED", { area: "files", status: 409 }],
      ["FILES_WATCH_OPENED", { session_id: sid }],
      ["FILES_WATCH_CLOSED", { session_id: sid }],
    ];
    const names = recs.map((r) => r.name);
    const tail = recs.slice(names.lastIndexOf("FILE_WRITTEN"));
    const ok = names[0] === "FILES_LISTED" && names.includes("FILE_READ")
      && want.every(([n, p], i) => tail[i]?.name === n && Object.entries(p).every(([k, v]) => tail[i].payload[k] === v));
    if (!ok) throw new Error(`server.jsonl's file records: ${JSON.stringify(recs.map((r) => [r.name, r.payload]))}`);
    if (JSON.stringify(recs).includes("edited by the gate") || JSON.stringify(recs).includes(name)) throw new Error("a path or text reached the trace (E1)");

    // The kernel record holds the edit at that seq.
    const root = record.data.record as string;
    const lines = readdirSync(root).filter((f) => f.startsWith("events-")).sort().flatMap((f) => readFileSync(join(root, f), "utf8").split("\n").filter(Boolean));
    const entry = lines.map((l) => JSON.parse(l)).find((e) => e.seq === seq);
    if (!entry || entry.kind !== "FileWritten" || entry.payload.new_text !== "edited by the gate\n" || entry.payload.path !== name) {
      throw new Error(`the record at seq ${seq}: ${JSON.stringify(entry)}`);
    }
    console.log(`workspace_files_signals: ok — list, read, write (FileWritten at seq ${seq} on the record), a stale write refused 409, the watch opened and closed, each in server.jsonl with no path or text`);
    code = 0;
  } catch (e) {
    console.error(`workspace_files_signals: FAIL — ${(e as Error).message}`);
  } finally {
    await app.close().catch(() => undefined);
    launch.cleanup({ keep: code !== 0 });
  }
  process.exit(code);
}

main();
