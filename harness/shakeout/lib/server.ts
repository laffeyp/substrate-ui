// Server-lifecycle control for the shakeout harness. Owns the
// server.py subprocess. Supports start / stop / SIGSTOP / SIGCONT so
// the refused-open, interrupt, and stream-reconnect flows can drive
// real failure modes.

import { spawn, ChildProcess } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { join } from "node:path";
import { scratchDir } from "./scratch";
import { shakeoutOutDir } from "./report";

const REPO_ROOT = join(__dirname, "..", "..", "..");
const SUBSTRATE_ROOT = join(REPO_ROOT, "..", "substrate");
const SERVER_PATH = join(REPO_ROOT, "server.py");

// The port is chosen at the first start (SHAKEOUT_PORT pins it) and kept across restarts, so the
// refused/reconnect flows reconnect to the same address. It is never the 8765 a standalone
// server.py and the CLI's TCP fallback default to (lens audit F370). BASE_URL is a live binding:
// read it at call time, after start().
let PORT = Number(process.env.SHAKEOUT_PORT || "0");
export let BASE_URL = `http://127.0.0.1:${PORT}`;

async function freePort(): Promise<number> {
  const net = await import("node:net");
  return new Promise<number>((resolve, reject) => {
    const s = net.createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const addr = s.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      s.close(() => resolve(port));
    });
  });
}

export class ServerHandle {
  private proc: ChildProcess | null = null;
  private logPath = join(shakeoutOutDir(), "server.log");
  readonly substrateHome: string;

  constructor() {
    this.substrateHome = scratchDir("shakeout-home-");
  }

  async start(): Promise<void> {
    if (this.proc) return;
    if (!PORT) {
      PORT = await freePort();
      BASE_URL = `http://127.0.0.1:${PORT}`;
    }
    await this.requirePortFree();
    const fs = await import("node:fs");
    fs.mkdirSync(shakeoutOutDir(), { recursive: true });
    const out = fs.openSync(this.logPath, "a");
    // detached:true puts the child in its own process group so we can
    // signal the whole group (uv + python). Killing only uv leaves the
    // python child running and holding the port.
    // SHAKEOUT_APP=<path to Substrate.app> runs the flows against a PACKAGED bundle: its own
    // interpreter and its own server.py, spawned the way electron/main.js spawns them
    // (Sprint 098; the parity gate Sprint 091 named and never built).
    // PYTHONDONTWRITEBYTECODE: a .pyc written inside a signed bundle breaks its seal.
    const app = process.env.SHAKEOUT_APP;
    const [exe, args, cwd] = app
      ? [
        join(app, "Contents", "Resources", "python", "bin", "python3"),
        [join(app, "Contents", "Resources", "app.asar.unpacked", "server.py"), "--port", String(PORT)],
        join(app, "Contents", "Resources"),
      ]
      : ["uv", ["run", "python", SERVER_PATH, "--port", String(PORT)], SUBSTRATE_ROOT];
    this.proc = spawn(exe as string, args as string[], {
      cwd: cwd as string,
      detached: true,
      stdio: ["ignore", out, out],
      env: {
        ...process.env,
        SUBSTRATE_HOME: this.substrateHome,
        PYTHONUNBUFFERED: "1",
        PYTHONDONTWRITEBYTECODE: "1",
        // the packaged interpreter is a symlink into Contents/Frameworks (F10); name its home
        ...(app ? { PYTHONHOME: join(app, "Contents", "Resources", "python") } : {}),
      },
    });
    await this.waitHealthy(30000);
  }

  async stop(): Promise<void> {
    if (!this.proc) return;
    const p = this.proc;
    this.proc = null;
    // Negative pid targets the whole process group (uv wraps python;
    // signalling only uv leaves python holding the port).
    if (p.pid) {
      try { process.kill(-p.pid, "SIGTERM"); }
      catch { try { p.kill("SIGTERM"); } catch { /* already dead */ } }
    }
    await new Promise<void>((resolve) => {
      p.once("exit", () => resolve());
      setTimeout(() => resolve(), 3000);
    });
    await this.waitPortFree(5000);
    // Belt and braces: if anything is still listening on the port,
    // SIGKILL its group.
    if (p.pid) { try { process.kill(-p.pid, "SIGKILL"); } catch { /* ok */ } }
  }

  private async requirePortFree(): Promise<void> {
    const net = await import("node:net");
    const free = await new Promise<boolean>((resolve) => {
      const s = net.createServer();
      s.once("error", () => resolve(false));
      s.once("listening", () => { s.close(() => resolve(true)); });
      s.listen(PORT, "127.0.0.1");
    });
    if (free) return;
    const { execSync } = await import("node:child_process");
    let pid = "";
    try { pid = execSync(`lsof -iTCP:${PORT} -sTCP:LISTEN -t`, { encoding: "utf8" }).trim(); }
    catch { /* lsof returns non-zero if empty */ }
    throw new Error(
      `port ${PORT} already bound${pid ? ` (pid ${pid})` : ""}. ` +
      `Refusing to start — a squatter subverts every refused/reconnect flow. ` +
      `Kill it first: kill ${pid || `$(lsof -iTCP:${PORT} -sTCP:LISTEN -t)`}`
    );
  }

  private async waitPortFree(timeoutMs: number): Promise<void> {
    const net = await import("node:net");
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const free = await new Promise<boolean>((resolve) => {
        const s = net.createServer();
        s.once("error", () => resolve(false));
        s.once("listening", () => { s.close(() => resolve(true)); });
        s.listen(PORT, "127.0.0.1");
      });
      if (free) return;
      await sleep(100);
    }
  }

  freeze(): void {
    if (!this.proc?.pid) throw new Error("server not running; cannot SIGSTOP");
    process.kill(-this.proc.pid, "SIGSTOP");
  }

  thaw(): void {
    if (!this.proc?.pid) throw new Error("server not running; cannot SIGCONT");
    process.kill(-this.proc.pid, "SIGCONT");
  }

  /** Immediate SIGKILL — no graceful shutdown, no SessionEnded envelope,
   * socket RSTs. Use this to simulate a server crash mid-stream; a plain
   * stop() sends SIGTERM and the server's shutdown handler emits
   * SessionEnded before dying, which the client handles gracefully. */
  async kill(): Promise<void> {
    if (!this.proc) return;
    const p = this.proc;
    this.proc = null;
    if (p.pid) {
      try { process.kill(-p.pid, "SIGKILL"); }
      catch { try { p.kill("SIGKILL"); } catch { /* already dead */ } }
    }
    await new Promise<void>((resolve) => {
      p.once("exit", () => resolve());
      setTimeout(() => resolve(), 2000);
    });
    await this.waitPortFree(5000);
  }

  async waitHealthy(timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const r = await fetch(BASE_URL + "/api/models");
        if (r.ok) return;
      } catch { /* keep waiting */ }
      await sleep(100);
    }
    throw new Error(`server did not become healthy within ${timeoutMs}ms`);
  }

  isRunning(): boolean {
    return this.proc !== null;
  }
}
