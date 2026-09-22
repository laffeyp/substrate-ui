// Server-lifecycle control for the shakeout harness. Owns the
// server.py subprocess. Supports start / stop / SIGSTOP / SIGCONT so
// the refused-open, interrupt, and stream-reconnect flows can drive
// real failure modes.

import { spawn, ChildProcess } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..", "..", "..");
const SUBSTRATE_ROOT = join(REPO_ROOT, "..", "substrate");
const SERVER_PATH = join(REPO_ROOT, "server.py");

export const BASE_URL = "http://127.0.0.1:8765";

export class ServerHandle {
  private proc: ChildProcess | null = null;
  private logPath = "/tmp/shakeout-server.log";

  async start(): Promise<void> {
    if (this.proc) return;
    const fs = await import("node:fs");
    const out = fs.openSync(this.logPath, "a");
    // detached:true puts the child in its own process group so we can
    // signal the whole group (uv + python). Killing only uv leaves the
    // python child running and holding port 8765.
    this.proc = spawn("uv", ["run", "python", SERVER_PATH], {
      cwd: SUBSTRATE_ROOT,
      detached: true,
      stdio: ["ignore", out, out],
    });
    await this.waitHealthy(5000);
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

  private async waitPortFree(timeoutMs: number): Promise<void> {
    const net = await import("node:net");
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const free = await new Promise<boolean>((resolve) => {
        const s = net.createServer();
        s.once("error", () => resolve(false));
        s.once("listening", () => { s.close(() => resolve(true)); });
        s.listen(8765, "127.0.0.1");
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
