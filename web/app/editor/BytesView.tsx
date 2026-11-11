// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A file that is not text, shown as its bytes (sprint 463; roadmap r13 E14; the Architect, 2026-11-11: "You show what
// every file is"; "you just open a file … they could just scroll down and see the whole file"). Read-only, at any size:
// the view draws only the rows in sight and reads the bytes behind them from the server in 64 KB pieces
// (GET …/bytes, FILE_BYTES_READ), keeping the last 64 pieces. A file whose rows outgrow the browser's tallest scroll
// area is scaled to it: the scroll position stands for a row, not a pixel. The form (hex, binary, octal, text) is
// picked in the status line and kept per file in the editor store; each opening and each pick is one
// EDITOR_BYTES_VIEWED. The rows are `derive/bytes.ts`'s.
// Sprint 468 (the Architect, 2026-11-11: every file editable by hand): a file up to the read limit is the centre's
// buffer, every byte one character (sprint 465). The view reads its rows from that buffer, and in hex, binary and
// octal a caret sits on a digit: a digit typed over it replaces that byte in the buffer and the caret moves on, so ⌘S,
// undo and the unsaved dot are the code's, and every form shows the same unsaved bytes. A changed byte is drawn in the
// accent. A file over the limit is read from the server as before, read-only until sprint 469.

import * as React from "react";
import { editor } from "../state/editor";
import { BYTES_FORMS, bytesRow, digitColumn, DIGITS, isDigitForm, ROW_BYTES, rowCount, typeDigit, type BytesForm } from "../derive/bytes";
import { emit as emitSignal } from "../../vm/instrumentation/sdd";
import { EditorBytesViewedForm, EditorBytesViewedHow, Signal } from "../../vm/signals.gen";

const ROW_HEIGHT = 20;
const CHUNK = 64 * 1024;
const KEEP = 64;
/** Under the tallest element Chromium draws (about 33.5 million pixels); past it the scroll area is scaled. */
const MAX_HEIGHT = 8_000_000;
const ACCENT = "#82a5c8";

/** Sprint 468: the centre's buffer of a file it holds as Latin-1 text, offsets being byte offsets. */
export interface ByteBuffer {
  length(): number;
  slice(from: number, to: number): string;
  /** The file as read from disk, for the changed marks. */
  disk(from: number, to: number): string;
  /** `fresh`: the first byte of a run typed after the caret was placed, so the run is its own undo step. */
  put(offset: number, byte: number, fresh: boolean): void;
  subscribe(fn: () => void): () => void;
}

const FORM_SIGNAL: Record<BytesForm, EditorBytesViewedForm> = {
  hex: EditorBytesViewedForm.HEX, binary: EditorBytesViewedForm.BINARY, octal: EditorBytesViewedForm.OCTAL, text: EditorBytesViewedForm.TEXT,
};

export const formOf = (path: string): BytesForm => {
  const f = editor.getSnapshot().bytesForm[path];
  return (BYTES_FORMS as readonly string[]).includes(f ?? "") ? (f as BytesForm) : "hex";
};

/** The status line's pick: the file's form changes, and the trace says so. */
export function pickBytesForm(paneId: number, path: string, form: BytesForm, size: number): void {
  if (formOf(path) === form) return;
  editor.set({ bytesForm: { ...editor.getSnapshot().bytesForm, [path]: form } });
  emitSignal(Signal.EDITOR_BYTES_VIEWED, { form: FORM_SIGNAL[form], how: EditorBytesViewedHow.SELECTOR, bytes: size }, { pane_id: paneId });
}

export function BytesView({ sessionId, path, size: diskSize, paneId, buffer, hidden }: { sessionId: string; path: string; size: number; paneId: number; buffer?: ByteBuffer; hidden?: boolean }): React.ReactElement {
  const forms = React.useSyncExternalStore(editor.subscribe, () => editor.getSnapshot().bytesForm, () => editor.getSnapshot().bytesForm);
  const form: BytesForm = (BYTES_FORMS as readonly string[]).includes(forms[path] ?? "") ? (forms[path] as BytesForm) : "hex";
  const scroller = React.useRef<HTMLDivElement>(null);
  const [view, setView] = React.useState({ top: 0, height: 600 });
  const [, setLoaded] = React.useState(0);
  const chunks = React.useRef(new Map<number, Uint8Array>());
  const asked = React.useRef(new Set<number>());
  const size = buffer ? buffer.length() : diskSize;
  /** The byte and digit under the caret (sprint 468), in a buffer's hex, binary or octal. */
  const [caret, setCaret] = React.useState<{ offset: number; digit: number } | null>(null);
  const typing = !!buffer && isDigitForm(form);
  /** A click, an arrow or a form picked places the caret: the digits typed next are a new undo step. */
  const fresh = React.useRef(true);
  React.useEffect(() => { fresh.current = true; }, [form]);

  // A new file: the cache and the scroll start over, and its opening is recorded once.
  React.useEffect(() => {
    chunks.current.clear(); asked.current.clear();
    if (scroller.current) scroller.current.scrollTop = 0;
    setView((v) => ({ ...v, top: 0 }));
    setCaret(buffer ? { offset: 0, digit: 0 } : null);
    emitSignal(Signal.EDITOR_BYTES_VIEWED, { form: FORM_SIGNAL[formOf(path)], how: EditorBytesViewedHow.OPEN, bytes: diskSize }, { pane_id: paneId });
  }, [sessionId, path]);
  // The buffer's edits, from here or from the code, redraw the rows.
  React.useEffect(() => (buffer ? buffer.subscribe(() => setLoaded((n) => n + 1)) : undefined), [buffer]);
  // The status line names the byte under the caret while the digits are shown.
  React.useEffect(() => {
    editor.set({ bytesCaret: typing && !hidden && caret ? caret.offset : null });
  }, [typing, hidden, caret?.offset]);
  React.useEffect(() => () => editor.set({ bytesCaret: null }), []);

  React.useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => setView({ top: el.scrollTop, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const per = ROW_BYTES[form];
  const rows = Math.max(1, rowCount(form, size));
  const total = rows * ROW_HEIGHT;
  const height = Math.min(total, MAX_HEIGHT);
  const visible = Math.ceil(view.height / ROW_HEIGHT) + 1;
  const scaled = total > MAX_HEIGHT;
  const first = scaled
    ? Math.min(rows - 1, Math.round((view.top / Math.max(1, height - view.height)) * Math.max(0, rows - visible)))
    : Math.floor(view.top / ROW_HEIGHT);
  const last = Math.min(rows - 1, first + visible);

  // The pieces the rows in sight need, read once each; the oldest dropped past KEEP. A buffer needs none.
  React.useEffect(() => {
    if (buffer) return;
    const from = Math.floor((first * per) / CHUNK), to = Math.floor(Math.min(size - 1, (last + 1) * per - 1) / CHUNK);
    for (let c = from; c <= Math.max(from, to); c++) {
      if (chunks.current.has(c) || asked.current.has(c) || c * CHUNK >= Math.max(size, 1)) continue;
      asked.current.add(c);
      const q = `path=${encodeURIComponent(path)}&offset=${c * CHUNK}&length=${CHUNK}`;
      fetch(`/api/session/${encodeURIComponent(sessionId)}/bytes?${q}`)
        .then((r) => (r.ok ? (r.json() as Promise<{ data: string }>) : null))
        .then((out) => {
          asked.current.delete(c);
          if (!out) return;
          const bin = atob(out.data), bytes = new Uint8Array(bin.length);
          for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
          chunks.current.set(c, bytes);
          while (chunks.current.size > KEEP) chunks.current.delete(chunks.current.keys().next().value as number);
          setLoaded((n) => n + 1);
        })
        .catch(() => { asked.current.delete(c); });
    }
  }, [first, last, per, path, sessionId, size, buffer]);

  const rowBytes = (r: number): Uint8Array | null => {
    const start = r * per, end = Math.min(size, start + per), out = new Uint8Array(end - start);
    if (buffer) {
      const text = buffer.slice(start, end);
      for (let k = 0; k < text.length; k++) out[k] = text.charCodeAt(k) & 0xff;
      return out;
    }
    for (let at = start; at < end; at++) {
      const piece = chunks.current.get(Math.floor(at / CHUNK));
      if (!piece) return null;
      out[at - start] = piece[at % CHUNK];
    }
    return out;
  };

  /** The caret to (offset, digit), kept in the file, and its row brought into view. */
  const moveTo = (offset: number, digit: number, typed = false) => {
    if (!typed) fresh.current = true;
    const at = Math.max(0, Math.min(size - 1, offset));
    setCaret({ offset: at, digit: at === offset ? digit : 0 });
    const el = scroller.current;
    if (!el || scaled) return;
    const top = Math.floor(at / per) * ROW_HEIGHT;
    if (top < el.scrollTop) el.scrollTop = top;
    else if (top + ROW_HEIGHT > el.scrollTop + el.clientHeight) el.scrollTop = top + ROW_HEIGHT - el.clientHeight;
  };
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!typing || !caret || !buffer || e.metaKey || e.ctrlKey || e.altKey || !isDigitForm(form)) return;
    const n = DIGITS[form], { offset, digit } = caret;
    const right = (typed = false) => (digit < n - 1 ? moveTo(offset, digit + 1, typed) : offset < size - 1 ? moveTo(offset + 1, 0, typed) : undefined);
    if (e.key === "ArrowLeft") digit > 0 ? moveTo(offset, digit - 1) : offset > 0 ? moveTo(offset - 1, n - 1) : undefined;
    else if (e.key === "ArrowRight") right();
    else if (e.key === "ArrowUp") { if (offset >= per) moveTo(offset - per, digit); }
    else if (e.key === "ArrowDown") { if (offset + per < size) moveTo(offset + per, digit); }
    else if (e.key === "Home") moveTo(offset - (offset % per), 0);
    else if (e.key === "End") moveTo(Math.min(size - 1, offset - (offset % per) + per - 1), n - 1);
    else if (e.key.length === 1) {
      const byte = buffer.slice(offset, offset + 1).charCodeAt(0) & 0xff;
      const next = typeDigit(form, byte, digit, e.key);
      if (next !== null) {
        if (next !== byte) { buffer.put(offset, next, fresh.current); fresh.current = false; }
        right(true);
      }
    } else return;
    e.preventDefault();
  };
  /** A row, in a buffer's digit forms each byte its own span (the caret's digit lit, a changed byte in the accent);
   *  the row's text is `bytesRow`'s either way. */
  const rowNodes = (r: number, bytes: Uint8Array): React.ReactNode => {
    const text = bytesRow(form, r * per, bytes);
    if (!typing || !buffer || !isDigitForm(form)) return text;
    const n = DIGITS[form], disk = buffer.disk(r * per, r * per + bytes.length), out: React.ReactNode[] = [];
    let at = 0;
    for (let k = 0; k < bytes.length; k++) {
      const col = digitColumn(form, k, 0), offset = r * per + k, cell = text.slice(col, col + n);
      const changed = k >= disk.length || (disk.charCodeAt(k) & 0xff) !== bytes[k];
      const lit = caret && caret.offset === offset && !hidden ? caret.digit : -1;
      out.push(text.slice(at, col));
      out.push(
        <span key={k} data-byte={offset} data-changed={changed ? "1" : undefined}
          onMouseDown={(e) => {
            const box = e.currentTarget.getBoundingClientRect();
            moveTo(offset, Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - box.left) / box.width) * n))));
            scroller.current?.focus();
            e.preventDefault();
          }}
          style={{ color: changed ? ACCENT : undefined, cursor: "text" }}>
          {lit < 0 ? cell : <>{cell.slice(0, lit)}<span data-bytes-caret={lit} style={{ background: ACCENT, color: "#1a1c20" }}>{cell[lit]}</span>{cell.slice(lit + 1)}</>}
        </span>,
      );
      at = col + n;
    }
    out.push(text.slice(at));
    return out;
  };

  const lines: React.ReactNode[] = [];
  for (let r = first; r <= last; r++) {
    const bytes = rowBytes(r);
    lines.push(<div key={r} data-bytes-row={r} style={{ height: ROW_HEIGHT, whiteSpace: "pre", color: bytes ? "#d7dade" : "#4a4e55" }}>{bytes ? rowNodes(r, bytes) : "…"}</div>);
  }
  return (
    <div ref={scroller} data-bytes-view={path} data-bytes-form={form} data-bytes-rows={rows} data-bytes-editable={typing ? "1" : "0"} tabIndex={typing ? 0 : undefined} onKeyDown={onKey}
      onScroll={(e) => setView({ top: e.currentTarget.scrollTop, height: e.currentTarget.clientHeight })}
      style={{ position: "absolute", inset: 0, overflow: "auto", outline: "none", display: hidden ? "none" : "block", fontFamily: "ui-monospace,'SF Mono',Menlo,Consolas,monospace", fontSize: 13, lineHeight: `${ROW_HEIGHT}px` }}>
      <div style={{ height, position: "relative" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: scaled ? view.top : first * ROW_HEIGHT, padding: "0 20px" }}>{lines}</div>
      </div>
    </div>
  );
}
