// UnboundPanePicker.tsx — the D66f workspace picker rendered inside an
// unbound pane. Text input + walked history from ~/.substrate/recent-workspaces.json.

import { useEffect, useRef, useState } from "react";
import { Pane, WorkspaceShape } from "@/state/ShellState";
import { readRecentWorkspaces, RecentWorkspace } from "@/state/RecentWorkspaces";
import { listSessions, ManifestRow } from "@/state/Sessions";

interface Props {
  pane: Pane;
  onText: (paneId: string, text: string) => void;
  onWalk: (paneId: string, index: number, path: string, shape: WorkspaceShape) => void;
  onCommit: (paneId: string, path: string, shape: WorkspaceShape) => void;
  onResume: (paneId: string, sessionId: string) => void;
}

export function UnboundPanePicker({ pane, onText, onWalk, onCommit, onResume }: Props): JSX.Element {
  const [rows, setRows] = useState<RecentWorkspace[]>([]);
  const [sessions, setSessions] = useState<ManifestRow[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    readRecentWorkspaces().then(setRows).catch(() => setRows([]));
    listSessions().then((rows) =>
      setSessions(rows.filter((r) => r.status !== "ended"))
    ).catch(() => setSessions([]));
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const walk = (nextIndex: number): void => {
    if (rows.length === 0) return;
    const clamped = ((nextIndex % rows.length) + rows.length) % rows.length;
    const row = rows[clamped];
    onWalk(pane.id, clamped, row.path, row.shape);
  };

  const commit = (): void => {
    const path = pane.pickerText.trim();
    if (!path) return;
    const shape: WorkspaceShape = pane.pickerSelection?.shape ?? "flat";
    onCommit(pane.id, path, shape);
  };

  return (
    <div data-testid={`unbound-picker-${pane.id}`} style={{ padding: 8, fontSize: 12 }}>
      <div className="label" style={{ color: "#5f636b", marginBottom: 6 }}>
        New session workspace:
      </div>
      <input
        ref={inputRef}
        data-testid={`unbound-picker-input-${pane.id}`}
        value={pane.pickerText}
        onChange={(e) => onText(pane.id, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp")   { e.preventDefault(); walk(pane.pickerIndex - 1); }
          else if (e.key === "ArrowDown") { e.preventDefault(); walk(pane.pickerIndex + 1); }
          else if (e.key === "Enter")     { e.preventDefault(); commit(); }
        }}
        placeholder="/path/to/workspace"
        style={{
          width: "100%", padding: "4px 6px", border: "1px solid #2a2d33",
          background: "#1c1e22", color: "#b9bec5", fontFamily: "inherit", fontSize: "inherit",
        }}
      />
      {rows.length > 0 && (
        <div data-testid={`unbound-picker-list-${pane.id}`} style={{ marginTop: 6 }}>
          {rows.map((r, i) => (
            <div
              key={r.path}
              data-active={i === pane.pickerIndex ? "true" : "false"}
              style={{
                padding: "2px 6px",
                background: i === pane.pickerIndex ? "#252830" : "transparent",
                color: i === pane.pickerIndex ? "#e2e5e9" : "#8a8f96",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}
            >
              <span className="label">{r.path} <span style={{ color: "#5f636b" }}>· {r.shape}</span></span>
            </div>
          ))}
        </div>
      )}
      {rows.length === 0 && (
        <div className="label" style={{ marginTop: 6, color: "#5f636b" }}>
          No recent workspaces yet. Type a path.
        </div>
      )}
      {sessions.length > 0 && (
        <>
          <div className="label" style={{ color: "#5f636b", marginTop: 12, marginBottom: 4 }}>
            Or resume:
          </div>
          <div data-testid={`unbound-picker-resume-${pane.id}`}>
            {sessions.map((s) => (
              <div
                key={s.session_id}
                data-testid={`resume-row-${s.session_id}`}
                onClick={() => onResume(pane.id, s.session_id)}
                style={{
                  padding: "2px 6px", cursor: "pointer",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#8a8f96",
                }}
              >
                <span className="label">{s.name ?? s.session_id.slice(0, 8)} <span style={{ color: "#5f636b" }}>· {s.status} · {s.workspace}</span></span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
