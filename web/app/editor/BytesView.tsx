// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A file that is not text, shown as its bytes (sprint 463; roadmap r13 E14; the Architect, 2026-11-11: "You show what
// every file is"; "you just open a file … they could just scroll down and see the whole file"). Read-only, at any size:
// the view draws only the rows in sight and reads the bytes behind them from the server in 64 KB pieces
// (GET …/bytes, FILE_BYTES_READ), keeping the last 64 pieces. A file whose rows outgrow the browser's tallest scroll
// area is scaled to it: the scroll position stands for a row, not a pixel. The form (hex, binary, octal, text) is
// picked in the status line and kept per file in the editor store; each opening and each pick is one
// EDITOR_BYTES_VIEWED. The rows are `derive/bytes.ts`'s.

import * as React from "react";
import { editor } from "../state/editor";
import { BYTES_FORMS, bytesRow, ROW_BYTES, rowCount, type BytesForm } from "../derive/bytes";
import { emit as emitSignal } from "../../vm/instrumentation/sdd";
import { EditorBytesViewedForm, EditorBytesViewedHow, Signal } from "../../vm/signals.gen";

const ROW_HEIGHT = 20;
const CHUNK = 64 * 1024;
const KEEP = 64;
/** Under the tallest element Chromium draws (about 33.5 million pixels); past it the scroll area is scaled. */
const MAX_HEIGHT = 8_000_000;

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

export function BytesView({ sessionId, path, size, paneId }: { sessionId: string; path: string; size: number; paneId: number }): React.ReactElement {
  const forms = React.useSyncExternalStore(editor.subscribe, () => editor.getSnapshot().bytesForm, () => editor.getSnapshot().bytesForm);
  const form: BytesForm = (BYTES_FORMS as readonly string[]).includes(forms[path] ?? "") ? (forms[path] as BytesForm) : "hex";
  const scroller = React.useRef<HTMLDivElement>(null);
  const [view, setView] = React.useState({ top: 0, height: 600 });
  const [, setLoaded] = React.useState(0);
  const chunks = React.useRef(new Map<number, Uint8Array>());
  const asked = React.useRef(new Set<number>());

  // A new file: the cache and the scroll start over, and its opening is recorded once.
  React.useEffect(() => {
    chunks.current.clear(); asked.current.clear();
    if (scroller.current) scroller.current.scrollTop = 0;
    setView((v) => ({ ...v, top: 0 }));
    emitSignal(Signal.EDITOR_BYTES_VIEWED, { form: FORM_SIGNAL[formOf(path)], how: EditorBytesViewedHow.OPEN, bytes: size }, { pane_id: paneId });
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

  // The pieces the rows in sight need, read once each; the oldest dropped past KEEP.
  React.useEffect(() => {
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
  }, [first, last, per, path, sessionId, size]);

  const rowBytes = (r: number): Uint8Array | null => {
    const start = r * per, end = Math.min(size, start + per), out = new Uint8Array(end - start);
    for (let at = start; at < end; at++) {
      const piece = chunks.current.get(Math.floor(at / CHUNK));
      if (!piece) return null;
      out[at - start] = piece[at % CHUNK];
    }
    return out;
  };

  const lines: React.ReactNode[] = [];
  for (let r = first; r <= last; r++) {
    const bytes = rowBytes(r);
    lines.push(<div key={r} data-bytes-row={r} style={{ height: ROW_HEIGHT, whiteSpace: "pre", color: bytes ? "#d7dade" : "#4a4e55" }}>{bytes ? bytesRow(form, r * per, bytes) : "…"}</div>);
  }
  return (
    <div ref={scroller} data-bytes-view={path} data-bytes-form={form} data-bytes-rows={rows} onScroll={(e) => setView({ top: e.currentTarget.scrollTop, height: e.currentTarget.clientHeight })}
      style={{ position: "absolute", inset: 0, overflow: "auto", fontFamily: "ui-monospace,'SF Mono',Menlo,Consolas,monospace", fontSize: 13, lineHeight: `${ROW_HEIGHT}px` }}>
      <div style={{ height, position: "relative" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: scaled ? view.top : first * ROW_HEIGHT, padding: "0 20px" }}>{lines}</div>
      </div>
    </div>
  );
}
