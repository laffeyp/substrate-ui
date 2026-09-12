// src/lib/findMatches.ts — Sprint 028 + 029.
//
// Match set for the find bar. Rows scan is case-insensitive substring
// over the row's `summary` field (the only column rendered in the
// plain-transcript body — the pretty-printed inspector JSON is a
// separate surface).
//
// The empty query returns zero matches. Rows without a summary field
// are skipped. Sprint 029's silent step walk indexes into this set.

import type { TranscriptRow } from "@/state/ShellState";

export interface FindMatch {
  seq: number;
  index: number;
}

export function computeMatches(rows: readonly TranscriptRow[], q: string): FindMatch[] {
  if (q.length === 0) return [];
  const needle = q.toLowerCase();
  const out: FindMatch[] = [];
  for (const row of rows) {
    const s = row.summary;
    if (typeof s !== "string" || s.length === 0) continue;
    if (s.toLowerCase().includes(needle)) {
      out.push({ seq: row.seq, index: out.length });
    }
  }
  return out;
}
