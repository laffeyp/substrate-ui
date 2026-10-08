// UI sprint 107: one fixture for every temp directory a gate makes. Each gate gives the app a fresh
// SUBSTRATE_HOME and profile (Meszaros, xUnit Test Patterns: Fresh Fixture) and removes them when the
// process exits (Fixture Teardown); before this, 16 of 18 call sites left their directory behind and
// $TMPDIR held 69 of them. SHAKEOUT_KEEP_SCRATCH=1 keeps them for a post-mortem.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const made: string[] = [];

process.on("exit", () => {
  if (process.env.SHAKEOUT_KEEP_SCRATCH === "1") {
    for (const d of made) process.stderr.write(`[scratch] kept ${d}\n`);
    return;
  }
  for (const d of made) {
    try { rmSync(d, { recursive: true, force: true }); } catch { /* a child still holds it open */ }
  }
});

export function scratchDir(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  made.push(d);
  return d;
}
