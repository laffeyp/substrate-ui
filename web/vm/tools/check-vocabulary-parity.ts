#!/usr/bin/env npx tsx
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/**
 * web/vm/tools/check-vocabulary-parity.ts
 *
 * The vocabulary linter for the whole app. The code names tags through the generated `Signal`
 * (web/vm/signals.gen.ts, electron/signals.gen.ts, signals_gen.py; sprint 363). Walks the window's
 * code, Electron main (electron/) and the server (server.py). Checks:
 *   - no emit call passes a tag as a raw string;
 *   - every declared live tag is named somewhere as Signal.<TAG>, or is listed in
 *     web/vm/signals/unemitted.json (the tags whose emit sites a later plan item writes); a listed tag
 *     that is named fails too, so the list only shrinks;
 *   - every declared field has a field_types entry the generator reads, and no field carries a name
 *     evidence rule E1 bans.
 * Fails with a typed report.
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
  // Sprint 200 (F359): the React trees. web/reveal/ holds the transcript's .tsx; web/app/ holds the
  // window's components. (web/reveal_component.ts, scanned from sprint 058, retired with dc-runtime.)
  join(REPO_ROOT, "web", "reveal"),
  join(REPO_ROOT, "web", "app"),
  // Sprint 355: Electron main and the server.
  join(REPO_ROOT, "electron"),
  join(REPO_ROOT, "server.py"),
];
const SCAN_EXTS = new Set([".ts", ".tsx", ".js", ".py"]);
const UNEMITTED_PATH = join(__dirname, "..", "signals", "unemitted.json");
/** E1: field names that would carry content. */
const TYPE_RE = /^(int|float|string|bool|object|list\b.*|enum [a-z0-9_]+( \| [a-z0-9_]+)*)( or null)?$/;
const BANNED_FIELDS = new Set(["text", "content", "prompt", "output", "token", "password", "key_value"]);
const SELF = "web/vm/tools/check-vocabulary-parity.ts";
// __tests__: tests plant broken emits on purpose (sprint 355).
const SKIP_DIRS = new Set(["node_modules", "dist", "_deprecated", "signals", "tools", "__tests__"]);

const NAMED_RE = /\bSignal\.([A-Z][A-Z0-9_]*)\b/g;
const RAW_RE = /\b(?:emit|emitSignal|sddEmit|traceEmit|mainRecord)\s*\(\s*["']([A-Z][A-Z0-9_]*)["']/g;
const GENERATED = new Set(["web/vm/signals.gen.ts", "electron/signals.gen.ts", "signals_gen.py"]);
const raw: string[] = [];

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
    if (GENERATED.has(rel)) continue;
    let m;
    NAMED_RE.lastIndex = 0;
    while ((m = NAMED_RE.exec(body)) !== null) {
      const tag = m[1];
      if (!found.has(tag)) found.set(tag, []);
      if (!found.get(tag)!.includes(rel)) found.get(tag)!.push(rel);
    }
    RAW_RE.lastIndex = 0;
    while ((m = RAW_RE.exec(body)) !== null) raw.push(`${rel}:${body.slice(0, m.index).split("\n").length}: ${m[0]}`);
    }
  return found;
}

function main(): void {
  const lock = loadLock();
  validateLockStructure(lock);

  const declared = new Set(lock.tags.map((t) => t.name));
  const retired = new Set(lock.tags.filter((t) => t.retired === true).map((t) => t.name));
  const emitted = findEmittedTags();

  const errs: string[] = [];
  for (const r of raw) errs.push(`raw tag string at an emit call (name it Signal.<TAG>): ${r}`);
  for (const t of lock.tags as (Tag & { field_types?: Record<string, string> })[]) {
    const types = t.field_types ?? {};
    for (const f of [...t.payload, ...t.optional_payload]) {
      if (BANNED_FIELDS.has(f)) errs.push(`${t.name}.${f}: a field name E1 bans`);
      if (!(f in types)) errs.push(`${t.name}.${f}: no field_types entry`);
      else if (!TYPE_RE.test(types[f].replace(/\s*\([^)]*\)/g, "").trim())) errs.push(`${t.name}.${f}: type "${types[f]}" is not one the generator reads`);
    }
  }
  let unemittedList: string[] = [];
  try { unemittedList = (JSON.parse(readFileSync(UNEMITTED_PATH, "utf8")) as { tags: string[] }).tags; }
  catch (e) { fail(2, `cannot read ${UNEMITTED_PATH}: ${(e as Error).message}`); }
  const listed = new Set(unemittedList);
  for (const t of listed) {
    if (!declared.has(t)) errs.push(`${t}: in unemitted.json but not declared`);
    if (emitted.has(t)) errs.push(`${t}: emitted at ${emitted.get(t)!.join(", ")} but still in unemitted.json; take it off the list`);
  }
  for (const t of declared) {
    if (!retired.has(t) && !emitted.has(t) && !listed.has(t)) errs.push(`${t}: declared, never emitted, and not in unemitted.json`);
  }
  if (errs.length) {
    console.error(`[vm-vocab-parity] DRIFT against vocabulary ${lock.vocabulary_version}: ${errs.length} problem(s):`);
    for (const e of errs) console.error(`  ${e}`);
    process.exit(1);
  }

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
      `code emits ${emitted.size} distinct live tag(s) across window, main and server, all locked; ${listed.size} declared tag(s) await emit sites (unemitted.json).`
  );
}

main();
