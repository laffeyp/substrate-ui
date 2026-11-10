// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The workspace search's text work (sprint 434; roadmap 2026-11-09-code-editor r10, E8; frame 24j): the
// query as a JavaScript pattern, the matches in a result line, and a file's text with every match
// replaced. The server finds the lines (git grep, server.py `_workspace_search`); this lights and counts
// the matches in them and makes the replace-all text. No I/O, no state.
//
// A regular-expression query is read by git as POSIX extended syntax and here as JavaScript's; the two
// agree on the common forms (classes, groups, alternation, anchors, quantifiers). A query JavaScript
// cannot compile lights nothing and counts one match per line git returned.

export interface SearchSpec { query: string; caseSensitive: boolean; regexp: boolean }
export interface SearchLine { line: number; text: string }
export interface SearchFile { path: string; lines: SearchLine[] }
export interface SearchResult { files: SearchFile[]; lines: number; truncated: boolean }

const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The query as a global pattern, or null when it is empty or does not compile. */
export function matcher(spec: SearchSpec): RegExp | null {
  if (!spec.query) return null;
  try {
    return new RegExp(spec.regexp ? spec.query : escape(spec.query), spec.caseSensitive ? "g" : "gi");
  } catch {
    return null;
  }
}

/** The [from, to) ranges of the matches in one line; an empty match is skipped. */
export function matchRanges(text: string, re: RegExp | null): [number, number][] {
  if (!re) return [];
  const out: [number, number][] = [];
  for (const m of text.matchAll(re)) if (m[0].length) out.push([m.index, m.index + m[0].length]);
  return out;
}

/** The matches in a result: every line git returned counts at least one. */
export function countMatches(result: SearchResult, spec: SearchSpec): number {
  const re = matcher(spec);
  let n = 0;
  for (const f of result.files) for (const l of f.lines) n += Math.max(1, matchRanges(l.text, re).length);
  return n;
}

/** A file's text with every match replaced. A fixed-string query's replacement is taken as written; a
 *  regular expression's may name its groups ($1, $&), as JavaScript's String.replace reads them. */
export function replaceAll(text: string, spec: SearchSpec, replacement: string): string {
  const re = matcher(spec);
  if (!re) return text;
  return spec.regexp ? text.replace(re, replacement) : text.replace(re, () => replacement);
}
