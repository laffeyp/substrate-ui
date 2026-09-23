#!/usr/bin/env npx tsx
/**
 * web/vm/tools/check-vocabulary-parity.ts
 *
 * Parity gate for the reveal shell alone. Walks web/vm/ and web/reveal.ts
 * for emit("TAG_NAME", ...) call sites and asserts every emitted tag
 * exists in web/vm/signals/versions/current.json. Fails with a typed
 * report on drift.
 *
 * Wholly separate from the classic shell's tools/check-vocabulary-parity.ts
 * which scans the classic tree against signals/versions/current.json.
 * Neither gate touches the other's scope.
 *
 * Usage:  npx tsx web/vm/tools/check-vocabulary-parity.ts
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
  retired?: boolean;
  replaced_by?: string | null;
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
const REPO_ROOT = join(__dirname, "..", "..", "..");
const LOCK_PATH = join(__dirname, "..", "signals", "versions", "current.json");
const SCAN_PATHS = [
  join(REPO_ROOT, "web", "vm"),
  join(REPO_ROOT, "web", "reveal.ts"),
  // Sprint 058: reveal_component.ts hosts the dc-runtime class body
  // that used to sit inline in reveal.html. The class does not emit
  // signals today, but the parity gate must scan it so a future emit
  // added inside the shell trips a drift check.
  join(REPO_ROOT, "web", "reveal_component.ts"),
];
const SCAN_EXTS = new Set([".ts", ".tsx"]);
const SELF = "web/vm/tools/check-vocabulary-parity.ts";
const SKIP_DIRS = new Set(["node_modules", "dist", "_deprecated", "signals", "tools"]);

const EMIT_RE = /\bemit\s*\(\s*["']([A-Z][A-Z0-9_]*)["']/g;

function fail(code: number, msg: string): never {
  console.error(`[vm-vocab-parity] ${msg}`);
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
    for (const e of errs) console.error(`[vm-vocab-parity]   ${e}`);
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
  const files: string[] = [];
  for (const p of SCAN_PATHS) {
    let s;
    try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) walk(p, files);
    else if (SCAN_EXTS.has(p.slice(p.lastIndexOf(".")))) files.push(p);
  }
  for (const file of files) {
    const rel = relative(REPO_ROOT, file);
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
  return found;
}

function main(): void {
  const lock = loadLock();
  validateLockStructure(lock);

  const declared = new Set(lock.tags.map((t) => t.name));
  const retired = new Set(lock.tags.filter((t) => t.retired === true).map((t) => t.name));
  const emitted = findEmittedTags();

  const drift: { tag: string; sites: string[] }[] = [];
  const retiredEmits: { tag: string; sites: string[]; replaced_by: string | null | undefined }[] = [];
  for (const [tag, sites] of emitted) {
    if (!declared.has(tag)) drift.push({ tag, sites });
    else if (retired.has(tag)) {
      const t = lock.tags.find((x) => x.name === tag);
      retiredEmits.push({ tag, sites, replaced_by: t?.replaced_by ?? null });
    }
  }

  if (drift.length) {
    console.error(`[vm-vocab-parity] DRIFT: ${drift.length} tag(s) emitted in code but not in lock ${lock.vocabulary_version}:`);
    for (const d of drift) {
      console.error(`  ${d.tag}`);
      for (const s of d.sites) console.error(`    at ${s}`);
    }
    console.error(`[vm-vocab-parity] Add to web/vm/signals/versions/current.json (via proposal + version bump) or remove the emit.`);
    process.exit(1);
  }

  if (retiredEmits.length) {
    console.error(`[vm-vocab-parity] DRIFT: ${retiredEmits.length} tag(s) emitted but marked retired in lock ${lock.vocabulary_version}:`);
    for (const r of retiredEmits) {
      const replacement = r.replaced_by ? `; replaced_by: ${r.replaced_by}` : "";
      console.error(`  ${r.tag} (retired${replacement})`);
      for (const s of r.sites) console.error(`    at ${s}`);
    }
    process.exit(1);
  }

  const liveCount = lock.tags.length - retired.size;
  console.log(
    `[vm-vocab-parity] OK — vocabulary ${lock.vocabulary_version} (${lock.tags.length} tags: ${liveCount} live + ${retired.size} retired, locked=${lock.locked}); ` +
      `code emits ${emitted.size} distinct live tag(s), all locked.`
  );
}

main();
