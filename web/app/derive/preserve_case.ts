// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Preserve case for a replace (sprint 438; research RESEARCH-2026-11-10-editor-search-r2): the replacement takes
// the case of the text it replaces, by the rule VS Code applies (src/vs/base/common/search.ts,
// buildReplaceStringWithCasePreserved): a match in capitals gives the replacement in capitals, one in lower case
// gives lower case, a capital first letter gives a capital first letter, a lower first letter a lower one; a
// match and a replacement with the same number of `-` (or `_`) parts are cased part by part. No I/O.

const hasUpper = (c: string): boolean => c !== c.toLowerCase();

function partsAlike(match: string, replacement: string, sep: string): boolean {
  return match.includes(sep) && replacement.includes(sep) && match.split(sep).length === replacement.split(sep).length;
}

export function preserveCase(match: string, replacement: string): string {
  if (!match) return replacement;
  const hyphens = partsAlike(match, replacement, "-"), unders = partsAlike(match, replacement, "_");
  if (hyphens !== unders) {
    const sep = hyphens ? "-" : "_", m = match.split(sep);
    return replacement.split(sep).map((part, k) => preserveCase(m[k], part)).join(sep);
  }
  if (match.toUpperCase() === match) return replacement.toUpperCase();
  if (match.toLowerCase() === match) return replacement.toLowerCase();
  if (hasUpper(match[0]) && replacement) return replacement[0].toUpperCase() + replacement.slice(1);
  if (match[0].toUpperCase() !== match[0] && replacement) return replacement[0].toLowerCase() + replacement.slice(1);
  return replacement;
}
