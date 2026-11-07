#!/usr/bin/env npx tsx
// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/**
 * web/vm/tools/check-vocabulary-parity.ts
 *
 * The vocabulary linter for the whole app (sprint 355, plan 2026-11-05-sdd-signals item 3). Walks the
 * window's code (web/vm/, web/reveal.ts, web/reveal_component.ts, web/reveal/, web/app/), Electron
 * main (electron/*.js) and the server (server.py) for emit sites: emit, emitSignal, sddEmit (window),
 * traceEmit, mainRecord (main), TRACE.emit (server), each with its tag as a string literal. Checks:
 *   - every emitted tag is declared and live in web/vm/signals/versions/current.json;
 *   - every declared tag is emitted somewhere, or is listed in web/vm/signals/unemitted.json (the tags
 *     whose emit sites a later plan item writes); a listed tag that is emitted fails too, so the list
 *     only shrinks;
 *   - no emit passes its tag as a variable, except the two pass-throughs named in PASS_THROUGH;
 *   - every declared field has a field_types entry the checkers parse, and no field carries a name
 *     evidence rule E1 bans;
 *   - PLANTED_* tags (test seams) appear only at the seams named in PLANTED_SITES.
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
  // Sprint 058: reveal_component.ts hosts the dc-runtime class body
  // that used to sit inline in reveal.html. The class does not emit
  // signals today, but the parity gate must scan it so a future emit
  // added inside the shell trips a drift check.
  join(REPO_ROOT, "web", "reveal_component.ts"),
  // Sprint 200 (F359): the React trees. web/reveal/ holds the transcript's
  // .tsx; web/app/ is where the shell's components land as they leave
  // dc-runtime (plan PLAN-2026-11-04-shell-to-react-r4.md).
  join(REPO_ROOT, "web", "reveal"),
  join(REPO_ROOT, "web", "app"),
  // Sprint 355: Electron main and the server.
  join(REPO_ROOT, "electron"),
  join(REPO_ROOT, "server.py"),
];
const SCAN_EXTS = new Set([".ts", ".tsx", ".js", ".py"]);
const UNEMITTED_PATH = join(__dirname, "..", "signals", "unemitted.json");
/** Emits whose tag is a parameter they pass on: the pane controller's wrapper and main's traceEmit. */
const PASS_THROUGH = new Set(["web/vm/session_controller.ts:sddEmit(tag", "electron/main.js:mainRecord(tag"]);
/** The test seams that emit a planted undeclared tag (harness/shakeout/trace_files.ts, TRACE_PLANT=reject). */
const PLANTED_SITES = new Set(["electron/main.js", "server.py"]);
/** E1: field names that would carry content. */
const TYPE_RE = /^(int|float|string|bool|object|list\b.*|enum [a-z0-9_]+( \| [a-z0-9_]+)*)( or null)?$/;
const BANNED_FIELDS = new Set(["text", "content", "prompt", "output", "token", "password", "key_value"]);
const SELF = "web/vm/tools/check-vocabulary-parity.ts";
// __tests__: tests plant broken emits on purpose (sprint 355).
const SKIP_DIRS = new Set(["node_modules", "dist", "_deprecated", "signals", "tools", "__tests__"]);

const EMIT_RE = /\b(?:emit|emitSignal|sddEmit|traceEmit|mainRecord)\s*\(\s*["']([A-Z][A-Z0-9_]*)["']/g;
const DYNAMIC_RE = /(?<![\w.])(?:(?:this|TRACE|self)\.)?(emit|emitSignal|sddEmit|traceEmit|mainRecord)\s*\(\s*([a-z_][A-Za-z0-9_]*)\s*[,)]/g;
const dynamic: string[] = [];

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
    DYNAMIC_RE.lastIndex = 0;
    while ((m = DYNAMIC_RE.exec(body)) !== null) {
      const lineStart = body.lastIndexOf("\n", m.index) + 1;
      const line = body.slice(lineStart, body.indexOf("\n", m.index));
      if (/^\s*(function|def|async function|export function)\b/.test(line)) continue;
      const key = `${rel}:${m[1]}(${m[2]}`;
      if (!PASS_THROUGH.has(key)) dynamic.push(`${rel}:${body.slice(0, m.index).split("\n").length}: ${line.trim()}`);
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

  const errs: string[] = [];
  for (const d of dynamic) errs.push(`emit with a variable tag (not a known pass-through): ${d}`);
  for (const t of lock.tags as (Tag & { field_types?: Record<string, string> })[]) {
    const types = t.field_types ?? {};
    for (const f of [...t.payload, ...t.optional_payload]) {
      if (BANNED_FIELDS.has(f)) errs.push(`${t.name}.${f}: a field name E1 bans`);
      if (!(f in types)) errs.push(`${t.name}.${f}: no field_types entry`);
      else if (!TYPE_RE.test(types[f].replace(/\s*\([^)]*\)/g, "").trim())) errs.push(`${t.name}.${f}: type "${types[f]}" is not one the checkers read`);
    }
  }
  for (const [tag, sites] of emitted) {
    if (!tag.startsWith("PLANTED_")) continue;
    for (const s of sites) if (!PLANTED_SITES.has(s)) errs.push(`${tag}: planted tag outside a test seam, at ${s}`);
    emitted.delete(tag);
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
