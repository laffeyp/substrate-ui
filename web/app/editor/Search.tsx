// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The left column's search (sprints 434, 435; roadmap 2026-11-09-code-editor r10, E8; frame 24j; research
// RESEARCH-2026-11-10-editor-search-r2). ⌘⇧F opens it. The query, with Aa (match case), ab (whole word) and
// .* (regular expression), and the include and exclude globs behind `…`, searches the session's workspace once
// typing pauses: GET …/search, the server's own walk and Python's re (FILES_SEARCHED); each search that returns
// is one EDITOR_SEARCH_QUERIED. One row per match, lit at the server's ranges, grouped by file; a click or ↵
// opens the match's line (EDITOR_FILE_OPENED how=search when it opens a tab). A replace — one match (a row's ↵),
// one file (a file's ↵), or every match (⌘⇧↵ or "all") — is worked out by the server (POST …/search/replace,
// FILES_REPLACE_PREPARED) and written by the page through PUT …/file with the hash each file was read at (one
// FileWritten each; a file changed since is refused, 409); then EDITOR_SEARCH_REPLACED, and the search again.
// Sprint 442 (SEARCH-BAR-2026-11-10): the bar finds file names, folder names and paths as well as the text inside
// files, names first; files changing on disk run it again.
// Sprint 436: the editor's unsaved buffers go with each search and replace, and are searched in place of the
// files on disk (VS Code's getOpenEditorResults); a replace changes such a buffer and saves it from there. The
// last replace can be undone in one step ("undo replace"): each file written back to its text before it, a
// buffer put back unsaved, as VS Code's one undo element over every file (EDITOR_SEARCH_REPLACE_UNDONE).
// Sprint 457 (D94): right-click on a name adds its file or folder to the message, on a file its file, on a match
// its line ("cart.ts 85"; BLACKBOARD 2026-11-11).

import * as React from "react";
import { editor } from "../state/editor";
import { nameParts, searchRows, type SearchName, type SearchResult } from "../derive/search";
import { emit as emitSignal } from "../../vm/instrumentation/sdd";
import { ContextMenuOpenedSource, EditorColumnFoldedCause, EditorFileOpenedHow, EditorSearchReplacedScope, Signal } from "../../vm/signals.gen";
import { addItem, fileChip, folderChip, lineChip } from "./chips";
import { openMenu } from "../state/context_menu";
import { find, onBufferEdit, openFile, putBuffer, unsavedBuffers, writeBuffer } from "./Centre";
import { foldColumn } from "./EditorView";

const CARD = "#212327";
const SELECT = "#2e3138";
const FAINT = "#4a4e55";
const DIM = "#62676f";
const TEXT = "#b9bec5";
const BRIGHT = "#e2e5e9";
const LIT: React.CSSProperties = { color: BRIGHT, background: "rgba(130,165,200,.25)", borderRadius: 2 };
/** The pause after typing before the search runs. */
const SETTLE_MS = 200;

/** ⌘⇧F (App's key route): the search tab shown, the column unfolded, the query focused. */
export function openSearch(paneId: number): void {
  if (editor.getSnapshot().folded.left) foldColumn("left", false, EditorColumnFoldedCause.KEY, paneId);
  editor.set({ leftTab: "search", searchFocus: editor.getSnapshot().searchFocus + 1 });
}

type Target = { path: string; line?: number; index?: number };
/** What the last replace changed, for its one undo: each file's text before it, whether it was a buffer, and
 *  the hash the write returned (the undo's conflict check). */
type Done = { files: { path: string; before: string; buffer: boolean; sha: string | null }[]; count: number };

export function SearchTab({ sessionId, paneId }: { sessionId: string; paneId: number }): React.ReactElement {
  const st = React.useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot);
  const spec = st.search;
  const [result, setResult] = React.useState<SearchResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [at, setAt] = React.useState(-1);
  const [shut, setShut] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState<Done | null>(null);
  const queryBox = React.useRef<HTMLInputElement>(null);
  const asked = React.useRef(0);
  const sid = encodeURIComponent(sessionId);
  const set = (patch: Partial<typeof spec>) => editor.set({ search: { ...editor.getSnapshot().search, ...patch } });

  const run = React.useCallback(async () => {
    const now = editor.getSnapshot().search;
    const n = ++asked.current;
    if (!now.query) { setResult(null); setError(null); setAt(-1); return; }
    const body = { q: now.query, regex: now.regexp, case: now.caseSensitive, word: now.word, include: now.include, exclude: now.exclude, buffers: unsavedBuffers(sessionId) };
    const r = await fetch(`/api/session/${sid}/search`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    if (n !== asked.current || !r) return;
    if (!r.ok) { setResult(null); setAt(-1); setError(((await r.json().catch(() => ({}))) as { error?: string }).error || `search refused (${r.status})`); return; }
    const out = (await r.json()) as SearchResult;
    if (n !== asked.current) return;
    setError(null);
    setResult(out);
    setAt(-1);
    emitSignal(Signal.EDITOR_SEARCH_QUERIED, { regex: now.regexp, word: now.word, result_file_count: out.files.length, result_match_count: out.matches, name_count: out.names.length }, { pane_id: paneId });
  }, [sid, sessionId, paneId]);

  React.useEffect(() => {
    const t = window.setTimeout(() => void run(), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [spec.query, spec.caseSensitive, spec.regexp, spec.word, spec.include, spec.exclude, run]);
  // Sprint 436: an edit to the shown buffer runs the search again once typing pauses.
  React.useEffect(() => {
    let t: number | undefined;
    const off = onBufferEdit(() => { window.clearTimeout(t); t = window.setTimeout(() => void run(), SETTLE_MS); });
    return () => { off(); window.clearTimeout(t); };
  }, [run]);
  // Sprint 442: files changing on disk (the watch stream) run the search again, so a file the session writes
  // appears without retyping.
  React.useEffect(() => {
    let t: number | undefined;
    const es = new EventSource(`/api/session/${sid}/files/watch`);
    es.onmessage = () => { if (!editor.getSnapshot().search.query) return; window.clearTimeout(t); t = window.setTimeout(() => void run(), SETTLE_MS); };
    return () => { es.close(); window.clearTimeout(t); };
  }, [sid, run]);
  React.useEffect(() => {
    if (!st.searchFocus) return;
    requestAnimationFrame(() => { queryBox.current?.focus(); queryBox.current?.select(); });
  }, [st.searchFocus]);

  const rows = React.useMemo(() => (result ? searchRows(result) : []), [result]);
  // Sprint 442: the names come first in the results, and ↵ ↑ ↓ step through names and lines as one list.
  const names: SearchName[] = result?.names ?? [];
  const go = (i: number) => {
    const row = rows[i];
    if (!row) return;
    setAt(names.length + i);
    openFile(row.path, paneId, EditorFileOpenedHow.SEARCH, row.line);
    if (shut.has(row.path)) setShut(new Set([...shut].filter((p) => p !== row.path)));
  };
  /** A file name opens the file with the code focused; a folder name opens the files tab at that folder. */
  const goName = (k: number) => {
    const n = names[k];
    if (!n) return;
    setAt(k);
    if (n.kind === "dir") { editor.set({ leftTab: "files", reveal: { path: n.path, n: (editor.getSnapshot().reveal?.n ?? 0) + 1 } }); return; }
    editor.set({ focusOnOpen: n.path });
    openFile(n.path, paneId, EditorFileOpenedHow.SEARCH);
    requestAnimationFrame(() => { const s = editor.getSnapshot(); if (s.active === n.path && s.file?.path === n.path && s.focusOnOpen === n.path) { editor.set({ focusOnOpen: null }); find.focusCode(); } });
  };
  const total = names.length + rows.length;
  const next = () => { if (!total) return; const k = (at + 1) % total; if (k < names.length) goName(k); else go(k - names.length); };
  const replace = async (target?: Target) => {
    const now = editor.getSnapshot().search;
    if (!result || busy || !now.query) return;
    setBusy(true);
    const scope = target?.index !== undefined ? EditorSearchReplacedScope.ONE : target ? EditorSearchReplacedScope.FILE : EditorSearchReplacedScope.ALL;
    const body = { q: now.query, regex: now.regexp, case: now.caseSensitive, word: now.word, include: now.include, exclude: now.exclude, replace: now.replace, buffers: unsavedBuffers(sessionId), ...target };
    const r = await fetch(`/api/session/${sid}/search/replace`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const planned = r?.ok ? ((await r.json()) as { files: { path: string; text: string; before: string; sha256: string; replaced: number; buffer: boolean }[] }).files : [];
    let files = 0, count = 0, refused = 0, buffers = 0;
    const undo: Done = { files: [], count: 0 };
    for (const f of planned) {
      if (f.buffer) {
        const status = await writeBuffer(sessionId, f.path, f.text);
        if (status >= 200 && status < 300) { files++; buffers++; count += f.replaced; undo.files.push({ path: f.path, before: f.before, buffer: true, sha: null }); } else if (status === 409) refused++;
        continue;
      }
      const wrote = await fetch(`/api/session/${sid}/file?path=${encodeURIComponent(f.path)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: f.text, view: "editor", base_sha256: f.sha256 }) }).catch(() => null);
      if (wrote?.ok) { files++; count += f.replaced; undo.files.push({ path: f.path, before: f.before, buffer: false, sha: ((await wrote.json()) as { sha256: string }).sha256 }); } else if (wrote?.status === 409) refused++;
    }
    undo.count = count;
    setDone(undo.files.length ? undo : null);
    emitSignal(Signal.EDITOR_SEARCH_REPLACED, { scope, files, count, refused, buffers }, { pane_id: paneId });
    setBusy(false);
    await run();
  };
  /** The last replace undone in one step: a buffer put back (left unsaved), any other file written back. */
  const undoReplace = async () => {
    if (!done || busy) return;
    setBusy(true);
    let files = 0, refused = 0;
    for (const f of done.files) {
      if (f.buffer && putBuffer(sessionId, f.path, f.before)) { files++; continue; }
      const wrote = await fetch(`/api/session/${sid}/file?path=${encodeURIComponent(f.path)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: f.before, view: "editor", ...(f.sha ? { base_sha256: f.sha } : {}) }) }).catch(() => null);
      if (wrote?.ok) files++; else if (wrote?.status === 409) refused++;
    }
    setDone(null);
    emitSignal(Signal.EDITOR_SEARCH_REPLACE_UNDONE, { files, refused }, { pane_id: paneId });
    setBusy(false);
    await run();
  };
  const keys = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (e.metaKey && e.shiftKey) void replace();
    else if (!e.metaKey && !e.ctrlKey && !e.altKey) next();
  };

  const box: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, margin: "0 10px 6px", padding: "4px 8px", borderRadius: 4, background: CARD, fontSize: 11 };
  const field: React.CSSProperties = { flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: BRIGHT, font: "inherit", fontSize: 11, padding: 0 };
  const toggle = (on: boolean): React.CSSProperties => ({ cursor: "pointer", color: on ? BRIGHT : DIM, userSelect: "none", fontSize: 10.5, flex: "none" });
  const glyph = (dim = false): React.CSSProperties => ({ cursor: "pointer", color: dim ? FAINT : DIM, userSelect: "none", fontSize: 10.5, flex: "none" });
  const matches = result?.matches ?? 0;
  const counts = result ? [names.length ? `${names.length} name${names.length === 1 ? "" : "s"}` : "", result.files.length ? `${matches} match${matches === 1 ? "" : "es"} in ${result.files.length} file${result.files.length === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · ") : "";
  const summary = error ? error : !result ? "" : !counts ? "no matches" : `${counts}${result.truncated ? " (the first only)" : ""}`;
  const replacing = !!spec.replace;
  return (
    <div data-editor-search="1" style={{ display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0, flex: 1, paddingTop: 6 }}>
      <div style={box}>
        <input ref={queryBox} data-search-input="query" value={spec.query} placeholder="search" spellCheck={false} onChange={(e) => set({ query: e.target.value })} onKeyDown={keys} style={field} />
        <span data-search-toggle="case" data-on={spec.caseSensitive ? "1" : "0"} title="match case" onClick={() => set({ caseSensitive: !spec.caseSensitive })} style={toggle(spec.caseSensitive)}>Aa</span>
        <span data-search-toggle="word" data-on={spec.word ? "1" : "0"} title="match whole word" onClick={() => set({ word: !spec.word })} style={{ ...toggle(spec.word), textDecoration: "underline" }}>ab</span>
        <span data-search-toggle="regexp" data-on={spec.regexp ? "1" : "0"} title="regular expression" onClick={() => set({ regexp: !spec.regexp })} style={toggle(spec.regexp)}>.*</span>
      </div>
      <div style={box}>
        <input data-search-input="replace" value={spec.replace} placeholder="replace" spellCheck={false} onChange={(e) => set({ replace: e.target.value })} onKeyDown={keys} style={{ ...field, color: spec.replace ? BRIGHT : FAINT }} />
        <span data-search-next="1" title="next match (↵)" onClick={next} style={glyph()}>↵</span>
        <span data-search-replace="all" title="replace every match (⌘⇧↵)" onClick={() => void replace()} style={glyph(busy)}>all</span>
      </div>
      {spec.details && (
        <>
          <div style={box}><input data-search-input="include" value={spec.include} placeholder="files to include" spellCheck={false} onChange={(e) => set({ include: e.target.value })} onKeyDown={keys} style={field} /></div>
          <div style={box}><input data-search-input="exclude" value={spec.exclude} placeholder="files to exclude" spellCheck={false} onChange={(e) => set({ exclude: e.target.value })} onKeyDown={keys} style={field} /></div>
        </>
      )}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "0 12px 6px", fontSize: 10 }}>
        <span data-search-summary="1" style={{ flex: 1, minWidth: 0, color: error ? "#c88282" : DIM, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{summary}</span>
        {done && <span data-search-undo="1" title={`undo the last replace: ${done.count} in ${done.files.length} file${done.files.length === 1 ? "" : "s"}`} onClick={() => void undoReplace()} style={{ ...glyph(busy), color: busy ? FAINT : TEXT }}>undo</span>}
        <span data-search-details="1" data-on={spec.details ? "1" : "0"} title="files to include and exclude" onClick={() => set({ details: !spec.details })} style={{ ...glyph(), color: spec.details || spec.include || spec.exclude ? TEXT : DIM }}>…</span>
      </div>
      <div data-search-results="1" style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {names.map((n, k) => {
          const p = nameParts(n);
          const lit = (text: string, spans: [number, number][]) => {
            const out: React.ReactNode[] = [];
            let from = 0;
            spans.forEach(([a, b], i) => { if (a > from) out.push(text.slice(from, a)); out.push(<span key={i} style={LIT}>{text.slice(a, b)}</span>); from = b; });
            out.push(text.slice(from));
            return out;
          };
          return (
            <div key={`${n.kind}:${n.path}`} data-search-name={n.path} data-kind={n.kind} data-at={k === at ? "1" : "0"} onClick={() => goName(k)}
              onContextMenu={(e) => openMenu(e, ContextMenuOpenedSource.SEARCH, [addItem(paneId, n.kind === "dir" ? folderChip(n.path) : fileChip(n.path))], paneId)}
              style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "2px 10px", cursor: "pointer", fontSize: 11, whiteSpace: "nowrap", minWidth: 0, background: k === at ? SELECT : undefined }}>
              <span style={{ color: TEXT, flex: "none" }}>{lit(p.name, p.nameLit)}{n.kind === "dir" ? "/" : ""}</span>
              <span style={{ color: FAINT, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{lit(p.dir, p.dirLit)}</span>
            </div>
          );
        })}
        {names.length > 0 && rows.length > 0 && <div style={{ height: 6 }} />}
        {result?.files.map((f) => {
          const open = !shut.has(f.path);
          const slash = f.path.lastIndexOf("/");
          const count = f.lines.reduce((n, l) => n + l.ranges.length, 0);
          return (
            <div key={f.path} data-search-file={f.path}>
              <div className="hover-search-row" onClick={() => setShut(open ? new Set([...shut, f.path]) : new Set([...shut].filter((p) => p !== f.path)))}
                onContextMenu={(e) => openMenu(e, ContextMenuOpenedSource.SEARCH, [addItem(paneId, fileChip(f.path))], paneId)}
                style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "2px 10px", cursor: "pointer", fontSize: 11, color: TEXT, whiteSpace: "nowrap" }}>
                <span style={{ color: DIM, fontSize: 9, width: 8, flex: "none" }}>{open ? "▾" : "▸"}</span>
                <span style={{ flex: "none" }}>{f.path.slice(slash + 1)}</span>
                <span style={{ color: FAINT, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{slash > 0 ? f.path.slice(0, slash) : ""}</span>
                <span style={{ marginLeft: "auto", display: "flex", gap: 6, flex: "none" }}>
                  {replacing && <span className="hover-search-act" data-search-replace-file={f.path} title="replace in this file" onClick={(e) => { e.stopPropagation(); void replace({ path: f.path }); }} style={glyph()}>↵</span>}
                  <span data-search-count={f.path} style={{ color: DIM, fontSize: 10 }}>{count}</span>
                </span>
              </div>
              {open && rows.map((row, n) => {
                if (row.path !== f.path) return null;
                const key = `${row.path}:${row.line}:${row.index}`;
                return (
                  <div key={key} data-search-line={`${row.path}:${row.line}`} data-search-match={key} data-at={names.length + n === at ? "1" : "0"} className="hover-search-row" onClick={() => go(n)}
                    onContextMenu={(e) => openMenu(e, ContextMenuOpenedSource.SEARCH, [addItem(paneId, lineChip(row.path, row.line))], paneId)}
                    style={{ display: "flex", gap: 6, padding: "1.5px 10px 1.5px 22px", cursor: "pointer", fontSize: 10.5, whiteSpace: "nowrap", overflow: "hidden", background: names.length + n === at ? SELECT : undefined }}>
                    <span style={{ color: FAINT, width: 18, textAlign: "right", flex: "none" }}>{row.line}</span>
                    <span style={{ color: DIM, overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, flex: 1 }}>{row.text.slice(0, row.from)}<span style={LIT}>{row.text.slice(row.from, row.to)}</span>{row.text.slice(row.to)}</span>
                    {replacing && <span className="hover-search-act" data-search-replace-one={key} title="replace this match" onClick={(e) => { e.stopPropagation(); void replace({ path: row.path, line: row.line, index: row.index }); }} style={glyph()}>↵</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
