#!/usr/bin/env npx tsx
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/**
 * tools/sync-substrate-vocab.ts
 *
 * Follows substrate's `../substrate/process/signals/current.json` symlink
 * (added by substrate sprint 239) to the highest-committed version, copies
 * it into substrate-ui's mirror at `signals/mirror/substrate-<version>.json`,
 * and prints the fresh sha256. Used by `npm run sync:substrate-vocab`.
 *
 * Sprint 033a (substrate-ui side, 2026-08-28): replaced the hard-coded
 * `substrate/process/signals/0.2.json` path with the symlink follow. When
 * substrate bumps its lock, this syncer picks up the new version without
 * a rebuild — one command follows one stable pointer.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, "..", "..", "substrate", "process", "signals", "current.json");
const MIRROR_DIR = resolve(HERE, "..", "signals", "mirror");

function main(): void {
  let raw: string;
  try { raw = readFileSync(SRC, "utf8"); }
  catch (e) { console.error(`[sync] cannot read source ${SRC}: ${(e as Error).message}`); process.exit(2); }
  let parsed: { version?: string; vocabulary_version?: string };
  try { parsed = JSON.parse(raw); }
  catch (e) { console.error(`[sync] source is not valid JSON: ${(e as Error).message}`); process.exit(2); }
  const version = parsed.vocabulary_version ?? parsed.version;
  if (typeof version !== "string" || !version) {
    console.error("[sync] source lacks a vocabulary_version (or version) field; cannot name mirror file.");
    process.exit(2);
  }
  const dst = resolve(MIRROR_DIR, `substrate-${version}.json`);
  writeFileSync(dst, raw);
  const sha = createHash("sha256").update(raw).digest("hex");
  console.log(`[sync] copied ${raw.length} bytes ${SRC} → ${dst}`);
  console.log(`[sync] substrate version: ${version}`);
  console.log(`[sync] sha256: ${sha}`);
  console.log("[sync] update the mirror import path in web/instrumentation/vocabulary.ts if version changed, then run npm run signals to confirm consumers still grade green.");
}

main();
