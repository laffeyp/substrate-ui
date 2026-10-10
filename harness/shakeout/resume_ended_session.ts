// Resume-an-ended-session flow, against source or a packaged bundle.
//
// The reported failure (2026-09-29): pick an ended session back up, see
// its old transcript, type a line — the transcript vanishes and a new
// session starts. Two causes, both fixed alongside this harness:
//   - client: the replayed SessionEnded envelope cleared sessionId, so
//     sendTurn opened a new session (session_controller.ts).
//   - server: session_topology finalises on threshold_count(SessionEnded, 1)
//     and the runtime counts the whole record on resume, so a resumed
//     ended session finalised before the model ran (server.py
//     _with_session_end_threshold).
//
// Steps, on the app's default driver (a real model: this gate checks resume end to end, so it
// is part of the real-model tier; SMOKE_DRIVER=deterministic runs it offline):
//   1. open a session, one turn, wait for park;
//   2. endSession (explicit end unbinds the pane's session);
//   3. attachExisting(that id): the old transcript replays, endedReason set;
//   4. type a line through the real prompt input, press Enter;
//   5. assert: same session id, the old reply still on screen, a new model
//      reply, the turn parks, server status "parked".
//
// SMOKE_TARGET=source runs `electron .`; otherwise SMOKE_APP or
// dist-electron/mac-arm64/Substrate.app. HOME is a temp dir, so the run
// never touches ~/.substrate. UV_CACHE_DIR and UV_PYTHON_INSTALL_DIR stay on
// the real home in source mode: uv's content-addressed package and
// interpreter caches are build inputs, not app state, and an empty cache
// would download a Python per run.

import { _electron as electron } from "playwright";
import { join, resolve } from "node:path";
import { scratchDir } from "./lib/scratch";
import { bindPaneAsUser } from "./lib/electron";

const REPO_ROOT = resolve(__dirname, "..", "..");
const TARGET = process.env.SMOKE_TARGET === "source" ? "source" : "packaged";
const APP_ROOT =
  process.env.SMOKE_APP || process.env.SHAKEOUT_APP || join(REPO_ROOT, "dist-electron", "mac-arm64", "Substrate.app");
const FIRST = "reply with the single word ok and use no tools";
const SECOND = "reply with the single word yes and use no tools";

type Snap = {
  sessionId: string | null;
  parkReason: unknown;
  endedReason: unknown;
  transcript: { role: string; text: string }[];
};
type Vm = {
  get(id: number): {
    snapshot(): Snap;
    loadDriverRoster(): Promise<void>;
    pickDriver(n: string): void;
    openSession(o: { driver: string }): Promise<void>;
    sendTurn(t: string): Promise<void>;
    endSession(r?: string): Promise<void>;
    attachExisting(id: string): Promise<void>;
  } | null;
  spawn(id: number): unknown;
};

// A failed check throws, so the finally below always closes the app and its backend.
function die(msg: string): never {
  throw new Error(msg);
}

async function main(): Promise<void> {
  const home = scratchDir("resume-home-");
  const userData = scratchDir("resume-ud-");
  const env = { ...process.env, HOME: home, UV_CACHE_DIR: join(process.env.HOME || "", ".cache/uv"), UV_PYTHON_INSTALL_DIR: join(process.env.HOME || "", ".local/share/uv/python") } as Record<string, string>;
  const app = TARGET === "source"
    ? await electron.launch({ args: [REPO_ROOT, "--user-data-dir=" + userData], env, timeout: 60_000 })
    : await electron.launch({ executablePath: join(APP_ROOT, "Contents", "MacOS", "Substrate"), args: ["--user-data-dir=" + userData], env, timeout: 60_000 });
  const stderr: string[] = [];
  app.process().stderr?.on("data", (b) => stderr.push(b.toString()));
  let code = 1;
  try {
    const win = await app.firstWindow({ timeout: 30_000 });
    await win.waitForFunction(() => (window as unknown as { __vm?: unknown }).__vm != null, undefined, { timeout: 30_000 });

    // Bind pane 1 the way a user does: Enter in the path input picks the per-session sandbox.
    await bindPaneAsUser(win);

    // 1. Open + first turn.
    const sid = await win.evaluate(async ([first, override]) => {
      const vm = (window as unknown as { __vm: Vm }).__vm;
      const c = (vm.get(1) ?? vm.spawn(1)) as NonNullable<ReturnType<Vm["get"]>>;
      await c.loadDriverRoster();
      const r = await fetch("/api/models").then((x) => x.json()) as { default?: string };
      const drv = override || r.default;
      if (!drv) throw new Error("no default driver");
      c.pickDriver(drv);
      await c.openSession({ driver: drv });
      await c.sendTurn(first);
      return c.snapshot().sessionId;
    }, [FIRST, process.env.SMOKE_DRIVER || ""] as const);
    if (!sid) die("no session opened");
    await win.waitForFunction(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().parkReason != null, undefined, { timeout: 180_000 });
    const firstReply = await win.evaluate(() => {
      const t = (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot().transcript;
      return t.filter((r) => r.role === "model").map((r) => r.text).pop() ?? "";
    });
    if (!firstReply) die("first turn produced no model reply");

    // 2. Explicit end.
    await win.evaluate(async () => { await (window as unknown as { __vm: Vm }).__vm.get(1)!.endSession("user_end"); });

    // 3. Pick it back up.
    await win.evaluate(async (id) => { await (window as unknown as { __vm: Vm }).__vm.get(1)!.attachExisting(id); }, sid);
    await win.waitForFunction(
      (reply) => {
        const s = (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot();
        return s.endedReason != null && s.transcript.some((r) => r.role === "model" && r.text === reply);
      },
      firstReply,
      { timeout: 30_000 },
    ).catch(() => die("attach did not replay the ended session's transcript"));

    // 4. Type through the real prompt input.
    const prompt = win.locator('input[placeholder^="type to talk"]').first();
    await prompt.waitFor({ state: "visible", timeout: 15_000 });
    await prompt.click();
    await prompt.type(SECOND, { delay: 10 });
    await win.keyboard.press("Enter");

    // 5. Same session, old reply kept, new reply, parked.
    await win.waitForFunction(
      (a) => {
        const s = (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot();
        const models = s.transcript.filter((r) => r.role === "model");
        return s.parkReason != null && models.length >= 2 && models[models.length - 1].text !== a.firstReply;
      },
      { firstReply },
      { timeout: 180_000 },
    ).catch(() => die("resumed turn produced no second model reply"));
    const after = await win.evaluate(() => (window as unknown as { __vm: Vm }).__vm.get(1)!.snapshot());
    if (after.sessionId !== sid) die("typing opened a new session: " + after.sessionId + " (expected " + sid + ")");
    if (!after.transcript.some((r) => r.role === "model" && r.text === firstReply)) die("old transcript was wiped on resume");
    const status = await win.evaluate(async (id) => (await fetch("/api/session/" + id).then((x) => x.json()) as { status: string }).status, sid);
    if (status !== "parked") die("server status after resume is " + status + ", expected parked");
    const second = after.transcript.filter((r) => r.role === "model").map((r) => r.text).pop();
    process.stdout.write("resume_ended_session[" + TARGET + "]: ok — " + sid + " ended, re-attached, resumed; replies " + JSON.stringify([firstReply, second]) + ", status " + status + "\n");
    code = 0;
  } catch (err) {
    process.stderr.write("resume_ended_session: " + (err instanceof Error ? err.message : String(err)) + "\n--- stderr ---\n" + stderr.join("").slice(-3000) + "\n");
  } finally {
    await app.close().catch(() => undefined);
  }
  process.exit(code);
}

main();
