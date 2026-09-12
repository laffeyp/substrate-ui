// src/render/StudioSurface.tsx — Sprint 027.
//
// Studio authors a topology draft — a name plus producer/view/trigger/
// route counts. Layer 2 STUDIO_VIEW_TOGGLED's enum is {form, canvas},
// not a four-section switcher; the sprint card's "four sections" reads
// off the vocabulary. Under v0.1 the form editor is the only live view;
// canvas is a placeholder that toggles the mode signal for Layer 5.
//
// Edits within the form are silent (Layer 1 review §Studio-
// decomposition — the observation is the validate/build round-trip,
// not the keystroke). Validate + Build both round-trip through the
// bridge and emit REQUESTED / VALIDATED|FAILED and REQUESTED /
// BUILT|REJECTED per Layer 2's payload set.

import type { Pane as PaneModel } from "@/state/ShellState";
import { StudioView } from "@/observability/reasons";

interface DraftFields {
  topoName: string;
  producerCount: number;
  viewCount: number;
  triggerCount: number;
  routeCount: number;
}

interface Props {
  pane: PaneModel;
  onDraftSet: (paneId: string, draft: Partial<DraftFields>) => void;
  onViewToggle: (paneId: string) => void;
  onValidate: (paneId: string, draft: DraftFields) => void;
  onBuild: (paneId: string, topoName: string) => void;
  onClose: (paneId: string) => void;
}

const rowStyle: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "120px 1fr", gap: 6,
  alignItems: "center", marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  background: "#0f1114", color: "#e2e5e9",
  border: "1px solid #2a2d33", borderRadius: 3,
  padding: "3px 6px", fontFamily: "inherit", fontSize: 12,
  outline: "none",
};

const btn = (kind: "primary" | "secondary"): React.CSSProperties => ({
  padding: "4px 10px", borderRadius: 3, fontSize: 12,
  background: kind === "primary" ? "#3b6ea5" : "#252830",
  color: kind === "primary" ? "#ffffff" : "#b9bec5",
  border: "none", cursor: "pointer",
});

export function StudioSurface({
  pane, onDraftSet, onViewToggle, onValidate, onBuild, onClose,
}: Props): JSX.Element {
  const d = pane.studioDraft;
  return (
    <div
      data-testid={`surface-studio-${pane.id}`}
      data-studio-view={pane.studioView}
      onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onClose(pane.id); } }}
      tabIndex={0}
      style={{
        position: "absolute", inset: "40px 6px 6px 6px",
        background: "#1a1c20", border: "1px solid #2a2d33", borderRadius: 4,
        padding: 12, overflow: "auto",
        fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
        fontSize: 12, color: "#b9bec5", outline: "none", zIndex: 15,
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <span className="label" style={{ color: "#5f636b" }}>studio ·</span>
        <span
          data-testid={`studio-view-tab-form-${pane.id}`}
          data-active={pane.studioView === StudioView.FORM ? "true" : "false"}
          onClick={() => { if (pane.studioView !== StudioView.FORM) onViewToggle(pane.id); }}
          style={{ ...btn(pane.studioView === StudioView.FORM ? "primary" : "secondary"),
            padding: "2px 8px", fontSize: 11 }}
        >
          <span className="label">form</span>
        </span>
        <span
          data-testid={`studio-view-tab-canvas-${pane.id}`}
          data-active={pane.studioView === StudioView.CANVAS ? "true" : "false"}
          onClick={() => { if (pane.studioView !== StudioView.CANVAS) onViewToggle(pane.id); }}
          style={{ ...btn(pane.studioView === StudioView.CANVAS ? "primary" : "secondary"),
            padding: "2px 8px", fontSize: 11 }}
        >
          <span className="label">canvas</span>
        </span>
        <span style={{ flex: 1 }} />
        <span className="label" style={{ color: "#5f636b" }}>Esc close</span>
      </div>

      {pane.studioView === StudioView.FORM ? (
        <div>
          <div style={rowStyle}>
            <span className="label" style={{ color: "#8a8f96" }}>topo_name</span>
            <input
              data-testid={`studio-input-topo-name-${pane.id}`}
              style={inputStyle}
              value={d.topoName}
              onChange={(e) => onDraftSet(pane.id, { topoName: e.target.value })}
              placeholder="lowercase_with_underscores"
            />
          </div>
          {(["producerCount", "viewCount", "triggerCount", "routeCount"] as const).map((k) => (
            <div style={rowStyle} key={k}>
              <span className="label" style={{ color: "#8a8f96" }}>{k}</span>
              <input
                data-testid={`studio-input-${k}-${pane.id}`}
                style={inputStyle}
                type="number"
                min={k === "producerCount" ? 1 : 0}
                value={d[k]}
                onChange={(e) => onDraftSet(pane.id, { [k]: Number(e.target.value) || 0 })}
              />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <span
              data-testid={`studio-validate-${pane.id}`}
              onClick={() => onValidate(pane.id, d)}
              style={btn("secondary")}
            >
              <span className="label">validate</span>
            </span>
            <span
              data-testid={`studio-build-${pane.id}`}
              onClick={() => onBuild(pane.id, d.topoName)}
              style={btn("primary")}
            >
              <span className="label">build</span>
            </span>
          </div>
        </div>
      ) : (
        <div
          data-testid={`studio-canvas-${pane.id}`}
          style={{ color: "#5f636b", padding: 8 }}
        >
          canvas view — visualization of the topology graph will land in a later widening sprint
        </div>
      )}
    </div>
  );
}
