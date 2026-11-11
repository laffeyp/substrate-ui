// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The workspace search's rows (sprints 434, 435; roadmap 2026-11-09-code-editor r10, E8; research
// RESEARCH-2026-11-10-editor-search-r2). The server finds the matches with its own walk and Python's re and
// sends each match's [start, end) in UTF-16 units (server.py `_workspace_search`); the page matches nothing
// itself, so it lights exactly what the server found. One row per match, as VS Code lists them. No I/O.

export interface SearchSpec { query: string; caseSensitive: boolean; regexp: boolean; word: boolean; include: string; exclude: string }
export interface SearchLine { line: number; text: string; ranges: [number, number][] }
export interface SearchFile { path: string; lines: SearchLine[] }
/** Sprint 442: a file or folder whose name or path matched, the matches' ranges in the path. */
export interface SearchName { path: string; kind: "file" | "dir"; ranges: [number, number][] }
export interface SearchResult { names: SearchName[]; files: SearchFile[]; lines: number; matches: number; truncated: boolean }

/** A name row's two parts as drawn, the name and its folder, each with the lit ranges inside it. */
export function nameParts(n: SearchName): { name: string; dir: string; nameLit: [number, number][]; dirLit: [number, number][] } {
  const at = n.path.lastIndexOf("/") + 1;
  const clip = (from: number, to: number) => n.ranges.filter(([a, b]) => b > from && a < to).map(([a, b]) => [Math.max(a, from) - from, Math.min(b, to) - from] as [number, number]);
  return { name: n.path.slice(at), dir: at ? n.path.slice(0, at) : "", nameLit: clip(at, n.path.length), dirLit: clip(0, at) };
}
/** One match: its file, line, its index among the line's matches, and the line's text with it. */
export interface SearchRow { path: string; line: number; index: number; text: string; from: number; to: number }

/** Where a row's text begins on screen: the indent dropped, and a long run before the match cut to the
 *  `LEAD` characters before it behind an ellipsis, so the match is in view in a narrow column. */
const LEAD = 20;
function clip(text: string, from: number, to: number): { text: string; from: number; to: number } {
  const indent = text.length - text.trimStart().length;
  let cut = Math.min(indent, from);
  let lead = "";
  if (from - cut > LEAD + 10) { cut = from - LEAD; lead = "…"; }
  return { text: lead + text.slice(cut), from: from - cut + lead.length, to: to - cut + lead.length };
}

/** The result as rows, one per match, in file and line order. */
export function searchRows(result: SearchResult): SearchRow[] {
  const out: SearchRow[] = [];
  for (const f of result.files) for (const l of f.lines) l.ranges.forEach(([a, b], index) => out.push({ path: f.path, line: l.line, index, ...clip(l.text, a, b) }));
  return out;
}
