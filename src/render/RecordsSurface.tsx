// src/render/RecordsSurface.tsx — Sprint 025.
//
// The Records surface lists every session under ~/.substrate/sessions/
// as {name, status, workspace, last touched}. Enter on a row primes
// Sprint 009's resume flow via onResume(sessionId). Escape closes the
// surface (routed by App.tsx to SURFACE_CLOSE). The surface is
// pane-scoped — mounts inside the pane body when pane.surface.kind ===
// SurfaceKind.RECORDS.

import { useEffect, useRef, useState } from "react";
import { listSessions, ManifestRow } from "@/state/Sessions";

interface Props {
  paneId: string;
  onResume: (sessionId: string) => void;
  onClose: () => void;
}

export function RecordsSurface({ paneId, onResume, onClose }: Props): JSX.Element {
  const [rows, setRows] = useState<ManifestRow[]>([]);
  const [cursor, setCursor] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listSessions()
      .then((all) => setRows(all.sort((a, b) => (b.record_root < a.record_root ? -1 : 1))))
      .catch(() => setRows([]));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.focus();
    const handler = (e: KeyboardEvent): void => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => (rows.length ? (c + 1) % rows.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => (rows.length ? (c - 1 + rows.length) % rows.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const r = rows[cursor];
        if (r) onResume(r.session_id);
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [rows, cursor, onResume, onClose]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      data-testid={`surface-records-${paneId}`}
      style={{
        position: "absolute", inset: "40px 6px 6px 6px",
        background: "#1a1c20", border: "1px solid #2a2d33", borderRadius: 4,
        padding: 10, overflow: "auto",
        fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
        fontSize: 12, color: "#b9bec5", outline: "none", zIndex: 15,
      }}
    >
      <div className="label" style={{ color: "#5f636b", marginBottom: 6 }}>
        records — {rows.length} sessions · ↑↓ walk · Enter resume · Esc close
      </div>
      {rows.length === 0 ? (
        <div style={{ color: "#5f636b", padding: 4 }}>no sessions on disk</div>
      ) : (
        rows.map((r, i) => (
          <div
            key={r.session_id}
            data-testid={`records-row-${paneId}-${r.session_id}`}
            data-active={i === cursor ? "true" : "false"}
            data-status={r.status}
            onClick={() => setCursor(i)}
            onDoubleClick={() => onResume(r.session_id)}
            style={{
              padding: "3px 6px",
              background: i === cursor ? "#2a2d33" : "transparent",
              borderRadius: 2, cursor: "pointer",
              display: "flex", gap: 8, alignItems: "center",
            }}
          >
            <span className="label" style={{ color: "#e2e5e9", minWidth: 100 }}>
              {r.name ?? r.session_id.slice(0, 8)}
            </span>
            <span className="label" style={{ color: "#8a8f96", minWidth: 60 }}>{r.status}</span>
            <span style={{ color: "#5f636b", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.workspace}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
