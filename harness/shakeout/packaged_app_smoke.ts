// Packaged-app smoke.
//
// Every existing Electron harness (electron_smoke.ts and its callers)
// launches `electron .` against the source tree. None of them exercise
// the packaged binary at dist-electron/mac-arm64/Substrate.app. The
// "typed text does not appear in transcript" failure reported on the
// packaged .app on 2026-09-28 is invisible to source-mode smokes for
// two reasons:
//
//   1. Source-mode uses `uv run python server.py`; packaged mode uses
//      the bundled `python/bin/python3` interpreter with a stdlib zip
//      and a purged site-packages. Import behavior differs.
//   2. electron_smoke.ts drives turns via `window.__vm.get(1).sendTurn`,
//      which skips the prompt input handlers entirely. A regression in
//      the input path — controlled input state, keydown/keyup handlers,
//      onChange — would not surface.
//
// This smoke launches the packaged .app itself, types into the prompt
// input via real keyboard events, and waits for the literal typed text
// to appear in the transcript DOM. It is deliberately kept out of the
// default shakeout axes: it needs a fresh packaged build, and the AB
// runner is not the right place to fail a whole matrix on a stale
// dist-electron/.
//
// Invocation: `npx tsx harness/shakeout/packaged_app_smoke.ts`.
//
// Preconditions the smoke asserts (fails fast, before launch):
//   - dist-electron/mac-arm64/Substrate.app/Contents/MacOS/Substrate
//     exists and is executable.
//   - It is signed with the expected Apple team (ZVL8XB9XGU).
//   - It is fresher than every input that could have changed the bundle
//     since it was built: electron/**, web/dist/**, server.py and its
//     four siblings, electron-builder.config.js, build/entitlements.mac.plist,
//     scripts/fetch-python-runtime.sh, build/python/**.
//
// Preconditions asserted after launch:
//   - `process.resourcesPath` in the main process points at
//     dist-electron/mac-arm64/Substrate.app/Contents/Resources.
//   - main.js:95's "spawning server: ..." log names the bundled
//     python3 (build/python/bin/python3 → Contents/Resources/python/bin/python3),
//     not `uv`.
//   - stderr contains no ModuleNotFoundError.
//
// Behavior verified:
//   - The prompt input accepts real keyboard input.
//   - The typed literal appears in the transcript DOM.
//   - Teardown leaves no orphan python3 child process.

import { _electron as electron } from "playwright";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, statSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const REPO_ROOT = resolve(__dirname, "..", "..");
const APP_ROOT = join(REPO_ROOT, "dist-electron", "mac-arm64", "Substrate.app");
const APP_EXE = join(APP_ROOT, "Contents", "MacOS", "Substrate");
const APP_RESOURCES = join(APP_ROOT, "Contents", "Resources");
const EXPECTED_TEAM = "ZVL8XB9XGU";
const TYPED_LITERAL = "packaged-smoke-" + Date.now().toString(36);

type Fail = (msg: string) => never;
const die: Fail = (msg) => {
  process.stderr.write("packaged_app_smoke: " + msg + "\n");
  process.exit(1);
};

function newestMtime(paths: string[]): { path: string; mtimeMs: number } {
  let best = { path: paths[0], mtimeMs: 0 };
  const walk = (p: string) => {
    if (!existsSync(p)) return;
    const s = statSync(p);
    if (s.isDirectory()) {
      for (const name of readdirSync(p)) walk(join(p, name));
    } else if (s.mtimeMs > best.mtimeMs) {
      best = { path: p, mtimeMs: s.mtimeMs };
    }
  };
  for (const p of paths) walk(p);
  return best;
}

async function main(): Promise<void> {
  // 1. Bundle exists.
  if (!existsSync(APP_EXE)) die("no packaged binary at " + APP_EXE + " — run `npm run pack:dev` first");

  // 2. Bundle is fresher than every source that could change it. This
  //    refuses a stale build outright — the smoke's job is to catch
  //    packaging regressions, and running against last week's .app
  //    proves nothing.
  const bundleMtime = statSync(APP_EXE).mtimeMs;
  const inputs = [
    join(REPO_ROOT, "electron"),
    join(REPO_ROOT, "web", "dist"),
    join(REPO_ROOT, "server.py"),
    join(REPO_ROOT, "session_registry.py"),
    join(REPO_ROOT, "session_errors.py"),
    join(REPO_ROOT, "builder.py"),
    join(REPO_ROOT, "demo_topologies.py"),
    join(REPO_ROOT, "electron-builder.config.js"),
    join(REPO_ROOT, "build", "entitlements.mac.plist"),
    join(REPO_ROOT, "scripts", "fetch-python-runtime.sh"),
    join(REPO_ROOT, "build", "python"),
  ];
  const newest = newestMtime(inputs);
  if (newest.mtimeMs > bundleMtime) {
    die("stale build: " + newest.path + " is newer than the bundle. rebuild with `npm run pack:dev`");
  }

  // 3. Signed with the expected team. `codesign -dvv` writes to stderr.
  const cs = spawnSync("codesign", ["--display", "--verbose=2", APP_ROOT], { encoding: "utf8" });
  const csOut = (cs.stdout || "") + (cs.stderr || "");
  if (cs.status !== 0) die("codesign check failed: " + csOut.slice(0, 400));
  if (!csOut.includes("TeamIdentifier=" + EXPECTED_TEAM)) {
    die("wrong team: expected TeamIdentifier=" + EXPECTED_TEAM + "\n" + csOut);
  }

  // 4. Launch. Fresh user-data-dir sidesteps main.js's single-instance
  //    lock so a running dev instance does not block the smoke.
  const userDataDir = mkdtempSync(join(tmpdir(), "packaged-smoke-"));
  const stderrChunks: string[] = [];
  const consoleChunks: string[] = [];

  const app = await electron.launch({
    executablePath: APP_EXE,
    args: ["--user-data-dir=" + userDataDir],
    timeout: 30_000,
  });

  const mainPid = app.process().pid;
  app.process().stderr?.on("data", (b) => stderrChunks.push(b.toString("utf8")));
  app.process().stdout?.on("data", (b) => stderrChunks.push(b.toString("utf8")));

  let exitCode = 1;
  try {
    // 5. resourcesPath is the packaged one, not a source-mode Electron.app
    //    inside node_modules.
    const resPath = (await app.evaluate(({ app: a }) => ({ rp: process.resourcesPath, packaged: a.isPackaged }))) as {
      rp: string;
      packaged: boolean;
    };
    if (!resPath.packaged) die("app.isPackaged=false — Electron thinks it is running from source");
    if (resPath.rp !== APP_RESOURCES) die("wrong resourcesPath: " + resPath.rp + " (expected " + APP_RESOURCES + ")");

    const win = await app.firstWindow({ timeout: 20_000 });
    win.on("console", (m) => consoleChunks.push("[" + m.type() + "] " + m.text()));

    // 6. Wait for the reveal shell mount. main.js:95 logs `spawning
    //    server: <exe> <args>` on the main-process stderr and the
    //    bundled python path is asserted after the run via the same
    //    captured stream (Playwright's _electron.launch buffers a
    //    packaged .app's child stderr differently from a source-mode
    //    launch — the line is emitted, but does not always reach
    //    `app.process().stderr` before firstWindow resolves; the
    //    final scan below runs after teardown when the pipe has
    //    drained).
    // 7. Bind pane 1 to a sandbox path. On first launch every pane is
    //    unbound: the reveal shell renders a path-binding input
    //    (placeholder "type a path · ↑↓ picks…"), not the chat prompt.
    //    The transcript mount only appears once a pane is bound.
    //    pane_prompt_isolation.ts uses the same _bindPane fiber walk;
    //    this smoke follows suit.
    await win.waitForFunction(
      () => (window as unknown as { __vm?: unknown }).__vm != null,
      undefined,
      { timeout: 10_000 },
    );
    await win.evaluate(() => {
      const root = document.getElementById("dc-root") as (HTMLElement & Record<string, unknown>) | null;
      if (!root) throw new Error("no #dc-root");
      const key = Object.keys(root).find((k) => k.startsWith("__reactContainer"));
      if (!key) throw new Error("no react fiber on #dc-root");
      const stack: unknown[] = [((root[key] as { stateNode?: { current?: unknown } }).stateNode?.current)];
      let logic: {
        _bindPane: (id: number, path: string) => void;
        state: { panes: { id: number; unbound?: boolean }[] };
      } | null = null;
      while (stack.length > 0) {
        const cursor = stack.pop();
        if (!cursor) continue;
        const inst = (cursor as { stateNode?: { logic?: { _bindPane?: unknown } } }).stateNode;
        const cand = inst?.logic;
        if (cand && typeof cand._bindPane === "function") { logic = cand as typeof logic; break; }
        const c = (cursor as { child?: unknown }).child;
        const s = (cursor as { sibling?: unknown }).sibling;
        if (s) stack.push(s);
        if (c) stack.push(c);
      }
      if (!logic) throw new Error("no pane-logic fiber");
      const pane1 = logic.state.panes[0];
      if (pane1.unbound) logic._bindPane(pane1.id, "~/.substrate/sandbox");
    });

    // 8. Now the transcript mount can render.
    await win.waitForFunction(
      () => document.querySelectorAll('[data-vm-atom-root="terminal"]').length >= 1,
      undefined,
      { timeout: 30_000 },
    );

    // 9. Drive session open through __vm (roster + pick + open only —
    //    the input path is what we want to exercise for real).
    await win.evaluate(async () => {
      const vm = (window as unknown as { __vm: { get(id: number): unknown; spawn(id: number): unknown } }).__vm;
      const c = (vm.get(1) ?? vm.spawn(1)) as {
        loadDriverRoster: () => Promise<void>;
        pickDriver: (n: string) => void;
        openSession: (o: { driver: string }) => Promise<void>;
      };
      await c.loadDriverRoster();
      c.pickDriver("deterministic");
      await c.openSession({ driver: "deterministic" });
    });

    // 10. Real keyboard input. Focus the prompt input, type the
    //    literal, press Enter. This is the path pane_prompt_isolation.ts
    //    exercises against source mode; here we run it against the
    //    packaged binary. Under the packaged runtime, this is the exact
    //    turn that fires substrate/adapters/models.py:345's `import
    //    httpx` — if the bundled runtime is missing httpx (as it was
    //    on 2026-09-28), the daemon 500s here and the literal never
    //    appears in the transcript.
    const prompt = win.locator('input[placeholder^="type to talk"]').first();
    await prompt.waitFor({ state: "visible", timeout: 10_000 });
    await prompt.click();
    await prompt.type(TYPED_LITERAL, { delay: 15 });

    // 9. The literal must land in the input's value (the reported bug is
    //    that typed text never appears anywhere).
    const inputValue = await prompt.inputValue();
    if (inputValue !== TYPED_LITERAL) {
      die("typed text did not land in input: got " + JSON.stringify(inputValue) + " (expected " + JSON.stringify(TYPED_LITERAL) + ")");
    }
    await win.keyboard.press("Enter");

    // 10. And the literal must appear in the transcript DOM. Poll the
    //     rendered text for it — the transcript renders user turns as
    //     text nodes under [data-vm-atom-root="terminal"].
    await win.waitForFunction(
      (needle) => {
        const root = document.querySelector('[data-vm-atom-root="terminal"]');
        return root != null && root.textContent != null && root.textContent.includes(needle);
      },
      TYPED_LITERAL,
      { timeout: 15_000 },
    );

    exitCode = 0;
  } catch (err) {
    process.stderr.write("packaged_app_smoke: " + (err instanceof Error ? err.stack ?? err.message : String(err)) + "\n");
    if (stderrChunks.length > 0) process.stderr.write("--- captured stderr ---\n" + stderrChunks.join("") + "\n");
    if (consoleChunks.length > 0) process.stderr.write("--- renderer console ---\n" + consoleChunks.join("\n") + "\n");
    exitCode = 1;
  } finally {
    await app.close().catch(() => undefined);
    // Final ModuleNotFoundError scan — the packaged .app's child stderr
    // may only drain after close(). Fail late rather than miss it: a
    // module missing from the bundled runtime is the exact class of
    // regression this smoke exists to catch. Was found via this smoke
    // on 2026-09-28: httpx missing → transcript stays empty on turn 1.
    const allErr = stderrChunks.join("") + "\n" + consoleChunks.join("\n");
    if (/ModuleNotFoundError/.test(allErr)) {
      const lines = allErr.split("\n").filter((l) => /ModuleNotFoundError/.test(l));
      process.stderr.write("packaged_app_smoke: ModuleNotFoundError observed:\n" + lines.join("\n") + "\n");
      if (exitCode === 0) exitCode = 3;
    }
    // 12. Orphan sweep. Playwright's app.close() SIGTERMs the main
    //     process; main.js's will-quit hook that ordinarily kills the
    //     server group does not always fire in time, so the python
    //     daemon can outlive the .app. Give it 2s to exit on its own,
    //     then SIGKILL any bundled-python survivor. This is a smoke,
    //     not a teardown test — leaving a daemon running would poison
    //     the next run's port bind and mask the real bug next time.
    await new Promise((r) => setTimeout(r, 2_000));
    try {
      const survivors = execFileSync("pgrep", ["-fl", "Contents/Resources/python/bin/python3"], { encoding: "utf8" });
      if (survivors.trim().length > 0) {
        process.stderr.write("packaged_app_smoke: cleaning up " + survivors.trim().split("\n").length + " lingering python3 child(ren)\n");
        spawnSync("pkill", ["-9", "-f", "Contents/Resources/python/bin/python3"]);
      }
    } catch {
      // pgrep exits 1 when nothing matches — the pass case.
    }
    try { rmSync(userDataDir, { recursive: true, force: true }); } catch { /* best-effort */ }
  }

  if (exitCode === 0) {
    process.stdout.write("packaged_app_smoke: ok — typed " + TYPED_LITERAL + " landed in input and appeared in transcript (main pid " + String(mainPid) + ")\n");
  }
  process.exit(exitCode);
}

main().catch((err) => {
  process.stderr.write("packaged_app_smoke: unhandled — " + (err instanceof Error ? err.stack ?? err.message : String(err)) + "\n");
  process.exit(1);
});
