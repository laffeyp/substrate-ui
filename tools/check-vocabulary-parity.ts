#!/usr/bin/env npx tsx
/**
 * tools/check-vocabulary-parity.ts
 *
 * The parity gate for substrate-ui. Ported from
 * /Users/peterlaffey/Documents/Claude/Projects/Katybird/tools/check-vocabulary-parity.ts.
 *
 * Three jobs:
 *   1. Parse signals/versions/current.json (symlink to the locked version). Fail if malformed.
 *   2. Validate the lock's internal consistency (categories declared, strata declared,
 *      every tag's category and stratum are in the declared sets, payload arrays well-formed).
 *   3. Walk web/, harness/, and tools/ for emit("TAG_NAME", ...) call sites and assert every
 *      emitted tag exists in the lock. Fail with a typed report on drift.
 *
 * Instrumentation arc landed at Sprints 019 (vocab lock) + 020 (emitter) + 021–028 (per-subsystem
 * wiring); every code-side emit under the scan dirs must reference a locked tag.
 *
 * Usage:  npx tsx tools/check-vocabulary-parity.ts
 * Exit:   0 on parity, 1 on drift, 2 on lock-file structural error.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

type Tag = {
  name: string;
  category: string;
  stratum: string;
  payload: string[];
  optional_payload: string[];
  note: string;
};

type Lock = {
  vocabulary_version: string;
  locked: boolean;
  locked_at: string | null;
  tag_count: number;
  categories: string[];
  strata: string[];
  tags: Tag[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const LOCK_PATH = join(ROOT, "signals", "versions", "current.json");
const SCAN_DIRS = ["web", "harness", "tools"];
const SCAN_EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const SELF = "tools/check-vocabulary-parity.ts";
const SKIP_DIRS = new Set(["node_modules", "dist", "_deprecated"]);

// emit("TAG_NAME", ...) — single or double quotes, anywhere on a line.
const EMIT_RE = /\bemit\s*\(\s*["']([A-Z][A-Z0-9_]*)["']/g;

function fail(code: number, msg: string): never {
  console.error(`[vocab-parity] ${msg}`);
  process.exit(code);
}

function loadLock(): Lock {
  let raw: string;
  try {
    raw = readFileSync(LOCK_PATH, "utf8");
  } catch (e) {
    fail(2, `cannot read lock file at ${LOCK_PATH}: ${(e as Error).message}`);
  }
  try {
    return JSON.parse(raw) as Lock;
  } catch (e) {
    fail(2, `lock file is not valid JSON: ${(e as Error).message}`);
  }
}

function validateLockStructure(lock: Lock): void {
  if (!Array.isArray(lock.categories) || lock.categories.length === 0) fail(2, "lock.categories must be a non-empty array");
  if (!Array.isArray(lock.strata) || lock.strata.length === 0) fail(2, "lock.strata must be a non-empty array");
  if (!Array.isArray(lock.tags)) fail(2, "lock.tags must be an array");

  const cats = new Set(lock.categories);
  const strata = new Set(lock.strata);
  const seen = new Set<string>();
  const errs: string[] = [];

  for (const tag of lock.tags) {
    if (!tag.name || !/^[A-Z][A-Z0-9_]*$/.test(tag.name)) { errs.push(`bad tag name: ${JSON.stringify(tag.name)}`); continue; }
    if (seen.has(tag.name)) errs.push(`duplicate tag: ${tag.name}`);
    seen.add(tag.name);
    if (!cats.has(tag.category)) errs.push(`${tag.name}: unknown category ${tag.category}`);
    if (!strata.has(tag.stratum)) errs.push(`${tag.name}: unknown stratum ${tag.stratum}`);
    if (!Array.isArray(tag.payload)) errs.push(`${tag.name}: payload must be an array`);
    if (!Array.isArray(tag.optional_payload)) errs.push(`${tag.name}: optional_payload must be an array`);
  }

  if (typeof lock.tag_count === "number" && lock.tag_count !== lock.tags.length) {
    errs.push(`tag_count ${lock.tag_count} does not match tags.length ${lock.tags.length}`);
  }

  if (errs.length) {
    for (const e of errs) console.error(`[vocab-parity]   ${e}`);
    fail(2, `lock file failed structural validation (${errs.length} error(s))`);
  }
}

function walk(dir: string, out: string[] = []): string[] {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry) || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    let s;
    try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) walk(p, out);
    else if (SCAN_EXTS.has(p.slice(p.lastIndexOf(".")))) out.push(p);
  }
  return out;
}

function findEmittedTags(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  for (const dir of SCAN_DIRS) {
    const abs = join(ROOT, dir);
    for (const file of walk(abs)) {
      const rel = relative(ROOT, file);
      if (rel === SELF) continue;
      let body: string;
      try { body = readFileSync(file, "utf8"); } catch { continue; }
      let m;
      EMIT_RE.lastIndex = 0;
      while ((m = EMIT_RE.exec(body)) !== null) {
        const tag = m[1];
        if (!found.has(tag)) found.set(tag, []);
        found.get(tag)!.push(rel);
      }
    }
  }
  return found;
}

function main(): void {
  const lock = loadLock();
  validateLockStructure(lock);

  const declared = new Set(lock.tags.map((t) => t.name));
  const emitted = findEmittedTags();

  const drift: { tag: string; sites: string[] }[] = [];
  for (const [tag, sites] of emitted) {
    if (!declared.has(tag)) drift.push({ tag, sites });
  }

  if (drift.length) {
    console.error(`[vocab-parity] DRIFT: ${drift.length} tag(s) emitted in code but not in lock ${lock.vocabulary_version}:`);
    for (const d of drift) {
      console.error(`  ${d.tag}`);
      for (const s of d.sites) console.error(`    at ${s}`);
    }
    console.error(`[vocab-parity] Do not invent tags. Add to signals/versions/current.json (via proposal + version bump) or remove the emit.`);
    process.exit(1);
  }

  console.log(
    `[vocab-parity] OK — vocabulary ${lock.vocabulary_version} (${lock.tags.length} tags, locked=${lock.locked}); ` +
      `code emits ${emitted.size} distinct tag(s), all locked.`
  );
}

main();
