// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A text file over the read limit, shown by line (sprint 470; roadmap r13 E14; the Architect, 2026-11-11: "you just
// open a file … they could just scroll down and see the whole file"). Read-only: saving a file this size waits on the
// Architect's answer (BLACKBOARD 2026-11-11 surfaced), since a save puts the whole old and new text in the record. The
// view draws only the rows in sight and reads their lines from the server in pages of 1,000 (GET …/lines,
// FILE_LINES_READ), keeping the last 64 pages; past the browser's tallest scroll area the scroll stands for a row, as
// in the bytes view. A line past 64 KB comes in part, and a row shows a long line's first 2,000 characters after a link to
// the whole line: the line reader, which wraps that one line at the view's width and, as the person scrolls, reads on
// through the bytes route (256 KB a read, FILE_BYTES_READ) from the byte the server names, decoded in the file's codec,
// until the line is whole. One row of a 5 MB line would be wider than the browser's widest scroll area, so the reader
// wraps rather than scrolls sideways.

import * as React from "react";
import { editor } from "../state/editor";

const ROW_HEIGHT = 20;
const PAGE = 1000;
const KEEP = 64;
const MAX_HEIGHT = 8_000_000;
/** The bytes route's largest piece (server.py WORKSPACE_BYTES_MAX). */
const REST_PIECE = 256 * 1024;
const ACCENT = "#82a5c8";
/** The characters a row shows of a line that has more: the rest is in the line reader. */
const ROW_CHARS = 2000;

interface Line { text: string; more: number; rest?: number }
interface Page { encoding: string; codec: string; total: number; lines: Line[] }

/** Bytes as text in the file's codec; Latin-1 by hand, since TextDecoder's "latin1" is windows-1252. A decoder per
 *  line keeps a character split across two reads whole. */
function decoderFor(codec: string): (bytes: Uint8Array) => string {
  if (codec === "latin-1") return (bytes) => Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  const d = new TextDecoder(codec === "utf-16-le" ? "utf-16le" : codec === "utf-16-be" ? "utf-16be" : "utf-8");
  return (bytes) => d.decode(bytes, { stream: true });
}

export function LinesView({ sessionId, path }: { sessionId: string; path: string }): React.ReactElement {
  const scroller = React.useRef<HTMLDivElement>(null);
  const [view, setView] = React.useState({ top: 0, height: 600 });
  const [, setLoaded] = React.useState(0);
  const pages = React.useRef(new Map<number, Line[]>());
  const asked = React.useRef(new Set<number>());
  const meta = React.useRef<{ total: number; codec: string } | null>(null);
  /** The line open in the reader, by number, with the part the server sent. */
  const [reading, setReading] = React.useState<{ n: number; line: Line } | null>(null);

  React.useEffect(() => {
    pages.current.clear(); asked.current.clear(); meta.current = null;
    setReading(null);
    if (scroller.current) scroller.current.scrollTop = 0;
    setView((v) => ({ ...v, top: 0 }));
    setLoaded((n) => n + 1);
  }, [sessionId, path]);

  React.useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => setView({ top: el.scrollTop, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = Math.max(1, meta.current?.total ?? 1);
  const total = rows * ROW_HEIGHT;
  const height = Math.min(total, MAX_HEIGHT);
  const visible = Math.ceil(view.height / ROW_HEIGHT) + 1;
  const scaled = total > MAX_HEIGHT;
  const first = scaled
    ? Math.min(rows - 1, Math.round((view.top / Math.max(1, height - view.height)) * Math.max(0, rows - visible)))
    : Math.floor(view.top / ROW_HEIGHT);
  const last = Math.min(rows - 1, first + visible);

  // The pages the rows in sight need, read once each; the oldest dropped past KEEP. The first page names the file's
  // line count, encoding and codec; INFO takes the encoding.
  React.useEffect(() => {
    for (let p = Math.floor(first / PAGE); p <= Math.floor(last / PAGE); p++) {
      if (pages.current.has(p) || asked.current.has(p)) continue;
      asked.current.add(p);
      const q = `path=${encodeURIComponent(path)}&from=${p * PAGE}&count=${PAGE}`;
      fetch(`/api/session/${encodeURIComponent(sessionId)}/lines?${q}`)
        .then((r) => (r.ok ? (r.json() as Promise<Page>) : null))
        .then((out) => {
          asked.current.delete(p);
          if (!out) return;
          pages.current.set(p, out.lines);
          while (pages.current.size > KEEP) pages.current.delete(pages.current.keys().next().value as number);
          if (!meta.current) {
            meta.current = { total: out.total, codec: out.codec };
            const file = editor.getSnapshot().file;
            if (file && file.path === path && file.encoding !== out.encoding) editor.set({ file: { ...file, encoding: out.encoding } });
          }
          setLoaded((n) => n + 1);
        })
        .catch(() => { asked.current.delete(p); });
    }
  }, [first, last, path, sessionId, rows]);

  const lineAt = (n: number): Line | null => pages.current.get(Math.floor(n / PAGE))?.[n % PAGE] ?? null;
  const digits = String(rows).length;
  const lines: React.ReactNode[] = [];
  /** The longest line in sight, in characters with its tail: the scroll area's width (rows are placed absolutely, so
   *  they give it none). */
  let widest = 0;
  for (let n = first; n <= last; n++) {
    const line = lineAt(n);
    if (line) widest = Math.max(widest, line.more > 0 ? ROW_CHARS + 14 : line.text.length);
    lines.push(
      <div key={n} data-line-row={n} style={{ height: ROW_HEIGHT, whiteSpace: "pre", display: "flex" }}>
        <span style={{ width: `${digits + 2}ch`, flex: "none", textAlign: "right", paddingRight: "2ch", color: "#4a4e55" }}>{n + 1}</span>
        {line
          ? <>
            {/* Before the text, where it is in sight: the row shows only the line's start. */}
            {line.more > 0 && <span data-line-more={n} onClick={() => setReading({ n, line })} style={{ color: ACCENT, cursor: "pointer", paddingRight: "2ch", flex: "none" }}>whole line ›</span>}
            <span data-line-text={n} style={{ color: "#d7dade" }}>{line.more > 0 ? line.text.slice(0, ROW_CHARS) : line.text}</span>
          </>
          : <span style={{ color: "#4a4e55" }}>…</span>}
      </div>,
    );
  }
  // The lines stay mounted under the reader, hidden, so closing it returns to the same place.
  return (
    <>
    {reading && meta.current && <LineReader sessionId={sessionId} path={path} n={reading.n} line={reading.line} codec={meta.current.codec} onClose={() => setReading(null)} />}
    <div ref={scroller} data-lines-view={path} data-lines-total={meta.current?.total ?? ""} onScroll={(e) => setView({ top: e.currentTarget.scrollTop, height: e.currentTarget.clientHeight })}
      style={{ position: "absolute", inset: 0, overflow: "auto", visibility: reading ? "hidden" : "visible", fontFamily: "ui-monospace,'SF Mono',Menlo,Consolas,monospace", fontSize: 13, lineHeight: `${ROW_HEIGHT}px` }}>
      <div style={{ height, position: "relative", minWidth: "100%", width: `calc(${digits + 2 + widest}ch + 40px)` }}>
        <div style={{ position: "absolute", left: 0, top: scaled ? view.top : first * ROW_HEIGHT, padding: "0 20px 0 0" }}>{lines}</div>
      </div>
    </div>
    </>
  );
}

/** One long line, wrapped at the view's width into rows of whole characters (monospace, so a row is `cols`
 *  characters), read on through the bytes route as the rows past what is read come into sight. */
function LineReader({ sessionId, path, n, line, codec, onClose }: { sessionId: string; path: string; n: number; line: Line; codec: string; onClose: () => void }): React.ReactElement {
  const scroller = React.useRef<HTMLDivElement>(null);
  const probe = React.useRef<HTMLSpanElement>(null);
  const [view, setView] = React.useState({ top: 0, height: 600, width: 800 });
  const [cols, setCols] = React.useState(100);
  const held = React.useRef({ text: line.text, more: line.more, rest: line.rest ?? 0, busy: false, decode: decoderFor(codec) });
  const [, setRead] = React.useState(0);

  React.useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => {
      setView({ top: el.scrollTop, height: el.clientHeight, width: el.clientWidth });
      const charWidth = probe.current ? probe.current.getBoundingClientRect().width / 10 : 8;
      setCols(Math.max(20, Math.floor((el.clientWidth - 48) / Math.max(1, charWidth))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const got = held.current;
  const readRows = Math.ceil(got.text.length / cols);
  const rows = Math.max(1, readRows + Math.ceil(got.more / cols));
  const total = rows * ROW_HEIGHT, height = Math.min(total, MAX_HEIGHT), scaled = total > MAX_HEIGHT;
  const visible = Math.ceil(view.height / ROW_HEIGHT) + 1;
  const first = scaled
    ? Math.min(rows - 1, Math.round((view.top / Math.max(1, height - view.height)) * Math.max(0, rows - visible)))
    : Math.floor(view.top / ROW_HEIGHT);
  const last = Math.min(rows - 1, first + visible);

  // Rows in sight past what is read: read on, one piece at a time, in order.
  React.useEffect(() => {
    if (got.busy || got.more <= 0 || last < readRows) return;
    got.busy = true;
    const length = Math.min(got.more, REST_PIECE);
    fetch(`/api/session/${encodeURIComponent(sessionId)}/bytes?path=${encodeURIComponent(path)}&offset=${got.rest}&length=${length}`)
      .then((r) => (r.ok ? (r.json() as Promise<{ data: string; length: number }>) : null))
      .then((out) => {
        got.busy = false;
        if (!out || out.length === 0) { got.more = 0; setRead((k) => k + 1); return; }
        const bin = atob(out.data), bytes = new Uint8Array(bin.length);
        for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
        got.text += got.decode(bytes);
        got.more -= out.length;
        got.rest += out.length;
        setRead((k) => k + 1);
      })
      .catch(() => { got.busy = false; });
  });

  const out: React.ReactNode[] = [];
  for (let r = first; r <= last; r++) {
    out.push(<div key={r} data-reader-row={r} style={{ height: ROW_HEIGHT, whiteSpace: "pre", color: r < readRows ? "#d7dade" : "#4a4e55" }}>{r < readRows ? got.text.slice(r * cols, (r + 1) * cols) : "…"}</div>);
  }
  return (
    <div data-line-reader={n} data-reader-chars={got.text.length} data-reader-more={got.more} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", fontFamily: "ui-monospace,'SF Mono',Menlo,Consolas,monospace", fontSize: 13 }}>
      <div style={{ display: "flex", gap: 14, padding: "6px 20px", fontSize: 11, color: "#9aa0a8", borderBottom: "1px solid rgba(255,255,255,.055)", flex: "none" }}>
        <span>line {(n + 1).toLocaleString("en-US")} · {got.text.length.toLocaleString("en-US")} characters read{got.more > 0 ? ` · ${got.more.toLocaleString("en-US")} bytes to read` : ""}</span>
        <span data-reader-close="1" onClick={onClose} style={{ marginLeft: "auto", color: ACCENT, cursor: "pointer" }}>‹ back to the lines</span>
      </div>
      <div ref={scroller} data-reader-scroll="1" onScroll={(e) => setView({ top: e.currentTarget.scrollTop, height: e.currentTarget.clientHeight, width: e.currentTarget.clientWidth })}
        style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", position: "relative", lineHeight: `${ROW_HEIGHT}px` }}>
        <span ref={probe} style={{ position: "absolute", visibility: "hidden", whiteSpace: "pre" }}>MMMMMMMMMM</span>
        <div style={{ height, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: scaled ? view.top : first * ROW_HEIGHT, padding: "0 24px" }}>{out}</div>
        </div>
      </div>
    </div>
  );
}
