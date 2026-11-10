// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Quick open (sprint 441; roadmap r10 E9; frame 24i). ⌘P in the editor, or Go ▸ Quick Open, opens a box at the
// top of the centre (EDITOR_QUICK_OPENED): `› query` and `⌘P`; the workspace's files (GET …/files/list, the
// search's own walk, FILES_LISTED_ALL) matched by derive/quick_open.ts, the letters lit, the tree's dot on a file
// changed against main (GET …/diff), the folder dim; RECENT, the files opened in the editor, newest first, the
// shown one left out. ↑↓ choose; ↵ opens and gives the code the focus; ⌘↵ opens the tab and keeps the shown one
// (the editor does not split, D49 (c)); Escape, or a click away, closes the box (EDITOR_FILE_OPENED
// how=quick_open for a file it opens).

import * as React from "react";
import { editor } from "../state/editor";
import { quickMatches, type QuickMatch } from "../derive/quick_open";
import { emit as emitSignal } from "../../vm/instrumentation/sdd";
import { EditorFileOpenedHow, Signal } from "../../vm/signals.gen";
import { find, openFile } from "./Centre";

const BOX = "#26292e";
const SELECT = "#2e3138";
const FAINT = "#4a4e55";
const DIM = "#62676f";
const TEXT = "#b9bec5";
const BRIGHT = "#e2e5e9";
const ACCENT = "#82a5c8";
const RECENT_MAX = 8;

/** ⌘P and Go ▸ Quick Open: the box opens. */
export function openQuick(): void {
  editor.set({ quickOpen: editor.getSnapshot().quickOpen + 1 });
}

function Name({ path, lit }: { path: string; lit: number[] }): React.ReactElement {
  const at = path.lastIndexOf("/") + 1;
  const name = Array.from(path.slice(at)).map((c, k) => (lit.includes(at + k) ? <span key={k} style={{ color: BRIGHT, fontWeight: 600 }}>{c}</span> : c));
  return <><span style={{ color: TEXT, flex: "none" }}>{name}</span></>;
}

export function QuickOpen({ sessionId, paneId }: { sessionId: string; paneId: number }): React.ReactElement | null {
  const st = React.useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot);
  const [on, setOn] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [files, setFiles] = React.useState<string[]>([]);
  const [changed, setChanged] = React.useState<Set<string>>(new Set());
  const [at, setAt] = React.useState(0);
  const box = React.useRef<HTMLInputElement>(null);
  const sid = encodeURIComponent(sessionId);

  React.useEffect(() => {
    if (!st.quickOpen) return;
    setOn(true); setQuery(""); setAt(0);
    emitSignal(Signal.EDITOR_QUICK_OPENED, {}, { pane_id: paneId });
    fetch(`/api/session/${sid}/files/list`).then((r) => (r.ok ? (r.json() as Promise<{ files: string[] }>) : { files: [] })).catch(() => ({ files: [] })).then((d) => setFiles(d.files));
    fetch(`/api/session/${sid}/diff`).then((r) => (r.ok ? (r.json() as Promise<{ files: { path: string; status: string }[] }>) : { files: [] })).catch(() => ({ files: [] }))
      .then((d) => setChanged(new Set(d.files.filter((f) => f.status !== "D").map((f) => f.path))));
  }, [st.quickOpen]);
  React.useEffect(() => { if (on) box.current?.focus(); }, [on]);

  const matches: QuickMatch[] = React.useMemo(() => quickMatches(files, query), [files, query]);
  const recent = st.recent.filter((p) => p !== st.active).slice(0, RECENT_MAX);
  const choices = [...matches.map((m) => m.path), ...recent];
  if (!on) return null;

  const close = () => setOn(false);
  const choose = (path: string, show: boolean) => {
    close();
    // The code takes the focus: at once when the file is already placed, else when the centre places it.
    if (show) editor.set({ focusOnOpen: path });
    openFile(path, paneId, EditorFileOpenedHow.QUICK_OPEN, undefined, show);
    if (show) requestAnimationFrame(() => { if (editor.getSnapshot().active === path && editor.getSnapshot().file?.path === path) { editor.set({ focusOnOpen: null }); find.focusCode(); } });
  };
  const keys = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (choices.length) setAt((at + (e.key === "ArrowDown" ? 1 : -1) + choices.length) % choices.length); }
    else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); const path = choices[at]; if (path) choose(path, !e.metaKey); }
  };
  const row = (path: string, k: number, lit: number[], kind: string) => {
    const slash = path.lastIndexOf("/");
    return (
      <div key={`${kind}:${path}`} data-quick-row={kind} data-path={path} data-at={k === at ? "1" : "0"} onMouseDown={(e) => e.preventDefault()} onClick={(e) => choose(path, !e.metaKey)} onMouseEnter={() => setAt(k)}
        style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "3px 14px", cursor: "pointer", fontSize: 11.5, whiteSpace: "nowrap", minWidth: 0, background: k === at ? SELECT : undefined }}>
        <Name path={path} lit={lit} />
        {changed.has(path) && <span data-quick-dot={path} style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: ACCENT, flex: "none", alignSelf: "center" }} />}
        <span style={{ color: FAINT, fontSize: 10.5, overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{slash > 0 ? path.slice(0, slash + 1) : ""}</span>
      </div>
    );
  };
  return (
    <div data-quick-open="1" style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", width: "min(470px, calc(100% - 28px))", zIndex: 20, background: BOX, borderRadius: 6, boxShadow: "0 8px 28px rgba(0,0,0,.45)", border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,.055)" }}>
        <span style={{ color: DIM, fontSize: 11 }}>›</span>
        <input ref={box} data-quick-input="1" value={query} spellCheck={false} onChange={(e) => { setQuery(e.target.value); setAt(0); }} onKeyDown={keys} onBlur={close}
          style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: BRIGHT, font: "inherit", fontSize: 12, padding: 0 }} />
        <span style={{ color: FAINT, fontSize: 10 }}>⌘P</span>
      </div>
      <div style={{ maxHeight: 320, overflowY: "auto", padding: "4px 0" }}>
        {matches.map((m, k) => row(m.path, k, m.lit, "match"))}
        {query && files.length > 0 && !matches.length && <div data-quick-none="1" style={{ padding: "3px 14px", fontSize: 11, color: DIM }}>no matching files</div>}
        {recent.length > 0 && <div style={{ padding: "6px 14px 2px", fontSize: 9.5, letterSpacing: ".12em", color: FAINT }}>RECENT</div>}
        {recent.map((p, k) => row(p, matches.length + k, [], "recent"))}
      </div>
      <div data-quick-keys="1" style={{ display: "flex", gap: 6, padding: "5px 14px", borderTop: "1px solid rgba(255,255,255,.055)", fontSize: 10, color: FAINT, whiteSpace: "nowrap", overflow: "hidden" }}>
        <span>↑↓ choose · ↵ open · ⌘↵ open behind</span><span style={{ marginLeft: "auto" }}>esc</span>
      </div>
    </div>
  );
}
