// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The left column's search (sprint 434; roadmap 2026-11-09-code-editor r10, E8; frame 24j). ⌘⇧F opens it.
// The query, with Aa and .*, searches the session's workspace (GET …/search, git grep on the server,
// FILES_SEARCHED) once typing pauses; each search that returns is one EDITOR_SEARCH_QUERIED with its
// counts. The results are grouped by file, each line with its number and the match lit; a click opens the
// file at the line (EDITOR_FILE_OPENED how=search when it opens a tab). ↵ goes to the next result. ⌘⇧↵ or
// "all" replaces every match: each file read and written through the file API (one FileWritten each,
// with the hash it was read at), then the search runs again.

import * as React from "react";
import { editor } from "../state/editor";
import { countMatches, matchRanges, matcher, replaceAll, type SearchResult } from "../derive/search";
import { emit as emitSignal } from "../../vm/instrumentation/sdd";
import { EditorColumnFoldedCause, EditorFileOpenedHow, Signal } from "../../vm/signals.gen";
import { openFile } from "./Centre";
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

export function SearchTab({ sessionId, paneId }: { sessionId: string; paneId: number }): React.ReactElement {
  const st = React.useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot);
  const spec = st.search;
  const [result, setResult] = React.useState<SearchResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [at, setAt] = React.useState(-1);
  const [shut, setShut] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);
  const queryBox = React.useRef<HTMLInputElement>(null);
  const asked = React.useRef(0);
  const set = (patch: Partial<typeof spec>) => editor.set({ search: { ...editor.getSnapshot().search, ...patch } });

  const run = React.useCallback(async () => {
    const now = editor.getSnapshot().search;
    const n = ++asked.current;
    if (!now.query) { setResult(null); setError(null); setAt(-1); return; }
    const q = new URLSearchParams({ q: now.query, regex: now.regexp ? "1" : "0", case: now.caseSensitive ? "1" : "0" });
    const r = await fetch(`/api/session/${encodeURIComponent(sessionId)}/search?${q}`).catch(() => null);
    if (n !== asked.current || !r) return;
    if (!r.ok) { setResult(null); setAt(-1); setError(((await r.json().catch(() => ({}))) as { error?: string }).error || `search refused (${r.status})`); return; }
    const out = (await r.json()) as SearchResult;
    if (n !== asked.current) return;
    setError(null);
    setResult(out);
    setAt(-1);
    emitSignal(Signal.EDITOR_SEARCH_QUERIED, { regex: now.regexp, result_file_count: out.files.length, result_match_count: countMatches(out, now) }, { pane_id: paneId });
  }, [sessionId, paneId]);

  React.useEffect(() => {
    const t = window.setTimeout(() => void run(), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [spec.query, spec.caseSensitive, spec.regexp, run]);
  React.useEffect(() => {
    if (!st.searchFocus) return;
    requestAnimationFrame(() => { queryBox.current?.focus(); queryBox.current?.select(); });
  }, [st.searchFocus]);

  const flat = React.useMemo(() => (result ? result.files.flatMap((f) => f.lines.map((l) => ({ path: f.path, line: l.line }))) : []), [result]);
  const index = React.useMemo(() => new Map(flat.map((hit, i) => [`${hit.path}\n${hit.line}`, i])), [flat]);
  const go = (i: number) => {
    const hit = flat[i];
    if (!hit) return;
    setAt(i);
    openFile(hit.path, paneId, EditorFileOpenedHow.SEARCH, hit.line);
    if (shut.has(hit.path)) setShut(new Set([...shut].filter((p) => p !== hit.path)));
  };
  const next = () => { if (flat.length) go((at + 1) % flat.length); };
  const replaceEvery = async () => {
    const now = editor.getSnapshot().search;
    if (!result || busy || !matcher(now)) return;
    setBusy(true);
    const sid = encodeURIComponent(sessionId);
    for (const f of result.files) {
      const path = encodeURIComponent(f.path);
      const file = (await fetch(`/api/session/${sid}/file?path=${path}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)) as { text: string | null; sha256?: string } | null;
      if (!file || file.text === null) continue;
      const text = replaceAll(file.text, now, now.replace);
      if (text === file.text) continue;
      await fetch(`/api/session/${sid}/file?path=${path}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, view: "editor", base_sha256: file.sha256 }) }).catch(() => null);
    }
    setBusy(false);
    await run();
  };
  const keys = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (e.metaKey && e.shiftKey) void replaceEvery();
    else if (!e.metaKey && !e.ctrlKey && !e.altKey) next();
  };

  const re = matcher(spec);
  const box: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, margin: "0 10px 6px", padding: "4px 8px", borderRadius: 4, background: CARD, fontSize: 11 };
  const field: React.CSSProperties = { flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: BRIGHT, font: "inherit", fontSize: 11, padding: 0 };
  const toggle = (on: boolean): React.CSSProperties => ({ cursor: "pointer", color: on ? BRIGHT : DIM, userSelect: "none", fontSize: 10.5 });
  const matches = result ? countMatches(result, spec) : 0;
  const summary = error ? error : !result ? "" : !result.files.length ? "no matches" : `${matches} match${matches === 1 ? "" : "es"} in ${result.files.length} file${result.files.length === 1 ? "" : "s"}${result.truncated ? " (first lines only)" : ""}`;
  return (
    <div data-editor-search="1" style={{ display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0, flex: 1, paddingTop: 6 }}>
      <div style={box}>
        <input ref={queryBox} data-search-input="query" value={spec.query} placeholder="search" spellCheck={false} onChange={(e) => set({ query: e.target.value })} onKeyDown={keys} style={field} />
        <span data-search-toggle="case" data-on={spec.caseSensitive ? "1" : "0"} title="match case" onClick={() => set({ caseSensitive: !spec.caseSensitive })} style={toggle(spec.caseSensitive)}>Aa</span>
        <span data-search-toggle="regexp" data-on={spec.regexp ? "1" : "0"} title="regular expression" onClick={() => set({ regexp: !spec.regexp })} style={toggle(spec.regexp)}>.*</span>
      </div>
      <div style={box}>
        <input data-search-input="replace" value={spec.replace} placeholder="replace" spellCheck={false} onChange={(e) => set({ replace: e.target.value })} onKeyDown={keys} style={{ ...field, color: spec.replace ? BRIGHT : FAINT }} />
        <span data-search-next="1" title="next result (↵)" onClick={next} style={{ ...toggle(false), color: DIM }}>↵</span>
        <span data-search-replace="all" title="replace every match (⌘⇧↵)" onClick={() => void replaceEvery()} style={{ ...toggle(false), color: busy ? FAINT : DIM }}>all</span>
      </div>
      <div data-search-summary="1" style={{ padding: "0 12px 6px", fontSize: 10, color: error ? "#c88282" : DIM, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{summary}</div>
      <div data-search-results="1" style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {result?.files.map((f) => {
          const open = !shut.has(f.path);
          const slash = f.path.lastIndexOf("/");
          const count = f.lines.reduce((n, l) => n + Math.max(1, matchRanges(l.text, re).length), 0);
          return (
            <div key={f.path} data-search-file={f.path}>
              <div onClick={() => setShut(open ? new Set([...shut, f.path]) : new Set([...shut].filter((p) => p !== f.path)))}
                style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "2px 10px", cursor: "pointer", fontSize: 11, color: TEXT, whiteSpace: "nowrap" }}>
                <span style={{ color: DIM, fontSize: 9, width: 8, flex: "none" }}>{open ? "▾" : "▸"}</span>
                <span style={{ flex: "none" }}>{f.path.slice(slash + 1)}</span>
                <span style={{ color: FAINT, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{slash > 0 ? f.path.slice(0, slash) : ""}</span>
                <span style={{ marginLeft: "auto", color: DIM, fontSize: 10, flex: "none" }}>{count}</span>
              </div>
              {open && f.lines.map((l) => {
                const i = index.get(`${f.path}\n${l.line}`) ?? -1;
                // The line's indent is not drawn (24j); the lit ranges move with it.
                const text = l.text.trimStart(), cut = l.text.length - text.length;
                const parts: React.ReactNode[] = [];
                let from = 0;
                matchRanges(l.text, re).forEach(([a, b], k) => {
                  const x = Math.max(0, a - cut), y = Math.max(0, b - cut);
                  if (x > from) parts.push(text.slice(from, x));
                  parts.push(<span key={k} style={LIT}>{text.slice(x, y)}</span>);
                  from = y;
                });
                parts.push(text.slice(from));
                return (
                  <div key={l.line} data-search-line={`${f.path}:${l.line}`} data-at={i === at ? "1" : "0"} onClick={() => go(i)}
                    style={{ display: "flex", gap: 6, padding: "1.5px 10px 1.5px 22px", cursor: "pointer", fontSize: 10.5, whiteSpace: "nowrap", overflow: "hidden", background: i === at ? SELECT : undefined }}>
                    <span style={{ color: FAINT, width: 18, textAlign: "right", flex: "none" }}>{l.line}</span>
                    <span style={{ color: DIM, overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{parts}</span>
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
