// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Quick open's matching (sprint 441; roadmap r10 E9; frame 24i). Every letter of the query in order, case
// ignored. A match inside the file's name ranks above one that needs its folders; within each, letters
// together (the query as one run) above letters apart, an earlier start above a later one, a shorter path above
// a longer one, then the path's own order. Each match carries the indexes of its lit letters in the path.
// No I/O.

export interface QuickMatch { path: string; lit: number[] }
export const QUICK_MAX = 50;

/** The indexes in `text` (from `from`) of the query's letters in order, taking the first run of them all
 *  together when there is one; null when the letters are not all there. */
function letters(text: string, query: string, from: number): { lit: number[]; run: boolean } | null {
  const t = text.toLowerCase(), q = query.toLowerCase();
  const at = t.indexOf(q, from);
  if (at >= 0) return { lit: Array.from({ length: q.length }, (_, k) => at + k), run: true };
  const lit: number[] = [];
  let i = from;
  for (const c of q) {
    const k = t.indexOf(c, i);
    if (k < 0) return null;
    lit.push(k);
    i = k + 1;
  }
  return { lit, run: false };
}

export function quickMatches(paths: readonly string[], query: string): QuickMatch[] {
  if (!query) return [];
  const ranked: { path: string; lit: number[]; key: [number, number, number, number] }[] = [];
  for (const path of paths) {
    const nameAt = path.lastIndexOf("/") + 1;
    const inName = letters(path, query, nameAt);
    const m = inName ?? letters(path, query, 0);
    if (!m) continue;
    ranked.push({ path, lit: m.lit, key: [inName ? 0 : 1, m.run ? 0 : 1, m.lit[0] - (inName ? nameAt : 0), path.length] });
  }
  ranked.sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1] || a.key[2] - b.key[2] || a.key[3] - b.key[3] || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return ranked.slice(0, QUICK_MAX).map(({ path, lit }) => ({ path, lit }));
}
