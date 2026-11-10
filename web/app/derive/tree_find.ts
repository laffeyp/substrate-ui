// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The tree's find by name (sprint 437; research RESEARCH-2026-11-10-editor-search-r2; VS Code's
// ExplorerFindProvider, explorerViewer.ts). The server finds the files and folders whose name matches over the
// whole workspace (GET …/files/find); this lights the matched letters, builds the filtered tree (each match
// and every folder above it, unopened ones included), and counts a collapsed folder's matches for its badge.
// Case is ignored; fuzzy reads `abc` as a, then b, then c, anywhere in the name. No I/O.

/** The indexes of a name's matched letters, or null when it does not match. */
export function nameHits(name: string, query: string, fuzzy: boolean): number[] | null {
  const n = name.toLowerCase(), q = query.toLowerCase();
  if (!q) return null;
  if (!fuzzy) {
    const at = n.indexOf(q);
    return at < 0 ? null : Array.from({ length: q.length }, (_, k) => at + k);
  }
  const out: number[] = [];
  let from = 0;
  for (const c of q) {
    const at = n.indexOf(c, from);
    if (at < 0) return null;
    out.push(at);
    from = at + 1;
  }
  return out;
}

export interface FindRow { rel: string; name: string; kind: "dir" | "file"; depth: number; open: boolean }

/** The filtered tree: the matched files and folders and every folder above them, in the tree's order
 *  (folders first, then by name without case, as the server sorts a folder). A folder above a match is open;
 *  a matched folder with no match below it is shown closed. */
export function filterRows(files: readonly string[], folders: readonly string[]): FindRow[] {
  const dirs = new Set<string>(folders), kids = new Map<string, Set<string>>();
  const add = (rel: string) => {
    const parts = rel.split("/");
    for (let n = 1; n <= parts.length; n++) {
      const parent = parts.slice(0, n - 1).join("/"), here = parts.slice(0, n).join("/");
      if (n < parts.length) dirs.add(here);
      if (!kids.has(parent)) kids.set(parent, new Set());
      kids.get(parent)!.add(here);
    }
  };
  for (const f of files) add(f);
  for (const d of folders) add(d);
  const out: FindRow[] = [];
  const name = (rel: string) => rel.slice(rel.lastIndexOf("/") + 1);
  const walk = (parent: string, depth: number) => {
    const list = Array.from(kids.get(parent) ?? []).sort((a, b) => Number(!dirs.has(a)) - Number(!dirs.has(b)) || name(a).toLowerCase().localeCompare(name(b).toLowerCase()) || name(a).localeCompare(name(b)));
    for (const rel of list) {
      const isDir = dirs.has(rel), open = isDir && kids.has(rel);
      out.push({ rel, name: name(rel), kind: isDir ? "dir" : "file", depth, open });
      if (open) walk(rel, depth + 1);
    }
  };
  walk("", 0);
  return out;
}

/** The matches below a folder, for the badge a collapsed folder carries in highlight mode. */
export function matchesBelow(folder: string, matches: readonly string[]): number {
  const prefix = folder + "/";
  return matches.filter((m) => m.startsWith(prefix)).length;
}
