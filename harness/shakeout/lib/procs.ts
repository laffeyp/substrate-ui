// Process lookups scoped to one gate run. A gate counts and stops only processes it started:
// backends are found by the SUBSTRATE_HOME in their environment, and their children by walking
// the parent chain from those backends. Nothing here matches by name machine-wide.

import { spawnSync } from "node:child_process";

interface Proc { pid: number; ppid: number; command: string }

function table(): Proc[] {
  const out = spawnSync("ps", ["-axo", "pid=,ppid=,command="], { encoding: "utf8" }).stdout || "";
  return out.split("\n").filter(Boolean).map((l) => {
    const m = l.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);
    return m ? { pid: Number(m[1]), ppid: Number(m[2]), command: m[3] } : null;
  }).filter((p): p is Proc => p !== null);
}

/** server.py backends whose environment carries this state root. */
export function backendPids(state: string): number[] {
  return table()
    .filter((p) => /server\.py --port/.test(p.command) && !/uv run/.test(p.command))
    .map((p) => p.pid)
    .filter((pid) => (spawnSync("ps", ["eww", "-o", "command=", "-p", String(pid)], { encoding: "utf8" }).stdout || "")
      .includes("SUBSTRATE_HOME=" + state));
}

/** Descendants of `roots` (any depth) whose command line matches `re`. */
export function descendantsMatching(roots: number[], re: RegExp): number[] {
  const procs = table();
  const byPid = new Map(procs.map((p) => [p.pid, p]));
  const rootSet = new Set(roots);
  const underRoot = (p: Proc): boolean => {
    for (let cur: Proc | undefined = p, depth = 0; cur && depth < 32; cur = byPid.get(cur.ppid), depth++) {
      if (rootSet.has(cur.ppid)) return true;
    }
    return false;
  };
  return procs.filter((p) => re.test(p.command) && underRoot(p)).map((p) => p.pid);
}
