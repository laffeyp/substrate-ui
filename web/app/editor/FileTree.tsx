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

import * as React from "react";
import { editor } from "../state/editor";
import { openFile } from "./Centre";

interface Entry { name: string; kind: "dir" | "file" | "link"; size: number; modified: number }
type Listing = { entries: Entry[] } | { error: string };

export const TREE_ROW = 16;
export const TREE_INDENT = 14;
export const TREE_LEFT = 12;

interface Row { rel: string; name: string; kind: Entry["kind"] | "error"; depth: number; open: boolean }

export function FileTree({ sessionId, paneId }: { sessionId: string; paneId: number }): React.ReactElement {
  const [listings, setListings] = React.useState<Record<string, Listing>>({});
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const [changed, setChanged] = React.useState<Set<string>>(new Set());
  const asked = React.useRef(new Set<string>());

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
  walk("", 0);
  const drawn = rows.filter((r) => r.kind !== "error").length;
  const dots = rows.filter((r) => r.kind !== "dir" && r.kind !== "error" && changed.has(r.rel)).length;

  React.useEffect(() => { editor.set({ treeRows: drawn, modifiedDots: dots }); }, [drawn, dots]);
  React.useEffect(() => () => editor.set({ treeRows: 0, modifiedDots: 0 }), []);

  const toggle = (rel: string) => {
    const now = !open[rel];
    setOpen((was) => ({ ...was, [rel]: now }));
    if (now) read(rel);
  };

  return (
    <div data-editor-tree-rows={String(drawn)} style={{ paddingTop: 6 }}>
      {rows.map((r) => (
        <div
          key={r.rel + (r.kind === "error" ? "#error" : "")}
          data-tree-row={r.kind === "error" ? undefined : r.rel}
          data-tree-kind={r.kind}
          data-tree-depth={String(r.depth)}
          onClick={r.kind === "dir" ? () => toggle(r.rel) : r.kind === "error" ? undefined : () => openFile(r.rel, paneId)}
          data-tree-active={r.rel === editor.getSnapshot().active ? "1" : "0"}
          title={r.rel}
          style={{
            height: TREE_ROW, lineHeight: `${TREE_ROW}px`, fontSize: 12, paddingLeft: TREE_LEFT + TREE_INDENT * r.depth, paddingRight: 8,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            color: r.kind === "error" ? "#c26058" : r.kind === "dir" ? "#b9bec5" : "#9aa0a8",
            cursor: r.kind === "error" ? "default" : "pointer",
            background: r.rel === editor.getSnapshot().active ? "#2e3138" : undefined,
          }}
        >
          {r.kind === "dir" ? `${r.open ? "▾" : "▸"} ${r.name}/` : r.name}
          {r.kind !== "dir" && r.kind !== "error" && changed.has(r.rel) && (
            <span data-tree-dot="1" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#82a5c8", marginLeft: 6, verticalAlign: "middle" }} />
          )}
        </div>
      ))}
    </div>
  );
}
