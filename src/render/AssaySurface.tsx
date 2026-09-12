// src/render/AssaySurface.tsx — Sprint 026.
//
// The assay surface renders a grid over records by topology + trial +
// score. The drill-in path (ASSAY_ARM_INSPECTED / ASSAY_CELL_OPENED) is
// deferred to v0.2 per signals/0.1.json § Layer 1 review §6 defer
// note; Sprint 026 ships the grid mount + open/close pair.
//
// Under v0.1 the bridge's list_assays returns an empty list, so the
// surface renders the "no assays yet" empty state. A later widening
// sprint wires substrate.assay.report against session_registry to
// project real rows here.

import { useEffect, useRef, useState } from "react";
import { listAssays, AssayRow } from "@/state/Assays";

interface Props {
  paneId: string;
  onClose: () => void;
}

export function AssaySurface({ paneId, onClose }: Props): JSX.Element {
  const [rows, setRows] = useState<AssayRow[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listAssays().then(setRows).catch(() => setRows([]));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.focus();
    const handler = (e: KeyboardEvent): void => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      data-testid={`surface-assay-${paneId}`}
      data-rows={String(rows.length)}
      style={{
        position: "absolute", inset: "40px 6px 6px 6px",
        background: "#1a1c20", border: "1px solid #2a2d33", borderRadius: 4,
        padding: 10, overflow: "auto",
        fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
        fontSize: 12, color: "#b9bec5", outline: "none", zIndex: 15,
      }}
    >
      <div className="label" style={{ color: "#5f636b", marginBottom: 6 }}>
        assay — {rows.length} rows · Esc close
      </div>
      {rows.length === 0 ? (
        <div style={{ color: "#5f636b", padding: 4 }}>
          no assays yet (drill-in deferred to v0.2)
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 2fr", gap: 4 }}>
          <div className="label" style={{ color: "#5f636b" }}>topology</div>
          <div className="label" style={{ color: "#5f636b" }}>trial</div>
          <div className="label" style={{ color: "#5f636b" }}>score</div>
          <div className="label" style={{ color: "#5f636b" }}>record</div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "contents" }}>
              <span className="label" style={{ color: "#e2e5e9" }}>{r.topology}</span>
              <span className="label" style={{ color: "#8a8f96" }}>{r.trial}</span>
              <span className="label" style={{ color: "#a7c893" }}>{r.score ?? "-"}</span>
              <span style={{ color: "#5f636b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.record_root}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
