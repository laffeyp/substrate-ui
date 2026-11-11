// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's files tree (sprint 410; roadmap 2026-11-09-code-editor r6, R4). It reads the session's
// workspace from the server's file API (GET /api/session/<id>/files?dir=<rel>, server.py
// _session_files, which writes FILES_LISTED), one folder at a time: the top folder on mount, a folder
// when it is first opened. Rows follow sheet frame 24a: 16 px, 12 px mono, ink from 12 + 14 × depth
// px, folders `▸ name/` or `▾ name/`. The server sorts each folder (folders first, then by name without
// case); the tree keeps its order. The number of rows drawn goes to state/editor.ts for EDITOR_DRAWN.
//
// Sprint 413 (R5): a file changed against main (GET /api/session/<id>/diff, server.py _session_diff,
// which writes DIFF_READ) carries one accent dot after its name, as 24a draws it; folders carry none.
// The server's watch stream (GET /api/session/<id>/files/watch) says when files change; the tree then
// reads the diff and every folder it has read again, so new files and dots appear as the work lands
// (D93). The number of dots drawn goes to state/editor.ts too.
//
// Sprint 437 (research RESEARCH-2026-11-10-editor-search-r2; VS Code's Explorer find, explorerViewer.ts): ⌥⌘F
// with the tree focused opens a find by name above the rows. The server finds the files and folders whose name
// matches over the whole workspace (GET …/files/find, FILES_FOUND), so folders never opened are reached. Filter
// (the default) shows only the matches and every folder above them; highlight keeps the tree, lights the
// matched letters, and badges each collapsed folder with the matches below it. Fuzzy or continuous; case
// ignored. ↓ and ↑ step through the matches (highlight opens the folders on the way), ↵ opens a file or reveals
// a folder, Escape closes the find. Each result drawn is one EDITOR_TREE_FOUND.

import * as React from "react";
import { editor } from "../state/editor";
import { openFile } from "./Centre";
import { filterRows, matchesBelow, nameHits } from "../derive/tree_find";
import { emit as emitSignal } from "../../vm/instrumentation/sdd";
import { EditorTreeFoundMode, Signal } from "../../vm/signals.gen";

interface Entry { name: string; kind: "dir" | "file" | "link"; size: number; modified: number }
type Listing = { entries: Entry[] } | { error: string };

export const TREE_ROW = 16;
export const TREE_INDENT = 14;
export const TREE_LEFT = 12;

interface Row { rel: string; name: string; kind: Entry["kind"] | "error"; depth: number; open: boolean }
interface Found { files: string[]; folders: string[]; truncated: boolean }
const FIND_SETTLE_MS = 150;
const parents = (rel: string) => rel.split("/").slice(0, -1).map((_, n, a) => a.slice(0, n + 1).join("/"));

export function FileTree({ sessionId, paneId }: { sessionId: string; paneId: number }): React.ReactElement {
  const [listings, setListings] = React.useState<Record<string, Listing>>({});
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const [changed, setChanged] = React.useState<Set<string>>(new Set());
  const asked = React.useRef(new Set<string>());
  const [find, setFind] = React.useState<{ on: boolean; query: string; fuzzy: boolean; filter: boolean }>({ on: false, query: "", fuzzy: true, filter: true });
  const [found, setFound] = React.useState<Found | null>(null);
  const [at, setAt] = React.useState(-1);
  const findBox = React.useRef<HTMLInputElement>(null);
  const treeRoot = React.useRef<HTMLDivElement>(null);
  const findFocus = React.useSyncExternalStore(editor.subscribe, () => editor.getSnapshot().treeFindFocus, () => editor.getSnapshot().treeFindFocus);

  const read = React.useCallback((rel: string, again = false) => {
    if (asked.current.has(rel) && !again) return;
    asked.current.add(rel);
    fetch(`/api/session/${encodeURIComponent(sessionId)}/files?dir=${encodeURIComponent(rel)}`)
      .then(async (r) => (r.ok ? ((await r.json()) as { entries: Entry[] }) : { error: `${r.status} ${(await r.json().catch(() => ({ error: "" })) as { error?: string }).error ?? ""}`.trim() }))
      .catch((err: unknown) => ({ error: String(err) }))
      .then((listing) => setListings((was) => ({ ...was, [rel]: listing })));
  }, [sessionId]);

  const readDiff = React.useCallback(() => {
    fetch(`/api/session/${encodeURIComponent(sessionId)}/diff`)
      .then((r) => (r.ok ? (r.json() as Promise<{ files: { path: string; status: string }[] }>) : { files: [] }))
      .catch(() => ({ files: [] }))
      .then((d) => setChanged(new Set(d.files.filter((f) => f.status !== "D").map((f) => f.path))));
  }, [sessionId]);

  React.useEffect(() => { read(""); readDiff(); }, [read, readDiff]);

  // The watch stream: a change on disk re-reads the diff and every folder already read.
  React.useEffect(() => {
    const es = new EventSource(`/api/session/${encodeURIComponent(sessionId)}/files/watch`);
    es.onmessage = () => {
      for (const rel of Array.from(asked.current)) read(rel, true);
      readDiff();
    };
    return () => es.close();
  }, [sessionId, read, readDiff]);

  // The find: ⌥⌘F opens it; a name settles, the server finds it, and the result is drawn.
  React.useEffect(() => {
    if (!findFocus) return;
    setFind((f) => ({ ...f, on: true }));
  }, [findFocus]);
  // The box is drawn by the render the line above asks for; it takes the focus once it is there.
  React.useEffect(() => {
    if (find.on && findFocus) { findBox.current?.focus(); findBox.current?.select(); }
  }, [find.on, findFocus]);
  React.useEffect(() => {
    if (!find.on || !find.query) { setFound(null); setAt(-1); return; }
    let live = true;
    const t = window.setTimeout(() => {
      fetch(`/api/session/${encodeURIComponent(sessionId)}/files/find?q=${encodeURIComponent(find.query)}&fuzzy=${find.fuzzy ? "1" : "0"}`)
        .then((r) => (r.ok ? (r.json() as Promise<Found>) : null)).catch(() => null)
        .then((out) => { if (live && out) { setFound(out); setAt(-1); } });
    }, FIND_SETTLE_MS);
    return () => { live = false; window.clearTimeout(t); };
  }, [find.on, find.query, find.fuzzy, sessionId]);
  React.useEffect(() => {
    if (find.on && found) emitSignal(Signal.EDITOR_TREE_FOUND, { mode: find.filter ? EditorTreeFoundMode.FILTER : EditorTreeFoundMode.HIGHLIGHT, fuzzy: find.fuzzy, files: found.files.length, folders: found.folders.length }, { pane_id: paneId });
  }, [found, find.filter]);
  const matches = React.useMemo(() => (found ? [...found.folders, ...found.files].sort() : []), [found]);
  const filtering = find.on && !!found && find.filter;

  const rows: Row[] = [];
  const walk = (rel: string, depth: number) => {
    const listing = listings[rel];
    if (!listing) return;
    if ("error" in listing) { rows.push({ rel, name: "cannot list: " + listing.error, kind: "error", depth, open: false }); return; }
    for (const e of listing.entries) {
      // `.git` is git's bookkeeping, not the work: the watch stream leaves it out too (server.py _workspace_snapshot).
      if (e.name === ".git") continue;
      const child = rel ? rel + "/" + e.name : e.name;
      const isOpen = e.kind === "dir" && !!open[child];
      rows.push({ rel: child, name: e.name, kind: e.kind, depth, open: isOpen });
      if (isOpen) walk(child, depth + 1);
    }
  };
  if (filtering) rows.push(...filterRows(found!.files, found!.folders));
  else walk("", 0);
  // The matches in the order the rows draw them, for ↓ and ↑.
  const order = filtering ? rows.filter((r) => matches.includes(r.rel)).map((r) => r.rel) : matches;
  const drawn = rows.filter((r) => r.kind !== "error").length;
  const dots = rows.filter((r) => r.kind !== "dir" && r.kind !== "error" && changed.has(r.rel)).length;

  React.useEffect(() => { editor.set({ treeRows: drawn, modifiedDots: dots }); }, [drawn, dots]);
  React.useEffect(() => () => editor.set({ treeRows: 0, modifiedDots: 0 }), []);

  const toggle = (rel: string) => {
    const now = !open[rel];
    setOpen((was) => ({ ...was, [rel]: now }));
    if (now) read(rel);
  };
  /** The tree opened down to `rel` (and `rel` itself when it is a folder), each folder read. */
  const reveal = (rel: string, isDir: boolean) => {
    const dirs = [...parents(rel), ...(isDir ? [rel] : [])];
    setOpen((was) => ({ ...was, ...Object.fromEntries(dirs.map((d) => [d, true])) }));
    for (const d of dirs) read(d);
  };
  // Sprint 442: a folder chosen in the search bar opens the tree to it.
  const revealAsk = React.useSyncExternalStore(editor.subscribe, () => editor.getSnapshot().reveal, () => editor.getSnapshot().reveal);
  React.useEffect(() => {
    if (!revealAsk) return;
    reveal(revealAsk.path, true);
    requestAnimationFrame(() => treeRoot.current?.querySelector(`[data-tree-row="${CSS.escape(revealAsk.path)}"]`)?.scrollIntoView({ block: "nearest" }));
  }, [revealAsk?.n]);
  const closeFind = () => { setFind((f) => ({ ...f, on: false })); setFound(null); setAt(-1); treeRoot.current?.focus(); };
  const choose = (rel: string) => {
    const isDir = !!found?.folders.includes(rel);
    if (isDir) { reveal(rel, true); closeFind(); return; }
    if (filtering) reveal(rel, false);
    openFile(rel, paneId);
  };
  const step = (by: number) => {
    if (!order.length) return;
    const next = ((at < 0 ? (by > 0 ? -1 : 0) : at) + by + order.length) % order.length;
    setAt(next);
    if (!filtering) reveal(order[next], false);
    requestAnimationFrame(() => treeRoot.current?.querySelector(`[data-tree-row="${CSS.escape(order[next])}"]`)?.scrollIntoView({ block: "nearest" }));
  };
  const findKeys = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeFind(); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); step(e.key === "ArrowDown" ? 1 : -1); }
    else if (e.key === "Enter" && at >= 0 && order[at]) { e.preventDefault(); choose(order[at]); }
  };
  const lit = (name: string): React.ReactNode => {
    const hits = find.on && find.query ? nameHits(name, find.query, find.fuzzy) : null;
    if (!hits) return name;
    return Array.from(name).map((c, k) => (hits.includes(k) ? <span key={k} style={{ color: "#e2e5e9", background: "rgba(130,165,200,.25)" }}>{c}</span> : c));
  };
  const toggleStyle = (on: boolean): React.CSSProperties => ({ cursor: "pointer", color: on ? "#e2e5e9" : "#62676f", userSelect: "none", fontSize: 10, flex: "none" });

  // Sprint 431 (E7): a file with a session edit in flight is marked in the accent until its result.
  const following = new Set(React.useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot).follow.map((f) => f.path));
  return (
    <div ref={treeRoot} tabIndex={0} data-editor-tree-rows={String(drawn)} data-tree-find={find.on ? (find.filter ? "filter" : "highlight") : undefined} style={{ paddingTop: 6, outline: "none" }}>
      {find.on && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 8px 4px", padding: "3px 7px", borderRadius: 4, background: "#212327", fontSize: 11 }}>
          <input ref={findBox} data-tree-find-input="1" value={find.query} placeholder="find in the tree" spellCheck={false} onChange={(e) => setFind((f) => ({ ...f, query: e.target.value }))} onKeyDown={findKeys}
            style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#e2e5e9", font: "inherit", fontSize: 11, padding: 0 }} />
          <span data-tree-find-toggle="fuzzy" data-on={find.fuzzy ? "1" : "0"} title="fuzzy match" onClick={() => setFind((f) => ({ ...f, fuzzy: !f.fuzzy }))} style={toggleStyle(find.fuzzy)}>fuzzy</span>
          <span data-tree-find-toggle="filter" data-on={find.filter ? "1" : "0"} title="filter the tree to the matches (else highlight them)" onClick={() => setFind((f) => ({ ...f, filter: !f.filter }))} style={toggleStyle(find.filter)}>filter</span>
          <span data-tree-find-close="1" title="close (Escape)" onClick={closeFind} style={toggleStyle(false)}>×</span>
        </div>
      )}
      {find.on && found && !found.files.length && !found.folders.length && <div data-tree-find-none="1" style={{ padding: "0 12px 4px", fontSize: 10, color: "#62676f" }}>no matches</div>}
      {find.on && found?.truncated && <div data-tree-find-cut="1" style={{ padding: "0 12px 4px", fontSize: 10, color: "#62676f" }}>the first {found.files.length} files only</div>}
      {rows.map((r) => (
        <div
          key={r.rel + (r.kind === "error" ? "#error" : "")}
          data-tree-row={r.kind === "error" ? undefined : r.rel}
          data-tree-kind={r.kind}
          data-tree-depth={String(r.depth)}
          onClick={r.kind === "error" ? undefined : filtering ? () => choose(r.rel) : r.kind === "dir" ? () => toggle(r.rel) : () => openFile(r.rel, paneId)}
          data-tree-at={at >= 0 && order[at] === r.rel ? "1" : undefined}
          data-tree-active={r.rel === editor.getSnapshot().active ? "1" : "0"}
          data-follow-mark={following.has(r.rel) ? "1" : undefined}
          title={r.rel}
          style={{
            height: TREE_ROW, lineHeight: `${TREE_ROW}px`, fontSize: 12, paddingLeft: TREE_LEFT + TREE_INDENT * r.depth, paddingRight: 8,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            color: r.kind === "error" ? "#c26058" : following.has(r.rel) ? "#82a5c8" : r.kind === "dir" ? "#b9bec5" : "#9aa0a8",
            cursor: r.kind === "error" ? "default" : "pointer",
            background: (at >= 0 && order[at] === r.rel) || r.rel === editor.getSnapshot().active ? "#2e3138" : undefined,
          }}
        >
          {r.kind === "dir" ? <>{r.open ? "▾" : "▸"} {lit(r.name)}/</> : lit(r.name)}
          {find.on && !filtering && found && r.kind === "dir" && !r.open && matchesBelow(r.rel, matches) > 0 && (
            <span data-tree-badge={r.rel} title={`folder holds ${matchesBelow(r.rel, matches)} matches`} style={{ marginLeft: 6, padding: "0 4px", borderRadius: 6, background: "#2e3138", color: "#9aa0a8", fontSize: 9.5 }}>{matchesBelow(r.rel, matches)}</span>
          )}
          {r.kind !== "dir" && r.kind !== "error" && changed.has(r.rel) && (
            <span data-tree-dot="1" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#82a5c8", marginLeft: 6, verticalAlign: "middle" }} />
          )}
        </div>
      ))}
    </div>
  );
}
