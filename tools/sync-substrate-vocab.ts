#!/usr/bin/env npx tsx
/**
 * tools/sync-substrate-vocab.ts
 *
 * Copies substrate's locked vocabulary (../substrate/process/signals/0.2.json)
 * into substrate-ui's mirror (signals/mirror/substrate-0.2.json), then prints the
 * fresh sha256. Used by `npm run sync:substrate-vocab`.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, "..", "..", "substrate", "process", "signals", "0.2.json");
const DST = resolve(HERE, "..", "signals", "mirror", "substrate-0.2.json");

function main(): void {
  let raw: string;
  try { raw = readFileSync(SRC, "utf8"); }
  catch (e) { console.error(`[sync] cannot read source ${SRC}: ${(e as Error).message}`); process.exit(2); }
  writeFileSync(DST, raw);
  const sha = createHash("sha256").update(raw).digest("hex");
  console.log(`[sync] copied ${raw.length} bytes ${SRC} → ${DST}`);
  console.log(`[sync] sha256: ${sha}`);
  console.log("[sync] update signals/mirror/README.md 'as mirrored' line if the hash changed, then run npm run signals to confirm consumers still grade green.");
}

main();
