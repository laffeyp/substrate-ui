// src/lib/depthAccent.ts — hue per delegate depth (D70).
//
// Sprint 020: the delegate line renders a colored left border whose hue
// encodes call depth in the delegate chain. Layer 6 caps depth at 2
// (delegate.py:353 max_depth=2). One hue per depth; the shell reads
// these constants, never a literal color.
//
// D70 accent table:
//   depth 1 → teal
//   depth 2 → amber
// Depths outside {1, 2} fall back to a muted grey — a visible tell that
// the record carries an out-of-range depth, not a silent miscolor.

export const DEPTH_ACCENT_MIN = 1 as const;
export const DEPTH_ACCENT_MAX = 2 as const;

export const DEPTH_ACCENTS: Record<1 | 2, string> = {
  1: "#4ea89b", // teal
  2: "#c89a6b", // amber
};

const DEPTH_FALLBACK = "#5f636b";

export function depthAccent(depth: number): string {
  if (depth === 1) return DEPTH_ACCENTS[1];
  if (depth === 2) return DEPTH_ACCENTS[2];
  return DEPTH_FALLBACK;
}

export function isValidDepth(depth: number): depth is 1 | 2 {
  return depth === 1 || depth === 2;
}
